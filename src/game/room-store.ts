/**
 * Room store — real online multiplayer backed by Lovable Cloud.
 *
 * `rooms` holds the shared game state (phase + evidence + notes + interrogation
 * progress) as one row per 6-digit code, `room_players` holds the connected
 * players and `room_votes` holds one final vote per player. All three tables are
 * in the realtime publication, so every device in the room refreshes instantly.
 *
 * The exported API (subscribe/getSnapshot/actions) is unchanged apart from
 * `createRoom`/`joinRoom`/`hydrate` now being async.
 */
import { supabase } from "@/integrations/supabase/client";
import { INTERROGATION_SECONDS, caseFile, suspects } from "./case-data";
import { assignRoles, playerRoles } from "./roles";
import type { Deduction, Note, Player, RoomState, SuspectRuntime } from "./types";

const SESSION_KEY = "ghurfa:session";

export interface Session {
  code: string;
  playerId: string;
}

type Listener = () => void;

/** Portion of RoomState persisted inside `rooms.state`. */
type SharedState = Pick<
  RoomState,
  "unlockedEvidence" | "notes" | "deductions" | "suspects" | "roles" | "ready"
>;

let state: RoomState | null = null;
let session: Session | null = null;
const listeners = new Set<Listener>();
let channel: ReturnType<typeof supabase.channel> | null = null;

const emit = () => listeners.forEach((l) => l());

/** Postgrest builders are lazy — they only fire once awaited/then-ed. */
function run(builder: PromiseLike<{ error: { message: string } | null }>, label: string) {
  void Promise.resolve(builder).then(({ error }) => {
    if (error) console.error(`[room] ${label} failed:`, error.message);
  });
}

const uid = () => Math.random().toString(36).slice(2, 10);

const freshSuspects = (): Record<string, SuspectRuntime> =>
  Object.fromEntries(
    suspects.map((s) => [
      s.id,
      { stress: 12, timeLeft: INTERROGATION_SECONDS, finished: false, transcript: [] },
    ]),
  );

const freshShared = (): SharedState => ({
  unlockedEvidence: [],
  notes: [],
  deductions: [],
  suspects: freshSuspects(),
  roles: {},
  ready: [],
});

function saveSession() {
  if (typeof window === "undefined") return;
  // sessionStorage keeps refresh/reconnect working without making two tabs on
  // the same device impersonate the same player.
  if (session) window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else window.sessionStorage.removeItem(SESSION_KEY);
}

function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getSnapshot = () => state;
export const getServerSnapshot = () => null;
export const getSession = () => session;

/** Load a full room (row + players + votes) from the backend. */
async function fetchRoom(code: string): Promise<RoomState | null> {
  const [{ data: room }, { data: players }, { data: votes }] = await Promise.all([
    supabase.from("rooms").select("*").eq("code", code).maybeSingle(),
    supabase.from("room_players").select("*").eq("room_code", code).order("joined_at"),
    supabase.from("room_votes").select("*").eq("room_code", code),
  ]);
  if (!room) return null;

  const shared = { ...freshShared(), ...((room.state ?? {}) as Partial<SharedState>) };
  return {
    code: room.code,
    caseId: room.case_id,
    phase: room.phase as RoomState["phase"],
    createdAt: new Date(room.created_at).getTime(),
    players: (players ?? []).map<Player>((p) => ({
      id: p.player_id,
      name: p.name,
      isHost: p.is_host,
      joinedAt: new Date(p.joined_at).getTime(),
    })),
    unlockedEvidence: shared.unlockedEvidence ?? [],
    notes: shared.notes ?? [],
    deductions: shared.deductions ?? [],
    suspects: { ...freshSuspects(), ...(shared.suspects ?? {}) },
    roles: shared.roles ?? {},
    ready: shared.ready ?? [],
    votes: Object.fromEntries((votes ?? []).map((v) => [v.player_id, v.suspect_id])),
  };
}

let refreshInFlight: Promise<void> | null = null;
let refreshQueued = false;

async function refreshNow() {
  if (!session) return;
  const next = await fetchRoom(session.code);
  if (!next) {
    // room disappeared / expired
    state = null;
    session = null;
    saveSession();
    emit();
    return;
  }
  state = next;
  emit();
}

/** Coalesce realtime bursts into one fetch. A single room write can otherwise
 * wake every mounted consumer and cause overlapping three-query refreshes. */
async function refresh() {
  if (refreshInFlight) {
    refreshQueued = true;
    return refreshInFlight;
  }
  refreshInFlight = refreshNow().finally(() => {
    refreshInFlight = null;
    if (refreshQueued) {
      refreshQueued = false;
      window.setTimeout(() => void refresh(), 120);
    }
  });
  return refreshInFlight;
}

/** Restore the player's room after a refresh / new device page load. */
export async function hydrate() {
  if (typeof window === "undefined" || state) return;
  const parsed = readSession();
  if (!parsed) return;
  session = parsed;
  await refresh();
}

/** Realtime subscriptions — players, votes and shared state. Ref-counted so
 * multiple mounted components share one channel per room. */
let rtCode: string | null = null;
let rtCount = 0;
let rtPoll: number | null = null;
let refreshTimer: number | null = null;

function scheduleRefresh() {
  if (typeof window === "undefined" || refreshTimer !== null) return;
  refreshTimer = window.setTimeout(() => {
    refreshTimer = null;
    void refresh();
  }, 250);
}

export function startRealtime() {
  if (typeof window === "undefined") return () => {};
  const code = session?.code ?? readSession()?.code;
  if (!code) return () => {};

  if (rtCode === code && channel) {
    rtCount++;
  } else {
    teardownRealtime();
    rtCode = code;
    rtCount = 1;
    channel = supabase
      .channel(`room-${code}-${Math.random().toString(36).slice(2, 8)}`)
      .on("presence", { event: "sync" }, () => {
        if (!channel || !state) return;
        const online = new Set(
          Object.values(channel.presenceState()).flatMap((entries) =>
            entries.flatMap((entry) => {
              const id = (entry as { playerId?: unknown }).playerId;
              return typeof id === "string" ? [id] : [];
            }),
          ),
        );
        if (online.size > 0) {
          const players = state.players.filter((player) => online.has(player.id));
          if (players.length !== state.players.length) {
            state = { ...state, players };
            emit();
          }
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `code=eq.${code}` }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players", filter: `room_code=eq.${code}` }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_votes", filter: `room_code=eq.${code}` }, scheduleRefresh)
      .subscribe((status) => {
        if (status === "SUBSCRIBED" && channel && session?.code === code) {
          void channel.track({ playerId: session.playerId, onlineAt: new Date().toISOString() });
        }
      });
    // Safety net for flaky mobile connections.
    rtPoll = window.setInterval(() => void refresh(), 5000);
  }

  return () => {
    rtCount = Math.max(0, rtCount - 1);
    if (rtCount === 0) teardownRealtime();
  };
}

function teardownRealtime() {
  if (refreshTimer !== null) {
    window.clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  if (rtPoll !== null) {
    window.clearInterval(rtPoll);
    rtPoll = null;
  }
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
  rtCode = null;
  rtCount = 0;
}

const mutationQueue: Array<(s: RoomState) => void> = [];
let flushingMutations = false;

function sharedPayload(next: RoomState) {
  return {
    unlockedEvidence: next.unlockedEvidence,
    notes: next.notes,
    deductions: next.deductions,
    suspects: next.suspects,
    roles: next.roles,
    ready: next.ready,
  };
}

/** Persist each mutation against the newest database snapshot. This prevents
 * concurrent players from replacing one another's transcript, role, or timer
 * with an older full-state snapshot. */
async function flushMutations() {
  if (flushingMutations) return;
  flushingMutations = true;
  try {
    while (mutationQueue.length > 0 && session) {
      const mutate = mutationQueue[0];
      let saved = false;
      for (let attempt = 0; attempt < 5 && !saved; attempt++) {
        const { data: row, error: readError } = await supabase
          .from("rooms")
          .select("*")
          .eq("code", session.code)
          .maybeSingle();
        if (readError || !row) break;
        const remote = await fetchRoom(session.code);
        if (!remote) break;
        mutate(remote);
        const { data: updated, error } = await supabase
          .from("rooms")
          .update({
            phase: remote.phase,
            state: sharedPayload(remote) as unknown as never,
            updated_at: new Date().toISOString(),
          })
          .eq("code", remote.code)
          .eq("updated_at", row.updated_at)
          .select("code")
          .maybeSingle();
        if (error) console.error("[room] sync state failed:", error.message);
        saved = !!updated;
      }
      mutationQueue.shift();
      if (!saved) scheduleRefresh();
    }
  } finally {
    flushingMutations = false;
  }
}

/** Optimistically mutate local state, then serialize that exact mutation. */
function update(mutate: (s: RoomState) => void) {
  if (!state) return;
  const next: RoomState = JSON.parse(JSON.stringify(state));
  mutate(next);
  state = next;
  emit();
  mutationQueue.push(mutate);
  void flushMutations();
}

export const generateRoomCode = () => String(Math.floor(Math.random() * 1000000)).padStart(6, "0");

export async function createRoom(hostName: string): Promise<{ ok: boolean; code?: string; error?: string }> {
  const playerId = uid();

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = generateRoomCode();
    const { error } = await supabase.from("rooms").insert({
      code,
      case_id: caseFile.id,
      phase: "lobby",
      host_player_id: playerId,
      state: freshShared() as unknown as never,
    });
    if (error) {
      if (error.code === "23505") continue; // code collision, retry
      return { ok: false, error: "ما قدرنا نفتح الغرفة، جرب مرة ثانية" };
    }
    const { error: pErr } = await supabase
      .from("room_players")
      .insert({ room_code: code, player_id: playerId, name: hostName, is_host: true });
    if (pErr) return { ok: false, error: "ما قدرنا نفتح الغرفة، جرب مرة ثانية" };

    session = { code, playerId };
    saveSession();
    await refresh();
    return { ok: true, code };
  }
  return { ok: false, error: "ما قدرنا نفتح الغرفة، جرب مرة ثانية" };
}

export async function joinRoom(code: string, name: string): Promise<{ ok: boolean; error?: string }> {
  const clean = code.trim();
  const { data: room, error } = await supabase
    .from("rooms")
    .select("code")
    .eq("code", clean)
    .maybeSingle();
  if (error) return { ok: false, error: "ما قدرنا نتصل بالسيرفر، تحقق من النت" };
  if (!room) return { ok: false, error: "ما لقينا غرفة بهذا الرمز" };

  const { data: existing } = await supabase
    .from("room_players")
    .select("name")
    .eq("room_code", clean);
  if ((existing ?? []).some((p) => p.name.trim() === name.trim()))
    return { ok: false, error: "الاسم مستخدم بالغرفة، جرب اسم ثاني" };

  const playerId = uid();
  const { error: pErr } = await supabase
    .from("room_players")
    .insert({ room_code: clean, player_id: playerId, name: name.trim(), is_host: false });
  if (pErr) return { ok: false, error: "ما قدرنا ندخلك الغرفة، جرب مرة ثانية" };

  session = { code: clean, playerId };
  saveSession();
  await refresh();
  return { ok: true };
}

export function leaveRoom() {
  const current = session;
  if (current) {
    run(
      supabase
        .from("room_players")
        .delete()
        .eq("room_code", current.code)
        .eq("player_id", current.playerId),
      "leave room",
    );
  }
  state = null;
  session = null;
  saveSession();
  teardownRealtime();
  emit();
}

export const setPhase = (phase: RoomState["phase"]) => update((s) => void (s.phase = phase));

/** إعادة مزامنة يدوية (زر «إعادة المزامنة»). */
export async function resync() {
  await refresh();
}

/** أحدث قائمة لاعبين من قاعدة البيانات — لا نعتمد على snapshot محلي قد يكون قديم. */
async function fetchPlayerIds(code: string): Promise<string[]> {
  const { data } = await supabase
    .from("room_players")
    .select("player_id")
    .eq("room_code", code)
    .order("joined_at");
  return (data ?? []).map((p) => p.player_id);
}

/**
 * المضيف يبدأ الجولة: يقرأ كل اللاعبين المتصلين فعلياً من قاعدة البيانات (حتى لو
 * وصل أحدهم متأخراً)، يوزّع الأدوار، ثم يحفظ الحالة المشتركة.
 */
export async function startRoles(playerIds: string[] = []) {
  const code = session?.code ?? state?.code;
  if (!code) return;
  const fresh = await fetchPlayerIds(code);
  const ids = fresh.length ? fresh : playerIds.length ? playerIds : (state?.players ?? []).map((p) => p.id);
  update((s) => {
    s.roles = assignRoles(ids);
    s.ready = [];
    s.phase = "roles";
  });
}

/**
 * لو اللاعب ما عنده دور (انضم متأخر / فوّت الحدث): يعطي نفسه دور ناقص بقراءة
 * الحالة المشتركة الحديثة ودمج مفتاحه فقط — يمنع race conditions ولا يعيد
 * توزيع أدوار الآخرين، وما يتغير دوره بعد كل refresh.
 */
export async function claimRole(playerId: string): Promise<boolean> {
  const code = session?.code ?? state?.code;
  if (!code || !playerId) return false;

  const { data: room } = await supabase
    .from("rooms")
    .select("state")
    .eq("code", code)
    .maybeSingle();
  if (!room) return false;

  const shared = { ...freshShared(), ...((room.state ?? {}) as Partial<SharedState>) };
  const roles: Record<string, string> = { ...(shared.roles ?? {}) };
  if (roles[playerId]) {
    await refresh();
    return true;
  }

  // اختَر دور من الأدوار الأقل استخداماً بالفريق (الأولوية للأدوار الأساسية).
  const counts = new Map<string, number>();
  Object.values(roles).forEach((r) => counts.set(r, (counts.get(r) ?? 0) + 1));
  const candidates = [...playerRoles].sort(
    (a, b) => (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0),
  );
  const taken = new Set(Object.values(roles));
  const pick =
    candidates.find((r) => !taken.has(r.id)) ??
    candidates.find((r) => r.repeatable) ??
    playerRoles[0]!;
  roles[playerId] = pick.id;

  const { error } = await supabase
    .from("rooms")
    .update({
      state: { ...shared, roles } as unknown as never,
      updated_at: new Date().toISOString(),
    })
    .eq("code", code);
  if (error) {
    console.error("[room] claim role failed:", error.message);
    return false;
  }
  await refresh();
  return true;
}

export const markReady = (playerId: string) =>
  update((s) => {
    if (!s.ready.includes(playerId)) s.ready.push(playerId);
  });


export const unlockEvidence = (id: string) =>
  update((s) => {
    if (!s.unlockedEvidence.includes(id)) s.unlockedEvidence.push(id);
  });

export const addNote = (note: Omit<Note, "id" | "createdAt">) =>
  {
    const entry = { ...note, id: uid(), createdAt: Date.now() };
    update((s) => void s.notes.unshift(entry));
  };

export const addDeduction = (d: Omit<Deduction, "id" | "createdAt">) =>
  {
    const entry = { ...d, id: uid(), createdAt: Date.now() };
    update((s) => {
    if (s.deductions.some((x) => x.linkId === d.linkId)) return;
      s.deductions.unshift(entry);
    });
  };

export const removeNote = (id: string) =>
  update((s) => void (s.notes = s.notes.filter((n) => n.id !== id)));

export const pushMessage = (
  suspectId: string,
  msg: { role: "investigator" | "suspect"; author: string; text: string; evidenceId?: string },
) => {
  const entry = { ...msg, id: uid(), createdAt: Date.now() };
  update((s) => {
    const rt = s.suspects[suspectId];
    if (!rt) return;
    if (!rt.transcript.some((message) => message.id === entry.id)) rt.transcript.push(entry);
  });
};


export const setSuspectState = (
  suspectId: string,
  next: NonNullable<SuspectRuntime["state"]>,
  level?: number,
) =>
  update((s) => {
    const rt = s.suspects[suspectId];
    if (!rt) return;
    rt.state = next;
    if (typeof level === "number") rt.level = Math.max(rt.level ?? 1, level);
  });

export const bumpStress = (suspectId: string, delta: number) =>
  update((s) => {
    const rt = s.suspects[suspectId];
    if (!rt) return;
    rt.stress = Math.max(0, Math.min(100, rt.stress + delta));
  });

export const setTimeLeft = (suspectId: string, seconds: number) =>
  update((s) => {
    const rt = s.suspects[suspectId];
    if (!rt) return;
    rt.timeLeft = Math.max(0, seconds);
    if (rt.timeLeft === 0) rt.finished = true;
  });

export const endInterrogation = (suspectId: string) =>
  update((s) => {
    const rt = s.suspects[suspectId];
    if (rt) rt.finished = true;
  });

/** One vote per player, stored server-side so no device can fake others. */
export function castVote(playerId: string, suspectId: string) {
  if (!state) return;
  const code = state.code;
  state = { ...state, votes: { ...state.votes, [playerId]: suspectId } };
  emit();
  run(
    supabase
      .from("room_votes")
      .upsert(
        { room_code: code, player_id: playerId, suspect_id: suspectId },
        { onConflict: "room_code,player_id" },
      ),
    "cast vote",
  );
}

export function resetCase() {
  if (!state) return;
  const code = state.code;
  run(supabase.from("room_votes").delete().eq("room_code", code), "reset votes");
  update((s) => {
    s.phase = "lobby";
    s.unlockedEvidence = [];
    s.notes = [];
    s.suspects = freshSuspects();
    s.roles = {};
    s.ready = [];
    s.votes = {};
  });
}

export function findPlayer(room: RoomState | null, playerId?: string): Player | undefined {
  return room?.players.find((p) => p.id === playerId);
}
