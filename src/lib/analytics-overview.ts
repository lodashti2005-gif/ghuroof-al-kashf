/**
 * أنواع تقرير التسويق والمبيعات في لوحة المالك.
 *
 * كل قيمة `null` تعني «لا توجد بيانات تاريخية لهذا الحدث» — ما نقدّر ولا نخترع أرقام.
 */

/** تاريخ إطلاق الإعلانات الرسمي — بداية العرض الافتراضي. */
export const ADS_LAUNCH_DATE = "2026-08-29";

export interface FunnelStage {
  key: string;
  label: string;
  /** null = ما كان يُسجَّل سابقاً. */
  count: number | null;
  /** نسبة الانتقال من المرحلة السابقة (٠-١٠٠) أو null. */
  fromPrevPct: number | null;
  /** نسبة التحويل من أول مرحلة (٠-١٠٠) أو null. */
  overallPct: number | null;
  /** مصدر الرقم: بيانات مسجّلة فعلياً أو حدث جديد بدأ تسجيله الآن. */
  available: boolean;
  note: string;
}

export interface SourceRow {
  source: string;
  visitors: number;
  sessions: number;
  startedTrial: number;
  reachedPurchase: number;
  buyers: number;
  conversionPct: number;
}

export interface AnalyticsMetric {
  key: string;
  label: string;
  value: number | null;
  note: string;
}

/** مرحلة توقّف: كم زائر وصل لها وما كمل للمرحلة اللي بعدها. */
export interface DropoffStage {
  key: string;
  /** «فتح قضية ولم يبدأ التجربة» */
  label: string;
  /** عدد الزوار اللي وصلوا لهذه المرحلة (أو null إذا الحدث ما كان يُسجَّل). */
  reached: number | null;
  /** عدد اللي توقفوا هنا ولم يكملوا. */
  droppedHere: number | null;
  /** نسبة الوصول من إجمالي الزوار الحقيقيين. */
  reachedPct: number | null;
  /** نسبة التوقف من إجمالي الزوار الحقيقيين. */
  droppedPct: number | null;
  available: boolean;
  note: string;
}

/** رحلة زائر حقيقي واحد بالترتيب. */
export interface VisitorJourney {
  visitorId: string;
  source: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
  /** مفاتيح المراحل اللي وصلها بالترتيب. */
  stages: string[];
  /** آخر مرحلة وصلها (نص عربي). */
  lastStageLabel: string;
  firstSeen: string;
  lastSeen: string;
}


export interface AnalyticsReport {
  allowed: boolean;
  /** بداية الفترة المعروضة (ISO). */
  since: string;
  /** أقدم حدث تتبّع موجود فعلياً في القاعدة. */
  earliestEventAt: string | null;
  /** أقدم حساب مسجّل. */
  earliestUserAt: string | null;
  /** أنواع الأحداث الموجودة فعلياً قبل الآن. */
  recordedEventTypes: string[];
  /** أحداث بدأ تسجيلها من الآن (ما لها بيانات تاريخية). */
  newlyTrackedEventTypes: string[];
  metrics: AnalyticsMetric[];
  funnel: FunnelStage[];
  sources: SourceRow[] | null;
  sourcesTracked: boolean;
  revenue: { currency: string; amount: number }[];
  ownerRevenue: { currency: string; amount: number }[];
  excluded: {
    users: number;
    visitors: number;
    ownerPurchases: number;
    excludedEvents: number;
  };
}

export const emptyAnalyticsReport: AnalyticsReport = {
  allowed: false,
  since: `${ADS_LAUNCH_DATE}T00:00:00.000Z`,
  earliestEventAt: null,
  earliestUserAt: null,
  recordedEventTypes: [],
  newlyTrackedEventTypes: [],
  metrics: [],
  funnel: [],
  sources: null,
  sourcesTracked: false,
  revenue: [],
  ownerRevenue: [],
  excluded: { users: 0, visitors: 0, ownerPurchases: 0, excludedEvents: 0 },
};

export const SOURCE_LABEL: Record<string, string> = {
  tiktok: "TikTok",
  snapchat: "Snapchat",
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "X / Twitter",
  google: "Google",
  whatsapp: "WhatsApp",
  direct: "دخول مباشر",
  other: "أخرى",
  unknown: "غير معروف",
};
