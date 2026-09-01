import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { Floor13World } from "./floor13-world";
import { Floor13Player, type Floor13Controls } from "./floor13-player";

export default function Floor13Canvas({
  controls,
  keys,
  found,
  onNearChange,
}: {
  controls: React.RefObject<Floor13Controls>;
  keys: React.RefObject<Set<string>>;
  found: Set<string>;
  onNearChange: (id: string | null) => void;
}) {
  return (
    <Canvas
      dpr={[1, 1.6]}
      shadows="soft"
      gl={{ antialias: false, powerPreference: "high-performance" }}
      camera={{ fov: 72, near: 0.05, far: 60 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.06;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >
      <color attach="background" args={["#0d0c0b"]} />
      <fog attach="fog" args={["#17140f", 7, 34]} />
      {/* إضاءة محيطة/انعكاسات داخلية بدون أي تحميل من الشبكة */}
      <Environment resolution={64}>
        <Lightformer intensity={0.7} color="#ffe0b8" position={[0, 3, -6]} scale={[3, 1, 1]} />
        <Lightformer intensity={0.35} color="#8ea0bf" position={[0, 2, 4]} scale={[4, 2, 1]} />
        <Lightformer
          intensity={0.25}
          color="#c9b79a"
          position={[-4, 2, 0]}
          rotation-y={Math.PI / 2}
          scale={[6, 2, 1]}
        />
      </Environment>
      <Suspense fallback={null}>
        <Floor13World found={found} />
      </Suspense>
      <Floor13Player controls={controls} keys={keys} found={found} onNearChange={onNearChange} />
    </Canvas>
  );
}
