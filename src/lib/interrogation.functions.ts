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
    const { callModel, clamp } = await import("./interrogation-model.server");
    const { system, user } = buildSuspectPrompt(profile, data);

    // Confronting a suspect with evidence that has nothing to do with them must
    // only nudge the meter, never spike it.
    const unrelatedConfront =
      !!data.confrontEvidenceId && !linkedEvidenceIds(profile).includes(data.confrontEvidenceId);

    // Two attempts: reasoning models occasionally finish with reasoning only and
    // no answer text. Never substitute a canned line — the caller retries or
    // surfaces a retry button instead.
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const reply = await callModel({ system, user, profile });
        if (reply) {
          // Gate discoveries: prerequisites must already be on the board.
          const unlock =
            reply.unlock && canUnlockEvidence(reply.unlock, data.unlockedEvidence)
              ? reply.unlock
              : null;
          return {
            ...reply,
            unlock,
            stressDelta: unrelatedConfront ? clamp(reply.stressDelta, 1, 4) : reply.stressDelta,
          };
        }
      } catch (error) {
        lastError = error;
        console.error(`interrogation attempt ${attempt + 1} failed`, error);
      }
    }
    throw new Error(
      `ai_reply_failed${lastError instanceof Error ? `: ${lastError.message}` : ""}`,
    );
  });
