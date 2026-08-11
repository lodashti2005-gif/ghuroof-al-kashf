/**
 * Demo interrogation engine.
 *
 * This is intentionally isolated behind `generateSuspectReply` so a real AI API
 * (Lovable AI Gateway / server function) can replace the body later without
 * touching any UI code. Every suspect has a private persona, truths and lies,
 * and its own stress reactions. Replies are written in natural Kuwaiti dialect.
 */

export interface ReplyContext {
  suspectId: string;
  message: string;
  stress: number;
  askedTopics: string[];
  unlockedEvidence: string[];
}

export interface ReplyResult {
  text: string;
  stressDelta: number;
  unlock?: string;
  topic: string;
}

type Topic =
  | "alibi"
  | "phone"
  | "watch"
  | "money"
  | "coffee"
  | "camera"
  | "door"
  | "relation"
  | "accuse"
  | "threat"
  | "smalltalk"
  | "default";

const TOPIC_KEYWORDS: Record<Topic, string[]> = {
  alibi: ["وين", "متى", "وقت", "ساعة كم", "طلعت", "رحت", "نمت", "كنت", "آخر مرة", "الساعة"],
  phone: ["تلفون", "جوال", "موبايل", "هاتف"],
  watch: ["ساعة", "الساعه", "مكسور", "معصم"],
  money: ["فلوس", "دين", "تحويل", "حساب", "شركة", "شغل", "مال", "دينار", "محامي"],
  coffee: ["قهوة", "فنجال", "شرب", "كوب", "مهدئ", "دواء"],
  camera: ["كاميرا", "تصوير", "مدخل", "سيارة", "بوابة"],
  door: ["باب", "مفتاح", "قفل", "غرفة", "مقفل"],
  relation: ["علاقة", "خطوبة", "خطيب", "حب", "زواج", "خلاف", "زعل", "خاتم", "رسائل"],
  accuse: ["أنت قتلت", "انت قتلت", "قاتل", "تكذب", "كذاب", "اعترف", "متهم", "قتلته", "قتلت"],
  threat: ["تهديد", "رسالة", "وعيد", "تخوف"],
  smalltalk: ["سلام", "هلا", "مرحبا", "كيفك", "شخبارك"],
  default: [],
};

const AGGRESSIVE = ["اعترف", "كذاب", "تكذب", "قاتل", "اسكت", "بسرعة", "لا تلعب", "احنا نعرف"];
const CALM = ["لو سمحت", "بهدوء", "خذ وقتك", "ارتاح", "نبي نساعدك", "ما نتهمك"];

function detectTopic(message: string): Topic {
  const m = message.trim();
  const order: Topic[] = [
    "accuse",
    "phone",
    "camera",
    "door",
    "coffee",
    "money",
    "threat",
    "watch",
    "relation",
    "alibi",
    "smalltalk",
  ];
  for (const topic of order) {
    if (TOPIC_KEYWORDS[topic].some((k) => m.includes(k))) return topic;
  }
  return "default";
}

const TOPIC_UNLOCK: Partial<Record<Topic, string>> = {
  alibi: "watch",
  watch: "watch",
  phone: "phone",
  coffee: "cup",
  threat: "message",
  money: "message",
  camera: "camera",
  door: "key",
};

type Lines = Partial<Record<Topic, string[]>> & { default: string[]; pressured?: string[] };

const SCRIPTS: Record<string, Lines> = {
  fahad: {
    alibi: [
      "كنت بالصالة، صدق. من حول الساعة وحدة وأنا مستلقي على الكنب.",
      "آخر مرة شفته كان واقف على باب الغرفة، قال لي «خلني شوي» وسدّ الباب.",
      "ما أدري بالضبط الوقت، بس القعدة كانت خلصت وكل واحد صار بحاله.",
    ],
    money: [
      "إي كنت أستلف منه، وشو المشكلة؟ بيني وبينه سنين، مو أول مرة.",
      "طلبت منه دفعة هاليلة ورفض... زعلت، بس ما وصلنا لشي.",
      "دياني مو سر، الكل يعرف. بس دين ما يخلي واحد يقتل صاحبه.",
    ],
    phone: [
      "تلفونه؟ والله ما لمسته. أنا حتى ما دخلت عليه الغرفة.",
      "شفت التلفون معه بالقعدة، بعدها ما ادري وين راح.",
    ],
    door: [
      "الباب كان منسد، بس مو مكسور. سمعت صوت طقة ظنيتها الباب الخارجي.",
      "المفاتيح كلها معلقة بالمطبخ عادة، ما انتبهت لها.",
    ],
    camera: [
      "الكاميرا موجودة عند المدخل، بس أنا ما اقرب لها.",
      "إذا الكاميرا مسجلة شي، اسألوها هي، أنا قلت اللي عندي.",
    ],
    coffee: ["بدر ما يشرب قهوة بالليل، هذي أعرفها عنه.", "ما شفت أحد يسوي قهوة بعد القعدة."],
    relation: ["علاقته بنورة كانت متوترة، بس هذا شغلهم.", "أنا ما أتدخل بحياته الخاصة."],
    accuse: [
      "لحظة، شكو أنا بالموضوع؟ اسألوا غيري.",
      "أنا صاحبه، مو عدوه. لا تركبون علي شي.",
      "خلاص، أنا صرت المتهم؟ زين... اسألوا يوسف عن ليش رجع.",
    ],
    threat: ["أنا ما هددته أبداً. اللي أعرفه إن أحد أرسل له شي متعلق بالشغل."],
    watch: ["ساعته؟ كانت بيده بالقعدة، ما لاحظت شي عليها."],
    smalltalk: ["هلا... بس أنا تعبان، خلنا نخلص بسرعة."],
    default: [
      "قلت لكم اللي أعرفه، شتبون مني بعد؟",
      "والله ما عندي زيادة. سؤال ثاني.",
      "أنا جاي أساعد، بس بلا لف ودوران.",
    ],
    pressured: [
      "زين... زين. أنا ما نمت من وحدة. كنت صاحي وسمعت خطوات بالممر.",
      "أوكي! شفت يوسف طالع من الممر بعد وحدة ونص. قلتها، ارتحتوا؟",
      "في شي سويته وأنا خايف أقوله... بس ما له علاقة بالقتل، والله.",
    ],
  },
  noura: {
    alibi: [
      "طلعت حول وحدة وربع، مليت من القعدة.",
      "ليش تسألوني نفس السؤال؟ قلت لكم طلعت وخلاص.",
      "الليلة كلها مو واضحة عندي... كنت متضايقة.",
    ],
    relation: [
      "انفصلنا قبل شهرين، بس هذا ما يعني إني أتمنى له الشر.",
      "إي أرسلت له رسائل، وايد رسائل. كنت أبي أنهي الموضوع بشكل محترم.",
      "الخاتم... كان لازم أرده له. هذا كل شي.",
    ],
    phone: [
      "تلفونه كان معه، شفته يقلب فيه وهو متضايق.",
      "أنا ما أخذت شي منه. لا تلفون ولا غيره.",
    ],
    watch: [
      "ساعته كانت مكسورة قبل ما أطلع، لاحظتها وقتها.",
      "متأكدة من الساعة. هذي الشغلة أذكرها زين.",
    ],
    money: ["بدر كان خايف من شي بالشغل، مو مني. قال لي «الموضوع أكبر من فلوس»."],
    door: ["الباب كان مسكر، وهو داخل. ما حاولت أفتحه."],
    camera: ["الكاميرا... ما أدري شنو مسجلة. اسألوا صاحب الشاليه."],
    coffee: ["ما شفت قهوة. بدر يكره القهوة بالليل."],
    accuse: [
      "أنا؟ تقول إني أنا؟ الله يهديك...",
      "ما قتلته. أحبه، ولو ما نتزوج.",
      "توني أفقد واحد، وتيون تتهموني؟",
    ],
    threat: ["في رسالة وصلت له وهو مقلوب منها، بس مو مني."],
    smalltalk: ["هلا... عذراً، عيوني ما تتحمل نور هالغرفة."],
    default: [
      "ما أعرف أكثر من اللي قلته.",
      "خلوني أرتب أفكاري... كل شي مخربط.",
      "شتبون بعد؟ أنا قلت كل شي.",
    ],
    pressured: [
      "زين، رجعت! رجعت أرد الخاتم، بس ما دخلت غرفته.",
      "شفت أحد بالممر... وشفته ياخذ شي من الغرفة. تلفون.",
      "ما أقدر أسمي أحد، عنده شي علي وعلى أهلي. لا تجبروني.",
    ],
  },
  yousef: {
    alibi: [
      "طلعت قبل 12، سألوا أي واحد منهم.",
      "أنا مشغول، ما عندي وقت أقعد لآخر الليل.",
      "طلعت ورحت البيت. خلصنا؟",
    ],
    money: [
      "خلافات الشغل شي طبيعي بين شركاء، لا تكبرونها.",
      "التحويلات كلها موثقة، وإذا فيها ملاحظة تنحل بالمحاسب.",
      "بدر كان يبالغ. يبي محامي على شي يتحل بجلسة.",
    ],
    phone: [
      "تلفونه؟ ليش أسأل عن تلفونه أنا؟",
      "ما أدري شنو صار بتلفونه، ولا يهمني.",
      "خلاص عن التلفون، عندكم سؤال ثاني؟",
    ],
    camera: [
      "الكاميرا؟... زين، ممكن مريت قريب من المدخل.",
      "أي كاميرا؟ هالشاليه كاميراته ما تشتغل أصلاً.",
      "إذا عندكم تسجيل، عرضوه. أنا ما أخاف.",
    ],
    door: [
      "مفتاح؟ عندي مفتاح للشاليه لأنه شاليه شركة، طبيعي.",
      "الباب مو شغلتي. أنا ما كنت هناك بذاك الوقت.",
    ],
    coffee: [
      "ما شربت قهوة، ولا سويت قهوة.",
      "شنو دخل القهوة بالموضوع؟ صرتوا تسألون سوالف مطبخ؟",
    ],
    watch: ["ساعته؟ ما لاحظت. ليش تركزون على تفاصيل صغيرة؟"],
    relation: ["علاقته بنورة ما تهمني، أنا شريك شغل مو مستشار عواطف."],
    threat: [
      "رسالة تهديد؟ هذي كلمة كبيرة. أنا كتبت له كلام بينه وبيني.",
      "أي واحد يتضايق ويكتب كلام. ما يعني إني أذيته.",
    ],
    accuse: [
      "انتبه على كلامك. أنا ما أسمح لأحد يتهمني.",
      "خلصنا؟ لأني أقدر أطلع من هالغرفة بأي لحظة.",
      "قول اللي عندك دليل عليه، وإلا اسكت.",
    ],
    smalltalk: ["يالله بسرعة، عندي التزامات."],
    default: [
      "ما عندي زيادة على اللي قلته.",
      "أسئلتكم تلف بنفس المكان.",
      "أنا متعاون، بس لا تستهبلون علي.",
    ],
    pressured: [
      "أوكي... مريت مرة ثانية، بس ما دخلت عليه.",
      "شوف، بدر كان يبي يحرقني بشي ما فهمه صح. أي واحد بمكاني يزعل.",
      "أنا... خلاص، ما أتكلم أكثر بدون محامي.",
    ],
  },
  dana: {
    alibi: [
      "كنت بالحوش أغلب الوقت. أحب الهدوء.",
      "دخلت مرتين للمطبخ بس، وما شفت أحد بالممر.",
    ],
    watch: ["سمعت صوت شي انكسر... زجاج تقريباً. بعد وحدة ونص بشوي."],
    door: ["إي، سمعت باب ينسد بعد وحدة وخمسة وأربعين. متأكدة."],
    coffee: [
      "شفت فنجالين قهوة بالمطبخ، وهذا غريب لأن بدر ما يشرب قهوة بالليل.",
      "الفنجالين كانوا مستعملين، مو نظيفين.",
    ],
    camera: ["الكاميرا عند المدخل تسجل السيارات. أنا شفت نور سيارة داخلة متأخر."],
    phone: ["بدر كان يقلب بتلفونه ويكتب شي بجدية قبل ما يدخل الغرفة."],
    money: ["سمعت كلمة «محامي» بينه وبين يوسف، بس ما تدخلت."],
    relation: ["نورة كانت متضايقة، بس ما شفت منها شي غريب."],
    accuse: ["أنا ما أذي أحد. بس إذا تبي الصدق، اسألوني بهدوء وأقول أكثر."],
    threat: ["بدر تلفونه رن ووجهه تغير... شي ضايقه."],
    smalltalk: ["هلا. أنا مستعدة أتكلم، بس على راحتي."],
    default: [
      "أنا ألاحظ أكثر من إني أتكلم.",
      "اسألني سؤال محدد وأجاوبك بدقة.",
      "ذاكرتي بالأوقات... خلنا نقول متوسطة.",
    ],
    pressured: [
      "عندي تسجيل صوتي من هاليلة... ما سلمته لأني خفت.",
      "بالتسجيل تسمع باب وخطوات الساعة وحدة وسبعة وأربعين.",
      "أنا كذبت بشي وحد: ذاكرتي قوية بالأوقات، مو ضعيفة.",
    ],
  },
};

const STRESS_WEIGHT: Record<string, Partial<Record<Topic, number>>> = {
  fahad: { money: 14, accuse: 12, alibi: 8, phone: 6, default: 2 },
  noura: { relation: 12, alibi: 13, accuse: 11, watch: 5, default: 2 },
  yousef: { camera: 18, door: 15, money: 14, coffee: 13, phone: 12, accuse: 10, default: 3 },
  dana: { accuse: 6, coffee: 4, watch: 4, default: 1 },
};

function pick(lines: string[], seed: number): string {
  return lines[seed % lines.length] ?? lines[0] ?? "...";
}

export function generateSuspectReply(ctx: ReplyContext): ReplyResult {
  const topic = detectTopic(ctx.message);
  const script = SCRIPTS[ctx.suspectId] ?? SCRIPTS['fahad']!;
  const weights = STRESS_WEIGHT[ctx.suspectId] ?? {};
  const lower = ctx.message;

  const aggressive = AGGRESSIVE.some((k) => lower.includes(k));
  const calm = CALM.some((k) => lower.includes(k));
  const repeat = ctx.askedTopics.filter((t) => t === topic).length;

  let stressDelta = weights[topic] ?? weights.default ?? 2;
  if (aggressive) stressDelta += 9;
  if (calm) stressDelta -= 4;
  if (repeat > 0) stressDelta += Math.min(repeat * 3, 9);

  // Confronting a suspect with evidence the team already unlocked hits harder.
  const evidenceTopic = TOPIC_UNLOCK[topic];
  if (evidenceTopic && ctx.unlockedEvidence.includes(evidenceTopic)) stressDelta += 5;

  const seed = ctx.message.length + repeat * 3 + Math.floor(ctx.stress / 7);
  const highStress = ctx.stress + stressDelta >= 68;

  let lines = script[topic] ?? script.default;
  if (highStress && script.pressured && (aggressive || repeat > 0 || topic !== "smalltalk")) {
    lines = script.pressured;
  }

  const text = pick(lines, Math.max(seed, 0));

  const unlock =
    evidenceTopic && !ctx.unlockedEvidence.includes(evidenceTopic) ? evidenceTopic : undefined;

  const result: ReplyResult = {
    text,
    stressDelta: Math.max(-6, Math.round(stressDelta)),
    topic,
  };
  if (unlock) result.unlock = unlock;
  return result;
}

export const suggestedQuestions = [
  "وين كنت الساعة وحدة ونص؟",
  "متى آخر مرة شفت بدر؟",
  "شنو تعرف عن تلفونه؟",
  "منو سوى القهوة بذيك الليلة؟",
  "الكاميرا مسجلة سيارة داخلة متأخر، شرايك؟",
  "منو عنده مفتاح احتياطي للغرفة؟",
  "في خلاف فلوس بينكم؟",
];
