import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  FLOOR13_EVIDENCE,
  FLOOR13_LAYOUT,
  FLOOR13_SPAWN,
  FLOOR13_SPAWN_YAW,
  isInsideWalkable,
} from "@/game/cases/floor13/scene-data";

export interface Floor13Controls {
  /** عصا التحكم: x = يمين/يسار، y = أمام/خلف (‎-1..1‎) */
  move: { x: number; y: number };
  /** دلتا النظر المتجمعة (بكسل) — تُستهلك كل فريم */
  look: { dx: number; dy: number };
}

const SPEED = 2.35;
const LOOK_SENS = 0.0032;
const FORWARD = new THREE.Vector3();
const RIGHT = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

export function Floor13Player({
  controls,
  keys,
  onNearChange,
}: {
  controls: React.RefObject<Floor13Controls>;
  keys: React.RefObject<Set<string>>;
  onNearChange: (id: string | null) => void;
}) {
  const camera = useThree((s) => s.camera);
  const yaw = useRef(FLOOR13_SPAWN_YAW);
  const pitch = useRef(0);
  const nearId = useRef<string | null>(null);

  useEffect(() => {
    camera.position.set(...FLOOR13_SPAWN);
    camera.rotation.order = "YXZ";
    camera.rotation.set(0, FLOOR13_SPAWN_YAW, 0);
  }, [camera]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const c = controls.current;
    const k = keys.current;
    if (!c || !k) return;

    // ==== النظر ====
    yaw.current -= c.look.dx * LOOK_SENS;
    pitch.current -= c.look.dy * LOOK_SENS;
    c.look.dx = 0;
    c.look.dy = 0;
    pitch.current = Math.max(-1.15, Math.min(1.15, pitch.current));
    camera.rotation.set(pitch.current, yaw.current, 0);

    // ==== الحركة (نسبةً للكاميرا) ====
    let fwd = -c.move.y;
    let strafe = c.move.x;
    if (k.has("KeyW") || k.has("ArrowUp")) fwd += 1;
    if (k.has("KeyS") || k.has("ArrowDown")) fwd -= 1;
    if (k.has("KeyD")) strafe += 1;
    if (k.has("KeyA")) strafe -= 1;
    if (k.has("ArrowRight")) yaw.current -= 1.6 * delta;
    if (k.has("ArrowLeft")) yaw.current += 1.6 * delta;

    fwd = Math.max(-1, Math.min(1, fwd));
    strafe = Math.max(-1, Math.min(1, strafe));

    if (fwd !== 0 || strafe !== 0) {
      camera.getWorldDirection(FORWARD);
      FORWARD.y = 0;
      FORWARD.normalize();
      RIGHT.crossVectors(FORWARD, UP).normalize();
      const len = Math.hypot(fwd, strafe) || 1;
      const step = (SPEED * delta) / len;
      const nx = FORWARD.x * fwd * step + RIGHT.x * strafe * step;
      const nz = FORWARD.z * fwd * step + RIGHT.z * strafe * step;
      // تصادم بسيط: كل محور لحاله حتى ينزلق على الطوفة
      const px = camera.position.x;
      const pz = camera.position.z;
      if (isInsideWalkable(px + nx, pz)) camera.position.x = px + nx;
      if (isInsideWalkable(camera.position.x, pz + nz)) camera.position.z = pz + nz;
    }
    camera.position.y = FLOOR13_LAYOUT.eyeHeight;

    (window as unknown as Record<string, unknown>).__f13 = {
      p: camera.position.toArray(),
      yaw: yaw.current,
      fwd,
      keys: [...k],
    };
    // ==== أقرب دليل ====
    let best: string | null = null;
    let bestD = Infinity;
    for (const e of FLOOR13_EVIDENCE) {
      const r = e.radius ?? 1.9;
      const dx = e.position[0] - camera.position.x;
      const dz = e.position[2] - camera.position.z;
      const d = Math.hypot(dx, dz);
      if (d <= r && d < bestD) {
        bestD = d;
        best = e.id;
      }
    }
    if (best !== nearId.current) {
      nearId.current = best;
      onNearChange(best);
    }
  });

  return null;
}
