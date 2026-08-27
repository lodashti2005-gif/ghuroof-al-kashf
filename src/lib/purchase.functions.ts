/**
 * حالة الشراء والملكية — من الخادم فقط.
 *
 * الواجهة ما تقدر تفتح أي قضية: كل ما تسويه هذي الدوال هو **قراءة** حالة
 * الملكية الموثوقة (`has_case_entitlement` + `case_purchases`) وحالة بوابة
 * الدفع. لا يوجد أي مسار يمنح ملكية من العميل — وقت ربط البوابة الحقيقية،
 * المزوّد هو اللي يكتب صف الشراء (webhook) وهذي الدوال تشوفه تلقائياً.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const caseInput = z.object({
  caseId: z.string().min(1).max(64),
  room: z.string().min(1).max(16).optional(),
});

export interface CaseEntitlementResult {
  caseId: string;
  /** يقدر يلعب النسخة الكاملة (مجانية أو مشتراة) — قرار الخادم. */
  entitled: boolean;
  /** فيه شراء مدفوع فعلاً بحساب المستخدم. */
  purchased: boolean;
  /** حالة آخر عملية شراء إن وجدت: pending / paid / failed ... */
  purchaseStatus: string | null;
  /** القضية مفتوحة للجميع. */
  free: boolean;
  /** السعر من القاعدة إن كان معبّأ. */
  priceKwd: number | null;
  title: string | null;
  /** حالة بوابة الدفع من الخادم (ليس ثابتاً في الواجهة). */
  gatewayStatus: "unconfigured" | "sandbox" | "live";
  /** اسم المزوّد إذا كانت البوابة مربوطة. */
  provider: string | null;
}

export const getCaseEntitlement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => caseInput.parse(data))
  .handler(async ({ data, context }): Promise<CaseEntitlementResult> => {
    const { supabase, userId } = context;

    const [{ data: caseRow }, { data: purchase }, { data: entitled }] = await Promise.all([
      supabase
        .from("cases")
        .select("id, title, is_free, price_kwd")
        .eq("id", data.caseId)
        .maybeSingle(),
      supabase
        .from("case_purchases")
        .select("status, purchased_at")
        .eq("case_id", data.caseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.rpc("has_case_entitlement", { _user_id: userId, _case_id: data.caseId }),
    ]);

    const { getGatewayStatus, getGatewayProvider } = await import("@/lib/payment-config.server");

    return {
      caseId: data.caseId,
      entitled: entitled === true,
      purchased: purchase?.status === "paid",
      purchaseStatus: purchase?.status ?? null,
      free: caseRow?.is_free ?? false,
      priceKwd: caseRow?.price_kwd != null ? Number(caseRow.price_kwd) : null,
      title: caseRow?.title ?? null,
      gatewayStatus: getGatewayStatus(),
      provider: getGatewayProvider(),
    };
  });

export type PurchaseIntentStatus =
  | "already_owned"
  | "gateway_unconfigured"
  | "awaiting_payment";

export interface PurchaseIntentResult {
  status: PurchaseIntentStatus;
  /** رابط الدفع من المزوّد — يمتلئ بعد ربط البوابة. */
  checkoutUrl: string | null;
  /** رقم العملية في Paddle — يُستخدم لفتح Paddle Checkout داخل الموقع. */
  transactionId: string | null;
  message: string;
}

/**
 * بدء عملية شراء.
 *
 * - لو المستخدم يملك القضية: يرجع already_owned.
 * - لو بوابة الدفع غير مربوطة: يرجع gateway_unconfigured (لا يمنح ملكية).
 * - لو Paddle مربوط: ينشئ transaction في Paddle مع custom_data إجبارية
 *   (user_id + case_id) ويرجع رابط checkout للدفع.
 */
export const startCasePurchase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => caseInput.parse(data))
  .handler(async ({ data, context }): Promise<PurchaseIntentResult> => {
    const { supabase, userId } = context;

    const { data: entitled } = await supabase.rpc("has_case_entitlement", {
      _user_id: userId,
      _case_id: data.caseId,
    });
    if (entitled === true) {
      return {
        status: "already_owned",
        checkoutUrl: null,
        transactionId: null,
        message: "القضية مفتوحة على حسابك — تقدر تكمل من نفس المكان.",
      };
    }

    const {
      isPaddleConfigured,
      createPaddleCheckout,
      getGatewayStatus,
    } = await import("@/lib/payment-config.server");

    if (!isPaddleConfigured() || getGatewayStatus() === "unconfigured") {
      return {
        status: "gateway_unconfigured",
        checkoutUrl: null,
        transactionId: null,
        message:
          "بوابة الدفع لِسِه ما تربطت. طلبك محفوظ عندنا، وأول ما تتفعّل البوابة تقدر تكمل الدفع وتفتح القضية كاملة بنفس الغرفة ونفس التقدم.",
      };
    }

    const caseRow = await supabase
      .from("cases")
      .select("id, title")
      .eq("id", data.caseId)
      .maybeSingle();

    const productName = caseRow.data?.title ?? `Case: ${data.caseId}`;

    // إنشاء checkout Paddle — هذه الدالة تضمن دائماً وجود custom_data.
    const { transactionId, checkoutUrl } = await createPaddleCheckout(data.caseId, userId, {
      room: data.room ?? null,
      productName,
      productDescription: `شراء قضية "${productName}" في ورا السالفة`,
    });

    // بعد نجاح إنشاء الـcheckout فقط: نسجّل/نحدّث عملية قيد الانتظار.
    // محاولة قديمة معلّقة ما تمنع محاولة جديدة — نحدّث نفس الصف بالعملية الجديدة.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("case_purchases")
      .select("id, status")
      .eq("user_id", userId)
      .eq("case_id", data.caseId)
      .maybeSingle();

    if (existing && existing.status !== "paid") {
      const { error } = await supabaseAdmin
        .from("case_purchases")
        .update({
          status: "pending",
          provider: "paddle",
          provider_ref: transactionId,
          failure_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) console.error("[purchase] failed to refresh pending purchase", error.message);
    } else if (!existing) {
      const { error } = await supabaseAdmin.from("case_purchases").insert({
        user_id: userId,
        case_id: data.caseId,
        status: "pending",
        provider: "paddle",
        provider_ref: transactionId,
      });
      if (error) {
        console.error("[purchase] failed to insert pending purchase", error.message);
        // ما نوقف المستخدم — webhook يقدر ينشئ الصف لاحقاً باستخدام custom_data.
      }
    }

    return {
      status: "awaiting_payment",
      checkoutUrl,
      transactionId,
      message: "تم إعداد عملية الدفع. أكمل الدفع في نافذة Paddle، وراح ترجع للعبة تلقائياً.",
    };
  });
