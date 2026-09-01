import { Suspense, useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { FLOOR13_EVIDENCE, FLOOR13_LAYOUT } from "@/game/cases/floor13/scene-data";
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
        <meshStandardMaterial {...paper} color="#a89b8c" roughness={0.95} normalScale={[0.9, 0.9]} />
      </mesh>
      {/* وزرة خشب */}
      <mesh position={[cx, y + 0.085, cz]} receiveShadow>
        <boxGeometry args={[bw, 0.17, bd]} />
        <meshStandardMaterial {...wood} color="#8a7561" roughness={0.75} />
      </mesh>
      {/* حافة علوية (كرنيش) */}
      <mesh position={[cx, y + height - 0.07, cz]} receiveShadow>
        <boxGeometry args={[bw, 0.12, bd]} />
        <meshStandardMaterial color="#a2968a" roughness={0.85} />
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

/** شمعدان حائط (موديل واقعي) + ضوء دافئ. */
function Sconce({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation-y={rotationY}>
      <Prop name="industrial_wall_sconce" height={0.42} anchor="origin" />
      <mesh position={[0, 0.02, 0.14]}>
        <sphereGeometry args={[0.045, 10, 8]} />
        <meshStandardMaterial color="#fff1da" emissive="#ffdcae" emissiveIntensity={1.1} toneMapped={false} />
      </mesh>
      <pointLight color="#ffcfa0" intensity={2.4} distance={6.5} decay={2} position={[0, 0.05, 0.24]} />
    </group>
  );
}

/** ثريّة سقف واقعية + ضوء الغرفة/الممر. */
function Chandelier({
  position,
  castShadow = false,
  intensity = 7,
}: {
  position: [number, number, number];
  castShadow?: boolean;
  intensity?: number;
}) {
  return (
    <group position={position}>
      <Prop name="Chandelier_03" height={0.85} anchor="origin" shadows={false} />
      <mesh position={[0, -0.55, 0]}>
        <sphereGeometry args={[0.07, 10, 8]} />
        <meshStandardMaterial color="#fff4e2" emissive="#ffe3bd" emissiveIntensity={1.2} toneMapped={false} />
      </mesh>
      <pointLight
        color="#ffd9ae"
        intensity={intensity}
        distance={11}
        decay={2}
        position={[0, -0.6, 0]}
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

/** ستارة مخمل بخامة PBR (طيّات أسطوانية ناعمة + قضيب نحاسي). */
function Curtain({ position, width = 2.1 }: { position: [number, number, number]; width?: number }) {
  const velvet = usePbr("velour_velvet", [0.6, 2.2]);
  const folds = 9;
  return (
    <group position={position}>
      <mesh position={[0, 1.18, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.022, 0.022, width + 0.3, 10]} />
        <meshStandardMaterial color="#b0904f" metalness={0.9} roughness={0.28} />
      </mesh>
      {Array.from({ length: folds }).map((_, i) => {
        const x = -width / 2 + (i / (folds - 1)) * width;
        const r = 0.05 + (i % 2 === 0 ? 0.018 : 0);
        return (
          <mesh key={i} position={[x, 0.05, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[r, r * 1.2, 2.25, 8]} />
            <meshStandardMaterial {...velvet} color="#7b4c40" roughness={0.95} />
          </mesh>
        );
      })}
    </group>
  );
}

function EvidenceGlint({ position, found }: { position: [number, number, number]; found: boolean }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.05, 10, 8]} />
        <meshStandardMaterial
          color={found ? "#6f9c7a" : "#e8cf9c"}
          emissive={found ? "#4a7d59" : "#d8ab55"}
          emissiveIntensity={found ? 0.6 : 1.3}
          roughness={0.35}
          toneMapped={false}
        />
      </mesh>
      <pointLight
        color={found ? "#6f9c7a" : "#ffd79a"}
        intensity={found ? 0.35 : 0.8}
        distance={1.5}
        decay={2}
      />
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

export function Floor13World({ found }: { found: Set<string> }) {
  const c = FLOOR13_LAYOUT.corridor;
  const r = FLOOR13_LAYOUT.room;
  const corridorLen = c.z1 - c.z0;
  const roomW = r.x1 - r.x0;
  const roomLen = r.z1 - r.z0;
  const roomCx = (r.x0 + r.x1) / 2;
  const roomCz = (r.z0 + r.z1) / 2;

  const corridorCarpet = usePbr("dirty_carpet", [2.4, 18], [0, 0]);
  const roomCarpet = usePbr("dirty_carpet", [6, 8.5], [0.4, 0.2]);
  const roomRug = usePbr("quatrefoil_jacquard_fabric", [2.4, 1.8]);
  const ceiling = usePbr("beige_wall_001", [4, 14]);
  const roomCeiling = usePbr("beige_wall_001", [4, 5]);
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
        <meshStandardMaterial {...corridorCarpet} color="#7a5f52" roughness={1} normalScale={[1.3, 1.3]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[roomCx, 0, roomCz]} receiveShadow>
        <planeGeometry args={[roomW, roomLen]} />
        <meshStandardMaterial {...roomCarpet} color="#6f5850" roughness={1} normalScale={[1.2, 1.2]} />
      </mesh>

      {/* ===== أسقف (جبس/بلاستر) ===== */}
      <mesh rotation-x={Math.PI / 2} position={[0, H, (c.z0 + c.z1) / 2]} receiveShadow>
        <planeGeometry args={[c.x1 - c.x0, corridorLen]} />
        <meshStandardMaterial {...ceiling} color="#8d857a" roughness={0.95} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[roomCx, H, roomCz]} receiveShadow>
        <planeGeometry args={[roomW, roomLen]} />
        <meshStandardMaterial {...roomCeiling} color="#8f877c" roughness={0.95} />
      </mesh>

      {/* ===== طوفات الممر ===== */}
      <Wall a={[c.x0, c.z0]} b={[c.x0, c.z1]} />
      <Wall a={[c.x1, c.z1]} b={[c.x1, -16.8]} />
      <Wall a={[c.x1, -19.2]} b={[c.x1, c.z0]} />
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
      <mesh position={[0, 2.62, c.z1 - 0.11]}>
        <planeGeometry args={[0.66, 0.66]} />
        <meshStandardMaterial map={floorSign} roughness={0.45} metalness={0.35} />
      </mesh>

      {/* ===== تفاصيل الممر ===== */}
      <DoorUnit position={[c.x0 + 0.1, 0, -5.4]} rotationY={Math.PI / 2} sign={sign1302} />
      <DoorUnit position={[c.x0 + 0.1, 0, -12.6]} rotationY={Math.PI / 2} sign={sign1304} />
      <Sconce position={[c.x0 + 0.1, 1.95, -2.4]} rotationY={Math.PI / 2} />
      <Sconce position={[c.x0 + 0.1, 1.95, -9.2]} rotationY={Math.PI / 2} />
      <Sconce position={[c.x1 - 0.1, 1.95, -6.4]} rotationY={-Math.PI / 2} />
      <Sconce position={[c.x1 - 0.1, 1.95, -13.4]} rotationY={-Math.PI / 2} />
      <Prop
        name="hanging_picture_frame_02"
        position={[c.x1 - 0.11, 1.62, -3.6]}
        rotationY={-Math.PI / 2}
        anchor="origin"
        width={0.78}
      />
      <Prop
        name="fancy_picture_frame_01"
        position={[c.x0 + 0.11, 1.62, -15.4]}
        rotationY={Math.PI / 2}
        anchor="origin"
        width={0.66}
      />
      <LightSwitch position={[c.x1 - 0.1, 1.15, -16.05]} rotationY={-Math.PI / 2} />

      {/* طاولة كونسول الممر + أباجورة ومرآة */}
      <group position={[c.x0 + 0.42, 0, -8.2]}>
        <Prop name="ClassicConsole_01" rotationY={Math.PI / 2} height={0.86} />
        <Prop name="vintage_oil_lamp" position={[0, 0.86, 0.28]} height={0.42} />
        <mesh position={[0, 1.16, 0.28]}>
          <sphereGeometry args={[0.05, 10, 8]} />
          <meshStandardMaterial color="#fff2dd" emissive="#ffdcae" emissiveIntensity={1} toneMapped={false} />
        </mesh>
        <pointLight position={[0.1, 1.18, 0.28]} color="#ffcb96" intensity={2.2} distance={5} decay={2} />
        <Prop
          name="ornate_mirror_01"
          position={[-0.28, 1.72, 0]}
          rotationY={Math.PI / 2}
          anchor="origin"
          height={0.85}
        />
      </group>

      {/* ===== غرفة ١٣٠٦ ===== */}
      <Wall a={[r.x1, r.z0]} b={[r.x1, r.z1]} />
      <Wall a={[r.x0, r.z1]} b={[r.x1, r.z1]} />
      <Wall a={[r.x0, r.z0]} b={[r.x1, r.z0]} />

      <DoorUnit position={[1.95, 0, -18.0]} rotationY={-Math.PI / 2} open={-1.15} />
      <mesh position={[c.x1 - 0.1, 1.75, -16.35]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[0.4, 0.4]} />
        <meshStandardMaterial map={roomSign} roughness={0.45} metalness={0.35} />
      </mesh>

      {/* نافذة ليلية + ستائر مخمل */}
      <mesh position={[roomCx + 1.2, 1.55, r.z0 + 0.12]}>
        <planeGeometry args={[1.7, 1.55]} />
        <meshStandardMaterial color="#131a24" emissive="#28384b" emissiveIntensity={0.3} roughness={0.25} metalness={0.4} />
      </mesh>
      <Curtain position={[roomCx + 1.2, 1.35, r.z0 + 0.26]} width={2.2} />

      {/* ===== أثاث الغرفة (موديلات GLB واقعية) ===== */}
      <Zone z={-11}>
        {/* السرير + مخدات + حقيبة */}
        <Prop name="GothicBed_01" position={[3.55, 0, -16.7]} rotationY={Math.PI} height={1.35} />
        <Prop name="throw_pillows_01" position={[3.55, 0.62, -17.45]} rotationY={Math.PI} width={1.0} />
        <Prop name="vintage_suitcase" position={[2.35, 0, -20.4]} rotationY={0.6} width={0.62} />

        {/* كومدينتان + أباجورة + منبّه */}
        <Prop name="ClassicNightstand_01" position={[2.4, 0, -17.7]} rotationY={Math.PI / 2} height={0.68} />
        <Prop name="vintage_oil_lamp" position={[2.4, 0.68, -17.7]} height={0.44} />
        <mesh position={[2.4, 1.0, -17.7]}>
          <sphereGeometry args={[0.05, 10, 8]} />
          <meshStandardMaterial color="#fff2dd" emissive="#ffdcae" emissiveIntensity={1} toneMapped={false} />
        </mesh>
        <pointLight position={[2.5, 1.02, -17.7]} color="#ffc891" intensity={2.6} distance={5.5} decay={2} />
        <Prop name="ClassicNightstand_01" position={[4.75, 0, -17.7]} rotationY={-Math.PI / 2} height={0.68} />
        <Prop name="alarm_clock_01" position={[4.75, 0.68, -17.7]} rotationY={-2.4} height={0.14} />

        {/* المكتب + الكرسي */}
        <Prop name="WoodenTable_01" position={[6.6, 0, -23.6]} rotationY={0} height={0.76} />
        <Prop name="WoodenChair_01" position={[6.5, 0, -22.5]} rotationY={0.25} height={1.05} />

        {/* الدولاب */}
        <Prop name="GothicCabinet_01" position={[8.8, 0, -15.6]} rotationY={-Math.PI / 2} height={2.12} />

        {/* سجادة الغرفة + لوحة */}
        <mesh rotation-x={-Math.PI / 2} position={[5.6, 0.014, -19.6]} receiveShadow>
          <planeGeometry args={[3.4, 2.6]} />
          <meshStandardMaterial {...roomRug} color="#7d5b52" roughness={1} normalScale={[1.1, 1.1]} />
        </mesh>
        <Prop
          name="hanging_picture_frame_02"
          position={[r.x1 - 0.11, 1.7, -20.6]}
          rotationY={-Math.PI / 2}
          anchor="origin"
          width={0.95}
        />
      </Zone>
      <LightSwitch position={[2.05, 1.15, -19.05]} rotationY={Math.PI / 2} />

      {/* ===== إضاءة فندق سينمائية ===== */}
      <ambientLight intensity={0.28} color="#9aa2b2" />
      <hemisphereLight args={["#a8b0c4", "#4a3a30", 0.5]} />
      <Chandelier position={[0, H - 0.12, -3]} intensity={6.5} />
      <Chandelier position={[0, H - 0.12, -10]} intensity={6.5} />
      <Chandelier position={[0, H - 0.12, -16.5]} intensity={6} castShadow />
      <Zone z={-11}>
        <Chandelier position={[4.6, H - 0.12, -17.6]} intensity={6.5} castShadow />
        <Chandelier position={[6.6, H - 0.12, -21.6]} intensity={6} />
      </Zone>

      {/* ===== نقاط الأدلة ===== */}
      {FLOOR13_EVIDENCE.map((e) => (
        <EvidenceGlint key={e.id} position={e.position} found={found.has(e.id)} />
      ))}
    </group>
  );
}
