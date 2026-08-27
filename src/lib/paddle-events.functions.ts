/**
 * قراءة سجل أحداث Paddle — للمشرف فقط.
 */
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface PaddleEventRow {
  id: string;
  createdAt: string;
  eventType: string;
  transactionId: string | null;
  caseId: string | null;
  userId: string | null;
  outcome: string;
  detail: string | null;
  amount: number | null;
  currency: string | null;
}

export interface PaddleEventsResult {
  allowed: boolean;
  rows: PaddleEventRow[];
  duplicateTransactions: string[];
}

export const listPaddleEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PaddleEventsResult> => {
    const { supabase, userId } = context;

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (isAdmin !== true) return { allowed: false, rows: [], duplicateTransactions: [] };

    const { data } = await supabase
      .from("paddle_webhook_events")
      .select("id, created_at, event_type, transaction_id, case_id, user_id, outcome, detail, amount, currency")
      .order("created_at", { ascending: false })
      .limit(100);

    const rows: PaddleEventRow[] = (data ?? []).map((r) => ({
      id: r.id,
      createdAt: r.created_at,
      eventType: r.event_type,
      transactionId: r.transaction_id,
      caseId: r.case_id,
      userId: r.user_id,
      outcome: r.outcome,
      detail: r.detail,
      amount: r.amount != null ? Number(r.amount) : null,
      currency: r.currency,
    }));

    // أي عملية منحت الملكية أكثر من مرة = تكرار فعلي.
    const grantedCount = new Map<string, number>();
    for (const row of rows) {
      if (row.outcome === "granted" && row.transactionId) {
        grantedCount.set(row.transactionId, (grantedCount.get(row.transactionId) ?? 0) + 1);
      }
    }
    const duplicateTransactions = [...grantedCount.entries()]
      .filter(([, count]) => count > 1)
      .map(([txn]) => txn);

    return { allowed: true, rows, duplicateTransactions };
  });
