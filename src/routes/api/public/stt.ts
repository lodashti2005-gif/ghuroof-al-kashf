/**
 * Speech-to-text endpoint for the interrogation room.
 *
 * The browser records one complete audio file (per question) and posts it here;
 * the Lovable AI key stays server-side. Buffered (non-streaming) response so the
 * client gets a single question string ready to send to the suspect.
 */
import { createFileRoute } from "@tanstack/react-router";

const MAX_BYTES = 20 * 1024 * 1024;

export const Route = createFileRoute("/api/public/stt")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return Response.json(
            { error: "stt_not_configured", message: "خدمة تحويل الصوت غير متوفرة" },
            { status: 503 },
          );
        }

        const form = await request.formData().catch(() => null);
        const file = form?.get("file");
        if (!(file instanceof File) || file.size === 0) {
          return Response.json({ error: "bad_request", message: "ما وصل تسجيل" }, { status: 400 });
        }
        if (file.size > MAX_BYTES) {
          return Response.json({ error: "too_large", message: "التسجيل طويل مرة" }, { status: 413 });
        }

        const type = file.type.split(";")[0] ?? "";
        const ext =
          (
            {
              "audio/wav": "wav",
              "audio/wave": "wav",
              "audio/x-wav": "wav",
              "audio/webm": "webm",
              "audio/ogg": "ogg",
              "audio/mp4": "mp4",
              "audio/mpeg": "mp3",
            } as Record<string, string>
          )[type] ?? "wav";

        const upstream = new FormData();
        upstream.append("model", "openai/gpt-4o-transcribe");
        upstream.append("file", file, `question.${ext}`);
        upstream.append("language", "ar");

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: upstream,
        }).catch((error: unknown) => {
          console.error("STT request failed", error);
          return null;
        });

        if (!res?.ok) {
          const detail = res ? await res.text().catch(() => "") : "network_error";
          console.error(`STT failed [${res?.status ?? 0}]: ${detail}`);
          return Response.json(
            { error: "stt_failed", status: res?.status ?? 0, detail: detail.slice(0, 300) },
            { status: 502 },
          );
        }

        const data = (await res.json().catch(() => null)) as { text?: string } | null;
        const text = (data?.text ?? "").trim();
        if (!text) {
          return Response.json({ error: "empty_transcript" }, { status: 422 });
        }
        return Response.json({ text }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
