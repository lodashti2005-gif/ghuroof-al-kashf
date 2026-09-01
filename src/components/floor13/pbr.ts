import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

/**
 * خامات PBR واقعية (Poly Haven — CC0) محوّلة إلى WebP بدقة 1024.
 * تُحمَّل عبر Suspense داخل الـCanvas، وكل خامة تُشارك نفس الكاش بين المكونات.
 */
export type PbrName =
  | "dirty_carpet"
  | "decrepit_wallpaper"
  | "beige_wall_001"
  | "wood_floor"
  | "velour_velvet"
  | "quatrefoil_jacquard_fabric"
  | "rough_linen"
  | "worn_plaster_wall"
  | "oak_veneer_01";

export interface PbrMaps {
  map: THREE.Texture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
}

const url = (n: PbrName, m: string) => `/textures/${n}_${m}.webp`;

/**
 * يرجّع نسخة مستقلة (clone) من الخامات مع تكرار/إزاحة مخصصين،
 * حتى نستخدم نفس الملف بتكرارات مختلفة دون تعارض.
 */
export function usePbr(
  name: PbrName,
  repeat: [number, number] = [1, 1],
  offset: [number, number] = [0, 0],
  rotation = 0,
): PbrMaps {
  const loaded = useTexture([url(name, "diff"), url(name, "nor"), url(name, "rough")]) as THREE.Texture[];

  return useMemo(() => {
    const [diff, nor, rough] = loaded;
    const prep = (src: THREE.Texture, color: boolean) => {
      const t = src.clone();
      t.needsUpdate = true;
      t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeat[0], repeat[1]);
      t.offset.set(offset[0], offset[1]);
      t.center.set(0.5, 0.5);
      t.rotation = rotation;
      t.anisotropy = 4;
      return t;
    };
    return {
      map: prep(diff!, true),
      normalMap: prep(nor!, false),
      roughnessMap: prep(rough!, false),
    };
  }, [loaded, repeat[0], repeat[1], offset[0], offset[1], rotation]);
}

usePbr.preload = (names: PbrName[]) => {
  for (const n of names) {
    useTexture.preload([url(n, "diff"), url(n, "nor"), url(n, "rough")]);
  }
};
