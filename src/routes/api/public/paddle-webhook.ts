/**
 * نقطة استقبال أحداث Paddle (Webhook).
 *
 * أمان: نتحقق من توقيع Paddle (HMAC-SHA256) على الجسم الخام قبل أي كتابة،
 * والمفتاح يُقرأ من متغير بيئة على الخادم فقط (PADDLE_WEBHOOK_SECRET).
 * منح الملكية يصير هنا بمفتاح الخادم — ما فيه أي مسار من الواجهة يفتح قضية.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

interface PaddleTransactionEvent {
  event_id?: string;
  event_type?: string;
  data?: {
    id?: string;
    status?: string;
    customer_id?: string;
    custom_data?: Record<string, unknown> | null;
    details?: { totals?: { grand_total?: string; currency_code?: string } };
    items?: Array<{ price?: { id?: string; custom_data?: Record<string, unknown> | null } }>;
  };
}

function parseSignatureHeader(header: string): { ts: string; hashes: string[] } | null {
  const parts = header.split(";");
  let ts = "";
  const hashes: string[] = [];
  for (const part of parts) {
    const [key, value] = part.split("=");
    if (!key || !value) continue;
    if (key.trim() === "ts") ts = value.trim();
    if (key.trim() === "h1") hashes.push(value.trim());
  }
  if (!ts || hashes.length === 0) return null;
  return { ts, hashes };
}

function verifyPaddleSignature(header: string, rawBody: string, secret: string): boolean {
  const parsed = parseSignatureHeader(header);
  if (!parsed) return false;

  // حماية من إعادة الإرسال: نرفض الطلبات الأقدم من 5 دقائق.
  const tsSeconds = Number(parsed.ts);
  if (!Number.isFinite(tsSeconds)) return false;
  if (Math.abs(Date.now() / 1000 - tsSeconds) > 300) return false;

  const expected = createHmac("sha256", secret).update(`${parsed.ts}:${rawBody}`).digest("hex");
  const exp = Buffer.from(expected, "utf8");
  return parsed.hashes.some((hash) => {
    const got = Buffer.from(hash, "utf8");
    return got.length === exp.length && timingSafeEqual(got, exp);
  });
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return null;
}

export const Route = createFileRoute("/api/public/paddle-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PADDLE_WEBHOOK_SECRET"];
        if (!secret) {
          console.error("[paddle] missing PADDLE_WEBHOOK_SECRET");
          return new Response("not configured", { status: 503 });
        }

        const signature = request.headers.get("paddle-signature");
        const rawBody = await request.text();
        if (!signature || !verifyPaddleSignature(signature, rawBody, secret)) {
          return new Response("invalid signature", { status: 401 });
        }

        let event: PaddleTransactionEvent;
        try {
          event = JSON.parse(rawBody) as PaddleTransactionEvent;
        } catch {
          return new Response("invalid json", { status: 400 });
        }

        if (event.event_type !== "transaction.completed") {
          return Response.json({ ignored: event.event_type ?? null });
        }

        const data = event.data ?? {};
        const custom = (data.custom_data ?? {}) as Record<string, unknown>;
        const itemCustom = (data.items?.[0]?.price?.custom_data ?? {}) as Record<string, unknown>;

        const userId = firstString(custom["user_id"], custom["userId"]);
        const caseId = firstString(custom["case_id"], custom["caseId"], itemCustom["case_id"]);

        if (!userId || !caseId) {
          console.error("[paddle] transaction.completed without user_id/case_id custom_data", {
            transaction: data.id,
          });
          // 200 حتى لا يعيد Paddle الإرسال بلا فائدة — الحدث مسجّل بالسجلات.
          return Response.json({ ok: false, reason: "missing_custom_data" });
        }

        const amountRaw = data.details?.totals?.grand_total;
        const amount = amountRaw != null ? Number(amountRaw) / 100 : null;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: existing } = await supabaseAdmin
          .from("case_purchases")
          .select("id, status")
          .eq("user_id", userId)
          .eq("case_id", caseId)
          .eq("provider", "paddle")
          .eq("provider_ref", data.id ?? "")
          .maybeSingle();

        if (existing?.status === "paid") {
          return Response.json({ ok: true, idempotent: true });
        }

        const row = {
          user_id: userId,
          case_id: caseId,
          status: "paid",
          amount_kwd: Number.isFinite(amount) ? amount : null,
          provider: "paddle",
          provider_ref: data.id ?? null,
          purchased_at: new Date().toISOString(),
        };

        const { error } = existing
          ? await supabaseAdmin.from("case_purchases").update(row).eq("id", existing.id)
          : await supabaseAdmin.from("case_purchases").insert(row);

        if (error) {
          console.error("[paddle] failed to record purchase", error.message);
          return new Response("db error", { status: 500 });
        }

        return Response.json({ ok: true });
      },
    },
  },
});
