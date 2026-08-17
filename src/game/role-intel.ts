/**
 * معلومات خاصة بكل دور — مبنية على نفس القضية والأدلة الحالية بدون أي تغيير
 * بالقصة. كل مجموعة تظهر لدورها فقط، وتتفتح حسب الأدلة المكتشفة.
 */
import { evidence, suspects } from "./case-data";

/** ملاحظات جنائية تفصيلية لكل دليل — تظهر للخبير الجنائي فقط. */
export const forensicNotes: Record<string, string> = Object.fromEntries(
  evidence.map((e) => [e.id, e.detail]),
);

export interface CameraEntry {
  time: string;
  text: string;
  /** ينفتح بعد اكتشاف هذا الدليل. */
  requires?: string;
}

/** سجل كاميرا المدخل والتحركات — لمسؤول المراقبة فقط. */
export const cameraLog: CameraEntry[] = [
  { time: "10:30 م", text: "كاميرا المدخل تسجل وصول آخر سيارة للقعدة." },
  { time: "11:55 م", text: "سيارة تطلع من مدخل الشاليه (اللقطة واضحة للسيارة، مو للشخص)." },
  { time: "01:15 ص", text: "سيارة ثانية تطلع من المدخل." },
  {
    time: "01:38 ص",
    text: "نفس سيارة خروج 11:55 ترجع تدخل من المدخل.",
    requires: "camera",
  },
  { time: "01:47 ص", text: "ما في تسجيل لهذي اللحظة — الزاوية الجديدة تخفي جزء من المدخل.", requires: "camera" },
  { time: "02:04 ص", text: "نفس السيارة تطلع مرة ثانية بعد وقت الوفاة.", requires: "camera" },
  { time: "—", text: "زاوية الكاميرا متغيّرة عن مكانها الأصلي، والتغيير صاير نفس الليلة.", requires: "camera" },
];

export interface TimelineRow {
  time: string;
  text: string;
  kind: "claim" | "record";
  /** تعارض زمني مرصود. */
  conflict?: boolean;
  requires?: string;
}

/** الجدول الزمني: أقوال + تسجيلات، مع إشارة للتعارضات — لمحلل الجدول الزمني. */
export const timelineRows: TimelineRow[] = [
  { time: "10:30 م", text: "بداية القعدة بالشاليه.", kind: "record" },
  { time: "11:48 م", text: "رسالة تهديد توصل لتلفون بدر.", kind: "record", requires: "message" },
  { time: "11:55 م", text: "يوسف يقول إنه طلع قبل منتصف الليل وما رجع.", kind: "claim" },
  { time: "01:00 ص", text: "فهد يقول إنه نام بالصالة من هذا الوقت.", kind: "claim" },
  { time: "01:15 ص", text: "نورة تقول إنها طلعت من الشاليه.", kind: "claim" },
  { time: "01:29 ص", text: "آخر نشاط لتلفون بدر: فتح ملف تحويلات بنكية.", kind: "record", requires: "phone" },
  {
    time: "01:30 ص",
    text: "الأقوال تجمع إن الشاليه صار فاضي — يتعارض مع تسجيلات ما بعد هذا الوقت.",
    kind: "claim",
    conflict: true,
  },
  {
    time: "01:38 ص",
    text: "كاميرا المدخل تسجل دخول سيارة — بعد وقت «خلاص الجميع طلعوا».",
    kind: "record",
    conflict: true,
    requires: "camera",
  },
  {
    time: "01:47 ص",
    text: "ساعة بدر واقفة على هذا الوقت بضربة — داخل نطاق وقت الوفاة.",
    kind: "record",
    conflict: true,
    requires: "watch",
  },
  { time: "01:48 ص", text: "دانة تقول إنها سمعت باب ينسد وخطوات بالممر.", kind: "claim" },
  { time: "02:04 ص", text: "الكاميرا تسجل خروج نفس السيارة بعد وقت الوفاة.", kind: "record", conflict: true, requires: "camera" },
];

/** سجل أقوال المشتبه فيهم — لمسؤول الملف. */
export const statementLog = suspects.map((s) => ({
  id: s.id,
  name: s.name,
  role: s.role,
  statements: s.known,
}));
