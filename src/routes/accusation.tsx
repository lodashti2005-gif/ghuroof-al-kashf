import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Gavel, Lock, MessageSquare, NotebookPen, Timer } from "lucide-react";
import { useEffect, useState } from "react";

import { ActionButton, GameShell, LeaveRoomButton } from "@/components/game/shell";
import { CaseTag, Eyebrow, Panel } from "@/components/game/ui";
import { getSuspect } from "@/game/case-data";
import {
  candidatesFor,
  eligibleVoters,
  leadersOf,
  roundVotes,
  tallyFor,
  votingComplete,
} from "@/game/final-vote";
import { formatClock, useRoom } from "@/game/use-room";

export const Route = createFileRoute("/accusation")({
  head: () => ({
    meta: [
      { title: "القرار الأخير — ورا السالفة" },
      {
        name: "description",
        content: "كل محقق يصوت سرًا مرة واحدة، وقرار الفريق يظهر بعد ما يخلص الجميع.",
      },
      { property: "og:title", content: "القرار الأخير" },
      { property: "og:description", content: "صوت واحد لكل محقق. منو القاتل؟" },
    ],
  }),
  component: Accusation,
});

function Accusation() {
  const { room, me, isHost, actions } = useRoom();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [, tick] = useState(0);

  // نبضة ثانية واحدة لعدّاد نقاش التعادل (الوقت نفسه مشترك بالحالة).
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const final = room?.final ?? null;
  const round = final?.round ?? 1;
  const candidates = candidatesFor(room);
  const eligible = eligibleVoters(room, round);
  const votes = roundVotes(room, round);
  const myVote = me ? votes[me.id] : undefined;
  const iCanVote = !!me && eligible.includes(me.id);
  const votedCount = eligible.filter((id) => !!votes[id]).length;
  const complete = votingComplete(room, round);

  const tieRemaining = actions.remainingTieTime(final);
  const tieDiscussion = round > 1 && tieRemaining > 0 && !complete;

  // النتائج تظهر بس بعد ما يخلص الجميع (تصويت سري قبل ذلك).
  const shownRound = complete ? round : round > 1 ? round - 1 : 0;
  const shownTally = shownRound > 0 ? tallyFor(room, shownRound) : [];
  const shownLeaders = leadersOf(shownTally);

  const accused = final?.accused;
  const accusedSuspect = accused ? getSuspect(accused) : undefined;
  const revealed = room?.phase === "reveal";

  // قرار الفريق يُثبت مرة واحدة، والمضيف هو من يكتب الحالة المشتركة.
  useEffect(() => {
    if (!isHost || !final || final.accused || !complete) return;
    const tally = tallyFor(room, round);
    const leaders = leadersOf(tally);
    if (leaders.length === 1 && leaders[0]) {
      actions.setTeamAccusation(leaders[0].id);
    } else if (leaders.length > 1) {
      actions.startTieBreak(
        leaders.map((l) => l.id),
        round,
      );
    }
  }, [isHost, final, complete, room, round, actions]);

  useEffect(() => {
    if (revealed) void navigate({ to: "/reveal" });
  }, [revealed, navigate]);

  return (
    <GameShell title="القرار الأخير" right={<LeaveRoomButton />}>
      <div className="cine-in mb-6 max-w-2xl">
        <Eyebrow>المرحلة الختامية</Eyebrow>
        <h1 className="mt-1.5 text-3xl font-extrabold sm:text-4xl">منو قتل بدر؟</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          التحقيق مقفل: ما في استجواب ولا أدلة جديدة ولا قدرات أدوار. كل محقق يصوت من جهازه بشكل
          سري وصوت واحد بس — ما ينتغير بعد التثبيت، والنتيجة ما تظهر إلا لمن يخلص الجميع. دفتر
          القضية باقي مفتوح للمراجعة.
        </p>
        <ActionButton
          variant="outline"
          className="mt-4"
          onClick={() => navigate({ to: "/notebook" })}
        >
          <NotebookPen className="size-4" /> راجع دفتر القضية
        </ActionButton>
      </div>

      {/* قرار الفريق النهائي */}
      {accused && accusedSuspect ? (
        <Panel className="cine-in mb-6 overflow-hidden p-0">
          <div className="grid gap-0 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
            <div className="relative min-h-[14rem]">
              <img
                src={accusedSuspect.portrait}
                alt={`صورة ${accusedSuspect.name}`}
                width={912}
                height={1104}
                className="absolute inset-0 size-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-card/70" />
            </div>
            <div className="p-6">
              <Eyebrow>قرار الفريق النهائي</Eyebrow>
              <h2 className="mt-2 text-3xl font-extrabold">{accusedSuspect.name}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{accusedSuspect.role}</p>
              <div className="mt-5">
                {isHost ? (
                  <ActionButton
                    variant="danger"
                    onClick={() => {
                      actions.revealTruth();
                      navigate({ to: "/reveal" });
                    }}
                  >
                    <Gavel className="size-4" /> كشف الحقيقة
                  </ActionButton>
                ) : (
                  <CaseTag>بانتظار قائد الغرفة يكشف الحقيقة</CaseTag>
                )}
              </div>
            </div>
          </div>
        </Panel>
      ) : null}

      {/* نقاش التعادل */}
      {tieDiscussion && (
        <Panel className="cine-in mb-6 border-evidence/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <Eyebrow>الجولة {round}</Eyebrow>
              <h2 className="mt-1 flex items-center gap-2 text-lg font-bold">
                <MessageSquare className="size-4 text-evidence" /> تعادل — ناقشوا قراركم
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                الأصوات تعادلت بين {candidates.map((c) => c.name).join(" و")}. بعد ما يخلص العدّاد،
                بس اللي صوّتوا لأحد المتعادلين يعيدون التصويت.
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 font-mono text-lg font-bold tabular-nums">
              <Timer className="size-4 text-muted-foreground" />
              {formatClock(tieRemaining)}
            </span>
          </div>
        </Panel>
      )}

      {/* بطاقات التصويت */}
      {!accused && !tieDiscussion && (
        <div className="grid gap-4 sm:grid-cols-2">
          {candidates.map((s) => {
            const active = (myVote ?? selected) === s.id;
            const count = shownTally.find((t) => t.id === s.id)?.count ?? 0;
            return (
              <button
                key={s.id}
                type="button"
                disabled={!!myVote || !iCanVote}
                onClick={() => setSelected(s.id)}
                className={`surface-panel cine-in grid grid-cols-[6.5rem_minmax(0,1fr)] gap-4 overflow-hidden p-0 text-right transition-all duration-300 sm:grid-cols-[8rem_minmax(0,1fr)] ${
                  active ? "border-primary/60 shadow-[var(--shadow-blood)]" : "hover:border-primary/35"
                } disabled:cursor-default`}
              >
                <div className="relative min-h-[9rem]">
                  <img
                    src={s.portrait}
                    alt={`صورة ${s.name}`}
                    loading="lazy"
                    width={912}
                    height={1104}
                    className="absolute inset-0 size-full object-cover object-top grayscale-[35%]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent to-card/80" />
                </div>
                <div className="flex min-w-0 flex-col justify-center gap-2 py-4 pl-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold">{s.name}</h2>
                    <p className="truncate text-xs text-muted-foreground">{s.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {complete ? (
                      <CaseTag tone={count ? "danger" : "muted"}>{count} صوت</CaseTag>
                    ) : (
                      <CaseTag tone="muted">
                        <Lock className="me-1 inline size-3" /> سري
                      </CaseTag>
                    )}
                    {active && (
                      <span className="inline-flex items-center gap-1 font-display text-xs text-primary">
                        <Check className="size-3.5" /> اختيارك
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* قرار الفريق — عدد أصوات كل مشتبه بعد ما يخلص التصويت */}
      {shownTally.length > 0 && (
        <Panel className="cine-in mt-6">
          <Eyebrow>قرار الفريق</Eyebrow>
          <h2 className="mt-1.5 text-xl font-bold">
            {shownRound > 1 ? `نتيجة جولة كسر التعادل ${shownRound}` : "عدد الأصوات"}
          </h2>
          <ul className="mt-4 space-y-2.5">
            {shownTally.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3"
              >
                <span className="truncate text-sm font-bold">{t.name}</span>
                <span className="font-mono text-sm text-primary">{t.count}</span>
              </li>
            ))}
          </ul>
          {!accused && shownLeaders.length > 1 && (
            <p className="mt-3 text-sm text-muted-foreground">
              تعادل بين {shownLeaders.map((l) => l.name).join(" و")} — راح تعيدون التصويت بينهم.
            </p>
          )}
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            الحقيقة ما تنكشف إلا لمن يضغط قائد الغرفة «كشف الحقيقة».
          </p>
        </Panel>
      )}

      {/* حالة التصويت + التأكيد */}
      {!accused && (
        <Panel className="cine-in mt-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <Eyebrow>حالة التصويت</Eyebrow>
            <p className="mt-1 text-sm text-muted-foreground">
              صوّت {votedCount} من {eligible.length}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {iCanVote
                ? "الأصوات سرية تماماً — ما يظهر منو صوّت لمنو، بس العدد."
                : "ما لك صوت بهذه الجولة — بس اللي صوّتوا لأحد المتعادلين يعيدون التصويت."}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {tieDiscussion ? (
              <ActionButton variant="ghost" disabled>
                التصويت يفتح بعد النقاش
              </ActionButton>
            ) : !iCanVote ? (
              <ActionButton variant="ghost" disabled>
                بانتظار بقية الأصوات
              </ActionButton>
            ) : !myVote ? (
              <ActionButton
                disabled={!selected}
                onClick={() => {
                  if (!selected || !me) return;
                  if (round <= 1) actions.castVote(me.id, selected);
                  else actions.castFinalVote(me.id, selected, round);
                }}
              >
                <Gavel className="size-4" /> تأكيد اتهامي
              </ActionButton>
            ) : (
              <ActionButton variant="outline" disabled>
                تم تثبيت صوتك
              </ActionButton>
            )}
          </div>
        </Panel>
      )}
    </GameShell>
  );
}
