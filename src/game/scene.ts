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
 * Five hidden evidence spots inside the chalet photo. The remaining case
 * material (phone records) is not physically present in the room and only
 * surfaces through interrogation.
 */
export const sceneHotspots: SceneHotspot[] = [
  // Dark wristwatch half tucked under the right edge of the rug.
  { evidenceId: "watch", x: 72.8, y: 79, w: 3.4, h: 3.6, hard: true },
  // Face-down phone charger in the shadow under the bed, lower left.
  { evidenceId: "phone", x: 15.6, y: 72, w: 3.6, h: 3.4, hard: true },
  // Coffee cup on the far right side table, in shadow.
  { evidenceId: "cup", x: 91.9, y: 49.5, w: 3.2, h: 4, hard: true },
  // Window line of sight toward the gate camera.
  { evidenceId: "camera", x: 76.7, y: 32.5, w: 4, h: 5.5, hard: true },
  // Key on the floor near the balcony threshold, faint moon reflection.
  { evidenceId: "key", x: 83.2, y: 67, w: 3.2, h: 3.4, hard: true },
];


export const sceneDecoys: SceneDecoy[] = [
  { id: "lamp", x: 53.4, y: 41, w: 5, h: 9, message: "أباجورة مضوية… ما لقيت شي مهم" },
  { id: "rug", x: 62.5, y: 69.5, w: 14, h: 8, message: "سجادة نظيفة، ما لقيت شي مهم" },
  { id: "bed", x: 30.5, y: 55, w: 18, h: 8, message: "شرشف مرتب نص ترتيب… ما لقيت شي مهم" },
  { id: "towel", x: 44, y: 50, w: 6, h: 5, message: "منشفة مرمية على طرف السرير، ما لقيت شي مهم" },
  { id: "slippers", x: 31, y: 69, w: 6, h: 5, message: "نعال، ما لقيت شي مهم" },
  { id: "curtain", x: 27, y: 30, w: 15, h: 22, message: "بردة مسدودة، ما لقيت شي مهم" },
  { id: "chair", x: 78.5, y: 53.5, w: 5, h: 9, message: "كرسي فاضي بالبلكونة… ما لقيت شي مهم" },
  { id: "nightstand", x: 8.7, y: 49.5, w: 8, h: 7, message: "كتاب وكاس ماي… ما لقيت شي مهم" },
  { id: "wall-light", x: 3, y: 22, w: 5, h: 18, message: "إضاءة جدارية بس، ما لقيت شي مهم" },
  { id: "floor", x: 45, y: 88, w: 22, h: 10, message: "أرضية فاضية، ما لقيت شي مهم" },
  { id: "ceiling", x: 51, y: 4, w: 20, h: 7, message: "السقف والمكيّف، ما لقيت شي مهم" },
];


