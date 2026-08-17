/**
 * ElevenLabs text-to-speech endpoint for the interrogation room.
 *
 * The API key stays server-side; the browser only sends the suspect id, the
 * line to speak and the emotional state.
 *
 * Two shapes, same logic:
 *  - GET  (query params) → used by the <audio> element so the mp3 streams and
 *    playback starts on the first bytes, without waiting for the full file.
 *  - POST (json body)    → kept for diagnostics / non-streaming callers.
 *
 * No browser-speech fallback: if ElevenLabs fails we surface the provider's
 * exact status and error body so the problem is visible instead of hidden.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { SUSPECT_STATES } from "@/game/types";
import { HASAN_VOICE_ID, resolveVoiceSettings, shapeForSpeech } from "@/game/voices.server";

const bodySchema = z.object({
  suspectId: z.string().max(40),
  text: z.string().min(1).max(900),
  state: z.enum(SUSPECT_STATES).default("calm"),
  stress: z.coerce.number().min(0).max(100).default(0),
});

/**
 * flash v2.5 هو الأسرع (زمن استجابة منخفض جداً) ويدعم العربية، فنبدأ به حتى
 * يبدأ الصوت بأسرع وقت، ثم multilingual v2 كاحتياط.
 */
const MODELS = ["eleven_flash_v2_5", "eleven_multilingual_v2"] as const;

async function synthesize(parsed: z.infer<typeof bodySchema>): Promise<Response> {
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

  const { settings, voiceId: suspectVoiceId } = resolveVoiceSettings(
    parsed.suspectId,
    parsed.state,
    parsed.stress,
  );
  // صوت المشتبه نفسه أولاً، ثم صوت رجالي جاهز كاحتياط حتى لا يبقى
  // التحقيق بدون صوت لو رفض ElevenLabs الصوت المطلوب.
  const voiceIds = [...new Set([suspectVoiceId, HASAN_VOICE_ID])];
  const text = shapeForSpeech(parsed.text, parsed.state, parsed.suspectId);

  let lastStatus = 0;
  let lastDetail = "network_error";

  outer: for (const voiceId of voiceIds) {
    for (const model of MODELS) {
      const res = await fetch(
        // أقل حجم قطعة + بداية بث فورية = أقل تأخير ممكن قبل أول صوت.
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_64&optimize_streaming_latency=3`,
        {
          method: "POST",
          headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({ text, model_id: model, voice_settings: settings }),
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
}

export const Route = createFileRoute("/api/public/tts")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const q = new URL(request.url).searchParams;
        const raw = {
          suspectId: q.get("suspectId") ?? "",
          text: q.get("text") ?? "",
          state: q.get("state") ?? "calm",
          stress: q.get("stress") ?? 0,
        };
        const parsed = bodySchema.safeParse(raw);
        if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
        return synthesize(parsed.data);
      },
      POST: async ({ request }) => {
        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
        return synthesize(parsed.data);
      },
    },
  },
});
