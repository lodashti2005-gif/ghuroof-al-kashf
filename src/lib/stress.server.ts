/**
 * محرك التوتر (Server-only).
 *
 * كل مشتبه فيه عنده مستوى توتر مستقل محفوظ بحالة الغرفة. هنا نصنّف السؤال
 * ونشكّل مقدار التغير بشكل مضبوط — بدل الاعتماد على رقم عشوائي من النموذج —
 * حتى تكون الحركة تدريجية ومنطقية:
 *
 * - سؤال عادي            → 0 إلى 2
 * - سؤال حساس / تحركات    → 2 إلى 6
 * - مواجهة بدليل غير مرتبط → 1 إلى 3
 * - مواجهة بدليل مرتبط     → 6 إلى 11
 * - مواجهة بدليل يخافه     → 9 إلى 14
 * - تناقض مكشوف           → +5 إضافية
 *
 * تحمّل الشخصية (stressTolerance) يخفض الأثر، والتوتر العالي يخفف الزيادة
 * الجديدة حتى ما يقفز المؤشر لأعلى قيمة بسؤال واحد.
 */
import type { SuspectProfile } from "@/game/profiles.server";

export type QuestionKind =
  | "normal"
  | "sensitive"
  | "confront"
  | "confrontLinked"
  | "confrontFeared"
  | "contradiction";

/** كلمات حساسة: تحركات، توقيت، الغرفة، التلفون، العلاقة بالمجني عليه… */
const SENSITIVE = [
  "وين",
  "متى",
  "شوقت",
  "الساعة",
  "رحت",
  "طلعت",
  "دخلت",
  "الغرفة",
  "الباب",
  "المفتاح",
  "التخزين",
  "الكاميرا",
  "التلفون",
  "الموبايل",
  "الشاحن",
  "الفنجان",
  "القهوة",
  "الكعب",
  "الحذاء",
  "ساعة",
  "جثة",
  "مات",
  "قتل",
  "تكذب",
  "كذب",
  "خيانة",
  "فلوس",
  "دين",
  "تهديد",
  "خصومة",
  "زعل",
  "آخر مرة",
  "لحالك",
  "شفت",
];

function normalize(text: string) {
  return text
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

export function classifyQuestion({
  message,
  confrontEvidenceId,
  contradictionConfront,
  profile,
  linkedIds,
}: {
  message: string;
  confrontEvidenceId?: string | null;
  contradictionConfront?: boolean;
  profile: SuspectProfile;
  linkedIds: string[];
}): QuestionKind {
  if (contradictionConfront) return "contradiction";
  if (confrontEvidenceId) {
    if (profile.evidenceFeared.includes(confrontEvidenceId)) return "confrontFeared";
    if (linkedIds.includes(confrontEvidenceId)) return "confrontLinked";
    return "confront";
  }
  const text = normalize(message);
  return SENSITIVE.some((w) => text.includes(normalize(w))) ? "sensitive" : "normal";
}

const RANGES: Record<QuestionKind, [number, number]> = {
  normal: [0, 2],
  sensitive: [2, 6],
  confront: [1, 3],
  confrontLinked: [6, 11],
  confrontFeared: [9, 14],
  contradiction: [8, 15],
};

export function clampRange(n: number, [min, max]: [number, number]) {
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
}

/**
 * يشكّل التغير النهائي: يبقى داخل مدى التصنيف، يضيف أثر التناقض، يخفف حسب
 * التحمّل، ويقلل الزيادة عند التوتر العالي عشان الحركة تكون تدريجية.
 */
export function shapeStressDelta({
  modelDelta,
  kind,
  contradiction,
  currentStress,
  tolerance,
}: {
  modelDelta: number;
  kind: QuestionKind;
  contradiction: boolean;
  currentStress: number;
  tolerance: number;
}): number {
  const range = RANGES[kind];
  let delta = clampRange(Math.round(modelDelta), range);
  if (contradiction) delta += kind === "normal" ? 4 : 5;

  // تحمّل أعلى = أثر أقل (0.65 عند 100، 1.15 عند 0).
  delta *= 1.15 - (Math.max(0, Math.min(100, tolerance)) / 100) * 0.5;

  // كل ما اقترب من السقف، الزيادة تصير أنعم — بلا قفزات.
  if (currentStress >= 70) delta *= 0.55;
  else if (currentStress >= 50) delta *= 0.75;

  // حد أعلى لأي دور واحد حتى ما يقفز المؤشر.
  const capped = Math.max(-4, Math.min(12, Math.round(delta)));
  // ما نسمح بالتوتر يوصل 100 وينقفل — أعلى شي 96.
  return Math.min(capped, Math.max(0, 96 - currentStress));
}

/** تعليمات النبرة حسب مستوى التوتر الحالي — تُضاف للـ prompt. */
export function stressDirective(stress: number, isKiller: boolean) {
  const base =
    stress >= 80
      ? `توترك عالي جداً (${stress}/100): ردودك قصيرة جداً (كلمة إلى ٥ كلمات)، متقطعة بـ«…»، دفاعية، وممكن تسكت أو تكرر نفس الجملة أو تطلب لحظة. لا تشرح ولا تسرد.`
      : stress >= 60
        ? `توترك عالي (${stress}/100): جملك أقصر وأسرع، فيها تردد ودفاع، وتتهرب من التفاصيل الحساسة.`
        : stress >= 35
          ? `توترك متوسط (${stress}/100): جوابك أقصر من قبل وفيه شي حذر، تجاوب بس ما تتوسع.`
          : `توترك منخفض (${stress}/100): هادي وطبيعي، تجاوب بأريحية بدون مبالغة بالتعاون.`;

  const guard = isKiller
    ? "مهم جداً: ولو وصل توترك أقصى مستوى، ممنوع تعترف بالقتل أو تكشف إنك أنت الفاعل — تتلخبط، تسكت، تبرر، أو تطلب توقفون، بس بلا اعتراف."
    : "أنت مو الفاعل، بس التوتر طبيعي عليك: الخوف من فضح سرك أو من الاتهام يخليك تتوتر وتتهرب، وهذا ما يعني إنك مذنب.";

  return `${base}\n${guard}`;
}
