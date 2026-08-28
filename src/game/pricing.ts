/**
 * إعدادات الشراء والسعر — مكان واحد للتغيير.
 *
 * كل الأسعار وطرق الدفع وحالة بوابة الدفع تُقرأ من هنا (أو من عمود
 * `cases.price_kwd` بالقاعدة عند تعبئته)، فما نثبّت أي رقم داخل الواجهة.
 *
 * مهم: هذا الملف للعرض والتهيئة فقط. فتح القضية كاملة يعتمد **حصراً** على
 * حالة الملكية من الخادم (`has_case_entitlement` + جدول `case_purchases`).
 */

export type PaymentMethodId = "knet" | "card" | "apple-pay";

export interface PaymentMethodConfig {
  id: PaymentMethodId;
  label: string;
  hint: string;
  /** مفعّلة فعلياً بعد ربط بوابة الدفع. */
  enabled: boolean;
}

export interface CasePricing {
  caseId: string;
  /** السعر بالدينار الكويتي. */
  amount: number;
  currency: string;
  /** صيغة العرض. */
  currencyLabel: string;
  /** نص بديل يظهر لو ما فيه سعر بعد. */
  note?: string;
}

/** حالة بوابة الدفع. تتغيّر لـ"live" بعد ربط المزوّد الحقيقي. */
export const PAYMENT_GATEWAY = {
  /** "unconfigured" = ما فيه مزوّد دفع بعد. */
  status: "unconfigured" as "unconfigured" | "sandbox" | "live",
  /** اسم المزوّد بعد الربط (Paddle / Stripe / MyFatoorah ...). */
  provider: null as string | null,
  /** بريد الدعم اللي يظهر للاعب لو احتاج مساعدة. */
  supportContact: "support@wara-alsalfa.com",
};

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  { id: "knet", label: "كي نت", hint: "بطاقة كويتية", enabled: false },
  { id: "card", label: "بطاقة ائتمان", hint: "فيزا / ماستركارد", enabled: false },
  { id: "apple-pay", label: "Apple Pay", hint: "دفع سريع من الجوال", enabled: false },
];

/**
 * السعر المعروض داخل الواجهة فقط (بالدينار الكويتي).
 * السعر الحقيقي عند الدفع يبقى كما هو في Paddle (USD) — ما نغيّره من هنا.
 */
export const CASE_PRICING: CasePricing[] = [
  {
    caseId: "last-trip",
    amount: 3,
    currency: "KWD",
    currencyLabel: "د.ك",
  },
  {
    caseId: "last-night",
    amount: 3,
    currency: "KWD",
    currencyLabel: "د.ك",
  },
];

export const getCasePricing = (caseId: string): CasePricing | null =>
  CASE_PRICING.find((p) => p.caseId === caseId) ?? null;

/** نص السعر المعروض داخل الواجهة. */
export function formatCasePrice(caseId: string, _dbPrice?: number | null): string {
  const cfg = getCasePricing(caseId);
  if (!cfg?.amount) return cfg?.note ?? "السعر يُحدد قريباً";

  if (cfg.currency === "USD") return `${cfg.currencyLabel}${cfg.amount.toFixed(2)} USD`;
  return `${cfg.amount.toFixed(3)} ${cfg.currencyLabel}`;
}
