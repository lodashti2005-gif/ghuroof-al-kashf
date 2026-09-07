/**
 * أسئلة تحقيق تُفتح بالدليل: كل دليل من أدلة مسرح الجريمة الستة يفتح أسئلة
 * جديدة، وما تظهر قبل اكتشاف الدليل. الأسئلة موجهة للمشتبه فيهم المناسبين فقط،
 * وصياغتها كويتية عامية.
 *
 * ملاحظة: هذا الملف واجهة فقط — ما يكشف أي حل ولا يقول منو القاتل.
 */

export interface EvidenceQuestion {
  /** معرّف الدليل اللي يفتح هذا السؤال. */
  evidenceId: string;
  /** المشتبه فيهم اللي يناسبهم السؤال. */
  suspectIds: string[];
  text: string;
  textEn?: string;
}

export const evidenceQuestions: EvidenceQuestion[] = [
  // ساعة مكسورة
  {
    evidenceId: "watch",
    suspectIds: ["fahad", "noura", "yousef", "dana"],
    text: "الساعة وقفت على وقت معيّن… شتعرف عن هالوقت؟",
    textEn: "The watch stopped at a specific time… what do you know about it?",
  },
  {
    evidenceId: "watch",
    suspectIds: ["dana", "fahad"],
    text: "سمعت صوت شي ينكسر بذيك الساعة؟",
    textEn: "Did you hear something break around that time?",
  },
  {
    evidenceId: "watch",
    suspectIds: ["noura", "yousef"],
    text: "ساعة بدر كانت سليمة لمن شفته آخر مرة؟",
    textEn: "Was Badr's watch fine the last time you saw him?",
  },

  // فنجان قهوة تركية
  {
    evidenceId: "cup",
    suspectIds: ["fahad", "noura", "yousef", "dana"],
    text: "منو كان يشرب قهوة مع بدر؟",
    textEn: "Who was drinking coffee with Badr?",
  },
  {
    evidenceId: "cup",
    suspectIds: ["dana", "fahad"],
    text: "منو سوّى القهوة بالمطبخ بعد القعدة؟",
    textEn: "Who made the coffee in the kitchen after the gathering?",
  },
  {
    evidenceId: "cup",
    suspectIds: ["yousef"],
    text: "ليش فيه فنجالين مستعملين وبدر ما يشرب قهوة بالليل؟",
    textEn: "Why are there two used cups when Badr doesn't drink coffee at night?",
  },

  // كعب / حذاء نسائي
  {
    evidenceId: "shoe",
    suspectIds: ["fahad", "noura", "yousef", "dana"],
    text: "لقينا كعب بالغرفة، تعرف حق منو؟",
    textEn: "We found a heel in the room — do you know whose it is?",
  },
  {
    evidenceId: "shoe",
    suspectIds: ["noura"],
    text: "دخلتي غرفة بدر بذيك الليلة؟",
    textEn: "Did you go into Badr's room that night?",
  },
  {
    evidenceId: "shoe",
    suspectIds: ["dana", "fahad"],
    text: "شفت أحد يدخل الغرفة ويطلع مستعجل؟",
    textEn: "Did you see anyone go into the room and leave in a hurry?",
  },

  // كاميرا مراقبة خارج الغرفة
  {
    evidenceId: "camera",
    suspectIds: ["fahad", "noura", "yousef", "dana"],
    text: "الكاميرا برا الغرفة، منو مر بالممر بهالوقت؟",
    textEn: "The camera is outside the room — who passed through the hallway at that time?",
  },
  {
    evidenceId: "camera",
    suspectIds: ["yousef", "noura"],
    text: "سيارتك دخلت أو طلعت بعد منتصف الليل؟",
    textEn: "Did your car come in or leave after midnight?",
  },
  {
    evidenceId: "camera",
    suspectIds: ["dana"],
    text: "شفتي نور سيارة داخلة متأخر؟",
    textEn: "Did you see headlights of a car coming in late?",
  },

  // شاحن بدون تلفون
  {
    evidenceId: "phone",
    suspectIds: ["fahad", "noura", "yousef", "dana"],
    text: "لقينا شاحن بس التلفون مو موجود، وين تلفون بدر؟",
    textEn: "We found the charger but not the phone — where is Badr's phone?",
  },
  {
    evidenceId: "phone",
    suspectIds: ["fahad", "noura"],
    text: "آخر مرة شفت التلفون بيد منو؟",
    textEn: "Who did you last see holding the phone?",
  },
  {
    evidenceId: "phone",
    suspectIds: ["yousef"],
    text: "شنو كان يقلّب فيه بدر بتلفونه ذيك الليلة؟",
    textEn: "What was Badr looking at on his phone that night?",
  },

  // مفتاح
  {
    evidenceId: "key",
    suspectIds: ["fahad", "noura", "yousef", "dana"],
    text: "لقينا مفتاح، تعرف شنو يفتح؟",
    textEn: "We found a key — do you know what it opens?",
  },
  {
    evidenceId: "key",
    suspectIds: ["yousef", "fahad"],
    text: "منو عنده مفتاح احتياطي للغرفة؟",
    textEn: "Who has a spare key to the room?",
  },
  {
    evidenceId: "key",
    suspectIds: ["noura", "dana"],
    text: "وين تنحفظ مفاتيح الشاليه عادة؟",
    textEn: "Where are the chalet keys usually kept?",
  },

  // رسالة تهديد (تُفتح بالاستجواب مو من مسرح الجريمة)
  {
    evidenceId: "message",
    suspectIds: ["fahad", "noura", "yousef", "dana"],
    text: "في رسالة توصل لبدر تحذره من المحامي، شتعرف عنها؟",
    textEn: "A message warned Badr about the lawyer — what do you know about it?",
  },
];

/** أسئلة هذا المشتبه المتاحة حسب الأدلة المكتشفة فعلاً. */
export function questionsForSuspect(suspectId: string, unlockedIds: string[]) {
  return evidenceQuestions.filter(
    (q) => q.suspectIds.includes(suspectId) && unlockedIds.includes(q.evidenceId),
  );
}
