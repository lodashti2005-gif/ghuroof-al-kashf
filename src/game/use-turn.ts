/**
 * دور اللاعب بالتناوب — قراءة الحالة المشتركة من الغرفة وحسابها لكل جهاز.
 * ما يغيّر توزيع الأدوار ولا الأدلة ولا الاستجواب: بس يحدد منو يقدر يستخدم
 * أدوات دوره الآن، ووقت النقاش المشترك بين الجولات.
 */
import { useEffect, useState } from "react";

import { roleById } from "./roles";
import * as store from "./room-store";
import { useRoom } from "./use-room";

export function useTurn() {
  const { room, me, isHost, actions } = useRoom();
  const [, tick] = useState(0);

  // نبضة ثانية واحدة لعرض العدّاد (الوقت نفسه محسوب من الحالة المشتركة).
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const turn = room?.turn ?? null;
  const investigating = room?.phase === "investigation";

  // المضيف يفتح أول جولة تناوب أول ما يبدأ التحقيق.
  useEffect(() => {
    if (isHost && investigating && !turn) store.ensureTurns();
  }, [isHost, investigating, turn]);

  const activeId = store.activeTurnPlayerId(turn);
  const activePlayer = room?.players.find((p) => p.id === activeId) ?? null;
  const activeRole = roleById(activeId ? room?.roles?.[activeId] : undefined);
  const remaining = store.remainingTurnTime(turn);
  const isMyTurn = !!me && !!activeId && activeId === me.id;
  const discussion = turn?.mode === "discussion";
  const awaitingNextRound = turn?.mode === "ready";
  const discussionRemaining = store.remainingDiscussionTime(turn);
  // قبل ما تبدأ الجولة (أو بمراحل ثانية) ما نقفل شي — نفس السلوك السابق.
  const canAct = !turn || !investigating ? true : isMyTurn;

  // انتهى الوقت → ننقل الدور تلقائياً. جهاز اللاعب الحالي يقدّم الدور، ولو
  // كان مفصول يتكفّل المضيف — والتحديث محمي ضد التنفيذ مرتين.
  useEffect(() => {
    if (!turn || turn.mode !== "action" || remaining > 0) return;
    const activePresent = !!activePlayer;
    if (isMyTurn || (isHost && !activePresent)) {
      actions.advanceTurn({ round: turn.round, index: turn.index });
    }
  }, [turn, remaining, isMyTurn, isHost, activePlayer, actions]);

  // انتهى وقت النقاش → «جاهزين للجولة التالية؟» (المضيف يكتب الحالة المشتركة).
  useEffect(() => {
    if (!turn || turn.mode !== "discussion" || discussionRemaining > 0) return;
    if (isHost) actions.endDiscussion();
  }, [turn, discussionRemaining, isHost, actions]);

  const endMyTurn = () => {
    if (!turn || turn.mode !== "action") return;
    actions.advanceTurn({ round: turn.round, index: turn.index });
  };

  return {
    turn,
    activePlayer,
    activeRole,
    remaining,
    isMyTurn,
    discussion,
    awaitingNextRound,
    discussionRemaining,
    canAct,
    isHost,
    endMyTurn,
    endDiscussion: actions.endDiscussion,
    startNextRound: actions.startNextRound,
  };
}
