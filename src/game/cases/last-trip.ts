/**
 * قضية «آخر رحلة» — هيكل بيانات مستقل تماماً.
 *
 * القضية قيد التجهيز: المحتوى (الضحية، المشتبهين، الأدلة، مسرح الجريمة،
 * التسلسل الزمني، ملفات الاستجواب، التناقضات، القاتل، الكشف النهائي) بينضاف
 * هنا لاحقاً. لا تستخدم أبداً أي بيانات من «قضية الشاليه» بهذي القضية.
 *
 * محرك اللعبة المشترك (الغرف الجماعية، الأدوار، التناوب، دفتر القضية، النقاش،
 * التصويت النهائي، التقييم) يُعاد استخدامه كما هو بدون تعديل.
 */

export const LAST_TRIP_CASE_ID = "last-trip";

export interface CaseContentStub {
  id: string;
  title: string;
  code: string;
  /** الضحية — يُضاف لاحقاً. */
  victim: null;
  /** المشتبهون — تُضاف لاحقاً. */
  suspects: never[];
  /** مشاهد المقدمة السينمائية — تُضاف لاحقاً. */
  intro: never[];
  /** التسلسل الزمني — يُضاف لاحقاً. */
  timeline: never[];
  /** مشاهد مسرح الجريمة (رسم بياني للتنقل) — تُضاف لاحقاً. */
  scenes: never[];
  /** الأدلة — تُضاف لاحقاً. */
  evidence: never[];
  /** ملفات الاستجواب (شخصيات الذكاء الاصطناعي) — تُضاف لاحقاً. */
  interrogationProfiles: never[];
  /** التناقضات المزروعة — تُضاف لاحقاً. */
  contradictions: never[];
  /** القاتل — يُضاف لاحقاً. */
  culprit: null;
  /** الكشف النهائي — يُضاف لاحقاً. */
  reveal: null;
}

/** ملف القضية (فاضي حالياً — القضية غير قابلة للعب). */
export const lastTripCase: CaseContentStub = {
  id: LAST_TRIP_CASE_ID,
  title: "آخر رحلة",
  code: "K-0472",
  victim: null,
  suspects: [],
  intro: [],
  timeline: [],
  scenes: [],
  evidence: [],
  interrogationProfiles: [],
  contradictions: [],
  culprit: null,
  reveal: null,
};

/** القضية جاهزة للعب؟ تبقى false لين يكتمل المحتوى. */
export const LAST_TRIP_PLAYABLE = false;
