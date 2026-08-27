/**
 * صفحة «مشترياتي» — تعرض حالة كل عملية دفع (بانتظار / مؤكد / مرفوض) مرتبطة بالقضية.
 * قراءة فقط: ما تفتح أي قضية، والفتح يصير من webhook مرة وحدة فقط.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, FileSearch, Loader2, RefreshCw, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Eyebrow, Panel } from "@/components/game/ui";
import { GAME_NAME } from "@/game/game-meta";
import { listMyPurchases, type MyPurchasesResult, type PurchaseUiStatus } from "@/lib/my-purchases.functions";

export const Route = createFileRoute("/purchases")({
  head: () => ({
    meta: [
      { title: "مشترياتي — حالة الدفع | ورا السالفة" },
      {
        name: "description",
        content: "تابع حالة عمليات الدفع في ورا السالفة: بانتظار التأكيد، مؤكدة، أو مرفوضة، وأي قضية انفتحت على حسابك.",
      },
      { property: "og:title", content: "مشترياتي — حالة الدفع | ورا السالفة" },
      { property: "og:description", content: "حالة عمليات الدفع والقضايا المفتوحة على حسابك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PurchasesPage,
});

const STATUS_UI: Record<PurchaseUiStatus, { label: string; className: string; Icon: typeof Clock }> = {
  paid: { label: "مؤكد", className: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10", Icon: CheckCircle2 },
  pending: { label: "بانتظار التأكيد", className: "text-amber-400 border-amber-500/40 bg-amber-500/10", Icon: Clock },
  failed: { label: "مرفوض", className: "text-destructive border-destructive/40 bg-destructive/10", Icon: XCircle },
};

function fmt(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleString("ar-KW", { dateStyle: "medium", timeStyle: "short" });
}

function PurchasesPage() {
  const fetchPurchases = useServerFn(listMyPurchases);
  const [state, setState] = useState<MyPurchasesResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setState(await fetchPurchases({ data: undefined }));
    } catch {
      setError(true);
      setState(null);
    } finally {
      setLoading(false);
    }
  }, [fetchPurchases]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg file-tape">
              <FileSearch className="size-4.5" />
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
          <Eyebrow>الحساب</Eyebrow>
          <h1 className="mt-2 text-2xl font-extrabold">حالة عمليات الدفع</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            كل عملية مرتبطة بقضيتها. لو الحالة «بانتظار التأكيد» انتظر تأكيد البوابة — القضية تنفتح مرة وحدة بس ولو تكرر الدفع ما يتكرر الفتح.
          </p>

          {loading ? (
            <p className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> نجيب العمليات…
            </p>
          ) : error ? (
            <div className="mt-6 rounded-lg border border-border/60 bg-card/40 p-4 text-sm text-muted-foreground">
              ما قدرنا نجيب العمليات. تأكد إنك مسجّل دخول ثم{" "}
              <Link to="/auth" className="text-foreground underline underline-offset-4">
                سجّل الدخول
              </Link>{" "}
              وحاول مرة ثانية.
            </div>
          ) : (state?.purchases.length ?? 0) === 0 ? (
            <div className="mt-6 rounded-lg border border-border/60 bg-card/40 p-4 text-sm text-muted-foreground">
              ما عندك أي عملية دفع للحين.{" "}
              <Link to="/cases" className="text-foreground underline underline-offset-4">
                تصفّح القضايا
              </Link>
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {state!.purchases.map((p) => {
                const ui = STATUS_UI[p.status];
                return (
                  <li key={p.caseId} className="rounded-xl border border-border/60 bg-card/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h2 className="font-display text-base font-bold">{p.caseTitle ?? p.caseId}</h2>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{p.caseId}</p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-display text-[11px] ${ui.className}`}
                      >
                        <ui.Icon className="size-3.5" /> {ui.label}
                      </span>
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px] text-muted-foreground sm:grid-cols-3">
                      <div>
                        <dt className="opacity-70">المبلغ</dt>
                        <dd className="text-foreground">
                          {p.amount != null ? `${p.amount} ${p.currency}` : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="opacity-70">تاريخ العملية</dt>
                        <dd className="text-foreground">{fmt(p.createdAt)}</dd>
                      </div>
                      <div>
                        <dt className="opacity-70">تاريخ التأكيد</dt>
                        <dd className="text-foreground">{fmt(p.purchasedAt)}</dd>
                      </div>
                      <div className="col-span-2 sm:col-span-3">
                        <dt className="opacity-70">رقم العملية</dt>
                        <dd className="font-mono text-[11px] text-foreground break-all">
                          {p.transactionId ?? "—"}
                        </dd>
                      </div>
                    </dl>

                    {p.status === "failed" && p.failureReason ? (
                      <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
                        سبب الرفض: {p.failureReason}
                      </p>
                    ) : null}

                    {p.attempts > 1 ? (
                      <p className="mt-3 text-[12px] text-muted-foreground">
                        فيه {p.attempts} محاولات دفع لنفس القضية — الفتح صار مرة وحدة فقط بدون تكرار.
                      </p>
                    ) : null}

                    {p.events.length > 0 ? (
                      <details className="mt-3 rounded-lg border border-border/60 bg-background/40 p-3">
                        <summary className="cursor-pointer font-display text-[12px] text-muted-foreground">
                          سجل أحداث الدفع لهذي القضية ({p.events.length})
                        </summary>
                        <ul className="mt-3 space-y-2">
                          {p.events.map((ev) => {
                            const evUi = STATUS_UI[ev.status];
                            return (
                              <li
                                key={ev.id}
                                className="rounded-lg border border-border/50 bg-card/30 px-3 py-2 text-[12px]"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-foreground">
                                    {ev.label}
                                    {ev.eventType ? (
                                      <span className="ms-2 font-mono text-[10px] text-muted-foreground">
                                        {ev.eventType}
                                      </span>
                                    ) : null}
                                  </span>
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-display text-[10px] ${evUi.className}`}
                                  >
                                    <evUi.Icon className="size-3" /> {evUi.label}
                                  </span>
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                                  <span className="font-mono break-all">
                                    {ev.transactionId ?? "بدون رقم عملية"}
                                  </span>
                                  <span>{fmt(ev.at)}</span>
                                  {ev.amount != null ? (
                                    <span>
                                      {ev.amount} {ev.currency ?? ""}
                                    </span>
                                  ) : null}
                                  <span className="opacity-70">
                                    {ev.source === "webhook" ? "من Paddle" : "سجل الشراء"}
                                  </span>
                                </div>
                                {ev.detail ? (
                                  <p className="mt-1 text-[11px] text-muted-foreground">{ev.detail}</p>
                                ) : null}
                              </li>
                            );
                          })}
                        </ul>
                      </details>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px]">
                      {p.entitled ? (
                        <>
                          <span className="text-emerald-400">القضية مفتوحة على حسابك</span>
                          <Link to="/cases" className="text-foreground underline underline-offset-4">
                            ابدأ اللعب
                          </Link>
                        </>
                      ) : p.status === "pending" ? (
                        <span className="text-muted-foreground">بننتظر تأكيد البوابة — حدّث الصفحة بعد شوي.</span>
                      ) : (
                        <Link to="/cases" className="text-foreground underline underline-offset-4">
                          إعادة المحاولة من صفحة القضايا
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
