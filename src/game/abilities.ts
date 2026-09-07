/**
 * قدرات الأدوار — كل دور له قدرة واحدة يستخدمها مرة بكل جولة، ووقت دوره فقط.
 * ما تغيّر القصة ولا الأدلة ولا ردود المشتبهين: بس تكشف ملاحظة إضافية أو تنظّم
 * معلومات مكتشفة، وتنحفظ بالحالة المشتركة عشان كل الفريق يشوف الحركة.
 */
import type { AbilityUse } from "./types";

export type AbilityKind = "forensic" | "question" | "link" | "timeline";

export interface AbilityDef {
  kind: AbilityKind;
  label: string;
  labelEn: string;
  hint: string;
  hintEn: string;
}

const FORENSIC: AbilityDef = {
  kind: "forensic",
  label: "فحص الدليل",
  labelEn: "Forensic examination",
  hint: "اختر دليل واحد مكتشف — المعمل يعطيك ملاحظة إضافية عنه.",
  hintEn: "Pick one discovered piece of evidence — the lab gives you an extra note about it.",
};
const QUESTION: AbilityDef = {
  kind: "question",
  label: "سؤال إضافي",
  labelEn: "Extra question",
  hint: "اختر مشتبه واسأله سؤال واحد إضافي بدون ما ينقص من وقت استجوابه.",
  hintEn: "Pick a suspect and ask one extra question without using up their interrogation time.",
};
const LINK: AbilityDef = {
  kind: "link",
  label: "ربط الأدلة",
  labelEn: "Link evidence",
  hint: "اختر دليلين مكتشفين وشوف إذا فيه رابط محتمل بينهم.",
  hintEn: "Pick two discovered pieces of evidence and see if there's a possible link between them.",
};
const TIMELINE: AbilityDef = {
  kind: "timeline",
  label: "مراجعة التسلسل الزمني",
  labelEn: "Review the timeline",
  hint: "راجع المعلومات المكتشفة مرتبة بالوقت، وأشّر على حدث واحد مشبوه وشاركه.",
  hintEn:
    "Review the discovered information in time order, and flag one suspicious event to share.",
};

/** ربط كل دور موجود بقدرته — بدون أي تغيير بتوزيع الأدوار. */
const BY_ROLE: Record<string, AbilityDef> = {
  forensics: FORENSIC,
  detective: QUESTION,
  interrogator: QUESTION,
  records: LINK,
  surveillance: TIMELINE,
  timeline: TIMELINE,
};

export const abilityForRole = (roleId?: string | null): AbilityDef | null =>
  (roleId && BY_ROLE[roleId]) || null;

/**
 * مفتاح ثابت للاستخدام: (جولة + لاعب + نوع القدرة). لأنه ثابت، إعادة التحميل أو
 * إعادة الاتصال ما تقدر تسجّل نفس القدرة مرتين.
 */
export const abilityKey = (round: number, playerId: string, kind: AbilityKind) =>
  `${round}:${playerId}:${kind}`;

export const usedThisRound = (
  abilities: AbilityUse[] | undefined,
  round: number,
  playerId?: string,
  kind?: AbilityKind,
) =>
  !!playerId && !!kind && (abilities ?? []).some((a) => a.id === abilityKey(round, playerId, kind));

export const findAbility = (
  abilities: AbilityUse[] | undefined,
  round: number,
  playerId?: string,
  kind?: AbilityKind,
) =>
  playerId && kind
    ? (abilities ?? []).find((a) => a.id === abilityKey(round, playerId, kind))
    : undefined;

/** ملاحظة معمل إضافية لكل دليل — تنكشف بقدرة «فحص الدليل» فقط، وما تكشف الحل. */
export const deepForensicsEn: Record<string, string> = {
  watch: "The break appears to come from a strong blow, not an ordinary fall.",
  cup: "The coffee residue suggests it was used shortly before the incident.",
  shoe: "Where it fell suggests quick movement near the door.",
  phone: "The charger was plugged into power at the time of the incident.",
  key: "The key was used from the hallway side.",
  camera: "The recording timestamp can be reviewed and compared to the suspects' statements.",
  message:
    "The message arrived close to the start of the gathering, from a number registered to a company.",
};

export const deepForensics: Record<string, string> = {
  watch: "الكسر يبدو ناتج عن ضربة قوية وليس سقوطاً عادياً.",
  cup: "بقايا القهوة تشير إلى أنه استُخدم قبل وقت قصير من الحادث.",
  shoe: "مكان سقوطه يوحي بحركة سريعة قرب الباب.",
  phone: "الشاحن كان موصولاً بالكهرباء وقت الحادث.",
  key: "المفتاح كان مستخدماً من جهة الممر.",
  camera: "يمكن مراجعة توقيت التسجيل ومقارنته بأقوال المشتبه فيهم.",
  message: "توقيت وصول الرسالة قريب من بداية القعدة، ومصدرها رقم مسجل باسم شركة.",
};
