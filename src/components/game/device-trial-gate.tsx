/**
 * بوابة التجربة المجانية (١٠ دقائق) بدون حساب — مربوطة بالجهاز/المتصفح.
 *
 * - ما تطلب بريد ولا كلمة سر ولا حساب قبل التجربة.
 * - الوقت يبدأ عند ضغط «ابدأ التجربة» فقط، ومحفوظ بقاعدة البيانات فيكمل من
 *   المتبقي بعد الـrefresh أو الخروج والرجوع.
 * - بعد انتهاء الوقت ما فيه تجربة جديدة لنفس الجهاز — يظهر خيار الشراء.
 * - مالك القضية (شراء مؤكد من الخادم) يتجاوز البوابة بالكامل، واللاعب اللي
 *   دخل غرفة أحد ثاني ما يتأثر (تجربة/ملكية المضيف هي الحاكمة).
 *
 * ما تلمس منطق القضايا ولا الأسعار ولا الدفع.
 */
import { Link } from "@tanstack/react-router";
import { Clock, Lock, Play, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";

import { Eyebrow, Panel } from "@/components/game/ui";
import { formatTrialClock, useDeviceTrial } from "@/game/device-trial";
import { formatCasePrice } from "@/game/pricing";

import { useCaseEntitlement } from "@/game/use-entitlement";
import { useRoom } from "@/game/use-room";
import { useI18n } from "@/i18n";
import { trackEvent } from "@/lib/activity";

/** شريط الوقت المتبقي — عرض فقط. */
export function DeviceTrialBadge({ caseId }: { caseId: string }) {
  const { trial } = useDeviceTrial(caseId);
  const { entitlement } = useCaseEntitlement(caseId);
  const { pick } = useI18n();
  if (entitlement?.purchased === true) return null;
  if (!trial?.started || trial.expired) return null;

  return (
    <span
      data-testid="trial-clock"
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/70 px-2.5 py-1 font-mono text-xs text-muted-foreground"
    >
      <Clock className="size-3.5" /> {pick("تجربة مجانية", "Free trial")}{" "}
      {formatTrialClock(trial.remainingSeconds)}
    </span>
  );
}

export function DeviceTrialGate({
  caseId,
  children,
}: {
  caseId: string;
  children: React.ReactNode;
}) {
  const { room, isHost, sim } = useRoom();
  const { entitlement, loading: entLoading, signedIn } = useCaseEntitlement(caseId);
  const { trial, loading, start } = useDeviceTrial(caseId);
  const { lang, dir, pick } = useI18n();
  const [busy, setBusy] = useState(false);

  const priceText = formatCasePrice(caseId, entitlement?.priceKwd ?? null, lang);
  const purchased = entitlement?.purchased === true;


  // تتبّع تسويقي فقط: انتهاء التجربة.
  const expiredNow = !!trial?.started && trial.expired && !purchased;
  useEffect(() => {
    if (expiredNow) void trackEvent("trial_end", { caseId });
  }, [expiredNow, caseId]);

  // لاعب دخل برمز غرفة (غير مضيف) — ما نحسب عليه تجربة جهازه.
  const guest = !!room && room.caseId === caseId && !isHost;

  if (purchased || guest || sim.active) return <>{children}</>;

  // ما نعرض أي شاشة تجربة قبل ما نتأكد من حالة الملكية — المشتري ما لازم يشوف
  // «جرّب النسخة المجانية» ولا لحظة واحدة.
  if (entLoading || signedIn === null || (loading && !trial)) {
    return (
      <div dir={dir} className="grid min-h-screen place-items-center bg-background px-4">
        <p className="font-mono text-xs text-muted-foreground">{pick("لحظة...", "One moment...")}</p>
      </div>
    );
  }

  // ما بدأ التجربة بعد — الوقت ما ينطلق إلا بضغط الزر.
  if (!trial?.started) {
    return (
      <div dir={dir} className="grid min-h-screen place-items-center bg-background px-4 py-10">
        <Panel className="cine-in w-full max-w-lg text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-border bg-secondary/60">
            <Play className="size-5 text-primary" />
          </span>
          <Eyebrow>{pick("تجربة مجانية", "Free trial")}</Eyebrow>
          <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">{pick("جرّب ١٠ دقائق مجاناً", "Try 10 minutes free")}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            {pick(
              "بدون حساب وبدون بيانات. تبدأ الـ١٠ دقائق من لحظة ضغطك على الزر، ولو سويت refresh أو خرجت وترجع تكمل من الوقت المتبقي. التجربة مرة واحدة لكل جهاز.",
              "No account and no details needed. The 10 minutes start the moment you tap the button, and if you refresh or leave and come back you continue from the time left. One trial per device.",
            )}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              void trackEvent("trial_click", { caseId });
              const next = await start();
              if (next) void trackEvent("trial_start", { caseId });
              setBusy(false);
            }}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-display text-base font-bold text-primary-foreground disabled:opacity-60"
          >
            <Play className="size-4.5" /> {busy ? pick("لحظة...", "One moment...") : pick("ابدأ التجربة", "Start the trial")}
          </button>
          <Link
            to="/purchase/$caseId"
            params={{ caseId }}
            search={{ room: room?.code }}
            className="mt-3 inline-block font-display text-xs text-muted-foreground hover:text-foreground"
          >
            {pick("أو افتح القضية كاملة", "Or unlock the full case")}
          </Link>
        </Panel>
      </div>
    );
  }

  if (trial.expired) {
    return (
      <div
        dir={dir}
        data-testid="trial-expired"
        className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-background px-4 py-10"
      >
        <Panel className="cine-in w-full max-w-lg text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-border bg-secondary/60">
            <Lock className="size-5 text-primary" />
          </span>
          <Eyebrow>{pick("التجربة المجانية", "Free trial")}</Eyebrow>
          <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">{pick("انتهت تجربتك المجانية", "Your free trial has ended")}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            {pick(
              "اشتري القضية وكمل التحقيق من نفس المكان",
              "Buy the case and continue the investigation from where you stopped",
            )}
          </p>

          <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3.5 text-start">
            <div>
              <p className="font-display text-xs text-muted-foreground">
                {pick("سعر القضية", "Case price")}
              </p>
              <p className="mt-1 font-display text-xl font-extrabold">{priceText}</p>
            </div>
            <p className="max-w-[9.5rem] font-mono text-[11px] leading-relaxed text-muted-foreground">
              {pick(
                "دفعة واحدة — تقدّمك والأدلة محفوظة وتكمل من نفس النقطة.",
                "One-time payment — your progress and evidence are saved, and you continue from the same point.",
              )}
            </p>
          </div>

          <Link
            to="/purchase/$caseId"
            params={{ caseId }}
            search={{ room: room?.code }}
            onClick={() => void trackEvent("pay_click", { caseId, path: "/trial-expired" })}
            data-testid="trial-expired-buy"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 font-display text-base font-bold text-primary-foreground"
          >
            <ShoppingCart className="size-4.5" />{" "}
            {pick("اشترِ القضية وكمل اللعب", "Buy the case and keep playing")}
          </Link>
          <Link
            to="/cases"
            className="mt-3 inline-block font-display text-xs text-muted-foreground hover:text-foreground"
          >
            {pick("العودة للقضايا", "Back to cases")}
          </Link>
        </Panel>
      </div>
    );
  }


  return <>{children}</>;
}
