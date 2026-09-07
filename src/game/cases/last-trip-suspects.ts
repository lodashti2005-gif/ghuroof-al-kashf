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
  nameEn: string;
  age: number;
  /** علاقته بالضحية كما هي معلنة. */
  relation: string;
  relationEn: string;
  personality: string;
  personalityEn: string;
  portrait: string;
  /** وين كان حسب قوله (معلن). */
  whereabouts: string;
  whereaboutsEn: string;
  /** نقاط معروفة للفريق من أول لحظة. */
  known: string[];
  knownEn: string[];
}

/** بطاقة الضحية — للعرض فقط، غير قابلة للاستجواب. */
export interface LastTripVictimCard {
  name: string;
  nameEn: string;
  age: number;
  portrait: string;
  personality: string;
  personalityEn: string;
  summary: string;
  summaryEn: string;
  known: string[];
  knownEn: string[];
}

export const lastTripVictim: LastTripVictimCard = {
  name: "راشد",
  nameEn: "Rashid",
  age: 31,
  portrait: victimRashid,
  personality: "واثق واجتماعي، محبوب بين الربع",
  personalityEn: "Confident and outgoing, well-liked by the group",
  summary:
    "راشد وضعه المادي مريح ومحبوب بين الجماعة. انلقى ميت بالحمام البعيد داخل محطة الطريق بآخر وقفة بالرحلة.",
  summaryEn:
    "Rashid was well-off and popular with his friends. He was found dead in the far bathroom of the highway rest stop, on the last stop of the trip.",
  known: [
    "وضعه المادي مريح ومحبوب بين ربعه.",
    "اجتماعي وقريب من أغلب المجموعة.",
    "ما كان واضح للربع إن عنده مشكلة كبيرة مع أحد قبل الحادثة.",
  ],
  knownEn: [
    "Well-off financially and popular with his friends.",
    "Outgoing and close to most of the group.",
    "No one in the group noticed him having a real problem with anyone before the incident.",
  ],
};

/** غير قابل للاستجواب — الضحية ما يظهر بقائمة الاستجواب أبداً. */
export const LAST_TRIP_VICTIM_INTERROGATABLE = false;

export const lastTripSuspects: LastTripSuspectCard[] = [
  {
    id: "lt-jassim",
    name: "جاسم",
    nameEn: "Jassim",
    age: 32,
    relation: "صديق راشد",
    relationEn: "Rashid's friend",
    personality: "هادي بطبعه ومتعاون مع المحققين أثناء الاستجواب",
    personalityEn: "Naturally calm and cooperative with investigators during questioning",
    portrait: suspectJassim,
    whereabouts: "يقول إنه كان يتمشى داخل المحطة ويرجع للكوفي",
    whereaboutsEn: "Says he was walking around the station and headed back to the coffee shop",
    known: [
      "من أقرب ربع راشد ومعاه بكثير من الرحلات.",
      "وضعه المادي أقل من راشد، وأحيانًا يقارن نفسه فيه.",
      "يقول إنه كان يتمشى داخل المحطة ويرجع للكوفي.",
    ],
    knownEn: [
      "One of Rashid's closest friends, on many trips with him.",
      "Less well-off than Rashid, and sometimes compares himself to him.",
      "Says he was walking around the station and headed back to the coffee shop.",
    ],
  },
  {
    id: "lt-salem",
    name: "سالم",
    nameEn: "Salem",
    age: 30,
    relation: "من ربع الرحلة",
    relationEn: "One of the trip's group",
    personality: "مباشر وحاد شوي، يرفع صوته بسرعة",
    personalityEn: "Direct and a bit sharp-tempered, quick to raise his voice",
    portrait: suspectSalem,
    whereabouts: "أغلب الوقت برا عند السيارة",
    whereaboutsEn: "Mostly outside by the car",
    known: [
      "كان أغلب الوقت برا جدام السيارة.",
      "يعرف إن جاسم حساس من موضوع المقارنة بينه وبين راشد.",
      "ما يخبي رايه ويقوله على وجهك.",
    ],
    knownEn: [
      "Was outside by the car most of the time.",
      "Knows Jassim is touchy about being compared to Rashid.",
      "Doesn't hide his opinions — says them to your face.",
    ],
  },
  {
    id: "lt-abdullah",
    name: "عبدالله",
    nameEn: "Abdullah",
    age: 29,
    relation: "من ربع الرحلة",
    relationEn: "One of the trip's group",
    personality: "متحفّظ ويرتبك لمن يحس إنه متهم",
    personalityEn: "Reserved, gets flustered when he feels accused",
    portrait: suspectAbdullah,
    whereabouts: "كان على مكالمة هاتفية بنفس وقت الواقعة تقريبًا",
    whereaboutsEn: "Was on a phone call around the time of the incident",
    known: [
      "كان على مكالمة هاتفية بنفس وقت الواقعة تقريبًا.",
      "يقول إن المكالمة تثبت مكانه ووقته.",
      "سجل المكالمات موجود ضمن أدلة القضية ويمكن التحقق منه.",
    ],
    knownEn: [
      "Was on a phone call around the time of the incident.",
      "Says the call proves where he was and when.",
      "The call log is part of the case evidence and can be checked.",
    ],
  },
  {
    id: "lt-mishal",
    name: "مشعل",
    nameEn: "Mishal",
    age: 26,
    relation: "من ربع الرحلة",
    relationEn: "One of the trip's group",
    personality: "بسيط وصريح، ذاكرته للأصوات مو دقيقة",
    personalityEn: "Simple and straightforward, not great at remembering sounds precisely",
    portrait: suspectMishal,
    whereabouts: "قريب من الكوفي شوب",
    whereaboutsEn: "Near the coffee shop",
    known: [
      "كان قريب من الكوفي شوب.",
      "سمع صوت رجلين يتهاوشون من جهة الحمام البعيد.",
      "بعد فترة قصيرة، شاف جاسم عند باب الكوفي يرمي شي في حاوية الزبالة.",
    ],
    knownEn: [
      "Was near the coffee shop.",
      "Heard two men arguing from the direction of the far bathroom.",
      "Shortly after, saw Jassim at the coffee shop door throwing something in the trash bin.",
    ],
  },
  {
    id: "lt-nasser",
    name: "ناصر",
    nameEn: "Nasser",
    age: 33,
    relation: "من ربع الرحلة",
    relationEn: "One of the trip's group",
    personality: "هادي وملاحظ وينتبه للتفاصيل الصغيرة",
    personalityEn: "Calm and observant, notices small details",
    portrait: suspectNasser,
    whereabouts: "كان يتحرّك داخل المحطة",
    whereaboutsEn: "Was moving around inside the station",
    known: [
      "كان يتنقل داخل المحطة بين الممر والكوفي.",
      "شاف جاسم راجع صوب الكوفي وإيده مبلولة وكم ثوبه مبلول شوي.",
      "ما شاف جاسم داخل الحمام، وما يدري ليش كان مبلول.",
    ],
    knownEn: [
      "Was moving between the corridor and the coffee shop.",
      "Saw Jassim heading back to the coffee shop with a wet hand and a slightly wet sleeve.",
      "Didn't see Jassim inside the bathroom, and doesn't know why he was wet.",
    ],
  },
];

export const LAST_TRIP_SUSPECT_TOTAL = lastTripSuspects.length;

export const getLastTripSuspect = (id: string) =>
  lastTripSuspects.find((s) => s.id === id) ?? null;
