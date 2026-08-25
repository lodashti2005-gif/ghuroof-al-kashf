/**
 * تقدّم الاستجوابات لقضية «آخر رحلة» فقط — منو خلص استجوابه.
 *
 * يُحفظ محلياً (localStorage) حتى يبقى بعد الـ refresh أو الرجوع، ولو اللاعب
 * داخل غرفة يتزامن مع حالة الغرفة (`suspects[id].finished`).
 */
import { useEffect, useMemo, useSyncExternalStore } from "react";

import { lastTripSuspects } from "./last-trip-suspects";
import * as store from "../room-store";
import { useRoom } from "../use-room";

const STORAGE_KEY = "last-trip:interrogation:done";

type Listener = () => void;
const listeners = new Set<Listener>();
let done: string[] = [];
let hydrated = false;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(done));
  } catch {
    /* تجاهل */
  }
}

function emit() {
  for (const l of listeners) l();
}

function set(next: string[]) {
  done = next;
  persist();
  emit();
}

export function hydrateLastTripInterrogationProgress() {
  if (hydrated) return;
  hydrated = true;
  set(Array.from(new Set(read())));
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const EMPTY: string[] = [];
const getSnapshot = () => done;
const getServerSnapshot = () => EMPTY;

/** يعلّم استجواب مشتبه فيه كمنتهي (محلياً + بحالة الغرفة). */
export function markLastTripInterrogationDone(suspectId: string) {
  if (!done.includes(suspectId)) set([...done, suspectId]);
  store.endInterrogation(suspectId);
}

/**
 * حالة الاستجوابات: أي مشتبه فيه خلص وقته أو أُنهي استجوابه، وهل خلصوا كلهم.
 * يتحدث لحظياً بدون refresh.
 */
export function useLastTripInterrogations() {
  const local = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { room } = useRoom();

  useEffect(() => {
    hydrateLastTripInterrogationProgress();
  }, []);

  const roomDone = useMemo(
    () =>
      lastTripSuspects
        .filter((s) => room?.suspects?.[s.id]?.finished)
        .map((s) => s.id),
    [room?.suspects],
  );

  const doneIds = useMemo(
    () => Array.from(new Set([...local, ...roomDone])),
    [local, roomDone],
  );

  const total = lastTripSuspects.length;
  const count = lastTripSuspects.filter((s) => doneIds.includes(s.id)).length;

  return {
    doneIds,
    count,
    total,
    isDone: (id: string) => doneIds.includes(id),
    allDone: count >= total,
  };
}
