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
  hint: string;
}

const FORENSIC: AbilityDef = {
  kind: "forensic",
  label: "فحص الدليل",
  hint: "اختر دليل واحد مكتشف — المعمل يعطيك ملاحظة إضافية عنه.",
};
const QUESTION: AbilityDef = {
  kind: "question",
  label: "سؤال إضافي",
  hint: "اختر مشتبه واسأله سؤال واحد إضافي بدون ما ينقص من وقت استجوابه.",
};
const LINK: AbilityDef = {
  kind: "link",
  label: "ربط الأدلة",
  hint: "اختر دليلين مكتشفين وشوف إذا فيه رابط محتمل بينهم.",
};
const TIMELINE: AbilityDef = {
  kind: "timeline",
  label: "مراجعة التسلسل الزمني",
  hint: "راجع المعلومات المكتشفة مرتبة بالوقت، وأشّر على حدث واحد مشبوه وشاركه.",
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
  !!playerId &&
  !!kind &&
  (abilities ?? []).some((a) => a.id === abilityKey(round, playerId, kind));

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
export const deepForensics: Record<string, string> = {
  watch: "الكسر يبدو ناتج عن ضربة قوية وليس سقوطاً عادياً.",
  cup: "بقايا القهوة تشير إلى أنه استُخدم قبل وقت قصير من الحادث.",
  shoe: "مكان سقوطه يوحي بحركة سريعة قرب الباب.",
  phone: "الشاحن كان موصولاً بالكهرباء وقت الحادث.",
  key: "المفتاح كان مستخدماً من جهة الممر.",
  camera: "يمكن مراجعة توقيت التسجيل ومقارنته بأقوال المشتبه فيهم.",
  message: "توقيت وصول الرسالة قريب من بداية القعدة، ومصدرها رقم مسجل باسم شركة.",
};
