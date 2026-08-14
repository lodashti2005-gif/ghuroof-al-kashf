/**
 * Voice casting for the interrogation room.
 *
 * Four distinct ElevenLabs voices — one real human-sounding actor per suspect,
 * never one voice with pitch tricks. The emotional state of the suspect maps to
 * delivery settings (stability / style / speed) so the same actor sounds calm,
 * defensive or scared without becoming cartoonish.
 *
 * Client-safe: voice ids are public identifiers, the API key never lives here.
 */
import type { SuspectState } from "@/game/types";

export interface SuspectVoice {
  /** ElevenLabs voice id. */
  voiceId: string;
  /** Base delivery for this character. */
  base: { stability: number; similarity: number; style: number; speed: number };
}

/**
 * صوت المشتبهين الرجال. صوت Hasan من مكتبة ElevenLabs يحتاج خطة مدفوعة،
 * فاستبدلناه بصوت George الجاهز (متاح على الخطة المجانية) مع موديل
 * multilingual الذي ينطق العربية بشكل طبيعي.
 */
export const HASAN_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";

export const SUSPECT_VOICES: Record<string, SuspectVoice> = {
  // فهد المطيري — رجل ٣٤، صوت متوسط/عميق، هادي بالبداية.
  fahad: {
    voiceId: HASAN_VOICE_ID, // Hasan
    base: { stability: 0.45, similarity: 0.8, style: 0.32, speed: 0.97 },
  },
  // نورة الشمري — امرأة ٢٩، صوت طبيعي، عاطفية ومترددة.
  noura: {
    voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah
    base: { stability: 0.35, similarity: 0.8, style: 0.42, speed: 0.95 },
  },
  // يوسف العازمي — رجل ٣١، صوت واثق أعمق، مسيطر.
  yousef: {
    voiceId: HASAN_VOICE_ID, // Hasan
    base: { stability: 0.52, similarity: 0.82, style: 0.3, speed: 1.0 },
  },
  // دانة الهاجري — امرأة ٢٧، هادية ومتحفظة، صوت ناعم وواضح.
  dana: {
    voiceId: "Xb7hH8MSUJpSbSDYk0k2", // Alice
    base: { stability: 0.5, similarity: 0.8, style: 0.22, speed: 0.92 },
  },
};

/** Per-emotion delivery offsets — subtle on purpose. */
const STATE_DELTA: Record<SuspectState, { stability: number; style: number; speed: number }> = {
  calm: { stability: 0.05, style: 0, speed: 0 },
  thinking: { stability: 0, style: 0.02, speed: -0.05 },
  nervous: { stability: -0.14, style: 0.08, speed: -0.02 },
  defensive: { stability: -0.06, style: 0.1, speed: 0.06 },
  angry: { stability: -0.18, style: 0.2, speed: 0.1 },
  shocked: { stability: -0.16, style: 0.12, speed: -0.04 },
  scared: { stability: -0.2, style: 0.1, speed: -0.08 },
  suspicious: { stability: 0.02, style: 0.06, speed: -0.02 },
  silent: { stability: 0.08, style: 0, speed: -0.06 },
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/** Resolve final ElevenLabs voice settings for a suspect + emotional state. */
export function resolveVoiceSettings(suspectId: string, state: SuspectState, stress: number) {
  const voice = SUSPECT_VOICES[suspectId] ?? SUSPECT_VOICES["fahad"]!;
  const delta = STATE_DELTA[state] ?? STATE_DELTA.calm;
  // Rising stress nudges the delivery a bit less steady / a bit faster.
  const tension = clamp(stress / 100, 0, 1);
  return {
    voiceId: voice.voiceId,
    settings: {
      stability: clamp(voice.base.stability + delta.stability - tension * 0.1, 0.1, 0.9),
      similarity_boost: voice.base.similarity,
      style: clamp(voice.base.style + delta.style + tension * 0.08, 0, 0.8),
      use_speaker_boost: true,
      speed: clamp(voice.base.speed + delta.speed + tension * 0.04, 0.7, 1.2),
    },
  };
}

/**
 * Shape written text into spoken delivery: natural pauses, a breath before a
 * sensitive answer, and a light hesitation when the suspect is rattled.
 * Never rewrites the words themselves.
 */
export function shapeForSpeech(text: string, state: SuspectState): string {
  let out = text
    .replace(/[«»"”“*_]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/([،,])\s*/g, "$1 ")
    .trim();
  if (!out) return out;

  const hesitant = state === "thinking" || state === "nervous" || state === "scared";
  const alreadyHesitant = /^(إي|اي|لحظة|والله|يعني|ها|هاه|أه|ااه|…)/.test(out);
  if (hesitant && !alreadyHesitant) out = `… ${out}`;

  // Longer beat between sentences so it sounds like talking, not reading.
  out = out.replace(/([.!؟?])\s+/g, "$1 … ");
  return out;
}
