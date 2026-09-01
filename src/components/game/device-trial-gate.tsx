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
import { trackEvent } from "@/lib/activity";

/** شريط الوقت المتبقي — عرض فقط. */
export function DeviceTrialBadge({ caseId }: { caseId: string }) {
  const { trial } = useDeviceTrial(caseId);
  const { entitlement } = useCaseEntitlement(caseId);
  if (entitlement?.purchased === true) return null;
  if (!trial?.started || trial.expired) return null;

  return (
    <span
      data-testid="trial-clock"
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/70 px-2.5 py-1 font-mono text-xs text-muted-foreground"
    >
      <Clock className="size-3.5" /> تجربة مجانية {formatTrialClock(trial.remainingSeconds)}
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
  const { entitlement } = useCaseEntitlement(caseId);
  const { trial, loading, start } = useDeviceTrial(caseId);
  const [busy, setBusy] = useState(false);

  const priceText = formatCasePrice(caseId, entitlement?.priceKwd ?? null);
  const purchased = entitlement?.purchased === true;


  // تتبّع تسويقي فقط: انتهاء التجربة.
  const expiredNow = !!trial?.started && trial.expired && !purchased;
  useEffect(() => {
    if (expiredNow) void trackEvent("trial_end", { caseId });
  }, [expiredNow, caseId]);

  // لاعب دخل برمز غرفة (غير مضيف) — ما نحسب عليه تجربة جهازه.
  const guest = !!room && room.caseId === caseId && !isHost;

  if (purchased || guest || sim.active) return <>{children}</>;

  if (loading && !trial) {
    return (
      <div dir="rtl" className="grid min-h-screen place-items-center bg-background px-4">
        <p className="font-mono text-xs text-muted-foreground">لحظة...</p>
      </div>
    );
  }

  // ما بدأ التجربة بعد — الوقت ما ينطلق إلا بضغط الزر.
  if (!trial?.started) {
    return (
      <div dir="rtl" className="grid min-h-screen place-items-center bg-background px-4 py-10">
        <Panel className="cine-in w-full max-w-lg text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-border bg-secondary/60">
            <Play className="size-5 text-primary" />
          </span>
          <Eyebrow>تجربة مجانية</Eyebrow>
          <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">جرّب ١٠ دقائق مجاناً</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            بدون حساب وبدون بيانات. تبدأ الـ١٠ دقائق من لحظة ضغطك على الزر، ولو
            سويت refresh أو خرجت وترجع تكمل من الوقت المتبقي. التجربة مرة واحدة
            لكل جهاز.
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
            <Play className="size-4.5" /> {busy ? "لحظة..." : "ابدأ التجربة"}
          </button>
          <Link
            to="/purchase/$caseId"
            params={{ caseId }}
            search={{ room: room?.code }}
            className="mt-3 inline-block font-display text-xs text-muted-foreground hover:text-foreground"
          >
            أو افتح القضية كاملة
          </Link>
        </Panel>
      </div>
    );
  }

  if (trial.expired) {
    return (
      <div
        dir="rtl"
        data-testid="trial-expired"
        className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-background px-4 py-10"
      >
        <Panel className="cine-in w-full max-w-lg text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-border bg-secondary/60">
            <Lock className="size-5 text-primary" />
          </span>
          <Eyebrow>التجربة المجانية</Eyebrow>
          <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">انتهت تجربتك المجانية</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            اشتري القضية وكمل التحقيق من نفس المكان
          </p>

          <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3.5 text-right">
            <div>
              <p className="font-display text-xs text-muted-foreground">سعر القضية</p>
              <p className="mt-1 font-display text-xl font-extrabold">{priceText}</p>
            </div>
            <p className="max-w-[9.5rem] font-mono text-[11px] leading-relaxed text-muted-foreground">
              دفعة واحدة — تقدّمك والأدلة محفوظة وتكمل من نفس النقطة.
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
            <ShoppingCart className="size-4.5" /> اشترِ القضية وكمل اللعب
          </Link>
          <Link
            to="/cases"
            className="mt-3 inline-block font-display text-xs text-muted-foreground hover:text-foreground"
          >
            العودة للقضايا
          </Link>
        </Panel>
      </div>
    );
  }


  return <>{children}</>;
}
