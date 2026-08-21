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
    mission: "ركّز على القضية كلها، اربط الأدلة بأقوال المشتبه فيهم ولاحظ التناقضات.",
    repeatable: false,
  },
  {
    id: "interrogator",
    icon: "mic",
    emoji: "🗣️",
    title: "محقق الاستجواب",
    mission: "استجوب المشتبه فيهم، لاحظ تغير إجاباتهم والتناقضات ومؤشر التوتر.",
    repeatable: true,
  },
  {
    id: "forensics",
    icon: "flask",
    emoji: "🧪",
    title: "الخبير الجنائي",
    mission:
      "فتّش مسرح الجريمة بعناية، واكتشف الأدلة المخفية وحلّلها. انتبه للتفاصيل، فقد تكون بعض الأشياء أهم مما تبدو.",
    repeatable: true,
  },
  {
    id: "surveillance",
    icon: "camera",
    emoji: "📹",
    title: "مسؤول المراقبة",
    mission: "راقب الكاميرات والأوقات وتحركات الأشخاص قبل الجريمة وبعدها.",
    repeatable: true,
  },
  {
    id: "timeline",
    icon: "clock",
    emoji: "⏱️",
    title: "محلل الجدول الزمني",
    mission: "رتّب أوقات الليلة الأخيرة وتأكد منو كان وين وبأي وقت.",
    repeatable: true,
  },
  {
    id: "records",
    icon: "file",
    emoji: "🗂️",
    title: "مسؤول الملف",
    mission: "دوّن الأقوال والتناقضات بملف القضية وخلي الفريق على نفس المعلومة.",
    repeatable: true,
  },
];

export const roleById = (id?: string | null) =>
  playerRoles.find((r) => r.id === id) ?? undefined;

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

/**
 * توزيع عشوائي بدون تكرار: كل لاعب يأخذ دور واحد مختلف (ستة أدوار = ستة لاعبين).
 * الأدوار الموجودة أصلاً ما تتغير — تنحفظ مثل ما هي (Refresh / رجوع للغرفة).
 * لو عدد اللاعبين أكبر من عدد الأدوار، الأدوار القابلة للتكرار بس تتكرر.
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
  const repeatable = shuffle(playerRoles.filter((r) => r.repeatable));
  // عدّاد الاستخدام: لو اللاعبين أكثر من الأدوار، نكرر الأقل استخداماً فقط.
  const counts = new Map<string, number>();
  playerRoles.forEach((r) => counts.set(r.id, 0));
  Object.values(roles).forEach((r) => counts.set(r, (counts.get(r) ?? 0) + 1));

  pending.forEach((id) => {
    const next = free.find((r) => !taken.has(r.id));
    if (next) {
      roles[id] = next.id;
      taken.add(next.id);
      counts.set(next.id, (counts.get(next.id) ?? 0) + 1);
      return;
    }
    const pick = repeatable.reduce((best, r) =>
      (counts.get(r.id) ?? 0) < (counts.get(best.id) ?? 0) ? r : best,
    );
    roles[id] = pick.id;
    counts.set(pick.id, (counts.get(pick.id) ?? 0) + 1);
  });

  return roles;
}

