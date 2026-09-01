import { useMemo } from "react";
import * as THREE from "three";
import { FLOOR13_EVIDENCE, FLOOR13_LAYOUT } from "@/game/cases/floor13/scene-data";
import { carpetTexture, signTexture, wallpaperTexture, woodTexture } from "./textures";

const H = FLOOR13_LAYOUT.wallHeight;
const T = 0.16;

function Wall({
  a,
  b,
  height = H,
  y = 0,
  map,
}: {
  a: [number, number];
  b: [number, number];
  height?: number;
  y?: number;
  map?: THREE.Texture;
}) {
  const cx = (a[0] + b[0]) / 2;
  const cz = (a[1] + b[1]) / 2;
  const dx = Math.abs(b[0] - a[0]);
  const dz = Math.abs(b[1] - a[1]);
  const w = Math.max(dx, T);
  const d = Math.max(dz, T);
  return (
    <mesh position={[cx, y + height / 2, cz]}>
      <boxGeometry args={[w, height, d]} />
      <meshStandardMaterial map={map ?? null} color={map ? "#ffffff" : "#2a2321"} roughness={0.95} />
    </mesh>
  );
}

function CeilingLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.5, 0.06, 0.5]} />
        <meshStandardMaterial
          color="#221c17"
          emissive="#ffb765"
          emissiveIntensity={0.7}
          roughness={0.6}
        />
      </mesh>
      <pointLight color="#ffb066" intensity={7} distance={9} decay={2} position={[0, -0.3, 0]} />
    </group>
  );
}

function EvidenceGlint({
  position,
  found,
}: {
  position: [number, number, number];
  found: boolean;
}) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.055, 8, 8]} />
      <meshStandardMaterial
        color={found ? "#5b7d63" : "#d9c08a"}
        emissive={found ? "#3f6b4c" : "#c79b4a"}
        emissiveIntensity={found ? 0.5 : 1.1}
        roughness={0.4}
      />
    </mesh>
  );
}

export function Floor13World({ found }: { found: Set<string> }) {
  const carpet = useMemo(() => carpetTexture(), []);
  const paper = useMemo(() => wallpaperTexture([4, 1]), []);
  const wood = useMemo(() => woodTexture([2, 1]), []);
  const floorSign = useMemo(() => signTexture("١٣", "الطابق"), []);
  const roomSign = useMemo(() => signTexture("١٣٠٦"), []);

  const c = FLOOR13_LAYOUT.corridor;
  const r = FLOOR13_LAYOUT.room;
  const corridorLen = c.z1 - c.z0;
  const roomW = r.x1 - r.x0;
  const roomLen = r.z1 - r.z0;

  return (
    <group>
      {/* ===== أرضيات ===== */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, (c.z0 + c.z1) / 2]}>
        <planeGeometry args={[c.x1 - c.x0, corridorLen]} />
        <meshStandardMaterial map={carpet} roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[(r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2]}>
        <planeGeometry args={[roomW, roomLen]} />
        <meshStandardMaterial map={carpet} roughness={1} />
      </mesh>

      {/* ===== أسقف ===== */}
      <mesh rotation-x={Math.PI / 2} position={[0, H, (c.z0 + c.z1) / 2]}>
        <planeGeometry args={[c.x1 - c.x0, corridorLen]} />
        <meshStandardMaterial color="#1b1714" roughness={1} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[(r.x0 + r.x1) / 2, H, (r.z0 + r.z1) / 2]}>
        <planeGeometry args={[roomW, roomLen]} />
        <meshStandardMaterial color="#1b1714" roughness={1} />
      </mesh>

      {/* ===== طوفات الممر ===== */}
      <Wall a={[c.x0, c.z0]} b={[c.x0, c.z1]} map={paper} />
      <Wall a={[c.x1, c.z1]} b={[c.x1, -16.8]} map={paper} />
      <Wall a={[c.x1, -19.2]} b={[c.x1, c.z0]} map={paper} />
      <Wall a={[c.x0, c.z0]} b={[c.x1, c.z0]} map={paper} />
      {/* طوفة المصعد خلف اللاعب */}
      <Wall a={[c.x0, c.z1]} b={[c.x1, c.z1]} map={paper} />

      {/* باب المصعد المعدني */}
      <mesh position={[0, 1.1, c.z1 - 0.09]}>
        <boxGeometry args={[1.7, 2.2, 0.06]} />
        <meshStandardMaterial color="#4a4a4d" metalness={0.7} roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.1, c.z1 - 0.13]}>
        <boxGeometry args={[0.03, 2.2, 0.02]} />
        <meshStandardMaterial color="#17161a" />
      </mesh>
      {/* لوحة الطابق ١٣ فوق المصعد */}
      <mesh position={[0, 2.55, c.z1 - 0.1]}>
        <planeGeometry args={[0.75, 0.75]} />
        <meshStandardMaterial map={floorSign} toneMapped={false} />
      </mesh>

      {/* ===== غرفة ١٣٠٦ ===== */}
      <Wall a={[r.x1, r.z0]} b={[r.x1, r.z1]} map={paper} />
      <Wall a={[r.x0, r.z1]} b={[r.x1, r.z1]} map={paper} />
      <Wall a={[r.x0, r.z0]} b={[r.x1, r.z0]} map={paper} />

      {/* باب الغرفة مفتوح (لوحة خشب مائلة داخل المدخل) */}
      <mesh position={[2.35, 1.05, -17.15]} rotation-y={-0.5}>
        <boxGeometry args={[0.06, 2.1, 1.05]} />
        <meshStandardMaterial map={wood} roughness={0.8} />
      </mesh>
      {/* لوحة رقم الغرفة على طوفة الممر جنب الباب */}
      <mesh position={[c.x1 - 0.09, 1.75, -16.3]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[0.45, 0.45]} />
        <meshStandardMaterial map={roomSign} toneMapped={false} />
      </mesh>

      {/* ===== أثاث الغرفة ===== */}
      {/* مكتب */}
      <group position={[6.5, 0, -22.2]}>
        <mesh position={[0, 0.74, 0]}>
          <boxGeometry args={[1.9, 0.08, 0.85]} />
          <meshStandardMaterial map={wood} roughness={0.7} />
        </mesh>
        {[
          [-0.85, -0.35],
          [0.85, -0.35],
          [-0.85, 0.35],
          [0.85, 0.35],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x!, 0.37, z!]}>
            <boxGeometry args={[0.08, 0.74, 0.08]} />
            <meshStandardMaterial color="#2c2019" roughness={0.8} />
          </mesh>
        ))}
        {/* أباجورة المكتب */}
        <mesh position={[-0.7, 0.95, 0.1]}>
          <cylinderGeometry args={[0.16, 0.2, 0.22, 10]} />
          <meshStandardMaterial
            color="#c9a86a"
            emissive="#ffcf8a"
            emissiveIntensity={0.9}
            roughness={0.5}
          />
        </mesh>
        <pointLight position={[-0.7, 1.0, 0.1]} color="#ffc078" intensity={4} distance={4.5} />
        {/* ورقة على المكتب */}
        <mesh rotation-x={-Math.PI / 2} position={[0.1, 0.785, 0]}>
          <planeGeometry args={[0.28, 0.4]} />
          <meshStandardMaterial color="#d8d2c4" roughness={0.9} />
        </mesh>
      </group>

      {/* كرسي */}
      <group position={[6.4, 0, -20.9]}>
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.55, 0.08, 0.55]} />
          <meshStandardMaterial color="#3a2b23" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.78, 0.24]}>
          <boxGeometry args={[0.55, 0.6, 0.07]} />
          <meshStandardMaterial color="#3a2b23" roughness={0.9} />
        </mesh>
        {[
          [-0.22, -0.22],
          [0.22, -0.22],
          [-0.22, 0.22],
          [0.22, 0.22],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x!, 0.22, z!]}>
            <boxGeometry args={[0.06, 0.45, 0.06]} />
            <meshStandardMaterial color="#241a15" roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* سجادة وسط الغرفة */}
      <mesh rotation-x={-Math.PI / 2} position={[5.4, 0.012, -19.2]}>
        <planeGeometry args={[3.2, 2.3]} />
        <meshStandardMaterial color="#4a2f2a" roughness={1} />
      </mesh>

      {/* سرير */}
      <group position={[3.4, 0, -16.6]}>
        <mesh position={[0, 0.28, 0]}>
          <boxGeometry args={[1.5, 0.55, 2.1]} />
          <meshStandardMaterial color="#2f2622" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[1.45, 0.12, 2.0]} />
          <meshStandardMaterial color="#6a6055" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.72, -0.82]}>
          <boxGeometry args={[1.1, 0.16, 0.4]} />
          <meshStandardMaterial color="#8d8478" roughness={0.9} />
        </mesh>
      </group>

      {/* كومدينة */}
      <mesh position={[2.4, 0.32, -18.1]}>
        <boxGeometry args={[0.55, 0.64, 0.5]} />
        <meshStandardMaterial map={wood} roughness={0.8} />
      </mesh>

      {/* دولاب */}
      <mesh position={[8.9, 1.05, -15.4]}>
        <boxGeometry args={[0.6, 2.1, 1.4]} />
        <meshStandardMaterial map={wood} roughness={0.85} />
      </mesh>

      {/* ===== إضاءة ===== */}
      <ambientLight intensity={0.16} color="#6b7080" />
      <CeilingLamp position={[0, H - 0.08, -3]} />
      <CeilingLamp position={[0, H - 0.08, -10]} />
      <CeilingLamp position={[0, H - 0.08, -17.5]} />
      <CeilingLamp position={[5.6, H - 0.08, -19]} />

      {/* ===== نقاط الأدلة ===== */}
      {FLOOR13_EVIDENCE.map((e) => (
        <EvidenceGlint key={e.id} position={e.position} found={found.has(e.id)} />
      ))}
    </group>
  );
}
