import parkingImg from "@/assets/scene-last-trip/parking.jpg";
import entranceImg from "@/assets/scene-last-trip/entrance.jpg";
import trashImg from "@/assets/scene-last-trip/trash-bin.jpg";
import trashCloseImg from "@/assets/scene-last-trip/trash-closeup.jpg";
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
  messageEn: string;
}

export interface LastTripEvidenceHotspot extends LastTripRect {
  evidenceId: string;
}

export interface LastTripSceneView {
  id: string;
  /** تعليق جوي بسيط فقط — ليس عنصر تنقل. */
  label: string;
  labelEn: string;
  image: string;
  /** جو المكان (يظهر كسطر وصفي تحت الصورة). */
  mood: string;
  moodEn: string;
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
    labelEn: "Station Parking Lot",
    image: parkingImg,
    mood: "الطريق ساكت والهوا بارد… سيارات قليلة واقفة تحت أعمدة الضوء البرتقالية.",
    moodEn: "The road is quiet and the air is cold… a few cars parked under orange streetlights.",
    nav: [
      { to: "entrance", x: 50, y: 55, w: 22, h: 12 },
      { to: "entrance", x: 30, y: 56, w: 5, h: 8 },
    ],
    decoys: [
      { id: "sedan", x: 16, y: 60, w: 16, h: 10, message: "سيارة واقفة ومقفلة… ماكو شي مهم هني", messageEn: "A parked, locked car… nothing important here" },
      { id: "pickup", x: 81, y: 61, w: 16, h: 10, message: "وانيت مغبر، ماكو شي مهم هني", messageEn: "A dusty pickup truck, nothing important here" },
      { id: "lamp", x: 8, y: 20, w: 8, h: 30, message: "عمود ضوء يطق ويطفي… بس إضاءة", messageEn: "A flickering streetlight… just lighting" },
      { id: "desert", x: 95, y: 57, w: 10, h: 10, message: "برّه المحطة صحرا ومظلمة", messageEn: "Outside the station is dark, empty desert" },
      { id: "asphalt", x: 45, y: 88, w: 50, h: 14, message: "الإسفلت متشقق… ماكو شي مهم هني", messageEn: "Cracked asphalt… nothing important here" },
    ],
  },
  {
    id: "entrance",
    label: "مدخل المحطة",
    labelEn: "Station Entrance",
    image: entranceImg,
    mood: "أبواب زجاج مفتوحة على ضوء أبيض بارد، وصوت مكيّف بس.",
    moodEn: "Glass doors open onto cold white light, with only the hum of the AC.",
    nav: [
      { to: "corridor", x: 43, y: 60, w: 14, h: 22 },
      { to: "coffee", x: 86, y: 56, w: 22, h: 20 },
      { to: "trash", x: 74, y: 84, w: 14, h: 12 },
      { to: "parking", x: 18, y: 92, w: 30, h: 14 },
    ],
    decoys: [
      { id: "sign", x: 44, y: 30, w: 42, h: 10, message: "لوحة المحطة مضوية وفاضية", messageEn: "The station sign is lit up and blank" },
      { id: "facade", x: 20, y: 55, w: 10, h: 20, message: "جدار كونكريت… ماكو شي مهم هني", messageEn: "A concrete wall… nothing important here" },
      { id: "tiles", x: 45, y: 96, w: 24, h: 8, message: "بلاط المدخل نظيف تقريباً", messageEn: "The entrance tiles are fairly clean" },
    ],
  },
  {
    id: "trash",
    label: "برّه الكوفي شوب",
    labelEn: "Outside the Coffee Shop",
    image: trashImg,
    mood: "حاوية معدن كبيرة على الرصيف جنب باب الكوفي شوب، غطاها مرفوع وأكياس طالعة منها.",
    moodEn:
      "A large metal bin on the sidewalk next to the coffee shop door, its lid up and bags spilling out.",
    nav: [
      // الحاوية نفسها — تقريب داخلها.
      { to: "trashOpen", x: 46, y: 62, w: 18, h: 34 },
      // باب الكوفي شوب المضوي على اليمين.
      { to: "coffee", x: 91, y: 45, w: 16, h: 46 },
      // الممشى ناحية المدخل.
      { to: "entrance", x: 30, y: 92, w: 26, h: 14 },
    ],
    decoys: [
      { id: "plant", x: 13, y: 62, w: 18, h: 30, message: "نبتة يابسة بالحوض… ماكو شي مهم هني", messageEn: "A dried-out plant in a pot… nothing important here" },
      { id: "wrapper", x: 56, y: 84, w: 6, h: 6, message: "ورقة طايحة على البلاط", messageEn: "A piece of paper on the pavement" },
      { id: "highway", x: 40, y: 45, w: 26, h: 8, message: "الخط السريع فاضي بالكامل", messageEn: "The highway is completely empty" },
      { id: "pillar", x: 73, y: 40, w: 10, h: 50, message: "عمود المبنى… ماكو شي مهم هني", messageEn: "A building pillar… nothing important here" },
    ],
  },
  {
    id: "trashOpen",
    label: "داخل الحاوية",
    labelEn: "Inside the Bin",
    image: trashCloseImg,
    mood: "أكواب مكسّرة، فواتير، أكياس، وعلبة مشروب… وشي أبيض مكرمش بينهم.",
    moodEn: "Crushed cups, receipts, bags, and a drink can… and something white and crumpled among them.",
    nav: [{ to: "trash", x: 50, y: 95, w: 60, h: 10 }],
    evidence: [{ evidenceId: "lt-tissue", x: 61, y: 54, w: 9, h: 10 }],
    decoys: [
      { id: "can", x: 20, y: 52, w: 8, h: 8, message: "علبة مشروب فاضية… ماكو شي مهم هني", messageEn: "An empty drink can… nothing important here" },
      { id: "receipt", x: 43, y: 40, w: 8, h: 8, message: "فاتورة قديمة ممسوحة، ما تنقرا", messageEn: "An old, faded receipt — unreadable" },
      { id: "cups", x: 40, y: 26, w: 12, h: 10, message: "أكواب قهوة مكسّرة… ماكو شي مهم هني", messageEn: "Crushed coffee cups… nothing important here" },
      { id: "bag", x: 36, y: 68, w: 16, h: 14, message: "كيس بلاستيك فيه زبالة عادية", messageEn: "A plastic bag with ordinary trash" },
      { id: "cup-right", x: 66, y: 31, w: 8, h: 8, message: "كوب ورق مقلوب", messageEn: "An overturned paper cup" },
      { id: "carton", x: 74, y: 68, w: 12, h: 12, message: "كرتون مبلل… ماكو شي مهم هني", messageEn: "A damp piece of cardboard… nothing important here" },
    ],
  },
  {
    id: "coffee",
    label: "الكوفي شوب",
    labelEn: "The Coffee Shop",
    image: coffeeImg,
    mood: "طاولات فيها أكواب قهوة متروكة، ماكينة مطفية، وكاميرا صغيرة فوق باب المدخل.",
    moodEn:
      "Tables with abandoned coffee cups, a switched-off machine, and a small camera above the entrance.",
    nav: [
      // الباب الزجاجي → برّه عند الحاوية.
      { to: "trash", x: 39, y: 42, w: 12, h: 28 },
      // الجهة اليمين ناحية داخل المحطة.
      { to: "corridor", x: 96, y: 55, w: 8, h: 40 },
    ],
    evidence: [
      // كوب جاسم — الكوب القريب على طاولة اليسار.
      { evidenceId: "lt-coffee-cup", x: 16, y: 68, w: 7, h: 9 },
      // كاميرا مدخل الكوفي — فوق الباب بالزاوية اليسار العليا (ظاهرة بالصورة).
      { evidenceId: "lt-coffee-cam", x: 15.3, y: 5, w: 6.5, h: 7.5 },
    ],
    decoys: [
      { id: "cups-far", x: 16, y: 55, w: 12, h: 8, message: "كوبين متروكين على طاولة ثانية", messageEn: "Two cups left on another table" },
      { id: "napkin", x: 21, y: 77, w: 7, h: 5, message: "منديل نظيف على الطاولة", messageEn: "A clean napkin on the table" },
      { id: "machine", x: 78, y: 36, w: 16, h: 14, message: "ماكينة القهوة مطفية وباردة", messageEn: "The coffee machine is off and cold" },
      { id: "counter", x: 80, y: 60, w: 24, h: 20, message: "الكاونتر نظيف… ماكو شي مهم هني", messageEn: "The counter is clean… nothing important here" },
      { id: "frame", x: 4, y: 26, w: 8, h: 26, message: "لوحة معلقة على الطوفة", messageEn: "A picture hanging on the wall" },
      { id: "chairs", x: 38, y: 88, w: 16, h: 18, message: "كراسي فاضية", messageEn: "Empty chairs" },
    ],
  },
  {
    id: "corridor",
    label: "ممر المحطة",
    labelEn: "Station Corridor",
    image: corridorImg,
    mood: "ضوء نيون يرجف، وصدى خطوات. كاميرا معلقة عالي على اليمين، وآخر الممر أظلم وأبرد.",
    moodEn:
      "Flickering neon light, echoing footsteps. A camera mounted high on the right, and the end of the corridor is darker and colder.",
    nav: [
      // أبواب الحمامات الرئيسية على اليمين.
      { to: "mainBath", x: 58, y: 58, w: 10, h: 34 },
      // نهاية الممر المظلمة → الحمام الطرفي.
      { to: "farBath", x: 41, y: 56, w: 12, h: 16 },
      // الفتحة على اليسار → رجوع للمدخل.
      { to: "entrance", x: 20, y: 60, w: 12, h: 26 },
    ],
    evidence: [
      // كاميرا الممر — جسم الكاميرا الظاهر عالي على طوفة اليمين.
      { evidenceId: "lt-corridor-cam", x: 72, y: 11, w: 11, h: 10 },
    ],
    decoys: [
      { id: "left-wall", x: 8, y: 30, w: 14, h: 26, message: "طوفة بلاط… ماكو شي مهم هني", messageEn: "A tiled wall… nothing important here" },
      { id: "ceiling", x: 40, y: 20, w: 14, h: 10, message: "لمبة نيون تطق… بس إضاءة", messageEn: "A flickering neon light… just lighting" },
      { id: "floor", x: 45, y: 92, w: 26, h: 10, message: "أرضية رطبة بدون أثر واضح", messageEn: "A damp floor with no clear mark" },
      { id: "right-wall", x: 90, y: 60, w: 16, h: 34, message: "بلاط الطوفة سليم", messageEn: "The wall tiles are intact" },
    ],
  },
  {
    id: "mainBath",
    label: "الحمامات الرئيسية",
    labelEn: "Main Bathrooms",
    image: mainBathImg,
    mood: "ثلاث مغاسل وضوء أبيض قوي — هذي الحمامات اللي يمرون عليها كل الناس.",
    moodEn: "Three sinks and strong white light — these are the bathrooms everyone passes through.",
    nav: [{ to: "corridor", x: 45, y: 95, w: 40, h: 10 }],
    decoys: [
      { id: "sinks", x: 28, y: 60, w: 26, h: 16, message: "مغاسل رطبة… ماكو شي مهم هني", messageEn: "Damp sinks… nothing important here" },
      { id: "mirrors", x: 25, y: 35, w: 26, h: 20, message: "مرايات نظيفة تقريباً", messageEn: "Fairly clean mirrors" },
      { id: "stalls", x: 85, y: 50, w: 22, h: 45, message: "الأبواب مفتوحة والحمامات فاضية", messageEn: "The doors are open and the stalls are empty" },
      { id: "window", x: 61, y: 37, w: 18, h: 20, message: "من الدريشة تشوف الموقف بس", messageEn: "The window only overlooks the parking lot" },
      { id: "bin", x: 52, y: 57, w: 6, h: 12, message: "سلة زبالة… فاضية", messageEn: "A trash bin… empty" },
      { id: "dryer", x: 7, y: 40, w: 12, h: 16, message: "منشّف أيدين معطّل", messageEn: "A broken hand dryer" },
    ],
  },
  {
    id: "farBath",
    label: "الحمام البعيد",
    labelEn: "The Far Bathroom",
    image: farBathImg,
    mood: "آخر الممر، بعيد عن الحركة. لمبة واحدة، ريحة رطوبة، وأرضية مبللة عند المخرج.",
    moodEn: "At the end of the corridor, away from foot traffic. A single bulb, a damp smell, and a wet floor by the exit.",
    nav: [
      // المغسلة على اليسار — قريب منها انلقى راشد.
      { to: "farSink", x: 14, y: 57, w: 18, h: 20 },
      // الباب على اليمين → رجوع للممر.
      { to: "corridor", x: 84, y: 38, w: 13, h: 28 },
    ],
    evidence: [
      // أثر حذاء رطب باهت على البلاط قريب من المخرج.
      { evidenceId: "lt-shoe-print", x: 79, y: 94, w: 11, h: 8 },
    ],
    decoys: [
      { id: "mirror", x: 10, y: 28, w: 16, h: 26, message: "مراية مشققة… ماكو شي مهم هني", messageEn: "A cracked mirror… nothing important here" },
      { id: "stall", x: 41, y: 42, w: 20, h: 60, message: "باب الحمام مسكّر بس فاضي", messageEn: "The stall door is closed but empty" },
      { id: "wall", x: 62, y: 30, w: 18, h: 30, message: "بلاط رطب ومصفّر من القدم", messageEn: "Damp tiles, yellowed with age" },
      { id: "light", x: 11, y: 8, w: 10, h: 10, message: "لمبة السقف تطق كل شوي", messageEn: "The ceiling light flickers every so often" },
      { id: "floor-mid", x: 45, y: 90, w: 24, h: 12, message: "بلاط جاف… ماكو شي مهم هني", messageEn: "Dry tiles… nothing important here" },
    ],
  },
  {
    id: "farSink",
    label: "مغسلة الحمام البعيد",
    labelEn: "The Far Bathroom Sink",
    image: farSinkImg,
    mood: "مغسلة قديمة وحنفية معدنية… هنا انلقى راشد.",
    moodEn: "An old sink and a metal faucet… this is where Rashid was found.",
    nav: [{ to: "farBath", x: 50, y: 96, w: 60, h: 8 }],
    evidence: [{ evidenceId: "lt-faucet", x: 50, y: 50, w: 13, h: 14 }],
    decoys: [
      { id: "basin", x: 50, y: 76, w: 44, h: 14, message: "حوض المغسلة… ماكو شي مهم هني", messageEn: "The sink basin… nothing important here" },
      { id: "mirror-edge", x: 50, y: 12, w: 44, h: 14, message: "حرف المراية مكسّر", messageEn: "The mirror's edge is cracked" },
      { id: "tiles", x: 12, y: 45, w: 18, h: 30, message: "بلاط الطوفة رطب", messageEn: "The wall tiles are damp" },
      { id: "tiles-r", x: 90, y: 45, w: 18, h: 30, message: "بلاط رطب… ماكو شي مهم هني", messageEn: "Damp tiles… nothing important here" },
    ],
  },
];

export function getLastTripSceneView(id: string): LastTripSceneView {
  return lastTripSceneViews.find((v) => v.id === id) ?? lastTripSceneViews[0]!;
}
