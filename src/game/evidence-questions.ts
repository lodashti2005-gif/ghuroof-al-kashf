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
}

export const evidenceQuestions: EvidenceQuestion[] = [
  // ساعة مكسورة
  {
    evidenceId: "watch",
    suspectIds: ["fahad", "noura", "yousef", "dana"],
    text: "الساعة وقفت على وقت معيّن… شتعرف عن هالوقت؟",
  },
  {
    evidenceId: "watch",
    suspectIds: ["dana", "fahad"],
    text: "سمعت صوت شي ينكسر بذيك الساعة؟",
  },
  {
    evidenceId: "watch",
    suspectIds: ["noura", "yousef"],
    text: "ساعة بدر كانت سليمة لمن شفته آخر مرة؟",
  },

  // فنجان قهوة تركية
  {
    evidenceId: "cup",
    suspectIds: ["fahad", "noura", "yousef", "dana"],
    text: "منو كان يشرب قهوة مع بدر؟",
  },
  {
    evidenceId: "cup",
    suspectIds: ["dana", "fahad"],
    text: "منو سوّى القهوة بالمطبخ بعد القعدة؟",
  },
  {
    evidenceId: "cup",
    suspectIds: ["yousef"],
    text: "ليش فيه فنجالين مستعملين وبدر ما يشرب قهوة بالليل؟",
  },

  // كعب / حذاء نسائي
  {
    evidenceId: "shoe",
    suspectIds: ["fahad", "noura", "yousef", "dana"],
    text: "لقينا كعب بالغرفة، تعرف حق منو؟",
  },
  {
    evidenceId: "shoe",
    suspectIds: ["noura"],
    text: "دخلتي غرفة بدر بذيك الليلة؟",
  },
  {
    evidenceId: "shoe",
    suspectIds: ["dana", "fahad"],
    text: "شفت أحد يدخل الغرفة ويطلع مستعجل؟",
  },

  // كاميرا مراقبة خارج الغرفة
  {
    evidenceId: "camera",
    suspectIds: ["fahad", "noura", "yousef", "dana"],
    text: "الكاميرا برا الغرفة، منو مر بالممر بهالوقت؟",
  },
  {
    evidenceId: "camera",
    suspectIds: ["yousef", "noura"],
    text: "سيارتك دخلت أو طلعت بعد منتصف الليل؟",
  },
  {
    evidenceId: "camera",
    suspectIds: ["dana"],
    text: "شفتي نور سيارة داخلة متأخر؟",
  },

  // شاحن بدون تلفون
  {
    evidenceId: "phone",
    suspectIds: ["fahad", "noura", "yousef", "dana"],
    text: "لقينا شاحن بس التلفون مو موجود، وين تلفون بدر؟",
  },
  {
    evidenceId: "phone",
    suspectIds: ["fahad", "noura"],
    text: "آخر مرة شفت التلفون بيد منو؟",
  },
  {
    evidenceId: "phone",
    suspectIds: ["yousef"],
    text: "شنو كان يقلّب فيه بدر بتلفونه ذيك الليلة؟",
  },

  // مفتاح
  {
    evidenceId: "key",
    suspectIds: ["fahad", "noura", "yousef", "dana"],
    text: "لقينا مفتاح، تعرف شنو يفتح؟",
  },
  {
    evidenceId: "key",
    suspectIds: ["yousef", "fahad"],
    text: "منو عنده مفتاح احتياطي للغرفة؟",
  },
  {
    evidenceId: "key",
    suspectIds: ["noura", "dana"],
    text: "وين تنحفظ مفاتيح الشاليه عادة؟",
  },

  // رسالة تهديد (تُفتح بالاستجواب مو من مسرح الجريمة)
  {
    evidenceId: "message",
    suspectIds: ["fahad", "noura", "yousef", "dana"],
    text: "في رسالة توصل لبدر تحذره من المحامي، شتعرف عنها؟",
  },
];

/** أسئلة هذا المشتبه المتاحة حسب الأدلة المكتشفة فعلاً. */
export function questionsForSuspect(suspectId: string, unlockedIds: string[]) {
  return evidenceQuestions.filter(
    (q) => q.suspectIds.includes(suspectId) && unlockedIds.includes(q.evidenceId),
  );
}
