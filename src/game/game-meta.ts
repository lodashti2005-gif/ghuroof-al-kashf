import { caseFile } from "./case-data";

/**
 * هوية اللعبة الرئيسية. القضايا تُسجَّل هنا حتى نقدر نضيف قضايا جديدة مستقبلاً
 * تحت نفس اللعبة بدون تعديل شاشات اللعبة.
 */
export const GAME_NAME = "ورا السالفة";
export const GAME_TAGLINE = "الحقيقة ما تنقال... تنكشف";

export interface CaseSummary {
  id: string;
  title: string;
  code: string;
}

/** سجل القضايا المتوفرة داخل اللعبة. أضف قضايا جديدة بإضافة عنصر هنا. */
export const caseRegistry: CaseSummary[] = [
  { id: caseFile.id, title: caseFile.title, code: caseFile.code },
];

/** القضية الحالية المفعّلة. */
export const ACTIVE_CASE_ID = caseFile.id;

export const activeCase =
  caseRegistry.find((c) => c.id === ACTIVE_CASE_ID) ?? caseRegistry[0]!;

export const getCaseById = (id: string) => caseRegistry.find((c) => c.id === id);
