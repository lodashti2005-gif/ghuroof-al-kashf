/**
 * شخصيات قضية «آخر رحلة» — بيانات عامة للعرض فقط.
 *
 * هذا الملف مخصّص لقضية `last-trip` وحدها، وما يستورد ولا يعيد استخدام أي شي
 * من «قضية الشاليه». كل ما هنا آمن للعرض للاعبين: لا أسرار، لا اعترافات،
 * ولا أي إشارة للقاتل. المعرفة الداخلية لكل شخصية بملف منفصل ما يوصله العميل:
 * `last-trip-knowledge.server.ts`.
 */

import suspectJassim from "@/assets/last-trip/suspect-jassim.jpg";
import suspectSalem from "@/assets/last-trip/suspect-salem.jpg";
import suspectAbdullah from "@/assets/last-trip/suspect-abdullah.jpg";
import suspectMishal from "@/assets/last-trip/suspect-mishal.jpg";
import suspectNasser from "@/assets/last-trip/suspect-nasser.jpg";
import victimRashid from "@/assets/last-trip/victim-rashid.jpg";

/** بطاقة مشتبه فيه — كلها معلومات يشوفها اللاعب. */
export interface LastTripSuspectCard {
  id: string;
  name: string;
  age: number;
  /** علاقته بالضحية كما هي معلنة. */
  relation: string;
  personality: string;
  portrait: string;
  /** وين كان حسب قوله (معلن). */
  whereabouts: string;
  /** نقاط معروفة للفريق من أول لحظة. */
  known: string[];
}

/** بطاقة الضحية — للعرض فقط، غير قابلة للاستجواب. */
export interface LastTripVictimCard {
  name: string;
  age: number;
  portrait: string;
  personality: string;
  summary: string;
  known: string[];
}

export const lastTripVictim: LastTripVictimCard = {
  name: "راشد",
  age: 31,
  portrait: victimRashid,
  personality: "واثق واجتماعي، محبوب بين الربع",
  summary:
    "راشد وضعه المادي مريح ومحبوب بين الجماعة. انلقى ميت بالحمام البعيد داخل محطة الطريق بآخر وقفة بالرحلة.",
  known: [
    "وضعه المادي مريح، وهو المرجع للربع بأي شي",
    "شخصيته واثقة واجتماعية وما يحب المشاكل",
    "بنفس الليل قال لجاسم قدام الربع: «ليش كل شي عندك منافسة؟ إحنا ربع مو داخلين سباق.»",
  ],
};

/** غير قابل للاستجواب — الضحية ما يظهر بقائمة الاستجواب أبداً. */
export const LAST_TRIP_VICTIM_INTERROGATABLE = false;

export const lastTripSuspects: LastTripSuspectCard[] = [
  {
    id: "lt-jassim",
    name: "جاسم",
    age: 32,
    relation: "صديق راشد",
    personality: "هادي بالعادة، يدافع لمن يتضايق، ويحب يبين متعاون",
    portrait: suspectJassim,
    whereabouts: "يقول إنه كان يتمشى داخل المحطة ويرجع للكوفي",
    known: [
      "من أقرب الربع لراشد ومعاه بكل الرحلات",
      "وضعه المادي أقل من راشد وأحياناً يقارن نفسه فيه",
      "يقول إنه كان داخل المحطة وما دخل الحمام البعيد",
    ],
  },
  {
    id: "lt-salem",
    name: "سالم",
    age: 30,
    relation: "من ربع الرحلة",
    personality: "مباشر وحاد شوي، يرفع صوته بسرعة",
    portrait: suspectSalem,
    whereabouts: "أغلب الوقت برا عند السيارة",
    known: [
      "كان أغلب الوقت برا جدام السيارة",
      "يعرف إن جاسم حساس من موضوع المقارنة بينه وبين راشد",
      "ما يخبي رايه ويقوله على وجهك",
    ],
  },
  {
    id: "lt-abdullah",
    name: "عبدالله",
    age: 29,
    relation: "من ربع الرحلة",
    personality: "متحفّظ ويرتبك لمن يحس إنه متهم",
    portrait: suspectAbdullah,
    whereabouts: "كان على مكالمة بنفس الوقت المهم",
    known: [
      "كان على مكالمة طويلة بوقت الحادث",
      "بالمكالمة قطع قصير ما فسّره",
      "يقول إنه ما تحرّك من مكانه أثناء المكالمة",
    ],
  },
  {
    id: "lt-mishal",
    name: "مشعل",
    age: 26,
    relation: "من ربع الرحلة",
    personality: "بسيط وصريح، ذاكرته للأصوات مو دقيقة",
    portrait: suspectMishal,
    whereabouts: "قريب من الكوفي شوب",
    known: [
      "كان قاعد قريب من الكوفي شوب",
      "سمع رجّالين يتناقشون بصوت عالي من جهة الحمام البعيد",
      "ما عرف الأصوات ولا انتبه إنهم من ربعه",
    ],
  },
  {
    id: "lt-nasser",
    name: "ناصر",
    age: 33,
    relation: "من ربع الرحلة",
    personality: "هادي وملاحظ وينتبه للتفاصيل الصغيرة",
    portrait: suspectNasser,
    whereabouts: "كان يتحرّك داخل المحطة",
    known: [
      "كان يتنقل داخل المحطة بين الممر والكوفي",
      "شاف جاسم راجع صوب الكوفي وإيده مبلولة وكم ثوبه مبلول شوي",
      "ما شاف جاسم داخل الحمام ولا شافه يرمي شي",
    ],
  },
];

export const LAST_TRIP_SUSPECT_TOTAL = lastTripSuspects.length;

export const getLastTripSuspect = (id: string) =>
  lastTripSuspects.find((s) => s.id === id) ?? null;
