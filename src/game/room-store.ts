/**
 * Room store — local realtime stand-in.
 *
 * State lives in localStorage and syncs across browser tabs through the
 * `storage` event, so multiplayer can be demoed on one device today. The
 * exported API (subscribe/getSnapshot/actions) is the same shape a Supabase
 * realtime channel + `rooms` table would provide, so swapping the adapter later
 * touches only this file.
 */
import { INTERROGATION_SECONDS, caseFile, suspects } from "./case-data";
import type { Note, Player, RoomState, SuspectRuntime } from "./types";

const ROOM_KEY = (code: string) => `ghurfa:room:${code}`;
const SESSION_KEY = "ghurfa:session";

export interface Session {
  code: string;
  playerId: string;
}

type Listener = () => void;

let state: RoomState | null = null;
let session: Session | null = null;
const listeners = new Set<Listener>();

const emit = () => listeners.forEach((l) => l());

const uid = () => Math.random().toString(36).slice(2, 10);

const freshSuspects = (): Record<string, SuspectRuntime> =>
  Object.fromEntries(
    suspects.map((s) => [
      s.id,
      { stress: 12, timeLeft: INTERROGATION_SECONDS, finished: false, transcript: [] },
    ]),
  );

function persist() {
  if (typeof window === "undefined" || !state) return;
  window.localStorage.setItem(ROOM_KEY(state.code), JSON.stringify(state));
  if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function load(code: string): RoomState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(ROOM_KEY(code));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RoomState;
  } catch {
    return null;
  }
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getSnapshot = () => state;
export const getServerSnapshot = () => null;
export const getSession = () => session;

/** Restore the player's room after a refresh / new page. */
export function hydrate() {
  if (typeof window === "undefined" || state) return;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as Session;
    const room = load(parsed.code);
    if (!room) return;
    session = parsed;
    state = room;
    emit();
  } catch {
    /* ignore */
  }
}

/** Cross-tab sync — the local stand-in for realtime subscriptions. */
export function startRealtime() {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (!state || e.key !== ROOM_KEY(state.code) || !e.newValue) return;
    try {
      state = JSON.parse(e.newValue) as RoomState;
      emit();
    } catch {
      /* ignore */
    }
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

function update(mutate: (s: RoomState) => void) {
  if (!state) return;
  const next: RoomState = JSON.parse(JSON.stringify(state));
  mutate(next);
  state = next;
  persist();
  emit();
}

export const generateRoomCode = () => String(Math.floor(100000 + Math.random() * 900000));

export function createRoom(hostName: string): { code: string } {
  const code = generateRoomCode();
  const playerId = uid();
  state = {
    code,
    caseId: caseFile.id,
    phase: "lobby",
    createdAt: Date.now(),
    players: [{ id: playerId, name: hostName, isHost: true, joinedAt: Date.now() }],
    unlockedEvidence: [],
    notes: [],
    suspects: freshSuspects(),
    votes: {},
  };
  session = { code, playerId };
  persist();
  emit();
  return { code };
}

export function joinRoom(code: string, name: string): { ok: boolean; error?: string } {
  const room = load(code);
  if (!room) return { ok: false, error: "ما لقينا غرفة بهذا الرمز" };
  if (room.players.some((p) => p.name.trim() === name.trim()))
    return { ok: false, error: "الاسم مستخدم بالغرفة، جرب اسم ثاني" };
  const playerId = uid();
  room.players.push({ id: playerId, name, isHost: false, joinedAt: Date.now() });
  state = room;
  session = { code, playerId };
  persist();
  emit();
  return { ok: true };
}

export function leaveRoom() {
  if (state && session) {
    const id = session.playerId;
    update((s) => {
      s.players = s.players.filter((p) => p.id !== id);
      if (s.players.length && !s.players.some((p) => p.isHost)) s.players[0]!.isHost = true;
    });
  }
  state = null;
  session = null;
  if (typeof window !== "undefined") window.localStorage.removeItem(SESSION_KEY);
  emit();
}

export const setPhase = (phase: RoomState["phase"]) => update((s) => void (s.phase = phase));

export const unlockEvidence = (id: string) =>
  update((s) => {
    if (!s.unlockedEvidence.includes(id)) s.unlockedEvidence.push(id);
  });

export const addNote = (note: Omit<Note, "id" | "createdAt">) =>
  update((s) => {
    s.notes.unshift({ ...note, id: uid(), createdAt: Date.now() });
  });

export const removeNote = (id: string) =>
  update((s) => void (s.notes = s.notes.filter((n) => n.id !== id)));

export const pushMessage = (
  suspectId: string,
  msg: { role: "investigator" | "suspect"; author: string; text: string },
) =>
  update((s) => {
    const rt = s.suspects[suspectId];
    if (!rt) return;
    rt.transcript.push({ ...msg, id: uid(), createdAt: Date.now() });
  });

export const bumpStress = (suspectId: string, delta: number) =>
  update((s) => {
    const rt = s.suspects[suspectId];
    if (!rt) return;
    rt.stress = Math.max(0, Math.min(100, rt.stress + delta));
  });

export const setTimeLeft = (suspectId: string, seconds: number) =>
  update((s) => {
    const rt = s.suspects[suspectId];
    if (!rt) return;
    rt.timeLeft = Math.max(0, seconds);
    if (rt.timeLeft === 0) rt.finished = true;
  });

export const endInterrogation = (suspectId: string) =>
  update((s) => {
    const rt = s.suspects[suspectId];
    if (rt) rt.finished = true;
  });

export const castVote = (playerId: string, suspectId: string) =>
  update((s) => void (s.votes[playerId] = suspectId));

export const resetCase = () =>
  update((s) => {
    s.phase = "lobby";
    s.unlockedEvidence = [];
    s.notes = [];
    s.suspects = freshSuspects();
    s.votes = {};
  });

export function findPlayer(room: RoomState | null, playerId?: string): Player | undefined {
  return room?.players.find((p) => p.id === playerId);
}
