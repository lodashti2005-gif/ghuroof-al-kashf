/**
 * تسجيل أحداث Paddle الواردة في جدول paddle_webhook_events.
 * يُستدعى من الـwebhook فقط (مفتاح الخادم) — التسجيل ما يوقف معالجة الحدث.
 */
export interface PaddleEventLog {
  eventId?: string | null;
  eventType: string;
  transactionId?: string | null;
  caseId?: string | null;
  userId?: string | null;
  /** granted | duplicate | ignored | missing_custom_data | db_error */
  outcome: string;
  detail?: string | null;
  amount?: number | null;
  currency?: string | null;
}

export async function logPaddleEvent(entry: PaddleEventLog): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const isUuid =
      typeof entry.userId === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entry.userId);

    const row = {
      event_id: entry.eventId ?? null,
      event_type: entry.eventType,
      transaction_id: entry.transactionId ?? null,
      case_id: entry.caseId ?? null,
      user_id: isUuid ? (entry.userId as string) : null,
      outcome: entry.outcome,
      detail: entry.detail ?? (entry.userId && !isUuid ? `user_id=${entry.userId}` : null),
      amount: entry.amount ?? null,
      currency: entry.currency ?? null,
    };

    const { error } = await supabaseAdmin.from("paddle_webhook_events").insert(row);
    if (!error) return;

    // نفس event_id مسجّل سابقاً (إعادة إرسال من Paddle) — نسجّله كسطر مكرر واضح.
    const isDuplicate =
      (error as { code?: string }).code === "23505" ||
      /duplicate key|unique constraint/i.test(error.message);
    if (isDuplicate) {
      await supabaseAdmin.from("paddle_webhook_events").insert({
        ...row,
        event_id: null,
        outcome: "duplicate",
        detail: `إعادة إرسال لنفس الحدث ${entry.eventId ?? ""} — ما تكرر الفتح`,
      });
      return;
    }
    console.error("[paddle] failed to log webhook event", error.message);
  } catch (err) {
    console.error("[paddle] failed to log webhook event", (err as Error).message);
  }
}
