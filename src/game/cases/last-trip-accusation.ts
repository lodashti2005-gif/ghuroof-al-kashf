/**
 * حالة الاتهام والنهاية لقضية «آخر رحلة» فقط.
 *
 * المصدر المعتمد هو حالة الغرفة المشتركة (`room.ltAcc`) حتى يشوف كل اللاعبين
 * نفس المرحلة ونفس النتيجة بدون refresh. لو اللاعب يجرب القضية بدون غرفة
 * (وضع المطوّر) نحفظ نفس الحالة محلياً حتى ما تضيع بعد إعادة التحميل.
 */
import { useCallback, useEffect, useSyncExternalStore } from "react";

import * as store from "../room-store";
import { useRoom } from "../use-room";
import type { LastTripAccusation } from "../types";

const STORAGE_KEY = "last-trip:accusation";

type Listener = () => void;
const listeners = new Set<Listener>();
let local: LastTripAccusation | null = null;
let hydrated = false;

function read(): LastTripAccusation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LastTripAccusation) : null;
  } catch {
    return null;
  }
}

function set(next: LastTripAccusation | null) {
  local = next;
  if (typeof window !== "undefined") {
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* تجاهل */
    }
  }
  for (const l of listeners) l();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => local;
const getServerSnapshot = () => null;

const emptyAcc = (): LastTripAccusation => ({
  stage: "select",
  selectedSuspect: null,
  result: null,
  reasons: [],
  attempts: [],
  endingViewed: false,
});

export function useLastTripAccusation() {
  const localAcc = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { room } = useRoom();

  useEffect(() => {
    if (hydrated) return;
    hydrated = true;
    set(read());
  }, []);

  const inRoom = !!room;
  const acc = (inRoom ? room?.ltAcc : localAcc) ?? emptyAcc();

  const confirm = useCallback(
    (suspectId: string, correct: boolean, reasons: string[] = []) => {
      if (inRoom) {
        store.confirmLastTripAccusation(suspectId, correct, reasons);
        return;
      }
      const base = local ?? emptyAcc();
      if (base.stage !== "select") return;
      set({
        stage: "result",
        selectedSuspect: suspectId,
        result: correct ? "correct" : "wrong",
        reasons,
        attempts: [...base.attempts, { suspectId, correct, at: Date.now(), reasons }],
        endingViewed: base.endingViewed,
        confirmedAt: Date.now(),
      });
    },
    [inRoom],
  );

  const retry = useCallback(() => {
    if (inRoom) {
      store.retryLastTripAccusation();
      return;
    }
    const base = local ?? emptyAcc();
    if (base.result !== "wrong") return;
    const { confirmedAt: _drop, ...rest } = base;
    set({ ...rest, stage: "select", selectedSuspect: null, result: null, reasons: [] });
  }, [inRoom]);

  const openEnding = useCallback(() => {
    if (inRoom) {
      store.openLastTripEnding();
      return;
    }
    const base = local ?? emptyAcc();
    set({ ...base, stage: "ending", endingViewed: true });
  }, [inRoom]);

  return { acc, confirm, retry, openEnding };
}
