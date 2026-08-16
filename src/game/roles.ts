/**
 * أدوار اللاعبين — توزيع عشوائي قبل بداية القضية.
 * الأدوار تخصصات فقط: ما تغيّر أي منطق للأدلة أو الاستجواب أو المؤقت.
 */

export interface PlayerRole {
  id: string;
  emoji: string;
  title: string;
  mission: string;
  /** الأدوار القابلة للتكرار لو عدد اللاعبين أكثر من الأدوار الأساسية. */
  repeatable: boolean;
}

/** مرتبة حسب الأهمية — أول دور يتوزع أولاً لو الفريق أقل من أربعة. */
export const playerRoles: PlayerRole[] = [
  {
    id: "detective",
    emoji: "🔍",
    title: "المحقق",
    mission: "ركّز على القضية كلها، اربط الأدلة بأقوال المشتبه فيهم ولاحظ التناقضات.",
    repeatable: false,
  },
  {
    id: "interrogator",
    emoji: "🗣️",
    title: "محقق الاستجواب",
    mission: "استجوب المشتبه فيهم، لاحظ تغير إجاباتهم والتناقضات ومؤشر التوتر.",
    repeatable: true,
  },
  {
    id: "forensics",
    emoji: "🧪",
    title: "الخبير الجنائي",
    mission: "حلّل الأدلة المادية بمسرح الجريمة: الساعة، الكعب، القهوة، الشاحن، والمفتاح.",
    repeatable: true,
  },
  {
    id: "surveillance",
    emoji: "📹",
    title: "مسؤول المراقبة",
    mission: "راقب الكاميرات والأوقات وتحركات الأشخاص قبل الجريمة وبعدها.",
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
 * توزيع عشوائي: اللاعبين يتخبطون، والأدوار تتوزع بالترتيب المهم أولاً.
 * لو عدد اللاعبين أكثر من الأدوار، تتكرر الأدوار القابلة للتكرار.
 */
export function assignRoles(playerIds: string[]): Record<string, string> {
  const players = shuffle(playerIds);
  const repeatable = playerRoles.filter((r) => r.repeatable);
  const roles: Record<string, string> = {};

  players.forEach((id, i) => {
    if (i < playerRoles.length) {
      roles[id] = playerRoles[i]!.id;
    } else {
      const pool = shuffle(repeatable);
      roles[id] = pool[(i - playerRoles.length) % pool.length]!.id;
    }
  });

  return roles;
}
