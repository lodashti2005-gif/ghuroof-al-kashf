import parkingImg from "@/assets/scene-last-trip/parking.jpg";
import entranceImg from "@/assets/scene-last-trip/entrance.jpg";
import trashImg from "@/assets/scene-last-trip/trash-bin.jpg";
import coffeeImg from "@/assets/scene-last-trip/coffee-shop.jpg";
import corridorImg from "@/assets/scene-last-trip/corridor.jpg";
import mainBathImg from "@/assets/scene-last-trip/main-bathroom.jpg";
import farBathImg from "@/assets/scene-last-trip/far-bathroom.jpg";
import farSinkImg from "@/assets/scene-last-trip/far-sink.jpg";

/**
 * مسرح جريمة قضية «آخر رحلة» — بيانات مستقلة تماماً عن قضية الشاليه.
 *
 * استكشاف Point & Click خالص: اللاعب يضغط داخل الصورة نفسها. ماكو أزرار مناطق
 * ولا مؤشرات ظاهرة على الأشياء. الأدلة (٧ عناصر) تنضاف بمرحلة لاحقة.
 */
export interface LastTripRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LastTripNavHotspot extends LastTripRect {
  to: string;
}

export interface LastTripDecoyHotspot extends LastTripRect {
  id: string;
  message: string;
}

export interface LastTripEvidenceHotspot extends LastTripRect {
  evidenceId: string;
}

export interface LastTripSceneView {
  id: string;
  /** تعليق جوي بسيط فقط — ليس عنصر تنقل. */
  label: string;
  image: string;
  /** جو المكان (يظهر كسطر وصفي تحت الصورة). */
  mood: string;
  nav: LastTripNavHotspot[];
  /** أدلة مخفية — بدون أي مؤشر ظاهر على الصورة. */
  evidence?: LastTripEvidenceHotspot[];
  decoys: LastTripDecoyHotspot[];
}

export const LAST_TRIP_SCENE_START = "parking";
export const lastTripSceneImageSize = { width: 1536, height: 1024 };

export const lastTripSceneViews: LastTripSceneView[] = [
  {
    id: "parking",
    label: "موقف المحطة",
    image: parkingImg,
    mood: "الطريق ساكت والهوا بارد… سيارات قليلة واقفة تحت أعمدة الضوء البرتقالية.",
    nav: [
      // واجهة المحطة المضوية بالنص + الباب الجانبي.
      { to: "entrance", x: 50, y: 55, w: 22, h: 12 },
      { to: "entrance", x: 30, y: 56, w: 5, h: 8 },
    ],
    evidence: [{ evidenceId: "lt-call-log", x: 20, y: 63, w: 5, h: 4 }],
    decoys: [
      { id: "sedan", x: 16, y: 60, w: 16, h: 10, message: "سيارة واقفة ومقفلة… ماكو شي واضح" },
      { id: "pickup", x: 81, y: 61, w: 16, h: 10, message: "وانيت مغبر، ولا أثر واضح" },
      { id: "lamp", x: 8, y: 20, w: 8, h: 30, message: "عمود ضوء يطق ويطفي… بس إضاءة" },
      { id: "desert", x: 95, y: 57, w: 10, h: 10, message: "برّه المحطة صحرا ومظلمة" },
      { id: "asphalt", x: 45, y: 88, w: 50, h: 14, message: "الإسفلت متشقق… ماكو شي مهم هنا" },
    ],
  },
  {
    id: "entrance",
    label: "مدخل المحطة",
    image: entranceImg,
    mood: "أبواب زجاج مفتوحة على ضوء أبيض بارد، وصوت مكيّف بس.",
    nav: [
      // الباب الزجاجي الداخلي → الممر.
      { to: "corridor", x: 43, y: 60, w: 14, h: 22 },
      // نافذة الكوفي شوب على اليمين.
      { to: "coffee", x: 86, y: 56, w: 22, h: 20 },
      // الرصيف عند طرف الكوفي شوب — الزبالة برّه.
      { to: "trash", x: 74, y: 84, w: 14, h: 12 },
      // رجوع للموقف عبر الممشى.
      { to: "parking", x: 18, y: 92, w: 30, h: 14 },
    ],
    decoys: [
      { id: "sign", x: 44, y: 30, w: 42, h: 10, message: "لوحة المحطة مضوية وفاضية" },
      { id: "facade", x: 20, y: 55, w: 10, h: 20, message: "جدار كونكريت عادي" },
      { id: "tiles", x: 45, y: 96, w: 24, h: 8, message: "بلاط المدخل نظيف تقريباً" },
    ],
  },
  {
    id: "trash",
    label: "الزبالة برّه الكوفي شوب",
    image: trashImg,
    mood: "حاوية معدن جنب باب الكوفي شوب، ريحة قهوة قديمة وأكياس فوق بعض.",
    nav: [
      // الرجوع للمدخل من جهة الممشى.
      { to: "entrance", x: 16, y: 70, w: 26, h: 26 },
      // باب الكوفي شوب على اليمين.
      { to: "coffee", x: 95, y: 50, w: 10, h: 40 },
    ],
    evidence: [{ evidenceId: "lt-tissue", x: 62, y: 74, w: 6, h: 6 }],
    decoys: [
      { id: "bin", x: 58, y: 62, w: 22, h: 40, message: "أكياس وأكواب فوق بعض… ماكو شي واضح للحين" },
      { id: "cup", x: 73, y: 88, w: 8, h: 8, message: "كوب فاضي على الأرض" },
      { id: "plant", x: 18, y: 52, w: 10, h: 16, message: "نبتة يابسة بالحوض" },
      { id: "road", x: 30, y: 50, w: 25, h: 8, message: "الطريق فاضي بالكامل" },
    ],
  },
  {
    id: "coffee",
    label: "الكوفي شوب",
    image: coffeeImg,
    mood: "ماكينة قهوة مطفية، طاولات فاضية، وضوء دافئ على كاونتر مرتب نص ترتيب.",
    nav: [
      // الباب الداخلي وسط الصورة → الممر.
      { to: "corridor", x: 46, y: 54, w: 8, h: 26 },
      // الزجاج المطل على الموقف → برّه.
      { to: "trash", x: 12, y: 45, w: 16, h: 26 },
    ],
    evidence: [
      { evidenceId: "lt-coffee-cup", x: 40, y: 70, w: 6, h: 6 },
      { evidenceId: "lt-coffee-cam", x: 46, y: 40, w: 6, h: 5 },
    ],
    decoys: [
      { id: "counter", x: 66, y: 62, w: 24, h: 20, message: "الكاونتر نظيف، ماكو شي مهم هنا" },
      { id: "machine", x: 60, y: 45, w: 12, h: 12, message: "ماكينة القهوة مطفية وباردة" },
      { id: "cups", x: 69, y: 44, w: 6, h: 12, message: "أكواب ورق مرصوفة فوق بعض" },
      { id: "tables", x: 20, y: 78, w: 26, h: 20, message: "طاولات وكراسي فاضية" },
      { id: "fridge", x: 92, y: 60, w: 14, h: 24, message: "ثلاجة الحلويات شبه فاضية" },
      { id: "bin-in", x: 88, y: 85, w: 10, h: 14, message: "سلة زبالة داخلية… فاضية" },
    ],
  },
  {
    id: "corridor",
    label: "ممر المحطة",
    image: corridorImg,
    mood: "ضوء نيون يرجف، وصدى خطوات. آخر الممر أظلم وأبرد من باقيه.",
    nav: [
      // بابين الحمامات الرئيسية على اليمين.
      { to: "mainBath", x: 64, y: 50, w: 10, h: 40 },
      // نهاية الممر المظلمة → الحمام البعيد.
      { to: "farBath", x: 36, y: 42, w: 12, h: 22 },
      // رجوع للمدخل.
      { to: "entrance", x: 45, y: 95, w: 34, h: 10 },
    ],
    evidence: [{ evidenceId: "lt-corridor-cam", x: 79, y: 16, w: 8, h: 7 }],
    decoys: [
      { id: "left-wall", x: 12, y: 45, w: 20, h: 30, message: "طوفة بلاط، ماكو شي مهم هنا" },
      { id: "ceiling", x: 40, y: 6, w: 30, h: 10, message: "لمبة نيون تطق… بس إضاءة" },
      { id: "floor", x: 55, y: 90, w: 20, h: 10, message: "أرضية رطبة بس بدون أثر واضح" },
      { id: "right-wall", x: 88, y: 50, w: 20, h: 40, message: "بلاط الطوفة سليم" },
    ],
  },
  {
    id: "mainBath",
    label: "الحمامات الرئيسية",
    image: mainBathImg,
    mood: "ثلاث مغاسل وضوء أبيض قوي — هذي الحمامات اللي يمرون عليها كل الناس.",
    nav: [{ to: "corridor", x: 45, y: 95, w: 40, h: 10 }],
    decoys: [
      { id: "sinks", x: 28, y: 60, w: 26, h: 16, message: "مغاسل رطبة، ماكو شي مهم هنا" },
      { id: "mirrors", x: 25, y: 35, w: 26, h: 20, message: "مرايات نظيفة تقريباً" },
      { id: "stalls", x: 85, y: 50, w: 22, h: 45, message: "الأبواب مفتوحة والحمامات فاضية" },
      { id: "window", x: 61, y: 37, w: 18, h: 20, message: "من الدريشة تشوف الموقف بس" },
      { id: "bin", x: 52, y: 57, w: 6, h: 12, message: "سلة زبالة… فاضية" },
      { id: "dryer", x: 7, y: 40, w: 12, h: 16, message: "منشّف أيدين معطّل" },
    ],
  },
  {
    id: "farBath",
    label: "الحمام البعيد",
    image: farBathImg,
    mood: "آخر الممر، بعيد عن الحركة. لمبة واحدة، ريحة رطوبة، وسكون ثقيل.",
    nav: [
      // المغسلة على اليسار — قريب منها انلقى راشد.
      { to: "farSink", x: 22, y: 66, w: 18, h: 18 },
      // رجوع للممر.
      { to: "corridor", x: 78, y: 94, w: 34, h: 12 },
    ],
    evidence: [{ evidenceId: "lt-shoe-print", x: 66, y: 88, w: 12, h: 8 }],
    decoys: [
      { id: "mirror", x: 20, y: 32, w: 14, h: 22, message: "مراية مشققة… ماكو شي واضح فيها" },
      { id: "stall", x: 42, y: 50, w: 18, h: 40, message: "باب الحمام مسكّر بس فاضي" },
      { id: "drain", x: 53, y: 91, w: 10, h: 8, message: "بلّاعة الأرضية… ماي واقف بس" },
      { id: "wall", x: 70, y: 45, w: 20, h: 30, message: "بلاط رطب ومصفّر من القدم" },
      { id: "light", x: 55, y: 6, w: 14, h: 8, message: "لمبة السقف تطق كل شوي" },
    ],
  },
  {
    id: "farSink",
    label: "مغسلة الحمام البعيد",
    image: farSinkImg,
    mood: "مغسلة قديمة وحنفية معدنية… هنا انلقى راشد.",
    nav: [{ to: "farBath", x: 50, y: 95, w: 60, h: 10 }],
    evidence: [{ evidenceId: "lt-faucet", x: 52, y: 48, w: 8, h: 9 }],
    decoys: [
      { id: "basin", x: 50, y: 68, w: 40, h: 16, message: "حوض المغسلة… ماكو شي فيه للحين" },
      { id: "mirror-edge", x: 52, y: 8, w: 40, h: 12, message: "حرف المراية مكسّر" },
      { id: "tiles", x: 18, y: 40, w: 20, h: 30, message: "بلاط الطوفة رطب" },
    ],
  },
];

export function getLastTripSceneView(id: string): LastTripSceneView {
  return lastTripSceneViews.find((v) => v.id === id) ?? lastTripSceneViews[0]!;
}
