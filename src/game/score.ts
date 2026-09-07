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
  rankEn: string;
  breakdown: Array<{
    label: string;
    labelEn: string;
    points: number;
    max: number;
    detail: string;
    detailEn: string;
  }>;
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

function rankForEn(total: number) {
  if (total >= 90) return "Professional detectives";
  if (total >= 75) return "A sharp investigation team";
  if (total >= 50) return "You were close";
  return "The case beat you";
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
    rankEn: rankForEn(total),
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
        labelEn: "Evidence found",
        points: evidencePoints,
        max: 25,
        detail: `${evidenceFound}/${evidenceTotal} دليل`,
        detailEn: `${evidenceFound}/${evidenceTotal} clues`,
      },
      {
        label: "معلومات الاستجواب",
        labelEn: "Interrogation intel",
        points: replyPoints,
        max: 15,
        detail: `${suspectReplies} رد من المشتبه فيهم`,
        detailEn: `${suspectReplies} suspect answers`,
      },
      {
        label: "التناقضات المرصودة",
        labelEn: "Contradictions caught",
        points: contradictionPoints,
        max: 20,
        detail: `${contradictions} تناقض`,
        detailEn: `${contradictions} contradictions`,
      },
      {
        label: "استخدام قدرات الأدوار",
        labelEn: "Use of role abilities",
        points: abilityPoints,
        max: 10,
        detail: `${abilities} قدرة · ${deductions} ربط أدلة`,
        detailEn: `${abilities} abilities · ${deductions} evidence links`,
      },
      {
        label: "دقة الاتهام النهائي",
        labelEn: "Final accusation accuracy",
        points: accusationPoints,
        max: 25,
        detail: correct ? "اتهام صحيح" : "اتهام خاطئ",
        detailEn: correct ? "Correct accusation" : "Wrong accusation",
      },
      {
        label: "كفاءة الوقت",
        labelEn: "Time efficiency",
        points: timePoints,
        max: 5,
        detail: `${Math.floor(seconds / 60)} دقيقة`,
        detailEn: `${Math.floor(seconds / 60)} minutes`,
      },
    ],
  };
}

export function formatDuration(seconds: number, lang: "ar" | "en" = "ar") {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (lang === "en") return h > 0 ? `${h}h ${m}m` : `${m} min`;
  if (h > 0) return `${h} ساعة و${m} دقيقة`;
  return `${m} دقيقة`;
}
