import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Fingerprint,
  Home,
  RotateCcw,
  ScanSearch,
  Skull,
  Trophy,
} from "lucide-react";
import { useEffect, useState } from "react";

import { ActionButton, GameShell, LeaveRoomButton } from "@/components/game/shell";
import { CaseTag, Eyebrow, Panel } from "@/components/game/ui";
import { evidence, getSuspect, killerId, solution } from "@/game/case-data";
import { computeTeamScore, formatDuration } from "@/game/score";
import { useRoom } from "@/game/use-room";

export const Route = createFileRoute("/reveal")({
  head: () => ({
    meta: [
      { title: "الحقيقة — ورا السالفة" },
      {
        name: "description",
        content: "القاتل، الدافع، الخط الزمني، الأدلة اللي أثبتت الجريمة، وتقييم أداء الفريق.",
      },
      { property: "og:title", content: "الحقيقة" },
      { property: "og:description", content: "الحقيقة ما تنقال... تنكشف." },
    ],
  }),
  component: Reveal,
});

/** خطوات الكشف السينمائي: 1 شنو صار · 2 الأدلة · 3 التناقضات · 4 القاتل · 5 المقارنة · 6 التقييم */
const STEP_DELAYS = [1200, 4200, 7200, 10200, 12600, 14600];
const LAST_STEP = STEP_DELAYS.length;

function Reveal() {
  const { room, isHost, actions } = useRoom();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const killer = getSuspect(killerId)!;

  useEffect(() => {
    const timers = STEP_DELAYS.map((ms, i) => setTimeout(() => setStep((s) => Math.max(s, i + 1)), ms));
    return () => timers.forEach(clearTimeout);
  }, []);

  const score = computeTeamScore(room);
  const accused = room?.final?.accused;
  const accusedSuspect = accused ? getSuspect(accused) : undefined;
  const correct = score.correct;

  const teamContradictions = room?.contradictions ?? [];
  const unlocked = room?.unlockedEvidence ?? [];

  const fade = (from: number) =>
    `transition-all duration-700 ${step >= from ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`;

  return (
    <GameShell title="الحقيقة" right={<LeaveRoomButton />}>
      <section className="cine-in mb-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full file-tape px-3.5 py-1.5">
          <Skull className="size-3.5" />
          <span className="font-display text-xs">ملف القضية انسدل</span>
        </div>
        <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">الحقيقة</h1>
        <p className="mt-2 text-sm text-muted-foreground">الحقيقة ما تنقال... تنكشف.</p>
        {step < LAST_STEP && (
          <ActionButton variant="ghost" className="mt-4" onClick={() => setStep(LAST_STEP)}>
            تخطّى الكشف
          </ActionButton>
        )}
      </section>

      {/* 1 — شنو صار فعلاً */}
      <Panel className={`mb-5 ${fade(1)}`}>
        <Eyebrow>الخطوة الأولى</Eyebrow>
        <h2 className="mt-1.5 text-2xl font-extrabold">شنو صار فعلاً؟</h2>
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
        <p className="mt-5 rounded-xl border border-border bg-surface-2 p-4 text-sm leading-relaxed text-muted-foreground">
          {solution.method}
        </p>
      </Panel>

      {/* 2 — الأدلة */}
      <Panel className={`mb-5 ${fade(2)}`}>
        <Eyebrow>الخطوة الثانية</Eyebrow>
        <h2 className="mt-1.5 text-2xl font-extrabold">الأدلة</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          كل دليل وشنو أثبت فعلاً — واللي فاتكم منها.
        </p>
        <ul className="mt-5 space-y-3">
          {evidence.map((item, i) => {
            const found = unlocked.includes(item.id);
            return (
              <li
                key={item.id}
                className={`rounded-xl border bg-surface-2 p-4 transition-all duration-500 ${
                  found ? "border-evidence/40" : "border-primary/30"
                } ${step >= 2 ? "opacity-100" : "opacity-0"}`}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-bold">
                    <span className="me-2 font-mono text-xs text-muted-foreground">
                      {item.number}
                    </span>
                    {item.title}
                  </h3>
                  <CaseTag tone={found ? "evidence" : "danger"}>
                    {found ? "لقيتوه" : "فاتكم"}
                  </CaseTag>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
              </li>
            );
          })}
        </ul>
        <div className="mt-5 rounded-xl border border-evidence/40 bg-surface-2 p-4">
          <div className="flex items-center gap-2">
            <Fingerprint className="size-4 text-evidence" />
            <Eyebrow>الدليل الحاسم</Eyebrow>
          </div>
          <h3 className="mt-2 text-base font-bold">{solution.decisive.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {solution.decisive.text}
          </p>
        </div>
      </Panel>

      {/* 3 — التناقضات */}
      <Panel className={`mb-5 ${fade(3)}`}>
        <Eyebrow>الخطوة الثالثة</Eyebrow>
        <h2 className="mt-1.5 text-2xl font-extrabold">التناقضات</h2>
        <ul className="mt-5 space-y-3">
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
        <div className="mt-5">
          <Eyebrow>وكيف تترابط</Eyebrow>
          <ul className="mt-3 space-y-3">
            {solution.provingClues.map((c, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                <span className="mt-0.5 shrink-0 font-mono text-xs text-evidence">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-5">
          <Eyebrow>التناقضات اللي رصدها فريقكم</Eyebrow>
          {teamContradictions.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              ما رصدتوا أي تناقض بأقوال المشتبه فيهم.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {teamContradictions.map((c) => (
                <li key={c.id} className="rounded-xl border border-border bg-surface-2 p-3.5">
                  <p className="text-xs font-bold">{c.suspectName}</p>
                  <p className="mt-1 text-sm leading-relaxed">«{c.claim}»</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    يتعارض مع: {c.conflictsWith}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      {/* 4 — لحظة كشف الحقيقة */}
      <section className={`surface-panel overflow-hidden p-0 ${fade(4)}`}>
        <div className="grid md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <div className="relative min-h-[18rem] md:min-h-[24rem]">
            <img
              src={killer.portrait}
              alt={`صورة ${killer.name}`}
              width={912}
              height={1104}
              className={`absolute inset-0 size-full object-cover object-top transition-all duration-1000 ${
                step >= 4 ? "grayscale-0 opacity-100" : "grayscale opacity-30"
              }`}
            />
            <div
              className="absolute inset-0"
              style={{ background: "var(--gradient-portrait)" }}
              aria-hidden="true"
            />
          </div>
          <div className="p-6 sm:p-8">
            <Eyebrow>لحظة كشف الحقيقة</Eyebrow>
            <h2
              className={`mt-3 text-4xl font-extrabold transition-all duration-700 sm:text-5xl ${
                step >= 4 ? "opacity-100 blur-0" : "opacity-0 blur-sm"
              }`}
            >
              {solution.killer}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {killer.role} · {killer.age} سنة
            </p>
            <div className="mt-6">
              <Eyebrow>سبب الجريمة</Eyebrow>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{solution.motive}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5 — اتهام الفريق مقابل الحقيقة */}
      <Panel className={`mt-5 ${fade(5)}`}>
        <Eyebrow>الخطوة الخامسة</Eyebrow>
        <h2 className="mt-1.5 text-2xl font-extrabold">
          {correct ? "أحسنتوا... حليتوا القضية 🔍" : "القضية خدعتكم."}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface-2 p-4">
            <Eyebrow>اتهام الفريق</Eyebrow>
            <div className="mt-3 flex items-center gap-3">
              {accusedSuspect && (
                <img
                  src={accusedSuspect.portrait}
                  alt={`صورة ${accusedSuspect.name}`}
                  loading="lazy"
                  width={912}
                  height={1104}
                  className="size-14 shrink-0 rounded-lg border border-border object-cover object-top"
                />
              )}
              <div className="min-w-0">
                <p className="truncate text-lg font-bold">{accusedSuspect?.name ?? "ما ثبتوا اتهام"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {accusedSuspect?.role ?? "—"}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-primary/40 bg-surface-2 p-4">
            <Eyebrow>الحقيقة</Eyebrow>
            <div className="mt-3 flex items-center gap-3">
              <img
                src={killer.portrait}
                alt={`صورة ${killer.name}`}
                loading="lazy"
                width={912}
                height={1104}
                className="size-14 shrink-0 rounded-lg border border-border object-cover object-top"
              />
              <div className="min-w-0">
                <p className="truncate text-lg font-bold">{killer.name}</p>
                <p className="truncate text-xs text-muted-foreground">{killer.role}</p>
              </div>
            </div>
          </div>
        </div>
        {!correct && (
          <div className="mt-5 rounded-xl border border-primary/35 bg-surface-2 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-primary" />
              <Eyebrow>الخيوط اللي فاتتكم أو قريتوها غلط</Eyebrow>
            </div>
            <ul className="mt-3 space-y-2.5">
              {solution.provingClues.slice(0, 3).map((c, i) => (
                <li key={i} className="text-sm leading-relaxed text-muted-foreground">
                  {c}
                </li>
              ))}
              {evidence
                .filter((item) => !unlocked.includes(item.id))
                .map((item) => (
                  <li key={item.id} className="text-sm leading-relaxed text-muted-foreground">
                    ما لقيتوا «{item.title}» — {item.detail}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </Panel>

      {/* 6 — تقييم أداء الفريق */}
      <Panel className={`mt-5 ${fade(6)}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <Eyebrow>تقييم أداء الفريق</Eyebrow>
            <h2 className="mt-1.5 flex items-center gap-2 text-2xl font-extrabold">
              <Trophy className="size-5 text-evidence" /> {score.rank}
            </h2>
          </div>
          <div className="shrink-0 text-center">
            <p className="font-mono text-4xl font-extrabold text-primary tabular-nums">
              {score.total}
            </p>
            <p className="font-display text-xs text-muted-foreground">من ١٠٠</p>
          </div>
        </div>

        <ul className="mt-5 space-y-2.5">
          {score.breakdown.map((b) => (
            <li key={b.label} className="rounded-xl border border-border bg-surface-2 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-bold">{b.label}</span>
                <span className="shrink-0 font-mono text-xs text-primary tabular-nums">
                  {b.points}/{b.max}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${(b.points / b.max) * 100}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{b.detail}</p>
            </li>
          ))}
        </ul>
      </Panel>

      {/* ملخص التحقيق */}
      <Panel className={`mt-5 ${fade(6)}`}>
        <div className="flex items-center gap-2">
          <ScanSearch className="size-4 text-muted-foreground" />
          <Eyebrow>ملخص التحقيق</Eyebrow>
        </div>
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {[
            { k: "الأدلة اللي لقيتوها", v: `${score.evidenceFound}/${score.evidenceTotal}` },
            { k: "التناقضات المكتشفة", v: `${score.contradictions}` },
            { k: "مدة التحقيق", v: formatDuration(score.seconds) },
            { k: "المشتبه اللي اخترتوه", v: score.accusedName },
            { k: "القاتل الحقيقي", v: solution.killer },
            { k: "النتيجة النهائية", v: `${score.total}/100` },
          ].map((row) => (
            <li
              key={row.k}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3"
            >
              <span className="truncate text-sm text-muted-foreground">{row.k}</span>
              <span className="shrink-0 font-mono text-sm">{row.v}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <div className={`mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end ${fade(6)}`}>
        {isHost ? (
          <ActionButton
            onClick={() => {
              actions.resetCase();
              navigate({ to: "/lobby" });
            }}
          >
            <RotateCcw className="size-4" /> إعادة القضية
          </ActionButton>
        ) : (
          <CaseTag>إعادة القضية بيد قائد الغرفة</CaseTag>
        )}
        <ActionButton
          variant="outline"
          onClick={() => {
            actions.leaveRoom();
            navigate({ to: "/" });
          }}
        >
          <Home className="size-4" /> قضية جديدة
        </ActionButton>
      </div>
    </GameShell>
  );
}
