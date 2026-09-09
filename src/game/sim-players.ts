/**
 * محاكاة لاعبين إضافيين داخل نفس المتصفح/الجهاز — لأغراض الاختبار فقط.
 *
 * كل شي هنا محلي ١٠٠٪: ما ينشئ حساب، ما يمر على الدفع أو التجربة، وما يكتب أي
 * شي بقاعدة البيانات ولا بحالة الغرفة المشتركة. اللاعبون الوهميون يظهرون
 * بالواجهة فقط (قائمة الفريق + الأدوار)، وتقدر تتنقل بين هوياتهم لتجربة
 * القدرات والمواجهة التجريبية بأدوار مختلفة.
 */
import type { Player, RoomState } from "./types";
import { lastTripRoles } from "./cases/last-trip-roles";

const KEY = "ghurfa:sim-players";

export interface SimPlayer {
  id: string;
  name: string;
  roleId: string;
}

export interface SimState {
  /** وضع المحاكاة شغّال؟ */
  active: boolean;
  players: SimPlayer[];
  /** الهوية اللي أتصرف بها حالياً (null = هويتي الحقيقية). */
  asId: string | null;
}

const empty: SimState = { active: false, players: [], asId: null };

let state: SimState = empty;
let loaded = false;
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

function load(): SimState {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as SimState;
    return {
      active: !!parsed.active,
      players: Array.isArray(parsed.players) ? parsed.players : [],
      asId: parsed.asId ?? null,
    };
  } catch {
    return empty;
  }
}

function emit(next: SimState) {
  state = next;
  persist();
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void) {
  if (!loaded) {
    loaded = true;
    state = load();
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getSnapshot = () => {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    state = load();
  }
  return state;
};
export const getServerSnapshot = () => empty;

/** لغة الواجهة الحالية — نقراها من عنصر الصفحة اللي يضبطه نظام اللغة. */
function activeLang(): "ar" | "en" {
  if (typeof document === "undefined") return "ar";
  return document.documentElement.lang === "en" ? "en" : "ar";
}

const simNamesAr = ["لاعب تجريبي ١", "لاعب تجريبي ٢", "لاعب تجريبي ٣", "لاعب تجريبي ٤", "لاعب تجريبي ٥"];
const simNamesEn = ["Test player 1", "Test player 2", "Test player 3", "Test player 4", "Test player 5"];
/** أسماء اللاعبين الوهميين حسب لغة الواجهة الحالية. */
const simNames = () => (activeLang() === "en" ? simNamesEn : simNamesAr);

function freeRole(taken: Set<string>) {
  return lastTripRoles.find((r) => !taken.has(r.id))?.id ?? lastTripRoles[0]!.id;
}

/** يشغّل الوضع مع لاعبين وهميين جاهزين (افتراضي: اثنان). */
export function enableSim(count = 2) {
  const players: SimPlayer[] = [];
  const taken = new Set<string>();
  for (let i = 0; i < count; i++) {
    const roleId = freeRole(taken);
    taken.add(roleId);
    players.push({ id: `sim-${i + 1}-${Math.random().toString(36).slice(2, 7)}`, name: simNames()[i] ?? (activeLang() === "en" ? `Player ${i + 1}` : `لاعب ${i + 1}`), roleId });
  }
  emit({ active: true, players, asId: null });
}

export function disableSim() {
  emit(empty);
}

export function addSimPlayer() {
  const s = getSnapshot();
  const taken = new Set(s.players.map((p) => p.roleId));
  const roleId = freeRole(taken);
  const player: SimPlayer = {
    id: `sim-${s.players.length + 1}-${Math.random().toString(36).slice(2, 7)}`,
    name:
      simNames()[s.players.length] ??
      (activeLang() === "en"
        ? `Test player ${s.players.length + 1}`
        : `لاعب تجريبي ${s.players.length + 1}`),
    roleId,
  };
  emit({ ...s, active: true, players: [...s.players, player] });
}

export function removeSimPlayer(id: string) {
  const s = getSnapshot();
  emit({
    ...s,
    players: s.players.filter((p) => p.id !== id),
    asId: s.asId === id ? null : s.asId,
  });
}

export function setSimRole(id: string, roleId: string) {
  const s = getSnapshot();
  emit({ ...s, players: s.players.map((p) => (p.id === id ? { ...p, roleId } : p)) });
}

/** تبديل الهوية الحالية بين هويتي الحقيقية واللاعبين الوهميين. */
export function actAs(id: string | null) {
  emit({ ...getSnapshot(), asId: id });
}


const simPlayer = (p: SimPlayer): Player => ({
  id: p.id,
  name: `${p.name} ${activeLang() === "en" ? "(sim)" : "(محاكاة)"}`,
  isHost: false,
  joinedAt: Date.now(),
});

/** غرفة محلية بالكامل للاختبار بدون حساب أو غرفة حقيقية. */
export function buildSimRoom(sim: SimState, caseId = "last-trip"): RoomState {
  return {
    code: "SIMLAB",
    caseId,
    phase: "investigation" as RoomState["phase"],
    sessionId: 1,
    createdAt: Date.now(),
    players: sim.players.map(simPlayer),
    unlockedEvidence: [],
    notes: [],
    deductions: [],
    contradictions: [],
    suspects: {},
    roles: {},
    ready: sim.players.map((p) => p.id),
    votes: {},
    turn: null,
    abilities: [],
    final: null,
    intro: null,
    ltRoles: Object.fromEntries(sim.players.map((p) => [p.id, p.roleId])),
    ltRoleReady: sim.players.map((p) => p.id),
    ltAnalyzed: [],
    ltAcc: null,
    ltTrial: { startedAt: Date.now(), unlocked: true },
  };
}

/**
 * يدمج اللاعبين الوهميين بالغرفة الظاهرة للواجهة (بدون أي كتابة).
 * الأدوار الوهمية تتفادى أي دور محجوز فعلاً باللاعبين الحقيقيين.
 */
export function overlayRoom(room: RoomState | null, sim: SimState): RoomState | null {
  if (!sim.active || sim.players.length === 0) return room;
  const base: RoomState = room ?? buildSimRoom(sim);
  const simIds = new Set(sim.players.map((p) => p.id));
  // الأدوار المحجوزة باللاعبين الحقيقيين فقط — دور اللاعب الوهمي يبقى كما اخترته.
  const takenRoles = new Set(
    Object.entries(base.ltRoles ?? {})
      .filter(([id]) => !simIds.has(id))
      .map(([, roleId]) => roleId),
  );
  const ltRoles = { ...(base.ltRoles ?? {}) };
  sim.players.forEach((p) => {
    const roleId = takenRoles.has(p.roleId) ? freeRole(takenRoles) : p.roleId;
    takenRoles.add(roleId);
    ltRoles[p.id] = roleId;
  });
  const existing = new Set(base.players.map((p) => p.id));
  return {
    ...base,
    players: [...base.players, ...sim.players.filter((p) => !existing.has(p.id)).map(simPlayer)],
    ltRoles,
    // اللاعبون الوهميون «جاهزون» دائماً عشان ما نكتب أي شي بالحالة المشتركة.
    ready: [...base.ready, ...sim.players.map((p) => p.id)],
    ltRoleReady: [...(base.ltRoleReady ?? []), ...sim.players.map((p) => p.id)],
  };
}

/** اللاعب اللي أتصرف بهويته حالياً (لو وضع المحاكاة شغّال). */
export function actingPlayer(sim: SimState): Player | null {
  const p = sim.active ? sim.players.find((x) => x.id === sim.asId) : undefined;
  return p ? simPlayer(p) : null;
}
