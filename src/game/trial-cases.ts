/**
 * القضايا اللي تُعرض بتجربة محدودة (١٠ دقائق) بدل «مجانية».
 *
 * القضية مفتوحة للدخول عشان اللاعب يجرّبها، لكن الوقت محسوب على حسابه بالخادم،
 * وبعد انتهاء التجربة لازم شراء مؤكد لفتحها كاملة. ولأنها «تجربة» وليست مجانية،
 * الشراء لازم يكون متاحاً لها — فما نعتبر `is_free` ملكية كاملة لها.
 */
export const TRIAL_CASE_IDS = ["last-night"] as const;

export const isTrialCase = (caseId: string): boolean =>
  (TRIAL_CASE_IDS as readonly string[]).includes(caseId);
