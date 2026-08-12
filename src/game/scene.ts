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

export const sceneImage = crimeScene;

export const sceneHotspots: SceneHotspot[] = [
  // Broken watch on the floor beside the rug (fairly visible).
  { evidenceId: "watch", x: 72, y: 75, w: 8, h: 10 },
  // Charger cable with no phone attached (fairly visible).
  { evidenceId: "phone", x: 65, y: 84, w: 12, h: 10 },
  // Coffee cup left on the floor near the rug.
  { evidenceId: "cup", x: 74.5, y: 69, w: 7, h: 9 },
  // Second phone half-lost in the dark on the right (hard).
  { evidenceId: "message", x: 84.5, y: 78, w: 6, h: 7, hard: true },
  // Window / entrance line of sight toward the gate camera (hard).
  { evidenceId: "camera", x: 76, y: 33, w: 8, h: 14, hard: true },
  // Nightstand clutter on the far left (hard).
  { evidenceId: "key", x: 8, y: 52, w: 9, h: 10, hard: true },
];
