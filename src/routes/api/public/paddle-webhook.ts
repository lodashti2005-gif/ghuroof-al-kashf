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

type SignatureCheck = { ok: true } | { ok: false; reason: string };

function verifyPaddleSignature(header: string, rawBody: string, secret: string): SignatureCheck {
  const parsed = parseSignatureHeader(header);
  if (!parsed) return { ok: false, reason: "malformed_signature_header" };

  // حماية من إعادة الإرسال: نرفض الطلبات الأقدم من 5 دقائق.
  const tsSeconds = Number(parsed.ts);
  if (!Number.isFinite(tsSeconds)) return { ok: false, reason: "invalid_timestamp" };
  const driftSeconds = Math.round(Math.abs(Date.now() / 1000 - tsSeconds));
  if (driftSeconds > 300) return { ok: false, reason: `stale_timestamp_${driftSeconds}s` };

  const expected = createHmac("sha256", secret).update(`${parsed.ts}:${rawBody}`).digest("hex");
  const exp = Buffer.from(expected, "utf8");
  const match = parsed.hashes.some((hash) => {
    const got = Buffer.from(hash, "utf8");
    return got.length === exp.length && timingSafeEqual(got, exp);
  });
  if (!match) return { ok: false, reason: "signature_mismatch" };
  return { ok: true };
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
        const { logPaddleEvent } = await import("@/lib/paddle-log.server");
        const logRejection = async (reason: string, detail?: string) => {
          console.error("[paddle] rejected webhook", reason, detail ?? "");
          await logPaddleEvent({
            eventType: "rejected",
            outcome: "rejected",
            detail: detail ? `${reason}: ${detail}` : reason,
          });
        };

        const secret = process.env["PADDLE_WEBHOOK_SECRET"];
        if (!secret) {
          await logRejection("missing_webhook_secret");
          return new Response("not configured", { status: 503 });
        }

        // طبقة أولى: نرفض أي عنوان ما هو من قائمة Paddle الرسمية (تُجلب من API).
        const { isPaddleRequestIp } = await import("@/lib/paddle-ips.server");
        try {
          const { ok, ip } = await isPaddleRequestIp(request);
          if (!ok) {
            await logRejection("non_paddle_ip", ip ?? "unknown");
            return new Response("forbidden", { status: 403 });
          }
        } catch (err) {
          await logRejection("ip_check_unavailable", (err as Error).message);
          return new Response("ip check unavailable", { status: 503 });
        }

        // طبقة ثانية (إلزامية): توقيع Paddle على الجسم الخام.
        const signature = request.headers.get("paddle-signature");
        const rawBody = await request.text();
        if (!signature) {
          await logRejection("missing_signature_header");
          return new Response("invalid signature", { status: 401 });
        }
        const sigCheck = verifyPaddleSignature(signature, rawBody, secret);
        if (!sigCheck.ok) {
          await logRejection(sigCheck.reason);
          return new Response("invalid signature", { status: 401 });
        }

        let event: PaddleTransactionEvent;
        try {
          event = JSON.parse(rawBody) as PaddleTransactionEvent;
        } catch {
          await logRejection("invalid_json");
          return new Response("invalid json", { status: 400 });
        }

        if (event.event_type !== "transaction.completed") {
          await logPaddleEvent({
            eventId: event.event_id ?? null,
            eventType: event.event_type ?? "unknown",
            transactionId: event.data?.id ?? null,
            outcome: "ignored",
          });
          return Response.json({ ignored: event.event_type ?? null });
        }

        const data = event.data ?? {};
        const custom = (data.custom_data ?? {}) as Record<string, unknown>;
        const itemCustom = (data.items?.[0]?.price?.custom_data ?? {}) as Record<string, unknown>;

        const userId = firstString(custom["user_id"], custom["userId"]);
        const caseId = firstString(custom["case_id"], custom["caseId"], itemCustom["case_id"]);

        const amountRaw = data.details?.totals?.grand_total;
        const amount = amountRaw != null ? Number(amountRaw) / 100 : null;
        const currency = data.details?.totals?.currency_code ?? null;

        const logBase = {
          eventId: event.event_id ?? null,
          eventType: event.event_type,
          transactionId: data.id ?? null,
          caseId,
          userId,
          amount: Number.isFinite(amount) ? amount : null,
          currency,
        };

        if (!userId || !caseId) {
          console.error("[paddle] transaction.completed without user_id/case_id custom_data", {
            transaction: data.id,
          });
          await logPaddleEvent({ ...logBase, outcome: "missing_custom_data" });
          // 200 حتى لا يعيد Paddle الإرسال بلا فائدة — الحدث مسجّل بالسجلات.
          return Response.json({ ok: false, reason: "missing_custom_data" });
        }


        const transactionId = firstString(data.id);
        if (!transactionId) {
          await logPaddleEvent({ ...logBase, outcome: "missing_custom_data", detail: "no transaction id" });
          return Response.json({ ok: false, reason: "missing_transaction_id" });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Idempotency (1): نفس transaction_id مسجّل مسبقاً → ما نفتح القضية مرة ثانية.
        const { data: existing } = await supabaseAdmin
          .from("case_purchases")
          .select("id, status, user_id, case_id")
          .eq("provider", "paddle")
          .eq("provider_ref", transactionId)
          .maybeSingle();

        if (existing) {
          if (existing.status === "paid") {
            await logPaddleEvent({
              ...logBase,
              outcome: "duplicate",
              detail: `نفس العملية ${transactionId} مسجّلة مسبقاً — ما تكرر الفتح`,
            });
            return Response.json({ ok: true, idempotent: true });
          }
          const { error: updateError } = await supabaseAdmin
            .from("case_purchases")
            .update({
              status: "paid",
              amount_kwd: Number.isFinite(amount) ? amount : null,
              purchased_at: new Date().toISOString(),
            })
            .eq("id", existing.id)
            .neq("status", "paid");

          if (updateError) {
            console.error("[paddle] failed to finalize purchase", updateError.message);
            await logPaddleEvent({ ...logBase, outcome: "db_error", detail: updateError.message });
            return new Response("db error", { status: 500 });
          }
          await logPaddleEvent({ ...logBase, outcome: "granted" });
          return Response.json({ ok: true });
        }

        // Idempotency (2): نفس (المستخدم + القضية) — الفتح مرة وحدة فقط،
        // ولو الصف موجود «بانتظار التأكيد» (من محاولة دفع ثانية) نرفعه لـ paid بدون صف جديد.
        const finalizeExisting = async () => {
          const { data: sameCase } = await supabaseAdmin
            .from("case_purchases")
            .select("id, status")
            .eq("user_id", userId)
            .eq("case_id", caseId)
            .maybeSingle();

          if (!sameCase) return false;

          if (sameCase.status === "paid") {
            await logPaddleEvent({
              ...logBase,
              outcome: "duplicate",
              detail: `القضية ${caseId} مفتوحة مسبقاً لهذا المستخدم — ما تكرر الفتح`,
            });
            return true;
          }

          const { error: upErr } = await supabaseAdmin
            .from("case_purchases")
            .update({
              status: "paid",
              amount_kwd: Number.isFinite(amount) ? amount : null,
              provider: "paddle",
              provider_ref: transactionId,
              purchased_at: new Date().toISOString(),
            })
            .eq("id", sameCase.id)
            .neq("status", "paid");

          if (upErr) {
            await logPaddleEvent({ ...logBase, outcome: "db_error", detail: upErr.message });
            return true;
          }
          await logPaddleEvent({ ...logBase, outcome: "granted" });
          return true;
        };

        if (await finalizeExisting()) {
          return Response.json({ ok: true });
        }

        const { error } = await supabaseAdmin.from("case_purchases").insert({
          user_id: userId,
          case_id: caseId,
          status: "paid",
          amount_kwd: Number.isFinite(amount) ? amount : null,
          provider: "paddle",
          provider_ref: transactionId,
          purchased_at: new Date().toISOString(),
        });

        if (error) {
          // Idempotency (2): سباق بين حدثين بنفس transaction_id — الفهرس الفريد يمنع التكرار.
          const isDuplicate =
            (error as { code?: string }).code === "23505" ||
            /duplicate key|unique constraint/i.test(error.message);
          if (isDuplicate) {
            await logPaddleEvent({
              ...logBase,
              outcome: "duplicate",
              detail: `طلب متزامن بنفس العملية ${transactionId} — رفضته القاعدة`,
            });
            return Response.json({ ok: true, idempotent: true });
          }
          console.error("[paddle] failed to record purchase", error.message);
          await logPaddleEvent({ ...logBase, outcome: "db_error", detail: error.message });
          return new Response("db error", { status: 500 });
        }

        await logPaddleEvent({ ...logBase, outcome: "granted" });
        return Response.json({ ok: true });
      },
    },
  },
});
