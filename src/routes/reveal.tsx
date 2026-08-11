import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RotateCcw, Skull } from "lucide-react";
import { useEffect, useState } from "react";

import { ActionButton, GameShell, LeaveRoomButton } from "@/components/game/shell";
import { CaseTag, Eyebrow, Panel } from "@/components/game/ui";
import { getSuspect, killerId, solution, suspects } from "@/game/case-data";
import { useRoom } from "@/game/use-room";

export const Route = createFileRoute("/reveal")({
  head: () => ({
    meta: [
      { title: "كشف الحقيقة — غرفة التحقيق" },
      { name: "description", content: "القاتل، الدافع، الخط الزمني، والأدلة اللي أثبتت الجريمة." },
      { property: "og:title", content: "كشف الحقيقة" },
      { property: "og:description", content: "الحقيقة ما تنقال... تنكشف." },
    ],
  }),
  component: Reveal,
});

function Reveal() {
  const { room, isHost, actions } = useRoom();
  const navigate = useNavigate();
  const [stage, setStage] = useState(0);
  const killer = getSuspect(killerId)!;

  useEffect(() => {
    const timers = [600, 1800, 3000].map((ms, i) => setTimeout(() => setStage(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, []);

  const tally = suspects
    .map((s) => ({
      ...s,
      count: Object.values(room?.votes ?? {}).filter((v) => v === s.id).length,
    }))
    .sort((a, b) => b.count - a.count);
  const groupPick = tally[0];
  const groupCorrect = groupPick?.count ? groupPick.id === killerId : false;

  return (
    <GameShell title="كشف الحقيقة" right={<LeaveRoomButton />}>
      <section className="cine-in surface-panel overflow-hidden p-0">
        <div className="grid md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <div className="relative min-h-[18rem] md:min-h-[24rem]">
            <img
              src={killer.portrait}
              alt={`صورة ${killer.name}`}
              width={912}
              height={1104}
              className={`absolute inset-0 size-full object-cover object-top transition-all duration-1000 ${
                stage >= 1 ? "grayscale-0 opacity-100" : "grayscale opacity-40"
              }`}
            />
            <div
              className="absolute inset-0"
              style={{ background: "var(--gradient-portrait)" }}
              aria-hidden="true"
            />
          </div>
          <div className="p-6 sm:p-8">
            <Eyebrow>نتيجة الفريق</Eyebrow>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {groupPick?.count
                ? `الفريق اتهم ${groupPick.name} بـ ${groupPick.count} صوت`
                : "ما في تصويت مسجل"}
              {groupPick?.count ? (groupCorrect ? " — إصابة صحيحة." : " — اتهام خاطئ.") : ""}
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full file-tape px-3.5 py-1.5">
              <Skull className="size-3.5" />
              <span className="font-display text-xs">القاتل</span>
            </div>
            <h1
              className={`mt-3 text-4xl font-extrabold transition-all duration-700 sm:text-5xl ${
                stage >= 1 ? "opacity-100 blur-0" : "opacity-0 blur-sm"
              }`}
            >
              {solution.killer}
            </h1>

            <div
              className={`mt-6 transition-all duration-700 ${stage >= 2 ? "opacity-100" : "opacity-0"}`}
            >
              <Eyebrow>الدافع</Eyebrow>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {solution.motive}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div
        className={`mt-5 grid gap-5 transition-all duration-700 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] ${
          stage >= 3 ? "opacity-100" : "opacity-0"
        }`}
      >
        <Panel>
          <Eyebrow>الخط الزمني</Eyebrow>
          <h2 className="mt-1.5 text-xl font-bold">شنو صار بالضبط</h2>
          <ol className="mt-5 space-y-4 border-e border-border pe-5">
            {solution.timeline.map((t) => (
              <li key={t.time} className="relative">
                <span className="absolute -end-[1.6rem] top-1.5 size-2.5 rounded-full bg-primary" />
                <p dir="ltr" className="text-right font-mono text-xs text-muted-foreground">
                  {t.time}
                </p>
                <p className="mt-1 text-sm leading-relaxed">{t.text}</p>
              </li>
            ))}
          </ol>
        </Panel>

        <div className="min-w-0 space-y-5">
          <Panel>
            <Eyebrow>الأدلة اللي أثبتت الجريمة</Eyebrow>
            <ul className="mt-4 space-y-3">
              {solution.provingClues.map((c, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-0.5 shrink-0 font-mono text-xs text-evidence">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <Eyebrow>منو كذب وليش</Eyebrow>
            <ul className="mt-4 space-y-3">
              {solution.liars.map((l) => (
                <li key={l.name} className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="truncate text-sm font-bold">{l.name}</h3>
                    <CaseTag tone={l.name === solution.killer ? "danger" : "muted"}>
                      {l.name === solution.killer ? "القاتل" : "كذب جزئي"}
                    </CaseTag>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{l.lie}</p>
                  <p className="mt-1.5 text-sm leading-relaxed">{l.why}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <ActionButton variant="outline" onClick={() => navigate({ to: "/dashboard" })}>
          راجع لوحة القضية
        </ActionButton>
        {isHost && (
          <ActionButton
            onClick={() => {
              actions.resetCase();
              navigate({ to: "/lobby" });
            }}
          >
            <RotateCcw className="size-4" /> ابدأ القضية من جديد
          </ActionButton>
        )}
      </div>
    </GameShell>
  );
}
