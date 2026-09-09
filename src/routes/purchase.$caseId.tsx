/**
 * صفحة شراء قضية — عربية RTL بنفس هوية اللعبة.
 *
 * لا يوجد أي شراء وهمي: الزر يطلب من الخادم بدء عملية دفع، والخادم حالياً
 * يرجّع أن البوابة غير مربوطة. فتح النسخة الكاملة يعتمد فقط على حالة الملكية
 * الموثوقة من الخادم. تقدّم اللاعب والغرفة ما يتأثر — الرجوع يودّي لنفس المكان.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  Loader2,
  Lock,
  RefreshCw,
  ShieldAlert,
  ShoppingCart,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AccountMenu } from "@/components/site/account-menu";
import { Eyebrow, Panel } from "@/components/game/ui";
import { GAME_NAME, getCaseById } from "@/game/game-meta";
import { useCaseEntitlement } from "@/game/use-entitlement";
import { formatCasePrice, getCasePricing } from "@/game/pricing";
import { startCasePurchase, type PurchaseIntentResult } from "@/lib/purchase.functions";
import { trackEvent } from "@/lib/activity";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/purchase/$caseId")({
  validateSearch: (search: Record<string, unknown>) => ({
    room: typeof search["room"] === "string" ? (search["room"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "شراء القضية — ورا السالفة" },
      {
        name: "description",
        content:
          "صفحة شراء قضية في ورا السالفة: شوف سعر القضية وطريقة الدفع وحالة العملية، وافتح القضية كاملة على حسابك.",
      },
      { property: "og:title", content: "شراء القضية — ورا السالفة" },
      {
        property: "og:description",
        content: "افتح القضية كاملة وكمّل من نفس المكان بنفس الغرفة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PurchasePage,
});

function PurchasePage() {
  const { caseId } = Route.useParams();
  const { room } = Route.useSearch();
  const meta = getCaseById(caseId);
  const pricing = getCasePricing(caseId);
  const { entitlement, signedIn, loading, reload } = useCaseEntitlement(caseId);
  const requestPurchase = useServerFn(startCasePurchase);
  const { pick, lang, dir } = useI18n();

  const [busy, setBusy] = useState(false);
  const [intent, setIntent] = useState<PurchaseIntentResult | null>(null);

  const priceText = formatCasePrice(caseId, entitlement?.priceKwd ?? null, lang);
  const owned = entitlement?.purchased === true;

  const backTo = room ? "/last-trip/scene" : "/cases";
  const backLabel = room ? pick("رجوع للغرفة", "Back to the room") : pick("رجوع للقضايا", "Back to cases");

  // تتبّع تسويقي فقط — ما يأثر على الشراء ولا على فتح القضية.
  useEffect(() => {
    void trackEvent("case_view", { caseId, path: "/purchase" });
    void trackEvent("purchase_view", { caseId, path: "/purchase" });
  }, [caseId]);
  useEffect(() => {
    if (owned) void trackEvent("case_unlocked", { caseId, path: "/purchase" });
  }, [owned, caseId]);

  async function onPay() {
    void trackEvent("pay_click", { caseId, path: "/purchase" });
    setBusy(true);
    try {
      const result = await requestPurchase({ data: { caseId, room } });
      setIntent(result);
      if (result.transactionId) {
        // نفتح Paddle Checkout الحقيقي داخل الموقع بنفس العملية المنشأة.
        window.location.href = `/checkout?txn=${encodeURIComponent(result.transactionId)}`;
        return;
      }
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      await reload();
    } catch {
      setIntent({
        status: "gateway_unconfigured",
        checkoutUrl: null,
        transactionId: null,
        message: pick(
          "صار خطأ بالاتصال. جرّب مرة ثانية بعد شوي.",
          "Connection error. Please try again shortly.",
        ),
      });
    } finally {
      setBusy(false);
    }
  }

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
              to={backTo}
              className="inline-flex items-center gap-1.5 font-display text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {backLabel} <ArrowRight className={`size-3.5 ${dir === "ltr" ? "rotate-180" : ""}`} />
            </Link>
          </div>
        </header>

        <Panel className="cine-in mt-8">
          <Eyebrow>{pick("فتح القضية كاملة", "Unlock the full case")}</Eyebrow>
          <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
            {pick(meta?.title, meta?.titleEn) ?? entitlement?.title ?? pick("القضية", "The case")}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {pick(meta?.teaser, meta?.teaserEn) ??
              pick(
                "افتح القضية كاملة لكل الفريق — تقدّمكم والأدلة اللي لقيتوها محفوظة وتكملون من نفس المكان.",
                "Unlock the full case for the whole team — your progress and the evidence you found stay saved, and you continue from the same spot.",
              )}
          </p>

          {/* السعر */}
          <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3.5">
            <div>
              <p className="font-display text-xs text-muted-foreground">{pick("سعر القضية", "Case price")}</p>
              <p className="mt-1 font-display text-xl font-extrabold">{priceText}</p>
            </div>
            <p className="max-w-[9.5rem] text-left font-mono text-[11px] leading-relaxed text-muted-foreground">
              {pick(
                "دفعة واحدة — واحد بس يشتري ويفتح الغرفة",
                "One payment — only one player buys and opens the room",
              )}
            </p>
          </div>

          {/* طريقة الدفع */}
          <div className="mt-5 rounded-xl border border-border bg-surface-2 px-4 py-3.5">
            <p className="font-display text-xs font-bold text-muted-foreground">
              {pick("طريقة الدفع", "Payment method")}
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm">
              <CreditCard className="size-3.5" />{" "}
              {pick(
                "تختار وسيلة الدفع داخل صفحة الدفع الآمنة",
                "You pick your payment method on the secure payment page",
              )}
            </p>
          </div>


          {/* حالة العملية */}
          <div className="mt-5 rounded-xl border border-border bg-surface-2 px-4 py-3.5">
            <p className="font-display text-xs font-bold text-muted-foreground">
              {pick("حالة العملية", "Transaction status")}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed">
              {loading
                ? pick("جاري التحقق من حالة الملكية...", "Checking your access status...")
                : signedIn === false
                  ? pick(
                      "سجّل دخول أول عشان الشراء يتسجّل على حسابك.",
                      "Sign in first so the purchase is saved to your account.",
                    )
                  : owned
                    ? pick(
                        "القضية مفتوحة على حسابك — تقدر تكمل من نفس المكان.",
                        "This case is unlocked on your account — you can continue from the same spot.",
                      )
                    : entitlement?.purchaseStatus === "pending"
                      ? pick(
                          "بانتظار تأكيد الدفع — أول ما يتأكد تفتح القضية تلقائياً.",
                          "Waiting for payment confirmation — the case unlocks automatically once it clears.",
                        )
                      : intent
                        ? intent.status === "gateway_unconfigured"
                          ? pick(
                              "تعذر إكمال العملية الآن، حاول مرة أخرى.",
                              "We couldn't complete the transaction right now — please try again.",
                            )
                          : pick(
                              "تم إعداد عملية الدفع. أكمل الدفع في نافذة الدفع الآمنة.",
                              "Your payment is set up. Finish it in the secure payment window.",
                            )
                        : pick("جاهز للدفع.", "Ready to pay.")}
            </p>
          </div>

          {/* الإجراء */}
          {owned ? (
            <Link
              to={backTo}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-display text-base font-bold text-primary-foreground"
            >
              <BadgeCheck className="size-4.5" /> {pick("كمّل القضية", "Continue the case")}
            </Link>
          ) : signedIn === false ? (
            <Link
              to="/auth"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-display text-base font-bold text-primary-foreground"
            >
              <Lock className="size-4.5" /> {pick("دخول للحساب", "Sign in to your account")}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onPay}
              disabled={busy || loading}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-display text-base font-bold text-primary-foreground disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4.5 animate-spin" /> : <ShoppingCart className="size-4.5" />}
              {pick("ادفع وافتح القضية", "Pay and unlock the case")}
            </button>
          )}

          <button
            type="button"
            onClick={() => void reload()}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 font-display text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="size-3.5" /> {pick("تحقق من حالة الدفع", "Check payment status")}
          </button>

          <p className="mt-4 text-center font-mono text-[11px] leading-relaxed text-muted-foreground">
            {pick(
              "تقدّمكم والأدلة والغرفة محفوظة — الشراء ما يصفّر أي شي. للمساعدة: contact@waralsalfa.com",
              "Your progress, evidence and room stay saved — buying resets nothing. Need help: contact@waralsalfa.com",
            )}
          </p>
        </Panel>
      </div>
    </div>
  );
}
