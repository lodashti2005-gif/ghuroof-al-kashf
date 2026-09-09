/**
 * صفحة الدفع — تفتح Paddle Checkout الحقيقي لعملية (transaction) منشأة مسبقاً.
 *
 * ما فيه أي منح ملكية من هنا: الملكية تُفتح فقط من webhook بعد
 * transaction.completed. هذي الصفحة تعرض نموذج الدفع فقط.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Loader2, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { AccountMenu } from "@/components/site/account-menu";
import { Eyebrow, Panel } from "@/components/game/ui";
import { GAME_NAME } from "@/game/game-meta";
import { getPaddleClientConfig } from "@/lib/paddle-client.functions";
import { trackEvent } from "@/lib/activity";
import { useI18n } from "@/i18n";

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (env: string) => void };
      Initialize: (opts: { token: string }) => void;
      Checkout: { open: (opts: Record<string, unknown>) => void };
    };
  }
}

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>) => ({
    txn: typeof search["txn"] === "string" ? (search["txn"] as string) : undefined,
    _ptxn: typeof search["_ptxn"] === "string" ? (search["_ptxn"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "إتمام الدفع — ورا السالفة" },
      {
        name: "description",
        content: "أكمل دفع قضية ورا السالفة بأمان، وبعد تأكيد الدفع تفتح القضية على حسابك.",
      },
      { property: "og:title", content: "إتمام الدفع — ورا السالفة" },
      { property: "og:description", content: "دفع آمن لفتح القضية كاملة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CheckoutPage,
});

function loadPaddleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Paddle) return resolve();
    const existing = document.querySelector<HTMLScriptElement>("script[data-paddle-js]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("paddle_js_failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.dataset["paddleJs"] = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("paddle_js_failed"));
    document.head.appendChild(script);
  });
}

function CheckoutPage() {
  const search = Route.useSearch();
  const transactionId = search.txn ?? search._ptxn ?? null;
  const fetchConfig = useServerFn(getPaddleClientConfig);
  const { pick, lang, dir } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!transactionId) {
      setError(
        pick(
          "ما فيه عملية دفع مرتبطة بهذا الرابط. ابدأ الشراء من صفحة القضية.",
          "No payment is linked to this link. Start the purchase from the case page.",
        ),
      );
      return;
    }

    (async () => {
      try {
        const config = await fetchConfig();
        if (cancelled) return;
        if (!config.token) {
          setError(
            pick(
              "تعذر إكمال العملية، حاول مرة أخرى أو تواصل معنا على contact@waralsalfa.com",
              "We couldn't complete the payment. Try again or contact us at contact@waralsalfa.com",
            ),
          );
          return;
        }
        await loadPaddleScript();
        if (cancelled || !window.Paddle) return;
        window.Paddle.Environment.set(config.environment);
        window.Paddle.Initialize({ token: config.token });
        window.Paddle.Checkout.open({
          transactionId,
          settings: {
            displayMode: "inline",
            frameTarget: "paddle-checkout-frame",
            frameInitialHeight: 480,
            frameStyle: "width:100%; min-width:312px; background-color: transparent; border: none;",
            locale: lang,
            successUrl: `${window.location.origin}/purchases`,
          },
        });
        setReady(true);
        // تتبّع تسويقي فقط — بدون أي تأثير على الدفع.
        void trackEvent("checkout_open", { path: "/checkout" });
      } catch {
        if (!cancelled)
          setError(
            pick(
              "ما قدرنا نفتح صفحة الدفع. جرّب مرة ثانية بعد شوي.",
              "We couldn't open the payment page. Please try again shortly.",
            ),
          );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [transactionId, fetchConfig, pick, lang]);

  return (
    <div dir={dir} className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg file-tape">
              <ShieldAlert className="size-4.5" />
            </span>
            <span className="font-display text-sm font-bold">{GAME_NAME}</span>
          </Link>
          <div className="flex items-center gap-3">
            <AccountMenu />
            <Link
              to="/cases"
              className="inline-flex items-center gap-1.5 font-display text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {pick("رجوع للقضايا", "Back to cases")}{" "}
              <ArrowRight className={`size-3.5 ${dir === "ltr" ? "rotate-180" : ""}`} />
            </Link>
          </div>
        </header>

        <Panel className="cine-in mt-8">
          <Eyebrow>{pick("دفع آمن", "Secure payment")}</Eyebrow>
          <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
            {pick("إتمام الدفع", "Complete your payment")}
          </h1>
          {error ? (
            <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm leading-relaxed">
              {error}
            </p>
          ) : (
            <>
              {!ready && (
                <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />{" "}
                  {pick("جاري تحضير صفحة الدفع...", "Preparing the payment page...")}
                </p>
              )}
              <div className="paddle-checkout-frame mt-4" />
              <p className="mt-4 text-center font-mono text-[11px] leading-relaxed text-muted-foreground">
                {pick(
                  "القضية تنفتح تلقائياً بعد تأكيد الدفع. للمساعدة: contact@waralsalfa.com",
                  "The case unlocks automatically once payment is confirmed. Need help: contact@waralsalfa.com",
                )}
              </p>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
