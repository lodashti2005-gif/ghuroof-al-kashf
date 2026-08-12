/**
 * AI interrogation server function.
 *
 * Replaces the old keyword/scripted engine: the suspect's line, stress delta,
 * visual state and any evidence unlock all come from a real model call that
 * receives the suspect's hidden profile plus the full session transcript.
 *
 * The hidden profile lives in `*.server.ts` and is imported inside the handler,
 * so it never reaches the browser bundle.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";


import { SUSPECT_STATES, type SuspectState } from "@/game/types";

export interface AiReply {
  text: string;
  stressDelta: number;
  state: SuspectState;
  unlock: string | null;
  /** Which reveal level the answer came from (1-4) — used for UI/debug only. */
  level: number;
}

const inputSchema = z.object({
  suspectId: z.string(),
  message: z.string().max(600),
  stress: z.number().min(0).max(100),
  unlockedEvidence: z.array(z.string()).max(12),
  confrontEvidenceId: z.string().nullable().optional(),
  transcript: z
    .array(
      z.object({
        role: z.enum(["investigator", "suspect"]),
        author: z.string().max(60),
        text: z.string().max(1200),
      }),
    )
    .max(60),
});

export type InterrogationInput = z.infer<typeof inputSchema>;

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    text: { type: "string", description: "رد المشتبه باللهجة الكويتية، من جملة إلى ثلاث جمل قصيرة" },
    stressDelta: { type: "number", description: "تغير التوتر من -5 إلى 20" },
    state: { type: "string", enum: [...SUSPECT_STATES] },
    level: { type: "integer", description: "مستوى المعلومة المكشوفة 1-4" },
    unlock: {
      type: ["string", "null"],
      description: "معرّف الدليل الجديد إذا كشف الرد معلومة تفتح دليل، وإلا null",
    },
  },
  required: ["text", "stressDelta", "state", "level", "unlock"],
} as const;

export const askSuspect = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<AiReply> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    const { profiles } = await import("@/game/profiles.server");
    const profile = profiles[data.suspectId];
    if (!profile) throw new Error("unknown suspect");

    const { fallbackReply } = await import("./interrogation-fallback.server");
    if (!apiKey) return fallbackReply(profile, data);

    const { buildSuspectPrompt } = await import("./interrogation-prompt.server");
    const { system, user } = buildSuspectPrompt(profile, data);

    // Two attempts: reasoning models occasionally finish with reasoning only and
    // no answer text. A turn must never end without a spoken reply.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const reply = await callModel({ system, user, profile });
        if (reply) return reply;
      } catch (error) {
        console.error(`interrogation attempt ${attempt + 1} failed`, error);
      }
    }
    return fallbackReply(profile, data);
  });

async function callModel({
  system,
  user,
  profile,
}: {
  system: string;
  user: string;
  profile: { unlockTriggers: { evidenceId: string }[] };
}): Promise<AiReply | null> {
  const apiKey = process.env["LOVABLE_API_KEY"]!;
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-5.6-sol",
      stream: true,
      instructions: system,
      input: [{ role: "user", content: [{ type: "input_text", text: user }] }],
      text: {
        format: {
          type: "json_schema",
          name: "suspect_reply",
          strict: true,
          schema: RESPONSE_SCHEMA,
        },
      },
    }),
  });

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    console.error(`AI gateway failed [${res.status}]: ${body}`);
    return null;
  }

  const raw = await readSseText(res.body);
  let parsed: Partial<AiReply>;
  try {
    parsed = JSON.parse(raw) as Partial<AiReply>;
  } catch {
    // Sometimes the JSON is wrapped in prose; salvage the object if we can.
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end <= start) {
      console.error(`unparseable model output: ${raw.slice(0, 400)}`);
      return null;
    }
    try {
      parsed = JSON.parse(raw.slice(start, end + 1)) as Partial<AiReply>;
    } catch {
      return null;
    }
  }

  const text = String(parsed.text ?? "").trim();
  if (!text) return null;

  const unlock =
    typeof parsed.unlock === "string" &&
    profile.unlockTriggers.some((t) => t.evidenceId === parsed.unlock)
      ? parsed.unlock
      : null;

  return {
    text,
    stressDelta: clamp(Number(parsed.stressDelta ?? 0), -6, 22),
    state: (SUSPECT_STATES as readonly string[]).includes(String(parsed.state))
      ? (parsed.state as SuspectState)
      : "calm",
    unlock,
    level: clamp(Math.round(Number(parsed.level ?? 1)), 1, 4),
  };
}


function clamp(n: number, min: number, max: number) {
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : 0;
}

/** Accumulate `response.output_text.delta` events from the SSE stream. */
async function readSseText(body: ReadableStream<Uint8Array>): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let out = "";
  let completed = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload) as {
          type?: string;
          delta?: string;
          response?: { output_text?: string };
        };
        if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
          out += evt.delta;
        } else if (evt.type === "response.completed" && evt.response?.output_text) {
          completed = evt.response.output_text;
        }
      } catch {
        /* ignore keep-alives */
      }
    }
  }
  return (out.trim() || completed.trim()).trim();
}
