import crimeScene from "@/assets/crime-scene.jpg";

/**
 * Interactive crime-scene hotspots. Coordinates are percentages of the scene
 * image, so the overlay scales with any viewport. Hotspots are intentionally
 * invisible in the UI: the players must inspect the photo themselves.
 *
 * `hard` marks spots hidden inside fine detail (smaller target).
 */
export interface SceneHotspot {
  evidenceId: string;
  /** Center X in % of image width. */
  x: number;
  /** Center Y in % of image height. */
  y: number;
  /** Hit-area width in % of image width. */
  w: number;
  /** Hit-area height in % of image height. */
  h: number;
  hard?: boolean;
}

/** Clickable props that are NOT evidence. Clicking them returns a short line. */
export interface SceneDecoy {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  message: string;
}

export const sceneImage = crimeScene;

/** Natural pixel size of the scene photograph. */
export const sceneImageSize = { width: 1536, height: 1024 };

/**
 * The six hidden evidence spots inside the chalet bedroom photo. The scene
 * phase is complete once all six are discovered.
 */
export const sceneHotspots: SceneHotspot[] = [
  // Cracked wristwatch in the middle of the patterned rug.
  { evidenceId: "watch", x: 33.4, y: 77.8, w: 5, h: 6 },
  // Black high heel on the floor tiles left of the bed.
  { evidenceId: "shoe", x: 15.4, y: 72.5, w: 5, h: 6.5 },
  // Turkish coffee cup on the wooden dresser.
  { evidenceId: "cup", x: 46, y: 36.2, w: 4, h: 5 },
  // Charger still plugged into the wall socket by the room entrance.
  { evidenceId: "phone", x: 74.4, y: 74.5, w: 5, h: 7 },
  // Golden key on the floor tiles near the open door.
  { evidenceId: "key", x: 53.4, y: 94, w: 5, h: 5.5 },
  // Surveillance camera outside the room, upper right above the door.
  { evidenceId: "camera", x: 86.5, y: 9, w: 6, h: 7 },
];

/** Evidence that can be discovered inside the crime-scene photo. */
export const SCENE_EVIDENCE_IDS = sceneHotspots.map((h) => h.evidenceId);

/** Decoys are placed so they never overlap an evidence hotspot. */
export const sceneDecoys: SceneDecoy[] = [
  { id: "headboard", x: 14, y: 33, w: 14, h: 10, message: "ظهر السرير سليم، ما لقيت شي مهم" },
  { id: "bed", x: 26, y: 52, w: 22, h: 14, message: "شرشف مرتب نص ترتيب… ما لقيت شي مهم" },
  { id: "lamp-left", x: 28.5, y: 36, w: 5, h: 8, message: "أباجورة مضوية… ما لقيت شي مهم" },
  { id: "window", x: 27, y: 20, w: 12, h: 12, message: "الدريشة مقفلة، ما لقيت شي مهم" },
  { id: "mirror", x: 42, y: 22, w: 8, h: 12, message: "مراية نظيفة بدون أي أثر، ما لقيت شي مهم" },
  { id: "dresser", x: 42, y: 45, w: 12, h: 8, message: "دواليب الكومدينة فاضية، ما لقيت شي مهم" },
  { id: "rug", x: 42, y: 82, w: 16, h: 10, message: "سجادة نظيفة، ما لقيت شي مهم" },
  { id: "plant", x: 92, y: 82, w: 8, h: 16, message: "نبتة بالزاوية، ما لقيت شي مهم" },
  { id: "ceiling", x: 35, y: 4, w: 26, h: 6, message: "السقف والإضاءة بس، ما لقيت شي مهم" },
  { id: "artwork", x: 11.5, y: 19, w: 9, h: 10, message: "لوحة معلقة على الطوفة، ما لقيت شي مهم" },
];

/**
 * First-person point-and-click views. The player never sees a menu: every move
 * happens by clicking a real object inside the photo. `size` is the visible
 * width/height of the frame as a percentage of the photo (smaller = closer).
 */
export interface SceneNavHotspot {
  /** Target view id. */
  to: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SceneView {
  id: string;
  /** Internal label only (small overlay caption), never a navigation menu. */
  label: string;
  x: number;
  y: number;
  size: number;
  nav: SceneNavHotspot[];
}

export const SCENE_START_VIEW = "hallway";

export const sceneViews: SceneView[] = [
  {
    id: "hallway",
    label: "الممر الخارجي",
    x: 75,
    y: 30,
    size: 58,
    // Click the bedroom door itself to step inside.
    nav: [{ to: "room", x: 61, y: 48, w: 12, h: 34 }],
  },
  {
    id: "room",
    label: "داخل الغرفة",
    x: 45,
    y: 55,
    size: 88,
    nav: [
      // The bed itself.
      { to: "bed", x: 26, y: 52, w: 24, h: 18 },
      // The dresser / mirror surface.
      { to: "desk", x: 43, y: 40, w: 16, h: 16 },
      // Center of the room / rug.
      { to: "rug", x: 34, y: 80, w: 22, h: 14 },
      // Right wall and power outlet.
      { to: "outlet", x: 78, y: 70, w: 18, h: 22 },
      // Doorway seen from inside → back to the hallway.
      { to: "door", x: 60, y: 60, w: 10, h: 26 },
    ],
  },
  {
    id: "bed",
    label: "منطقة السرير",
    x: 25,
    y: 60,
    size: 38,
    nav: [{ to: "room", x: 40, y: 44, w: 8, h: 8 }],
  },
  {
    id: "desk",
    label: "الكومدينة والمراية",
    x: 44,
    y: 38,
    size: 32,
    nav: [{ to: "room", x: 55, y: 50, w: 8, h: 8 }],
  },
  {
    id: "rug",
    label: "وسط الغرفة",
    x: 33,
    y: 76,
    size: 32,
    nav: [{ to: "room", x: 22, y: 64, w: 8, h: 8 }],
  },
  {
    id: "outlet",
    label: "الطوفة والكهرباء",
    x: 76,
    y: 72,
    size: 32,
    nav: [{ to: "room", x: 64, y: 60, w: 8, h: 8 }],
  },
  {
    id: "door",
    label: "عند الباب",
    x: 57,
    y: 82,
    size: 34,
    nav: [
      // Step back out to the hallway through the partially closed door.
      { to: "hallway", x: 66, y: 70, w: 10, h: 14 },
      { to: "room", x: 46, y: 74, w: 10, h: 12 },
    ],
  },
];

export function getSceneView(id: string): SceneView {
  return sceneViews.find((v) => v.id === id) ?? sceneViews[0]!;
}

/** True when a point (in image %) falls inside the visible frame of a view. */
export function inView(view: SceneView, x: number, y: number, pad = 1) {
  const half = view.size / 2 + pad;
  return Math.abs(x - view.x) <= half && Math.abs(y - view.y) <= half;
}



