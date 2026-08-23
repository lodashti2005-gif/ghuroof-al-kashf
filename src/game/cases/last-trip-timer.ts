/**
 * مؤقت الاستجواب لقضية «آخر رحلة» فقط — ٥ دقائق مستقلة لكل مشتبه فيه.
 *
 * الوقت محفوظ بالحالة المشتركة للغرفة (نفس آلية القضية الأولى) فيكون متزامن بين
 * كل الأجهزة، والـ refresh ما يصفّره لأنه محسوب من `timerStartedAt` المشترك.
 * لو ما فيه غرفة (تجربة فردية/مطوّر) نرجع لتخزين محلي دائم بنفس المنطق.
 */
import { useEffect, useState } from "react";

import * as store from "../room-store";
import { useRoom } from "../use-room";

export const LAST_TRIP_INTERROGATION_SECONDS = 300;

type LocalTimer = { timeLeft: number; startedAt?: number };

const localKey = (id: string) => `last-trip:timer:${id}`;

function readLocal(id: string): LocalTimer {
  if (typeof window === "undefined") return { timeLeft: LAST_TRIP_INTERROGATION_SECONDS };
  try {
    const raw = window.localStorage.getItem(localKey(id));
    if (!raw) return { timeLeft: LAST_TRIP_INTERROGATION_SECONDS };
    const parsed = JSON.parse(raw) as Partial<LocalTimer>;
    return {
      timeLeft: Math.max(0, Math.min(LAST_TRIP_INTERROGATION_SECONDS, parsed.timeLeft ?? LAST_TRIP_INTERROGATION_SECONDS)),
      ...(parsed.startedAt ? { startedAt: parsed.startedAt } : {}),
    };
  } catch {
    return { timeLeft: LAST_TRIP_INTERROGATION_SECONDS };
  }
}

function writeLocal(id: string, value: LocalTimer) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(localKey(id), JSON.stringify(value));
  } catch {
    /* تجاهل */
  }
}

function localRemaining(t: LocalTimer) {
  if (!t.startedAt) return t.timeLeft;
  return Math.max(0, t.timeLeft - Math.floor((Date.now() - t.startedAt) / 1000));
}

/** يبدأ عدّاد المشتبه عند فتح شاشته، ويوقفه (محفوظاً) عند الخروج. */
export function useLastTripTimer(suspectId: string) {
  const { room } = useRoom();
  const [, tick] = useState(0);
  const shared = room?.suspects?.[suspectId];
  const inRoom = !!room;

  // نبضة ثانية لعرض العدّاد.
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  // تشغيل/إيقاف: نفس المشتبه يكمل من وقته المتبقي، وغيره يتوقف.
  useEffect(() => {
    if (inRoom) {
      store.startInterrogationTimer(suspectId, LAST_TRIP_INTERROGATION_SECONDS);
      return () => store.pauseInterrogationTimer(suspectId);
    }
    const t = readLocal(suspectId);
    if (t.timeLeft > 0 && !t.startedAt) writeLocal(suspectId, { ...t, startedAt: Date.now() });
    const pause = () => {
      const cur = readLocal(suspectId);
      writeLocal(suspectId, { timeLeft: localRemaining(cur) });
    };
    window.addEventListener("pagehide", pause);
    return () => {
      window.removeEventListener("pagehide", pause);
      pause();
    };
  }, [suspectId, inRoom]);

  const remaining = inRoom
    ? store.remainingTime(shared)
    : localRemaining(readLocal(suspectId));
  const expired = remaining <= 0;

  // تثبيت الانتهاء بالحالة المشتركة (مرة واحدة).
  useEffect(() => {
    if (!expired) return;
    if (inRoom && shared && !shared.finished) store.endInterrogation(suspectId);
    if (!inRoom) writeLocal(suspectId, { timeLeft: 0 });
  }, [expired, inRoom, shared, suspectId]);

  return { remaining, expired };
}

export function formatInterrogationClock(seconds: number) {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
