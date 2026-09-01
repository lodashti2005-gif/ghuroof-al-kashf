import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

/**
 * موديلات GLB واقعية (Poly Haven — CC0، خامات PBR: BaseColor/Roughness/Normal/Metal)
 * مضغوطة (WebP + quantize + simplify) وتُحمَّل بالكاش عبر useGLTF.
 *
 * `fit` يوحّد المقاس: نقيس الـbounding box ونضبط السكيل حسب الطول أو العرض،
 * ثم نُنزل القاعدة على y = 0 حتى تقف القطعة على الأرض بشكل صحيح.
 */
export type PropName =
  | "GothicBed_01"
  | "ClassicNightstand_01"
  | "ClassicConsole_01"
  | "GothicCabinet_01"
  | "WoodenChair_01"
  | "WoodenTable_01"
  | "Chandelier_03"
  | "industrial_wall_sconce"
  | "ornate_mirror_01"
  | "hanging_picture_frame_02"
  | "fancy_picture_frame_01"
  | "vintage_oil_lamp"
  | "vintage_suitcase"
  | "throw_pillows_01"
  | "alarm_clock_01";

const src = (n: PropName) => `/models/${n}.glb`;

export function Prop({
  name,
  position = [0, 0, 0],
  rotationY = 0,
  rotationX = 0,
  height,
  width,
  /** إن كان الموديل يتعلّق على الحائط/السقف: لا نُنزل القاعدة على الأرض. */
  anchor = "floor",
  shadows = true,
}: {
  name: PropName;
  position?: [number, number, number];
  rotationY?: number;
  rotationX?: number;
  height?: number;
  width?: number;
  anchor?: "floor" | "origin";
  shadows?: boolean;
}) {
  const { scene } = useGLTF(src(name));

  const { object, offsetY } = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    let s = 1;
    if (height) s = height / Math.max(size.y, 1e-4);
    else if (width) s = width / Math.max(size.x, 1e-4);
    clone.scale.setScalar(s);
    clone.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = shadows;
      mesh.receiveShadow = shadows;
      const mat = mesh.material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[];
      const list = Array.isArray(mat) ? mat : [mat];
      for (const m of list) {
        if (m && "envMapIntensity" in m) m.envMapIntensity = 0.55;
      }
    });
    return { object: clone, offsetY: anchor === "floor" ? -box.min.y * s : 0 };
  }, [scene, height, width, anchor, shadows]);

  return (
    <group position={position} rotation-y={rotationY} rotation-x={rotationX}>
      <primitive object={object} position={[0, offsetY, 0]} />
    </group>
  );
}

Prop.preload = (names: PropName[]) => {
  for (const n of names) useGLTF.preload(src(n));
};
