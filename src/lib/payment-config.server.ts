/**
 * إعدادات Paddle — سيرفر فقط.
 *
 * كل المفاتيح والأسعار تُقرأ من متغيرات البيئة، فما فيه أي سر في حزمة العميل.
 * عند ربط بوابة الدفع الحقيقية، تُضاف المتغيرات في Project Settings → Secrets.
 */

export type PaddleEnv = "sandbox" | "live";

export interface PaddleCheckoutPayload {
  items: unknown[];
  custom_data: {
    user_id: string;
    case_id: string;
    room: string | null;
  };
  currency_code: string;
  collection_mode: "automatic";
  discount_id?: string;
  checkout?: {
    url?: string | null;
  };
}

function getApiKey(): string | undefined {
  return process.env["PADDLE_API_KEY"];
}

function getWebhookSecret(): string | undefined {
  return process.env["PADDLE_WEBHOOK_SECRET"];
}

function getEnv(): PaddleEnv {
  const raw = process.env["PADDLE_ENV"];
  return raw === "live" ? "live" : "sandbox";
}

export function isPaddleConfigured(): boolean {
  return !!getApiKey() && !!getWebhookSecret();
}

export function getGatewayStatus(): "unconfigured" | "sandbox" | "live" {
  if (!isPaddleConfigured()) return "unconfigured";
  return getEnv();
}

export function getGatewayProvider(): string | null {
  return isPaddleConfigured() ? "Paddle" : null;
}

export function getPaddleBaseUrl(): string {
  return getEnv() === "live" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";
}

/**
 * يبني جسم طلب Paddle transaction مع custom_data إجبارية.
 * هذه الدالة هي المسؤولة الوحيدة عن إنشاء الـ checkout، ولا تسمح أبداً
 * بإرسال طلب بدون user_id و case_id.
 */
export function buildPaddleCheckoutPayload(
  caseId: string,
  userId: string,
  options: {
    room?: string | null;
    productName: string;
    productDescription?: string;
  },
): PaddleCheckoutPayload {
  if (!userId || !caseId) {
    throw new Error("Paddle checkout requires user_id and case_id in custom_data");
  }

  const priceId = process.env["PADDLE_PRICE_ID"];
  const currency = (process.env["PADDLE_CURRENCY"] || "USD").toUpperCase();
  const amountCents = Number(process.env["PADDLE_UNIT_AMOUNT_CENTS"] || "0");

  let items: unknown[];

  if (priceId) {
    // استخدام سعر من كتالوج Paddle (الأسهل للتغيير لاحقاً من لوحة Paddle).
    items = [{ price_id: priceId, quantity: 1 }];
  } else if (amountCents > 0) {
    // سعر غير كتالوجي — مفيد للاختبار السريع قبل إنشاء الـ catalog.
    items = [
      {
        quantity: 1,
        price: {
          description: options.productDescription ?? options.productName,
          unit_price: {
            amount: String(amountCents),
            currency_code: currency,
          },
          product: {
            name: options.productName,
            description: options.productDescription ?? options.productName,
            tax_category: "digital-goods",
          },
        },
      },
    ];
  } else {
    throw new Error(
      "Paddle checkout requires either PADDLE_PRICE_ID or PADDLE_UNIT_AMOUNT_CENTS to be set",
    );
  }

  const returnUrl = process.env["PADDLE_RETURN_URL"];

  return {
    items,
    custom_data: {
      user_id: userId,
      case_id: caseId,
      room: options.room ?? null,
    },
    currency_code: currency,
    collection_mode: "automatic",
    ...(returnUrl ? { checkout: { url: returnUrl } } : {}),
  };
}

/**
 * الخصم (اختياري) — يُطبّق من الخادم.
 *
 * ملاحظة مهمة: عند إنشاء transaction عبر API، صفحة الدفع المستضافة لا تعرض
 * خانة الكوبون؛ الخصم لازم يُربط بالـtransaction نفسه. لذلك نقرأ
 * PADDLE_DISCOUNT_ID أو PADDLE_DISCOUNT_CODE ونحوّل الكود لـid قبل الإنشاء.
 */
async function resolveDiscountId(apiKey: string): Promise<string | null> {
  const explicitId = process.env["PADDLE_DISCOUNT_ID"];
  if (explicitId) return explicitId;

  const code = process.env["PADDLE_DISCOUNT_CODE"];
  if (!code) return null;

  try {
    const res = await fetch(
      `${getPaddleBaseUrl()}/discounts?code=${encodeURIComponent(code)}&status=active`,
      { headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" } },
    );
    const body = (await res.json()) as { data?: Array<{ id?: string; code?: string }> };
    if (!res.ok || !body.data?.length) {
      console.error("[paddle] discount lookup failed", res.status);
      return null;
    }
    const match =
      body.data.find((d) => d.code?.toUpperCase() === code.toUpperCase()) ?? body.data[0];
    return match?.id ?? null;
  } catch (err) {
    console.error("[paddle] discount lookup error", err);
    return null;
  }
}

/**
 * ينشئ transaction في Paddle ويرجع رابط الدفع.
 * custom_data تُمرّر دائماً من الخادم، ولا يُعتمد على أي بيانات من العميل.
 */
export async function createPaddleCheckout(
  caseId: string,
  userId: string,
  options: {
    room?: string | null;
    productName: string;
    productDescription?: string;
  },
): Promise<{ transactionId: string; checkoutUrl: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Paddle API key is not configured");
  }

  const payload = buildPaddleCheckoutPayload(caseId, userId, options);

  const discountId = await resolveDiscountId(apiKey);
  if (discountId) {
    payload.discount_id = discountId;
  }

  // وضع الاختبار: نرفض أي عملية مبلغها أكبر من صفر (حماية من سحب حقيقي).
  const requireZeroTotal = process.env["PADDLE_REQUIRE_ZERO_TOTAL"] === "true";
  if (requireZeroTotal && !discountId) {
    console.error("[paddle] zero-total test mode enabled but no discount resolved");
    throw new Error("paddle_zero_total_discount_missing");
  }

  const res = await fetch(`${getPaddleBaseUrl()}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = (await res.json()) as {
    data?: {
      id?: string;
      url?: string;
      checkout?: { url?: string };
      details?: { totals?: { grand_total?: string } };
    };
    error?: unknown;
  };

  if (!res.ok || !body.data) {
    console.error("[paddle] create transaction failed", res.status, body.error ?? body);
    throw new Error("paddle_checkout_failed");
  }

  const transactionId = body.data.id ?? "";
  const checkoutUrl = body.data.url ?? body.data.checkout?.url ?? "";

  if (!transactionId || !checkoutUrl) {
    console.error("[paddle] transaction created but missing id/url", body.data);
    throw new Error("paddle_checkout_incomplete");
  }

  const grandTotal = body.data.details?.totals?.grand_total;
  if (requireZeroTotal && grandTotal !== "0" && Number(grandTotal ?? -1) !== 0) {
    console.error("[paddle] zero-total test mode: refusing non-zero checkout", {
      transactionId,
      grandTotal,
    });
    throw new Error("paddle_non_zero_total_blocked");
  }


  return { transactionId, checkoutUrl };
}
