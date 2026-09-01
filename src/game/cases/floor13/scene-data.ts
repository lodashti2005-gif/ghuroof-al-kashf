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

export const FLOOR13_SPAWN: [number, number, number] = [3.2, FLOOR13_LAYOUT.eyeHeight, -20.5];
/** يبدأ اللاعب ناظر ناحية عمق الممر (-z). */
export const FLOOR13_SPAWN_YAW = -1.2;

export const FLOOR13_EVIDENCE: Floor13EvidencePoint[] = [
  {
    id: "f13-elevator-card",
    title: "بطاقة مفتاح مرمية",
    description: "بطاقة غرفة بلاستيك قرب المصعد، مكتوب عليها رقم ممسوح. (وصف مؤقت)",
    position: [-0.85, 0.06, -1.6],
  },
  {
    id: "f13-corridor-stain",
    title: "أثر رطب على السجادة",
    description: "بقعة رطبة طازجة بمنتصف الممر… أحد مرّ من هنا مستعجل. (وصف مؤقت)",
    position: [0.6, 0.04, -10.2],
  },
  {
    id: "f13-hall-phone",
    title: "هاتف مطفي",
    description: "جهاز مطفي متروك جنب الطوفة قبل باب ١٣٠٦. (وصف مؤقت)",
    position: [-1.15, 0.1, -16.4],
  },
  {
    id: "f13-door-scratch",
    title: "خدوش على قفل الباب",
    description: "خدوش معدن حديثة حول قفل غرفة ١٣٠٦. (وصف مؤقت)",
    position: [1.5, 1.05, -18.0],
  },
  {
    id: "f13-desk-note",
    title: "ورقة على المكتب",
    description: "ورقة مكتوب فيها سطر واحد بخط مستعجل. (وصف مؤقت)",
    position: [6.6, 0.79, -22.1],
  },
  {
    id: "f13-chair-cloth",
    title: "قماش ممزّق",
    description: "قطعة قماش صغيرة معلقة بحرف الكرسي. (وصف مؤقت)",
    position: [6.4, 0.55, -20.6],
  },
];

export const FLOOR13_EVIDENCE_TOTAL = FLOOR13_EVIDENCE.length;

export function isInsideWalkable(x: number, z: number): boolean {
  return FLOOR13_WALKABLE.some((r) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1);
}
