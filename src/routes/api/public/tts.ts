/**
 * ElevenLabs text-to-speech endpoint for the interrogation room.
 *
 * The API key stays server-side; the browser only sends the suspect id, the
 * line to speak and the emotional state. Audio is streamed straight back as
 * mp3 so playback starts as fast as possible on phones and tablets.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { SUSPECT_STATES } from "@/game/types";
import { resolveVoiceSettings, shapeForSpeech } from "@/game/voices";

const bodySchema = z.object({
  suspectId: z.string().max(40),
  text: z.string().min(1).max(900),
  state: z.enum(SUSPECT_STATES).default("calm"),
  stress: z.number().min(0).max(100).default(0),
});

export const Route = createFileRoute("/api/public/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["ELEVENLABS_API_KEY"];
        if (!apiKey) {
          return Response.json({ error: "voice_not_configured" }, { status: 503 });
        }

        let parsed: z.infer<typeof bodySchema>;
        try {
          parsed = bodySchema.parse(await request.json());
        } catch {
          return Response.json({ error: "bad_request" }, { status: 400 });
        }

        const { voiceId, settings } = resolveVoiceSettings(
          parsed.suspectId,
          parsed.state,
          parsed.stress,
        );

        const res = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`,
          {
            method: "POST",
            headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              text: shapeForSpeech(parsed.text, parsed.state),
              model_id: "eleven_multilingual_v2",
              language_code: "ar",
              voice_settings: settings,
            }),
          },
        );

        if (!res.ok || !res.body) {
          const detail = await res.text().catch(() => "");
          console.error(`ElevenLabs TTS failed [${res.status}]: ${detail}`);
          return Response.json({ error: "tts_failed", status: res.status }, { status: 502 });
        }

        return new Response(res.body, {
          headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
