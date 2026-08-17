/**
 * Voice casting for the interrogation room.
 *
 * Four distinct ElevenLabs voices — one real human-sounding actor per suspect,
 * never one voice with pitch tricks. The emotional state of the suspect maps to
 * delivery settings (stability / style / speed) so the same actor sounds calm,
 * defensive or scared without becoming cartoonish.
 *
 * Delivery is tuned Conversational (منخفض الثبات، أسلوب أعلى) مو Narration،
 * وكل شخصية لها نبرة وسرعة وتردد مختلف عن الثانية.
 *
 * Client-safe: voice ids are public identifiers, the API key never lives here.
 */
import type { SuspectState } from "@/game/types";

export interface SuspectVoice {
  /** ElevenLabs voice id. */
  voiceId: string;
  /** Base delivery for this character. */
  base: { stability: number; similarity: number; style: number; speed: number };
  /**
   * speaker boost يزيد وضوح الصوت بس يضخّم ضجيج التسجيل الأصلي،
   * فنطفيه للأصوات اللي فيها وشوشة.
   */
  speakerBoost: boolean;
  /** كم يتردد هذا الشخص (0 = ما يتردد، 1 = وايد). */
  hesitation: number;
  /** كلمات تعبئة كويتية خاصة بهذي الشخصية. */
  fillers: string[];
}

/**
 * أصوات ElevenLabs المخصصة لهذي القضية — صوت واحد ثابت لكل شخصية،
 * ولا يُستخدم صوت شخصية مكان شخصية ثانية أبداً.
 */
const VOICE_ABU_SALEM = "G1QUjBCuRBbLbAmYlTgl"; // أبو سالم → فهد
const VOICE_HASAN = "6wsXez7Nsh9HQSbtqwIK"; // حسن → يوسف
const VOICE_MARYAM = "w0uhBAmNIG5kUDeaFEsA"; // مريم → نورة
const VOICE_LATIFA = "S7X9UnQjDL5psfuSlXrJ"; // لطيفة → دانة

/**
 * الإعدادات متوازنة: ثبات متوسط (مو مبالغ) وstyle منخفض حتى الأداء يطلع
 * طبيعي بدون تمثيل زايد ولا artifacts/وشوشة من مبالغة similarity.
 */
export const SUSPECT_VOICES: Record<string, SuspectVoice> = {
  // فهد المطيري — رجل ٣٤، هادي بالبداية بس يتلخبط بسرعة: تردد أعلى، سرعة أقل.
  fahad: {
    voiceId: VOICE_ABU_SALEM,
    base: { stability: 0.42, similarity: 0.8, style: 0.22, speed: 0.96 },
    speakerBoost: true,
    hesitation: 0.8,
    fillers: ["يعني", "والله", "لحظة"],
  },
  // نورة الشمري — امرأة ٢٩، عاطفية ومترددة: أقل ثبات، كلام متقطع.
  noura: {
    voiceId: VOICE_MARYAM,
    base: { stability: 0.38, similarity: 0.8, style: 0.26, speed: 0.94 },
    speakerBoost: true,
    hesitation: 1,
    fillers: ["إي", "مادري", "يعني"],
  },
  // يوسف العازمي — رجل ٣١، واثق ومسيطر: أسرع، أثبت، تردد قليل.
  yousef: {
    voiceId: VOICE_HASAN,
    base: { stability: 0.5, similarity: 0.82, style: 0.18, speed: 1.0 },
    speakerBoost: true,
    hesitation: 0.25,
    fillers: ["ترى", "عاد"],
  },
  // دانة الهاجري — امرأة ٢٧، هادية ومتحفظة: صوتها فيه وشوشة بالتسجيل الأصلي،
  // فنرفع الثبات ونخفض similarity/style ونطفي speaker boost حتى يطلع نظيف.
  dana: {
    voiceId: VOICE_LATIFA,
    base: { stability: 0.6, similarity: 0.6, style: 0.06, speed: 0.92 },
    speakerBoost: false,
    hesitation: 0.55,
    fillers: ["يعني", "لحظة"],
  },
};

/** Per-emotion delivery offsets — أوضح شوي حتى يبان الانفعال بالصوت. */
const STATE_DELTA: Record<SuspectState, { stability: number; style: number; speed: number }> = {
  calm: { stability: 0.06, style: -0.04, speed: 0 },
  thinking: { stability: -0.06, style: 0.05, speed: -0.08 },
  nervous: { stability: -0.18, style: 0.14, speed: -0.03 },
  defensive: { stability: -0.12, style: 0.16, speed: 0.08 },
  angry: { stability: -0.24, style: 0.26, speed: 0.13 },
  shocked: { stability: -0.22, style: 0.18, speed: -0.05 },
  scared: { stability: -0.26, style: 0.16, speed: -0.1 },
  suspicious: { stability: -0.04, style: 0.12, speed: -0.03 },
  silent: { stability: 0.08, style: -0.02, speed: -0.08 },
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/**
 * كل مشتبه له صوت ثابت لا يتغير بين الأسئلة. يمكن تغييره لاحقاً من إعدادات
 * المشروع بمتغير سيرفر مثل `ELEVENLABS_VOICE_YOUSEF` بدون تعديل الكود،
 * وبدون كشف أي معرّف صوت في الواجهة الأمامية.
 */
function voiceIdFor(suspectId: string, fallback: string): string {
  const override = process.env[`ELEVENLABS_VOICE_${suspectId.toUpperCase()}`];
  return override?.trim() || fallback;
}

/** Resolve final ElevenLabs voice settings for a suspect + emotional state. */
export function resolveVoiceSettings(suspectId: string, state: SuspectState, stress: number) {
  const voice = SUSPECT_VOICES[suspectId] ?? SUSPECT_VOICES["fahad"]!;
  const delta = STATE_DELTA[state] ?? STATE_DELTA.calm;
  // Rising stress nudges the delivery a bit less steady / a bit faster.
  const tension = clamp(stress / 100, 0, 1);
  return {
    voiceId: voiceIdFor(suspectId, voice.voiceId),

    settings: {
      stability: clamp(voice.base.stability + delta.stability - tension * 0.1, 0.1, 0.75),
      similarity_boost: voice.base.similarity,
      style: clamp(voice.base.style + delta.style + tension * 0.08, 0, 0.85),
      use_speaker_boost: true,
      speed: clamp(voice.base.speed + delta.speed + tension * 0.04, 0.7, 1.2),
    },
  };
}

/**
 * تحويل صياغة فصحى/خليجية عامة إلى نطق كويتي يومي — بدون تغيير المعنى
 * ولا الأرقام ولا أسماء الأدلة.
 */
const KUWAITI_LEXICON: Array<[RegExp, string]> = [
  [/\bماذا\b/g, "شنو"],
  [/\bما هو\b/g, "شنو"],
  [/\bلماذا\b/g, "ليش"],
  [/\bكيف\b/g, "شلون"],
  [/\bأين\b/g, "وين"],
  [/\bمتى\b/g, "يمتى"],
  [/\bنعم\b/g, "إي"],
  [/\bأجل\b/g, "إي"],
  [/\bليس\b/g, "مو"],
  [/\bلست\b/g, "مو"],
  [/\bهكذا\b/g, "جذي"],
  [/\bالآن\b/g, "الحين"],
  [/\bحالياً?\b/g, "الحين"],
  [/\bلا أعرف\b/g, "مادري"],
  [/\bلا اعرف\b/g, "مادري"],
  [/\bلا أدري\b/g, "مادري"],
  [/\bأعرف\b/g, "أدري"],
  [/\bلا يوجد\b/g, "ماكو"],
  [/\bليس هناك\b/g, "ماكو"],
  [/\bأريد\b/g, "أبي"],
  [/\bأحتاج\b/g, "أبي"],
  [/\bلكن\b/g, "بس"],
  [/\bولكن\b/g, "بس"],
  [/\bفقط\b/g, "بس"],
  [/\bأيضاً?\b/g, "بعد"],
  [/\bجداً?\b/g, "وايد"],
  [/\bكثيراً?\b/g, "وايد"],
  [/\bقليلاً?\b/g, "شوي"],
  [/\bذهبت\b/g, "رحت"],
  [/\bأذهب\b/g, "أروح"],
  [/\bرأيت\b/g, "شفت"],
  [/\bلم أر\b/g, "ما شفت"],
  [/\bأخبرتك\b/g, "قلت لك"],
  [/\bقلت لكم\b/g, "قلت لك"],
  [/\bهاتف\b/g, "تلفون"],
  [/\bالسيارة\b/g, "السيارة"],
  [/\bحقاً?\b/g, "صدق"],
  [/\bبالتأكيد\b/g, "أكيد"],
  [/\bربما\b/g, "يمكن"],
  [/\bلحظة واحدة\b/g, "لحظة"],
];

/**
 * Shape written text into spoken Kuwaiti delivery: natural pauses, a light
 * hesitation when the suspect is rattled, and per-character rhythm.
 * Never changes facts, numbers or evidence names.
 */
export function shapeForSpeech(text: string, state: SuspectState, suspectId?: string): string {
  const voice = (suspectId && SUSPECT_VOICES[suspectId]) || SUSPECT_VOICES["fahad"]!;
  let out = text
    .replace(/[«»"”“*_]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/([،,])\s*/g, "$1 ")
    .trim();
  if (!out) return out;

  for (const [pattern, replacement] of KUWAITI_LEXICON) out = out.replace(pattern, replacement);

  // جمل قصيرة: نقسم الجمل الطويلة عند حروف الربط حتى تشبه الكلام مو القراءة.
  out = out.replace(/\s+(و)(?=[^\s]{4,})/g, " … $1");

  const tense = state === "thinking" || state === "nervous" || state === "scared";
  const alreadyHesitant = /^(إي|اي|لحظة|والله|يعني|ترى|عاد|ها|هاه|أه|ااه|مادري|…)/.test(out);
  if (tense && voice.hesitation >= 0.5 && !alreadyHesitant) {
    const filler = voice.fillers[0] ?? "يعني";
    out = voice.hesitation >= 0.8 ? `${filler}… ${out}` : `… ${out}`;
  }

  // وقفة قصيرة بعد كلمات التردد والربط الكويتية = إيقاع محادثة طبيعي.
  out = out.replace(
    /(^|\s)(والله|يعني|بس|أصلاً|اصلا|صدق|ترى|عاد|مادري|ماكو|جذي|الحين|ها|طيب|شوف|إي|اي)(\s)/g,
    (_m, a: string, w: string) => `${a}${w}، `,
  );
  // نبرة سؤال/استغراب أوضح.
  out = out.replace(/\s*\?\s*/g, "؟ ");
  // Longer beat between sentences so it sounds like talking, not reading.
  out = out.replace(/([.!؟])\s+/g, "$1 … ");
  return out
    .replace(/\s+/g, " ")
    .replace(/،\s*،/g, "،")
    .replace(/…\s*…/g, "…")
    .trim();
}
