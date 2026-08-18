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
  "آخر مرة شفت بدر كانت قبل لا نتفرق بالشاليه.",
  "كنت بالمكان اللي قلت لكم عنه من البداية.",
  "على حسب اللي أذكره، ما كان أحد وياي بهاللحظة.",
  "ما عندي شي أكيد عن تلفون بدر.",
  "الكاميرا؟ ما أدري منو غيّر اتجاهها.",
];

const TENSE_LINES = [
  "خلاص، ضاق خلقي من هالأسلوب. اسأل سؤالك وأنا أجاوب.",
  "أنا ما مسوي شي، وكل مرة تعيد نفس الشي عليّ.",
];

export function fallbackReply(profile: SuspectProfile, data: InterrogationInput): AiReply {
  const q = normalize(data.message);
  const repeat = isRepeat(data);
  const tense = data.stress >= 55;

  let text: string | null = null;

  // متى آخر مرة شاف بدر؟
  if (
    q.includes("اخر مره") ||
    q.includes("اخر مرة") ||
    (q.includes("متى") && (q.includes("بدر") || q.includes("شفت")))
  ) {
    text =
      profile.publicStory.find(
        (x) =>
          normalize(x).includes("بدر") ||
          normalize(x).includes("شفت")
      ) ??
      profile.trueTimeline.find((x) => normalize(x).includes("بدر")) ??
      "آخر مرة شفت بدر كانت قبل لا نتفرق بالشاليه.";
  }

  // وين كنت / الساعة كم / وقت معين
  else if (
    q.includes("وين كنت") ||
    q.includes("وينك") ||
    q.includes("الساعه") ||
    q.includes("الساعة") ||
    q.includes("وحده ونص") ||
    q.includes("وحدة ونص")
  ) {
    text =
      profile.publicStory.find(
        (x) =>
          normalize(x).includes("كنت") ||
          normalize(x).includes("رحت") ||
          normalize(x).includes("ساعه")
      ) ??
      profile.trueTimeline[0] ??
      "كنت بالمكان اللي قلت لكم عنه من البداية.";
  }

  // منو كان وياك؟
  else if (
    q.includes("منو") &&
    (q.includes("وياك") || q.includes("معاك"))
  ) {
    text =
      profile.whatTheySaw.find(
        (x) =>
          normalize(x).includes("شفت") ||
          normalize(x).includes("كان")
      ) ??
      "على حسب اللي أذكره، ما كان أحد وياي بهاللحظة.";
  }

  // تلفون بدر
  else if (
    q.includes("تلفون") ||
    q.includes("تلفونه") ||
    q.includes("موبايل") ||
    q.includes("هاتف")
  ) {
    text =
      profile.whatTheyKnow.find(
        (x) =>
          normalize(x).includes("تلفون") ||
          normalize(x).includes("هاتف")
      ) ??
      profile.whatTheySaw.find(
        (x) =>
          normalize(x).includes("تلفون") ||
          normalize(x).includes("هاتف")
      ) ??
      "ما عندي شي أكيد عن تلفون بدر.";
  }

  // الكاميرا
  else if (q.includes("كاميرا") || q.includes("الكاميرا")) {
    text =
      profile.whatTheyKnow.find((x) =>
        normalize(x).includes("كاميرا")
      ) ??
      profile.whatTheySaw.find((x) =>
        normalize(x).includes("كاميرا")
      ) ??
      "الكاميرا؟ ما أدري منو غيّر اتجاهها.";
  }

  // إذا كرر نفس السؤال
  else if (repeat) {
    const seed = data.transcript.length + data.message.length + profile.name.length;
    text = REPEAT_LINES[seed % REPEAT_LINES.length]!;
  }

  // إذا متوتر
  else if (tense) {
    const seed = data.transcript.length + data.message.length + profile.name.length;
    text = TENSE_LINES[seed % TENSE_LINES.length]!;
  }

  // fallback أخير فقط
  else {
    text = profile.publicStory[0] ?? "مادري بالضبط، بس هذا اللي أعرفه.";
  }

  return {
    text,
    stressDelta: repeat ? 2 : 1,
    state: tense ? "defensive" : repeat ? "suspicious" : "thinking",
    unlock: null,
    level: 1,
    contradiction: false,
  };
}
