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
  /** لغة الواجهة — المشتبه فيه يرد بنفس اللغة اللي اختارها اللاعب. */
  lang: z.enum(["ar", "en"]).optional(),
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

    const { isLastTripEvidenceUsable } = await import("@/game/cases/last-trip-evidence");
    const { isLastTripWitnessUsable } = await import("@/game/cases/last-trip-witness-claims");

    // أدلة هذا المشتبه فيه فقط، ومن ضمن اللي انفتح فعلاً.
    const usableEvidence = data.unlockedEvidence.filter((id) =>
      isLastTripEvidenceUsable(data.suspectId, id, data.unlockedEvidence),
    );
    const evidenceId =
      data.confrontEvidenceId &&
      isLastTripEvidenceUsable(data.suspectId, data.confrontEvidenceId, data.unlockedEvidence)
        ? data.confrontEvidenceId
        : null;
    const witnessId =
      data.confrontWitnessId && isLastTripWitnessUsable(data.suspectId, data.confrontWitnessId)
        ? data.confrontWitnessId
        : null;
    const safeData = {
      ...data,
      unlockedEvidence: usableEvidence,
      confrontEvidenceId: evidenceId,
      confrontWitnessId: witnessId,
    };

    const { buildLastTripPrompt } = await import("./last-trip-interrogation-prompt.server");
    const { callModel } = await import("./interrogation-model.server");
    // نفس محرك التوتر المستخدم بقضية «الشاليه» — زيادة ثابتة ومتوقعة لكل نوع سؤال.
    const { classifyQuestion, shapeStressDelta } = await import("./stress.server");

    const built = buildLastTripPrompt(rules, safeData);
    const system =
      data.lang === "en"
        ? `${built.system}\n\nLANGUAGE: Answer only in natural, colloquial spoken English. Keep the same character, the same facts and the same short line length. Never switch to Arabic.`
        : built.system;
    const { user } = built;

    const confrontId = evidenceId || witnessId || null;
    const isCulprit = data.suspectId === LAST_TRIP_CULPRIT_ID;
    const scripted = isCulprit ? getJassimConfrontLine(confrontId) : null;

    /** التحمّل ثابت لكل شخصية: الفاعل أعلى تحمّلاً من البقية. */
    const tolerance = isCulprit ? 60 : 40;
    const linkedIds = rules.relevantEvidence ?? [];
    const profileLike = {
      evidenceFeared: isCulprit ? linkedIds : [],
      stressTolerance: tolerance,
    } as never;

    const kind = classifyQuestion({
      message: data.message,
      confrontEvidenceId: confrontId,
      profile: profileLike,
      linkedIds,
    });

    // نفس المواجهة مرة ثانية ما ترفع التوتر ولا التقدّم.
    const repeated = !!confrontId && data.confrontHistory.includes(confrontId);
    const shape = (modelDelta: number, contradiction: boolean) => {
      const delta = shapeStressDelta({
        modelDelta,
        kind,
        contradiction,
        currentStress: data.stress,
        tolerance,
      });
      return repeated ? Math.min(1, Math.max(0, delta)) : delta;
    };

    if (!process.env["LOVABLE_API_KEY"]) {
      return {
        text: scripted ?? (data.lang === "en" ? "…hold on, I didn't catch that. Say it again." : "…لحظة، ما سمعت السؤال زين. عيده علي."),
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
        stressDelta: shape(reply.stressDelta, reply.contradiction),
        contradiction: reply.contradiction,
      };
    } catch (error) {
      console.error("last-trip interrogation failed", error);
      // لازم كل سؤال يحصل رد — بدون تعليق الشاشة.
      const fallback =
        scripted ??
        (confrontId
          ? (data.lang === "en" ? "And what does that prove about me?" : "وهذا شنو يثبت علي؟")
          : rules.scriptedAnswers[0]?.answer ?? (data.lang === "en" ? "I don't know what more you want me to say." : "مادري شنو تبيني أقول أكثر."));
      return {
        text: repeated
          ? (data.lang === "en" ? `I already told you… ${fallback}` : `قلت لك… ${fallback}`)
          : fallback,
        state: "nervous",
        stressDelta: shape(scripted ? 6 : 1, false),
        contradiction: false,
      };
    }
  });
