/**
 * قضية «الطابق 13» — نسخة أولية معزولة لمسرح جريمة قابل للمشي (3D).
 *
 * كل شي هني بيانات مستقلة: ما يمس القضايا الحالية ولا الأدلة النهائية.
 * لاحقاً نربط هذي النقاط بنظام الأدلة/الاستجواب والغرف الجماعية.
 */

export interface Floor13Rect {
  /** أصغر x */
  x0: number;
  /** أكبر x */
  x1: number;
  /** أصغر z */
  z0: number;
  /** أكبر z */
  z1: number;
}

export interface Floor13EvidencePoint {
  id: string;
  title: string;
  description: string;
  /** موقع الدليل بالعالم [x, y, z] */
  position: [number, number, number];
  /** مسافة التفاعل بالمتر */
  radius?: number;
}

/** أبعاد المكان (متر). المصعد عند z ≈ 0، والممر يمتد ناحية -z. */
export const FLOOR13_LAYOUT = {
  corridor: { x0: -1.5, x1: 1.5, z0: -24.5, z1: 0.5 },
  door: { x0: 1.5, x1: 1.7, z0: -19.2, z1: -16.8 },
  room: { x0: 1.7, x1: 9.5, z0: -24.5, z1: -13.5 },
  wallHeight: 3.1,
  eyeHeight: 1.62,
} as const;

/** المناطق اللي يسمح للاعب يتحرك داخلها (اتحاد مستطيلات). */
export const FLOOR13_WALKABLE: Floor13Rect[] = [
  { x0: -1.15, x1: 1.15, z0: -24.15, z1: 0.15 },
  { x0: 1.0, x1: 2.1, z0: -18.95, z1: -17.05 },
  { x0: 1.95, x1: 9.15, z0: -24.15, z1: -13.85 },
];

export const FLOOR13_SPAWN: [number, number, number] = [0, FLOOR13_LAYOUT.eyeHeight, -0.4];
/** يبدأ اللاعب ناظر ناحية عمق الممر (-z). */
export const FLOOR13_SPAWN_YAW = 0;

/**
 * ٦ أدلة مستقلة تمامًا — كل واحد له معرّف فريد وموقع منفصل (بينها مسافة كافية
 * حتى لا يتنافس دليلان على نفس نقطة الفحص).
 */
export const FLOOR13_EVIDENCE: Floor13EvidencePoint[] = [
  {
    id: "f13-elevator-keycard",
    title: "بطاقة مفتاح مرمية",
    description: "بطاقة غرفة بلاستيكية عند المصعد، رقمها ممسوح بخدش عمودي.",
    position: [-0.85, 0.06, -1.6],
    radius: 1.7,
  },
  {
    id: "f13-corridor-stain",
    title: "أثر رطب على السجادة",
    description: "بقعة رطبة طازجة بمنتصف الممر، تمتد ناحية نهاية الطابق.",
    position: [0.55, 0.04, -10.2],
    radius: 1.7,
  },
  {
    id: "f13-corridor-phone",
    title: "هاتف مطفي",
    description: "جهاز مطفي متروك جنب الطوفة قبل باب ١٣٠٦، شاشته مشقوقة.",
    position: [-1.02, 0.12, -15.4],
    radius: 1.6,
  },
  {
    id: "f13-door-lock-scratch",
    title: "خدوش على قفل الباب",
    description: "خدوش معدنية حديثة حول قفل غرفة ١٣٠٦ — الباب فُتح بالقوة.",
    position: [1.62, 1.05, -18.0],
    radius: 1.3,
  },
  {
    id: "f13-desk-note",
    title: "ورقة على المكتب",
    description: "ورقة عند النافذة مكتوب فيها سطر واحد بخط مستعجل: «لا تفتح».",
    position: [6.8, 0.8, -23.75],
    radius: 1.4,
  },
  {
    id: "f13-nightstand-earring",
    title: "حلق ذهبي صغير",
    description: "حلق مفرد على الكومدينة جانب السرير، قفله مكسور.",
    position: [8.5, 0.74, -18.1],
    radius: 1.4,
  },
];


export const FLOOR13_EVIDENCE_TOTAL = FLOOR13_EVIDENCE.length;

export function isInsideWalkable(x: number, z: number): boolean {
  return FLOOR13_WALKABLE.some((r) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1);
}
