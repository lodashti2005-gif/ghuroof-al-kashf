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
  /** "action" = دور لاعب فعّال، "discussion" = وقت النقاش، "ready" = بانتظار بدء الجولة التالية. */
  mode: "action" | "discussion" | "ready";

  /** لحظة بداية الدور/النقاش الحالي (epoch ms مشترك). */
  startedAt: number;
}

/**
 * استخدام قدرة دور واحدة — محفوظ بالحالة المشتركة عشان كل الفريق يشوف منو سوى
 * شنو، ومعرّفه ثابت (جولة + لاعب + نوع) فما ينسجل مرتين مع الـ refresh.
 */
export interface AbilityUse {
  /** `${round}:${playerId}:${kind}` — ثابت ويمنع التكرار. */
  id: string;
  round: number;
  playerId: string;
  playerName: string;
  roleTitle: string;
  kind: "forensic" | "question" | "link" | "timeline";
  label: string;
  /** وصف الحركة اللي شافها الفريق (بدون أي معلومة مخفية). */
  summary: string;
  /** نتيجة القدرة الظاهرة للفريق (اختياري). */
  result?: string;
  createdAt: number;
}

/**
 * القرار الأخير — حالة مشتركة لمرحلة الاتهام النهائي: جولة التصويت الحالية،
 * أصوات جولات التعادل، نقاش التعادل (٦٠ ثانية)، ثم قرار الفريق النهائي.
 * الجولة ١ أصواتها محفوظة بقاعدة البيانات (`votes`)، والجولات التالية هنا.
 */
export interface FinalDecision {
  /** ١ = التصويت الأول، ٢ وأكثر = جولات كسر التعادل. */
  round: number;
  /** المشتبهون المسموح التصويت لهم بهذه الجولة (فاضي = الكل). */
  candidates: string[];
  /** `${round}:${playerId}` -> suspectId لجولات التعادل. */
  votes: Record<string, string>;
  /** بداية نقاش التعادل (epoch ms مشترك). */
  tieAt?: number;
  /** قرار الفريق النهائي (suspectId) بعد ما يفوز مشتبه واحد. */
  accused?: string;
  /** لحظة كشف الحقيقة — تستخدم لحساب زمن التحقيق. */
  revealedAt?: number;
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
  /** دور اللاعب الحالي بالتناوب (null قبل بداية أول جولة). */
  turn: TurnState | null;
  /** سجل قدرات الأدوار المستخدمة (مشترك). */
  abilities: AbilityUse[];
  /** حالة القرار الأخير (null قبل ما يفتح المضيف الاتهام النهائي). */
  final: FinalDecision | null;
  /** مشهد المقدمة السينمائية الحالي (null قبل بدايتها أو بعد انتهائها). */
  intro: number | null;
  /** أدوار قضية «آخر رحلة» فقط: playerId -> roleId (مستقلة عن `roles`). */
  ltRoles: Record<string, string>;
  /** لاعبو «آخر رحلة» اللي ضغطوا «فهمت دوري». */
  ltRoleReady: string[];
  /** أدلة «آخر رحلة» اللي صار لها فحص تفصيلي (مشتركة مع الفريق). */
  ltAnalyzed: string[];
  /** حالة الاتهام والنهاية بقضية «آخر رحلة» فقط (null قبل أول تأكيد). */
  ltAcc: LastTripAccusation | null;
  /** تجربة «آخر رحلة» المجانية (١٠ دقائق) — مشتركة بين كل لاعبي الغرفة. */
  ltTrial: LastTripTrial | null;
}

/** تجربة مجانية مؤقتة لكل غرفة — جاهزة لاحقاً لحالة الشراء (`unlocked`). */
export interface LastTripTrial {
  /** وقت بداية القضية فعلياً (ms) — منه يُحسب المتبقي، فالـrefresh ما يعيده. */
  startedAt: number;
  /** صارت الغرفة مفتوحة بالكامل (بعد الشراء) — يتجاوز قفل التجربة. */
  unlocked: boolean;
}


/** مرحلة الاتهام/النهاية بقضية «آخر رحلة» — مشتركة بين كل لاعبي الغرفة. */
export interface LastTripAccusation {
  /** المرحلة الحالية: اختيار متهم، نتيجة الاتهام، أو النهاية الكاملة. */
  stage: "select" | "result" | "ending";
  /** المتهم المثبّت بالمحاولة الحالية. */
  selectedSuspect: string | null;
  /** نتيجة المحاولة الحالية. */
  result: "correct" | "wrong" | null;
  /** الأدلة/الأسباب اللي اختارها الفريق مع الاتهام. */
  reasons: string[];
  /** كل المحاولات السابقة (ما تُمسح عند إعادة الاتهام). */
  attempts: Array<{ suspectId: string; correct: boolean; at: number; reasons: string[] }>;
  /** تم فتح النهاية الكاملة. */
  endingViewed: boolean;
  /** وقت تثبيت الاتهام الحالي. */
  confirmedAt?: number;
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
