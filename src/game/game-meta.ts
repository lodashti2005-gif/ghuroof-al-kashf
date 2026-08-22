import { caseFile } from "./case-data";

/**
 * هوية اللعبة الرئيسية. القضايا تُسجَّل هنا حتى نقدر نضيف قضايا جديدة مستقبلاً
 * تحت نفس اللعبة بدون تعديل شاشات اللعبة.
 */
export const GAME_NAME = "ورا السالفة";
export const GAME_TAGLINE = "الحقيقة ما تنقال... تنكشف";
export const GAME_SUBTITLE = "كل قضية لها سالفة... دوركم تعرفون وراها شنو.";

export type CaseStatus = "available" | "soon";

export interface CaseSummary {
  id: string;
  title: string;
  code: string;
  /** وصف قصير يظهر ببطاقة القضية. */
  description: string;
  status: CaseStatus;
  /** عدد المشتبهين (للعرض فقط). */
  suspects?: number;
}

/**
 * سجل القضايا المتوفرة داخل اللعبة.
 *
 * إضافة قضية جديدة مستقبلاً = إضافة عنصر هنا + ملف بيانات قضية خاص بها
 * (الضحية، المشتبهين، الأدلة، مشاهد مسرح الجريمة، التسلسل الزمني، ملفات
 * الاستجواب، القاتل، والكشف النهائي). كل أنظمة اللعبة المشتركة — الغرف
 * الجماعية، الأدوار، التناوب، النقاش، دفتر القضية، التصويت والتقييم — تبقى
 * كما هي وتُعاد استخدامها لأي قضية.
 */
export const caseRegistry: CaseSummary[] = [
  {
    id: caseFile.id,
    title: caseFile.title,
    code: caseFile.code,
    description: "ليلة عادية بين مجموعة أصدقاء انتهت بجريمة... وكل واحد عنده رواية.",
    status: "available",
    suspects: 4,
  },
  {
    id: "coming-soon-1",
    title: "قضية جديدة",
    code: "K-????",
    description: "ملف جديد قيد التحضير... السالفة لِسِه مغلقة.",
    status: "soon",
  },
];

/** القضية الحالية المفعّلة. */
export const ACTIVE_CASE_ID = caseFile.id;

export const activeCase =
  caseRegistry.find((c) => c.id === ACTIVE_CASE_ID) ?? caseRegistry[0]!;

export const getCaseById = (id: string) => caseRegistry.find((c) => c.id === id);

export const playableCases = caseRegistry.filter((c) => c.status === "available");
