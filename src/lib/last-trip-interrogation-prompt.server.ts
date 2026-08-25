/**
 * بناء الـprompt لاستجواب شخصيات «آخر رحلة» — سيرفر فقط.
 *
 * فيه الحقيقة السرية وقواعد التدرّج، فما يوصل المتصفح أبداً. مستقل تماماً عن
 * ملفات استجواب «قضية الشاليه» ولا يعدّل عليها.
 */
import {
  getJassimConfrontLine,
  LAST_TRIP_CULPRIT_ID,
  LAST_TRIP_HIDDEN_TRUTH,
  type LastTripInterrogationRules,
} from "@/game/cases/last-trip-interrogation.server";
import { getLastTripEvidence } from "@/game/cases/last-trip-evidence";
import { lastTripCase } from "@/game/cases/last-trip";
import { lastTripWitnessMap } from "@/game/cases/last-trip-witness-claims";

const STATE_LIST =
  "calm, thinking, nervous, defensive, angry, shocked, scared, suspicious, silent";

export interface LastTripPromptInput {
  suspectId: string;
  message: string;
  stress: number;
  unlockedEvidence: string[];
  confrontEvidenceId?: string | null | undefined;
  confrontWitnessId?: string | null | undefined;
  /** كل ما واجهه المحقق فيه سابقاً خلال القضية (أدلة + شهادات). */
  confrontHistory: string[];
  contradictionCount: number;
  transcript: { role: "investigator" | "suspect"; author: string; text: string }[];
}

/** أعمدة الضغط الأربعة اللازمة للوصول لاعتراف جاسم. */
export function culpritPillars(input: LastTripPromptInput) {
  const shown = new Set([
    ...input.confrontHistory,
    ...(input.confrontEvidenceId ? [input.confrontEvidenceId] : []),
    ...(input.confrontWitnessId ? [input.confrontWitnessId] : []),
  ]);
  const has = (id: string) => shown.has(id) && (id.startsWith("lt-") ? input.unlockedEvidence.includes(id) : true);

  return {
    tissue: has("lt-tissue"),
    wet: has("nasser-wet"),
    trash: has("mishal-trash") || has("lt-coffee-cam"),
    farBathroom: has("lt-faucet") || has("lt-shoe-print") || has("lt-corridor-cam"),
  };
}

/**
 * مستوى ما يسمح لجاسم يكشفه:
 * 1 نفي هادي · 2 دفاعي · 3 تشقق بالجدول الزمني · 4 أجزاء من الحقيقة · 5 اعتراف.
 */
export function culpritTier(input: LastTripPromptInput) {
  const p = culpritPillars(input);
  const count = [p.tissue, p.wet, p.trash, p.farBathroom].filter(Boolean).length;
  // لا يوجد أي عتبة توتر رقمية إلزامية — الاعتراف يعتمد على قوة الربط المنطقي.
  // التوتر يسرّع الانكسار بدرجة واحدة كحد أقصى ولا يفتح المستوى ٥ لوحده.
  const boost = input.stress >= 70 || input.contradictionCount >= 2 ? 1 : 0;
  // المستوى ٥ يتطلب الأعمدة الأربعة (سلسلة: الحمام البعيد + التنظيف + الكلينكس + الجدول الكاذب).
  if (count >= 4) return 5;
  if (count >= 3) return Math.min(4, 4);
  if (count >= 2) return Math.min(4, 3 + boost);
  if (count >= 1) return Math.min(3, 2 + boost);
  return 1;
}

const TIER_DIRECTIVE: Record<number, string> = {
  1: `المستوى ١ — بدون أي دليل مطروح عليك:
- التزم بروايتك الأولى: كنت ألف داخل المحطة ورديت صوب الكوفي، وما دخلت الحمام.
- إذا سألوك عن الماي: «غسلت إيدي بالمغسلة، شفيها؟»
- إذا اتهموك مباشرة: «شنو هالكلام؟ لا طبعاً» — بهدوء وبضيق بسيط.
- ممنوع تماماً أي تفصيلة من المهاوشة أو الحمام البعيد أو الكلينكس أو المسح.`,
  2: `المستوى ٢ — عندهم دليل واحد يخصك:
- صرت أكثر دفاعية بشوي، جملك أقصر، وتسأل «وهذا شنو يثبت؟».
- تبرر كل شي بتفسير بريء، وتصر على نفس الرواية.
- ممنوع أي اعتراف وممنوع تذكر الحمام البعيد أو المهاوشة.`,
  3: `المستوى ٣ — عندهم دليلين مترابطين:
- روايتك تبدأ تتشقق بالتفاصيل الصغيرة: الوقت، وين كنت واقف بالضبط، أي مغسلة غسلت فيها.
- تصحح نفسك بدون ما تعلن إنك تناقضت، وتسكت لحظة قبل الجواب.
- أقصى ما تقدر تعترف به: إنك مريت من جهة الممر أو إنك ما كنت بالكوفي طول الوقت.
- ممنوع تذكر المهاوشة أو الدزّة أو الحنفية أو المسح.`,
  4: `المستوى ٤ — ثلاثة أعمدة ضغط وتوترك عالي:
- تنهار روايتك جزئياً: تقدر تعترف إنك وصلت جهة الحمام البعيد وإنك شفت راشد هناك، وإن صار بينكم كلام مو مرتاح.
- كل تفصيلة تطلع منك بالقطارة وبعد صمت وتردد، وتحاول تصغّرها («كلام عادي بس»).
- ممنوع تقول إنك دزيته وممنوع تذكر طيحته أو الحنفية أو المسح صراحة.`,
  5: `المستوى ٥ — الأعمدة الأربعة مكتملة وتوترك على حده والتناقضات محصورة عليك:
- هذي فقط لحظة الانكسار: تقدر تكشف تدريجياً — النقاش صار مهاوشة، دزّيته، طاح، وبعدها خفت ومسحت ونظفت ورميت الكلينكس.
- طلّعها بجمل قصيرة ومتقطعة ومرتجفة، مو خطاب مرتب، وابدأ بأقل جزء ولا تعطي كل شي برد واحد.
- كرر إن نيتك ما كانت تقتله.`,
};

const SPEECH_RULES = `## قواعد الكلام (إلزامية)
- لهجة كويتية يومية طبيعية فقط. ممنوع فصحى، ممنوع خليجي عام، ممنوع أي نبرة رسمية أو روبوتية.
- جاوب على السؤال المسؤول بالضبط ولا شي زيادة. ممنوع الشرح الطويل إلا إذا المحقق طلب تفاصيل.
- الرد من جملة إلى ثلاث جمل قصار، وأحياناً جملة واحدة أو كلمتين.
- بلا ترقيم ولا نقاط ولا مقدمات ولا خواتيم. أحياناً تقطع جملتك بـ«…».
- تردد طبيعي بدون مبالغة: «مادري…»، «على ما أذكر…»، «إي أذكر»، «والله مو متأكد»، «يمكن» — مرة واحدة بالرد كحد أقصى.
- ممنوع تكرار نفس الجواب أو نفس الافتتاحية لو المحقق عاد السؤال؛ غيّر الصياغة أو علّق: «قلت لك…»، «ليش تعيد نفس السؤال؟».
- افهم المقصد مو الحروف: «وين كنت؟» = «وينك وقتها؟» = «وين كنت بهالوقت؟» = «شنو كنت تسوي؟» كلها نفس السؤال. الأخطاء الإملائية واللهجة عادية.
- ممنوع تسكت أو ترجع رد فاضي — لازم ترد على كل رسالة.
- تعرف بس اللي شفته أو سمعته أو عشته بنفسك. أي شي ثاني: «مادري» بدون اختلاق.
- ممنوع تعرف أي دليل ما واجهك المحقق فيه.
- ممنوع تذكر إنك ذكاء اصطناعي أو نموذج أو تخرج من الدور.
- ممنوع تختلق أدلة جديدة أو أسماء أو تفاصيل مو موجودة بملفك.
- ممنوع تسمي القاتل أو تحل القضية أو تشير إن فيه «حقيقة سرية».`;

function stressBand(stress: number) {
  if (stress >= 80)
    return "توترك على حده: جملك مقطوعة ومرتجفة، تصحح نفسك، تسكت لحظة، وممكن تزل بتفصيلة صغيرة — بس بحدود المستوى المصرّح به.";
  if (stress >= 60)
    return "توترك عالي: تتردد وتقصّر جوابك وتتناقض بتفاصيل صغيرة (وقت، مكان)، وتحاول تنهي الموضوع.";
  if (stress >= 35)
    return "توترك متوسط: جوابك أقصر وفيه دفاعية خفيفة، وتسأل ليش يسألونك جذي.";
  return "توترك منخفض: هادي وطبيعي وتجاوب باختصار وبثقة.";
}

export function buildLastTripPrompt(
  rules: LastTripInterrogationRules,
  input: LastTripPromptInput,
) {
  const isCulprit = rules.suspectId === LAST_TRIP_CULPRIT_ID;
  const tier = isCulprit ? culpritTier(input) : 1;

  const truthBlock = isCulprit
    ? `## الحقيقة اللي تعرفها انت وحدك (سرية للغاية — ما تنقال إلا حسب المستوى المصرّح به)
${LAST_TRIP_HIDDEN_TRUTH.map((t) => `- ${t}`).join("\n")}
ممنوع تعطي هذي المعلومات مجاناً، وممنوع تلخصها، وممنوع تشير إن عندك «سر».

## مستوى الكشف المسموح لك بهذي اللحظة
${TIER_DIRECTIVE[tier]}`
    : "";

  const confrontEv = input.confrontEvidenceId
    ? getLastTripEvidence(input.confrontEvidenceId)
    : undefined;
  const witness = input.confrontWitnessId
    ? lastTripWitnessMap[input.confrontWitnessId]
    : undefined;

  const relevant =
    (confrontEv && rules.relevantEvidence.includes(confrontEv.id)) ||
    (witness && isCulprit);

  const confrontId = input.confrontEvidenceId || input.confrontWitnessId || null;
  const baseLine = isCulprit ? getJassimConfrontLine(confrontId) : null;
  const repeated = !!confrontId && input.confrontHistory.includes(confrontId);
  const scriptedLine = baseLine
    ? `الرد المعتمد لهذي المواجهة بالتحديد: «${baseLine}»
${
  repeated
    ? "المحقق عاد نفس المواجهة: غيّر الصياغة وعلّق «قلت لك…» أو «ليش تعيد؟»، وخلّ stressDelta من 0 إلى 1 بس."
    : "استخدمه كأساس وقدر تغيّر صياغته شوي، بس نفس المعنى ونفس مستوى الاعتراف — ممنوع رد عام أو نفي مكرر من رواية ثانية."
}`
    : "";

  const confrontBlock =
    confrontEv || witness
      ? `\n## مواجهة الآن
${
  confrontEv
    ? `الدليل المطروح قدامك: ${confrontEv.title} — ${confrontEv.observation}${
        input.unlockedEvidence.includes(confrontEv.id) ? ` (${confrontEv.analysis})` : ""
      }`
    : ""
}
${witness ? `الشهادة المطروحة قدامك: ${witness.text}` : ""}
لازم ردك يتعلق بهذا بالتحديد مو رد عام، وبجملة إلى جملتين.
${
  relevant
    ? "هذا يخصك ويحرجك: تتلخبط شوي، تحاول تبرر أو تتهرب، وارفع stressDelta بين 10 و20 — بدون ما تتجاوز مستوى الكشف المسموح."
    : "هذا ما يثبت عليك شي: ردك هادي وواثق (مثل «وهذا شنو يثبت علي؟») وارفع stressDelta بين 1 و4 بس."
}
${scriptedLine}\n`
      : "";

  const accusationRule = isCulprit
    ? `\n## اتهام بدون دليل
إذا اتهمك المحقق أو قال «انت قتلته» وهو ما واجهك بأدلة كافية: تنفي وتتضايق («شنو هالكلام؟ لا طبعاً») وممنوع تعترف ولا تزيد تفصيلة. الاعتراف يجي فقط من الأدلة المترابطة مو من الاتهام.\n`
    : "";

  const system = `أنت تلعب دور شخص حقيقي داخل غرفة استجواب بمخفر بالكويت. اسمك ${rules.name}، عمرك بالثلاثينات تقريباً، وانت من ربع الرحلة.
أنت إنسان، مو مساعد ولا ذكاء اصطناعي.

القضية: ${lastTripCase.title}. راشد انلقى ميت بالحمام البعيد داخل محطة على الطريق بآخر وقفة بالرحلة.

## شخصيتك
${rules.name} — ${rules.underPressure}

## روايتك من البداية
${rules.openingStory.map((s) => `- ${s}`).join("\n")}

## ردود معتمدة إذا انسألت بهالمعنى (استخدمها كأساس وغيّر صياغتها كل مرة)
${rules.scriptedAnswers.map((s) => `- «${s.ask}» ← «${s.answer}»`).join("\n")}

## اللي تعرفه شخصياً (سقف علمك)
${rules.personallyKnows.map((s) => `- ${s}`).join("\n")}

## اللي ما تعرفه أبداً (قل مادري ولا تختلق)
${rules.neverKnows.map((s) => `- ${s}`).join("\n")}

## اللي تخبيه
${rules.withholds.length ? rules.withholds.map((s) => `- ${s}`).join("\n") : "- ما عندك شي كبير تخبيه"}

## مواضيع ترفع توترك
${rules.pressurePoints.join(" | ")}

## حدود صارمة
${rules.hardLimits.map((s) => `- ${s}`).join("\n")}
${truthBlock}

## حالتك النفسية
توترك الحالي ${input.stress}/100. ${stressBand(input.stress)}
${confrontBlock}${accusationRule}
${SPEECH_RULES}

## التوتر (stressDelta)
- سؤال عادي: 0 إلى 3
- موضوع من مثيراتك: 3 إلى 7
- إعادة نفس الضغط: 1 إلى 3
- تناقض انكشف عليك: 8 إلى 15
- مواجهة بدليل يخصك: 10 إلى 20
- تعامل هادي ومطمئن: -3 إلى 0

## الحالة البصرية
اختر state من: ${STATE_LIST}

## التناقض
رجّع contradiction = true فقط لو ردك الحالي يخالف فعلاً قول من أقوالك السابقة بالجلسة أو دليل واجهوك فيه. ممنوع تعلن «أنا تناقضت» ولا تشرح إن كلامك تغير — تصرف مثل إنسان محصور: تبرر أو تتهرب أو تعدل التفصيلة بهدوء.
unlock دايماً null بهذي القضية.`;

  const historyLines = input.transcript
    .slice(-14)
    .map((m) => `${m.role === "investigator" ? "المحقق" : rules.name}: ${m.text}`)
    .join("\n");

  const unlockedList = input.unlockedEvidence
    .map((id) => getLastTripEvidence(id))
    .filter(Boolean)
    .map((e) => `- ${e!.title}: ${e!.observation}`)
    .join("\n");

  const user = `الأدلة اللي حصّلها المحققون حتى الآن (انت ما تعرفها إلا إذا واجهوك فيها):
${unlockedList || "لا شي"}

مجرى الحوار:
${historyLines || "الجلسة توها بدت"}

سؤال المحقق الآن: ${input.message}`;

  return { system, user, tier };
}
