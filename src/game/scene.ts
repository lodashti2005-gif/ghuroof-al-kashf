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

export const sceneHotspots: SceneHotspot[] = [
  // Broken watch on the floor beside the rug — small, blends with the dark floor.
  { evidenceId: "watch", x: 72.4, y: 76.2, w: 3.6, h: 4.6, hard: true },
  // Charger cable with no phone attached, half in shadow.
  { evidenceId: "phone", x: 66, y: 82.5, w: 4.2, h: 4.4, hard: true },
  // Coffee cup on the floor near the rug edge.
  { evidenceId: "cup", x: 74.2, y: 69.5, w: 3.4, h: 5, hard: true },
  // Second phone lost in the dark on the far right.
  { evidenceId: "message", x: 84.4, y: 78.2, w: 3.2, h: 3.6, hard: true },
  // Window line of sight toward the gate camera.
  { evidenceId: "camera", x: 76.2, y: 33, w: 4, h: 6, hard: true },
  // Nightstand clutter on the far left.
  { evidenceId: "key", x: 8, y: 51.5, w: 4.2, h: 5, hard: true },
];

export const sceneDecoys: SceneDecoy[] = [
  { id: "lamp", x: 53.5, y: 42.5, w: 5, h: 8, message: "أباجورة مضوية… ما لقيت شي مهم" },
  { id: "rug", x: 58, y: 71.5, w: 10, h: 6, message: "سجادة نظيفة، ما لقيت شي مهم" },
  { id: "bed", x: 33, y: 56, w: 20, h: 8, message: "شرشف مرتب نص ترتيب… ما لقيت شي مهم" },
  { id: "curtain", x: 26, y: 27, w: 16, h: 22, message: "بردة مسدودة، ما لقيت شي مهم" },
  { id: "chair", x: 79.5, y: 54, w: 5, h: 9, message: "كرسي فاضي بالبلكونة… ما لقيت شي مهم" },
  { id: "dresser", x: 56, y: 54, w: 10, h: 7, message: "كومدينة فاضية من فوق، ما لقيت شي مهم" },
  { id: "wall-light", x: 3, y: 22, w: 5, h: 18, message: "إضاءة جدارية بس، ما لقيت شي مهم" },
  { id: "cable", x: 40, y: 88, w: 12, h: 6, message: "أسلاك وشاحن مرمّي… ما لقيت شي مهم" },
  { id: "side-table", x: 90.5, y: 57, w: 7, h: 8, message: "طاولة جانبية، ما لقيت شي مهم" },
  { id: "ceiling", x: 47, y: 4, w: 18, h: 7, message: "السقف والمكيّف، ما لقيت شي مهم" },
];

