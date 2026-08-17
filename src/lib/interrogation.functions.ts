/**
 * AI interrogation server function.
 *
 * Thin wrapper only: TanStack's server-function splitting removes module-scope
 * runtime siblings, so the model call and helpers live in
 * `./interrogation-model.server.ts` and are imported inside the handler.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { AiReply } from "./interrogation-model.server";

export type { AiReply };

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

export const askSuspect = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<AiReply> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    const { profiles, canUnlockEvidence } = await import("@/game/profiles.server");
    const profile = profiles[data.suspectId];
    if (!profile) throw new Error("unknown suspect");
    if (!apiKey) throw new Error("ai_unavailable");

    const { buildSuspectPrompt, linkedEvidenceIds } = await import("./interrogation-prompt.server");
    const { callModel } = await import("./interrogation-model.server");
    const { classifyQuestion, shapeStressDelta } = await import("./stress.server");
    const { fallbackReply } = await import("./interrogation-fallback.server");
    const { system, user } = buildSuspectPrompt(profile, data);

    const linkedIds = linkedEvidenceIds(profile);
    const kind = classifyQuestion({
      message: data.message,
      confrontEvidenceId: data.confrontEvidenceId ?? null,
      profile,
      linkedIds,
    });

    const shape = (delta: number, contradiction: boolean) =>
      shapeStressDelta({
        modelDelta: delta,
        kind,
        contradiction,
        currentStress: data.stress,
        tolerance: profile.stressTolerance,
      });

    try {
      const reply = await callModel({ system, user, profile });
      if (!reply) throw new Error("empty_reply");
      const unlock =
        reply.unlock && canUnlockEvidence(reply.unlock, data.unlockedEvidence)
          ? reply.unlock
          : null;
      return {
        ...reply,
        unlock,
        stressDelta: shape(reply.stressDelta, reply.contradiction),
      };
    } catch (error) {
      // كل سؤال لازم يحصل رد — لا تعليق ولا انتظار بلا نهاية.
      console.error("interrogation request failed", error);
      const fb = fallbackReply(profile, data);
      return { ...fb, stressDelta: shape(fb.stressDelta, false) };
    }
  });
