import caseCoverChalet from "@/assets/scene-hero.jpg";
import caseCoverLastTrip from "@/assets/case-cover-last-trip.jpg";

/**
 * هوية اللعبة الرئيسية. القضايا تُسجَّل هنا حتى نقدر نضيف قضايا جديدة مستقبلاً
 * تحت نفس اللعبة بدون تعديل شاشات اللعبة.
 */
export const GAME_NAME = "ورا السالفة";
export const GAME_TAGLINE = "كل قضية لها سالفة... دوركم تعرفون وراها شنو.";
export const GAME_SUBTITLE = "كل قضية لها سالفة... دوركم تعرفون وراها شنو.";
/** الاسم والشد التسويقي بالإنجليزي — تُختار عبر pick() داخل الواجهة. */
export const GAME_NAME_EN = "Wara Al Salfa";
export const GAME_TAGLINE_EN = "Every case hides a story — your job is to find out what it is.";

export type CaseStatus = "available" | "soon";

export interface CaseSummary {
  id: string;
  title: string;
  /** العنوان بالإنجليزي (يُعرض عبر pick). */
  titleEn?: string;
  code: string;
  /** وصف قصير يظهر ببطاقة القضية. */
  description: string;
  descriptionEn?: string;
  status: CaseStatus;
  /** عدد المشتبهين (للعرض فقط). */
  suspects?: number;
  /** صورة غلاف القضية بالمتجر. */
  cover: string;
  /** تشويق قصير يظهر بالمتجر. */
  teaser: string;
  teaserEn?: string;
  difficulty: string;
  difficultyEn?: string;
  players: string;
  playersEn?: string;
  playTime: string;
  playTimeEn?: string;
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
    titleEn: "The Chalet Case",
    code: "K-2291",
    description: "ليلة عادية بين مجموعة أصدقاء انتهت بجريمة... وكل واحد عنده رواية.",
    descriptionEn:
      "An ordinary night among close friends ends in murder — and every one of them tells it differently.",
    teaser: "ليلة عادية بين مجموعة أصدقاء انتهت بجريمة... وكل واحد عنده رواية.",
    teaserEn:
      "An ordinary night among close friends ends in murder — and every one of them tells it differently.",
    status: "available",
    suspects: 4,
    cover: caseCoverChalet,
    difficulty: "متوسطة",
    difficultyEn: "Medium",
    players: "٣ – ٦ لاعبين",
    playersEn: "3 – 6 players",
    playTime: "٦٠ – ٧٥ دقيقة",
    playTimeEn: "60 – 75 min",
    price: "3.000 د.ك",
    free: true,
  },
  {
    id: LAST_TRIP_CASE_ID,
    title: "آخر رحلة",
    titleEn: "The Last Trip",
    code: "K-0472",
    description:
      "توقّف عابر في محطة طريق يتحول إلى قضية غامضة. واحد من الشباب ما رجع… وكل واحد يتذكر الليلة بطريقة مختلفة.",
    descriptionEn:
      "A quick stop at a highway rest station turns into a case with no clean answer. One of the friends never came back — and each of them remembers that night differently.",
    teaser:
      "توقّف عابر في محطة طريق يتحول إلى قضية غامضة. واحد من الشباب ما رجع… وكل واحد يتذكر الليلة بطريقة مختلفة.",
    teaserEn:
      "A quick stop at a highway rest station turns into a case with no clean answer. One of the friends never came back — and each of them remembers that night differently.",
    status: "available",
    suspects: 5,
    cover: caseCoverLastTrip,
    difficulty: "صعبة",
    difficultyEn: "Hard",
    players: "٣ – ٦ لاعبين",
    playersEn: "3 – 6 players",
    playTime: "٦٠ – ٩٠ دقيقة",
    playTimeEn: "60 – 90 min",
    price: "3.000 د.ك",
    free: false,
  },

];


/** القضية الحالية المفعّلة. */
export const ACTIVE_CASE_ID = CHALET_CASE_ID;

export const activeCase =
  caseRegistry.find((c) => c.id === ACTIVE_CASE_ID) ?? caseRegistry[0]!;

export const getCaseById = (id: string) => caseRegistry.find((c) => c.id === id);

export const playableCases = caseRegistry.filter((c) => c.status === "available");
