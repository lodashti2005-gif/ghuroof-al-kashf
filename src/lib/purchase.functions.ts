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

const caseInput = z.object({ caseId: z.string().min(1).max(64) });

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

    return {
      caseId: data.caseId,
      entitled: entitled === true,
      purchased: purchase?.status === "paid",
      purchaseStatus: purchase?.status ?? null,
      free: caseRow?.is_free ?? false,
      priceKwd: caseRow?.price_kwd != null ? Number(caseRow.price_kwd) : null,
      title: caseRow?.title ?? null,
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
  message: string;
}

/**
 * بدء عملية شراء. حالياً ما فيه مزوّد دفع مربوط، فالخادم يرجّع
 * `gateway_unconfigured` بدون منح أي ملكية. عند ربط البوابة: يُنشأ هنا
 * checkout session ويُرجّع `checkoutUrl`.
 */
export const startCasePurchase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => caseInput.parse(data))
  .handler(async ({ data, context }): Promise<PurchaseIntentResult> => {
    const { data: entitled } = await context.supabase.rpc("has_case_entitlement", {
      _user_id: context.userId,
      _case_id: data.caseId,
    });
    if (entitled === true) {
      return {
        status: "already_owned",
        checkoutUrl: null,
        message: "القضية مفتوحة على حسابك — تقدر تكمل من نفس المكان.",
      };
    }

    return {
      status: "gateway_unconfigured",
      checkoutUrl: null,
      message:
        "بوابة الدفع لِسِه ما تربطت. طلبك محفوظ عندنا، وأول ما تتفعّل البوابة تقدر تكمل الدفع وتفتح القضية كاملة بنفس الغرفة ونفس التقدم.",
    };
  });
