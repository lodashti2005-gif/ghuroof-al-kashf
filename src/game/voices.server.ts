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
  /** كم يتردد هذا الشخص (0 = ما يتردد، 1 = وايد). */
  hesitation: number;
  /** كلمات تعبئة كويتية خاصة بهذي الشخصية. */
  fillers: string[];
}

/**
 * صوت المشتبهين الرجال. صوت Hasan من مكتبة ElevenLabs يحتاج خطة مدفوعة،
 * فاستبدلناه بصوت George الجاهز (متاح على الخطة المجانية) مع موديل
 * multilingual الذي ينطق العربية بشكل طبيعي.
 */
export const HASAN_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";

/** صوت رجالي ثاني (Brian) حتى لا يتشابه فهد ويوسف. */
const BRIAN_VOICE_ID = "nPczCjzI2devNBz1zQrb";

export const SUSPECT_VOICES: Record<string, SuspectVoice> = {
  // فهد المطيري — رجل ٣٤، هادي بالبداية بس يتلخبط بسرعة: تردد أعلى، سرعة أقل.
  fahad: {
    voiceId: HASAN_VOICE_ID,
    base: { stability: 0.26, similarity: 0.9, style: 0.55, speed: 0.94 },
    hesitation: 0.8,
    fillers: ["يعني", "والله", "لحظة"],
  },
  // نورة الشمري — امرأة ٢٩، عاطفية ومترددة: أقل ثبات، كلام متقطع.
  noura: {
    voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah
    base: { stability: 0.2, similarity: 0.9, style: 0.62, speed: 0.9 },
    hesitation: 1,
    fillers: ["إي", "مادري", "يعني"],
  },
  // يوسف العازمي — رجل ٣١، واثق ومسيطر: أسرع، أثبت، تردد قليل.
  yousef: {
    voiceId: BRIAN_VOICE_ID,
    base: { stability: 0.4, similarity: 0.92, style: 0.42, speed: 1.02 },
    hesitation: 0.25,
    fillers: ["ترى", "عاد"],
  },
  // دانة الهاجري — امرأة ٢٧، هادية ومتحفظة: بطيئة وواضحة، تردد متوسط.
  dana: {
    voiceId: "Xb7hH8MSUJpSbSDYk0k2", // Alice
    base: { stability: 0.32, similarity: 0.9, style: 0.45, speed: 0.88 },
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
