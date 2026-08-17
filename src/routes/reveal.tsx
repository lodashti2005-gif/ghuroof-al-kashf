import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Fingerprint, RotateCcw, Skull } from "lucide-react";
import { useEffect, useState } from "react";

import { ActionButton, GameShell, LeaveRoomButton } from "@/components/game/shell";
import { CaseTag, Eyebrow, Panel } from "@/components/game/ui";
import { getSuspect, killerId, solution, suspects } from "@/game/case-data";
import { useRoom } from "@/game/use-room";

export const Route = createFileRoute("/reveal")({
  head: () => ({
    meta: [
      { title: "كشف الحقيقة — ورا السالفة" },
      { name: "description", content: "القاتل، الدافع، الخط الزمني، والأدلة اللي أثبتت الجريمة." },
      { property: "og:title", content: "كشف الحقيقة" },
      { property: "og:description", content: "الحقيقة ما تنقال... تنكشف." },
    ],
  }),
  component: Reveal,
});

/** Cinematic stages: 0 title · 1 killer · 2 decisive clue · 3 timeline · 4 lies · 5 motive */
const STAGE_DELAYS = [900, 2400, 3900, 5400, 6900];

function Reveal() {
  const { room, me, isHost, actions } = useRoom();
  const navigate = useNavigate();
  const [stage, setStage] = useState(0);
  const killer = getSuspect(killerId)!;

  useEffect(() => {
    const timers = STAGE_DELAYS.map((ms, i) => setTimeout(() => setStage(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, []);

  const myVote = me ? room?.votes[me.id] : undefined;
  const mySolved = myVote === killerId;
  const myPick = myVote ? getSuspect(myVote) : undefined;

  const tally = suspects
    .map((s) => ({
      ...s,
      count: Object.values(room?.votes ?? {}).filter((v) => v === s.id).length,
    }))
    .sort((a, b) => b.count - a.count);
  const groupPick = tally[0];
  const groupCorrect = groupPick?.count ? groupPick.id === killerId : false;

  const killerContradictions = (room?.contradictions ?? []).filter((c) => c.suspectId === killerId);

  const scoreboard = (room?.players ?? [])
    .map((p) => {
      const vote = room?.votes[p.id];
      const correct = vote === killerId;
      const bonus =
        (room?.contradictions ?? []).filter((c) => c.author === p.name).length * 10 +
        (room?.deductions ?? []).filter((d) => d.author === p.name).length * 10;
      return {
        id: p.id,
        name: p.name,
        vote,
        voteName: vote ? (getSuspect(vote)?.name ?? "—") : "",
        correct,
        points: (vote ? (correct ? 100 : 20) : 0) + bonus,
      };
    })
    .sort((a, b) => b.points - a.points);

  const fade = (from: number) =>
    `transition-all duration-700 ${stage >= from ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`;

  return (
    <GameShell title="كشف الحقيقة" right={<LeaveRoomButton />}>
      {/* Stage 0 — headline only */}
      <section className="cine-in mb-5 text-center">
        <div className="inline-flex items-center gap-2 rounded-full file-tape px-3.5 py-1.5">
          <Skull className="size-3.5" />
          <span className="font-display text-xs">ملف القضية انسدل</span>
        </div>
        <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">كشف الحقيقة</h1>
        <p className="mt-2 text-sm text-muted-foreground">الحقيقة ما تنقال... تنكشف.</p>
      </section>

      {/* Result of the accusation */}
      <Panel className={`mb-5 ${fade(1)}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Eyebrow>نتيجة اتهامك</Eyebrow>
            <h2 className={`mt-1.5 text-2xl font-extrabold ${mySolved ? "" : "text-primary"}`}>
              {myVote ? (mySolved ? "تم حل القضية" : "اتهام غير صحيح") : "ما ثبتت اتهام"}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {myVote
                ? mySolved
                  ? "قرأت التناقضات صح وربطت الأدلة بالشخص الصحيح."
                  : `اتهمت ${myPick?.name ?? "شخص ثاني"}، وهو كذب بشي بس ما قتل بدر.`
                : "القضية انكشفت بدون تصويت منك."}
            </p>
          </div>
          <CaseTag tone={mySolved ? "muted" : "danger"}>
            {groupPick?.count
              ? `الفريق اتهم ${groupPick.name} · ${groupPick.count} صوت${groupCorrect ? " · إصابة" : " · خطأ"}`
              : "ما في تصويت جماعي"}
          </CaseTag>
        </div>
      </Panel>

      {/* Stage 1 — killer name + portrait */}
      <section className={`surface-panel overflow-hidden p-0 ${fade(1)}`}>
        <div className="grid md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <div className="relative min-h-[18rem] md:min-h-[24rem]">
            <img
              src={killer.portrait}
              alt={`صورة ${killer.name}`}
              width={912}
              height={1104}
              className={`absolute inset-0 size-full object-cover object-top transition-all duration-1000 ${
                stage >= 1 ? "grayscale-0 opacity-100" : "grayscale opacity-30"
              }`}
            />
            <div
              className="absolute inset-0"
              style={{ background: "var(--gradient-portrait)" }}
              aria-hidden="true"
            />
          </div>
          <div className="p-6 sm:p-8">
            <Eyebrow>القاتل</Eyebrow>
            <h2
              className={`mt-3 text-4xl font-extrabold transition-all duration-700 sm:text-5xl ${
                stage >= 1 ? "opacity-100 blur-0" : "opacity-0 blur-sm"
              }`}
            >
              {solution.killer}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {killer.role} · {killer.age} سنة
            </p>

            {/* Stage 2 — decisive evidence */}
            <div className={`mt-7 rounded-xl border border-evidence/40 bg-surface-2 p-4 ${fade(2)}`}>
              <div className="flex items-center gap-2">
                <Fingerprint className="size-4 text-evidence" />
                <Eyebrow>الدليل الحاسم</Eyebrow>
              </div>
              <h3 className="mt-2 text-base font-bold">{solution.decisive.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {solution.decisive.text}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* Stage 3 — timeline */}
        <Panel className={fade(3)}>
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
          {/* Stage 4 — contradictions that exposed the lie */}
          <Panel className={fade(4)}>
            <Eyebrow>التناقضات اللي كشفت كذبه</Eyebrow>
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

          <Panel className={fade(4)}>
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

          {/* Stage 5 — motive + method */}
          <Panel className={fade(5)}>
            <Eyebrow>سبب الجريمة</Eyebrow>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {solution.motive}
            </p>
          </Panel>

          <Panel className={fade(5)}>
            <Eyebrow>طريقة تنفيذ الجريمة</Eyebrow>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {solution.method}
            </p>
          </Panel>

          <Panel className={fade(5)}>
            <Eyebrow>تناقضات {killer.name} اللي رصدها الفريق</Eyebrow>
            {killerContradictions.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                ما رصد الفريق تناقضات بأقواله — بس التوقيت والأدلة كشفته.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {killerContradictions.map((c) => (
                  <li key={c.id} className="rounded-xl border border-border bg-surface-2 p-3.5">
                    <p className="text-sm leading-relaxed">«{c.claim}»</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      يتعارض مع: {c.conflictsWith}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      {/* Player scoreboard */}
      <Panel className={`mt-5 ${fade(5)}`}>
        <Eyebrow>نتائج المحققين</Eyebrow>
        <h2 className="mt-1.5 text-xl font-bold">منو صاب ومنو خاب</h2>
        <ul className="mt-4 space-y-2.5">
          {scoreboard.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{p.name}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {p.vote ? `اتهم ${p.voteName}` : "ما ثبّت اتهام"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CaseTag tone={p.correct ? "evidence" : "danger"}>
                  {p.vote ? (p.correct ? "اتهام صحيح" : "اتهام خاطئ") : "بدون تصويت"}
                </CaseTag>
                <span className="font-mono text-sm text-primary">{p.points} نقطة</span>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          النقاط: اتهام صحيح ١٠٠ · اتهام خاطئ ٢٠ · +١٠ لكل تناقض رصدته · +١٠ لكل ربط أدلة صحيح.
        </p>
      </Panel>


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
