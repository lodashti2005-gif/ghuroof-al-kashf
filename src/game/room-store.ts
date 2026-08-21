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
import type { Contradiction, Deduction, Note, Player, RoomState, SuspectRuntime } from "./types";

const SESSION_KEY = "ghurfa:session";

export interface Session {
  code: string;
  playerId: string;
}

type Listener = () => void;

/** Portion of RoomState persisted inside `rooms.state`. */
type SharedState = Pick<
  RoomState,
  "unlockedEvidence" | "notes" | "deductions" | "contradictions" | "suspects" | "roles" | "ready"
>;

let state: RoomState | null = null;
let session: Session | null = null;
const listeners = new Set<Listener>();
let channel: ReturnType<typeof supabase.channel> | null = null;

const emit = () => listeners.forEach((l) => l());

/**
 * كل الوصول لبيانات الغرفة يمر عبر دوال قاعدة البيانات المحمية (RPC) — الجداول
 * نفسها مقفلة تماماً على العميل، فما أحد يقرأ أو يعدل غرفة هو ما فيها.
 */
type RpcResult<T> = Promise<{ data: T | null; error: { message: string } | null }>;
const rpc = <T,>(fn: string, args: Record<string, unknown>): RpcResult<T> =>
  (supabase.rpc as unknown as (name: string, params: Record<string, unknown>) => RpcResult<T>)(
    fn,
    args,
  );

function run<T>(call: RpcResult<T>, label: string) {
  void call.then(({ error }) => {
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
  contradictions: [],
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

interface Snapshot {
  room: {
    code: string;
    case_id: string;
    phase: string;
    host_player_id: string;
    state: Partial<SharedState> | null;
    created_at: string;
    updated_at: string;
  };
  players: Array<{ player_id: string; name: string; is_host: boolean; joined_at: string }>;
  votes: Array<{ player_id: string; suspect_id: string }>;
}

async function loadSnapshot(code: string, playerId: string): Promise<Snapshot | null> {
  const { data, error } = await rpc<Snapshot>("room_snapshot", {
    _code: code,
    _player_id: playerId,
  });
  if (error) {
    console.error("[room] snapshot failed:", error.message);
    return null;
  }
  return data ?? null;
}

function toRoomState(snap: Snapshot): RoomState {
  const shared = { ...freshShared(), ...((snap.room.state ?? {}) as Partial<SharedState>) };
  return {
    code: snap.room.code,
    caseId: snap.room.case_id,
    phase: snap.room.phase as RoomState["phase"],
    createdAt: new Date(snap.room.created_at).getTime(),
    players: (snap.players ?? []).map<Player>((p) => ({
      id: p.player_id,
      name: p.name,
      isHost: p.is_host,
      joinedAt: new Date(p.joined_at).getTime(),
    })),
    unlockedEvidence: shared.unlockedEvidence ?? [],
    notes: shared.notes ?? [],
    deductions: shared.deductions ?? [],
    contradictions: shared.contradictions ?? [],
    suspects: { ...freshSuspects(), ...(shared.suspects ?? {}) },
    roles: shared.roles ?? {},
    ready: shared.ready ?? [],
    votes: Object.fromEntries(
      (snap.votes ?? []).map((v) => [v.player_id, v.suspect_id]),
    ),
  };
}

/** Load a full room (row + players + votes) for the current player. */
async function fetchRoom(code: string, playerId?: string): Promise<RoomState | null> {
  const id = playerId ?? session?.playerId;
  if (!id) return null;
  const snap = await loadSnapshot(code, id);
  return snap ? toRoomState(snap) : null;
}


let refreshInFlight: Promise<void> | null = null;
let refreshQueued = false;

/** Presence is a hint, not the source of truth: `room_players` is. A player who
 * just joined (or whose presence hasn't synced yet) must still be counted. */
let presenceOnline: Set<string> | null = null;
const PRESENCE_GRACE_MS = 25_000;

function applyPresence(players: Player[]): Player[] {
  if (!presenceOnline || presenceOnline.size === 0) return players;
  const now = Date.now();
  return players.filter(
    (p) =>
      presenceOnline!.has(p.id) ||
      p.id === session?.playerId ||
      now - p.joinedAt < PRESENCE_GRACE_MS,
  );
}

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
  state = { ...next, players: applyPresence(next.players) };
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
    // الجداول مقفلة على العميل، فتحديثات postgres_changes ما توصل — نعتمد على
    // الحضور + استقصاء سريع كمصدر للمزامنة اللحظية.
    rtPoll = window.setInterval(() => void refresh(), 1500);
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
    contradictions: next.contradictions,
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
        if (!mutate || !session) break;
        const snap = await loadSnapshot(session.code, session.playerId);
        if (!snap) break;
        const expected = snap.room.updated_at;
        const remote = toRoomState(snap);
        mutate(remote);
        const { data: newTs, error } = await rpc<string>("room_set_state", {
          _code: remote.code,
          _player_id: session.playerId,
          _phase: remote.phase,
          _state: sharedPayload(remote),
          _expected_updated_at: expected,
        });
        if (error) console.error("[room] sync state failed:", error.message);
        saved = !!newTs;
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
    const { data: result, error } = await rpc<string>("room_create", {
      _code: code,
      _case_id: caseFile.id,
      _host_player_id: playerId,
      _host_name: hostName,
      _state: freshShared(),
    });
    if (error) return { ok: false, error: "ما قدرنا نفتح الغرفة، جرب مرة ثانية" };
    if (result === "code_taken") continue; // code collision, retry
    if (result !== "ok") return { ok: false, error: "تأكد من الاسم وجرب مرة ثانية" };

    session = { code, playerId };
    saveSession();
    await refresh();
    return { ok: true, code };
  }
  return { ok: false, error: "ما قدرنا نفتح الغرفة، جرب مرة ثانية" };
}

export async function joinRoom(code: string, name: string): Promise<{ ok: boolean; error?: string }> {
  const clean = code.trim();
  const playerId = uid();
  const { data: result, error } = await rpc<string>("room_join", {
    _code: clean,
    _player_id: playerId,
    _name: name,
  });
  if (error) return { ok: false, error: "ما قدرنا نتصل بالسيرفر، تحقق من النت" };
  if (result === "not_found") return { ok: false, error: "ما لقينا غرفة بهذا الرمز" };
  if (result === "name_taken") return { ok: false, error: "الاسم مستخدم بالغرفة، جرب اسم ثاني" };
  if (result !== "ok") return { ok: false, error: "تأكد من الاسم وجرب مرة ثانية" };

  session = { code: clean, playerId };
  saveSession();
  await refresh();
  return { ok: true };
}

export function leaveRoom() {
  const current = session;
  if (current) {
    run(
      rpc("room_leave", { _code: current.code, _player_id: current.playerId }),
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
  if (!session) return [];
  const snap = await loadSnapshot(code, session.playerId);
  return (snap?.players ?? []).map((p) => p.player_id);
}


/**
 * المضيف يبدأ الجولة: يقرأ كل اللاعبين المتصلين فعلياً من قاعدة البيانات (حتى لو
 * وصل أحدهم متأخراً)، يوزّع الأدوار، ثم يحفظ الحالة المشتركة.
 */
export async function startRoles(playerIds: string[] = []) {
  const code = session?.code ?? state?.code;
  if (!code) return;
  // المضيف فقط يوزّع الأدوار — يمنع أجهزة متعددة من تشغيل التوزيع بنفس الوقت.
  const me = state?.players.find((p) => p.id === session?.playerId);
  if (me && !me.isHost) return;
  const fresh = await fetchPlayerIds(code);
  const ids = fresh.length ? fresh : playerIds.length ? playerIds : (state?.players ?? []).map((p) => p.id);
  update((s) => {
    const hadRoles = Object.keys(s.roles ?? {}).length > 0;
    // توزيع مرة واحدة: أي دور محفوظ مسبقاً يبقى ثابت لنفس player_id.
    s.roles = assignRoles(ids, s.roles ?? {});
    if (!hadRoles) s.ready = [];
    s.phase = "roles";
  });

}

/**
 * لو اللاعب ما عنده دور (انضم متأخر / فوّت الحدث): يعطي نفسه دور ناقص بقراءة
 * الحالة المشتركة الحديثة ودمج مفتاحه فقط — يمنع race conditions ولا يعيد
 * توزيع أدوار الآخرين، وما يتغير دوره بعد كل refresh.
 * التحديث ذرّي (expected updated_at)؛ لو صار تعارض مع لاعب ثاني نعيد المحاولة
 * على أحدث حالة حتى لا يتكرر نفس الدور الفريد بين لاعبين.
 */
export async function claimRole(playerId: string): Promise<boolean> {
  const code = session?.code ?? state?.code;
  if (!code || !playerId || !session) return false;

  for (let attempt = 0; attempt < 5; attempt++) {
    const snap = await loadSnapshot(code, session.playerId);
    if (!snap) return false;

    const shared = { ...freshShared(), ...((snap.room.state ?? {}) as Partial<SharedState>) };
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

    const { data: newTs, error } = await rpc<string>("room_set_state", {
      _code: code,
      _player_id: session.playerId,
      _phase: snap.room.phase,
      _state: { ...shared, roles },
      _expected_updated_at: snap.room.updated_at,
    });
    if (error) {
      console.error("[room] claim role failed:", error.message);
      return false;
    }
    if (newTs) {
      await refresh();
      return true;
    }
    // تعارض: لاعب ثاني كتب قبلنا — نعيد القراءة ونحاول مرة ثانية.
    await new Promise((r) => setTimeout(r, 120 + attempt * 150));
  }
  return false;
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

/**
 * تسجيل تناقض محتمل بملف القضية. مشترك بين كل اللاعبين، ولا يتكرر لو نفس
 * القول/التعارض انرصد قبل.
 */
export const addContradiction = (c: Omit<Contradiction, "id" | "createdAt">) => {
  const entry: Contradiction = { ...c, id: uid(), createdAt: Date.now() };
  update((s) => {
    const dup = s.contradictions.some(
      (x) =>
        x.suspectId === entry.suspectId &&
        x.claim.trim() === entry.claim.trim() &&
        x.conflictsWith.trim() === entry.conflictsWith.trim(),
    );
    if (!dup) s.contradictions.unshift(entry);
  });
};

export const markContradictionConfronted = (id: string) =>
  update((s) => {
    const item = s.contradictions.find((c) => c.id === id);
    if (item) item.confronted = true;
  });

export const removeNote = (id: string) =>
  update((s) => void (s.notes = s.notes.filter((n) => n.id !== id)));

export const pushMessage = (
  suspectId: string,
  msg: {
    role: "investigator" | "suspect";
    author: string;
    text: string;
    evidenceId?: string;
    flagged?: boolean;
  },
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
    rt.timerStartedAt = Date.now();
    if (rt.timeLeft === 0) rt.finished = true;
  });

export function remainingTime(runtime?: SuspectRuntime): number {
  if (!runtime) return INTERROGATION_SECONDS;
  if (runtime.finished || runtime.timeLeft <= 0) return 0;
  if (!runtime.timerStartedAt) return runtime.timeLeft;
  return Math.max(0, runtime.timeLeft - Math.floor((Date.now() - runtime.timerStartedAt) / 1000));
}

/** يوقف عدّاد مشتبه ويخزن الوقت المتبقي بالضبط (بدون أي تصفير). */
function bank(rt: SuspectRuntime, now: number) {
  if (!rt.timerStartedAt) return;
  rt.timeLeft = Math.max(0, rt.timeLeft - Math.floor((now - rt.timerStartedAt) / 1000));
  rt.timerStartedAt = undefined;
  if (rt.timeLeft === 0) rt.finished = true;
}

/**
 * فتح جلسة استجواب: يوقف عدّادات باقي المشتبهين فوراً ويشغّل عدّاد هذا
 * المشتبه من الوقت المتبقي له. لو خلص وقته سابقاً ما يرجع يبدأ أبداً.
 */
export const startInterrogationTimer = (suspectId: string) =>
  update((s) => {
    const now = Date.now();
    for (const [id, rt] of Object.entries(s.suspects)) {
      if (id !== suspectId) bank(rt, now);
    }
    const rt = s.suspects[suspectId];
    if (!rt || rt.finished || rt.timeLeft <= 0) return;
    if (!rt.timerStartedAt) rt.timerStartedAt = now;
  });

/** إيقاف مؤقت عند الخروج من غرفة المشتبه — الوقت المتبقي يبقى محفوظاً. */
export const pauseInterrogationTimer = (suspectId: string) =>
  update((s) => {
    const rt = s.suspects[suspectId];
    if (rt) bank(rt, Date.now());
  });

/** إنهاء نهائي — يُنفّذ مرة واحدة فقط حتى لو نادته عدة أجهزة. */
export const endInterrogation = (suspectId: string) =>
  update((s) => {
    const rt = s.suspects[suspectId];
    if (!rt || rt.finished) return;
    bank(rt, Date.now());
    rt.finished = true;
  });

/** المضيف فقط يفتح مرحلة الاتهام النهائي — ما تبدأ تلقائياً. */
export const startAccusation = () => setPhase("voting");

/** المضيف فقط يكشف الحقيقة بعد ما يخلص التصويت. */
export const revealTruth = () => setPhase("reveal");

/**
 * صوت واحد لكل لاعب محفوظ بالسيرفر. ما ينقدر يتغير بعد التأكيد ولا يتكرر
 * حتى لو عمل اللاعب Refresh (الصوت يرجع من قاعدة البيانات).
 */
export function castVote(playerId: string, suspectId: string) {
  if (!state || !session) return;
  if (playerId !== session.playerId) return; // كل جهاز يصوّت بنفسه فقط
  if (state.votes[playerId]) return; // ما يتغير الصوت بعد التثبيت
  const code = state.code;
  state = { ...state, votes: { ...state.votes, [playerId]: suspectId } };
  emit();
  // الصوت الأول هو الصوت الثابت — القيد محفوظ بقاعدة البيانات.
  void rpc<boolean>("room_cast_vote", {
    _code: code,
    _player_id: playerId,
    _suspect_id: suspectId,
  }).then(() => refresh());
}


export function resetCase() {
  if (!state || !session) return;
  const code = state.code;
  run(rpc("room_reset_votes", { _code: code, _player_id: session.playerId }), "reset votes");

  update((s) => {
    s.phase = "lobby";
    s.unlockedEvidence = [];
    s.notes = [];
    s.contradictions = [];
    s.suspects = freshSuspects();
    s.roles = {};
    s.ready = [];
    s.votes = {};
  });
}

export function findPlayer(room: RoomState | null, playerId?: string): Player | undefined {
  return room?.players.find((p) => p.id === playerId);
}
