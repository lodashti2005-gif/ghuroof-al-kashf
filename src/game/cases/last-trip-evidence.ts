/**
 * أدلة قضية «آخر رحلة» — مستقلة تماماً عن قضية الشاليه.
 *
 * ٧ أدلة مخفية داخل مشاهد المحطة. ماكو أسماء ولا قائمة تنكشف قبل الاكتشاف،
 * وكل دليل يُكتشف فقط بالضغط على الشي الصحيح داخل الصورة.
 *
 * `analysis` = نتيجة الفحص/التحليل اللاحق (ما تنعرض عند الاكتشاف الأول).
 */
export interface LastTripEvidence {
  id: string;
  /** اسم الدليل — يظهر فقط بعد الاكتشاف. */
  title: string;
  /** المشهد اللي فيه الدليل. */
  view: string;
  /** الملاحظة الأولية عند الاكتشاف. */
  observation: string;
  /** فحص/تحليل لاحق — يبقى مخفي لهذي المرحلة. */
  analysis: string;
  /** المشتبه فيهم اللي هذا الدليل يخصهم — المواجهة تظهر عندهم فقط. */
  targetSuspects: string[];
}

export const LAST_TRIP_EVIDENCE_TOTAL = 7;

export const lastTripEvidence: LastTripEvidence[] = [
  {
    id: "lt-faucet",
    title: "الحنفية",
    view: "farSink",
    observation: "جزء من الحنفية أنظف من باقي المغسلة بشكل لافت.",
    analysis:
      "توجد علامات تدل على أن الحنفية مُسحت حديثاً، مع بقايا أثر في منطقة يصعب تنظيفها.",
    targetSuspects: ["lt-jassim"],
  },
  {
    id: "lt-tissue",
    title: "الكلينكس المستخدم",
    view: "trashOpen",
    observation: "منديل مستخدم ومبلل جزئياً.",
    analysis: "الأثر الموجود على المنديل يتطابق مع الأثر المتبقي على حنفية الحمام الطرفي.",
    targetSuspects: ["lt-jassim", "lt-mishal"],
  },
  {
    id: "lt-corridor-cam",
    title: "كاميرا الممر",
    view: "corridor",
    observation: "الكاميرا تغطي الممر المؤدي للحمامات، لكنها لا تصور داخل الحمام.",
    analysis:
      "التسجيل يبيّن شخصين غير محددي الهوية يتوجهون ناحية الحمام الطرفي بفارق وقت قصير، وبعدها بفترة يرجع شخص واحد باتجاه الكوفي شوب.",
    targetSuspects: ["lt-jassim", "lt-nasser", "lt-abdullah"],
  },
  {
    id: "lt-coffee-cup",
    title: "كوب قهوة جاسم",
    view: "coffee",
    observation: "كوب قهوة من نفس الكوفي الموجود بالمحطة.",
    analysis:
      "وقت الطلب على الفاتورة ما يتوافق مع كلام جاسم إنه بقى بالكوفي شوب بدون ما يطلع.",
    targetSuspects: ["lt-jassim"],
  },
  {
    id: "lt-call-log",
    title: "سجل مكالمة عبدالله",
    view: "abdullah-file",
    observation: "بيانات جهاز عبدالله تبيّن مكالمة طويلة بنفس الفترة… وفيها انقطاع قصير.",
    analysis: "الانقطاع القصير ما له تفسير حتى الآن.",
    targetSuspects: ["lt-abdullah"],
  },
  {
    id: "lt-shoe-print",
    title: "أثر الحذاء الرطب",
    view: "farBath",
    observation: "أثر حذاء رطب باهت قريب من مخرج الحمام.",
    analysis:
      "اتجاه الأثر من داخل الحمام ناحية جهة الكوفي شوب، بدون ما يحدد صاحبه بشكل مؤكد.",
    targetSuspects: ["lt-jassim"],
  },
  {
    id: "lt-coffee-cam",
    title: "كاميرا مدخل الكوفي",
    view: "coffee",
    observation: "كاميرا صغيرة فوق مدخل الكوفي شوب، تسجيلها موجود.",
    analysis:
      "التسجيل يبيّن جاسم يدخل منطقة الكوفي شوب جاي من جهة حاوية الزبالة اللي برّه.",
    targetSuspects: ["lt-jassim", "lt-mishal"],
  },
];

export function getLastTripEvidence(id: string): LastTripEvidence | undefined {
  return lastTripEvidence.find((e) => e.id === id);
}

/** أدلة هذا المشتبه فيه فقط، من ضمن اللي انفتح فعلاً. */
export function lastTripEvidenceForSuspect(suspectId: string, unlockedIds: string[]) {
  return lastTripEvidence.filter(
    (e) => unlockedIds.includes(e.id) && e.targetSuspects.includes(suspectId),
  );
}

/** هل هذا الدليل يخص هذا المشتبه فيه ومفتوح فعلاً؟ */
export function isLastTripEvidenceUsable(
  suspectId: string,
  evidenceId: string,
  unlockedIds: string[],
) {
  const item = getLastTripEvidence(evidenceId);
  return !!item && unlockedIds.includes(evidenceId) && item.targetSuspects.includes(suspectId);
}
