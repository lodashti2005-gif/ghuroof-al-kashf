/**
 * أدوار الفريق لقضية «آخر رحلة» فقط — مستقلة تماماً عن أدوار قضية الشاليه.
 *
 * كل دور له قدرة تعمل فعلياً: المحقق هو الوحيد اللي يرسل أسئلة الاستجواب،
 * وكل خبير هو الوحيد اللي يفتح الفحص التفصيلي لأدلة اختصاصه، والمحلل هو
 * الوحيد اللي يشوف لوحة التناقضات وربط الأقوال بالأدلة.
 */

export type LastTripCapability =
  | "interrogate"
  | "forensics"
  | "surveillance"
  | "comms"
  | "traces"
  | "analysis";

export interface LastTripRole {
  id: string;
  title: string;
  mission: string;
  /** القدرة الخاصة بصيغة مفهومة للاعب. */
  ability: string;
  capability: LastTripCapability;
}

/** المحقق أول دائماً — يتوزع أول لو الفريق أقل من ٦ لاعبين. */
export const lastTripRoles: LastTripRole[] = [
  {
    id: "lt-detective",
    title: "المحقق",
    mission: "يقود الاستجواب ويسأل المشتبه فيهم بنفسه، وباقي الفريق يشوف السؤال والرد والتوتر.",
    ability: "الوحيد اللي يرسل أسئلة الاستجواب والمواجهات للمشتبه فيهم.",
    capability: "interrogate",
  },
  {
    id: "lt-forensics",
    title: "الجنائي",
    mission: "يفحص الأدلة المادية بمسرح الجريمة ويطلع التفاصيل الجنائية الإضافية.",
    ability: "فحص جنائي تفصيلي للأدلة المادية (الحنفية، الكلينكس، كوب القهوة).",
    capability: "forensics",
  },
  {
    id: "lt-surveillance",
    title: "خبير المراقبة",
    mission: "يفحص تسجيلات الكاميرات ويطلع اللي مسجل فيها.",
    ability: "مراجعة مقاطع الكاميرات (كاميرا الممر وكاميرا مدخل الكوفي).",
    capability: "surveillance",
  },
  {
    id: "lt-comms",
    title: "خبير الاتصالات",
    mission: "يفحص سجل المكالمات والتوقيتات ويطلع أي انقطاع أو تعارض بالوقت.",
    ability: "فتح وتحليل سجل مكالمات عبدالله وتوقيتاته.",
    capability: "comms",
  },
  {
    id: "lt-traces",
    title: "خبير الآثار",
    mission: "يحلل أثر الحذاء والآثار المادية واتجاه الحركة.",
    ability: "تحليل أثر الحذاء الرطب والآثار المادية.",
    capability: "traces",
  },
  {
    id: "lt-analyst",
    title: "المحلل",
    mission: "يجمع التناقضات المكتشفة ويربط أقوال المشتبه فيهم بالأدلة.",
    ability: "لوحة التناقضات وربط الأقوال بالأدلة المكتشفة.",
    capability: "analysis",
  },
];

export const getLastTripRole = (id?: string | null) =>
  lastTripRoles.find((r) => r.id === id) ?? undefined;

/** أي دليل تحت اختصاص أي دور — الفحص التفصيلي محصور بصاحب الاختصاص. */
export const lastTripEvidenceSpecialty: Record<string, LastTripCapability> = {
  "lt-faucet": "forensics",
  "lt-tissue": "forensics",
  "lt-coffee-cup": "forensics",
  "lt-corridor-cam": "surveillance",
  "lt-coffee-cam": "surveillance",
  "lt-call-log": "comms",
  "lt-shoe-print": "traces",
};

export const LAST_TRIP_DENIED_MESSAGE = "هالمعلومة من اختصاص لاعب ثاني بالفريق.";

/**
 * صلاحية لاعب: بدون غرفة (تجربة فردية) كل القدرات مفتوحة مثل ما كانت.
 * داخل غرفة، القدرة محصورة بدور اللاعب.
 */
export function lastTripCan(
  roleId: string | null | undefined,
  capability: LastTripCapability,
  inRoom: boolean,
): boolean {
  if (!inRoom) return true;
  const role = getLastTripRole(roleId);
  if (!role) return false;
  return role.capability === capability;
}

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
 * قرعة الأدوار: عشوائية، بدون تكرار، والمحقق موجود دائماً.
 * الأدوار المحفوظة مسبقاً تبقى ثابتة (الـrefresh ما يعيد القرعة).
 */
export function assignLastTripRoles(
  playerIds: string[],
  existing: Record<string, string> = {},
): Record<string, string> {
  const roles: Record<string, string> = {};
  const taken = new Set<string>();

  playerIds.forEach((id) => {
    const prev = existing[id];
    if (prev && getLastTripRole(prev) && !taken.has(prev)) {
      roles[id] = prev;
      taken.add(prev);
    }
  });

  const pending = shuffle(playerIds.filter((id) => !roles[id]));
  const detective = lastTripRoles[0]!;
  // المحقق أولاً لو ما أحد ماخذه.
  const pool = taken.has(detective.id)
    ? shuffle(lastTripRoles.filter((r) => !taken.has(r.id)))
    : [detective, ...shuffle(lastTripRoles.filter((r) => r.id !== detective.id && !taken.has(r.id)))];

  pending.forEach((id, index) => {
    const next = pool.shift();
    if (next) {
      roles[id] = next.id;
      taken.add(next.id);
      return;
    }
    // أكثر من ٦ لاعبين: نكرر بالترتيب حتى ما يبقى لاعب بدون دور.
    roles[id] = lastTripRoles[(index + 1) % lastTripRoles.length]!.id;
  });

  return roles;
}
