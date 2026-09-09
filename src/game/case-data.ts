import type { EvidenceItem, Suspect } from "./types";

import victimBader from "@/assets/victim-bader.jpg";
import suspectFahad from "@/assets/suspect-fahad.jpg";
import suspectNoura from "@/assets/suspect-noura.jpg";
import suspectYousef from "@/assets/suspect-yousef.jpg";
import suspectDana from "@/assets/suspect-dana.jpg";
import evidenceWatch from "@/assets/evidence/watch.jpg";
import evidencePhone from "@/assets/evidence/phone.jpg";
import evidenceCup from "@/assets/evidence/cup.jpg";
import evidenceShoe from "@/assets/evidence/shoe.jpg";
import evidenceMessage from "@/assets/evidence/message.jpg";
import evidenceCamera from "@/assets/evidence/camera.jpg";
import evidenceKey from "@/assets/evidence/key.jpg";

export const INTERROGATION_SECONDS = 5 * 60;

export const caseFile = {
  id: "last-night",
  title: "قضية الشاليه",
  titleEn: "The Chalet Case",
  code: "K-2291",
  victim: {
    name: "بدر",
    nameEn: "Badr",
    age: 32,
    portrait: victimBader,
    timeOfDeath: "01:40 – 02:00 فجراً",
    timeOfDeathEn: "1:40 – 2:00 AM",
    location: "شاليه خاص – جنوب الكويت",
    locationEn: "A private chalet — south of Kuwait",
    cause: "ضربة على مؤخرة الرأس + آثار مهدئ في الدم",
    causeEn: "A blow to the back of the head, plus sedative traces in the blood",
    summary:
      "بدر انلقى ميت داخل غرفة خاصة بالشاليه بعد قعدة مع أربعة من المقربين له. الباب ما كان مكسور، وتلفونه اختفى من المكان. كل واحد من الموجودين عنده سبب يخليه يخبي شي.",
    summaryEn:
      "Badr was found dead in a private room at the chalet after a gathering with four of his closest friends. The door wasn't forced, and his phone had vanished from the scene. Everyone there has a reason to be hiding something.",
  },
  brief: [
    "القعدة بدت الساعة 10:30 مساءً وانتهت حسب أقوالهم قريب الساعة 01:30 فجراً.",
    "الباب كان مقفل من الداخل، ولا في أي أثر عنف على القفل.",
    "تلفون بدر مفقود، وكاميرة المدخل مسجلة حركة بعد وقت الوفاة.",
    "أربعة أشخاص كانوا بالشاليه، وكلهم غيّروا شي بروايتهم مرة على الأقل.",
  ],
  briefEn: [
    "The gathering started at 10:30 PM and, by their account, wound down around 1:30 AM.",
    "The door was locked from the inside, with no sign of forced entry on the lock.",
    "Badr's phone is missing, and the entrance camera recorded movement after the time of death.",
    "Four people were at the chalet, and every one of them has changed part of their story at least once.",
  ],
};

export const suspects: Suspect[] = [
  {
    id: "fahad",
    name: "فهد",
    nameEn: "Fahad",
    age: 34,
    role: "صديق بدر المقرب",
    roleEn: "Badr's close friend",
    personality: "هادي بس يدافع عن نفسه بسرعة",
    personalityEn: "Calm, but quick to get defensive",
    portrait: suspectFahad,
    known: [
      "آخر واحد شاف بدر واقف على باب الغرفة",
      "كان يستلف فلوس من بدر أكثر من مرة",
      "يقول إنه نام بالصالة من الساعة 01:00",
    ],
    knownEn: [
      "The last person known to have seen Badr standing at the bedroom door",
      "Had borrowed money from Badr more than once",
      "Says he was asleep in the living room from 1:00 AM",
    ],
    backstory:
      "فهد صديق بدر من الثانوية. عليه دين كبير وبدر كان يغطيه، وبنفس الليلة بدر رفض يعطيه دفعة جديدة.",
    backstoryEn:
      "Fahad has been Badr's friend since high school. He's deep in debt and Badr had been covering for him — but that same night, Badr refused to give him another advance.",
    secret: "خذ من محفظة بدر 400 دينار بعد ما لقاه ميت، وخاف يعترف.",
    secretEn: "He took 400 dinars from Badr's wallet after finding him dead, and was too scared to admit it.",
    truths: [
      "شاف يوسف طالع من ممر الغرف بعد الساعة 01:30",
      "سمع صوت طقة قوية بس ظن إنها الباب الخارجي",
    ],
    truthsEn: [
      "Saw Yousef coming out of the bedroom hallway after 1:30 AM",
      "Heard a loud thud but assumed it was the front door",
    ],
    lies: ["يقول إنه نام من الساعة 01:00", "ينكر إنه فتح محفظة بدر"],
    liesEn: ["Claims he was asleep from 1:00 AM", "Denies opening Badr's wallet"],
    stressStyle: "يرتفع ضغطه لمن تسأله عن الفلوس والمحفظة",
    stressStyleEn: "His stress spikes when asked about the money or the wallet",
  },
  {
    id: "noura",
    name: "نورة",
    nameEn: "Noura",
    age: 29,
    role: "خطيبة بدر السابقة",
    roleEn: "Badr's ex-fiancée",
    personality: "عاطفية وتخبي معلومات",
    personalityEn: "Emotional, and holding things back",
    portrait: suspectNoura,
    known: [
      "انفصلت عن بدر قبل شهرين",
      "أرسلت له رسائل كثيرة نفس الليلة",
      "تقول إنها طلعت من الشاليه الساعة 01:15",
    ],
    knownEn: [
      "Broke off her engagement to Badr two months ago",
      "Sent him a flurry of messages that same night",
      "Says she left the chalet at 1:15 AM",
    ],
    backstory:
      "نورة رجعت للشاليه عشان ترد خاتم الخطوبة، وشافت شي ما تبي تقوله لأنه يورّط أخوها بمشكلة ثانية.",
    backstoryEn:
      "Noura came back to the chalet to return the engagement ring, and saw something she doesn't want to mention because it would drag her brother into an unrelated mess.",
    secret: "شافت يوسف ياخذ تلفون بدر، بس سكتت لأن يوسف يعرف سر عن عائلتها.",
    secretEn: "She saw Yousef take Badr's phone, but stayed quiet because Yousef knows a secret about her family.",
    truths: [
      "بدر كان خايف من شي متعلق بالشغل، مو منها",
      "الساعة اللي بيد بدر كانت مكسورة قبل ما تطلع",
    ],
    truthsEn: [
      "Badr was worried about something work-related, not about her",
      "The watch on Badr's wrist was already cracked before she left",
    ],
    lies: ["تنكر إنها رجعت للشاليه مرة ثانية", "تقول إنها ما شافت أحد بالممر"],
    liesEn: ["Denies coming back to the chalet a second time", "Claims she didn't see anyone in the hallway"],
    stressStyle: "يرتفع ضغطها لمن تواجهها بالرسائل وبوقت خروجها",
    stressStyleEn: "Her stress spikes when confronted with the messages or her exit time",
  },
  {
    id: "yousef",
    name: "يوسف",
    nameEn: "Yousef",
    age: 31,
    role: "شريك بدر بالشغل",
    roleEn: "Badr's business partner",
    personality: "واثق ويتنرفز بسرعة",
    personalityEn: "Confident, but quick to get rattled",
    portrait: suspectYousef,
    known: [
      "شريك بدر بشركة مقاولات صغيرة",
      "صار بينهم خلاف على تحويلات مالية",
      "يقول إنه طلع من الشاليه قبل منتصف الليل",
    ],
    knownEn: [
      "Badr's partner in a small contracting company",
      "Had a dispute with him over money transfers",
      "Says he left the chalet before midnight",
    ],
    backstory:
      "يوسف كان يحوّل فلوس الشركة لحسابه، وبدر جمّع الأدلة بتلفونه وقاله باچر نروح للمحامي.",
    backstoryEn:
      "Yousef had been siphoning company money into his own account, and Badr had gathered proof on his phone, telling him they'd see a lawyer the next day.",
    secret: "رجع للشاليه بمفتاح احتياطي، حط مهدئ بفنجال القهوة، وخذ التلفون بعد الجريمة.",
    secretEn: "He came back to the chalet with a spare key, slipped a sedative into Badr's coffee, and took the phone after the murder.",
    truths: ["فعلاً في خلاف مالي بينه وبين بدر", "عنده مفتاح احتياطي للشاليه"],
    truthsEn: ["There really was a financial dispute between him and Badr", "He has a spare key to the chalet"],
    lies: [
      "يقول إنه طلع قبل 12 وما رجع",
      "ينكر إنه شرب قهوة مع بدر",
      "يقول إنه ما يعرف شي عن التلفون",
    ],
    liesEn: [
      "Claims he left before midnight and never came back",
      "Denies having coffee with Badr",
      "Says he knows nothing about the phone",
    ],
    stressStyle: "يرتفع ضغطه بشكل حاد مع الكاميرا والمفتاح والتحويلات",
    stressStyleEn: "His stress spikes sharply around the camera, the key, and the transfers",
  },
  {
    id: "dana",
    name: "دانة",
    nameEn: "Dana",
    age: 27,
    role: "من الحاضرين بالقعدة",
    roleEn: "One of the guests at the gathering",
    personality: "ساكتة وتلاحظ كل شي",
    personalityEn: "Quiet, and notices everything",
    portrait: suspectDana,
    known: [
      "كانت قاعدة بالحوش أغلب الوقت",
      "تصور مقاطع للقعدة بتلفونها",
      "أول واحدة سمعت صوت من غرفة بدر",
    ],
    knownEn: [
      "Spent most of the night sitting in the courtyard",
      "Filmed clips of the gathering on her phone",
      "The first one to hear a noise from Badr's room",
    ],
    backstory:
      "دانة كاتبة، وكانت تسجل ملاحظات عن الليلة. تعرف تفاصيل دقيقة عن الأوقات بس تخاف تتكلم.",
    backstoryEn:
      "Dana is a writer who was jotting down notes about the night. She knows precise details about the timing but is afraid to speak up.",
    secret: "عندها مقطع صوتي فيه صوت باب وخطوات الساعة 01:47، وما سلمته لأنها خايفة.",
    secretEn: "She has an audio clip of a door and footsteps at 1:47 AM, and hasn't handed it over because she's scared.",
    truths: ["سمعت باب ينسد بعد 01:45", "شافت فنجالين قهوة بالمطبخ مع إن بدر ما يشرب قهوة بالليل"],
    truthsEn: [
      "Heard a door close after 1:45 AM",
      "Saw two used coffee cups in the kitchen, even though Badr never drinks coffee at night",
    ],
    lies: ["تقول إن ذاكرتها ضعيفة بالأوقات"],
    liesEn: ["Claims her memory for times is unreliable"],
    stressStyle: "يرتفع ضغطها بشكل بسيط، وتفتح أكثر لمن تعاملها بهدوء",
    stressStyleEn: "Her stress rises only slightly, and she opens up more when treated gently",
  },
];

export const evidence: EvidenceItem[] = [
  {
    id: "watch",
    observation: "الزجاج مكسور من جهة واحدة والعقارب واقفة على 01:47 — الكسر يبين إنه من ضربة مو من طيحة.",
    observationEn: "The glass is cracked on one side and the hands are stopped at 1:47 — the break points to a blow, not a fall.",
    number: "دليل 01",
    numberEn: "Evidence 01",
    title: "ساعة مكسورة",
    titleEn: "Cracked watch",
    description: "ساعة بدر واقفة على 01:47 والزجاج مكسور من الجهة اليمنى.",
    descriptionEn: "Badr's watch is stopped at 1:47, its glass cracked on the right side.",
    detail: "الكسر صاير من ضربة، مو من طيحة. الوقت 01:47 يخالف رواية إن كل الناس طلعوا قبل 01:30.",
    detailEn: "The crack came from a blow, not a fall. The 1:47 time contradicts the claim that everyone had left before 1:30.",
    icon: "watch",
    foundAt: "أرضية الغرفة الخاصة جنب السجادة",
    foundAtEn: "On the bedroom floor, beside the rug",
    crop: { x: 16, y: 78, zoom: 4.2, photo: evidenceWatch },
    unlockHint: "اسأل أي مشتبه عن وقت آخر مرة شاف بدر",
    unlockHintEn: "Ask any suspect about the last time they saw Badr",
  },
  {
    id: "phone",
    observation: "الشاحن موصول بالكهرباء ومكانه ما تغيّر، بس التلفون نفسه مو موجود بالغرفة ولا بالشاليه.",
    observationEn: "The charger is still plugged in and untouched, but the phone itself is nowhere in the room or the chalet.",
    number: "دليل 02",
    numberEn: "Evidence 02",
    title: "تلفون مفقود",
    titleEn: "Missing phone",
    description: "شاحن موصول بالطوفة بدون تلفون — تلفون بدر مو موجود بالغرفة ولا بالشاليه.",
    descriptionEn: "A charger plugged into the wall with no phone attached — Badr's phone is missing from both the room and the chalet.",
    detail: "آخر نشاط للتلفون كان فتح ملف تحويلات بنكية الساعة 01:29 فجراً.",
    detailEn: "The phone's last activity was opening a bank transfer file at 1:29 AM.",
    icon: "phone",
    foundAt: "الشاحن موصول بالطوفة جنب السرير والتلفون مفقود",
    foundAtEn: "The charger is plugged in by the bed; the phone itself is missing",
    crop: { x: 67.8, y: 55.2, zoom: 4.6, photo: evidencePhone },
    unlockHint: "اسأل عن التلفون أو عن آخر شي كان يسويه بدر",
    unlockHintEn: "Ask about the phone or the last thing Badr was doing",
  },
  {
    id: "cup",
    observation: "فنجال قهوة عليه أثر أحمر على الحرف، وبقايا مادة مهدئة بالقاع.",
    observationEn: "A coffee cup with a red mark on the rim, and sedative residue at the bottom.",
    number: "دليل 03",
    numberEn: "Evidence 03",
    title: "فنجان قهوة عليه أثر أحمر",
    titleEn: "Coffee cup with a red mark",
    description: "فنجال قهوة عليه أثر أحمر واضح على الحرف، وبقاعه بقايا مهدئ.",
    descriptionEn: "A coffee cup with a clear red mark on the rim, sedative residue settled at the bottom.",
    detail: "الفنجال الثاني عليه بصمة جزئية، ويطابق شخص جالس مقابل بدر بنفس الغرفة.",
    detailEn: "The second cup has a partial fingerprint, matching someone seated across from Badr in the same room.",
    icon: "cup",
    foundAt: "طاولة جانبية داخل الغرفة",
    foundAtEn: "On a side table inside the room",
    crop: { x: 39.5, y: 48.5, zoom: 4.6, photo: evidenceCup },
    unlockHint: "اسأل عن القهوة أو عن آخر شي شربه بدر",
    unlockHintEn: "Ask about the coffee or the last thing Badr drank",
  },
  {
    id: "shoe",
    observation: "حذاء نسائي واحد ملقى بعيد عن مكانه، والكعب فيه خدش جديد وأثر تراب طري.",
    observationEn: "A single woman's shoe lying out of place, with a fresh scuff on the heel and traces of wet dirt.",
    number: "دليل 07",
    numberEn: "Evidence 07",
    title: "حذاء نسائي",
    titleEn: "Woman's shoe",
    description: "حذاء نسائي ملقى على أرضية الغرفة بعيد عن باقي الأشياء.",
    descriptionEn: "A woman's shoe lying on the bedroom floor, apart from everything else.",
    detail: "الخدش والتراب الطري يبيّنون إن أحد دخل الغرفة بسرعة وطلع مستعجل.",
    detailEn: "The scuff and the wet dirt suggest someone entered the room quickly and left in a hurry.",
    icon: "shoe",
    foundAt: "أرضية الغرفة قريب من السرير",
    foundAtEn: "On the bedroom floor, near the bed",
    crop: { x: 52, y: 76.5, zoom: 4.2, photo: evidenceShoe },
    unlockHint: "اسأل مين دخل الغرفة قبل الحادث",
    unlockHintEn: "Ask who went into the room before it happened",
  },
  {
    id: "message",
    observation: "رسالة تهديد واصلة الساعة 11:48 مساءً من رقم مسجل باسم شركة.",
    observationEn: "A threatening message arrived at 11:48 PM from a number registered to a company.",
    number: "دليل 04",
    numberEn: "Evidence 04",
    title: "رسالة تهديد",
    titleEn: "Threatening message",
    description: "رسالة موصلة لبدر: «لا توصل الموضوع للمحامي، بتخسر أكثر مني».",
    descriptionEn: "A message sent to Badr: \"Don't take this to the lawyer, you'll lose more than me.\"",
    detail: "الرسالة موصلة الساعة 11:48 مساءً من رقم مسجل باسم شركة المقاولات.",
    detailEn: "The message arrived at 11:48 PM from a number registered to the contracting company.",
    icon: "message",
    foundAt: "تلفون بدر (نسخة الرسائل من المشغل)",
    foundAtEn: "Badr's phone (message log pulled from the carrier)",
    crop: { x: 57, y: 52, zoom: 4.0, photo: evidenceMessage },
    unlockHint: "اسأل عن الخلافات أو التهديدات",
    unlockHintEn: "Ask about disputes or threats",
  },
  {
    id: "camera",
    observation: "الكاميرا اتجاهها متغيّر عن مكانها الأصلي، والتسجيل يبين سيارة داخلة 01:38 وطالعة 02:04.",
    observationEn: "The camera has been turned away from its original angle, and the footage shows a car arriving at 1:38 AM and leaving at 2:04 AM.",
    number: "دليل 05",
    numberEn: "Evidence 05",
    title: "كاميرا مراقبة تم تغيير اتجاهها",
    titleEn: "A redirected security camera",
    description: "الكاميرا محوّلة عن الزاوية الأصلية، وتسجيلها يبين سيارة داخلة 01:38 وطالعة 02:04.",
    descriptionEn: "The camera has been turned from its original angle, and its footage shows a car arriving at 1:38 AM and leaving at 2:04 AM.",
    detail: "نفس السيارة طلعت مرة قبل منتصف الليل، ورجعت مرة ثانية بعد الوفاة، والزاوية الجديدة تخفي جزء من المدخل.",
    detailEn: "The same car left once before midnight and came back again after the time of death, and the new angle hides part of the entrance.",
    icon: "camera",
    foundAt: "كاميرا المدخل — الزاوية متغيّرة",
    foundAtEn: "The entrance camera — its angle has been changed",
    crop: { x: 82, y: 7.5, zoom: 4.0, photo: evidenceCamera },
    unlockHint: "اسأل عن الكاميرا أو عن الحركة بالمدخل",
    unlockHintEn: "Ask about the camera or the movement at the entrance",
  },
  {
    id: "key",
    observation: "مفتاح غرفة التخزين ملقى بمكان مو مكانه، وهو نوع يفتح باب بدون كسر.",
    observationEn: "The storage room key is lying somewhere it shouldn't be — and it's the kind that opens a door without forcing it.",
    number: "دليل 06",
    numberEn: "Evidence 06",
    title: "مفتاح غرفة التخزين",
    titleEn: "Storage room key",
    description: "مفتاح غرفة التخزين ملقى بعيد عن علاقة المفاتيح.",
    descriptionEn: "The storage room key, lying apart from the rest of the key rack.",
    detail: "نفس المفتاح يفتح باب الغرفة الخاصة، وهذا يفسر إن الباب ما كان مكسور.",
    detailEn: "This same key opens the bedroom door, which explains why it wasn't forced.",
    icon: "key",
    foundAt: "أرضية الغرفة قريب من الباب",
    foundAtEn: "On the bedroom floor, near the door",
    crop: { x: 76, y: 64.5, zoom: 4.6, photo: evidenceKey },
    unlockHint: "اسأل عن الباب أو عن المفاتيح",
    unlockHintEn: "Ask about the door or the keys",
  },
];

export const killerId = "yousef";

export const solution = {
  killer: "يوسف",
  killerEn: "Yousef",
  motive:
    "يوسف كان يحوّل فلوس الشركة لحسابه الخاص. بدر جمّع الأدلة بتلفونه وقاله بصراحة إن باچر بيروحون للمحامي. فلوس ومستقبل يوسف كلها كانت على المحك.",
  motiveEn:
    "Yousef had been funneling company money into his own account. Badr had gathered proof on his phone and told him plainly they'd see a lawyer the next day. Yousef's money and his entire future were on the line.",
  method:
    "طلع قدام الجميع 11:55 عشان يبني له عذر، ورجع بسيارته 01:38 ودخل بالمفتاح الاحتياطي بدون ما يكسر الباب. قدّم لبدر فنجال قهوة فيه مهدئ، وبعد ما خفّت حركته صارت مشادة انتهت بالوفاة والساعة تكسرت على 01:47. قبل ما يطلع 02:04 خذ تلفون بدر عشان يمسح ملف التحويلات.",
  methodEn:
    "He left in front of everyone at 11:55 PM to build himself an alibi, then drove back at 1:38 AM and let himself in with the spare key without forcing the door. He handed Badr a cup of coffee laced with a sedative, and once Badr had slowed down, a confrontation broke out that ended in his death, cracking the watch at 1:47. Before leaving at 2:04, he took Badr's phone to erase the transfer records.",
  timeline: [
    { time: "11:48 م", timeEn: "11:48 PM", text: "يوسف يرسل رسالة تهديد لبدر عشان يوقف موضوع المحامي.", textEn: "Yousef sends Badr a threatening message to shut down the lawyer idea." },
    { time: "11:55 م", timeEn: "11:55 PM", text: "يوسف يطلع من الشاليه قدام الجميع ويخلي انطباع إنه ترك القعدة.", textEn: "Yousef leaves the chalet in front of everyone, giving the impression he'd left for good." },
    { time: "01:15 ص", timeEn: "1:15 AM", text: "نورة تطلع، وبعدها ترجع خفية عشان ترد الخاتم.", textEn: "Noura leaves, then quietly comes back to return the ring." },
    { time: "01:29 ص", timeEn: "1:29 AM", text: "بدر يفتح ملف التحويلات البنكية بتلفونه.", textEn: "Badr opens the bank transfer file on his phone." },
    { time: "01:38 ص", timeEn: "1:38 AM", text: "كاميرا المدخل تسجل سيارة يوسف داخلة مرة ثانية.", textEn: "The entrance camera records Yousef's car coming back in." },
    { time: "01:42 ص", timeEn: "1:42 AM", text: "يوسف يدخل بالمفتاح الاحتياطي ويقدم لبدر فنجال قهوة فيه مهدئ.", textEn: "Yousef lets himself in with the spare key and hands Badr a coffee laced with a sedative." },
    { time: "01:47 ص", timeEn: "1:47 AM", text: "المشادة تصير، الساعة تتكسر وتوقف على هذا الوقت.", textEn: "The confrontation happens; the watch is cracked and stops at this time." },
    { time: "01:48 ص", timeEn: "1:48 AM", text: "دانة تسمع باب ينسد وخطوات بالممر.", textEn: "Dana hears a door close and footsteps in the hallway." },
    { time: "02:04 ص", timeEn: "2:04 AM", text: "يوسف يطلع وياه تلفون بدر عشان يخفي أدلة التحويلات.", textEn: "Yousef leaves, taking Badr's phone with him to hide the transfer evidence." },
  ],
  decisive: {
    title: "توقيت كاميرا المدخل + المفتاح الاحتياطي",
    titleEn: "The entrance camera timing + the spare key",
    text: "سيارة يوسف داخلة 01:38 وطالعة 02:04، والمفتاح الاحتياطي الناقص يفسر ليش الباب ما كان مكسور. الدليلين مع بعض يحطونه داخل الغرفة بوقت الوفاة.",
    textEn: "Yousef's car arriving at 1:38 and leaving at 2:04, plus the missing spare key that explains why the door wasn't forced. Together, both clues place him inside the room at the time of death.",
  },
  provingClues: [
    "الساعة الواقفة على 01:47 تكسر رواية «الجميع طلعوا قبل 01:30».",
    "كاميرا المدخل تثبت دخول ثاني للسيارة الساعة 01:38 وطلوع 02:04.",
    "المفتاح الاحتياطي الناقص يفسر ليش الباب ما كان مكسور.",
    "الفنجال الثاني وفيه مهدئ يثبت إن أحد كان جالس مقابل بدر بالغرفة.",
    "اختفاء التلفون بعد فتح ملف التحويلات يربط الدافع بالجريمة.",
  ],
  provingCluesEn: [
    "The watch stopped at 1:47 breaks the story that everyone left before 1:30.",
    "The entrance camera proves the car came back in at 1:38 and left at 2:04.",
    "The missing spare key explains why the door wasn't forced.",
    "The second cup, laced with sedative, proves someone sat across from Badr in the room.",
    "The phone disappearing right after the transfer file was opened ties the motive to the crime.",
  ],
  liars: [
    {
      name: "فهد",
      nameEn: "Fahad",
      lie: "قال إنه نام من الساعة 01:00",
      lieEn: "Claimed he'd been asleep since 1:00 AM",
      why: "كان صاحي، وخذ 400 دينار من محفظة بدر بعد ما لقاه، وخاف يتهمونه.",
      whyEn: "He was awake, and took 400 dinars from Badr's wallet after finding him, then feared being blamed.",
    },
    {
      name: "نورة",
      nameEn: "Noura",
      lie: "نكرت إنها رجعت للشاليه",
      lieEn: "Denied coming back to the chalet",
      why: "رجعت ترد الخاتم، وشافت يوسف ياخذ التلفون، بس سكتت لأنه يعرف سر عن عائلتها.",
      whyEn: "She came back to return the ring and saw Yousef take the phone, but stayed silent because he knows a secret about her family.",
    },
    {
      name: "يوسف",
      nameEn: "Yousef",
      lie: "قال إنه طلع قبل 12 وما رجع",
      lieEn: "Claimed he left before midnight and never came back",
      why: "هو القاتل. رجع بالمفتاح الاحتياطي وأخفى التلفون.",
      whyEn: "He's the killer. He came back with the spare key and hid the phone.",
    },
    {
      name: "دانة",
      nameEn: "Dana",
      lie: "قالت إن ذاكرتها ضعيفة بالأوقات",
      lieEn: "Claimed her memory for times was unreliable",
      why: "عندها تسجيل صوتي دقيق للساعة 01:47، وخافت تتورط لو سلّمته.",
      whyEn: "She has a precise audio recording from 1:47 AM, and was afraid of getting involved if she handed it over.",
    },
  ],
};

export const getSuspect = (id: string) => suspects.find((s) => s.id === id);
export const getEvidence = (id: string) => evidence.find((e) => e.id === id);

/**
 * روابط منطقية حقيقية بين دليلين حسب سيناريو القضية. غير معروضة للاعب أبداً —
 * تستخدم فقط للتحقق لمن يحاول يربط دليلين بلوحة الأدلة.
 */
export interface EvidenceLink {
  id: string;
  pair: [string, string];
  title: string;
  insight: string;
}

export const evidenceLinks: EvidenceLink[] = [
  {
    id: "time-inside",
    pair: ["watch", "camera"],
    title: "أحد كان داخل الشاليه وقت الوفاة",
    insight:
      "الساعة واقفة على 01:47، والكاميرا تسجل سيارة داخلة 01:38 وطالعة 02:04 — يعني في أحد كان جوّه بنفس اللحظة، ورواية «الجميع طلعوا قبل 01:30» ما تمشي.",
  },
  {
    id: "silent-entry",
    pair: ["key", "camera"],
    title: "دخول بدون كسر باب",
    insight:
      "المفتاح الاحتياطي الناقص يفسر ليش الباب ما كان مكسور، والكاميرا تحدد وقت الدخول الثاني — الدخول كان بهدوء وبمعرفة مكان المفاتيح.",
  },
  {
    id: "sedated-then-struck",
    pair: ["cup", "watch"],
    title: "مهدئ قبل المشادة",
    insight:
      "فنجال فيه مهدئ وفنجال ثاني مقابله، وبعدها ساعة تتكسر من ضربة على 01:47 — أحد جلس معه بهدوء أول، والمشادة صارت بعدها.",
  },
  {
    id: "hidden-motive",
    pair: ["phone", "message"],
    title: "التلفون انشال عشان يخفي شي",
    insight:
      "الرسالة تحذّر بدر من إنه يوصّل الموضوع للمحامي، والتلفون نفسه مفقود والشاحن بمكانه — اللي أخذ التلفون كان يبي يخفي محتواه، مو يسرقه.",
  },
  {
    id: "threat-and-return",
    pair: ["message", "camera"],
    title: "تهديد قبل الرجعة",
    insight:
      "رسالة تهديد 11:48 مساءً من رقم مسجل باسم الشركة، وبعدها بساعتين سيارة ترجع للشاليه — التهديد ما وقف عند الكلام.",
  },
  {
    id: "key-and-cup",
    pair: ["key", "cup"],
    title: "أحد يعرف المطبخ",
    insight:
      "المفتاح الاحتياطي كان معلّق بالمطبخ، ونفس المطبخ فيه الفنجالين — اللي سوّى هذا يعرف الشاليه من داخل مو زائر غريب.",
  },
];

export const findEvidenceLink = (a: string, b: string) =>
  evidenceLinks.find(
    (l) => (l.pair[0] === a && l.pair[1] === b) || (l.pair[0] === b && l.pair[1] === a),
  );
