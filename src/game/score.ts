/**
 * تقييم أداء الفريق بعد كشف الحقيقة — يحسب من الحالة المشتركة فقط، فكل
 * الأجهزة تشوف نفس النتيجة (بدون أي عشوائية).
 */
import { evidence, killerId, suspects } from "./case-data";
import type { RoomState } from "./types";

export interface TeamScore {
  /** النتيجة النهائية من ١٠٠. */
  total: number;
  rank: string;
  breakdown: Array<{ label: string; points: number; max: number; detail: string }>;
  evidenceFound: number;
  evidenceTotal: number;
  contradictions: number;
  abilities: number;
  suspectReplies: number;
  /** مدة التحقيق بالثواني. */
  seconds: number;
  accused?: string | undefined;
  accusedName: string;
  correct: boolean;
}

function rankFor(total: number) {
  if (total >= 90) return "محققون محترفون";
  if (total >= 75) return "فريق تحقيق قوي";
  if (total >= 50) return "كنتم قريبين";
  return "القضية غلبتكم";
}

const clamp = (n: number, max: number) => Math.max(0, Math.min(max, Math.round(n)));

export function computeTeamScore(room: RoomState | null): TeamScore {
  const evidenceTotal = evidence.length;
  const evidenceFound = (room?.unlockedEvidence ?? []).length;
  const contradictions = (room?.contradictions ?? []).length;
  const abilities = (room?.abilities ?? []).length;
  const deductions = (room?.deductions ?? []).length;
  const suspectReplies = suspects.reduce(
    (sum, s) =>
      sum + (room?.suspects[s.id]?.transcript ?? []).filter((m) => m.role === "suspect").length,
    0,
  );
  const players = Math.max(1, room?.players.length ?? 1);
  const accused = room?.final?.accused;
  const correct = accused === killerId;

  const end = room?.final?.revealedAt ?? Date.now();
  const seconds = Math.max(0, Math.floor((end - (room?.createdAt ?? end)) / 1000));
  const minutes = seconds / 60;

  const evidencePoints = clamp((evidenceFound / evidenceTotal) * 25, 25);
  // معلومات مفيدة من الاستجواب: ٤ ردود لكل مشتبه تعتبر تغطية كاملة.
  const replyPoints = clamp((suspectReplies / (suspects.length * 4)) * 15, 15);
  const contradictionPoints = clamp((contradictions / 4) * 20, 20);
  // استخدام صحيح للقدرات: قدرة لكل لاعب + الربط الناجح.
  const abilityPoints = clamp(((abilities + deductions) / players) * 10, 10);
  const accusationPoints = correct ? 25 : 0;
  // كفاءة الوقت: ٤٥ دقيقة أو أقل = الدرجة كاملة، تنقص تدريجياً حتى ٩٠ دقيقة.
  const timePoints = clamp(minutes <= 45 ? 5 : 5 - ((minutes - 45) / 45) * 5, 5);

  const total = clamp(
    evidencePoints +
      replyPoints +
      contradictionPoints +
      abilityPoints +
      accusationPoints +
      timePoints,
    100,
  );

  return {
    total,
    rank: rankFor(total),
    evidenceFound,
    evidenceTotal,
    contradictions,
    abilities,
    suspectReplies,
    seconds,
    accused,
    accusedName: suspects.find((s) => s.id === accused)?.name ?? "—",
    correct,
    breakdown: [
      {
        label: "الأدلة المكتشفة",
        points: evidencePoints,
        max: 25,
        detail: `${evidenceFound}/${evidenceTotal} دليل`,
      },
      {
        label: "معلومات الاستجواب",
        points: replyPoints,
        max: 15,
        detail: `${suspectReplies} رد من المشتبه فيهم`,
      },
      {
        label: "التناقضات المرصودة",
        points: contradictionPoints,
        max: 20,
        detail: `${contradictions} تناقض`,
      },
      {
        label: "استخدام قدرات الأدوار",
        points: abilityPoints,
        max: 10,
        detail: `${abilities} قدرة · ${deductions} ربط أدلة`,
      },
      {
        label: "دقة الاتهام النهائي",
        points: accusationPoints,
        max: 25,
        detail: correct ? "اتهام صحيح" : "اتهام خاطئ",
      },
      {
        label: "كفاءة الوقت",
        points: timePoints,
        max: 5,
        detail: `${Math.floor(seconds / 60)} دقيقة`,
      },
    ],
  };
}

export function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} ساعة و${m} دقيقة`;
  return `${m} دقيقة`;
}
