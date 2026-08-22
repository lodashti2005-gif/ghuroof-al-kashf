/**
 * شريط الدور الحالي — يظهر لكل الأجهزة بنفس المعلومة: منو صاحب الدور الآن،
 * وكم باقي له، وزر «أنهيت دوري» لصاحب الدور، ووقت النقاش المشترك (٣ دقائق)
 * مع «إنهاء النقاش» و«ابدأ الجولة التالية» للمضيف.
 */
import { Hourglass, MessageSquare, Timer } from "lucide-react";

import { ActionButton } from "@/components/game/shell";
import { CaseTag, Eyebrow, Panel } from "@/components/game/ui";
import { useTurn } from "@/game/use-turn";
import { formatClock } from "@/game/use-room";

export function TurnBanner() {
  const {
    turn,
    activePlayer,
    activeRole,
    remaining,
    isMyTurn,
    discussion,
    awaitingNextRound,
    discussionRemaining,
    isHost,
    endMyTurn,
    endDiscussion,
    startNextRound,
  } = useTurn();

  if (!turn) return null;

  if (discussion || awaitingNextRound) {
    return (
      <Panel className="cine-in border-evidence/35">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Eyebrow>الجولة {turn.round}</Eyebrow>
            <h2 className="mt-1 flex items-center gap-2 text-lg font-bold">
              <MessageSquare className="size-4 text-evidence" />{" "}
              {discussion ? "وقت النقاش" : "جاهزين للجولة التالية؟"}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {discussion
                ? "كل اللاعبين خلصوا دورهم — راجعوا دفتر القضية والأدلة وحركات الجولة وتناقشوا. أدوات الأدوار والاستجواب واكتشاف الأدلة مقفلة حالياً."
                : "خلص وقت النقاش — قائد الغرفة يبدأ الجولة التالية بنفس ترتيب اللاعبين."}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {discussion && (
              <span className="flex items-center gap-1.5 font-mono text-lg font-bold tabular-nums">
                <Timer className="size-4 text-muted-foreground" />
                {formatClock(discussionRemaining)}
              </span>
            )}
            {isHost ? (
              discussion ? (
                <ActionButton variant="outline" onClick={endDiscussion}>
                  إنهاء النقاش
                </ActionButton>
              ) : (
                <ActionButton onClick={startNextRound}>ابدأ الجولة التالية</ActionButton>
              )
            ) : (
              <CaseTag>بانتظار قائد الغرفة</CaseTag>
            )}
          </div>
        </div>
      </Panel>
    );
  }


  return (
    <Panel className={`cine-in ${isMyTurn ? "border-primary/45" : "border-border"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow>الجولة {turn.round}</Eyebrow>
          <h2 className="mt-1 truncate text-lg font-bold">
            الدور الحالي: {activeRole?.title ?? "لاعب"} — {activePlayer?.name ?? "لاعب غير متصل"}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {isMyTurn
              ? "دورك الآن — استخدم أدوات دورك، وباقي اللاعبين يشاهدون ويتناقشون."
              : "انتظر دورك — تقدر تشاهد التحقيق وتتناقش، بس أدوات دورك مقفلة حالياً."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono text-lg font-bold tabular-nums">
            <Timer className="size-4 text-muted-foreground" />
            {formatClock(remaining)}
          </span>
          {isMyTurn ? (
            <ActionButton onClick={endMyTurn}>أنهيت دوري</ActionButton>
          ) : (
            <CaseTag tone="muted">
              <span className="inline-flex items-center gap-1.5">
                <Hourglass className="size-3.5" /> انتظر دورك
              </span>
            </CaseTag>
          )}
        </div>
      </div>
    </Panel>
  );
}

/** بديل بسيط لأي أداة دور مقفلة لأن الدور مو دورك. */
export function WaitYourTurnNote() {
  return (
    <Panel className="cine-in border-dashed">
      <p className="flex items-center gap-2 text-sm font-bold">
        <Hourglass className="size-4 text-muted-foreground" /> انتظر دورك
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        أدوات دورك تنفتح لمن يجي دورك بالتناوب. حالياً تقدر تتابع الأدلة وتناقش الفريق.
      </p>
    </Panel>
  );
}
