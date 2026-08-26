import {
  getSnapshot,
  getStoredSessionCode,
  subscribe as subscribeRoom,
  addNote,
  unlockEvidence,
} from "@/game/room-store";
import { getLastTripEvidence } from "./last-trip-evidence";

/**
 * تقدّم اكتشاف أدلة «آخر رحلة» — مربوط بالغرفة الحالية فقط.
 *
 * - داخل غرفة: حالة الغرفة المشتركة (`unlockedEvidence`) هي المصدر الموثوق،
 *   والكاش المحلي مفتاحه رمز الغرفة (للـrefresh السريع فقط).
 * - بدون غرفة (تجربة فردية): كاش منفصل لا يلوّث أي غرفة.
 * - غرفة جديدة تبدأ دائماً 0/7.
 */
const LEGACY_KEY = "last-trip:evidence:found";
const SOLO_KEY = "last-trip:evidence:solo";
const roomKey = (code: string) => `last-trip:evidence:room:${code}`;

type Listener = () => void;
const listeners = new Set<Listener>();
let found: string[] = [];
let scopeKey: string | null = null;
let wired = false;

const isLt = (id: string) => id.startsWith("lt-");

function readCache(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as string[]).filter(isLt) : [];
  } catch {
    return [];
  }
}

function persist() {
  if (typeof window === "undefined" || !scopeKey) return;
  try {
    window.localStorage.setItem(scopeKey, JSON.stringify(found));
  } catch {
    /* تجاهل */
  }
}

function emit() {
  for (const l of listeners) l();
}

function dropLegacy() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* تجاهل */
  }
}

/** يوائم الحالة المحلية مع الغرفة الحالية (أو الوضع الفردي إذا ماكو غرفة). */
export function syncLastTripProgress() {
  dropLegacy();
  const room = getSnapshot();
  const inLtRoom = !!room && room.caseId === "last-trip";
  const key = inLtRoom ? roomKey(room!.code) : SOLO_KEY;

  let changed = false;
  if (key !== scopeKey) {
    scopeKey = key;
    found = readCache(key);
    changed = true;
  }

  if (inLtRoom) {
    const shared = (room!.unlockedEvidence ?? []).filter(isLt);
    const merged = Array.from(new Set([...shared, ...found]));
    if (merged.length !== found.length) {
      found = merged;
      changed = true;
    }
  }

  if (changed) {
    persist();
    emit();
  }
}

/** توافقية: نفس الاسم القديم، صار يوائم مع الغرفة الحالية. */
export function hydrateLastTripProgress() {
  if (!wired) {
    wired = true;
    subscribeRoom(syncLastTripProgress);
  }
  syncLastTripProgress();
}

export function subscribeLastTripProgress(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getLastTripFoundSnapshot = (): string[] => found;
const EMPTY: string[] = [];
export const getLastTripFoundServerSnapshot = (): string[] => EMPTY;

export function isLastTripFound(id: string) {
  return found.includes(id);
}

/** يرجّع true إذا هذا أول اكتشاف لهذا الدليل. */
export function discoverLastTripEvidence(id: string): boolean {
  syncLastTripProgress();
  if (found.includes(id)) return false;
  const item = getLastTripEvidence(id);
  if (!item) return false;

  found = [...found, id];
  persist();
  emit();

  // مزامنة مع الغرفة المشتركة (تتجاهل نفسها إذا ماكو غرفة).
  unlockEvidence(id);
  addNote({ author: "مسرح الجريمة", tag: "دليل", text: `${item.title} — ${item.observation}` });
  return true;
}

/** دمج أدلة الغرفة الواصلة لحظياً من لاعبين ثانين. */
export function mergeLastTripFromRoom(_ids?: string[]) {
  syncLastTripProgress();
}
