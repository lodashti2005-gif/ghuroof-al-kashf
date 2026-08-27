/**
 * إعدادات MyFatoorah — سيرفر فقط.
 *
 * كل المفاتيح تُقرأ من متغيرات البيئة (Secrets) داخل دوال تُنفّذ على الخادم،
 * فما فيه أي سر يوصل حزمة المتصفح. حالياً ما فيه مفتاح حقيقي، فالبوابة
 * تُعتبر "غير مربوطة" ولا يصير أي نداء خارجي ولا أي عملية دفع حقيقية.
 *
 * الأسرار المطلوبة لاحقاً:
 *   MYFATOORAH_API_KEY        مفتاح API (سيرفر فقط)
 *   MYFATOORAH_ENV            test | live
 *   MYFATOORAH_WEBHOOK_SECRET سر التوقيع لإشعارات MyFatoorah
 *   MYFATOORAH_CALLBACK_URL   رابط الرجوع بعد نجاح الدفع
 *   MYFATOORAH_ERROR_URL      رابط الرجوع بعد فشل/إلغاء الدفع
 */

export type MyFatoorahEnv = "test" | "live";

export interface MyFatoorahInvoiceRequest {
  caseId: string;
  userId: string;
  amount: number;
  currency: string;
  productName: string;
  /** رمز الغرفة إن كان الشراء من داخل غرفة — للرجوع لنفس المكان. */
  room?: string | null;
  /** مرجع عمليتنا الداخلي (id صف case_purchases). */
  purchaseId: string;
}

export interface MyFatoorahInvoiceResult {
  invoiceId: string;
  paymentUrl: string;
}

function getApiKey(): string | undefined {
  return process.env["MYFATOORAH_API_KEY"];
}

export function getMyFatoorahWebhookSecret(): string | undefined {
  return process.env["MYFATOORAH_WEBHOOK_SECRET"];
}

export function getMyFatoorahEnv(): MyFatoorahEnv {
  return process.env["MYFATOORAH_ENV"] === "live" ? "live" : "test";
}

export function isMyFatoorahConfigured(): boolean {
  return !!getApiKey();
}

export function getMyFatoorahStatus(): "unconfigured" | "test" | "live" {
  if (!isMyFatoorahConfigured()) return "unconfigured";
  return getMyFatoorahEnv();
}

export function getMyFatoorahBaseUrl(): string {
  return getMyFatoorahEnv() === "live"
    ? "https://api.myfatoorah.com"
    : "https://apitest.myfatoorah.com";
}

/**
 * ينشئ فاتورة دفع في MyFatoorah ويرجّع رابط الدفع.
 *
 * الآن: الحساب لِسِه ما تفعّل وما فيه مفتاح، فالدالة ترمي
 * `myfatoorah_unconfigured` بدون أي نداء شبكة. الكود الحقيقي معزول هنا
 * فقط — وقت ما نضيف المفتاح ما نحتاج نعدّل أي شيء بالواجهة.
 */
export async function createMyFatoorahInvoice(
  req: MyFatoorahInvoiceRequest,
): Promise<MyFatoorahInvoiceResult> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("myfatoorah_unconfigured");
  if (!req.userId || !req.caseId || !req.purchaseId || !(req.amount > 0)) {
    throw new Error("myfatoorah_invalid_request");
  }

  const callbackUrl = process.env["MYFATOORAH_CALLBACK_URL"];
  const errorUrl = process.env["MYFATOORAH_ERROR_URL"] ?? callbackUrl;
  if (!callbackUrl) throw new Error("myfatoorah_missing_callback_url");

  const res = await fetch(`${getMyFatoorahBaseUrl()}/v2/SendPayment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      NotificationOption: "LNK",
      InvoiceValue: req.amount,
      DisplayCurrencyIso: req.currency,
      CustomerReference: req.purchaseId,
      // UserDefinedField يرجع لنا مع الإشعار — نحتاجه للتحقق من صاحب العملية.
      UserDefinedField: JSON.stringify({
        purchase_id: req.purchaseId,
        user_id: req.userId,
        case_id: req.caseId,
        room: req.room ?? null,
      }),
      CallBackUrl: callbackUrl,
      ErrorUrl: errorUrl,
      InvoiceItems: [{ ItemName: req.productName, Quantity: 1, UnitPrice: req.amount }],
    }),
  });

  const body = (await res.json()) as {
    IsSuccess?: boolean;
    Data?: { InvoiceId?: number | string; InvoiceURL?: string };
  };

  const invoiceId = body.Data?.InvoiceId != null ? String(body.Data.InvoiceId) : "";
  const paymentUrl = body.Data?.InvoiceURL ?? "";

  if (!res.ok || body.IsSuccess !== true || !invoiceId || !paymentUrl) {
    console.error("[myfatoorah] create invoice failed", res.status);
    throw new Error("myfatoorah_invoice_failed");
  }

  return { invoiceId, paymentUrl };
}

export type MyFatoorahPaymentState = "paid" | "failed" | "cancelled" | "pending";

export interface MyFatoorahVerification {
  state: MyFatoorahPaymentState;
  invoiceId: string | null;
  amount: number | null;
  currency: string | null;
  userDefinedField: string | null;
  raw: unknown;
}

/**
 * التحقق من حالة الدفع من الخادم مباشرة عند MyFatoorah.
 *
 * هذي هي **المصدر الوحيد للحقيقة**: رجوع المستخدم للصفحة أو أي قيمة من
 * الواجهة ما تفتح أي قضية إطلاقاً.
 */
export async function verifyMyFatoorahPayment(
  key: string,
  keyType: "PaymentId" | "InvoiceId",
): Promise<MyFatoorahVerification> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("myfatoorah_unconfigured");

  const res = await fetch(`${getMyFatoorahBaseUrl()}/v2/GetPaymentStatus`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ Key: key, KeyType: keyType }),
  });

  const body = (await res.json()) as {
    IsSuccess?: boolean;
    Data?: {
      InvoiceId?: number | string;
      InvoiceStatus?: string;
      InvoiceValue?: number | string;
      InvoiceDisplayValue?: string;
      DisplayCurrencyIso?: string;
      UserDefinedField?: string;
    };
  };

  if (!res.ok || body.IsSuccess !== true || !body.Data) {
    console.error("[myfatoorah] verify failed", res.status);
    throw new Error("myfatoorah_verify_failed");
  }

  const status = (body.Data.InvoiceStatus ?? "").toLowerCase();
  const state: MyFatoorahPaymentState =
    status === "paid"
      ? "paid"
      : status === "canceled" || status === "cancelled" || status === "expired"
        ? "cancelled"
        : status === "failed"
          ? "failed"
          : "pending";

  return {
    state,
    invoiceId: body.Data.InvoiceId != null ? String(body.Data.InvoiceId) : null,
    amount: body.Data.InvoiceValue != null ? Number(body.Data.InvoiceValue) : null,
    currency: body.Data.DisplayCurrencyIso ?? null,
    userDefinedField: body.Data.UserDefinedField ?? null,
    raw: body.Data,
  };
}
