/**
 * استجواب «آخر رحلة» بالذكاء الاصطناعي — server function مستقلة عن قضية الشاليه.
 *
 * ملف رقيق: كل الأشياء الوقتية بملفات `.server.ts` وتُستورد داخل الـhandler
 * لأن تقسيم server functions يحذف أي شي بمستوى الموديول.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  suspectId: z.string(),
  message: z.string().min(1).max(600),
  stress: z.number().min(0).max(100),
  unlockedEvidence: z.array(z.string()).max(12),
  confrontEvidenceId: z.string().nullable().optional(),
  confrontWitnessId: z.string().nullable().optional(),
  confrontHistory: z.array(z.string()).max(24).default([]),
  contradictionCount: z.number().min(0).max(50).default(0),
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

export type LastTripAskInput = z.input<typeof inputSchema>;

export interface LastTripReply {
  text: string;
  state: string;
  stressDelta: number;
  contradiction: boolean;
}

export const askLastTripSuspect = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<LastTripReply> => {
    const { getLastTripRules, getJassimConfrontLine, LAST_TRIP_CULPRIT_ID } = await import(
      "@/game/cases/last-trip-interrogation.server"
    );
    const rules = getLastTripRules(data.suspectId);
    if (!rules) throw new Error("unknown suspect");

    const { buildLastTripPrompt } = await import("./last-trip-interrogation-prompt.server");
    const { callModel } = await import("./interrogation-model.server");

    const { system, user } = buildLastTripPrompt(rules, data);

    const confrontId = data.confrontEvidenceId || data.confrontWitnessId || null;
    const isCulprit = data.suspectId === LAST_TRIP_CULPRIT_ID;
    const scripted = isCulprit ? getJassimConfrontLine(confrontId) : null;
    // نفس المواجهة مرة ثانية ما ترفع التوتر ولا التقدّم.
    const repeated = !!confrontId && data.confrontHistory.includes(confrontId);
    const capDelta = (n: number) => (repeated ? Math.min(1, Math.max(0, n)) : n);

    if (!process.env["LOVABLE_API_KEY"]) {
      return {
        text: scripted ?? "…لحظة، ما سمعت السؤال زين. عيده علي.",
        state: "thinking",
        stressDelta: 0,
        contradiction: false,
      };
    }

    try {
      const reply = await callModel({ system, user, profile: { unlockTriggers: [] } });
      if (!reply) throw new Error("empty_reply");
      return {
        text: reply.text,
        state: reply.state,
        stressDelta: capDelta(Math.max(-5, Math.min(20, Math.round(reply.stressDelta)))),
        contradiction: reply.contradiction,
      };
    } catch (error) {
      console.error("last-trip interrogation failed", error);
      // لازم كل سؤال يحصل رد — بدون تعليق الشاشة.
      const fallback =
        scripted ??
        (confrontId
          ? "وهذا شنو يثبت علي؟"
          : rules.scriptedAnswers[0]?.answer ?? "مادري شنو تبيني أقول أكثر.");
      return {
        text: repeated ? `قلت لك… ${fallback}` : fallback,
        state: "nervous",
        stressDelta: capDelta(scripted ? 6 : 1),
        contradiction: false,
      };
    }
  });
