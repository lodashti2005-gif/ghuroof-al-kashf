import { useEffect } from "react";
import { useSyncExternalStore } from "react";
import * as store from "./room-store";

export function useRoom() {
  const room = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  useEffect(() => {
    void store.hydrate();
  }, []);

  // Re-subscribe whenever the player's room changes (create / join / leave).
  const code = room?.code ?? null;
  useEffect(() => {
    return store.startRealtime();
  }, [code]);

  const session = store.getSession();
  const me = store.findPlayer(room, session?.playerId);

  return { room, me, isHost: !!me?.isHost, actions: store };
}

export function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
