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
import { useState } from "react";

import { Eyebrow, Panel } from "@/components/game/ui";
import { GAME_NAME, getCaseById } from "@/game/game-meta";
import { useCaseEntitlement } from "@/game/use-entitlement";
import {
  PAYMENT_GATEWAY,
  PAYMENT_METHODS,
  formatCasePrice,
  getCasePricing,
} from "@/game/pricing";
import { startCasePurchase, type PurchaseIntentResult } from "@/lib/purchase.functions";

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

  const [method, setMethod] = useState(PAYMENT_METHODS[0]?.id ?? "knet");
  const [busy, setBusy] = useState(false);
  const [intent, setIntent] = useState<PurchaseIntentResult | null>(null);

  const priceText = formatCasePrice(caseId, entitlement?.priceKwd ?? null);
  const owned = entitlement?.purchased === true;

  const backTo = room ? "/last-trip/scene" : "/cases";
  const backLabel = room ? "رجوع للغرفة" : "رجوع للقضايا";

  async function onPay() {
    setBusy(true);
    try {
      const result = await requestPurchase({ data: { caseId, room } });
      setIntent(result);
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      await reload();
    } catch {
      setIntent({
        status: "gateway_unconfigured",
        checkoutUrl: null,
        message: "صار خطأ بالاتصال. جرّب مرة ثانية بعد شوي.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg file-tape">
              <ShieldAlert className="size-4.5" />
            </span>
            <span className="font-display text-sm font-bold">{GAME_NAME}</span>
          </Link>
          <Link
            to={backTo}
            className="inline-flex items-center gap-1.5 font-display text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {backLabel} <ArrowRight className="size-3.5" />
          </Link>
        </header>

        <Panel className="cine-in mt-8">
          <Eyebrow>فتح القضية كاملة</Eyebrow>
          <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
            {meta?.title ?? entitlement?.title ?? "القضية"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {meta?.teaser ??
              "افتح القضية كاملة لكل الفريق — تقدّمكم والأدلة اللي لقيتوها محفوظة وتكملون من نفس المكان."}
          </p>

          {/* السعر */}
          <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3.5">
            <div>
              <p className="font-display text-xs text-muted-foreground">سعر القضية</p>
              <p className="mt-1 font-display text-xl font-extrabold">{priceText}</p>
            </div>
            <p className="max-w-[9.5rem] text-left font-mono text-[11px] leading-relaxed text-muted-foreground">
              دفعة واحدة {pricing ? `(${pricing.currency})` : ""} — واحد بس يشتري ويفتح الغرفة
            </p>
          </div>

          {/* طريقة الدفع */}
          <div className="mt-5 rounded-xl border border-border bg-surface-2 px-4 py-3.5">
            <p className="font-display text-xs font-bold text-muted-foreground">طريقة الدفع</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm">
              <CreditCard className="size-3.5" /> تختار وسيلة الدفع داخل صفحة الدفع الآمنة
            </p>
          </div>


          {/* حالة العملية */}
          <div className="mt-5 rounded-xl border border-border bg-surface-2 px-4 py-3.5">
            <p className="font-display text-xs font-bold text-muted-foreground">حالة العملية</p>
            <p className="mt-1.5 text-sm leading-relaxed">
              {loading
                ? "جاري التحقق من حالة الملكية..."
                : signedIn === false
                  ? "سجّل دخول أول عشان الشراء يتسجّل على حسابك."
                  : owned
                    ? "القضية مفتوحة على حسابك — تقدر تكمل من نفس المكان."
                    : entitlement?.purchaseStatus === "pending"
                      ? "فيه عملية شراء قيد المعالجة. أول ما يتأكد الدفع تفتح القضية تلقائياً."
                      : intent
                        ? intent.message
                        : entitlement?.gatewayStatus === "unconfigured"
                          ? "بوابة الدفع لِسِه ما تربطت. اضغط «ادفع وافتح القضية» وبنسجل طلبك."
                          : "جاهز للدفع."}
            </p>
            <p className="mt-2 font-mono text-[11px] text-muted-foreground">
              حالة البوابة:{" "}
              {entitlement?.gatewayStatus === "live"
                ? "مفعّلة"
                : entitlement?.gatewayStatus === "sandbox"
                  ? "تجريبية"
                  : "غير مربوطة"}
              {entitlement?.provider ? ` — ${entitlement.provider}` : ""}
            </p>
          </div>

          {/* الإجراء */}
          {owned ? (
            <Link
              to={backTo}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-display text-base font-bold text-primary-foreground"
            >
              <BadgeCheck className="size-4.5" /> كمّل القضية
            </Link>
          ) : signedIn === false ? (
            <Link
              to="/auth"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-display text-base font-bold text-primary-foreground"
            >
              <Lock className="size-4.5" /> دخول للحساب
            </Link>
          ) : (
            <button
              type="button"
              onClick={onPay}
              disabled={busy || loading}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-display text-base font-bold text-primary-foreground disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4.5 animate-spin" /> : <ShoppingCart className="size-4.5" />}
              ادفع وافتح القضية
            </button>
          )}

          <button
            type="button"
            onClick={() => void reload()}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 font-display text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="size-3.5" /> تحقق من حالة الدفع
          </button>

          <p className="mt-4 text-center font-mono text-[11px] leading-relaxed text-muted-foreground">
            تقدّمكم والأدلة والغرفة محفوظة — الشراء ما يصفّر أي شي.
            {PAYMENT_GATEWAY.supportContact ? ` للمساعدة: ${PAYMENT_GATEWAY.supportContact}` : ""}
          </p>
        </Panel>
      </div>
    </div>
  );
}
