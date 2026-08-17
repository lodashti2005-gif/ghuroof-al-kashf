/**
 * Model call + SSE parsing for the interrogation server function.
 *
 * These helpers live in a separate `*.server.ts` module because TanStack's
 * server-function splitting removes module-scope siblings from
 * `*.functions.ts` files, which made them undefined at runtime.
 */
import { SUSPECT_STATES, type SuspectState } from "@/game/types";

export interface AiReply {
  text: string;
  stressDelta: number;
  state: SuspectState;
  unlock: string | null;
  /** Which reveal level the answer came from (1-4) — used for UI/debug only. */
  level: number;
  /** true لمن كلام المشتبه ما يركب مع دليل مكتشف — تنبيه للاعب بدون كشف الحل. */
  contradiction: boolean;
  /** تفاصيل التناقض المرصود بعد التحقق منه سيرفر-سايد (null لو ما فيه). */
  contradictionNote?: {
    claim: string;
    conflictsWith: string;
    source: "statement" | "evidence" | "timeline";
    evidenceId?: string;
  } | null;
}

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    text: { type: "string", description: "رد المشتبه باللهجة الكويتية، من جملة إلى ثلاث جمل قصيرة" },
    stressDelta: { type: "number", description: "تغير التوتر من -5 إلى 20" },
    state: { type: "string", enum: [...SUSPECT_STATES] },
    level: { type: "integer", description: "مستوى المعلومة المكشوفة 1-4" },
    contradiction: {
      type: "boolean",
      description: "true إذا رد المشتبه يخالف دليل مكتشف أو أقواله السابقة أو جدول القضية",
    },
    contradictionClaim: {
      type: ["string", "null"],
      description: "قول المشتبه فيه المتناقض (اقتباس مختصر من ردك الحالي)، وإلا null",
    },
    contradictionAgainst: {
      type: ["string", "null"],
      description:
        "القول السابق الحرفي للمشتبه فيه أو حقيقة القضية اللي يخالفها (اقتباس فعلي مو تلخيص)، وإلا null",
    },
    contradictionSource: {
      type: ["string", "null"],
      enum: ["statement", "evidence", "timeline", null],
      description: "مصدر التعارض: قول سابق، دليل مكتشف، أو جدول القضية",
    },
    contradictionEvidenceId: {
      type: ["string", "null"],
      description: "معرّف الدليل المكتشف المتعارض إذا كان المصدر evidence، وإلا null",
    },
    unlock: {
      type: ["string", "null"],
      description: "معرّف الدليل الجديد إذا كشف الرد معلومة تفتح دليل، وإلا null",
    },
  },
  required: [
    "text",
    "stressDelta",
    "state",
    "level",
    "unlock",
    "contradiction",
    "contradictionClaim",
    "contradictionAgainst",
    "contradictionSource",
    "contradictionEvidenceId",
  ],
} as const;

export interface RawNote {
  claim: string;
  conflictsWith: string;
  source: string;
  evidenceId?: string;
}

export function clamp(n: number, min: number, max: number) {
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : 0;
}

export async function callModel({
  system,
  user,
  profile,
}: {
  system: string;
  user: string;
  profile: { unlockTriggers: { evidenceId: string }[] };
}): Promise<(AiReply & { rawNote: RawNote }) | null> {
  const apiKey = process.env["LOVABLE_API_KEY"]!;
  // مهلة صارمة للنموذج حتى ما تعلق شاشة التحقيق.
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    signal: AbortSignal.timeout(50_000),
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

  const loose = parsed as Record<string, unknown>;
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
    contradiction: parsed.contradiction === true,
    rawNote: {
      claim: String(loose["contradictionClaim"] ?? ""),
      conflictsWith: String(loose["contradictionAgainst"] ?? ""),
      source: String(loose["contradictionSource"] ?? "statement"),
      ...(loose["contradictionEvidenceId"]
        ? { evidenceId: String(loose["contradictionEvidenceId"]) }
        : {}),
    },
  };
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
