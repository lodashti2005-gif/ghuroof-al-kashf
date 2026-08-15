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
export const sceneImageSize = { width: 1535, height: 1024 };

/**
 * The six hidden evidence spots inside the chalet bedroom photo. The scene
 * phase is complete once all six are discovered.
 */
export const sceneHotspots: SceneHotspot[] = [
  // Wall socket beside the dresser: charger still plugged in, phone gone.
  { evidenceId: "phone", x: 67.8, y: 55.2, w: 4.5, h: 6 },
  // Women's single high heel dropped on the carpet.
  { evidenceId: "shoe", x: 52, y: 76.5, w: 6, h: 7 },
  // Cracked wristwatch on the marble tiles left of the carpet.
  { evidenceId: "watch", x: 16, y: 78, w: 6, h: 7 },
  // Arabic coffee cup with a red mark on the bedside table.
  { evidenceId: "cup", x: 39.5, y: 48.5, w: 4.5, h: 6 },
  // Storage-room key on the floor near the open door.
  { evidenceId: "key", x: 76, y: 64.5, w: 5, h: 6 },
  // Surveillance camera near the ceiling, turned away from its angle.
  { evidenceId: "camera", x: 82, y: 7.5, w: 7, h: 8 },
];

/** Evidence that can be discovered inside the crime-scene photo. */
export const SCENE_EVIDENCE_IDS = sceneHotspots.map((h) => h.evidenceId);

/** Decoys are placed so they never overlap an evidence hotspot. */
export const sceneDecoys: SceneDecoy[] = [
  { id: "headboard", x: 22, y: 40, w: 14, h: 12, message: "ظهر السرير سليم، ما لقيت شي مهم" },
  { id: "bed", x: 38, y: 63, w: 24, h: 16, message: "شرشف مرتب نص ترتيب… ما لقيت شي مهم" },
  { id: "lamp-left", x: 3, y: 42, w: 6, h: 14, message: "أباجورة مضوية… ما لقيت شي مهم" },
  { id: "mirror", x: 56, y: 33, w: 9, h: 13, message: "مراية نظيفة بدون أي أثر، ما لقيت شي مهم" },
  { id: "dresser", x: 57, y: 52, w: 13, h: 9, message: "دواليب الكومدينة فاضية، ما لقيت شي مهم" },
  { id: "balcony", x: 83, y: 42, w: 9, h: 28, message: "باب البلكونة مفتوح على الحديقة، ما لقيت شي مهم" },
  { id: "rug", x: 61, y: 83, w: 24, h: 15, message: "سجادة نظيفة، ما لقيت شي مهم" },
  { id: "floor-left", x: 8, y: 92, w: 16, h: 10, message: "أرضية فاضية، ما لقيت شي مهم" },
  { id: "ceiling", x: 45, y: 4, w: 28, h: 6, message: "السقف والإضاءة بس، ما لقيت شي مهم" },
  { id: "artwork", x: 16, y: 23, w: 12, h: 12, message: "لوحة معلقة على الطوفة، ما لقيت شي مهم" },
];
