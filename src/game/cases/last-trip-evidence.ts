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
  },
  {
    id: "lt-tissue",
    title: "الكلينكس المستخدم",
    view: "trash",
    observation: "منديل مستخدم ومبلل جزئياً.",
    analysis: "الأثر الموجود على المنديل يتطابق مع الأثر المتبقي على حنفية الحمام الطرفي.",
  },
  {
    id: "lt-corridor-cam",
    title: "كاميرا الممر",
    view: "corridor",
    observation: "الكاميرا تغطي الممر المؤدي للحمامات، لكنها لا تصور داخل الحمام.",
    analysis:
      "التسجيل يبيّن شخصين غير محددي الهوية يتوجهون ناحية الحمام الطرفي بفارق وقت قصير، وبعدها بفترة يرجع شخص واحد باتجاه الكوفي شوب.",
  },
  {
    id: "lt-coffee-cup",
    title: "كوب قهوة جاسم",
    view: "coffee",
    observation: "كوب قهوة من نفس الكوفي الموجود بالمحطة.",
    analysis:
      "وقت الطلب على الفاتورة ما يتوافق مع كلام جاسم إنه بقى بالكوفي شوب بدون ما يطلع.",
  },
  {
    id: "lt-call-log",
    title: "سجل مكالمة عبدالله",
    view: "parking",
    observation: "بيانات جهاز عبدالله تبيّن مكالمة طويلة بنفس الفترة… وفيها انقطاع قصير.",
    analysis: "الانقطاع القصير ما له تفسير حتى الآن.",
  },
  {
    id: "lt-shoe-print",
    title: "أثر الحذاء الرطب",
    view: "farBath",
    observation: "أثر حذاء رطب باهت قريب من مخرج الحمام.",
    analysis:
      "اتجاه الأثر من داخل الحمام ناحية جهة الكوفي شوب، بدون ما يحدد صاحبه بشكل مؤكد.",
  },
  {
    id: "lt-coffee-cam",
    title: "كاميرا مدخل الكوفي",
    view: "coffee",
    observation: "كاميرا صغيرة فوق مدخل الكوفي شوب، تسجيلها موجود.",
    analysis:
      "التسجيل يبيّن جاسم يدخل منطقة الكوفي شوب جاي من جهة حاوية الزبالة اللي برّه.",
  },
];

export function getLastTripEvidence(id: string): LastTripEvidence | undefined {
  return lastTripEvidence.find((e) => e.id === id);
}
