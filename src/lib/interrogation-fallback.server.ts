/**
 * Last-resort in-character line, used only when the model call fails or comes
 * back empty. It must never be empty: an interrogation turn without a reply is
 * a bug, so we always hand back something natural and case-consistent.
 */
import type { SuspectProfile } from "@/game/profiles.server";
import type { AiReply } from "./interrogation.functions";
import type { InterrogationInput } from "./interrogation.functions";

/** Very light Arabic normalisation so "بالسياره" ≈ "بالسيارة". */
function normalize(text: string) {
  return text
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\u0621-\u064A\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP = new Set([
  "شنو",
  "شكنت",
  "كنت",
  "تسوي",
  "سويت",
  "ليش",
  "وين",
  "متى",
  "شقاعد",
  "قاعد",
  "انت",
  "في",
  "من",
  "على",
  "هو",
  "هي",
  "ال",
  "و",
]);

function keywords(text: string) {
  return normalize(text)
    .split(" ")
    .map((w) => w.replace(/^(بال|ال|ب|ل|و)/, ""))
    .filter((w) => w.length >= 3 && !STOP.has(w));
}

/** True when the investigator already asked about roughly the same thing. */
function isRepeat(data: InterrogationInput) {
  const now = keywords(data.message);
  if (now.length === 0) return false;
  return data.transcript
    .filter((m) => m.role === "investigator")
    .slice(0, -1)
    .some((m) => {
      const before = keywords(m.text);
      const shared = now.filter((w) => before.includes(w)).length;
      return shared > 0 && shared >= Math.min(2, now.length);
    });
}

const REPEAT_LINES = [
  "قلت لك شكنت أسوي، ما عندي غير هذا.",
  "ليش قاعد تعيد نفس السؤال؟ جوابي ما تغير.",
  "شنو تبي تعرف بالضبط؟ اسألني سؤال مباشر وأجاوبك.",
];

const FIRST_LINES = [
  "شنو تقصد بالضبط؟ اسألني وأجاوبك.",
  "ما فهمت عليك زين، وضح لي سؤالك وأرد عليك.",
  "أنا قاعد أجاوب على كل شي، بس وضّح شتبي.",
];

const TENSE_LINES = [
  "خلاص، ضاق خلقي من هالأسلوب. اسأل سؤالك وأنا أجاوب.",
  "أنا ما مسوي شي، وكل مرة تعيد نفس الشي عليّ.",
];

export function fallbackReply(profile: SuspectProfile, data: InterrogationInput): AiReply {
  const repeat = isRepeat(data);
  const tense = data.stress >= 55;
  const pool = tense ? TENSE_LINES : repeat ? REPEAT_LINES : FIRST_LINES;
  const seed = data.transcript.length + data.message.length + profile.name.length;
  const text = pool[seed % pool.length]!;

  return {
    text,
    stressDelta: repeat ? 2 : 1,
    state: tense ? "defensive" : repeat ? "suspicious" : "thinking",
    unlock: null,
    level: 1,
  };
}
