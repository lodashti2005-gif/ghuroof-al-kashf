import { useEffect } from "react";
import { useSyncExternalStore } from "react";
import * as store from "./room-store";
import * as sim from "./sim-players";

export function useRoom() {
  const raw = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  // وضع المحاكاة محلي بالكامل: يضيف لاعبين وهميين للواجهة فقط.
  const simState = useSyncExternalStore(sim.subscribe, sim.getSnapshot, sim.getServerSnapshot);

  useEffect(() => {
    void store.hydrate();
  }, []);

  // Re-subscribe whenever the player's room changes (create / join / leave).
  const code = raw?.code ?? null;
  useEffect(() => {
    return store.startRealtime();
  }, [code]);

  const session = store.getSession();
  const room = sim.overlayRoom(raw, simState);
  const me = sim.actingPlayer(simState) ?? store.findPlayer(room, session?.playerId);

  return { room, me, isHost: !!me?.isHost, actions: store, sim: simState };
}

export function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
