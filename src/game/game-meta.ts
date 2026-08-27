import caseCoverChalet from "@/assets/scene-hero.jpg";
import caseCoverLastTrip from "@/assets/case-cover-last-trip.jpg";

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

const CHALET_CASE_ID = "last-night";
const LAST_TRIP_CASE_ID = "last-trip";


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
    id: CHALET_CASE_ID,
    title: "قضية الشاليه",
    code: "K-2291",
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
    id: LAST_TRIP_CASE_ID,
    title: "آخر رحلة",
    code: "K-0472",
    description:
      "توقّف عابر في محطة طريق يتحول إلى قضية غامضة. واحد من الشباب ما رجع… وكل واحد يتذكر الليلة بطريقة مختلفة.",
    teaser:
      "توقّف عابر في محطة طريق يتحول إلى قضية غامضة. واحد من الشباب ما رجع… وكل واحد يتذكر الليلة بطريقة مختلفة.",
    status: "available",
    suspects: 5,
    cover: caseCoverLastTrip,
    difficulty: "صعبة",
    players: "٣ – ٦ لاعبين",
    playTime: "٦٠ – ٩٠ دقيقة",
    price: "$9.99 USD",
    free: false,
  },

];


/** القضية الحالية المفعّلة. */
export const ACTIVE_CASE_ID = CHALET_CASE_ID;

export const activeCase =
  caseRegistry.find((c) => c.id === ACTIVE_CASE_ID) ?? caseRegistry[0]!;

export const getCaseById = (id: string) => caseRegistry.find((c) => c.id === id);

export const playableCases = caseRegistry.filter((c) => c.status === "available");
