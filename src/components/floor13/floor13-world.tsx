import { Suspense, useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { FLOOR13_LAYOUT } from "@/game/cases/floor13/scene-data";
import { signTexture } from "./textures";
import { usePbr } from "./pbr";
import { Prop } from "./prop";

const H = FLOOR13_LAYOUT.wallHeight;
const T = 0.16;

/** طوفة مبنية بخامة PBR واقعية + وزرة خشب وحافة علوية. */
function Wall({
  a,
  b,
  height = H,
  y = 0,
  repeatScale = 0.55,
}: {
  a: [number, number];
  b: [number, number];
  height?: number;
  y?: number;
  repeatScale?: number;
}) {
  const cx = (a[0] + b[0]) / 2;
  const cz = (a[1] + b[1]) / 2;
  const dx = Math.abs(b[0] - a[0]);
  const dz = Math.abs(b[1] - a[1]);
  const w = Math.max(dx, T);
  const d = Math.max(dz, T);
  const along = dx > dz;
  const len = Math.max(dx, dz);
  const paper = usePbr(
    "decrepit_wallpaper",
    [Math.max(1, len * repeatScale), Math.max(1, height * repeatScale * 1.1)],
    [(cx + cz) * 0.13, 0],
  );
  const wood = usePbr("wood_floor", [Math.max(1, len * 0.5), 1]);
  const bw = along ? w : T * 1.35;
  const bd = along ? T * 1.35 : d;
  return (
    <group>
      <mesh position={[cx, y + height / 2, cz]} receiveShadow>
        <boxGeometry args={[w, height, d]} />
        <meshStandardMaterial {...paper} color="#a9a094" roughness={0.95} normalScale={[0.85, 0.85]} />
      </mesh>
      {/* وزرة خشب */}
      <mesh position={[cx, y + 0.085, cz]} receiveShadow>
        <boxGeometry args={[bw, 0.17, bd]} />
        <meshStandardMaterial {...wood} color="#8a7561" roughness={0.75} />
      </mesh>
      {/* حافة علوية (كرنيش) */}
      <mesh position={[cx, y + height - 0.07, cz]} receiveShadow>
        <boxGeometry args={[bw, 0.12, bd]} />
        <meshStandardMaterial color="#a9a096" roughness={0.85} />
      </mesh>
    </group>
  );
}

/** إطار باب خشبي واقعي + لوحة باب بخامة خشب PBR + مقبض نحاسي. */
function DoorUnit({
  position,
  rotationY = 0,
  open = 0,
  sign,
}: {
  position: [number, number, number];
  rotationY?: number;
  open?: number;
  sign?: THREE.Texture;
}) {
  const w = 1.0;
  const h = 2.15;
  const wood = usePbr("wood_floor", [1.4, 2.4]);
  const frameWood = usePbr("wood_floor", [0.4, 2.6]);
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh position={[-(w / 2 + 0.06), h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.12, h + 0.12, 0.18]} />
        <meshStandardMaterial {...frameWood} color="#9c8873" roughness={0.7} />
      </mesh>
      <mesh position={[w / 2 + 0.06, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.12, h + 0.12, 0.18]} />
        <meshStandardMaterial {...frameWood} color="#9c8873" roughness={0.7} />
      </mesh>
      <mesh position={[0, h + 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[w + 0.24, 0.12, 0.18]} />
        <meshStandardMaterial {...frameWood} color="#9c8873" roughness={0.7} />
      </mesh>
      <group position={[-w / 2, 0, 0]} rotation-y={open}>
        <group position={[w / 2, 0, 0]}>
          <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[w, h, 0.055]} />
            <meshStandardMaterial {...wood} color="#7d6853" roughness={0.55} />
          </mesh>
          {[0.68, 0.3].map((f) => (
            <mesh key={f} position={[0, h * f, 0.032]} receiveShadow>
              <boxGeometry args={[w * 0.66, h * 0.28, 0.014]} />
              <meshStandardMaterial {...wood} color="#5f4d3c" roughness={0.6} />
            </mesh>
          ))}
          <mesh position={[w * 0.36, 1.05, 0.075]} rotation-x={Math.PI / 2} castShadow>
            <cylinderGeometry args={[0.024, 0.024, 0.13, 12]} />
            <meshStandardMaterial color="#c9a869" metalness={0.95} roughness={0.22} />
          </mesh>
          <mesh position={[w * 0.36, 1.05, 0.035]}>
            <cylinderGeometry args={[0.048, 0.048, 0.02, 14]} />
            <meshStandardMaterial color="#b0904f" metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      </group>
      {sign && (
        <mesh position={[w / 2 + 0.3, 1.72, 0.11]}>
          <planeGeometry args={[0.3, 0.3]} />
          <meshStandardMaterial map={sign} roughness={0.5} metalness={0.3} />
        </mesh>
      )}
    </group>
  );
}

/** شمعدان حائط (موديل واقعي) + ضوء دافئ محايد. لمبة واحدة فقط تعمل flicker نادر. */
function Sconce({
  position,
  rotationY = 0,
  intensity = 2.1,
  flicker = false,
}: {
  position: [number, number, number];
  rotationY?: number;
  intensity?: number;
  flicker?: boolean;
}) {
  const light = useRef<THREE.PointLight>(null);
  const glow = useRef<THREE.Mesh>(null);
  const next = useRef(6 + Math.random() * 10);
  const t = useRef(0);
  const dip = useRef(0);

  useFrame((_, delta) => {
    if (!flicker) return;
    t.current += delta;
    if (dip.current > 0) {
      dip.current -= delta;
      const f = 0.35 + Math.random() * 0.45;
      if (light.current) light.current.intensity = intensity * f;
      if (glow.current) {
        (glow.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + f;
      }
      if (dip.current <= 0) {
        if (light.current) light.current.intensity = intensity;
        if (glow.current) {
          (glow.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.1;
        }
      }
      return;
    }
    if (t.current > next.current) {
      t.current = 0;
      next.current = 9 + Math.random() * 14;
      dip.current = 0.22 + Math.random() * 0.3;
    }
  });

  return (
    <group position={position} rotation-y={rotationY}>
      <Prop name="industrial_wall_sconce" height={0.42} anchor="origin" />
      <mesh ref={glow} position={[0, 0.02, 0.14]}>
        <sphereGeometry args={[0.045, 10, 8]} />
        <meshStandardMaterial color="#fff3e2" emissive="#ffe3c2" emissiveIntensity={1.1} toneMapped={false} />
      </mesh>
      <pointLight
        ref={light}
        color="#ffdec2"
        intensity={intensity}
        distance={6.5}
        decay={2}
        position={[0, 0.05, 0.24]}
      />
    </group>
  );
}

/** ثريّة سقف واقعية + ضوء الغرفة/الممر. */
function Chandelier({
  position,
  castShadow = false,
  intensity = 6,
}: {
  position: [number, number, number];
  castShadow?: boolean;
  intensity?: number;
}) {
  return (
    <group position={position}>
      <Prop name="Chandelier_03" height={0.8} anchor="origin" shadows={false} />
      <mesh position={[0, -0.52, 0]}>
        <sphereGeometry args={[0.07, 10, 8]} />
        <meshStandardMaterial color="#fff6ea" emissive="#ffe9d0" emissiveIntensity={1.15} toneMapped={false} />
      </mesh>
      <pointLight
        color="#ffe6cd"
        intensity={intensity}
        distance={13}
        decay={2}
        position={[0, -0.58, 0]}
        castShadow={castShadow}
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-bias={-0.0025}
      />
    </group>
  );
}

/** مفتاح كهرباء (تفصيلة صغيرة). */
function LightSwitch({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh castShadow>
        <boxGeometry args={[0.085, 0.125, 0.014]} />
        <meshStandardMaterial color="#cdc7ba" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0, 0.012]}>
        <boxGeometry args={[0.036, 0.055, 0.01]} />
        <meshStandardMaterial color="#a49d90" roughness={0.4} />
      </mesh>
    </group>
  );
}

/** ستارة داكنة بخامة PBR (طيّات أسطوانية ناعمة + قضيب نحاسي). */
function Curtain({ position, width = 2.1 }: { position: [number, number, number]; width?: number }) {
  const velvet = usePbr("velour_velvet", [0.6, 2.2]);
  const folds = 9;
  return (
    <group position={position}>
      <mesh position={[0, 1.16, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.022, 0.022, width + 0.3, 10]} />
        <meshStandardMaterial color="#a98c52" metalness={0.9} roughness={0.3} />
      </mesh>
      {Array.from({ length: folds }).map((_, i) => {
        const x = -width / 2 + (i / (folds - 1)) * width;
        const r = 0.05 + (i % 2 === 0 ? 0.018 : 0);
        return (
          <mesh key={i} position={[x, 0.04, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[r, r * 1.2, 2.22, 8]} />
            <meshStandardMaterial {...velvet} color="#4d3a38" roughness={0.96} />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * تحميل تدريجي: يعرض محتواه فقط عندما يقترب اللاعب من المنطقة
 * (قراءة موضع الكاميرا فقط — بدون أي تعديل على منطق الحركة/التحكم).
 */
function Zone({ z, children }: { z: number; children: ReactNode }) {
  const camera = useThree((s) => s.camera);
  const [active, setActive] = useState(false);
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    if (camera.position.z < z) {
      done.current = true;
      setActive(true);
    }
  });
  return active ? <Suspense fallback={null}>{children}</Suspense> : null;
}

/* ============ أغراض الأدلة: مجسمات طبيعية بدون أي علامات عائمة ============ */

/** بطاقة مفتاح على السجادة قرب المصعد. */
function KeycardProp() {
  return (
    <group position={[-0.72, 0.012, -1.5]} rotation-y={0.6}>
      <mesh rotation-x={-Math.PI / 2} castShadow receiveShadow>
        <boxGeometry args={[0.055, 0.086, 0.004]} />
        <meshStandardMaterial color="#2c2f38" roughness={0.35} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.004, 0.02]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.04, 0.012]} />
        <meshStandardMaterial color="#b8a271" roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  );
}

/** هاتف مطفي جنب طوفة الممر. */
function PhoneProp() {
  return (
    <group position={[-0.95, 0.02, -12.9]} rotation-y={-0.35}>
      <mesh rotation-x={-Math.PI / 2} castShadow receiveShadow>
        <boxGeometry args={[0.07, 0.145, 0.011]} />
        <meshStandardMaterial color="#14161a" roughness={0.28} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.007, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.062, 0.132]} />
        <meshStandardMaterial color="#0a0c10" roughness={0.12} metalness={0.5} />
      </mesh>
    </group>
  );
}

/** ورقة على المكتب. */
function DeskNoteProp() {
  return (
    <group position={[3.05, 0.775, -19.0]} rotation-y={0.18}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow castShadow>
        <planeGeometry args={[0.19, 0.26]} />
        <meshStandardMaterial color="#ddd2bc" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.002, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.12, 0.012]} />
        <meshStandardMaterial color="#3a3128" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** حلق ذهبي صغير على الكومدينة. */
function EarringProp() {
  return (
    <group position={[7.05, 0.725, -16.35]}>
      <mesh rotation-x={Math.PI / 2.4} castShadow>
        <torusGeometry args={[0.021, 0.005, 8, 18]} />
        <meshStandardMaterial color="#d8b464" metalness={1} roughness={0.22} />
      </mesh>
      <mesh position={[0.015, -0.012, 0.008]} castShadow>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshStandardMaterial color="#e6c67c" metalness={1} roughness={0.25} />
      </mesh>
    </group>
  );
}

/** خدوش معدنية حول قفل الباب (تفصيلة سطحية على لوحة الباب). */
function LockScratchProp() {
  return (
    <group position={[1.5, 1.05, -14.5]} rotation-y={-Math.PI / 2}>
      {[
        [-0.05, 0.03, 0.5],
        [0.02, -0.01, -0.35],
        [0.05, 0.05, 0.15],
        [-0.02, -0.05, 0.9],
      ].map(([x, y, rot], i) => (
        <mesh key={i} position={[x!, y!, 0.004]} rotation-z={rot!}>
          <planeGeometry args={[0.075, 0.006]} />
          <meshStandardMaterial color="#cbb894" roughness={0.3} metalness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, -0.09, 0.005]}>
        <cylinderGeometry args={[0.026, 0.026, 0.012, 14]} />
        <meshStandardMaterial color="#8e7a4f" metalness={0.9} roughness={0.35} />
      </mesh>
    </group>
  );
}

export function Floor13World() {
  const c = FLOOR13_LAYOUT.corridor;
  const r = FLOOR13_LAYOUT.room;
  const corridorLen = c.z1 - c.z0;
  const roomW = r.x1 - r.x0;
  const roomLen = r.z1 - r.z0;
  const roomCx = (r.x0 + r.x1) / 2;
  const roomCz = (r.z0 + r.z1) / 2;

  const corridorCarpet = usePbr("dirty_carpet", [2.2, 15], [0, 0]);
  const roomCarpet = usePbr("dirty_carpet", [5, 5.5], [0.4, 0.2]);
  const roomRug = usePbr("quatrefoil_jacquard_fabric", [2.2, 1.8]);
  const ceiling = usePbr("beige_wall_001", [4, 12]);
  const roomCeiling = usePbr("beige_wall_001", [3.5, 4]);
  const elevatorMetal = usePbr("beige_wall_001", [1, 1]);

  const floorSign = useMemo(() => signTexture("١٣", "الطابق"), []);
  const roomSign = useMemo(() => signTexture("١٣٠٦"), []);
  const sign1304 = useMemo(() => signTexture("١٣٠٤"), []);
  const sign1302 = useMemo(() => signTexture("١٣٠٢"), []);

  return (
    <group>
      {/* ===== أرضيات (سجاد فندق حقيقي بخامة PBR) ===== */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, (c.z0 + c.z1) / 2]} receiveShadow>
        <planeGeometry args={[c.x1 - c.x0, corridorLen]} />
        <meshStandardMaterial {...corridorCarpet} color="#9c8478" roughness={1} normalScale={[1.1, 1.1]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[roomCx, 0, roomCz]} receiveShadow>
        <planeGeometry args={[roomW, roomLen]} />
        <meshStandardMaterial {...roomCarpet} color="#8f7a70" roughness={1} normalScale={[1, 1]} />
      </mesh>

      {/* ===== أسقف (جبس/بلاستر) ===== */}
      <mesh rotation-x={Math.PI / 2} position={[0, H, (c.z0 + c.z1) / 2]} receiveShadow>
        <planeGeometry args={[c.x1 - c.x0, corridorLen]} />
        <meshStandardMaterial {...ceiling} color="#867f77" roughness={0.95} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[roomCx, H, roomCz]} receiveShadow>
        <planeGeometry args={[roomW, roomLen]} />
        <meshStandardMaterial {...roomCeiling} color="#888078" roughness={0.95} />
      </mesh>

      {/* ===== طوفات الممر ===== */}
      <Wall a={[c.x0, c.z0]} b={[c.x0, c.z1]} />
      <Wall a={[c.x1, c.z1]} b={[c.x1, -13.8]} />
      <Wall a={[c.x1, -15.2]} b={[c.x1, c.z0]} />
      <Wall a={[c.x0, c.z0]} b={[c.x1, c.z0]} />
      <Wall a={[c.x0, c.z1]} b={[c.x1, c.z1]} />

      {/* ===== المصعد ===== */}
      <mesh position={[0, 1.12, c.z1 - 0.1]} receiveShadow>
        <boxGeometry args={[1.72, 2.24, 0.06]} />
        <meshStandardMaterial
          {...elevatorMetal}
          color="#8d8f94"
          metalness={0.9}
          roughness={0.32}
          normalScale={[0.4, 0.4]}
        />
      </mesh>
      <mesh position={[0, 1.12, c.z1 - 0.14]}>
        <boxGeometry args={[0.025, 2.24, 0.02]} />
        <meshStandardMaterial color="#0f0e10" />
      </mesh>
      <mesh position={[0, 2.28, c.z1 - 0.12]} castShadow>
        <boxGeometry args={[1.92, 0.12, 0.1]} />
        <meshStandardMaterial color="#b0904f" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[-0.9, 1.12, c.z1 - 0.13]} castShadow>
        <boxGeometry args={[0.1, 2.3, 0.09]} />
        <meshStandardMaterial color="#a5874c" metalness={0.85} roughness={0.35} />
      </mesh>
      <mesh position={[0.9, 1.12, c.z1 - 0.13]} castShadow>
        <boxGeometry args={[0.1, 2.3, 0.09]} />
        <meshStandardMaterial color="#a5874c" metalness={0.85} roughness={0.35} />
      </mesh>
      <mesh position={[1.15, 1.15, c.z1 - 0.12]}>
        <boxGeometry args={[0.09, 0.15, 0.03]} />
        <meshStandardMaterial color="#c9a869" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, 2.6, c.z1 - 0.11]}>
        <planeGeometry args={[0.62, 0.62]} />
        <meshStandardMaterial map={floorSign} roughness={0.45} metalness={0.35} />
      </mesh>

      {/* ===== تفاصيل الممر: أبواب متناسقة + إضاءة موزعة بانتظام ===== */}
      <DoorUnit position={[c.x0 + 0.1, 0, -4.5]} rotationY={Math.PI / 2} sign={sign1302} />
      <DoorUnit position={[c.x0 + 0.1, 0, -9.5]} rotationY={Math.PI / 2} sign={sign1304} />
      <Sconce position={[c.x1 - 0.1, 1.95, -2.6]} rotationY={-Math.PI / 2} intensity={2.2} />
      <Sconce position={[c.x0 + 0.1, 1.95, -6.9]} rotationY={Math.PI / 2} intensity={1.5} flicker />
      <Sconce position={[c.x1 - 0.1, 1.95, -11.2]} rotationY={-Math.PI / 2} intensity={2.1} />
      <Sconce position={[c.x0 + 0.1, 1.95, -15.6]} rotationY={Math.PI / 2} intensity={1.7} />
      <Prop
        name="hanging_picture_frame_02"
        position={[c.x1 - 0.11, 1.6, -5.9]}
        rotationY={-Math.PI / 2}
        anchor="origin"
        width={0.72}
      />
      <Prop
        name="fancy_picture_frame_01"
        position={[c.x0 + 0.11, 1.6, -12.2]}
        rotationY={Math.PI / 2}
        anchor="origin"
        width={0.62}
      />
      <LightSwitch position={[c.x1 - 0.1, 1.15, -13.6]} rotationY={-Math.PI / 2} />

      {/* طاولة كونسول الممر + أباجورة ومرآة (على الطوفة اليمنى بين البابين) */}
      <group position={[c.x1 - 0.42, 0, -8.6]}>
        <Prop name="ClassicConsole_01" rotationY={-Math.PI / 2} height={0.84} />
        <Prop name="vintage_oil_lamp" position={[0, 0.84, -0.26]} height={0.4} />
        <mesh position={[0, 1.13, -0.26]}>
          <sphereGeometry args={[0.05, 10, 8]} />
          <meshStandardMaterial color="#fff6ea" emissive="#ffe6cb" emissiveIntensity={1} toneMapped={false} />
        </mesh>
        <pointLight position={[-0.08, 1.15, -0.26]} color="#ffd9b4" intensity={2.1} distance={5} decay={2} />
        <Prop
          name="ornate_mirror_01"
          position={[0.3, 1.68, 0]}
          rotationY={-Math.PI / 2}
          anchor="origin"
          height={0.82}
        />
      </group>

      {/* الحقيبة المتروكة في الممر (دليل) */}
      <Prop name="vintage_suitcase" position={[0.92, 0, -7.2]} rotationY={-0.4} width={0.64} />
      <KeycardProp />
      <PhoneProp />

      {/* ===== غرفة ١٣٠٦ ===== */}
      <Wall a={[r.x1, r.z0]} b={[r.x1, r.z1]} />
      <Wall a={[r.x0, r.z1]} b={[r.x1, r.z1]} />
      <Wall a={[r.x0, r.z0]} b={[r.x1, r.z0]} />
      <Wall a={[r.x0, r.z0]} b={[r.x0, -15.2]} />
      <Wall a={[r.x0, -13.8]} b={[r.x0, r.z1]} />

      <DoorUnit position={[1.95, 0, -14.5]} rotationY={-Math.PI / 2} open={-1.2} />
      <LockScratchProp />
      <mesh position={[c.x1 - 0.1, 1.72, -13.4]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[0.38, 0.38]} />
        <meshStandardMaterial map={roomSign} roughness={0.45} metalness={0.35} />
      </mesh>

      {/* نافذة ليلية على الطوفة المقابلة + ستائر داكنة */}
      <mesh position={[4.5, 1.5, r.z0 + 0.12]}>
        <planeGeometry args={[1.8, 1.5]} />
        <meshStandardMaterial
          color="#161d27"
          emissive="#2b3c50"
          emissiveIntensity={0.34}
          roughness={0.25}
          metalness={0.4}
        />
      </mesh>
      <Curtain position={[4.5, 1.34, r.z0 + 0.26]} width={2.3} />

      {/* ===== أثاث الغرفة (تخطيط جناح فندق حقيقي) ===== */}
      <Zone z={-11}>
        {/* السرير برأسه على الطوفة اليمنى + كومدينة على كل جانب */}
        <Prop name="GothicBed_01" position={[6.6, 0, -17.6]} rotationY={-Math.PI / 2} height={1.3} />
        <Prop name="throw_pillows_01" position={[7.15, 0.6, -17.6]} rotationY={-Math.PI / 2} width={0.95} />
        <Prop name="ClassicNightstand_01" position={[7.15, 0, -16.35]} rotationY={-Math.PI / 2} height={0.7} />
        <Prop name="ClassicNightstand_01" position={[7.15, 0, -18.85]} rotationY={-Math.PI / 2} height={0.7} />
        <Prop name="vintage_oil_lamp" position={[7.15, 0.7, -18.85]} height={0.42} />
        <Prop name="alarm_clock_01" position={[7.2, 0.7, -16.0]} rotationY={2.2} height={0.13} />
        <EarringProp />
        <mesh position={[7.15, 1.0, -18.85]}>
          <sphereGeometry args={[0.05, 10, 8]} />
          <meshStandardMaterial color="#fff6ea" emissive="#ffe6cb" emissiveIntensity={1} toneMapped={false} />
        </mesh>
        <pointLight position={[6.9, 1.04, -18.85]} color="#ffd6ae" intensity={2.4} distance={5.5} decay={2} />

        {/* المكتب تحت النافذة + الكرسي أمامه */}
        <Prop name="WoodenTable_01" position={[3.05, 0, -19.15] } rotationY={0} height={0.76} />
        <Prop name="WoodenChair_01" position={[3.05, 0, -18.35]} rotationY={Math.PI} height={1.02} />
        <DeskNoteProp />

        {/* الدولاب قريب من المدخل على طوفة الدخول + حقيبة جانبه */}
        <Prop name="GothicCabinet_01" position={[3.4, 0, -13.4] } rotationY={Math.PI} height={2.05} />

        {/* سجادة بمقاس مناسب أمام السرير */}
        <mesh rotation-x={-Math.PI / 2} position={[4.9, 0.014, -17.2]} receiveShadow>
          <planeGeometry args={[2.6, 3.0]} />
          <meshStandardMaterial {...roomRug} color="#7a5b53" roughness={1} normalScale={[1.05, 1.05]} />
        </mesh>
        <Prop
          name="hanging_picture_frame_02"
          position={[r.x1 - 0.11, 1.72, -15.1]}
          rotationY={-Math.PI / 2}
          anchor="origin"
          width={0.85}
        />
      </Zone>
      <LightSwitch position={[2.0, 1.15, -13.9]} rotationY={Math.PI / 2} />

      {/* ===== إضاءة فندق سينمائية: دافئة محايدة، مقروءة، بدون highlights محروقة ===== */}
      <ambientLight intensity={0.78} color="#aab0bd" />
      <hemisphereLight args={["#b6bccb", "#846f60", 1.05]} />
      <Chandelier position={[0, H - 0.12, -3.2]} intensity={5.6} />
      <Chandelier position={[0, H - 0.12, -9.6]} intensity={5.2} />
      <Chandelier position={[0, H - 0.12, -16.4]} intensity={4.4} castShadow />
      <Zone z={-11}>
        <Chandelier position={[4.6, H - 0.12, -16.6]} intensity={6.2} castShadow />
        {/* fill ناعم للزوايا حتى تبقى الأدلة والأثاث واضحة بدون فقدان الغموض */}
        <pointLight position={[2.6, 1.6, -14.4]} color="#e9d7c1" intensity={1.3} distance={7} decay={2} />
        <pointLight position={[2.7, 1.5, -18.6]} color="#e4d1bb" intensity={1.2} distance={7} decay={2} />
        <pointLight position={[6.4, 1.5, -14.2]} color="#e4d1bb" intensity={1.1} distance={7} decay={2} />
      </Zone>
    </group>
  );
}
