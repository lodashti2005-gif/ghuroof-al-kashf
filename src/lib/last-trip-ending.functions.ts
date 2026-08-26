/**
 * الحكم على اتهام «آخر رحلة» + النهاية الكاملة — سيرفر فقط حتى لا يوصل اسم
 * القاتل ولا تفاصيل الحل لحزمة العميل قبل شاشة النهاية.
 *
 * كل دالة تتحقق بالسيرفر من عضوية اللاعب بغرفة «آخر رحلة» فعلية، والنهاية
 * تحتاج زيادة أن الغرفة وصلت مرحلة النهاية.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const roomInput = z.object({
  code: z.string().regex(/^\d{6}$/),
  playerId: z.string().min(1).max(64),
});

export const judgeLastTripAccusation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    roomInput.extend({ suspectId: z.string().max(40) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { assertLastTripRoom } = await import("./last-trip-room-gate.server");
    await assertLastTripRoom(data.code, data.playerId);
    const { lastTripCulpritId } = await import("@/game/cases/last-trip-ending.server");
    return { correct: data.suspectId === lastTripCulpritId };
  });

export const getLastTripEnding = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => roomInput.parse(data))
  .handler(async ({ data }) => {
    const { assertLastTripEndingUnlocked } = await import("./last-trip-room-gate.server");
    await assertLastTripEndingUnlocked(data.code, data.playerId);
    const { lastTripCulpritId, lastTripEndingBeats } = await import(
      "@/game/cases/last-trip-ending.server"
    );
    return { culpritId: lastTripCulpritId, beats: lastTripEndingBeats };
  });
