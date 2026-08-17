/**
 * صلاحيات الأدوار — تربط كل دور موجود بأدواته وواجهته فقط.
 * ما تغيّر توزيع الأدوار ولا القصة ولا الأدلة: بس تحدد منو يشوف أي أداة.
 */

export interface RoleAccess {
  /** لوحة الأدلة المكتشفة. */
  evidenceBoard: boolean;
  /** ربط دليلين وتحليل العلاقة. */
  linkEvidence: boolean;
  /** استجواب المشتبه فيهم + مؤشر التوتر + المواجهات. */
  interrogate: boolean;
  /** الملاحظات الجنائية التفصيلية لكل دليل. */
  forensics: boolean;
  /** سجل الكاميرات والتحركات والأوقات. */
  surveillance: boolean;
  /** الجدول الزمني والتعارضات الزمنية. */
  timeline: boolean;
  /** سجل الأقوال وملخص القضية النهائي. */
  records: boolean;
  /** قائمة التناقضات المشتركة. */
  contradictions: boolean;
}

const NONE: RoleAccess = {
  evidenceBoard: false,
  linkEvidence: false,
  interrogate: false,
  forensics: false,
  surveillance: false,
  timeline: false,
  records: false,
  contradictions: false,
};

const ALL: RoleAccess = {
  evidenceBoard: true,
  linkEvidence: true,
  interrogate: true,
  forensics: true,
  surveillance: true,
  timeline: true,
  records: true,
  contradictions: true,
};

const MAP: Record<string, RoleAccess> = {
  detective: { ...NONE, evidenceBoard: true, linkEvidence: true, contradictions: true },
  interrogator: { ...NONE, interrogate: true, evidenceBoard: true, contradictions: true },
  forensics: { ...NONE, evidenceBoard: true, forensics: true },
  surveillance: { ...NONE, surveillance: true },
  timeline: { ...NONE, timeline: true },
  records: { ...NONE, records: true, contradictions: true },
};

/**
 * صلاحيات لاعب حسب دوره. لو ما عنده دور (لعب فردي أو قبل توزيع الأدوار)
 * يشوف كل الأدوات مثل ما كان قبل.
 */
export function accessFor(roleId?: string | null): RoleAccess {
  if (!roleId) return { ...ALL };
  return MAP[roleId] ? { ...MAP[roleId]! } : { ...ALL };
}
