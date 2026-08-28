/**
 * بوابة التجربة (١٠ دقائق) لقضية الشاليه — الوقت محفوظ بحساب اللاعب على الخادم.
 *
 * لا يوجد أي منطق فتح للقضية هنا: البوابة تقرأ حالة التجربة/الملكية من الخادم
 * فقط. مالك القضية (شراء مؤكد) ما ينطبق عليه أي حد. اللاعب اللي دخل برمز غرفة
 * بدون حساب ما يتأثر (ما عنده حساب نربط عليه الوقت).
 */
import { Link } from "@tanstack/react-router";
import { Clock, Lock, ShoppingCart } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Eyebrow, Panel } from "@/components/game/ui";
import { supabase } from "@/integrations/supabase/client";
import { syncCaseTrial, TRIAL_TOTAL_SECONDS, type TrialState } from "@/lib/trial.functions";

function clock(seconds: number) {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function CaseTrialGate({
  caseId,
  children,
}: {
  caseId: string;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<TrialState | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [localLeft, setLocalLeft] = useState<number | null>(null);
  const busy = useRef(false);

  const sync = useCallback(
    async (tick: boolean) => {
      if (busy.current) return;
      busy.current = true;
      try {
        const { data: auth } = await supabase.auth.getSession();
        const isIn = !!auth.session?.user;
        setSignedIn(isIn);
        if (!isIn) {
          setState(null);
          return;
        }
        const next = await syncCaseTrial({ data: { caseId, tick } });
        setState(next);
        setLocalLeft(next.remainingSeconds);
      } catch {
        /* نتجاهل — ما نقفل اللعب بسبب خطأ شبكة */
      } finally {
        busy.current = false;
      }
    },
    [caseId],
  );

  useEffect(() => {
    void sync(false);
    const id = window.setInterval(() => void sync(true), 20_000);
    return () => window.clearInterval(id);
  }, [sync]);

  // عدّاد محلي بين النبضات (العرض فقط — الحساب الموثوق بالخادم).
  useEffect(() => {
    if (state?.entitled) return;
    const id = window.setInterval(
      () => setLocalLeft((v) => (v == null ? v : Math.max(0, v - 1))),
      1000,
    );
    return () => window.clearInterval(id);
  }, [state?.entitled]);

  if (signedIn === false || !state || state.entitled) return <>{children}</>;

  const left = localLeft ?? state.remainingSeconds;
  if (state.expired || left <= 0) {
    return (
      <div dir="rtl" className="grid min-h-screen place-items-center bg-background px-4 py-10">
        <Panel className="cine-in w-full max-w-lg text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-border bg-secondary/60">
            <Lock className="size-5 text-primary" />
          </span>
          <Eyebrow>انتهت الفترة التجريبية</Eyebrow>
          <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">انتهت الفترة التجريبية</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            افتح القضية كاملة للمتابعة — تقدّمك محفوظ وتكمل من نفس المكان.
          </p>
          <Link
            to="/purchase/$caseId"
            params={{ caseId }}
            search={{ room: undefined }}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-display text-base font-bold text-primary-foreground"
          >
            <ShoppingCart className="size-4.5" /> افتح القضية كاملة
          </Link>
          <Link
            to="/"
            className="mt-3 inline-block font-display text-xs text-muted-foreground hover:text-foreground"
          >
            رجوع للرئيسية
          </Link>
        </Panel>
      </div>
    );
  }

  return (
    <>
      {children}
      <span
        data-testid="case-trial-clock"
        className="pointer-events-none fixed bottom-4 left-4 z-50 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/90 px-2.5 py-1 font-mono text-xs text-muted-foreground backdrop-blur"
        title={`مدة التجربة ${Math.round(TRIAL_TOTAL_SECONDS / 60)} دقائق`}
      >
        <Clock className="size-3.5" /> تجربة {clock(left)}
      </span>
    </>
  );
}
