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
  titleEn: string;
  mission: string;
  missionEn: string;
  /** القدرة الخاصة بصيغة مفهومة للاعب. */
  ability: string;
  abilityEn: string;
  capability: LastTripCapability;
}

/** المحقق أول دائماً — يتوزع أول لو الفريق أقل من ٦ لاعبين. */
export const lastTripRoles: LastTripRole[] = [
  {
    id: "lt-detective",
    title: "المحقق",
    titleEn: "Detective",
    mission: "يقود الاستجواب ويسأل المشتبه فيهم بنفسه، وباقي الفريق يشوف السؤال والرد والتوتر.",
    missionEn:
      "Leads the interrogation and questions suspects directly, while the rest of the team watches the question, reply, and stress live.",
    ability: "الوحيد اللي يرسل أسئلة الاستجواب والمواجهات للمشتبه فيهم.",
    abilityEn: "The only one who can send interrogation questions and confrontations to suspects.",
    capability: "interrogate",
  },
  {
    id: "lt-forensics",
    title: "الجنائي",
    titleEn: "Forensics Expert",
    mission: "يفحص الأدلة المادية بمسرح الجريمة ويطلع التفاصيل الجنائية الإضافية.",
    missionEn: "Examines physical evidence at the crime scene and uncovers extra forensic detail.",
    ability: "فحص جنائي تفصيلي للأدلة المادية (الحنفية، الكلينكس، كوب القهوة).",
    abilityEn: "Detailed forensic analysis of physical evidence (the faucet, the tissue, the coffee cup).",
    capability: "forensics",
  },
  {
    id: "lt-surveillance",
    title: "خبير المراقبة",
    titleEn: "Surveillance Expert",
    mission: "يفحص تسجيلات الكاميرات ويطلع اللي مسجل فيها.",
    missionEn: "Reviews camera footage and pulls out what's recorded in it.",
    ability: "مراجعة مقاطع الكاميرات (كاميرا الممر وكاميرا مدخل الكوفي).",
    abilityEn: "Reviews camera footage (the corridor camera and the coffee shop entrance camera).",
    capability: "surveillance",
  },
  {
    id: "lt-comms",
    title: "خبير الاتصالات",
    titleEn: "Comms Expert",
    mission: "يفحص سجل المكالمات والتوقيتات ويطلع أي انقطاع أو تعارض بالوقت.",
    missionEn: "Examines the call log and timing for any gap or time conflict.",
    ability: "فتح وتحليل سجل مكالمات عبدالله وتوقيتاته.",
    abilityEn: "Opens and analyzes Abdullah's call log and its timing.",
    capability: "comms",
  },
  {
    id: "lt-traces",
    title: "خبير الآثار",
    titleEn: "Trace Expert",
    mission: "يحلل أثر الحذاء والآثار المادية واتجاه الحركة.",
    missionEn: "Analyzes the shoe print and physical traces along with the direction of movement.",
    ability: "تحليل أثر الحذاء الرطب والآثار المادية.",
    abilityEn: "Analyzes the wet shoe print and physical traces.",
    capability: "traces",
  },
  {
    id: "lt-analyst",
    title: "المحلل",
    titleEn: "Analyst",
    mission: "يجمع التناقضات المكتشفة ويربط أقوال المشتبه فيهم بالأدلة.",
    missionEn: "Collects discovered contradictions and links suspects' statements to the evidence.",
    ability: "لوحة التناقضات وربط الأقوال بالأدلة المكتشفة.",
    abilityEn: "The contradictions board, linking statements to discovered evidence.",
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
export const LAST_TRIP_DENIED_MESSAGE_EN = "This is another teammate's specialty.";

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

/** الحد الأقصى للاعبين الفعليين داخل غرفة «آخر رحلة» = عدد الأدوار. */
export const MAX_LAST_TRIP_PLAYERS = lastTripRoles.length;

/**
 * قرعة الأدوار: عشوائية، بدون تكرار أبداً، والمحقق موجود دائماً.
 * الأدوار المحفوظة مسبقاً تبقى ثابتة (الـrefresh ما يعيد القرعة).
 * لو انتهت الأدوار الستة، اللاعب الزائد يبقى بدون دور — الغرفة مكتملة.
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

  pending.forEach((id) => {
    const next = pool.shift();
    if (!next) return; // ما فيه دور شاغر — ممنوع تكرار دور لاعب ثاني.
    roles[id] = next.id;
    taken.add(next.id);
  });

  return roles;
}
