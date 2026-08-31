/**
 * لوحة المالك — للمشرف فقط (تحقّق من الخادم عبر has_role).
 *
 * أي زائر أو مستخدم عادي يُحوّل تلقائياً للرئيسية ولا يرى أي بيانات.
 * كل الأرقام مقروءة فعلياً من قاعدة البيانات؛ أي بيانات غير مخزّنة تُعرض
 * كـ«غير متاح» بدون أرقام وهمية. لا تغيير على اللعب أو الدفع.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  CreditCard,
  DoorOpen,
  Filter,
  Loader2,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { Eyebrow, Panel } from "@/components/game/ui";
import { GAME_NAME } from "@/game/game-meta";
import { getAdminOverview } from "@/lib/admin.functions";
import type { AdminOverview } from "@/lib/admin-overview";
import { getAnalyticsReport } from "@/lib/analytics.functions";
import {
  ADS_LAUNCH_DATE,
  SOURCE_LABEL,
  type AnalyticsReport,
} from "@/lib/analytics-overview";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "لوحة المالك | ورا السالفة" },
      { name: "description", content: "لوحة إدارة ورا السالفة — للمشرف فقط." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "لوحة المالك | ورا السالفة" },
      { property: "og:description", content: "لوحة إدارة ورا السالفة — للمشرف فقط." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminDashboardPage,
});

const EVENT_LABEL: Record<string, string> = {
  site_open: "فتح الموقع",
  case_start: "بدء قضية",
  room_create: "إنشاء غرفة",
  room_join: "دخول غرفة",
};

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | null;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 px-4 py-3">
      <p className="font-display text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-extrabold">
        {value == null ? (
          <span className="text-sm font-medium text-muted-foreground">غير متاح</span>
        ) : (
          value.toLocaleString("ar-KW")
        )}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <Panel className="mt-5">
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-lg bg-primary/15 text-primary">
          {icon}
        </span>
        <h2 className="font-display text-sm font-bold">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </Panel>
  );
}

const LAUNCH_ISO = `${ADS_LAUNCH_DATE}T00:00:00.000Z`;
const ALL_TIME_ISO = "2000-01-01T00:00:00.000Z";

function AdminDashboardPage() {
  const fetchOverview = useServerFn(getAdminOverview);
  const fetchAnalytics = useServerFn(getAnalyticsReport);
  const navigate = useNavigate();
  const [state, setState] = useState<AdminOverview | null>(null);
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [range, setRange] = useState<"launch" | "all">("launch");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const since = range === "launch" ? LAUNCH_ISO : ALL_TIME_ISO;
      const [result, analytics] = await Promise.all([
        fetchOverview({ data: undefined }),
        fetchAnalytics({ data: { since } }),
      ]);
      if (!result.allowed) {
        navigate({ to: "/" });
        return;
      }
      setState(result);
      setReport(analytics.allowed ? analytics : null);
    } catch {
      navigate({ to: "/" });
      return;
    } finally {
      setLoading(false);
    }
  }, [fetchOverview, fetchAnalytics, navigate, range]);

  useEffect(() => {
    void load();
  }, [load]);

  // ما نعرض أي شي قبل تأكيد الصلاحية من الخادم.
  if (!state || !state.allowed) return null;

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg file-tape">
              <ShieldCheck className="size-4.5" />
            </span>
            <span className="font-display text-sm font-bold">{GAME_NAME}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/paddle-events"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3.5 py-2 font-display text-xs font-bold transition-colors hover:bg-surface-3"
            >
              <CreditCard className="size-3.5" /> أحداث الدفع
            </Link>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 font-display text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <RefreshCw className="size-3.5" /> تحديث
            </button>
          </div>
        </header>

        <Panel className="cine-in mt-8">
          <Eyebrow>لوحة المالك</Eyebrow>
          <h1 className="mt-2 text-2xl font-extrabold">ملخص المشروع</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            كل الأرقام هنا مقروءة مباشرة من قاعدة البيانات. أي بيانات غير مخزّنة حالياً
            تظهر «غير متاح».
          </p>
          {loading ? (
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> جاري التحديث...
            </p>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="حسابات مسجّلة" value={state.totalProfiles} />
            <Stat label="حسابات جديدة (٧ أيام)" value={state.newProfiles7d} />
            <Stat label="عمليات شراء مؤكدة" value={state.paidPurchases} />
            <Stat
              label="إجمالي عمليات الشراء"
              value={state.totalPurchases}
              hint="تشمل المعلّقة والمرفوضة"
            />
            <Stat label="غرف مُنشأة" value={state.totalRooms} />
            <Stat label="غرف نشطة (آخر ساعة)" value={state.activeRooms} />
            <Stat label="لاعبون داخل الغرف" value={state.totalRoomPlayers} />
            <Stat label="جلسات لعب محفوظة نشطة" value={state.activeProgress} />
            <Stat label="حسابات جرّبت الفترة التجريبية" value={state.trialRows} />
            <Stat label="أحداث دفع مسجّلة" value={state.webhookEvents} />
            <Stat label="رسائل تواصل" value={state.contactSubmissions} />
            <Stat label="أحداث نشاط مسجّلة" value={state.activityTotal} />
          </div>

          {state.totalRevenue && state.totalRevenue.length > 0 ? (
            <div className="mt-4 rounded-xl border border-border bg-surface-2 px-4 py-3">
              <p className="font-display text-[11px] text-muted-foreground">
                إجمالي المبالغ المؤكدة
              </p>
              <p className="mt-1 font-mono text-sm">
                {state.totalRevenue
                  .map((r) => `${r.amount.toFixed(2)} ${r.currency}`)
                  .join(" · ")}
              </p>
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-muted-foreground">
              ما فيه أي مبالغ مؤكدة مسجّلة حتى الآن.
            </p>
          )}
        </Panel>

        <Section icon={<Users className="size-4" />} title="القضايا">
          {state.cases.length === 0 ? (
            <p className="text-sm text-muted-foreground">ما فيه قضايا مسجّلة.</p>
          ) : (
            <ul className="space-y-2">
              {state.cases.map((c) => (
                <li
                  key={c.caseId}
                  className="rounded-xl border border-border bg-surface-2 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-display text-xs font-bold">
                      {c.title ?? c.caseId}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {c.caseId}
                    </span>
                  </div>
                  <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                    مؤكدة: {c.paidPurchases} · معلّقة: {c.pendingPurchases} · مرفوضة:{" "}
                    {c.failedPurchases} · جرّبوا القضية: {c.trialPlayers}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section icon={<DoorOpen className="size-4" />} title="آخر الغرف">
          {state.rooms == null ? (
            <p className="text-sm text-muted-foreground">غير متاح.</p>
          ) : state.rooms.length === 0 ? (
            <p className="text-sm text-muted-foreground">ما فيه أي غرفة مسجّلة.</p>
          ) : (
            <ul className="space-y-2">
              {state.rooms.map((r) => (
                <li
                  key={r.code}
                  className="rounded-xl border border-border bg-surface-2 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-display text-xs font-bold">غرفة {r.code}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {new Date(r.updatedAt).toLocaleString("ar-KW")}
                    </span>
                  </div>
                  <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                    القضية: {r.caseId} · المرحلة: {r.phase} · اللاعبون: {r.players}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section icon={<Activity className="size-4" />} title="نشاط اللاعبين">
          {state.activity7dByType && state.activity7dByType.length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {state.activity7dByType.map((a) => (
                <span
                  key={a.eventType}
                  className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 font-display text-[11px]"
                >
                  {EVENT_LABEL[a.eventType] ?? a.eventType}: {a.count}
                </span>
              ))}
            </div>
          ) : null}

          {state.activity == null ? (
            <p className="text-sm text-muted-foreground">غير متاح.</p>
          ) : state.activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              التتبّع جاهز وشغّال، لكن ما وصل أي حدث لحد الآن.
            </p>
          ) : (
            <ul className="space-y-2">
              {state.activity.map((e) => (
                <li
                  key={e.id}
                  className="rounded-xl border border-border bg-surface-2 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-display text-xs font-bold">
                      {EVENT_LABEL[e.eventType] ?? e.eventType}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {new Date(e.createdAt).toLocaleString("ar-KW")}
                    </span>
                  </div>
                  <p className="mt-1.5 break-all font-mono text-[11px] text-muted-foreground">
                    {e.userId ? "مستخدم مسجّل" : "زائر"}
                    {e.caseId ? ` · قضية: ${e.caseId}` : ""}
                    {e.roomCode ? ` · غرفة: ${e.roomCode}` : ""}
                    {e.path ? ` · ${e.path}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
