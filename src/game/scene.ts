import crimeScene from "@/assets/crime-scene.jpg";
import hallwayImg from "@/assets/scene/hallway.jpg";
import bedImg from "@/assets/scene/bed.jpg";
import deskImg from "@/assets/scene/desk.jpg";
import centerImg from "@/assets/scene/center.jpg";
import outletImg from "@/assets/scene/outlet.jpg";

/**
 * True point-and-click scene graph. Each view is its OWN full-size photograph
 * (no CSS zooming into a single master image). Hotspots are invisible
 * rectangles positioned in percentages of that view's photo, so they scale to
 * any viewport.
 *
 * Three kinds of hotspots, always kept separate:
 *  - nav      → replaces the current photo with another view's photo
 *  - evidence → discovers a hidden evidence item (never triggered by nav)
 *  - decoy    → ordinary prop, answers with a short line
 */
export interface SceneRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SceneNavHotspot extends SceneRect {
  to: string;
}

export interface SceneEvidenceHotspot extends SceneRect {
  evidenceId: string;
}

export interface SceneDecoyHotspot extends SceneRect {
  id: string;
  message: string;
  messageEn?: string;
}

export interface SceneView {
  id: string;
  /** Small ambient caption only — never a navigation control. */
  label: string;
  labelEn?: string;
  image: string;
  nav: SceneNavHotspot[];
  evidence: SceneEvidenceHotspot[];
  decoys: SceneDecoyHotspot[];
}

/** Master photo kept for evidence close-up crops. */
export const sceneImage = crimeScene;
export const sceneImageSize = { width: 1536, height: 1024 };

export const SCENE_START_VIEW = "hallway";

export const sceneViews: SceneView[] = [
  {
    id: "hallway",
    label: "الممر الخارجي",
    image: hallwayImg,
    // The bedroom door itself, standing ajar.
    nav: [{ to: "bedroomWide", x: 64, y: 55, w: 15, h: 66 }],
    evidence: [
      // Surveillance camera above the door, in the hallway.
      { evidenceId: "camera", x: 76.5, y: 7, w: 8, h: 9 },
      // Key still in the bedroom door lock, hallway side.
      { evidenceId: "key", x: 57.5, y: 57, w: 5, h: 8 },
    ],
    decoys: [
      { id: "sconce", x: 39, y: 27, w: 8, h: 12, message: "أباجورة الممر مضوية… ماكو شي مهم هنا" },
      { id: "hall-wall", x: 20, y: 55, w: 22, h: 30, message: "طوفة الممر نظيفة، ماكو شي مهم هنا" },
      { id: "hall-floor", x: 55, y: 96, w: 40, h: 8, message: "أرضية الممر، ولا أثر واضح" },
      { id: "hall-end", x: 90, y: 55, w: 12, h: 40, message: "نهاية الممر مظلمة وفاضية" },
    ],
  },
  {
    id: "bedroomWide",
    label: "داخل الغرفة",
    image: crimeScene,
    nav: [
      { to: "bedCloseup", x: 26, y: 52, w: 24, h: 18 },
      { to: "deskCloseup", x: 43, y: 40, w: 16, h: 16 },
      { to: "centerCloseup", x: 34, y: 80, w: 22, h: 14 },
      { to: "outletCloseup", x: 78, y: 70, w: 18, h: 22 },
      // The doorway back out to the hallway.
      { to: "hallway", x: 62, y: 52, w: 10, h: 30 },
    ],
    evidence: [],
    decoys: [
      { id: "headboard", x: 14, y: 33, w: 14, h: 10, message: "ظهر السرير سليم، ماكو شي مهم هنا" },
      { id: "window", x: 27, y: 20, w: 12, h: 12, message: "الدريشة مقفلة، ماكو شي مهم هنا" },
      { id: "mirror", x: 42, y: 22, w: 8, h: 12, message: "مراية نظيفة بدون أي أثر" },
      { id: "artwork", x: 11.5, y: 19, w: 9, h: 10, message: "لوحة معلقة على الطوفة، ماكو شي مهم هنا" },
      { id: "ceiling", x: 35, y: 4, w: 26, h: 6, message: "السقف والإضاءة بس" },
      { id: "plant", x: 92, y: 82, w: 8, h: 16, message: "نبتة بالزاوية، ماكو شي مهم هنا" },
    ],
  },
  {
    id: "bedCloseup",
    label: "منطقة السرير",
    image: bedImg,
    // Step back toward the middle of the room.
    nav: [{ to: "bedroomWide", x: 25, y: 95, w: 50, h: 10 }],
    evidence: [{ evidenceId: "shoe", x: 67, y: 78, w: 12, h: 13 }],
    decoys: [
      { id: "pillow", x: 43, y: 22, w: 16, h: 14, message: "مخدة عادية، ماكو شي مهم هنا" },
      { id: "sheet", x: 25, y: 55, w: 26, h: 25, message: "شرشف مرتب نص ترتيب… ماكو شي مهم هنا" },
      { id: "lamp", x: 85, y: 12, w: 14, h: 18, message: "أباجورة مضوية… ماكو شي مهم هنا" },
      { id: "nightstand", x: 82, y: 48, w: 16, h: 18, message: "دواليب الكومدينة فاضية" },
      { id: "tissue-box", x: 93, y: 28, w: 10, h: 8, message: "علبة مناديل، ماكو شي مهم هنا" },
    ],
  },
  {
    id: "deskCloseup",
    label: "الكومدينة والمراية",
    image: deskImg,
    nav: [{ to: "bedroomWide", x: 25, y: 95, w: 50, h: 10 }],
    evidence: [{ evidenceId: "cup", x: 33, y: 58, w: 12, h: 14 }],
    decoys: [
      { id: "mirror", x: 22, y: 20, w: 30, h: 26, message: "مراية نظيفة بدون أي أثر" },
      { id: "tissue-box", x: 57, y: 24, w: 14, h: 14, message: "علبة مناديل، ماكو شي مهم هنا" },
      { id: "drawer", x: 74, y: 66, w: 22, h: 20, message: "الدرج مفتوح وفاضي" },
      { id: "wood", x: 55, y: 48, w: 14, h: 10, message: "سطح الكومدينة نظيف" },
    ],
  },
  {
    id: "centerCloseup",
    label: "وسط الغرفة",
    image: centerImg,
    nav: [{ to: "bedroomWide", x: 82, y: 94, w: 34, h: 12 }],
    evidence: [{ evidenceId: "watch", x: 47, y: 57, w: 13, h: 14 }],
    decoys: [
      { id: "rug", x: 25, y: 30, w: 26, h: 24, message: "سجادة نظيفة، ماكو شي مهم هنا" },
      { id: "rug-edge", x: 75, y: 30, w: 20, h: 22, message: "حرف السجادة مرفوع بس ماكو شي تحته" },
      { id: "tiles", x: 88, y: 65, w: 20, h: 20, message: "بلاط نظيف، ولا أثر واضح" },
      { id: "under-bed", x: 15, y: 8, w: 26, h: 14, message: "تحت السرير مظلم وفاضي" },
    ],
  },
  {
    id: "outletCloseup",
    label: "الطوفة والكهرباء",
    image: outletImg,
    nav: [{ to: "bedroomWide", x: 18, y: 40, w: 26, h: 40 }],
    evidence: [{ evidenceId: "phone", x: 74, y: 40, w: 14, h: 20 }],
    decoys: [
      { id: "socket-wall", x: 92, y: 20, w: 16, h: 24, message: "الطوفة سليمة، ماكو شي مهم هنا" },
      { id: "skirting", x: 60, y: 72, w: 26, h: 10, message: "وزرة البلاط نظيفة" },
      { id: "floor", x: 45, y: 92, w: 30, h: 12, message: "أرضية نظيفة، ولا أثر واضح" },
    ],
  },
];

/** Evidence that can be discovered inside the crime scene. */
export const SCENE_EVIDENCE_IDS = sceneViews.flatMap((v) =>
  v.evidence.map((e) => e.evidenceId),
);

export function getSceneView(id: string): SceneView {
  return sceneViews.find((v) => v.id === id) ?? sceneViews[0]!;
}
