import caseCoverChalet from "@/assets/scene-hero.jpg";
import caseCoverLastTrip from "@/assets/case-cover-last-trip.jpg";

import { caseFile } from "./case-data";
import { lastTripCase } from "./cases/last-trip";


/**
 * هوية اللعبة الرئيسية. القضايا تُسجَّل هنا حتى نقدر نضيف قضايا جديدة مستقبلاً
 * تحت نفس اللعبة بدون تعديل شاشات اللعبة.
 */
export const GAME_NAME = "ورا السالفة";
export const GAME_TAGLINE = "كل قضية لها سالفة... دوركم تعرفون وراها شنو.";
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
  /** صورة غلاف القضية بالمتجر. */
  cover: string;
  /** تشويق قصير يظهر بالمتجر. */
  teaser: string;
  difficulty: string;
  players: string;
  playTime: string;
  /** السعر المعروض. بدون بوابة دفع حالياً. */
  price: string;
  /** قضية مفتوحة للجميع (ما تحتاج شراء) — تحقق الملكية النهائي يصير بالسيرفر. */
  free: boolean;
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
    teaser: "ليلة عادية بين مجموعة أصدقاء انتهت بجريمة... وكل واحد عنده رواية.",
    status: "available",
    suspects: 4,
    cover: caseCoverChalet,
    difficulty: "متوسطة",
    players: "٣ – ٦ لاعبين",
    playTime: "٦٠ – ٧٥ دقيقة",
    price: "د.ك —",
    free: true,
  },
  {
    id: lastTripCase.id,
    title: lastTripCase.title,
    code: lastTripCase.code,
    description:
      "توقّف عابر في محطة طريق يتحول إلى قضية غامضة. واحد من الشباب ما رجع… وكل واحد يتذكر الليلة بطريقة مختلفة.",
    teaser:
      "توقّف عابر في محطة طريق يتحول إلى قضية غامضة. واحد من الشباب ما رجع… وكل واحد يتذكر الليلة بطريقة مختلفة.",
    status: "soon",
    cover: caseCoverLastTrip,
    difficulty: "صعبة",
    players: "٣ – ٦ لاعبين",
    playTime: "٦٠ – ٩٠ دقيقة",
    price: "د.ك —",
    free: false,
  },

];


/** القضية الحالية المفعّلة. */
export const ACTIVE_CASE_ID = caseFile.id;

export const activeCase =
  caseRegistry.find((c) => c.id === ACTIVE_CASE_ID) ?? caseRegistry[0]!;

export const getCaseById = (id: string) => caseRegistry.find((c) => c.id === id);

export const playableCases = caseRegistry.filter((c) => c.status === "available");
