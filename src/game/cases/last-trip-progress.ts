import { getSnapshot, addNote, unlockEvidence } from "@/game/room-store";
import { getLastTripEvidence } from "./last-trip-evidence";

/**
 * تقدّم اكتشاف أدلة «آخر رحلة» فقط.
 *
 * - يُحفظ محلياً (localStorage) حتى يبقى بعد الـ refresh حتى بوضع التجربة بدون غرفة.
 * - إذا اللاعب داخل غرفة، ينضاف نفس الدليل لحالة الغرفة المشتركة + دفتر القضية،
 *   فيتزامن على كل اللاعبين. ما يُحتسب نفس الدليل مرتين.
 */
const STORAGE_KEY = "last-trip:evidence:found";

type Listener = () => void;
const listeners = new Set<Listener>();
let found: string[] = [];
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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
  } catch {
    /* تجاهل */
  }
}

function emit() {
  for (const l of listeners) l();
}

export function hydrateLastTripProgress() {
  if (hydrated) return;
  hydrated = true;
  const local = read();
  const room = getSnapshot();
  const shared = (room?.unlockedEvidence ?? []).filter((id) => id.startsWith("lt-"));
  found = Array.from(new Set([...local, ...shared]));
  persist();
  emit();
}

export function subscribeLastTripProgress(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getLastTripFoundSnapshot = (): string[] => found;
export const getLastTripFoundServerSnapshot = (): string[] => [];

export function isLastTripFound(id: string) {
  return found.includes(id);
}

/** يرجّع true إذا هذا أول اكتشاف لهذا الدليل. */
export function discoverLastTripEvidence(id: string): boolean {
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
export function mergeLastTripFromRoom(ids: string[]) {
  const incoming = ids.filter((id) => id.startsWith("lt-") && !found.includes(id));
  if (incoming.length === 0) return;
  found = [...found, ...incoming];
  persist();
  emit();
}
