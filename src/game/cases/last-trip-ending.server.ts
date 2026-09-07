/**
 * حل قضية «آخر رحلة» ونهايتها السينمائية — سيرفر فقط، ما توصل للعميل إلا بعد
 * ما يفتح الفريق شاشة النهاية.
 */
import { LAST_TRIP_CULPRIT_ID } from "./last-trip-knowledge.server";

export const lastTripCulpritId = LAST_TRIP_CULPRIT_ID;

export interface LastTripEndingBeat {
  title: string;
  titleEn: string;
  text: string;
  textEn: string;
}

export const lastTripEndingBeats: LastTripEndingBeat[] = [
  {
    title: "الخلاف",
    titleEn: "The Rift",
    text: "قبل الحادث بشوي، كان بين جاسم وراشد كلام قديم ما انتهى — غيرة متراكمة وكلمة زايدة من راشد قدّام الشباب، وجاسم ساكت من برا وغالي من داخل.",
    textEn:
      "Shortly before the incident, there was old, unresolved tension between Jassim and Rashid — built-up jealousy and a careless remark Rashid made in front of the group, while Jassim stayed quiet outside but was boiling inside.",
  },
  {
    title: "الحمام الطرفي",
    titleEn: "The Far Bathroom",
    text: "راشد قام يبعد عن الكوفي، وجاسم لحقه. المكان اللي اختاروه كان الحمام الطرفي — بعيد عن الحركة وما عليه أحد.",
    textEn:
      "Rashid got up and stepped away from the coffee shop, and Jassim followed him. The place they ended up in was the far bathroom — away from foot traffic, with no one around.",
  },
  {
    title: "تصاعد النقاش",
    titleEn: "The Argument Escalates",
    text: "الكلام رفع شوي شوي. الأصوات اللي سمعها مشعل من بعيد كانت من هناك — اثنين يتناقشون بحدة، مب مزاح.",
    textEn:
      "The conversation heated up little by little. The voices Mishal heard from a distance were coming from there — two people arguing sharply, not joking around.",
  },
  {
    title: "الدفعة",
    titleEn: "The Push",
    text: "بلحظة عصبية، جاسم دفع راشد بصدره. ما كانت ضربة مدروسة — دفعة واحدة بس كانت كافية.",
    textEn:
      "In a moment of anger, Jassim shoved Rashid in the chest. It wasn't a calculated blow — just one push was enough.",
  },
  {
    title: "الارتطام",
    titleEn: "The Impact",
    text: "راشد طاح للخلف وراسه ارتطم بالحنفية. صوت واحد، وبعده سكوت.",
    textEn: "Rashid fell backward and hit his head on the faucet. One sound, then silence.",
  },
  {
    title: "الارتباك",
    titleEn: "The Panic",
    text: "جاسم وقف مصدوم. ما نادى أحد ولا طلب مساعدة — أول شي فكر فيه إنه يطلع من الموضوع.",
    textEn:
      "Jassim stood there in shock. He didn't call anyone or ask for help — the first thing on his mind was getting out of it.",
  },
  {
    title: "التنظيف",
    titleEn: "The Cleanup",
    text: "مسح الحنفية والمنطقة اللي حولها عشان يشيل الأثر، وهنا ضاع منه ترتيب الوقت اللي حاول يركبه بعدين.",
    textEn:
      "He wiped down the faucet and the area around it to remove any trace, and this is where he lost track of the timeline he later tried to construct.",
  },
  {
    title: "الكلينكس",
    titleEn: "The Tissue",
    text: "استخدم كلينكس بالتنظيف، وكمّشه بيده وطلع من الحمام بسرعة.",
    textEn: "He used a tissue to clean up, crumpled it in his hand, and hurried out of the bathroom.",
  },
  {
    title: "الزبالة عند باب الكوفي",
    titleEn: "The Trash by the Coffee Shop Door",
    text: "بطريق رجوعه رمى الكلينكس بالزبالة اللي عند باب الكوفي — نفس الزبالة اللي شافها مشعل وهو يمر.",
    textEn:
      "On his way back, he threw the tissue in the bin by the coffee shop door — the same bin Mishal saw as he walked by.",
  },
  {
    title: "الرجوع للكوفي",
    titleEn: "Back to the Coffee Shop",
    text: "رجع يقعد ويكمل قهوته ويتكلم عادي، بس كمّه كان مبلل — وهذا اللي لاحظه ناصر بدون ما يفهم معناه بذيك اللحظة.",
    textEn:
      "He went back, sat down, finished his coffee, and talked as if nothing happened — but his sleeve was wet, and that's what Nasser noticed without understanding its meaning at the time.",
  },
  {
    title: "كيف انكشف",
    titleEn: "How It Unraveled",
    text: "الحنفية المسحوبة الأثر + الكلينكس بالزبالة + كم جاسم المبلل + مكالمة عبدالله اللي حددت الوقت + الخطوة المبللة عند مخرج الحمام… كلها ركّبت خط زمني ما يتفق مع كلام جاسم، وتناقضاته بالاستجواب كسرت آخر شي كان متمسك به.",
    textEn:
      "The wiped-down faucet, the tissue in the trash, Jassim's wet sleeve, Abdullah's call that pinned down the timing, and the wet footprint by the bathroom exit… together they built a timeline that didn't match Jassim's story, and his contradictions during questioning broke the last thing he was holding on to.",
  },
];
