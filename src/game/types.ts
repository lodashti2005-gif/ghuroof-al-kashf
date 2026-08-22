export type GamePhase = "lobby" | "roles" | "intro" | "investigation" | "voting" | "reveal";

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
  /** تنبيه بسيط: كلام المشتبه ما يركب مع دليل مكتشف (بدون كشف الحل). */
  flagged?: boolean;
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
  /** Shared epoch when this suspect's countdown first started. */
  timerStartedAt?: number;
  finished: boolean;
  transcript: ChatMessage[];
}

/** استنتاج ناتج عن ربط دليلين مكتشفين بنجاح. */
export interface Deduction {
  id: string;
  linkId: string;
  title: string;
  insight: string;
  evidenceIds: string[];
  createdAt: number;
  author: string;
}

/** تناقض محتمل مرصود أثناء الاستجواب (يظهر بملف القضية لكل اللاعبين). */
export interface Contradiction {
  id: string;
  suspectId: string;
  suspectName: string;
  /** قول المشتبه فيه المرصود. */
  claim: string;
  /** القول السابق أو الدليل المتعارض معه. */
  conflictsWith: string;
  source: "statement" | "evidence" | "timeline";
  evidenceId?: string;
  createdAt: number;
  /** اسم اللاعب اللي كان يستجوب لحظة الرصد. */
  author: string;
  /** صار مواجهة بهذا التناقض. */
  confronted?: boolean;
}

/**
 * نظام الأدوار بالتناوب: لاعب واحد فقط يقدر يستخدم أدوات دوره في نفس الوقت.
 * الحالة كلها مشتركة بالسيرفر، والوقت محسوب من `startedAt` عشان الـ refresh
 * ما يعيد تشغيل العدّاد.
 */
export interface TurnState {
  /** ترتيب اللاعبين بالتناوب (playerId). */
  order: string[];
  /** موقع اللاعب الحالي داخل `order`. */
  index: number;
  /** رقم الجولة (يبدأ من 1). */
  round: number;
  /** "action" = دور لاعب فعّال، "discussion" = وقت النقاش بين الجولات. */
  mode: "action" | "discussion";
  /** لحظة بداية الدور/النقاش الحالي (epoch ms مشترك). */
  startedAt: number;
}

export interface RoomState {
  code: string;
  caseId: string;
  phase: GamePhase;
  createdAt: number;
  players: Player[];
  unlockedEvidence: string[];
  notes: Note[];
  deductions: Deduction[];
  contradictions: Contradiction[];
  suspects: Record<string, SuspectRuntime>;
  /** playerId -> roleId (توزيع عشوائي عند بداية الجولة). */
  roles: Record<string, string>;
  /** أرقام اللاعبين اللي ضغطوا «فهمت دوري». */
  ready: string[];
  votes: Record<string, string>; // playerId -> suspectId
}

/** A magnified region of the master crime-scene photograph. */
export interface EvidenceCrop {
  /** Focus point X in % of the scene image width. */
  x: number;
  /** Focus point Y in % of the scene image height. */
  y: number;
  /** Magnification factor applied to the scene image. */
  zoom: number;
  /** Dedicated close-up photo of the item; overrides the scene crop. */
  photo?: string;
}

export interface EvidenceItem {
  id: string;
  number: string;
  title: string;
  description: string;
  detail: string;
  /** Neutral forensic observation shown to players — never names an owner or links a suspect. */
  observation: string;

  icon: "watch" | "phone" | "cup" | "message" | "camera" | "key" | "shoe";
  /** Close-up crop of the single crime-scene photo, revealed after discovery. */
  crop: EvidenceCrop;
  /** Where the item was found in the chalet. */
  foundAt: string;
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
