/**
 * صفحة مراقبة أحداث Paddle — للمشرف فقط.
 * قراءة فقط: كل صف يبيّن العملية والقضية والمستخدم والنتيجة، مع تنبيه لأي تكرار.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, ArrowRight, Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Eyebrow, Panel } from "@/components/game/ui";
import { GAME_NAME } from "@/game/game-meta";
import { listPaddleEvents, type PaddleEventsResult } from "@/lib/paddle-events.functions";

export const Route = createFileRoute("/admin/paddle-events")({
  head: () => ({
    meta: [
      { title: "سجل أحداث الدفع — ورا السالفة" },
      {
        name: "description",
        content: "لوحة مشرف لمراجعة أحداث بوابة الدفع في ورا السالفة والتأكد من فتح القضايا بدون تكرار.",
      },
      { property: "og:title", content: "سجل أحداث الدفع — ورا السالفة" },
      { property: "og:description", content: "مراجعة أحداث بوابة الدفع وفتح القضايا." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PaddleEventsPage,
});

const OUTCOME_LABEL: Record<string, string> = {
  granted: "فُتحت القضية",
  duplicate: "مكرر — تجاهل",
  ignored: "حدث غير معني",
  missing_custom_data: "بيانات ناقصة",
  db_error: "خطأ بالقاعدة",
  rejected: "مرفوض — توقيع غير صحيح",
};

function PaddleEventsPage() {
  const fetchEvents = useServerFn(listPaddleEvents);
  const [state, setState] = useState<PaddleEventsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setState(await fetchEvents({ data: undefined }));
    } catch {
      setError(true);
      setState(null);
    } finally {
      setLoading(false);
    }
  }, [fetchEvents]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg file-tape">
              <ShieldAlert className="size-4.5" />
            </span>
            <span className="font-display text-sm font-bold">{GAME_NAME}</span>
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 font-display text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <RefreshCw className="size-3.5" /> تحديث
          </button>
        </header>

        <Panel className="cine-in mt-8">
          <Eyebrow>مراقبة الدفع</Eyebrow>
          <h1 className="mt-2 text-2xl font-extrabold">سجل أحداث بوابة الدفع</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            آخر 100 حدث وصل من Paddle: رقم العملية، القضية، المستخدم، ونتيجة المعالجة.
          </p>

          {loading ? (
            <p className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> جاري التحميل...
            </p>
          ) : error || !state ? (
            <p className="mt-6 text-sm text-muted-foreground">
              ما قدرنا نقرأ السجل. سجّل دخول بحساب المشرف وجرّب مرة ثانية.{" "}
              <Link to="/auth" className="underline">
                دخول
              </Link>
            </p>
          ) : !state.allowed ? (
            <p className="mt-6 text-sm text-muted-foreground">
              هذي الصفحة للمشرف بس.{" "}
              <Link to="/cases" className="inline-flex items-center gap-1 underline">
                رجوع للقضايا <ArrowRight className="size-3.5" />
              </Link>
            </p>
          ) : (
            <>
              {state.duplicateTransactions.length > 0 ? (
                <p className="mt-5 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>
                    فيه عمليات انفتحت أكثر من مرة: {state.duplicateTransactions.join("، ")}
                  </span>
                </p>
              ) : (
                <p className="mt-5 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-muted-foreground">
                  ما فيه أي تكرار في فتح القضايا ضمن هالسجل.
                </p>
              )}

              {state.rows.length === 0 ? (
                <p className="mt-5 text-sm text-muted-foreground">
                  ما وصل أي حدث من Paddle لحد الآن.
                </p>
              ) : (
                <ul className="mt-5 space-y-2">
                  {state.rows.map((row) => (
                    <li
                      key={row.id}
                      className="rounded-xl border border-border bg-surface-2 px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-display text-xs font-bold">
                          {OUTCOME_LABEL[row.outcome] ?? row.outcome}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {new Date(row.createdAt).toLocaleString("ar-KW")}
                        </span>
                      </div>
                      <p className="mt-1.5 break-all font-mono text-[11px] leading-relaxed text-muted-foreground">
                        {row.eventType} · {row.transactionId ?? "—"} · قضية: {row.caseId ?? "—"} ·
                        مستخدم: {row.userId ?? "—"}
                        {row.amount != null ? ` · ${row.amount} ${row.currency ?? ""}` : ""}
                        {row.detail ? ` · ${row.detail}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
