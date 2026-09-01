/**
 * قضية «الطابق ١٣» — نسخة تطويرية معزولة لمسرح جريمة قابل للمشي (3D).
 *
 * كل شي هني بيانات مستقلة: ما يمس القضايا الحالية ولا الأدلة النهائية.
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

/**
 * أبعاد المكان (متر). المصعد عند z ≈ 0، والممر يمتد ناحية -z،
 * وباب غرفة ١٣٠٦ على الطوفة اليمنى عند z ≈ -14.5.
 * الغرفة جناح بمقاس واقعي: ٦م × ٦.٥م.
 */
export const FLOOR13_LAYOUT = {
  corridor: { x0: -1.4, x1: 1.4, z0: -19.5, z1: 0.5 },
  door: { x0: 1.4, x1: 1.6, z0: -15.2, z1: -13.8 },
  room: { x0: 1.6, x1: 7.6, z0: -19.5, z1: -13.0 },
  wallHeight: 3.0,
  eyeHeight: 1.62,
} as const;

/**
 * المناطق اللي يسمح للاعب يتحرك داخلها (اتحاد مستطيلات) — مرسومة حتى تعطي
 * مسارات مشي واقعية بدون اختراق الأثاث (سرير/كومدينات/مكتب/دولاب).
 */
export const FLOOR13_WALKABLE: Floor13Rect[] = [
  // الممر
  { x0: -1.05, x1: 1.05, z0: -19.15, z1: 0.15 },
  // فتحة الباب
  { x0: 1.0, x1: 2.05, z0: -15.1, z1: -13.9 },
  // منتصف الغرفة (الممشى الرئيسي)
  { x0: 1.95, x1: 5.35, z0: -18.7, z1: -13.35 },
  // ناحية النافذة/المكتب
  { x0: 3.9, x1: 5.35, z0: -19.15, z1: -18.7 },
  // الجهة اليمنى: جنب السرير والكومدينة
  { x0: 5.35, x1: 7.2, z0: -16.5, z1: -13.35 },
];

export const FLOOR13_SPAWN: [number, number, number] = [3.6, FLOOR13_LAYOUT.eyeHeight, -16.2];
/** يبدأ اللاعب ناظر ناحية عمق الممر (-z). */
export const FLOOR13_SPAWN_YAW = -Math.PI / 2;

/**
 * ٦ أدلة مستقلة تمامًا — كل واحد له معرّف فريد وموقع منفصل بمسافة كافية
 * حتى لا يتنافس دليلان على نفس نقطة الفحص. كل دليل غرض طبيعي في المكان.
 */
export const FLOOR13_EVIDENCE: Floor13EvidencePoint[] = [
  {
    id: "f13-elevator-keycard",
    title: "بطاقة مفتاح مرمية",
    description: "بطاقة غرفة بلاستيكية على السجادة قرب المصعد، رقمها ممسوح بخدش عمودي.",
    position: [-0.72, 0.02, -1.5],
    radius: 1.7,
  },
  {
    id: "f13-corridor-suitcase",
    title: "حقيبة سفر متروكة",
    description: "حقيبة جلدية قديمة متروكة عند طوفة الممر، أقفالها مفتوحة.",
    position: [0.92, 0.2, -7.2],
    radius: 1.7,
  },
  {
    id: "f13-corridor-phone",
    title: "هاتف مطفي",
    description: "جهاز مطفي متروك جنب الطوفة قبل باب ١٣٠٦، شاشته مشقوقة.",
    position: [-0.95, 0.05, -12.9],
    radius: 1.7,
  },
  {
    id: "f13-door-lock-scratch",
    title: "خدوش على قفل الباب",
    description: "خدوش معدنية حديثة حول قفل غرفة ١٣٠٦ — الباب فُتح بالقوة.",
    position: [1.52, 1.05, -14.5],
    radius: 1.5,
  },
  {
    id: "f13-desk-note",
    title: "ورقة على المكتب",
    description: "ورقة عند النافذة مكتوب فيها سطر واحد بخط مستعجل: «لا تفتح».",
    position: [3.05, 0.79, -19.0],
    radius: 1.6,
  },
  {
    id: "f13-nightstand-earring",
    title: "حلق ذهبي صغير",
    description: "حلق مفرد على الكومدينة جانب السرير، قفله مكسور.",
    position: [7.05, 0.73, -16.35],
    radius: 1.5,
  },
];

export const FLOOR13_EVIDENCE_TOTAL = FLOOR13_EVIDENCE.length;

export function isInsideWalkable(x: number, z: number): boolean {
  return FLOOR13_WALKABLE.some((r) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1);
}
