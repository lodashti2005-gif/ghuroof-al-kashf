/**
 * حساب أصوات «القرار الأخير» — كله مشتق من الحالة المشتركة، فكل جهاز يوصل
 * لنفس النتيجة بدون أي عشوائية.
 *
 * الجولة ١: كل اللاعبين الموجودين، وأصواتهم محفوظة بقاعدة البيانات (`room.votes`).
 * الجولات ٢+: جولات كسر التعادل، أصواتها بـ `room.final.votes` بمفتاح
 * `${round}:${playerId}`، ويصوّت فيها فقط من صوّت لأحد المتعادلين بالجولة السابقة.
 */
import { suspects } from "./case-data";
import type { RoomState } from "./types";

export interface VoteTally {
  id: string;
  name: string;
  count: number;
}

/** أصوات جولة معينة: playerId -> suspectId. */
export function roundVotes(room: RoomState | null, round: number): Record<string, string> {
  if (!room) return {};
  if (round <= 1) return room.votes ?? {};
  const prefix = `${round}:`;
  const out: Record<string, string> = {};
  for (const [key, suspectId] of Object.entries(room.final?.votes ?? {})) {
    if (key.startsWith(prefix)) out[key.slice(prefix.length)] = suspectId;
  }
  return out;
}

/** المشتبهون المسموح التصويت لهم بالجولة الحالية. */
export function candidatesFor(room: RoomState | null) {
  const ids = room?.final?.candidates ?? [];
  return ids.length ? suspects.filter((s) => ids.includes(s.id)) : suspects;
}

/** اللاعبون اللي يحق لهم يصوّتون بهذه الجولة. */
export function eligibleVoters(room: RoomState | null, round: number): string[] {
  const players = (room?.players ?? []).map((p) => p.id);
  if (round <= 1) return players;
  const candidates = room?.final?.candidates ?? [];
  const previous = roundVotes(room, round - 1);
  const eligible = players.filter((id) => candidates.includes(previous[id] ?? ""));
  // احتياط: لو ما بقي أحد مؤهل (خرجوا من الغرفة) نفتحها للجميع عشان ما تتعلق.
  return eligible.length ? eligible : players;
}

/** فرز الأصوات لجولة معينة (تنازلي). */
export function tallyFor(room: RoomState | null, round: number): VoteTally[] {
  const votes = roundVotes(room, round);
  const eligible = new Set(eligibleVoters(room, round));
  const values = Object.entries(votes)
    .filter(([playerId]) => eligible.has(playerId))
    .map(([, suspectId]) => suspectId);
  return candidatesFor(room)
    .map((s) => ({ id: s.id, name: s.name, count: values.filter((v) => v === s.id).length }))
    .sort((a, b) => b.count - a.count);
}

/** المشتبهون الحاصلون على أعلى عدد أصوات (أكثر من واحد = تعادل). */
export function leadersOf(tally: VoteTally[]): VoteTally[] {
  const top = tally[0]?.count ?? 0;
  if (top === 0) return [];
  return tally.filter((t) => t.count === top);
}

/** خلص التصويت لهذه الجولة؟ (كل مؤهل صوّت). */
export function votingComplete(room: RoomState | null, round: number): boolean {
  const eligible = eligibleVoters(room, round);
  if (eligible.length === 0) return false;
  const votes = roundVotes(room, round);
  return eligible.every((id) => !!votes[id]);
}
