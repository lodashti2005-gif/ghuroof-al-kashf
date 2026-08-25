/**
 * الحكم على اتهام «آخر رحلة» + النهاية الكاملة — سيرفر فقط حتى لا يوصل اسم
 * القاتل ولا تفاصيل الحل لحزمة العميل قبل شاشة النهاية.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const judgeLastTripAccusation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ suspectId: z.string().max(40) }).parse(data))
  .handler(async ({ data }) => {
    const { lastTripCulpritId } = await import("@/game/cases/last-trip-ending.server");
    return { correct: data.suspectId === lastTripCulpritId };
  });

export const getLastTripEnding = createServerFn({ method: "POST" }).handler(async () => {
  const { lastTripCulpritId, lastTripEndingBeats } = await import(
    "@/game/cases/last-trip-ending.server"
  );
  return { culpritId: lastTripCulpritId, beats: lastTripEndingBeats };
});
