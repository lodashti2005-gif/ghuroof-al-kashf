import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Gavel, Lock } from "lucide-react";
import { useEffect, useState } from "react";

import { ActionButton, GameShell, LeaveRoomButton } from "@/components/game/shell";
import { CaseTag, Eyebrow, Panel } from "@/components/game/ui";
import { suspects } from "@/game/case-data";
import { useRoom } from "@/game/use-room";

export const Route = createFileRoute("/accusation")({
  head: () => ({
    meta: [
      { title: "الاتهام النهائي — ورا السالفة" },
      { name: "description", content: "كل محقق يصوت سرًا مرة واحدة على اللي يشك إنه قتل بدر العتيبي." },
      { property: "og:title", content: "الاتهام النهائي" },
      { property: "og:description", content: "صوت واحد لكل محقق. منو القاتل؟" },
    ],
  }),
  component: Accusation,
});

function Accusation() {
  const { room, me, isHost, actions } = useRoom();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  const myVote = me ? room?.votes[me.id] : undefined;
  const votesCount = Object.keys(room?.votes ?? {}).length;
  const total = room?.players.length ?? 1;
  const allVoted = total > 0 && votesCount >= total;
  const revealed = room?.phase === "reveal";

  // النتيجة الجماعية تظهر بس بعد ما يصوّت الجميع (تصويت سري قبل ذلك).
  const tally = suspects
    .map((s) => ({
      id: s.id,
      name: s.name,
      count: Object.values(room?.votes ?? {}).filter((v) => v === s.id).length,
    }))
    .sort((a, b) => b.count - a.count);
  const leader = tally[0];

  useEffect(() => {
    if (revealed) void navigate({ to: "/reveal" });
  }, [revealed, navigate]);

  return (
    <GameShell title="الاتهام النهائي" right={<LeaveRoomButton />}>
      <div className="cine-in mb-6 max-w-2xl">
        <Eyebrow>المرحلة الختامية</Eyebrow>
        <h1 className="mt-1.5 text-3xl font-extrabold sm:text-4xl">منو قتل بدر؟</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          التحقيق مقفل. كل محقق يصوت من جهازه بشكل سري وصوت واحد بس — ما ينتغير بعد التثبيت،
          والاختيارات ما تظهر إلا لمن يخلص الجميع.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {suspects.map((s) => {
          const active = (myVote ?? selected) === s.id;
          const votes = tally.find((t) => t.id === s.id)?.count ?? 0;
          return (
            <button
              key={s.id}
              type="button"
              disabled={!!myVote}
              onClick={() => setSelected(s.id)}
              className={`surface-panel cine-in grid grid-cols-[6.5rem_minmax(0,1fr)] gap-4 overflow-hidden p-0 text-right transition-all duration-300 sm:grid-cols-[8rem_minmax(0,1fr)] ${
                active
                  ? "border-primary/60 shadow-[var(--shadow-blood)]"
                  : "hover:border-primary/35"
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
                  {allVoted ? (
                    <CaseTag tone={votes ? "danger" : "muted"}>{votes} صوت</CaseTag>
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

      <Panel className="cine-in mt-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <Eyebrow>حالة التصويت</Eyebrow>
          <p className="mt-1 text-sm text-muted-foreground">
            {votesCount}/{total} صوّتوا
          </p>
          {allVoted && leader && (
            <p className="mt-1.5 text-sm">
              نتيجة المجموعة: أعلى اتهام على{" "}
              <span className="font-bold text-primary">{leader.name}</span> بـ {leader.count} صوت —
              الحقيقة بعد ما يكشفها قائد الغرفة.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {!myVote ? (
            <ActionButton
              disabled={!selected}
              onClick={() => selected && me && actions.castVote(me.id, selected)}
            >
              <Gavel className="size-4" /> ثبّت اتهامك
            </ActionButton>
          ) : (
            <ActionButton variant="outline" disabled>
              تم تثبيت صوتك
            </ActionButton>
          )}
          {isHost ? (
            <ActionButton
              variant="danger"
              disabled={!allVoted}
              onClick={() => {
                actions.revealTruth();
                navigate({ to: "/reveal" });
              }}
            >
              {allVoted ? "اكشف الحقيقة" : "بانتظار بقية الأصوات"}
            </ActionButton>
          ) : (
            <ActionButton variant="ghost" disabled>
              {allVoted ? "بانتظار قائد الغرفة" : "بانتظار بقية الأصوات"}
            </ActionButton>
          )}
        </div>
      </Panel>
    </GameShell>
  );
}
