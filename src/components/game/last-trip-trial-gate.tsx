/**
 * تجربة مجانية ١٠ دقائق لكل غرفة بقضية «آخر رحلة» فقط.
 *
 * الوقت مصدره الحالة المشتركة للغرفة (`ltTrial.startedAt`) فيكون نفسه على كل
 * الأجهزة، والـrefresh أو الخروج والرجوع ما يعيده. غرفة جديدة تبدأ بتجربتها
 * الخاصة. عند انتهاء الوقت يُقفل اللعب فقط — بدون مسح أي تقدم أو أدلة، ولو
 * صارت الغرفة `unlocked` (بعد ربط الدفع) يتجاوز القفل تلقائياً.
 */
import { Link } from "@tanstack/react-router";
import { Clock, Lock, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";

import { Eyebrow, Panel } from "@/components/game/ui";
import * as store from "@/game/room-store";
import { useRoom } from "@/game/use-room";
import { useCaseEntitlement } from "@/game/use-entitlement";


function clock(seconds: number) {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** شريط العدّاد فقط (بدون قفل) — يظهر داخل الغرفة أثناء التجربة. */
export function LastTripTrialBadge() {
  const { room } = useRoom();
  const [, tick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!room || room.caseId !== "last-trip" || !room.ltTrial || room.ltTrial.unlocked) return null;
  const left = store.remainingLastTripTrial(room.ltTrial);

  return (
    <span
      data-testid="lt-trial-clock"
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/70 px-2.5 py-1 font-mono text-xs text-muted-foreground"
    >
      <Clock className="size-3.5" /> تجربة مجانية {clock(left)}
    </span>
  );
}

export function LastTripTrialGate({ children }: { children: React.ReactNode }) {
  const { room } = useRoom();
  const [, tick] = useState(0);
  // الملكية تُقرأ من الخادم فقط — الواجهة ما تفتح القضية أبداً من نفسها.
  const { entitlement } = useCaseEntitlement("last-trip");

  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const inRoom = !!room && room.caseId === "last-trip";
  const trial = inRoom ? room!.ltTrial : null;

  // داخل الغرفة لازم يكون فيه بداية للتجربة (لو الغرفة انفتحت قبل هذي الميزة).
  useEffect(() => {
    if (inRoom && !trial) store.ensureLastTripTrial();
  }, [inRoom, trial]);

  // شراء مؤكَّد من الخادم = فتح الغرفة بالكامل بدون مسح أي تقدم.
  const purchased = entitlement?.purchased === true;
  useEffect(() => {
    if (purchased && inRoom && trial && !trial.unlocked) void store.unlockLastTripRoom();
  }, [purchased, inRoom, trial]);

  const expired =
    !purchased && !!trial && !trial.unlocked && store.remainingLastTripTrial(trial) <= 0;
  if (!expired) return <>{children}</>;


  return (
    <div dir="rtl" className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <Panel className="cine-in w-full max-w-lg text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-border bg-secondary/60">
          <Lock className="size-5 text-primary" />
        </span>
        <Eyebrow>انتهت التجربة المجانية</Eyebrow>
        <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">خلصت العشر دقايق</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          هذي كانت تجربة مجانية لقضية «آخر رحلة» مدتها ١٠ دقائق لكل غرفة. تقدّمكم
          والأدلة اللي لقيتوها محفوظة كلها — افتحوا القضية كاملة وتكملون من نفس
          المكان بنفس الغرفة.
        </p>
        <Link
          to="/purchase/$caseId"
          params={{ caseId: "last-trip" }}
          search={{ room: room?.code }}
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
