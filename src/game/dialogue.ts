/**
 * Interrogation engine (demo stand-in for an AI-backed suspect).
 *
 * Design rules:
 * - Kuwaiti spoken dialect only, short lines, nothing volunteered.
 * - Answers are graded: a general question gets a general answer; a specific
 *   question, a repeated push, or a confrontation with unlocked evidence gets a
 *   more specific answer. Secrets only surface at the deepest level.
 * - Deterministic per (topic, how many times that topic was asked) so a suspect
 *   never invents a different story for the same question.
 * - Stress moves only from questions: normal ~0-3, sensitive medium, a
 *   contradiction bigger, evidence confrontation biggest. Repeating the same
 *   question stops mattering after the second time.
 * - Nobody ever names the killer.
 *
 * `generateSuspectReply` is the only export the UI uses, so a real AI call can
 * replace the body later without touching any component.
 */
import type { ChatMessage } from "./types";

export interface ReplyContext {
  suspectId: string;
  message: string;
  stress: number;
  /** Full transcript so far — the suspect's memory of the session. */
  transcript: ChatMessage[];
  unlockedEvidence: string[];
}

export interface ReplyResult {
  text: string;
  textEn?: string;
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

type Pressure = "general" | "sensitive" | "contradiction" | "evidence";

const TOPIC_KEYWORDS: Record<Topic, string[]> = {
  accuse: [
    "أنت قتلت",
    "انت قتلت",
    "قاتل",
    "تكذب",
    "كذاب",
    "اعترف",
    "متهم",
    "قتلته",
    "قتلت",
    "أنت اللي",
  ],
  phone: ["تلفون", "جوال", "موبايل", "هاتف"],
  camera: ["كاميرا", "تصوير", "المدخل", "بوابة", "سيارتك", "سيارة"],
  door: ["باب", "مفتاح", "مفاتيح", "قفل", "مقفل", "مسكر"],
  coffee: ["قهوة", "فنجال", "فنجالين", "كوب", "مهدئ", "دواء", "شرب"],
  money: ["فلوس", "دين", "تحويل", "تحويلات", "حساب", "الشركة", "شغل", "مال", "دينار", "محامي"],
  threat: ["تهديد", "رسالة", "رسائل", "وعيد", "هددت"],
  watch: ["ساعته", "الساعة المكسورة", "مكسور", "معصم", "زجاج", "1:47", "01:47", "وحدة وسبع"],
  relation: ["علاقة", "خطوبة", "خطيب", "خاتم", "حب", "زواج", "خلاف شخصي", "زعل", "انفصال"],
  alibi: ["وين كنت", "وين", "متى", "وقت", "الساعة", "طلعت", "رحت", "نمت", "كنت", "آخر مرة"],
  smalltalk: ["هلا", "سلام", "مرحبا", "شخبارك", "كيفك", "ارتاح"],
  default: [],
};

const AGGRESSIVE = ["اعترف", "كذاب", "تكذب", "قاتل", "اسكت", "بسرعة", "لا تلعب", "احنا نعرف"];
const CALM = ["لو سمحت", "بهدوء", "خذ وقتك", "ارتاح", "نبي نساعدك", "ما نتهمك", "على راحتك"];
const CONTRADICTION = [
  "بس قلت",
  "قبل قلت",
  "كلامك",
  "تناقض",
  "ليش قلت",
  "غيرت",
  "أول قلت",
  "قلت لنا",
  "مو نفس",
];

/** Topics that are specific enough to open the matching evidence file. */
const TOPIC_UNLOCK: Partial<Record<Topic, string>> = {
  watch: "watch",
  phone: "phone",
  coffee: "cup",
  threat: "message",
  money: "message",
  camera: "camera",
  door: "key",
};

/** How much a topic shakes each suspect (before pressure multipliers). */
const TOPIC_WEIGHT: Record<string, Partial<Record<Topic, number>>> = {
  fahad: { money: 9, accuse: 8, alibi: 5, phone: 4, door: 4, default: 1 },
  noura: { relation: 9, alibi: 8, accuse: 7, phone: 5, watch: 4, default: 1 },
  yousef: {
    camera: 12,
    door: 11,
    money: 10,
    coffee: 9,
    phone: 8,
    accuse: 7,
    threat: 8,
    default: 2,
  },
  dana: { accuse: 4, coffee: 3, watch: 3, default: 1 },
};

/** Lower = calmer suspect (different tolerance per character). */
const TOLERANCE: Record<string, number> = { fahad: 1, noura: 1.15, yousef: 0.9, dana: 0.55 };

/**
 * Graded answers: [general, pressed, confronted].
 * The last line is the closest thing to a slip — still no naming of the killer.
 */
type Lines = Partial<Record<Topic, string[]>> & { default: string[] };

const SCRIPTS: Record<string, Lines> = {
  fahad: {
    alibi: [
      "كنت بالصالة على ما أذكر، ليش؟",
      "نمت متأخر شوي... مو متأكد من الساعة بالضبط.",
      "زين، ما نمت من وحدة. كنت صاحي وسمعت خطوات بالممر.",
    ],
    money: [
      "إي أستلف منه، شنو فيها؟",
      "طلبت منه دفعة هاليلة ورفض. زعلت وخلاص.",
      "شوف... أنا محتاج فلوس، بس ما مديت يدي عليه وهو حي.",
    ],
    phone: [
      "تلفونه؟ ما لمسته.",
      "شفته معه بالقعدة، بعدها ما أدري.",
      "ما أخذته أنا. بس لو تبي الصدق، دخلت الغرفة بعدها.",
    ],
    door: [
      "الباب كان منسد.",
      "سمعت طقة، ظنيتها الباب الخارجي.",
      "المفاتيح معلقة بالمطبخ... وحد منها ناقص، لاحظتها بعدين.",
    ],
    camera: ["الكاميرا عند المدخل، أنا ما أقرب لها.", "إذا مسجلة شي عرضوه، ما يخصني."],
    coffee: ["بدر ما يشرب قهوة بالليل.", "ما شفت أحد يسوي قهوة بعد القعدة."],
    watch: ["ساعته كانت بيده، ما لاحظت عليها شي.", "مكسورة؟ ما دريت."],
    relation: ["هو ونورة شغلهم، ما أتدخل.", "كانوا متوترين، بس شي بينهم."],
    threat: ["أنا ما هددته أبد.", "وصله شي متعلق بالشغل، هذا اللي سمعته."],
    accuse: [
      "شكو أنا؟ اسألوا غيري.",
      "أنا صاحبه مو عدوه، لا تركبون علي.",
      "خلاص! في شي سويته وأنا خايف أقوله، بس ما له علاقة بموته.",
    ],
    smalltalk: ["هلا... خلنا نخلص بسرعة، أنا تعبان."],
    default: ["قلت اللي أعرفه.", "سؤال ثاني.", "والله ما عندي زيادة."],
  },
  noura: {
    alibi: [
      "طلعت من القعدة، مليت.",
      "حول وحدة وربع تقريباً... مو مركزة بالساعة.",
      "زين، رجعت! رجعت أرد الخاتم بس ما دخلت غرفته.",
    ],
    relation: [
      "انفصلنا قبل شهرين، هذا كل شي.",
      "أرسلت له رسائل، كنت أبي أنهي الموضوع بشكل محترم.",
      "الخاتم كان لازم أرده له بيدي... عشان كذا رجعت.",
    ],
    phone: [
      "تلفونه كان معه، شفته يقلب فيه.",
      "أنا ما أخذت منه شي.",
      "شفت أحد ياخذ شي من الغرفة... تلفون. بس لا تسألني منو.",
    ],
    watch: ["ساعته؟ لاحظتها.", "كانت مكسورة قبل ما أطلع، هذي أذكرها زين."],
    money: ["كان خايف من شي بالشغل، مو مني.", "قال لي «الموضوع أكبر من فلوس»، وسكت."],
    door: ["الباب كان مسكر وهو داخل.", "ما حاولت أفتحه، ما لي شغل."],
    camera: ["ما أدري شنو مسجلة.", "إذا فيها شي، هي تتكلم عني."],
    coffee: ["ما شفت قهوة.", "بدر يكره القهوة بالليل، هذي أكيدة."],
    threat: ["وصلته رسالة وتغير وجهه، بس مو مني."],
    accuse: [
      "أنا؟ الله يهديك...",
      "ما قتلته. أحبه، ولو ما نتزوج.",
      "أنا ساكتة عن شي لأن أحد عنده شي علي وعلى أهلي، مو لأني أنا اللي سويتها.",
    ],
    smalltalk: ["هلا... عذراً، عيوني تعبانة."],
    default: ["ما أعرف أكثر.", "خلوني أرتب أفكاري.", "قلت كل شي عندي."],
  },
  yousef: {
    alibi: [
      "طلعت قبل 12، اسألوا أي واحد.",
      "رحت البيت. أنا مشغول، ما أقعد لآخر الليل.",
      "أوكي... مريت مرة ثانية على الشاليه، بس ما دخلت عليه.",
    ],
    camera: [
      "الكاميرا؟ ما تشتغل أصلاً على ما أعتقد.",
      "ممكن مريت قريب من المدخل، شنو فيها؟",
      "زين، سيارتي هي. رحت أخذ أوراق من الشاليه ورجعت، بس ما دخلت غرفته.",
    ],
    door: [
      "عندي مفتاح، الشاليه شاليه شركة.",
      "الباب مو شغلتي، أنا ما كنت هناك بذاك الوقت.",
      "المفتاح الاحتياطي... كان معي، بس هذا ما يعني إني فتحت عليه.",
    ],
    money: [
      "خلافات شغل عادية بين شركاء.",
      "التحويلات موثقة، وأي ملاحظة تنحل بالمحاسب.",
      "بدر كان يبالغ ويبي محامي على شي يتحل بجلسة، إي زعلت، وأي واحد بمكاني يزعل.",
    ],
    coffee: [
      "ما شربت قهوة.",
      "شنو دخل القهوة؟ صرتوا تسألون سوالف مطبخ؟",
      "لو في فنجالين، مو معناها إني أنا. ما أرد على تفاصيل مطبخ.",
    ],
    phone: [
      "ليش أسأل عن تلفونه أنا؟",
      "ما أدري شنو صار فيه.",
      "خلصوا عن التلفون. ما أتكلم بهالنقطة أكثر.",
    ],
    threat: [
      "رسالة تهديد؟ كلمة كبيرة.",
      "كتبت له كلام بيني وبينه، وأي واحد يتضايق ويكتب.",
      "إي كتبته أنا. كنت أبي أوقف موضوع المحامي، مو أكثر.",
    ],
    watch: ["ساعته؟ ما لاحظت.", "ليش تركزون على تفاصيل صغيرة؟"],
    relation: ["هو ونورة ما يهمني، أنا شريك شغل."],
    accuse: [
      "انتبه على كلامك.",
      "قول اللي عندك دليل عليه، وإلا اسكت.",
      "خلاص، ما أتكلم أكثر بدون محامي.",
    ],
    smalltalk: ["يالله بسرعة، عندي التزامات."],
    default: ["ما عندي زيادة.", "أسئلتكم تلف بنفس المكان.", "أنا متعاون، بس لا تستهبلون علي."],
  },
  dana: {
    alibi: ["كنت بالحوش أغلب الوقت.", "دخلت المطبخ مرتين بس.", "بعد وحدة وشوي كنت صاحية، إي."],
    watch: [
      "سمعت صوت شي انكسر.",
      "زجاج تقريباً... بعد وحدة ونص بشوي.",
      "أذكر الوقت بالضبط: وحدة وسبعة وأربعين.",
    ],
    door: ["سمعت باب ينسد.", "بعد وحدة وخمسة وأربعين، متأكدة."],
    coffee: [
      "شفت فنجالين قهوة بالمطبخ.",
      "وهذا غريب، بدر ما يشرب قهوة بالليل.",
      "الفنجالين كانوا مستعملين، مو نظيفين.",
    ],
    camera: ["الكاميرا عند المدخل تسجل السيارات.", "شفت نور سيارة داخلة متأخر."],
    phone: ["كان يقلب بتلفونه ويكتب بجدية قبل ما يدخل."],
    money: ["سمعت كلمة «محامي» بينه وبين أحدهم، وما تدخلت."],
    relation: ["نورة كانت متضايقة، بس ما شفت منها شي غريب."],
    threat: ["تلفونه رن وتغير وجهه، شي ضايقه."],
    accuse: [
      "أنا ما أذي أحد.",
      "اسألوني بهدوء وأقول أكثر.",
      "عندي تسجيل صوتي من هاليلة، ما سلمته لأني خفت.",
    ],
    smalltalk: ["هلا. مستعدة أتكلم على راحتي."],
    default: ["أنا ألاحظ أكثر من إني أتكلم.", "اسألني سؤال محدد وأجاوبك.", "شنو تبي تعرف بالضبط؟"],
  },
};

const SCRIPTS_EN: Record<string, Lines> = {
  fahad: {
    alibi: [
      "I was in the living room, far as I remember. Why?",
      "I fell asleep a bit late... not totally sure of the exact time.",
      "Fine, I wasn't asleep from one. I was awake and heard footsteps in the hallway.",
    ],
    money: [
      "Yeah I borrowed from him, what about it?",
      "I asked him for money that night and he refused. I got upset, that's it.",
      "Look... I need money, but I never laid a hand on him while he was alive.",
    ],
    phone: [
      "His phone? I never touched it.",
      "I saw it with him at the gathering, after that I don't know.",
      "I didn't take it. But honestly, I did go into the room afterward.",
    ],
    door: [
      "The door was closed.",
      "I heard a click, thought it was the front door.",
      "The keys hang in the kitchen... one's missing, I noticed later.",
    ],
    camera: [
      "The camera's by the entrance, I don't go near it.",
      "If it recorded something, show it, it's not about me.",
    ],
    coffee: [
      "Badr doesn't drink coffee at night.",
      "I didn't see anyone make coffee after the gathering.",
    ],
    watch: [
      "His watch was on his wrist, I didn't notice anything about it.",
      "Broken? I had no idea.",
    ],
    relation: [
      "He and Noura, that's their business, I don't get involved.",
      "They were tense, something was between them.",
    ],
    threat: ["I never threatened him.", "Something work-related reached him, that's all I heard."],
    accuse: [
      "Me? Ask someone else.",
      "I'm his friend not his enemy, don't pin this on me.",
      "Fine! There's something I did and I'm scared to say it, but it has nothing to do with his death.",
    ],
    smalltalk: ["Hey... let's wrap this up fast, I'm tired."],
    default: ["I said what I know.", "Next question.", "I swear I've got nothing more."],
  },
  noura: {
    alibi: [
      "I left the gathering, I was bored.",
      "Around one fifteen or so... I wasn't watching the clock.",
      "Fine, I came back! I came back to return the ring but I didn't go into his room.",
    ],
    relation: [
      "We broke up two months ago, that's all.",
      "I sent him messages, I wanted to end things respectfully.",
      "I had to return the ring in person... that's why I came back.",
    ],
    phone: [
      "His phone was with him, I saw him scrolling through it.",
      "I didn't take anything from him.",
      "I saw someone take something from the room... a phone. But don't ask me who.",
    ],
    watch: [
      "His watch? I noticed it.",
      "It was already cracked before I left, I remember that clearly.",
    ],
    money: [
      "He was scared of something work-related, not from me.",
      "He told me 'this is bigger than money' and went quiet.",
    ],
    door: [
      "The door was shut while he was inside.",
      "I didn't try to open it, none of my business.",
    ],
    camera: ["I don't know what it recorded.", "If it shows something, it's probably about me."],
    coffee: ["I didn't see any coffee.", "Badr hates coffee at night, I'm sure of that."],
    threat: ["A message arrived and his face changed, but it wasn't from me."],
    accuse: [
      "Me? God help you...",
      "I didn't kill him. I love him, even if we won't marry.",
      "I'm staying quiet about something because someone has leverage over me and my family, not because I did it.",
    ],
    smalltalk: ["Hi... sorry, my eyes are tired."],
    default: ["I don't know more.", "Let me gather my thoughts.", "I said everything I have."],
  },
  yousef: {
    alibi: [
      "I left before midnight, ask anyone.",
      "I went home. I'm busy, I don't stay up late.",
      "Okay... I passed by the chalet again, but I didn't go in to see him.",
    ],
    camera: [
      "The camera? I don't think it even works.",
      "Maybe I passed near the entrance, what about it?",
      "Fine, it's my car. I went to get some papers from the chalet and came back, but I didn't go into his room.",
    ],
    door: [
      "I have a key, it's a company chalet.",
      "The door isn't my concern, I wasn't there at that time.",
      "The spare key... I had it, but that doesn't mean I opened it on him.",
    ],
    money: [
      "Normal business disputes between partners.",
      "The transfers are documented, any concern goes through the accountant.",
      "Badr was exaggerating, wanting a lawyer over something solvable in a meeting, yes I was upset, and anyone in my place would be.",
    ],
    coffee: [
      "I didn't drink coffee.",
      "What's coffee got to do with anything? Are we down to kitchen gossip now?",
      "Two cups doesn't mean it was me. I won't answer kitchen details.",
    ],
    phone: [
      "Why would I be asked about his phone?",
      "I don't know what happened to it.",
      "Enough about the phone. I'm done discussing this point.",
    ],
    threat: [
      "A threatening message? Strong words.",
      "I wrote him something between us, and anyone annoyed writes things.",
      "Yes, I wrote it. I wanted to stop the lawyer thing, nothing more.",
    ],
    watch: ["His watch? I didn't notice.", "Why are you focused on tiny details?"],
    relation: ["Him and Noura don't concern me, I'm a business partner."],
    accuse: [
      "Watch your words.",
      "Say what you have proof of, or stay quiet.",
      "That's it, I won't say more without a lawyer.",
    ],
    smalltalk: ["Come on, hurry up, I have commitments."],
    default: [
      "I've got nothing more.",
      "Your questions keep circling the same spot.",
      "I'm cooperating, don't push it.",
    ],
  },
  dana: {
    alibi: [
      "I was in the yard most of the time.",
      "I went into the kitchen twice only.",
      "After one and a bit I was awake, yes.",
    ],
    watch: [
      "I heard something break.",
      "Sounded like glass... around one thirty something.",
      "I remember the exact time: one forty-seven.",
    ],
    door: ["I heard a door shut.", "After one forty-five, I'm sure of it."],
    coffee: [
      "I saw two coffee cups in the kitchen.",
      "And that's strange, Badr doesn't drink coffee at night.",
      "The cups were used, not clean.",
    ],
    camera: [
      "The camera by the entrance records the cars.",
      "I saw headlights of a car coming in late.",
    ],
    phone: ["He was scrolling on his phone, typing seriously before he went in."],
    money: ["I heard the word 'lawyer' between him and someone, and I didn't get involved."],
    relation: ["Noura seemed upset, but I didn't see anything strange from her."],
    threat: ["His phone rang and his face changed, something bothered him."],
    accuse: [
      "I wouldn't hurt anyone.",
      "Ask me gently and I'll say more.",
      "I have an audio recording from that night, I haven't handed it over because I was scared.",
    ],
    smalltalk: ["Hi. I'm ready to talk, on my own pace."],
    default: [
      "I observe more than I talk.",
      "Ask me something specific and I'll answer.",
      "What exactly do you want to know?",
    ],
  },
};

function detectTopic(message: string): Topic {
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
    if (TOPIC_KEYWORDS[topic].some((k) => message.includes(k))) return topic;
  }
  return "default";
}

const SENSITIVE: Topic[] = ["money", "camera", "door", "coffee", "phone", "threat", "accuse"];

export function generateSuspectReply(ctx: ReplyContext): ReplyResult {
  const message = ctx.message.trim();
  let topic = detectTopic(message);
  const isContradiction = CONTRADICTION.some((k) => message.includes(k));
  // "you said something else before" has no topic of its own — it lands on the
  // last real subject the investigator raised (session memory).
  if (isContradiction && (topic === "default" || topic === "smalltalk")) {
    for (let i = ctx.transcript.length - 1; i >= 0; i--) {
      const m = ctx.transcript[i]!;
      if (m.role !== "investigator") continue;
      const t = detectTopic(m.text);
      if (t !== "default" && t !== "smalltalk") {
        topic = t;
        break;
      }
    }
  }
  const script = SCRIPTS[ctx.suspectId] ?? SCRIPTS["fahad"]!;
  const weights = TOPIC_WEIGHT[ctx.suspectId] ?? {};
  const tolerance = TOLERANCE[ctx.suspectId] ?? 1;

  // Memory: how many times this topic was already asked in this session.
  const asked = ctx.transcript.filter(
    (m) => m.role === "investigator" && detectTopic(m.text) === topic,
  ).length;

  const evidenceId = TOPIC_UNLOCK[topic];
  const confrontedWithEvidence = !!evidenceId && ctx.unlockedEvidence.includes(evidenceId);
  const contradiction = isContradiction;
  const aggressive = AGGRESSIVE.some((k) => message.includes(k));
  const calm = CALM.some((k) => message.includes(k));

  const pressure: Pressure = confrontedWithEvidence
    ? "evidence"
    : contradiction
      ? "contradiction"
      : SENSITIVE.includes(topic)
        ? "sensitive"
        : "general";

  // ---- stress: questions only, never time ----
  const base = weights[topic] ?? weights.default ?? 1;
  const multiplier =
    pressure === "evidence"
      ? 1.9
      : pressure === "contradiction"
        ? 1.5
        : pressure === "sensitive"
          ? 1
          : 0.4;
  let delta = base * multiplier;
  if (aggressive) delta += 4;
  if (calm) delta -= 3;
  // repeating the same question only counts the first extra time
  if (asked === 1) delta += 2;
  else if (asked > 1) delta = Math.min(delta, 2);
  if (topic === "smalltalk" || topic === "default") delta = Math.min(delta, 1);
  if (contradiction) delta = Math.max(delta, 5);

  // ---- answer depth: general → pressed → confronted ----
  const lines = script[topic] ?? script.default;
  let level = Math.min(asked, lines.length - 1);
  if (pressure === "evidence" || pressure === "contradiction") level = lines.length - 1;
  // never reveal the deepest line in the very first exchange
  const totalAsked = ctx.transcript.filter((m) => m.role === "investigator").length;
  if (totalAsked < 1) level = 0;
  if (
    level === lines.length - 1 &&
    lines.length > 1 &&
    ctx.stress < 28 &&
    pressure !== "evidence"
  ) {
    level = Math.max(0, lines.length - 2);
  }

  const text = lines[level] ?? lines[0] ?? "...";
  const scriptEn = SCRIPTS_EN[ctx.suspectId] ?? SCRIPTS_EN["fahad"]!;
  const linesEn = scriptEn[topic] ?? scriptEn.default;
  const textEn = linesEn[level] ?? linesEn[0] ?? text;

  // Evidence opens only from a specific question about it, never from time.
  const unlock = evidenceId && !ctx.unlockedEvidence.includes(evidenceId) ? evidenceId : undefined;

  const result: ReplyResult = {
    text,
    textEn,
    stressDelta: Math.max(-4, Math.round(delta * tolerance)),
    topic,
  };
  if (unlock) result.unlock = unlock;
  return result;
}

export const suggestedQuestionsEn = [
  "Where were you at 1:30?",
  "When did you last see Bader?",
  "What do you know about his phone?",
  "Who made the coffee that night?",
  "The camera caught a car coming in late — what about it?",
  "Who else has a spare key to the room?",
  "Is there money trouble between you?",
  "You told us something different earlier — why did your story change?",
];

export const suggestedQuestions = [
  "وين كنت الساعة وحدة ونص؟",
  "متى آخر مرة شفت بدر؟",
  "شنو تعرف عن تلفونه؟",
  "منو سوى القهوة بذيك الليلة؟",
  "الكاميرا مسجلة سيارة داخلة متأخر، شرايك؟",
  "منو عنده مفتاح احتياطي للغرفة؟",
  "في خلاف فلوس بينكم؟",
  "بس قلت لنا شي ثاني قبل، ليش غيرت كلامك؟",
];
