/**
 * بيانات لوحة المالك — للمشرف فقط.
 *
 * كل الأرقام هنا مقروءة فعلياً من قاعدة البيانات. أي نوع بيانات غير مخزّن
 * يُعاد كـ`null` وتعرضه الواجهة كـ«غير متاح» بدون أي أرقام وهمية.
 */
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AdminCaseStat {
  caseId: string;
  title: string | null;
  paidPurchases: number;
  pendingPurchases: number;
  failedPurchases: number;
  trialPlayers: number;
}

export interface AdminActivityRow {
  id: string;
  eventType: string;
  caseId: string | null;
  roomCode: string | null;
  path: string | null;
  userId: string | null;
  createdAt: string;
}

export interface AdminRoomRow {
  code: string;
  caseId: string;
  phase: string;
  players: number;
  updatedAt: string;
}

export interface AdminOverview {
  allowed: boolean;
  /** إجمالي الحسابات المسجّلة (من جدول الملفات الشخصية). */
  totalProfiles: number | null;
  /** حسابات أُنشئت خلال آخر ٧ أيام. */
  newProfiles7d: number | null;
  totalPurchases: number | null;
  paidPurchases: number | null;
  totalRevenue: { amount: number; currency: string }[] | null;
  totalRooms: number | null;
  activeRooms: number | null;
  totalRoomPlayers: number | null;
  activeProgress: number | null;
  trialRows: number | null;
  webhookEvents: number | null;
  cases: AdminCaseStat[];
  rooms: AdminRoomRow[] | null;
  activity: AdminActivityRow[] | null;
  activityTotal: number | null;
  activity7dByType: { eventType: string; count: number }[] | null;
  contactSubmissions: number | null;
}

const EMPTY: AdminOverview = {
  allowed: false,
  totalProfiles: null,
  newProfiles7d: null,
  totalPurchases: null,
  paidPurchases: null,
  totalRevenue: null,
  totalRooms: null,
  activeRooms: null,
  totalRoomPlayers: null,
  activeProgress: null,
  trialRows: null,
  webhookEvents: null,
  cases: [],
  rooms: null,
  activity: null,
  activityTotal: null,
  activity7dByType: null,
  contactSubmissions: null,
};

/** هل المستخدم الحالي مشرف؟ يستخدمه زر «لوحة المالك» بالهيدر. */
export const checkIsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ isAdmin: boolean }> => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: data === true };
  });

export const getAdminOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminOverview> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (isAdmin !== true) return EMPTY;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const activeSince = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const count = async (
      table: string,
      apply?: (q: any) => any,
    ): Promise<number | null> => {
      let q: any = supabaseAdmin.from(table as never).select("*", { count: "exact", head: true });
      if (apply) q = apply(q);
      const { count: c, error } = await q;
      if (error) {
        console.error(`[admin] count failed for ${table}`, error.message);
        return null;
      }
      return c ?? 0;
    };

    const [
      totalProfiles,
      newProfiles7d,
      totalPurchases,
      paidPurchases,
      totalRooms,
      activeRooms,
      totalRoomPlayers,
      activeProgress,
      trialRows,
      webhookEvents,
      contactSubmissions,
      activityTotal,
    ] = await Promise.all([
      count("profiles"),
      count("profiles", (q) => q.gte("created_at", since7d)),
      count("case_purchases"),
      count("case_purchases", (q) => q.eq("status", "paid")),
      count("rooms"),
      count("rooms", (q) => q.gte("updated_at", activeSince)),
      count("room_players"),
      count("game_progress", (q) => q.eq("active", true)),
      count("case_trials"),
      count("paddle_webhook_events"),
      count("contact_submissions"),
      count("player_events"),
    ]);

    // إيرادات فعلية: مجموع مبالغ العمليات المدفوعة لكل عملة.
    let totalRevenue: AdminOverview["totalRevenue"] = null;
    const { data: paidRows } = await supabaseAdmin
      .from("case_purchases")
      .select("amount, amount_kwd, currency, case_id, status")
      .limit(5000);
    const purchaseRows = paidRows ?? [];
    if (paidRows) {
      const byCurrency = new Map<string, number>();
      for (const r of purchaseRows) {
        if (r.status !== "paid") continue;
        const amount = r.amount != null ? Number(r.amount) : r.amount_kwd != null ? Number(r.amount_kwd) : 0;
        const cur = r.currency ?? "USD";
        byCurrency.set(cur, (byCurrency.get(cur) ?? 0) + amount);
      }
      totalRevenue = [...byCurrency.entries()].map(([currency, amount]) => ({ currency, amount }));
    }

    // إحصاء لكل قضية.
    const { data: caseRows } = await supabaseAdmin
      .from("cases")
      .select("id, title, sort_order")
      .order("sort_order", { ascending: true });
    const { data: trialsRows } = await supabaseAdmin
      .from("case_trials")
      .select("case_id, user_id")
      .limit(5000);

    const cases: AdminCaseStat[] = (caseRows ?? []).map((c) => {
      const rows = purchaseRows.filter((p) => p.case_id === c.id);
      return {
        caseId: c.id,
        title: c.title as string | null,
        paidPurchases: rows.filter((p) => p.status === "paid").length,
        pendingPurchases: rows.filter((p) => p.status !== "paid" && p.status !== "failed").length,
        failedPurchases: rows.filter((p) => p.status === "failed").length,
        trialPlayers: new Set(
          (trialsRows ?? []).filter((t) => t.case_id === c.id).map((t) => t.user_id),
        ).size,
      };
    });

    // آخر الغرف مع عدد لاعبيها.
    let rooms: AdminRoomRow[] | null = null;
    const { data: roomRows } = await supabaseAdmin
      .from("rooms")
      .select("code, case_id, phase, updated_at")
      .order("updated_at", { ascending: false })
      .limit(15);
    if (roomRows) {
      const codes = roomRows.map((r) => r.code);
      const { data: players } = await supabaseAdmin
        .from("room_players")
        .select("room_code")
        .in("room_code", codes);
      rooms = roomRows.map((r) => ({
        code: r.code,
        caseId: r.case_id,
        phase: r.phase,
        players: (players ?? []).filter((p) => p.room_code === r.code).length,
        updatedAt: r.updated_at,
      }));
    }

    // نشاط اللاعبين.
    let activity: AdminActivityRow[] | null = null;
    let activity7dByType: AdminOverview["activity7dByType"] = null;
    const { data: events } = await supabaseAdmin
      .from("player_events")
      .select("id, event_type, case_id, room_code, path, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (events) {
      activity = events.map((e) => ({
        id: e.id,
        eventType: e.event_type,
        caseId: e.case_id,
        roomCode: e.room_code,
        path: e.path,
        userId: e.user_id,
        createdAt: e.created_at,
      }));
    }
    const { data: recent } = await supabaseAdmin
      .from("player_events")
      .select("event_type")
      .gte("created_at", since7d)
      .limit(5000);
    if (recent) {
      const byType = new Map<string, number>();
      for (const r of recent) byType.set(r.event_type, (byType.get(r.event_type) ?? 0) + 1);
      activity7dByType = [...byType.entries()]
        .map(([eventType, c]) => ({ eventType, count: c }))
        .sort((a, b) => b.count - a.count);
    }

    return {
      allowed: true,
      totalProfiles,
      newProfiles7d,
      totalPurchases,
      paidPurchases,
      totalRevenue,
      totalRooms,
      activeRooms,
      totalRoomPlayers,
      activeProgress,
      trialRows,
      webhookEvents,
      cases,
      rooms,
      activity,
      activityTotal,
      activity7dByType,
      contactSubmissions,
    };
  });
