/**
 * ElevenLabs text-to-speech endpoint for the interrogation room.
 *
 * The API key stays server-side; the browser only sends the suspect id, the
 * line to speak and the emotional state. Audio is streamed straight back as
 * mp3 so playback starts as fast as possible on phones and tablets.
 *
 * No browser-speech fallback: if ElevenLabs fails we surface the provider's
 * exact status and error body so the problem is visible instead of hidden.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { SUSPECT_STATES } from "@/game/types";
import { HASAN_VOICE_ID, resolveVoiceSettings, shapeForSpeech } from "@/game/voices";

const bodySchema = z.object({
  suspectId: z.string().max(40),
  text: z.string().min(1).max(900),
  state: z.enum(SUSPECT_STATES).default("calm"),
  stress: z.number().min(0).max(100).default(0),
});

/** v3 is the most expressive multilingual model; v2 is the stable fallback. */
const MODELS = ["eleven_v3", "eleven_multilingual_v2"] as const;

/** eleven_v3 only accepts discrete stability values. */
const quantize = (s: number) => (s < 0.34 ? 0 : s < 0.67 ? 0.5 : 1);

export const Route = createFileRoute("/api/public/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // نستخدم الاتصال الأحدث (Wara Al Salfa 2) أولاً، والمفاتيح الأقدم
        // تبقى كاحتياط فقط في حال عدم توفر الجديد.
        const apiKey =
          process.env["ELEVENLABS_API_KEY_2"] ??
          process.env["ELEVENLABS_API_KEY_1"] ??
          process.env["ELEVENLABS_API_KEY"];
        if (!apiKey) {
          return Response.json(
            { error: "voice_not_configured", message: "ELEVENLABS_API_KEY غير موجود على السيرفر" },
            { status: 503 },
          );
        }

        let parsed: z.infer<typeof bodySchema>;
        try {
          parsed = bodySchema.parse(await request.json());
        } catch {
          return Response.json({ error: "bad_request" }, { status: 400 });
        }

        const { settings } = resolveVoiceSettings(
          parsed.suspectId,
          parsed.state,
          parsed.stress,
        );
        // صوت Hasan هو الأساس. صوت George مضمّن كاحتياط فقط إذا رفض
        // ElevenLabs صوت المكتبة (خطة مجانية) حتى لا يبقى التحقيق بلا صوت.
        const FALLBACK_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";
        const voiceIds = [HASAN_VOICE_ID, FALLBACK_VOICE_ID];
        const text = shapeForSpeech(parsed.text, parsed.state);

        let lastStatus = 0;
        let lastDetail = "network_error";

        outer: for (const voiceId of voiceIds) {
          for (const model of MODELS) {
            const voice_settings =
              model === "eleven_v3"
                ? {
                    stability: quantize(settings.stability),
                    similarity_boost: settings.similarity_boost,
                    style: settings.style,
                    use_speaker_boost: true,
                  }
                : settings;

            const res = await fetch(
              `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`,
              {
                method: "POST",
                headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
                body: JSON.stringify({ text, model_id: model, voice_settings }),
              },
            ).catch((error: unknown) => {
              console.error("ElevenLabs TTS request failed", error);
              return null;
            });

            if (res?.ok && res.body) {
              return new Response(res.body, {
                headers: {
                  "Content-Type": "audio/mpeg",
                  "Cache-Control": "no-store",
                  "X-Voice-Model": model,
                  "X-Voice-Id": voiceId,
                },
              });
            }

            lastStatus = res?.status ?? 0;
            lastDetail = res ? await res.text().catch(() => "") : "network_error";
            console.error(
              `ElevenLabs TTS failed [${lastStatus}] voice=${voiceId} model=${model}: ${lastDetail}`,
            );
            // مشاكل المفتاح أو الصلاحيات لا تتحسن بتغيير الموديل أو الصوت.
            if (lastStatus === 401 || lastStatus === 403) break outer;
            // الصوت غير متاح للخطة: جرّب الصوت الاحتياطي مباشرة.
            if (lastStatus === 402) continue outer;
          }
        }

        // نرجع 200 مع تفاصيل الخطأ الحقيقية: الصوت اختياري، والمحادثة النصية
        // ما يجب أن تُسقطها حدود الأخطاء أو تظهر كخطأ 502 في الواجهة.
        return Response.json(
          { error: "elevenlabs_failed", status: lastStatus, detail: lastDetail },
          { status: 200, headers: { "Cache-Control": "no-store" } },
        );

      },
    },
  },
});
