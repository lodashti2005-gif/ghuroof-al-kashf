/**
 * حالة عمليات الشراء للمستخدم الحالي — قراءة فقط.
 *
 * يرجّع صفاً واحداً لكل قضية (بدون تكرار): إذا فيه عملية مدفوعة فهي المعتمدة،
 * وإلا آخر عملية حسب التاريخ. الملكية الفعلية دائماً من `has_case_entitlement`
 * على الخادم — الصفحة ما تفتح أي قضية.
 */
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PurchaseUiStatus = "paid" | "pending" | "failed";

export interface MyPurchaseRow {
  caseId: string;
  caseTitle: string | null;
  status: PurchaseUiStatus;
  rawStatus: string;
  amount: number | null;
  currency: string;
  provider: string | null;
  transactionId: string | null;
  failureReason: string | null;
  createdAt: string;
  purchasedAt: string | null;
  /** عدد العمليات المسجّلة لنفس القضية (للعلم فقط — الفتح يصير مرة وحدة). */
  attempts: number;
  /** القضية مفتوحة فعلياً على الحساب. */
  entitled: boolean;
  /** كل الأحداث المسجّلة لهذي القضية (محاولات الدفع + أحداث Paddle). */
  events: MyPurchaseEvent[];
}

export interface MyPurchaseEvent {
  id: string;
  /** "purchase" = صف عملية شراء، "webhook" = حدث وصل من Paddle. */
  source: "purchase" | "webhook";
  status: PurchaseUiStatus;
  /** وصف مختصر للنتيجة بالعربي. */
  label: string;
  transactionId: string | null;
  eventType: string | null;
  amount: number | null;
  currency: string | null;
  detail: string | null;
  at: string;
}

export interface MyPurchasesResult {
  purchases: MyPurchaseRow[];
}

function normalize(status: string): PurchaseUiStatus {
  const s = status.toLowerCase();
  if (s === "paid" || s === "completed" || s === "granted") return "paid";
  if (s === "failed" || s === "canceled" || s === "cancelled" || s === "rejected") return "failed";
  return "pending";
}

export const listMyPurchases = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyPurchasesResult> => {
    const { supabase, userId } = context;

    const { data: rows } = await supabase
      .from("case_purchases")
      .select(
        "case_id, status, amount, amount_kwd, currency, provider, provider_ref, failure_reason, created_at, purchased_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);

    const list = rows ?? [];
    if (list.length === 0) return { purchases: [] };

    const caseIds = Array.from(new Set(list.map((r) => r.case_id)));

    const [{ data: caseRows }, entitlements] = await Promise.all([
      supabase.from("cases").select("id, title").in("id", caseIds),
      Promise.all(
        caseIds.map(async (id) => {
          const { data } = await supabase.rpc("has_case_entitlement", {
            _user_id: userId,
            _case_id: id,
          });
          return [id, data === true] as const;
        }),
      ),
    ]);

    const titleById = new Map((caseRows ?? []).map((c) => [c.id, c.title as string | null]));
    const entitledById = new Map(entitlements);

    // أحداث Paddle الخاصة بهذا المستخدم فقط (السجل الخام محجوب عن العملاء).
    const eventsByCase = new Map<string, MyPurchaseEvent[]>();
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: hooks } = await supabaseAdmin
        .from("paddle_webhook_events")
        .select("id, event_type, transaction_id, case_id, outcome, detail, amount, currency, created_at")
        .eq("user_id", userId)
        .in("case_id", caseIds)
        .order("created_at", { ascending: false })
        .limit(300);

      for (const h of hooks ?? []) {
        if (!h.case_id) continue;
        const bucket = eventsByCase.get(h.case_id) ?? [];
        bucket.push({
          id: h.id,
          source: "webhook",
          status: OUTCOME_STATUS[h.outcome] ?? "pending",
          label: OUTCOME_LABEL[h.outcome] ?? h.outcome,
          transactionId: h.transaction_id ?? null,
          eventType: h.event_type ?? null,
          amount: h.amount != null ? Number(h.amount) : null,
          currency: h.currency ?? null,
          detail: h.detail ?? null,
          at: h.created_at,
        });
        eventsByCase.set(h.case_id, bucket);
      }
    } catch (err) {
      console.error("[purchases] failed to load webhook events", err);
    }

    // صف واحد لكل قضية: المدفوعة لها الأولوية، وإلا الأحدث.
    const byCase = new Map<string, MyPurchaseRow>();
    for (const row of list) {
      const status = normalize(row.status);
      const existing = byCase.get(row.case_id);
      const attempts = (existing?.attempts ?? 0) + 1;

      const bucket = eventsByCase.get(row.case_id) ?? [];
      bucket.push({
        id: `purchase-${row.case_id}-${row.provider_ref ?? row.created_at}`,
        source: "purchase",
        status,
        label:
          status === "paid"
            ? "عملية مؤكدة — القضية مفتوحة"
            : status === "failed"
              ? "عملية مرفوضة"
              : "عملية بانتظار التأكيد",
        transactionId: row.provider_ref ?? null,
        eventType: row.provider ?? null,
        amount: row.amount != null ? Number(row.amount) : row.amount_kwd != null ? Number(row.amount_kwd) : null,
        currency: row.currency ?? null,
        detail: row.failure_reason ?? null,
        at: row.purchased_at ?? row.created_at,
      });
      eventsByCase.set(row.case_id, bucket);

      if (existing && (existing.status === "paid" || status !== "paid")) {
        existing.attempts = attempts;
        continue;
      }

      byCase.set(row.case_id, {
        caseId: row.case_id,
        caseTitle: titleById.get(row.case_id) ?? null,
        status,
        rawStatus: row.status,
        amount: row.amount != null ? Number(row.amount) : row.amount_kwd != null ? Number(row.amount_kwd) : null,
        currency: row.currency ?? "USD",
        provider: row.provider ?? null,
        transactionId: row.provider_ref ?? null,
        failureReason: row.failure_reason ?? null,
        createdAt: row.created_at,
        purchasedAt: row.purchased_at ?? null,
        attempts,
        entitled: entitledById.get(row.case_id) === true,
        events: [],
      });
    }

    for (const row of byCase.values()) {
      row.events = (eventsByCase.get(row.caseId) ?? []).sort((a, b) => b.at.localeCompare(a.at));
    }

    return {
      purchases: Array.from(byCase.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    };
  });
