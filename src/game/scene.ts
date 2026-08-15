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

/**
 * The five hidden evidence spots inside the chalet photo. The scene phase is
 * complete once all five are discovered.
 */
export const sceneHotspots: SceneHotspot[] = [
  // Empty charger still plugged into the wall socket — the phone itself is gone.
  { evidenceId: "phone", x: 15.6, y: 72, w: 3.6, h: 3.4, hard: true },
  // Coffee cup with a red mark on the far right side table, in shadow.
  { evidenceId: "cup", x: 91.9, y: 49.5, w: 3.2, h: 4, hard: true },
  // Single woman's shoe on the floor beside the bed.
  { evidenceId: "shoe", x: 31, y: 69, w: 4, h: 4, hard: true },
  // Storage-room key on the floor near the threshold.
  { evidenceId: "key", x: 83.2, y: 67, w: 3.2, h: 3.4, hard: true },
  // Surveillance camera turned away from its original angle.
  { evidenceId: "camera", x: 76.7, y: 32.5, w: 4, h: 5.5, hard: true },
];

/** Evidence that can be discovered inside the crime-scene photo. */
export const SCENE_EVIDENCE_IDS = sceneHotspots.map((h) => h.evidenceId);

export const sceneDecoys: SceneDecoy[] = [
  { id: "lamp", x: 53.4, y: 41, w: 5, h: 9, message: "أباجورة مضوية… ما لقيت شي مهم" },
  { id: "dresser", x: 56.7, y: 45.5, w: 4, h: 4, message: "أشياء متفرقة على الكومدينة… ما لقيت شي مهم" },
  { id: "rug", x: 62.5, y: 69.5, w: 14, h: 8, message: "سجادة نظيفة، ما لقيت شي مهم" },

  { id: "bed", x: 30.5, y: 55, w: 18, h: 8, message: "شرشف مرتب نص ترتيب… ما لقيت شي مهم" },
  { id: "towel", x: 44, y: 50, w: 6, h: 5, message: "منشفة مرمية على طرف السرير، ما لقيت شي مهم" },
  { id: "curtain", x: 27, y: 30, w: 15, h: 22, message: "بردة مسدودة، ما لقيت شي مهم" },
  { id: "chair", x: 78.5, y: 53.5, w: 5, h: 9, message: "كرسي فاضي بالبلكونة… ما لقيت شي مهم" },
  { id: "nightstand", x: 8.7, y: 49.5, w: 8, h: 7, message: "كتاب وكاس ماي… ما لقيت شي مهم" },
  { id: "wall-light", x: 3, y: 22, w: 5, h: 18, message: "إضاءة جدارية بس، ما لقيت شي مهم" },
  { id: "floor", x: 45, y: 88, w: 22, h: 10, message: "أرضية فاضية، ما لقيت شي مهم" },
  { id: "ceiling", x: 51, y: 4, w: 20, h: 7, message: "السقف والمكيّف، ما لقيت شي مهم" },
];


