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
  { id: "door-open", x: 60, y: 45, w: 8, h: 30, message: "الباب مردود على الممر، ما لقيت شي مهم" },
  { id: "rug", x: 42, y: 82, w: 16, h: 10, message: "سجادة نظيفة، ما لقيت شي مهم" },
  { id: "plant", x: 92, y: 82, w: 8, h: 16, message: "نبتة بالزاوية، ما لقيت شي مهم" },
  { id: "ceiling", x: 35, y: 4, w: 26, h: 6, message: "السقف والإضاءة بس، ما لقيت شي مهم" },
  { id: "artwork", x: 11.5, y: 19, w: 9, h: 10, message: "لوحة معلقة على الطوفة، ما لقيت شي مهم" },
];

/**
 * Exploration zones. The player moves the camera between areas of the room
 * instead of staring at one static frame. `size` is the visible width of the
 * frame as a percentage of the photo width (smaller = closer).
 * Zones never reveal what they contain.
 */
export interface SceneZone {
  id: string;
  label: string;
  hint: string;
  /** Camera center in % of image width/height. */
  x: number;
  y: number;
  /** Visible frame width in % of image width. */
  size: number;
}

export const sceneZones: SceneZone[] = [
  { id: "door", label: "المدخل والباب", hint: "الباب مردود على الممر", x: 57, y: 82, size: 32 },
  { id: "bed", label: "منطقة السرير", hint: "السرير والجهة اليسرى", x: 25, y: 60, size: 36 },
  { id: "desk", label: "الكومدينة والطاولة", hint: "سطح الخشب والمراية", x: 44, y: 38, size: 30 },
  { id: "rug", label: "وسط الغرفة والسجادة", hint: "الأرضية والسجادة", x: 33, y: 76, size: 30 },
  { id: "outlet", label: "الطوفة والكهرباء", hint: "الجهة اليمنى والمقبس", x: 76, y: 72, size: 30 },
  { id: "hallway", label: "الممر الخارجي", hint: "برا الغرفة فوق الباب", x: 85, y: 14, size: 30 },
];


