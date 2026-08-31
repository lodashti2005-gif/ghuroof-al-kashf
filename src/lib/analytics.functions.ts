/**
 * تقرير التسويق والمبيعات للمشرف فقط — أرقام العملاء الحقيقيين.
 *
 * قواعد صارمة:
 * - يستبعد حسابات المالك/الاختبار (جدول analytics_excluded_users) وكل زائر
 *   ارتبط بأي منها، من كل الأرقام والإيرادات.
 * - يبدأ افتراضياً من تاريخ إطلاق الإعلانات (٢٩ أغسطس ٢٠٢٦).
 * - أي حدث ما كان يُسجَّل سابقاً يرجع `null` ويُعرض «لا توجد بيانات تاريخية».
 * - ما يحذف ولا يعدّل أي سجل: قراءة فقط.
 */
import { createServerFn } from "@tanstack/react-start";

import {
  ADS_LAUNCH_DATE,
  emptyAnalyticsReport,
  type AnalyticsMetric,
  type AnalyticsReport,
  type FunnelStage,
  type SourceRow,
} from "@/lib/analytics-overview";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** الأحداث اللي أُضيفت مع هذا التحديث (ما لها بيانات تاريخية). */
const NEW_EVENT_TYPES = [
  "signup",
  "trial_click",
  "trial_start",
  "trial_end",
  "purchase_view",
  "pay_click",
  "checkout_open",
  "case_unlocked",
];

interface EventRow {
  event_type: string;
  user_id: string | null;
  visitor_id: string | null;
  session_id: string | null;
  source: string | null;
  created_at: string;
}

function pct(part: number | null, whole: number | null): number | null {
  if (part == null || whole == null || whole <= 0) return null;
  return Math.round((part / whole) * 1000) / 10;
}

export const getAnalyticsReport = createServerFn({ method: "POST" })
  .inputValidator((data: { since?: string } | undefined) => ({
    since: typeof data?.since === "string" ? data.since : `${ADS_LAUNCH_DATE}T00:00:00.000Z`,
  }))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }): Promise<AnalyticsReport> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (isAdmin !== true) return emptyAnalyticsReport;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = data.since;

    // ١) الحسابات المستبعدة (مالك/اختبار).
    const { data: excludedRows } = await supabaseAdmin
      .from("analytics_excluded_users")
      .select("user_id");
    const excludedUsers = new Set((excludedRows ?? []).map((r) => r.user_id));

    // ٢) كل أحداث التتبّع (نحتاج التاريخ الكامل لتحديد الزوار المستبعدين).
    const { data: allEvents } = await supabaseAdmin
      .from("player_events")
      .select("event_type, user_id, visitor_id, session_id, source, created_at")
      .order("created_at", { ascending: true })
      .limit(50000);
    const events: EventRow[] = (allEvents ?? []) as EventRow[];

    // أي زائر ظهر مرة واحدة بحساب مستبعد = جهاز المالك/الاختبار.
    const excludedVisitors = new Set<string>();
    for (const e of events) {
      if (e.user_id && excludedUsers.has(e.user_id) && e.visitor_id) {
        excludedVisitors.add(e.visitor_id);
      }
    }
    const isExcludedEvent = (e: EventRow) =>
      (e.user_id != null && excludedUsers.has(e.user_id)) ||
      (e.visitor_id != null && excludedVisitors.has(e.visitor_id));

    const inRange = events.filter((e) => e.created_at >= since);
    const clean = inRange.filter((e) => !isExcludedEvent(e));
    const excludedEvents = inRange.length - clean.length;

    const recordedEventTypes = [...new Set(events.map((e) => e.event_type))].sort();
    const newlyTrackedEventTypes = NEW_EVENT_TYPES.filter(
      (t) => !recordedEventTypes.includes(t),
    );
    const sourcesTracked = events.some((e) => e.source != null);

    const distinct = (rows: EventRow[], field: "visitor_id" | "session_id") =>
      new Set(rows.map((r) => r[field]).filter((v): v is string => !!v)).size;

    const ofType = (type: string) => clean.filter((e) => e.event_type === type);
    /** عدد الزوار الفريدين لحدث معيّن، أو null إذا الحدث ما كان يُسجَّل. */
    const visitorsOf = (type: string): number | null =>
      recordedEventTypes.includes(type) ? distinct(ofType(type), "visitor_id") : null;

    const uniqueVisitors = distinct(clean, "visitor_id");
    const sessions = distinct(clean, "session_id");

    // ٣) الحسابات الجديدة (بيانات حقيقية من نظام الحسابات).
    let signups: number | null = null;
    let earliestUserAt: string | null = null;
    try {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      const users = usersData?.users ?? [];
      if (users.length > 0) {
        earliestUserAt = users
          .map((u) => u.created_at)
          .sort()[0] ?? null;
        signups = users.filter(
          (u) => u.created_at >= since && !excludedUsers.has(u.id),
        ).length;
      }
    } catch {
      signups = null;
    }

    // ٤) التجربة (١٠ دقائق) — بيانات حقيقية من جدول التجارب.
    const { data: trials } = await supabaseAdmin
      .from("case_trials")
      .select("user_id, case_id, consumed_seconds, created_at")
      .limit(5000);
    const cleanTrials = (trials ?? []).filter(
      (t) => t.created_at >= since && !excludedUsers.has(t.user_id),
    );
    const trialStarted = new Set(
      cleanTrials.filter((t) => (t.consumed_seconds ?? 0) > 0).map((t) => t.user_id),
    ).size;
    const trialCompleted = new Set(
      cleanTrials.filter((t) => (t.consumed_seconds ?? 0) >= 600).map((t) => t.user_id),
    ).size;

    // ٤.١) تجارب الأجهزة (بدون حساب) — بيانات حقيقية من جدول تجارب الأجهزة.
    const { data: deviceRows } = await supabaseAdmin
      .from("device_trials")
      .select("device_id, case_id, started_at, last_seen_at")
      .limit(20000);
    const cleanDevice = (deviceRows ?? []).filter(
      (t) => t.started_at >= since && !excludedVisitors.has(t.device_id),
    );
    const nowMs = Date.now();
    const endedAt = (startedAt: string) => new Date(startedAt).getTime() + 600_000;
    const deviceStarted = new Set(cleanDevice.map((t) => t.device_id)).size;
    const deviceEnded = new Set(
      cleanDevice.filter((t) => nowMs >= endedAt(t.started_at)).map((t) => t.device_id),
    ).size;
    // «أكمل التجربة» = بقي فاعلاً حتى قرب نهاية الـ١٠ دقائق (آخر ظهور ≥ ٩:٣٠).
    const deviceCompleted = new Set(
      cleanDevice
        .filter((t) => new Date(t.last_seen_at).getTime() >= endedAt(t.started_at) - 30_000)
        .map((t) => t.device_id),
    ).size;

    const startedTrialTotal = trialStarted + deviceStarted;
    const completedTrialTotal = trialCompleted + deviceCompleted;


    // ٥) المشتريات والإيراد — عملاء حقيقيون فقط.
    const { data: purchaseRows } = await supabaseAdmin
      .from("case_purchases")
      .select("user_id, case_id, status, amount, amount_kwd, currency, created_at")
      .limit(5000);
    const purchases = (purchaseRows ?? []).filter((p) => p.created_at >= since);
    const ownerPurchaseRows = purchases.filter((p) => excludedUsers.has(p.user_id));
    const customerPurchases = purchases.filter((p) => !excludedUsers.has(p.user_id));
    const paid = customerPurchases.filter((p) => p.status === "paid");
    const pending = customerPurchases.filter(
      (p) => p.status !== "paid" && p.status !== "failed",
    );
    const failed = customerPurchases.filter((p) => p.status === "failed");

    const sumBy = (rows: typeof purchases) => {
      const byCurrency = new Map<string, number>();
      for (const r of rows) {
        if (r.status !== "paid") continue;
        const amount =
          r.amount != null ? Number(r.amount) : r.amount_kwd != null ? Number(r.amount_kwd) : 0;
        const cur = r.currency ?? "USD";
        byCurrency.set(cur, (byCurrency.get(cur) ?? 0) + amount);
      }
      return [...byCurrency.entries()].map(([currency, amount]) => ({ currency, amount }));
    };

    const buyers = new Set(paid.map((p) => p.user_id));

    // ٦) عمليات الدفع الفاشلة/الملغاة من سجل أحداث بوابة الدفع (قراءة فقط).
    const { data: webhookRows } = await supabaseAdmin
      .from("paddle_webhook_events")
      .select("event_type, user_id, created_at")
      .gte("created_at", since)
      .limit(5000);
    const wh = (webhookRows ?? []).filter(
      (w) => !(w.user_id && excludedUsers.has(w.user_id)),
    );
    const paymentFailed = wh.filter(
      (w) => w.event_type === "transaction.payment_failed" || w.event_type === "transaction.canceled",
    ).length;

    // ٧) المقاييس.
    const NA = "لا توجد بيانات تاريخية لهذا الحدث — سيبدأ تسجيله من الآن.";
    const metrics: AnalyticsMetric[] = [
      { key: "visitors", label: "زوار فريدون", value: uniqueVisitors, note: "معرّف زائر محلي — يُسجَّل منذ إضافة التتبّع." },
      { key: "sessions", label: "عدد الزيارات (Sessions)", value: sessions, note: "الجلسات تُسجَّل من الآن؛ الزيارات الأقدم بلا معرّف جلسة." },
      { key: "pageviews", label: "مشاهدات الصفحات", value: clean.length, note: "أحداث فتح الصفحات المسجّلة." },
      { key: "signups", label: "حسابات جديدة", value: signups, note: "من نظام الحسابات — بيانات تاريخية حقيقية." },
      { key: "trial_click", label: "ضغط «ابدأ التجربة»", value: visitorsOf("trial_click"), note: recordedEventTypes.includes("trial_click") ? "زوار فريدون." : NA },
      { key: "trial_start", label: "بدأ تجربة الـ١٠ دقائق فعلياً", value: trialStarted, note: "من جدول التجارب — بيانات تاريخية حقيقية." },
      { key: "trial_done", label: "استهلك التجربة كاملة", value: trialCompleted, note: "١٠ دقائق مستهلكة — بيانات تاريخية حقيقية." },
      { key: "purchase_view", label: "وصل لصفحة الشراء", value: visitorsOf("purchase_view"), note: recordedEventTypes.includes("purchase_view") ? "زوار فريدون." : NA },
      { key: "pay_click", label: "ضغط «ادفع وافتح القضية»", value: visitorsOf("pay_click"), note: recordedEventTypes.includes("pay_click") ? "زوار فريدون." : NA },
      { key: "checkout_open", label: "فتح صفحة الدفع (Checkout)", value: visitorsOf("checkout_open"), note: recordedEventTypes.includes("checkout_open") ? "زوار فريدون." : NA },
      { key: "paid", label: "عمليات دفع ناجحة", value: paid.length, note: "من سجل المشتريات — بدون المالك/الاختبار." },
      { key: "pending", label: "عمليات معلّقة", value: pending.length, note: "بانتظار تأكيد الدفع." },
      { key: "failed", label: "عمليات فاشلة/ملغاة", value: failed.length + paymentFailed, note: "من سجل المشتريات وأحداث بوابة الدفع." },
      { key: "unlocked", label: "قضايا فُتحت بعد الدفع", value: paid.length, note: "كل عملية مؤكدة تفتح القضية على الحساب." },
      { key: "buyers", label: "مشترون حقيقيون", value: buyers.size, note: "حسابات فريدة — بدون المالك/الاختبار." },
    ];

    // ٨) مسار التحويل.
    const stage = (
      key: string,
      label: string,
      count: number | null,
      prev: number | null,
      first: number | null,
      note: string,
    ): FunnelStage => ({
      key,
      label,
      count,
      fromPrevPct: pct(count, prev),
      overallPct: pct(count, first),
      available: count != null,
      note,
    });

    const purchaseViews = visitorsOf("purchase_view");
    const checkoutOpens = visitorsOf("checkout_open");
    const funnel: FunnelStage[] = [
      stage("visit", "زار الموقع", uniqueVisitors, uniqueVisitors, uniqueVisitors, "زوار فريدون."),
      stage("signup", "أنشأ حساب", signups, uniqueVisitors, uniqueVisitors, "بيانات حقيقية."),
      stage("trial", "بدأ التجربة", trialStarted, signups, uniqueVisitors, "بيانات حقيقية."),
      stage("trial_done", "أكمل التجربة", trialCompleted, trialStarted, uniqueVisitors, "بيانات حقيقية."),
      stage("purchase_view", "وصل للشراء", purchaseViews, trialCompleted, uniqueVisitors, purchaseViews == null ? NA : "زوار فريدون."),
      stage("checkout", "فتح صفحة الدفع", checkoutOpens, purchaseViews, uniqueVisitors, checkoutOpens == null ? NA : "زوار فريدون."),
      stage("paid", "دفع", paid.length, checkoutOpens ?? trialCompleted, uniqueVisitors, "بيانات حقيقية."),
    ];

    // ٩) مصادر الزيارات.
    let sources: SourceRow[] | null = null;
    if (sourcesTracked) {
      const bySource = new Map<string, EventRow[]>();
      for (const e of clean) {
        const key = e.source ?? "unknown";
        const list = bySource.get(key) ?? [];
        list.push(e);
        bySource.set(key, list);
      }
      sources = [...bySource.entries()]
        .map(([source, rows]) => {
          const visitors = distinct(rows, "visitor_id");
          const started = distinct(
            rows.filter((r) => r.event_type === "trial_click" || r.event_type === "trial_start"),
            "visitor_id",
          );
          const reached = distinct(
            rows.filter((r) => r.event_type === "purchase_view"),
            "visitor_id",
          );
          const sourceBuyers = new Set(
            rows
              .map((r) => r.user_id)
              .filter((u): u is string => !!u && buyers.has(u)),
          ).size;
          return {
            source,
            visitors,
            sessions: distinct(rows, "session_id"),
            startedTrial: started,
            reachedPurchase: reached,
            buyers: sourceBuyers,
            conversionPct: pct(sourceBuyers, visitors) ?? 0,
          };
        })
        .sort((a, b) => b.visitors - a.visitors);
    }

    return {
      allowed: true,
      since,
      earliestEventAt: events[0]?.created_at ?? null,
      earliestUserAt,
      recordedEventTypes,
      newlyTrackedEventTypes,
      metrics,
      funnel,
      sources,
      sourcesTracked,
      revenue: sumBy(customerPurchases),
      ownerRevenue: sumBy(ownerPurchaseRows),
      excluded: {
        users: excludedUsers.size,
        visitors: excludedVisitors.size,
        ownerPurchases: ownerPurchaseRows.length,
        excludedEvents,
      },
    };
  });
