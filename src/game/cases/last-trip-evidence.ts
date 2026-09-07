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
  titleEn: string;
  /** المشهد اللي فيه الدليل. */
  view: string;
  /** الملاحظة الأولية عند الاكتشاف. */
  observation: string;
  observationEn: string;
  /** فحص/تحليل لاحق — يبقى مخفي لهذي المرحلة. */
  analysis: string;
  analysisEn: string;
  /** المشتبه فيهم اللي هذا الدليل يخصهم — المواجهة تظهر عندهم فقط. */
  targetSuspects: string[];
}

export const LAST_TRIP_EVIDENCE_TOTAL = 7;

export const lastTripEvidence: LastTripEvidence[] = [
  {
    id: "lt-faucet",
    title: "الحنفية",
    titleEn: "The Faucet",
    view: "farSink",
    observation: "جزء من الحنفية أنظف من باقي المغسلة بشكل لافت.",
    observationEn: "Part of the faucet is noticeably cleaner than the rest of the sink.",
    analysis:
      "توجد علامات تدل على أن الحنفية مُسحت حديثاً، مع بقايا أثر في منطقة يصعب تنظيفها.",
    analysisEn:
      "There are signs the faucet was recently wiped down, with a faint residue left in a hard-to-clean spot.",
    targetSuspects: ["lt-jassim"],
  },
  {
    id: "lt-tissue",
    title: "الكلينكس المستخدم",
    titleEn: "The Used Tissue",
    view: "trashOpen",
    observation: "منديل مستخدم ومبلل جزئياً.",
    observationEn: "A used tissue, partially damp.",
    analysis: "الأثر الموجود على المنديل يتطابق مع الأثر المتبقي على حنفية الحمام الطرفي.",
    analysisEn:
      "The residue on the tissue matches the residue left on the far bathroom's faucet.",
    targetSuspects: ["lt-jassim", "lt-mishal"],
  },
  {
    id: "lt-corridor-cam",
    title: "كاميرا الممر",
    titleEn: "The Corridor Camera",
    view: "corridor",
    observation: "الكاميرا تغطي الممر المؤدي للحمامات، لكنها لا تصور داخل الحمام.",
    observationEn:
      "The camera covers the corridor leading to the bathrooms, but doesn't film inside them.",
    analysis:
      "التسجيل يبيّن شخصين غير محددي الهوية يتوجهون ناحية الحمام الطرفي بفارق وقت قصير، وبعدها بفترة يرجع شخص واحد باتجاه الكوفي شوب.",
    analysisEn:
      "The footage shows two unidentified figures heading toward the far bathroom a short time apart, and later, one person walking back toward the coffee shop.",
    targetSuspects: ["lt-jassim", "lt-nasser", "lt-abdullah"],
  },
  {
    id: "lt-coffee-cup",
    title: "كوب قهوة جاسم",
    titleEn: "Jassim's Coffee Cup",
    view: "coffee",
    observation: "كوب قهوة من نفس الكوفي الموجود بالمحطة.",
    observationEn: "A coffee cup from the same coffee shop at the station.",
    analysis:
      "وقت الطلب على الفاتورة ما يتوافق مع كلام جاسم إنه بقى بالكوفي شوب بدون ما يطلع.",
    analysisEn:
      "The order time on the receipt doesn't match Jassim's claim that he stayed in the coffee shop the whole time.",
    targetSuspects: ["lt-jassim"],
  },
  {
    id: "lt-call-log",
    title: "سجل مكالمة عبدالله",
    titleEn: "Abdullah's Call Log",
    view: "abdullah-file",
    observation: "بيانات جهاز عبدالله تبيّن مكالمة طويلة بنفس الفترة… وفيها انقطاع قصير.",
    observationEn:
      "Abdullah's phone data shows a long call during that period… with a short gap in it.",
    analysis: "الانقطاع القصير ما له تفسير حتى الآن.",
    analysisEn: "The short gap has no explanation so far.",
    targetSuspects: ["lt-abdullah"],
  },
  {
    id: "lt-shoe-print",
    title: "أثر الحذاء الرطب",
    titleEn: "The Wet Shoe Print",
    view: "farBath",
    observation: "أثر حذاء رطب باهت قريب من مخرج الحمام.",
    observationEn: "A faint wet shoe print near the bathroom exit.",
    analysis:
      "اتجاه الأثر من داخل الحمام ناحية جهة الكوفي شوب، بدون ما يحدد صاحبه بشكل مؤكد.",
    analysisEn:
      "The print's direction runs from inside the bathroom toward the coffee shop, without confirming whose it is.",
    targetSuspects: ["lt-jassim"],
  },
  {
    id: "lt-coffee-cam",
    title: "كاميرا مدخل الكوفي",
    titleEn: "The Coffee Shop Entrance Camera",
    view: "coffee",
    observation: "كاميرا صغيرة فوق مدخل الكوفي شوب، تسجيلها موجود.",
    observationEn: "A small camera above the coffee shop entrance, with footage available.",
    analysis:
      "التسجيل يبيّن جاسم يدخل منطقة الكوفي شوب جاي من جهة حاوية الزبالة اللي برّه.",
    analysisEn:
      "The footage shows Jassim entering the coffee shop area coming from the direction of the trash bin outside.",
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
