/**
 * حالة أدوار «آخر رحلة» على مستوى الغرفة/اللاعب.
 *
 * الدور محفوظ بالحالة المشتركة للغرفة، فالـrefresh أو الخروج والرجوع ما يعيد
 * القرعة ولا يغيّر الدور. بدون غرفة (تجربة فردية) كل القدرات مفتوحة.
 */
import { useCallback, useEffect } from "react";

import * as store from "../room-store";
import { useRoom } from "../use-room";
import {
  getLastTripRole,
  lastTripCan,
  type LastTripCapability,
} from "./last-trip-roles";

export function useLastTripRole() {
  const { room, me, isHost } = useRoom();
  const inRoom = !!room && !!me;
  const roleId = me ? (room?.ltRoles?.[me.id] ?? null) : null;
  const role = getLastTripRole(roleId);
  const acknowledged = !!me && !!room?.ltRoleReady?.includes(me.id);

  // قرعة مرة واحدة: المضيف يوزّع بعد اكتمال دخول اللاعبين، واللاعب المتأخر
  // يأخذ دور ناقص بدون ما يمس أدوار الباقين.
  useEffect(() => {
    if (!inRoom || !room || !me) return;
    const assigned = Object.keys(room.ltRoles ?? {}).length;
    if (assigned === 0) {
      if (isHost) store.startLastTripRoles();
      return;
    }
    if (!room.ltRoles?.[me.id]) store.claimLastTripRole(me.id);
  }, [inRoom, room, me, isHost]);

  const acknowledge = useCallback(() => {
    if (me) store.markLastTripRoleReady(me.id);
  }, [me]);

  const can = useCallback(
    (capability: LastTripCapability) => lastTripCan(roleId, capability, inRoom),
    [roleId, inRoom],
  );

  return {
    inRoom,
    room,
    me,
    isHost,
    roleId,
    role,
    acknowledged,
    acknowledge,
    can,
    analyzed: room?.ltAnalyzed ?? [],
  };
}
