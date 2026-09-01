import { Canvas } from "@react-three/fiber";
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
        gl.toneMappingExposure = 1.28;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >
      <color attach="background" args={["#100e0d"]} />
      <fog attach="fog" args={["#151210", 6, 32]} />
      <Floor13World found={found} />
      <Floor13Player controls={controls} keys={keys} onNearChange={onNearChange} />
    </Canvas>
  );
}
