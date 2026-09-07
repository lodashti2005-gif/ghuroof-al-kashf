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
import { useI18n } from "@/i18n";

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
    finalPhase,
    isHost,
    endMyTurn,
    endDiscussion,
    startNextRound,
  } = useTurn();
  const { pick } = useI18n();

  if (finalPhase) return null;
  if (!turn) return null;

  if (discussion || awaitingNextRound) {
    return (
      <Panel className="cine-in border-evidence/35">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Eyebrow>{pick(`الجولة ${turn.round}`, `Round ${turn.round}`)}</Eyebrow>
            <h2 className="mt-1 flex items-center gap-2 text-lg font-bold">
              <MessageSquare className="size-4 text-evidence" />{" "}
              {discussion ? pick("وقت النقاش", "Discussion time") : pick("جاهزين للجولة التالية؟", "Ready for the next round?")}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {discussion
                ? pick(
                    "كل اللاعبين خلصوا دورهم — راجعوا دفتر القضية والأدلة وحركات الجولة وتناقشوا. أدوات الأدوار والاستجواب واكتشاف الأدلة مقفلة حالياً.",
                    "Everyone has finished their turn — review the case notebook, the evidence and the round's actions, and discuss. Role tools, interrogation and evidence discovery are locked for now.",
                  )
                : pick(
                    "خلص وقت النقاش — قائد الغرفة يبدأ الجولة التالية بنفس ترتيب اللاعبين.",
                    "Discussion time is over — the room host starts the next round with the same player order.",
                  )}
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
                  {pick("إنهاء النقاش", "End discussion")}
                </ActionButton>
              ) : (
                <ActionButton onClick={startNextRound}>{pick("ابدأ الجولة التالية", "Start next round")}</ActionButton>
              )
            ) : (
              <CaseTag>{pick("بانتظار قائد الغرفة", "Waiting for the room host")}</CaseTag>
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
          <Eyebrow>{pick(`الجولة ${turn.round}`, `Round ${turn.round}`)}</Eyebrow>
          <h2 className="mt-1 truncate text-lg font-bold">
            {pick("الدور الحالي:", "Current turn:")} {pick(activeRole?.title, activeRole?.titleEn) ?? pick("لاعب", "Player")} —{" "}
            {activePlayer?.name ?? pick("لاعب غير متصل", "Player offline")}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {isMyTurn
              ? pick(
                  "دورك الآن — استخدم أدوات دورك، وباقي اللاعبين يشاهدون ويتناقشون.",
                  "It's your turn now — use your role's tools while the rest of the team watches and discusses.",
                )
              : pick(
                  "انتظر دورك — تقدر تشاهد التحقيق وتتناقش، بس أدوات دورك مقفلة حالياً.",
                  "Wait for your turn — you can watch the investigation and discuss, but your role's tools are locked for now.",
                )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono text-lg font-bold tabular-nums">
            <Timer className="size-4 text-muted-foreground" />
            {formatClock(remaining)}
          </span>
          {isMyTurn ? (
            <ActionButton onClick={endMyTurn}>{pick("أنهيت دوري", "I'm done")}</ActionButton>
          ) : (
            <CaseTag tone="muted">
              <span className="inline-flex items-center gap-1.5">
                <Hourglass className="size-3.5" /> {pick("انتظر دورك", "Wait your turn")}
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
  const { pick } = useI18n();
  return (
    <Panel className="cine-in border-dashed">
      <p className="flex items-center gap-2 text-sm font-bold">
        <Hourglass className="size-4 text-muted-foreground" /> {pick("انتظر دورك", "Wait your turn")}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        {pick(
          "أدوات دورك تنفتح لمن يجي دورك بالتناوب. حالياً تقدر تتابع الأدلة وتناقش الفريق.",
          "Your role's tools unlock when your turn comes up in rotation. For now you can follow the evidence and discuss with the team.",
        )}
      </p>
    </Panel>
  );
}
