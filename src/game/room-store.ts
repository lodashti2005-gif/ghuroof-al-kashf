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
import { INTERROGATION_SECONDS, caseFile } from "./case-data";
import { CASE_INTERROGATION_SECONDS, suspectIdsForCase } from "./case-suspects";
import { assignRoles, playerRoles } from "./roles";
import { assignLastTripRoles } from "./cases/last-trip-roles";
import type {
  AbilityUse,
  Contradiction,
  FinalDecision,
  LastTripTrial,
  Deduction,
  Note,
  Player,
  RoomState,
  SuspectRuntime,
  TurnState,
} from "./types";

const SESSION_KEY = "ghurfa:session";

export interface Session {
  code: string;
  playerId: string;
}

type Listener = () => void;

/** Portion of RoomState persisted inside `rooms.state`. */
type SharedState = Pick<
  RoomState,
  | "unlockedEvidence"
  | "notes"
  | "deductions"
  | "contradictions"
  | "suspects"
  | "roles"
  | "ready"
  | "turn"
  | "abilities"
  | "final"
  | "intro"
  | "ltRoles"
  | "ltRoleReady"
  | "ltAnalyzed"
  | "ltAcc"
  | "ltTrial"
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


/**
 * مشتبهو القضية الحالية فقط — كل قضية معزولة تماماً، فما يدخل مفتاح مشتبه من
 * «الشاليه» داخل غرفة «آخر رحلة» ولا العكس.
 */
const freshSuspects = (caseId: string = caseFile.id): Record<string, SuspectRuntime> =>
  Object.fromEntries(
    suspectIdsForCase(caseId).map((id) => [
      id,
      {
        stress: 12,
        timeLeft: CASE_INTERROGATION_SECONDS,
        finished: false,
        transcript: [],
        confronts: [],
        contradictionCount: 0,
      },
    ]),
  );

/** يحذف أي مفتاح مشتبه ما ينتمي لهذي القضية (تنظيف تلوّث حالة قديم). */
const scopeSuspects = (
  caseId: string,
  map: Record<string, SuspectRuntime>,
): Record<string, SuspectRuntime> => {
  const allowed = new Set(suspectIdsForCase(caseId));
  return Object.fromEntries(Object.entries(map).filter(([id]) => allowed.has(id)));
};

const freshShared = (caseId: string = caseFile.id): SharedState => ({
  unlockedEvidence: [],
  notes: [],
  deductions: [],
  contradictions: [],
  suspects: freshSuspects(caseId),
  roles: {},
  ready: [],
  turn: null,
  abilities: [],
  final: null,
  intro: null,
  ltRoles: {},
  ltRoleReady: [],
  ltAnalyzed: [],
  ltAcc: null,
  ltTrial: null,
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
/** هل فيه جلسة غرفة محفوظة بهذا التاب (قبل ما يخلص hydrate بعد الـrefresh). */
export const hasStoredSession = () => session !== null || readSession() !== null;
/** رمز الغرفة المحفوظ بهذا التاب (يفيد قبل ما يخلص hydrate). */
export const getStoredSessionCode = (): string | null =>
  session?.code ?? readSession()?.code ?? null;

/* ==================== حفظ التقدّم على حساب اللاعب ==================== */

/**
 * تقدّم اللاعب محفوظ بقاعدة البيانات (`game_progress`) ومربوط بـ user_id +
 * case_id، فيرجع اللاعب لنفس النقطة بعد إغلاق المتصفح أو تسجيل الخروج أو من
 * جهاز ثاني. حالة اللعب نفسها (الأدلة، الأدوار، الاستجوابات، المؤقتات) محفوظة
 * أصلاً بالغرفة، فهذا الجدول يربط الحساب بالغرفة + الصفحة الأخيرة.
 */
export interface SavedProgress {
  caseId: string;
  code: string;
  playerId: string;
  phase: string | null;
  route: string | null;
}

let lastRoute: string | null = null;
let progressTimer: number | null = null;
let lastSavedPhase: string | null = null;

async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

async function writeProgress() {
  if (!session || !state) return;
  const userId = await currentUserId();
  if (!userId) return; // لاعب دخل برمز غرفة بدون حساب — ما نربط له تقدّم
  lastSavedPhase = state.phase;
  const { error } = await supabase.from("game_progress").upsert(
    {
      user_id: userId,
      case_id: state.caseId,
      room_code: session.code,
      player_id: session.playerId,
      phase: state.phase,
      route: lastRoute,
      active: true,
    },
    { onConflict: "user_id,case_id" },
  );
  if (error) console.error("[progress] save failed:", error.message);
}

/** حفظ مؤجّل بسيط — يمنع كتابة متكررة مع كل تحديث لحظي. */
export function saveProgress() {
  if (typeof window === "undefined") return;
  if (progressTimer !== null) window.clearTimeout(progressTimer);
  progressTimer = window.setTimeout(() => {
    progressTimer = null;
    void writeProgress();
  }, 600);
}

/** الصفحة الحالية داخل القضية (تُنادى من الجذر عند تغيّر المسار). */
export function noteRoute(route: string) {
  if (route === lastRoute) return;
  lastRoute = route;
  saveProgress();
}

/** آخر تقدّم مفتوح لهذا الحساب — يتحقق أن الغرفة واللاعب لا يزالان موجودين. */
export async function loadSavedProgress(): Promise<SavedProgress | null> {
  const userId = await currentUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from("game_progress")
    .select("case_id, room_code, player_id, phase, route")
    .eq("user_id", userId)
    .eq("active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;

  const snap = await loadSnapshot(data.room_code, data.player_id);
  if (!snap) {
    await supabase
      .from("game_progress")
      .update({ active: false })
      .eq("user_id", userId)
      .eq("case_id", data.case_id);
    return null;
  }

  return {
    caseId: data.case_id,
    code: data.room_code,
    playerId: data.player_id,
    phase: data.phase ?? null,
    route: data.route ?? null,
  };
}

/** يستأنف الجلسة المحفوظة بنفس هوية اللاعب داخل الغرفة. */
export async function resumeSavedProgress(saved: SavedProgress): Promise<boolean> {
  session = { code: saved.code, playerId: saved.playerId };
  lastRoute = saved.route;
  saveSession();
  await refresh();
  return !!state;
}

/** إنهاء التقدّم المحفوظ (خروج من الغرفة). */
async function closeProgress(caseId: string | null) {
  if (!caseId) return;
  const userId = await currentUserId();
  if (!userId) return;
  await supabase
    .from("game_progress")
    .update({ active: false })
    .eq("user_id", userId)
    .eq("case_id", caseId);
}




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
  players: Array<{
    player_id: string;
    name: string;
    is_host: boolean;
    joined_at: string;
    last_seen_at?: string | null;
  }>;
  votes: Array<{ player_id: string; suspect_id: string }>;
}

/** آخر ظهور لكل لاعب حسب قاعدة البيانات — يمنع إخفاء لاعب نشط عند انقطاع Presence. */
const lastSeenById = new Map<string, number>();

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
  const caseId = snap.room.case_id;
  const shared = { ...freshShared(caseId), ...((snap.room.state ?? {}) as Partial<SharedState>) };
  return {
    code: snap.room.code,
    caseId: snap.room.case_id,
    phase: snap.room.phase as RoomState["phase"],
    createdAt: new Date(snap.room.created_at).getTime(),
    players: (snap.players ?? []).map<Player>((p) => {
      if (p.last_seen_at) lastSeenById.set(p.player_id, new Date(p.last_seen_at).getTime());
      return {
        id: p.player_id,
        name: p.name,
        isHost: p.is_host,
        joinedAt: new Date(p.joined_at).getTime(),
      };
    }),
    unlockedEvidence: shared.unlockedEvidence ?? [],
    notes: shared.notes ?? [],
    deductions: shared.deductions ?? [],
    contradictions: shared.contradictions ?? [],
    suspects: scopeSuspects(caseId, { ...freshSuspects(caseId), ...(shared.suspects ?? {}) }),
    roles: shared.roles ?? {},
    ready: shared.ready ?? [],
    votes: Object.fromEntries(
      (snap.votes ?? []).map((v) => [v.player_id, v.suspect_id]),
    ),
    turn: shared.turn ?? null,
    abilities: shared.abilities ?? [],
    final: shared.final ?? null,
    intro: shared.intro ?? null,
    ltRoles: shared.ltRoles ?? {},
    ltRoleReady: shared.ltRoleReady ?? [],
    ltAnalyzed: shared.ltAnalyzed ?? [],
    ltAcc: shared.ltAcc ?? null,
    ltTrial: shared.ltTrial ?? null,
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
      p.isHost ||
      now - p.joinedAt < PRESENCE_GRACE_MS ||
      // لاعب نشط بقاعدة البيانات (نبضة حديثة) ما يُخفى بسبب انقطاع Presence مؤقت.
      now - (lastSeenById.get(p.id) ?? 0) < PRESENCE_GRACE_MS,
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
  // أي تغيّر بالمرحلة يُحفظ بحساب اللاعب حتى يستأنف من نفس النقطة.
  if (state.phase !== lastSavedPhase) saveProgress();
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
  if (!parsed) {
    // ما فيه جلسة بهذا التاب — نستأنف آخر تقدّم محفوظ بالحساب (جهاز/متصفح ثاني).
    const saved = await loadSavedProgress();
    if (!saved) return;
    await resumeSavedProgress(saved);
    return;
  }
  session = parsed;
  await refresh();
}

/** Realtime subscriptions — players, votes and shared state. Ref-counted so
 * multiple mounted components share one channel per room. */
let rtCode: string | null = null;
let rtCount = 0;
let rtPoll: number | null = null;
let rtHeartbeat: number | null = null;
let refreshTimer: number | null = null;

function scheduleRefresh() {
  if (typeof window === "undefined" || refreshTimer !== null) return;
  refreshTimer = window.setTimeout(() => {
    refreshTimer = null;
    void refresh();
  }, 250);
}

/**
 * نبضة اللاعب: تحدّث آخر ظهور لصفّه بالغرفة وتنظّف الصفوف الميتة (تبويب مقفول
 * أو اتصال منقطع منذ فترة طويلة). ما تحذف لاعباً نشطاً ولا دوره ولا تقدمه.
 */
async function heartbeat() {
  if (!session) return;
  await rpc<boolean>("room_heartbeat", {
    _code: session.code,
    _player_id: session.playerId,
  });
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
          presenceOnline = online;
          const players = applyPresence(state.players);
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
    // نبضة دورية: تثبت أن اللاعب فعلي، وتنظّف صفوف اللاعبين الميتة بالغرفة.
    void heartbeat();
    rtHeartbeat = window.setInterval(() => void heartbeat(), 15_000);
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
  if (rtHeartbeat !== null) {
    window.clearInterval(rtHeartbeat);
    rtHeartbeat = null;
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
    turn: next.turn,
    abilities: next.abilities,
    final: next.final,
    intro: next.intro,
    ltRoles: next.ltRoles,
    ltRoleReady: next.ltRoleReady,
    ltAnalyzed: next.ltAnalyzed,
    ltAcc: next.ltAcc,
    ltTrial: next.ltTrial,
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

export async function createRoom(
  hostName: string,
  caseId: string = caseFile.id,
): Promise<{ ok: boolean; code?: string; error?: string }> {
  const playerId = uid();

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = generateRoomCode();
    const { data: result, error } = await rpc<string>("room_create", {
      _code: code,
      _case_id: caseId,
      _host_player_id: playerId,
      _host_name: hostName,
      _state: freshShared(caseId),
    });
    if (error) return { ok: false, error: "ما قدرنا نفتح الغرفة، جرب مرة ثانية" };
    if (result === "code_taken") continue; // code collision, retry
    if (result === "not_entitled")
      return { ok: false, error: "هذي القضية مقفلة — لازم تشتريها من متجر القضايا أول" };
    if (result === "unknown_case") return { ok: false, error: "القضية غير متوفرة حالياً" };
    if (result !== "ok") return { ok: false, error: "تأكد من الاسم وجرب مرة ثانية" };


    session = { code, playerId };
    saveSession();
    await refresh();
    saveProgress();
    return { ok: true, code };
  }
  return { ok: false, error: "ما قدرنا نفتح الغرفة، جرب مرة ثانية" };
}

/**
 * الدخول للغرفة: الحساب المسجل يرجع بنفس هوية اللاعب حتى من جهاز أو متصفح ثاني
 * (بدون إنشاء صف لاعب جديد)، والغرفة محدودة بـ٦ لاعبين فعليين.
 */
export async function joinRoom(code: string, name: string): Promise<{ ok: boolean; error?: string }> {
  const clean = code.trim();
  const playerId = uid();
  const { data, error } = await rpc<{ status: string; player_id?: string }>("room_join_v2", {
    _code: clean,
    _player_id: playerId,
    _name: name,
  });
  if (error) return { ok: false, error: "ما قدرنا نتصل بالسيرفر، تحقق من النت" };
  const result = data?.status;
  if (result === "not_found") return { ok: false, error: "ما لقينا غرفة بهذا الرمز" };
  if (result === "room_full") return { ok: false, error: "الغرفة مكتملة" };
  if (result === "name_taken") return { ok: false, error: "الاسم مستخدم بالغرفة، جرب اسم ثاني" };
  if (result !== "ok") return { ok: false, error: "تأكد من الاسم وجرب مرة ثانية" };

  session = { code: clean, playerId: data?.player_id ?? playerId };
  saveSession();
  await refresh();
  saveProgress();
  return { ok: true };
}

export function leaveRoom() {
  const current = session;
  void closeProgress(state?.caseId ?? null);
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

/**
 * المقدمة السينمائية: حالة مشتركة (رقم المشهد) عشان كل الأجهزة تشوف نفس
 * المشهد، والتحديث/إعادة الاتصال ترجع اللاعب لنفس المشهد بدون ما تعيدها من
 * البداية. ما تلمس الأدوار ولا الأدلة ولا أي نظام ثاني.
 */
export const startIntro = () =>
  update((s) => {
    s.phase = "intro";
    if (s.intro === null) s.intro = 0;
    // بداية القضية الفعلية = بداية عدّاد التجربة المجانية (لقضية «آخر رحلة» فقط).
    if (s.caseId === "last-trip" && s.ltTrial === null)
      s.ltTrial = { startedAt: Date.now(), unlocked: false };
  });

/* ==================== التجربة المجانية لقضية «آخر رحلة» ==================== */

/** مدة التجربة المجانية لكل غرفة: ١٠ دقائق. */
export const LAST_TRIP_TRIAL_SECONDS = 600;

/** يضمن وجود بداية للتجربة داخل غرفة «آخر رحلة» (بدون تصفير لو موجودة). */
export const ensureLastTripTrial = () =>
  update((s) => {
    if (s.caseId !== "last-trip") return;
    if (s.ltTrial === null) s.ltTrial = { startedAt: Date.now(), unlocked: false };
  });

/** الوقت المتبقي بالثواني — محسوب من الحالة المشتركة فما يتأثر بالـrefresh. */
export function remainingLastTripTrial(trial?: LastTripTrial | null): number {
  if (!trial) return LAST_TRIP_TRIAL_SECONDS;
  if (trial.unlocked) return LAST_TRIP_TRIAL_SECONDS;
  const passed = Math.floor((Date.now() - trial.startedAt) / 1000);
  return Math.max(0, LAST_TRIP_TRIAL_SECONDS - passed);
}

/** جاهزة للربط بالدفع لاحقاً: تفتح الغرفة بالكامل بدون مسح أي تقدم. */
export const unlockLastTripRoom = () =>
  update((s) => {
    if (s.caseId !== "last-trip") return;
    s.ltTrial = { startedAt: s.ltTrial?.startedAt ?? Date.now(), unlocked: true };
  });

export const setIntroStep = (step: number) =>
  update((s) => {
    if (s.phase !== "intro") return;
    s.intro = Math.max(0, step);
  });

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
    s.intro = null;
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

    // دور شاغر فقط — ممنوع تكرار نفس الدور على لاعبين داخل نفس الغرفة.
    const taken = new Set(Object.values(roles));
    const pick = playerRoles.find((r) => !taken.has(r.id));
    if (!pick) return false; // كل الأدوار الستة موزّعة — الغرفة مكتملة.
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

/**
 * تسجيل مواجهة (دليل أو قول شاهد) وعدد التناقضات بالحالة المشتركة — يوصل كل
 * لاعبي الغرفة فوراً، وما أحد يقدر يعيد نفس المواجهة مرة ثانية.
 */
export const recordConfront = (
  suspectId: string,
  confrontId: string | null,
  contradiction = false,
) =>
  update((s) => {
    const rt = s.suspects[suspectId];
    if (!rt) return;
    if (confrontId) {
      rt.confronts = rt.confronts ?? [];
      if (!rt.confronts.includes(confrontId)) rt.confronts.push(confrontId);
    }
    if (contradiction) rt.contradictionCount = (rt.contradictionCount ?? 0) + 1;
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
  delete rt.timerStartedAt;
  if (rt.timeLeft === 0) rt.finished = true;
}

/**
 * فتح جلسة استجواب: يوقف عدّادات باقي المشتبهين فوراً ويشغّل عدّاد هذا
 * المشتبه من الوقت المتبقي له. لو خلص وقته سابقاً ما يرجع يبدأ أبداً.
 */
export const startInterrogationTimer = (suspectId: string, initialSeconds?: number) =>
  update((s) => {
    const now = Date.now();
    // مشتبهو القضايا الأخرى (مثل «آخر رحلة») ينشأ لهم سجل وقت أول مرة فقط.
    if (!s.suspects[suspectId] && typeof initialSeconds === "number") {
      s.suspects[suspectId] = {
        stress: 12,
        timeLeft: initialSeconds,
        finished: false,
        transcript: [],
        confronts: [],
        contradictionCount: 0,
      };
    }
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

/**
 * المضيف فقط يفتح «القرار الأخير» — ما تبدأ تلقائياً أبداً. فتحها يقفل
 * الاستجواب واكتشاف الأدلة وقدرات الأدوار والجولات الجديدة (دفتر القضية يبقى مفتوح).
 */
export const startAccusation = () =>
  update((s) => {
    s.phase = "voting";
    if (!s.final) s.final = { round: 1, candidates: [], votes: {} };
  });

/** مدة نقاش التعادل: ٦٠ ثانية مشتركة. */
export const TIE_SECONDS = 60;

/** الوقت المتبقي لنقاش التعادل — محسوب من الحالة المشتركة فالـ refresh ما يصفّره. */
export function remainingTieTime(final?: FinalDecision | null): number {
  if (!final?.tieAt) return 0;
  return Math.max(0, TIE_SECONDS - Math.floor((Date.now() - final.tieAt) / 1000));
}

/** يبدأ جولة كسر تعادل جديدة بين المشتبهين المتعادلين (المضيف أو أول جهاز يرصد التعادل). */
export const startTieBreak = (candidates: string[], fromRound: number) =>
  update((s) => {
    const final = s.final;
    if (!final || final.round !== fromRound || final.accused) return;
    if (candidates.length < 2) return;
    s.final = {
      ...final,
      round: fromRound + 1,
      candidates: [...candidates],
      tieAt: Date.now(),
    };
  });

/** صوت جولة كسر التعادل — يُكتب مرة واحدة فقط لكل لاعب بكل جولة. */
export const castFinalVote = (playerId: string, suspectId: string, round: number) =>
  update((s) => {
    const final = s.final;
    if (!final || final.round !== round || final.accused) return;
    const key = `${round}:${playerId}`;
    if (final.votes[key]) return;
    s.final = { ...final, votes: { ...final.votes, [key]: suspectId } };
  });

/** تثبيت قرار الفريق النهائي (مرة واحدة). */
export const setTeamAccusation = (suspectId: string) =>
  update((s) => {
    if (!s.final || s.final.accused) return;
    s.final = { ...s.final, accused: suspectId };
  });

/** المضيف فقط يكشف الحقيقة بعد ما يثبت قرار الفريق. */
export const revealTruth = () =>
  update((s) => {
    s.phase = "reveal";
    if (s.final && !s.final.revealedAt) s.final = { ...s.final, revealedAt: Date.now() };
  });

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
    s.deductions = [];
    s.contradictions = [];
    s.suspects = freshSuspects(s.caseId);
    s.roles = {};
    s.ready = [];
    s.votes = {};
    s.turn = null;
    s.abilities = [];
    s.final = null;
    s.ltRoles = {};
    s.ltRoleReady = [];
    s.ltAnalyzed = [];
    s.ltAcc = null;
  });
}

/* ==================== أدوار بالتناوب (turn-based role actions) ==================== */

/** مدة دور اللاعب الواحد: دقيقتان. */
export const TURN_SECONDS = 120;

/** مدة وقت النقاش المشترك: ٣ دقائق. */
export const DISCUSSION_SECONDS = 180;

/** الوقت المتبقي لدور اللاعب الحالي — محسوب من الحالة المشتركة، فالـ refresh ما يعيده. */
export function remainingTurnTime(turn?: TurnState | null): number {
  if (!turn || turn.mode !== "action") return 0;
  return Math.max(0, TURN_SECONDS - Math.floor((Date.now() - turn.startedAt) / 1000));
}

/** الوقت المتبقي لوقت النقاش — نفس الحساب المشترك، فالـ refresh ما يصفّره. */
export function remainingDiscussionTime(turn?: TurnState | null): number {
  if (!turn || turn.mode !== "discussion") return 0;
  return Math.max(0, DISCUSSION_SECONDS - Math.floor((Date.now() - turn.startedAt) / 1000));
}

/** اللاعب صاحب الدور الفعّال حالياً (null بوقت النقاش). */
export function activeTurnPlayerId(turn?: TurnState | null): string | null {
  if (!turn || turn.mode !== "action") return null;
  return turn.order[turn.index] ?? null;
}

/** إنهاء النقاش (المضيف أو انتهاء العدّاد) → «جاهزين للجولة التالية؟». */
export const endDiscussion = () =>
  update((s) => {
    const turn = s.turn;
    if (!turn || turn.mode !== "discussion") return;
    s.turn = { ...turn, mode: "ready", startedAt: Date.now() };
  });


const turnOrderFor = (s: RoomState) =>
  [...s.players].sort((a, b) => a.joinedAt - b.joinedAt).map((p) => p.id);

/** يبدأ أول جولة تناوب لو ما بدأت (المضيف فقط). */
export const ensureTurns = () =>
  update((s) => {
    if (s.turn) return;
    const order = turnOrderFor(s);
    if (order.length === 0) return;
    s.turn = { order, index: 0, round: 1, mode: "action", startedAt: Date.now() };
  });

/**
 * ينقل الدور للاعب اللي بعده. `expected` يمنع تقديم الدور مرتين لو ضغط زر
 * «أنهيت دوري» ونفس الوقت خلص العدّاد على جهاز ثاني.
 */
export const advanceTurn = (expected: { round: number; index: number }) =>
  update((s) => {
    const turn = s.turn;
    if (!turn || turn.mode !== "action") return;
    if (turn.round !== expected.round || turn.index !== expected.index) return;
    const present = new Set(s.players.map((p) => p.id));
    let next = turn.index + 1;
    while (next < turn.order.length && !present.has(turn.order[next]!)) next++;
    if (next >= turn.order.length) {
      // خلّص الجميع دورهم → وقت النقاش المشترك.
      s.turn = { ...turn, mode: "discussion", startedAt: Date.now() };
      return;
    }
    s.turn = { ...turn, index: next, startedAt: Date.now() };
  });

/** المضيف يبدأ جولة جديدة بنفس ترتيب اللاعبين. */
export const startNextRound = () =>
  update((s) => {
    const turn = s.turn;
    if (!turn) return;
    const present = new Set(s.players.map((p) => p.id));
    const kept = turn.order.filter((id) => present.has(id));
    const added = turnOrderFor(s).filter((id) => !kept.includes(id));
    const order = [...kept, ...added];
    if (order.length === 0) return;
    s.turn = { order, index: 0, round: turn.round + 1, mode: "action", startedAt: Date.now() };
  });

/**
 * تسجيل استخدام قدرة دور. المعرّف ثابت (جولة + لاعب + نوع) فالتسجيل يصير مرة
 * واحدة فقط — إعادة التحميل أو إعادة الاتصال ما تعيد تشغيل القدرة.
 */
export const recordAbility = (entry: Omit<AbilityUse, "createdAt">) =>
  update((s) => {
    if (!s.abilities) s.abilities = [];
    if (s.abilities.some((a) => a.id === entry.id)) return;
    s.abilities.unshift({ ...entry, createdAt: Date.now() });
  });

/* ==================== أدوار قضية «آخر رحلة» فقط ==================== */

/**
 * قرعة أدوار «آخر رحلة»: تنفّذ مرة واحدة فقط. أي دور محفوظ يبقى ثابت، فالـ
 * refresh أو الخروج والرجوع ما يعيد القرعة ولا يغيّر الدور.
 */
export function startLastTripRoles() {
  update((s) => {
    const ids = s.players.map((p) => p.id);
    if (ids.length === 0) return;
    s.ltRoles = assignLastTripRoles(ids, s.ltRoles ?? {});
  });
}

/** لاعب انضم متأخر: يعطي نفسه دور ناقص فقط بدون ما يمس أدوار الباقين. */
export function claimLastTripRole(playerId: string) {
  update((s) => {
    if (!playerId) return;
    if (s.ltRoles?.[playerId]) return;
    s.ltRoles = assignLastTripRoles(
      [...s.players.map((p) => p.id), playerId],
      s.ltRoles ?? {},
    );
  });
}

export const markLastTripRoleReady = (playerId: string) =>
  update((s) => {
    if (!s.ltRoleReady) s.ltRoleReady = [];
    if (!s.ltRoleReady.includes(playerId)) s.ltRoleReady.push(playerId);
  });

/** تسجيل فحص تفصيلي لدليل «آخر رحلة» — مشترك مع الفريق ومرة واحدة فقط. */
export const markLastTripAnalyzed = (evidenceId: string) =>
  update((s) => {
    if (!s.ltAnalyzed) s.ltAnalyzed = [];
    if (!s.ltAnalyzed.includes(evidenceId)) s.ltAnalyzed.push(evidenceId);
  });

/**
 * تأكيد اتهام الفريق بقضية «آخر رحلة». أول تأكيد فقط هو المعتمد — لو ضغط
 * لاعبان بنفس الوقت، الثاني ما يكتب اتهام مختلف (الحالة المشتركة تُقرأ قبل الكتابة).
 */
export const confirmLastTripAccusation = (
  suspectId: string,
  correct: boolean,
  reasons: string[] = [],
) =>
  update((s) => {
    const acc = s.ltAcc;
    if (acc && acc.stage !== "select") return; // اتهام مسجل أصلاً
    s.ltAcc = {
      stage: "result",
      selectedSuspect: suspectId,
      result: correct ? "correct" : "wrong",
      reasons,
      attempts: [
        ...(acc?.attempts ?? []),
        { suspectId, correct, at: Date.now(), reasons },
      ],
      endingViewed: acc?.endingViewed ?? false,
      confirmedAt: Date.now(),
    };
  });

/** «إعادة الاتهام» بعد اتهام خاطئ — ما تمس الأدلة ولا المؤقتات ولا الأدوار. */
export const retryLastTripAccusation = () =>
  update((s) => {
    const acc = s.ltAcc;
    if (!acc || acc.result !== "wrong") return;
    const { confirmedAt: _dropped, ...rest } = acc;
    s.ltAcc = {
      ...rest,
      stage: "select",
      selectedSuspect: null,
      result: null,
      reasons: [],
    };
  });

/** فتح النهاية الكاملة للفريق كله («كشف الحل» أو «مشاهدة النهاية»). */
export const openLastTripEnding = () =>
  update((s) => {
    const acc = s.ltAcc;
    s.ltAcc = {
      stage: "ending",
      selectedSuspect: acc?.selectedSuspect ?? null,
      result: acc?.result ?? null,
      reasons: acc?.reasons ?? [],
      attempts: acc?.attempts ?? [],
      endingViewed: true,
      ...(acc?.confirmedAt ? { confirmedAt: acc.confirmedAt } : {}),
    };
  });

export function findPlayer(room: RoomState | null, playerId?: string): Player | undefined {
  return room?.players.find((p) => p.id === playerId);
}
