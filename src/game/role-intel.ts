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
  timeEn?: string;
  text: string;
  textEn?: string;
  /** ينفتح بعد اكتشاف هذا الدليل. */
  requires?: string;
}

/** سجل كاميرا المدخل والتحركات — لمسؤول المراقبة فقط. */
export const cameraLog: CameraEntry[] = [
  {
    time: "10:30 م",
    timeEn: "10:30 PM",
    text: "كاميرا المدخل تسجل وصول آخر سيارة للقعدة.",
    textEn: "The entrance camera records the last car arriving for the gathering.",
  },
  {
    time: "11:55 م",
    timeEn: "11:55 PM",
    text: "سيارة تطلع من مدخل الشاليه (اللقطة واضحة للسيارة، مو للشخص).",
    textEn: "A car leaves the chalet entrance (the shot is clear on the car, not the driver).",
  },
  {
    time: "01:15 ص",
    timeEn: "1:15 AM",
    text: "سيارة ثانية تطلع من المدخل.",
    textEn: "A second car leaves through the entrance.",
  },
  {
    time: "01:38 ص",
    timeEn: "1:38 AM",
    text: "نفس سيارة خروج 11:55 ترجع تدخل من المدخل.",
    textEn: "The same car that left at 11:55 comes back in through the entrance.",
    requires: "camera",
  },
  {
    time: "01:47 ص",
    timeEn: "1:47 AM",
    text: "ما في تسجيل لهذي اللحظة — الزاوية الجديدة تخفي جزء من المدخل.",
    textEn: "There's no footage for this moment — the new angle hides part of the entrance.",
    requires: "camera",
  },
  {
    time: "02:04 ص",
    timeEn: "2:04 AM",
    text: "نفس السيارة تطلع مرة ثانية بعد وقت الوفاة.",
    textEn: "The same car leaves again after the time of death.",
    requires: "camera",
  },
  {
    time: "—",
    timeEn: "—",
    text: "زاوية الكاميرا متغيّرة عن مكانها الأصلي، والتغيير صاير نفس الليلة.",
    textEn:
      "The camera angle has been shifted from its original position, and the change happened that same night.",
    requires: "camera",
  },
];

export interface TimelineRow {
  time: string;
  timeEn?: string;
  text: string;
  textEn?: string;
  kind: "claim" | "record";
  /** تعارض زمني مرصود. */
  conflict?: boolean;
  requires?: string;
}

/** الجدول الزمني: أقوال + تسجيلات، مع إشارة للتعارضات — لمحلل الجدول الزمني. */
export const timelineRows: TimelineRow[] = [
  {
    time: "10:30 م",
    timeEn: "10:30 PM",
    text: "بداية القعدة بالشاليه.",
    textEn: "The gathering begins at the chalet.",
    kind: "record",
  },
  {
    time: "11:48 م",
    timeEn: "11:48 PM",
    text: "رسالة تهديد توصل لتلفون بدر.",
    textEn: "A threatening message arrives on Badr's phone.",
    kind: "record",
    requires: "message",
  },
  {
    time: "11:55 م",
    timeEn: "11:55 PM",
    text: "يوسف يقول إنه طلع قبل منتصف الليل وما رجع.",
    textEn: "Yousef says he left before midnight and didn't come back.",
    kind: "claim",
  },
  {
    time: "01:00 ص",
    timeEn: "1:00 AM",
    text: "فهد يقول إنه نام بالصالة من هذا الوقت.",
    textEn: "Fahad says he was asleep in the living room from this time.",
    kind: "claim",
  },
  {
    time: "01:15 ص",
    timeEn: "1:15 AM",
    text: "نورة تقول إنها طلعت من الشاليه.",
    textEn: "Noura says she left the chalet.",
    kind: "claim",
  },
  {
    time: "01:29 ص",
    timeEn: "1:29 AM",
    text: "آخر نشاط لتلفون بدر: فتح ملف تحويلات بنكية.",
    textEn: "Badr's phone's last activity: opening a bank transfer file.",
    kind: "record",
    requires: "phone",
  },
  {
    time: "01:30 ص",
    timeEn: "1:30 AM",
    text: "الأقوال تجمع إن الشاليه صار فاضي — يتعارض مع تسجيلات ما بعد هذا الوقت.",
    textEn:
      "The statements agree the chalet was empty by now — this conflicts with footage after this time.",
    kind: "claim",
    conflict: true,
  },
  {
    time: "01:38 ص",
    timeEn: "1:38 AM",
    text: "كاميرا المدخل تسجل دخول سيارة — بعد وقت «خلاص الجميع طلعوا».",
    textEn: "The entrance camera records a car coming in — after everyone claimed to have left.",
    kind: "record",
    conflict: true,
    requires: "camera",
  },
  {
    time: "01:47 ص",
    timeEn: "1:47 AM",
    text: "ساعة بدر واقفة على هذا الوقت بضربة — داخل نطاق وقت الوفاة.",
    textEn:
      "Badr's watch stopped at this exact time from a blow — within the estimated time of death.",
    kind: "record",
    conflict: true,
    requires: "watch",
  },
  {
    time: "01:48 ص",
    timeEn: "1:48 AM",
    text: "دانة تقول إنها سمعت باب ينسد وخطوات بالممر.",
    textEn: "Dana says she heard a door shut and footsteps in the hallway.",
    kind: "claim",
  },
  {
    time: "02:04 ص",
    timeEn: "2:04 AM",
    text: "الكاميرا تسجل خروج نفس السيارة بعد وقت الوفاة.",
    textEn: "The camera records the same car leaving after the time of death.",
    kind: "record",
    conflict: true,
    requires: "camera",
  },
];

/** سجل أقوال المشتبه فيهم — لمسؤول الملف. */
export const statementLog = suspects.map((s) => ({
  id: s.id,
  name: s.name,
  nameEn: s.nameEn,
  role: s.role,
  roleEn: s.roleEn,
  statements: s.known,
  statementsEn: s.knownEn,
}));
