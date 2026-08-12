export type GamePhase = "lobby" | "intro" | "investigation" | "voting" | "reveal";

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
}

export interface Note {
  id: string;
  author: string;
  text: string;
  createdAt: number;
  tag?: string;
}

export interface ChatMessage {
  id: string;
  role: "investigator" | "suspect";
  author: string;
  text: string;
  createdAt: number;
  /** When set, this investigator turn was an evidence confrontation. */
  evidenceId?: string;
}


export const SUSPECT_STATES = [
  "calm",
  "thinking",
  "nervous",
  "defensive",
  "angry",
  "shocked",
  "scared",
  "suspicious",
  "silent",
] as const;

/** Simulated character state driving the portrait animation. */
export type SuspectState = (typeof SUSPECT_STATES)[number];

export interface SuspectRuntime {
  stress: number;
  /** Latest simulated emotional state (defaults to calm). */
  state?: SuspectState;
  /** Deepest information level the suspect has revealed so far (1-4). */
  level?: number;
  timeLeft: number;
  finished: boolean;
  transcript: ChatMessage[];
}

export interface RoomState {
  code: string;
  caseId: string;
  phase: GamePhase;
  createdAt: number;
  players: Player[];
  unlockedEvidence: string[];
  notes: Note[];
  suspects: Record<string, SuspectRuntime>;
  votes: Record<string, string>; // playerId -> suspectId
}

export interface EvidenceItem {
  id: string;
  number: string;
  title: string;
  description: string;
  detail: string;
  icon: "watch" | "phone" | "cup" | "message" | "camera" | "key";
  /** Photorealistic crime-scene photo, revealed only after discovery. */
  photo: string;
  unlockHint: string;
}

export interface Suspect {
  id: string;
  name: string;
  age: number;
  role: string;
  personality: string;
  portrait: string;
  known: string[];
  backstory: string;
  secret: string;
  truths: string[];
  lies: string[];
  stressStyle: string;
}
