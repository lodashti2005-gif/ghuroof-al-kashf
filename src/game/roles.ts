/**
 * أدوار اللاعبين — توزيع عشوائي قبل بداية القضية.
 * الأدوار تخصصات فقط: ما تغيّر أي منطق للأدلة أو الاستجواب أو المؤقت.
 */

export type RoleIcon = "search" | "flask" | "camera" | "mic" | "clock" | "file";

export interface PlayerRole {
  id: string;
  emoji: string;
  icon: RoleIcon;
  title: string;
  mission: string;
  /** النص الإنجليزي — يُستخدم عند اختيار English. */
  titleEn: string;
  missionEn: string;
  /** الأدوار القابلة للتكرار لو عدد اللاعبين أكثر من الأدوار الأساسية. */
  repeatable: boolean;
}

/** مرتبة حسب الأهمية — أول دور يتوزع أولاً لو الفريق أقل من أربعة. */
export const playerRoles: PlayerRole[] = [
  {
    id: "detective",
    icon: "search",
    emoji: "🔍",
    title: "المحقق",
    titleEn: "Lead Detective",
    mission: "ركّز على القضية كلها، اربط الأدلة بأقوال المشتبه فيهم ولاحظ التناقضات.",
    missionEn:
      "Keep the whole case in view: tie the evidence to what the suspects say and catch the contradictions.",
    repeatable: false,
  },
  {
    id: "interrogator",
    icon: "mic",
    emoji: "🗣️",
    title: "محقق الاستجواب",
    titleEn: "Interrogator",
    mission: "استجوب المشتبه فيهم، لاحظ تغير إجاباتهم والتناقضات ومؤشر التوتر.",
    missionEn:
      "Question the suspects, watch their answers shift, and keep an eye on the stress meter.",
    repeatable: true,
  },
  {
    id: "forensics",
    icon: "flask",
    emoji: "🧪",
    title: "الخبير الجنائي",
    titleEn: "Forensics Expert",
    mission:
      "فتّش مسرح الجريمة بعناية، واكتشف الأدلة المخفية وحلّلها. انتبه للتفاصيل، فقد تكون بعض الأشياء أهم مما تبدو.",
    missionEn:
      "Search the crime scene carefully, find the hidden evidence and read it. Watch the small details — some things matter more than they look.",
    repeatable: true,
  },
  {
    id: "surveillance",
    icon: "camera",
    emoji: "📹",
    title: "مسؤول المراقبة",
    titleEn: "Surveillance Officer",
    mission: "راقب الكاميرات والأوقات وتحركات الأشخاص قبل الجريمة وبعدها.",
    missionEn:
      "Track the cameras, the timings and everyone's movements before and after the crime.",
    repeatable: true,
  },
  {
    id: "timeline",
    icon: "clock",
    emoji: "⏱️",
    title: "محلل الجدول الزمني",
    titleEn: "Timeline Analyst",
    mission: "رتّب أوقات الليلة الأخيرة وتأكد منو كان وين وبأي وقت.",
    missionEn: "Lay out the last night hour by hour and pin down who was where, and when.",
    repeatable: true,
  },
  {
    id: "records",
    icon: "file",
    emoji: "🗂️",
    title: "مسؤول الملف",
    titleEn: "Records Officer",
    mission: "دوّن الأقوال والتناقضات بملف القضية وخلي الفريق على نفس المعلومة.",
    missionEn:
      "Log statements and contradictions in the case file and keep the team on the same page.",
    repeatable: true,
  },
];

export const roleById = (id?: string | null) => playerRoles.find((r) => r.id === id) ?? undefined;

function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

/** الحد الأقصى للاعبين الفعليين داخل الغرفة = عدد الأدوار المختلفة. */
export const MAX_ROOM_PLAYERS = playerRoles.length;

/**
 * توزيع عشوائي بدون أي تكرار: كل لاعب يأخذ دور واحد مختلف (ستة أدوار = ستة لاعبين).
 * الأدوار الموجودة أصلاً ما تتغير — تنحفظ مثل ما هي (Refresh / رجوع للغرفة).
 * لو انتهت الأدوار الستة ما نعيد تدويرها — اللاعب الزائد يبقى بدون دور والغرفة مكتملة.
 */
export function assignRoles(
  playerIds: string[],
  existing: Record<string, string> = {},
): Record<string, string> {
  const roles: Record<string, string> = {};
  // احتفظ بأدوار اللاعبين الحاليين (بدون تكرار).
  const taken = new Set<string>();
  playerIds.forEach((id) => {
    const prev = existing[id];
    if (prev && roleById(prev) && !taken.has(prev)) {
      roles[id] = prev;
      taken.add(prev);
    }
  });

  const pending = shuffle(playerIds.filter((id) => !roles[id]));
  const free = shuffle(playerRoles.filter((r) => !taken.has(r.id)));

  pending.forEach((id) => {
    const next = free.shift();
    if (!next) return; // ما فيه دور شاغر — ممنوع تكرار دور موجود.
    roles[id] = next.id;
    taken.add(next.id);
  });

  return roles;
}
