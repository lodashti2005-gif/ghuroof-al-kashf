/**
 * صفحة «مشترياتي» — تعرض حالة كل عملية دفع (بانتظار / مؤكد / مرفوض) مرتبطة بالقضية.
 * قراءة فقط: ما تفتح أي قضية، والفتح يصير من webhook مرة وحدة فقط.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, FileSearch, Loader2, RefreshCw, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AccountMenu } from "@/components/site/account-menu";
import { Eyebrow, Panel } from "@/components/game/ui";
import { GAME_NAME } from "@/game/game-meta";
import { useI18n, type Lang } from "@/i18n";
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

const STATUS_UI: Record<
  PurchaseUiStatus,
  { label: string; labelEn: string; className: string; Icon: typeof Clock }
> = {
  paid: {
    label: "مؤكد",
    labelEn: "Confirmed",
    className: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
    Icon: CheckCircle2,
  },
  pending: {
    label: "بانتظار التأكيد",
    labelEn: "Awaiting confirmation",
    className: "text-amber-400 border-amber-500/40 bg-amber-500/10",
    Icon: Clock,
  },
  failed: {
    label: "مرفوض",
    labelEn: "Declined",
    className: "text-destructive border-destructive/40 bg-destructive/10",
    Icon: XCircle,
  },
};

function fmt(date: string | null, lang: Lang = "ar") {
  if (!date) return "—";
  return new Date(date).toLocaleString(lang === "en" ? "en-GB" : "ar-KW", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const POLL_MS = 5000;
const POLL_WINDOW_MS = 5 * 60 * 1000;

function PurchasesPage() {
  const fetchPurchases = useServerFn(listMyPurchases);
  const { pick, lang, dir } = useI18n();
  const [state, setState] = useState<MyPurchasesResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (silent) setSyncing(true);
      else setLoading(true);
      if (!silent) setError(false);
      try {
        setState(await fetchPurchases({ data: undefined }));
        setError(false);
        setLastSync(new Date());
      } catch {
        if (!silent) {
          setError(true);
          setState(null);
        }
      } finally {
        if (silent) setSyncing(false);
        else setLoading(false);
      }
    },
    [fetchPurchases],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // تحديث لحظي قصير: نستمر بالسحب كل 5 ثواني طالما فيه عملية «بانتظار التأكيد»
  const hasPending = (state?.purchases ?? []).some((p) => p.status === "pending");

  useEffect(() => {
    if (!hasPending) return;
    const startedAt = Date.now();
    const id = window.setInterval(() => {
      if (Date.now() - startedAt > POLL_WINDOW_MS) {
        window.clearInterval(id);
        return;
      }
      if (document.visibilityState === "hidden") return;
      void load(true);
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [hasPending, load]);


  return (
    <div dir={dir} className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg file-tape">
              <FileSearch className="size-4.5" />
            </span>
            <span className="font-display text-sm font-bold">{GAME_NAME}</span>
          </Link>
          <div className="flex items-center gap-3">
            {hasPending ? (
              <span className="inline-flex items-center gap-1.5 font-display text-[11px] text-amber-400">
                <Loader2 className={`size-3.5 ${syncing ? "animate-spin" : ""}`} />{" "}
                {pick("تحديث لحظي", "Live updating")}
              </span>
            ) : null}
            <AccountMenu />
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 font-display text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <RefreshCw className="size-3.5" /> {pick("تحديث", "Refresh")}
            </button>
          </div>
        </header>

        <Panel className="cine-in mt-8">
          <Eyebrow>{pick("الحساب", "Account")}</Eyebrow>
          <h1 className="mt-2 text-2xl font-extrabold">{pick("حالة عمليات الدفع", "Payment status")}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {pick(
              "كل عملية مرتبطة بقضيتها. لو الحالة «بانتظار التأكيد» انتظر تأكيد الدفع — القضية تنفتح مرة وحدة بس ولو تكرر الدفع ما يتكرر الفتح.",
              "Each transaction is tied to its case. If the status is awaiting confirmation, wait for the payment to clear — a case unlocks only once, even if a payment repeats.",
            )}
            {lastSync ? (
              <span className="block opacity-70">
                {pick("آخر تحديث: ", "Last update: ")}
                {fmt(lastSync.toISOString(), lang)}
              </span>
            ) : null}
          </p>


          {loading ? (
            <p className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> {pick("نجيب العمليات…", "Loading transactions…")}
            </p>
          ) : error ? (
            <div className="mt-6 rounded-lg border border-border/60 bg-card/40 p-4 text-sm text-muted-foreground">
              {pick(
                "ما قدرنا نجيب العمليات. تأكد إنك مسجّل دخول ثم ",
                "We couldn't load your transactions. Make sure you're signed in, then ",
              )}
              <Link to="/auth" className="text-foreground underline underline-offset-4">
                {pick("سجّل الدخول", "sign in")}
              </Link>{" "}
              {pick("وحاول مرة ثانية.", "and try again.")}
            </div>
          ) : (state?.purchases.length ?? 0) === 0 ? (
            <div className="mt-6 rounded-lg border border-border/60 bg-card/40 p-4 text-sm text-muted-foreground">
              {pick("ما عندك أي عملية دفع للحين.", "You don't have any transactions yet.")}{" "}
              <Link to="/cases" className="text-foreground underline underline-offset-4">
                {pick("تصفّح القضايا", "Browse the cases")}
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
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-display text-[11px] ${ui.className}`}
                      >
                        <ui.Icon className="size-3.5" /> {pick(ui.label, ui.labelEn)}
                      </span>
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px] text-muted-foreground sm:grid-cols-3">
                      <div>
                        <dt className="opacity-70">{pick("المبلغ", "Amount")}</dt>
                        <dd className="text-foreground">
                          {p.amount != null ? `${p.amount} ${p.currency}` : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="opacity-70">{pick("تاريخ العملية", "Transaction date")}</dt>
                        <dd className="text-foreground">{fmt(p.createdAt, lang)}</dd>
                      </div>
                      <div>
                        <dt className="opacity-70">{pick("تاريخ التأكيد", "Confirmation date")}</dt>
                        <dd className="text-foreground">{fmt(p.purchasedAt, lang)}</dd>
                      </div>
                    </dl>

                    {p.status === "failed" ? (
                      <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
                        {pick(
                          "تعذر إكمال العملية، حاول مرة أخرى.",
                          "We couldn't complete this transaction — please try again.",
                        )}
                      </p>
                    ) : null}

                    {p.attempts > 1 ? (
                      <p className="mt-3 text-[12px] text-muted-foreground">
                        {pick(
                          `فيه ${p.attempts} محاولات دفع لنفس القضية — الفتح صار مرة وحدة فقط بدون تكرار.`,
                          `${p.attempts} payment attempts for the same case — it was unlocked only once, with no repeats.`,
                        )}
                      </p>
                    ) : null}

                    {p.events.length > 0 ? (
                      <details className="mt-3 rounded-lg border border-border/60 bg-background/40 p-3">
                        <summary className="cursor-pointer font-display text-[12px] text-muted-foreground">
                          {pick("سجل أحداث الدفع لهذي القضية", "Payment event log for this case")} (
                          {p.events.length})
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
                                  <span className="text-foreground">{pick(ev.label, ev.labelEn ?? ev.label)}</span>
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-display text-[10px] ${evUi.className}`}
                                  >
                                    <evUi.Icon className="size-3" /> {pick(evUi.label, evUi.labelEn)}
                                  </span>
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                                  <span>{fmt(ev.at, lang)}</span>
                                  {ev.amount != null ? (
                                    <span>
                                      {ev.amount} {ev.currency ?? ""}
                                    </span>
                                  ) : null}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </details>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px]">
                      {p.entitled ? (
                        <>
                          <span className="text-emerald-400">
                            {pick("القضية مفتوحة على حسابك", "This case is unlocked on your account")}
                          </span>
                          <Link to="/cases" className="text-foreground underline underline-offset-4">
                            {pick("ابدأ اللعب", "Start playing")}
                          </Link>
                        </>
                      ) : p.status === "pending" ? (
                        <span className="text-muted-foreground">
                          {pick(
                            "بانتظار تأكيد الدفع — حدّث الصفحة بعد شوي.",
                            "Waiting for payment confirmation — refresh in a moment.",
                          )}
                        </span>
                      ) : (
                        <Link to="/cases" className="text-foreground underline underline-offset-4">
                          {pick("إعادة المحاولة من صفحة القضايا", "Try again from the cases page")}
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
