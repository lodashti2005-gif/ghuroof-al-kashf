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
export const sceneImageSize = { width: 1376, height: 768 };

/**
 * The six hidden evidence spots inside the chalet bedroom photo. The scene
 * phase is complete once all six are discovered.
 */
export const sceneHotspots: SceneHotspot[] = [
  // Empty charger still plugged into the left wall socket — the phone is gone.
  { evidenceId: "phone", x: 3.6, y: 61.5, w: 5, h: 7, hard: true },
  // Women's single high heel on the carpet beside the bed.
  { evidenceId: "shoe", x: 27.6, y: 71.5, w: 5, h: 6, hard: true },
  // Cracked wristwatch on the marble floor at the carpet edge.
  { evidenceId: "watch", x: 21.8, y: 86.6, w: 12, h: 12 },
  // Arabic coffee cup with a red mark on the brass side table.
  { evidenceId: "cup", x: 79.2, y: 53.1, w: 4.5, h: 6, hard: true },
  // Storage-room key on the marble floor near the door.
  { evidenceId: "key", x: 87.6, y: 93.5, w: 5, h: 6, hard: true },
  // Surveillance camera turned away from its original angle.
  { evidenceId: "camera", x: 87.6, y: 5.9, w: 6, h: 9, hard: true },
];

/** Evidence that can be discovered inside the crime-scene photo. */
export const SCENE_EVIDENCE_IDS = sceneHotspots.map((h) => h.evidenceId);

/** Decoys are placed so they never overlap an evidence hotspot. */
export const sceneDecoys: SceneDecoy[] = [
  { id: "bed", x: 55, y: 55, w: 22, h: 14, message: "شرشف مرتب نص ترتيب… ما لقيت شي مهم" },
  { id: "headboard", x: 55, y: 25, w: 12, h: 16, message: "نقش خشبي على ظهر السرير، ما لقيت شي مهم" },
  { id: "lamp-right", x: 83.5, y: 44, w: 4, h: 10, message: "أباجورة مضوية… ما لقيت شي مهم" },
  { id: "nightstand-left", x: 52, y: 46, w: 5, h: 7, message: "كومدينة فاضية… ما لقيت شي مهم" },
  { id: "balcony", x: 25, y: 35, w: 22, h: 30, message: "باب البلكونة مسدود، ما لقيت شي مهم" },
  { id: "curtain", x: 11, y: 32, w: 12, h: 32, message: "بردة مسدودة، ما لقيت شي مهم" },
  { id: "door", x: 96, y: 50, w: 7, h: 55, message: "باب الغرفة سليم بدون أي كسر… ما لقيت شي مهم" },
  { id: "rug", x: 55, y: 82, w: 28, h: 14, message: "سجادة نظيفة، ما لقيت شي مهم" },
  { id: "floor-right", x: 70, y: 92, w: 16, h: 10, message: "أرضية فاضية، ما لقيت شي مهم" },
  { id: "ceiling", x: 45, y: 4, w: 30, h: 6, message: "السقف والإضاءة بس، ما لقيت شي مهم" },
];
