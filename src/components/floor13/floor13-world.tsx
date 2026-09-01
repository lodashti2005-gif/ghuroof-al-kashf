import { Suspense, useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { FLOOR13_LAYOUT } from "@/game/cases/floor13/scene-data";
import { signTexture } from "./textures";
import { usePbr } from "./pbr";
import { Prop } from "./prop";

const H = FLOOR13_LAYOUT.wallHeight;
const T = 0.16;

/** طوفة بخامة PBR واقعية + وزرة خشب وحافة علوية. */
function Wall({
  a,
  b,
  height = H,
  y = 0,
  repeatScale = 0.55,
  plaster = false,
}: {
  a: [number, number];
  b: [number, number];
  height?: number;
  y?: number;
  repeatScale?: number;
  plaster?: boolean;
}) {
  const cx = (a[0] + b[0]) / 2;
  const cz = (a[1] + b[1]) / 2;
  const dx = Math.abs(b[0] - a[0]);
  const dz = Math.abs(b[1] - a[1]);
  const w = Math.max(dx, T);
  const d = Math.max(dz, T);
  const along = dx > dz;
  const len = Math.max(dx, dz);
  const surface = usePbr(
    plaster ? "beige_wall_001" : "decrepit_wallpaper",
    [Math.max(1, len * repeatScale * (plaster ? 2.2 : 1)), Math.max(1, height * repeatScale * 1.1 * (plaster ? 2.2 : 1))],
    [(cx + cz) * 0.13, 0],
  );
  const wood = usePbr("oak_veneer_01", [Math.max(1, len * 0.5), 1]);
  const bw = along ? w : T * 1.35;
  const bd = along ? T * 1.35 : d;
  return (
    <group>
      <mesh position={[cx, y + height / 2, cz]} receiveShadow>
        <boxGeometry args={[w, height, d]} />
        <meshStandardMaterial
          {...surface}
          color={plaster ? "#9d9488" : "#a09687"}
          roughness={0.97}
          normalScale={[0.9, 0.9]}
        />
      </mesh>
      {/* وزرة خشب */}
      <mesh position={[cx, y + 0.085, cz]} receiveShadow>
        <boxGeometry args={[bw, 0.17, bd]} />
        <meshStandardMaterial {...wood} color="#7d6a56" roughness={0.72} />
      </mesh>
      {/* حافة علوية */}
      <mesh position={[cx, y + height - 0.07, cz]} receiveShadow>
        <boxGeometry args={[bw, 0.12, bd]} />
        <meshStandardMaterial color="#9c948a" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** باب غرفة فندق واقعي: خشب PBR + لوحة رقم + مقبض رافعة + قارئ بطاقة. */
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
  const wood = usePbr("oak_veneer_01", [1.2, 2.2]);
  const frameWood = usePbr("oak_veneer_01", [0.4, 2.6]);
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh position={[-(w / 2 + 0.06), h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.12, h + 0.12, 0.18]} />
        <meshStandardMaterial {...frameWood} color="#8a7663" roughness={0.68} />
      </mesh>
      <mesh position={[w / 2 + 0.06, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.12, h + 0.12, 0.18]} />
        <meshStandardMaterial {...frameWood} color="#8a7663" roughness={0.68} />
      </mesh>
      <mesh position={[0, h + 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[w + 0.24, 0.12, 0.18]} />
        <meshStandardMaterial {...frameWood} color="#8a7663" roughness={0.68} />
      </mesh>
      <group position={[-w / 2, 0, 0]} rotation-y={open}>
        <group position={[w / 2, 0, 0]}>
          <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[w, h, 0.052]} />
            <meshStandardMaterial {...wood} color="#6f5c4a" roughness={0.5} />
          </mesh>
          {[0.7, 0.32].map((f) => (
            <mesh key={f} position={[0, h * f, 0.03]} receiveShadow>
              <boxGeometry args={[w * 0.7, h * 0.3, 0.012]} />
              <meshStandardMaterial {...wood} color="#5b4a3a" roughness={0.55} />
            </mesh>
          ))}
          {/* مقبض رافعة (hotel lever handle) */}
          <mesh position={[w * 0.35, 1.04, 0.05]} castShadow>
            <cylinderGeometry args={[0.026, 0.026, 0.055, 14]} />
            <meshStandardMaterial color="#9d8a63" metalness={0.9} roughness={0.28} />
          </mesh>
          <mesh position={[w * 0.28, 1.04, 0.085]} rotation-z={Math.PI / 2} castShadow>
            <cylinderGeometry args={[0.017, 0.014, 0.16, 12]} />
            <meshStandardMaterial color="#a89563" metalness={0.92} roughness={0.26} />
          </mesh>
          {/* قارئ بطاقة */}
          <mesh position={[w * 0.35, 1.28, 0.035]} castShadow>
            <boxGeometry args={[0.085, 0.15, 0.026]} />
            <meshStandardMaterial color="#26262a" roughness={0.42} metalness={0.25} />
          </mesh>
          <mesh position={[w * 0.35, 1.33, 0.05]}>
            <sphereGeometry args={[0.008, 8, 6]} />
            <meshStandardMaterial color="#8f2f2a" emissive="#a3352c" emissiveIntensity={1.3} toneMapped={false} />
          </mesh>
        </group>
      </group>
      {sign && (
        <group position={[w / 2 + 0.32, 1.66, 0.11]}>
          <mesh castShadow>
            <boxGeometry args={[0.24, 0.24, 0.012]} />
            <meshStandardMaterial color="#8c7a52" metalness={0.85} roughness={0.34} />
          </mesh>
          <mesh position={[0, 0, 0.008]}>
            <planeGeometry args={[0.21, 0.21]} />
            <meshStandardMaterial map={sign} roughness={0.5} metalness={0.2} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/** شمعدان حائط قديم + ضوء دافئ خافت. flicker نادر جدًا للمبة واحدة. */
function Sconce({
  position,
  rotationY = 0,
  intensity = 1.7,
  flicker = false,
}: {
  position: [number, number, number];
  rotationY?: number;
  intensity?: number;
  flicker?: boolean;
}) {
  const light = useRef<THREE.PointLight>(null);
  const glow = useRef<THREE.Mesh>(null);
  const next = useRef(8 + Math.random() * 12);
  const t = useRef(0);
  const dip = useRef(0);

  useFrame((_, delta) => {
    if (!flicker) return;
    t.current += delta;
    if (dip.current > 0) {
      dip.current -= delta;
      const f = 0.4 + Math.random() * 0.4;
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
      next.current = 12 + Math.random() * 16;
      dip.current = 0.2 + Math.random() * 0.3;
    }
  });

  return (
    <group position={position} rotation-y={rotationY}>
      <Prop name="industrial_caged_sconce" height={0.38} anchor="origin" tint="#b7a894" />
      <mesh ref={glow} position={[0, 0.0, 0.13]}>
        <sphereGeometry args={[0.04, 10, 8]} />
        <meshStandardMaterial color="#ffeed8" emissive="#ffdcb4" emissiveIntensity={1.1} toneMapped={false} />
      </mesh>
      <pointLight
        ref={light}
        color="#ffd9b3"
        intensity={intensity}
        distance={5.6}
        decay={2}
        position={[0, 0.04, 0.22]}
      />
    </group>
  );
}

/** إنارة سقف بسيطة (fixture فندق) بدل الثريات المتكررة. */
function CeilingLamp({
  position,
  castShadow = false,
  intensity = 3.4,
}: {
  position: [number, number, number];
  castShadow?: boolean;
  intensity?: number;
}) {
  return (
    <group position={position}>
      <Prop name="modern_ceiling_lamp_01" position={[0, -0.02, 0]} height={0.26} anchor="origin" shadows={false} tint="#a89c8b" />
      <mesh position={[0, -0.19, 0]}>
        <sphereGeometry args={[0.038, 10, 8]} />
        <meshStandardMaterial color="#fff2e0" emissive="#ffe2c2" emissiveIntensity={1.05} toneMapped={false} />
      </mesh>
      <pointLight
        color="#ffdfbf"
        intensity={intensity}
        distance={11}
        decay={2}
        position={[0, -0.26, 0]}
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
        <meshStandardMaterial color="#c5bfb3" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.012]}>
        <boxGeometry args={[0.036, 0.055, 0.01]} />
        <meshStandardMaterial color="#9c968b" roughness={0.45} />
      </mesh>
    </group>
  );
}

/** هاتف فندق على الكومدينة (غرض صغير). */
function HotelPhone({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.15, 0.045, 0.11]} />
        <meshStandardMaterial color="#20211f" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.055, 0.005]} castShadow>
        <boxGeometry args={[0.155, 0.04, 0.05]} />
        <meshStandardMaterial color="#2a2b28" roughness={0.45} />
      </mesh>
      <mesh position={[-0.055, 0.075, 0.005]} castShadow>
        <boxGeometry args={[0.04, 0.03, 0.05]} />
        <meshStandardMaterial color="#2a2b28" roughness={0.45} />
      </mesh>
      <mesh position={[0.055, 0.075, 0.005]} castShadow>
        <boxGeometry args={[0.04, 0.03, 0.05]} />
        <meshStandardMaterial color="#2a2b28" roughness={0.45} />
      </mesh>
    </group>
  );
}

/** نافذة فندق: إطار + زجاج ليلي + طبقة sheer + ستارة blackout ثقيلة مغلقة جزئيًا. */
function HotelWindow({ position }: { position: [number, number, number] }) {
  const velvet = usePbr("velour_velvet", [1.1, 2.4]);
  const sheer = usePbr("rough_linen", [1.6, 2.2]);
  const frame = usePbr("oak_veneer_01", [1, 1]);
  const w = 2.0;
  const h = 1.6;
  return (
    <group position={position}>
      {/* زجاج ليلي داكن */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#0b1119" emissive="#182636" emissiveIntensity={0.22} roughness={0.15} metalness={0.5} />
      </mesh>
      {/* إطار */}
      {[
        [0, h / 2 + 0.05, 0.03, w + 0.2, 0.1, 0.08],
        [0, -h / 2 - 0.05, 0.03, w + 0.2, 0.1, 0.08],
        [-w / 2 - 0.05, 0, 0.03, 0.1, h + 0.2, 0.08],
        [w / 2 + 0.05, 0, 0.03, 0.1, h + 0.2, 0.08],
        [0, 0, 0.03, 0.05, h, 0.06],
      ].map((f, i) => (
        <mesh key={i} position={[f[0]!, f[1]!, f[2]!]} castShadow receiveShadow>
          <boxGeometry args={[f[3]!, f[4]!, f[5]!]} />
          <meshStandardMaterial {...frame} color="#6f6055" roughness={0.7} />
        </mesh>
      ))}
      {/* طبقة sheer شفافة */}
      <mesh position={[0, -0.05, 0.13]}>
        <planeGeometry args={[w + 0.25, h + 0.5]} />
        <meshStandardMaterial
          {...sheer}
          color="#cfc6b6"
          transparent
          opacity={0.42}
          roughness={1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* قضيب الستارة من السقف تقريبًا */}
      <mesh position={[0, 1.32, 0.26]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.022, 0.022, w + 1.5, 12]} />
        <meshStandardMaterial color="#5d5348" metalness={0.7} roughness={0.45} />
      </mesh>
      {/* ستائر blackout كاملة من السقف للأرض (مفتوحة قليلًا في الوسط) */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (w / 2 + 0.16), -0.09, 0.26]}>
          {[0, 1, 2, 3, 4].map((i) => (
            <RoundedBox
              key={i}
              args={[0.17, 2.78, 0.1 + (i % 2) * 0.03]}
              radius={0.045}
              smoothness={3}
              position={[s * (i * 0.145 - 0.3), 0, (i % 2) * 0.03]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial {...velvet} color="#3a332f" roughness={0.99} />
            </RoundedBox>
          ))}
        </group>
      ))}
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

/** خدوش معدنية حول قفل الباب. */
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

/**
 * سرير Queen فندقي واقعي: قاعدة upholstered + headboard قماش داكن + مرتبة
 * وملاءات بيضاء وduvet ومخدات. كل الأحجام RoundedBox (حواف ناعمة، ليست مكعبات)
 * وخاماتها PBR قماش/كتان — بدون أي هيكل معدني.
 */
function HotelBed({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  const linen = usePbr("rough_linen", [3.4, 3.4]);
  const sheet = usePbr("rough_linen", [2.6, 2.6]);
  const duvet = usePbr("rough_linen", [2.2, 1.4]);
  const upholstery = usePbr("rough_linen", [3.2, 1.6]);
  const headFabric = usePbr("rough_linen", [2.2, 1.8]);
  return (
    <group position={position} rotation-y={rotationY}>
      {/* قاعدة upholstered + plinth غائر */}
      <RoundedBox args={[1.96, 0.3, 2.06]} radius={0.035} smoothness={3} position={[0, 0.24, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...upholstery} color="#4b443d" roughness={0.97} />
      </RoundedBox>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[1.8, 0.1, 1.9]} />
        <meshStandardMaterial color="#241f1c" roughness={0.95} />
      </mesh>
      {/* headboard قماش داكن بقنوات عمودية */}
      <RoundedBox
        args={[2.06, 1.18, 0.11]}
        radius={0.04}
        smoothness={3}
        position={[0, 1.0, -1.06]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...headFabric} color="#453f39" roughness={0.98} />
      </RoundedBox>
      {[-0.72, -0.24, 0.24, 0.72].map((x) => (
        <RoundedBox
          key={x}
          args={[0.42, 1.0, 0.07]}
          radius={0.032}
          smoothness={3}
          position={[x, 1.0, -0.99]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial {...headFabric} color="#4f4842" roughness={0.98} />
        </RoundedBox>
      ))}
      {/* المرتبة */}
      <RoundedBox args={[1.86, 0.28, 1.98]} radius={0.055} smoothness={3} position={[0, 0.53, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...linen} color="#ded6c6" roughness={1} />
      </RoundedBox>
      {/* ملاءة بيضاء غير مثالية */}
      <RoundedBox
        args={[1.9, 0.07, 1.92]}
        radius={0.03}
        smoothness={3}
        position={[0, 0.68, -0.04]}
        rotation-x={0.006}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...sheet} color="#ece5d5" roughness={1} />
      </RoundedBox>
      {/* duvet مطوي عند الأرجل */}
      <RoundedBox
        args={[1.9, 0.16, 0.88]}
        radius={0.06}
        smoothness={3}
        position={[0, 0.75, 0.52]}
        rotation-x={-0.015}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...duvet} color="#d3c9b3" roughness={1} />
      </RoundedBox>
      {/* مخدات فندقية: صفّان */}
      {[-0.46, 0.46].map((x) => (
        <RoundedBox
          key={`p${x}`}
          args={[0.78, 0.19, 0.44]}
          radius={0.085}
          smoothness={3}
          position={[x, 0.79, -0.74]}
          rotation-x={-0.2}
          rotation-z={x > 0 ? 0.03 : -0.04}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial {...sheet} color="#f1ebdc" roughness={1} />
        </RoundedBox>
      ))}
      {[-0.44, 0.44].map((x) => (
        <RoundedBox
          key={`q${x}`}
          args={[0.7, 0.16, 0.38]}
          radius={0.075}
          smoothness={3}
          position={[x, 0.73, -0.42]}
          rotation-x={-0.06}
          rotation-z={x > 0 ? -0.05 : 0.04}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial {...sheet} color="#e9e1cf" roughness={1} />
        </RoundedBox>
      ))}
    </group>
  );
}

/** مكتب فندق بسيط بخشب veneer (سطح نظيف + جنبان + رف). */
function HotelDesk({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  const veneer = usePbr("oak_veneer_01", [1.6, 1]);
  const veneerSide = usePbr("oak_veneer_01", [0.7, 1.2]);
  return (
    <group position={position} rotation-y={rotationY}>
      <RoundedBox args={[1.5, 0.05, 0.62]} radius={0.014} smoothness={3} position={[0, 0.745, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...veneer} color="#6b5d51" roughness={0.72} />
      </RoundedBox>
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} position={[x, 0.36, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.06, 0.72, 0.58]} />
          <meshStandardMaterial {...veneerSide} color="#61554a" roughness={0.75} />
        </mesh>
      ))}
      <mesh position={[0, 0.2, -0.02]} castShadow receiveShadow>
        <boxGeometry args={[1.34, 0.04, 0.5]} />
        <meshStandardMaterial {...veneer} color="#5b5045" roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.56, -0.27]} receiveShadow>
        <boxGeometry args={[1.36, 0.3, 0.03]} />
        <meshStandardMaterial {...veneer} color="#564c42" roughness={0.8} />
      </mesh>
    </group>
  );
}

/** دولاب فندق بسيط: بابان بخشب veneer ومقابض معدنية هادئة. */
function HotelWardrobe({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  const veneer = usePbr("oak_veneer_01", [1.2, 2]);
  const door = usePbr("oak_veneer_01", [0.7, 2.1]);
  return (
    <group position={position} rotation-y={rotationY}>
      <RoundedBox args={[1.32, 2.06, 0.62]} radius={0.02} smoothness={3} position={[0, 1.03, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...veneer} color="#645749" roughness={0.76} />
      </RoundedBox>
      {[-0.32, 0.32].map((x) => (
        <group key={x}>
          <RoundedBox
            args={[0.6, 1.92, 0.04]}
            radius={0.012}
            smoothness={3}
            position={[x, 1.06, 0.32]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial {...door} color="#6d5f51" roughness={0.7} />
          </RoundedBox>
          <mesh position={[x + (x > 0 ? -0.24 : 0.24), 1.06, 0.37]} rotation-x={Math.PI / 2} castShadow>
            <cylinderGeometry args={[0.012, 0.012, 0.22, 10]} />
            <meshStandardMaterial color="#a2916e" metalness={0.85} roughness={0.32} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[1.28, 0.06, 0.58]} />
        <meshStandardMaterial color="#2b2521" roughness={0.9} />
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
  
  const ceiling = usePbr("beige_wall_001", [6, 20]);
  const roomCeiling = usePbr("beige_wall_001", [6, 6]);
  const elevatorMetal = usePbr("beige_wall_001", [1, 1]);

  const floorSign = useMemo(() => signTexture("١٣", "الطابق"), []);
  const roomSign = useMemo(() => signTexture("١٣٠٦"), []);
  const sign1304 = useMemo(() => signTexture("١٣٠٤"), []);
  const sign1302 = useMemo(() => signTexture("١٣٠٢"), []);

  return (
    <group>
      {/* ===== أرضيات ===== */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, (c.z0 + c.z1) / 2]} receiveShadow>
        <planeGeometry args={[c.x1 - c.x0, corridorLen]} />
        <meshStandardMaterial {...corridorCarpet} color="#8e7a6d" roughness={1} normalScale={[1.15, 1.15]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[roomCx, 0, roomCz]} receiveShadow>
        <planeGeometry args={[roomW, roomLen]} />
        <meshStandardMaterial {...roomCarpet} color="#94806f" roughness={1} normalScale={[1.05, 1.05]} />
      </mesh>

      {/* ===== أسقف ===== */}
      <mesh rotation-x={Math.PI / 2} position={[0, H, (c.z0 + c.z1) / 2]} receiveShadow>
        <planeGeometry args={[c.x1 - c.x0, corridorLen]} />
        <meshStandardMaterial {...ceiling} color="#8c8478" roughness={0.98} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[roomCx, H, roomCz]} receiveShadow>
        <planeGeometry args={[roomW, roomLen]} />
        <meshStandardMaterial {...roomCeiling} color="#8f877b" roughness={0.98} />
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
          color="#83858a"
          metalness={0.88}
          roughness={0.36}
          normalScale={[0.45, 0.45]}
        />
      </mesh>
      <mesh position={[0, 1.12, c.z1 - 0.14]}>
        <boxGeometry args={[0.025, 2.24, 0.02]} />
        <meshStandardMaterial color="#0f0e10" />
      </mesh>
      <mesh position={[0, 2.28, c.z1 - 0.12]} castShadow>
        <boxGeometry args={[1.92, 0.12, 0.1]} />
        <meshStandardMaterial color="#8f7746" metalness={0.85} roughness={0.35} />
      </mesh>
      <mesh position={[-0.9, 1.12, c.z1 - 0.13]} castShadow>
        <boxGeometry args={[0.1, 2.3, 0.09]} />
        <meshStandardMaterial color="#8b7444" metalness={0.82} roughness={0.4} />
      </mesh>
      <mesh position={[0.9, 1.12, c.z1 - 0.13]} castShadow>
        <boxGeometry args={[0.1, 2.3, 0.09]} />
        <meshStandardMaterial color="#8b7444" metalness={0.82} roughness={0.4} />
      </mesh>
      <mesh position={[1.15, 1.15, c.z1 - 0.12]}>
        <boxGeometry args={[0.09, 0.15, 0.03]} />
        <meshStandardMaterial color="#b0925c" metalness={0.85} roughness={0.32} />
      </mesh>
      <mesh position={[0, 2.6, c.z1 - 0.11]}>
        <planeGeometry args={[0.62, 0.62]} />
        <meshStandardMaterial map={floorSign} roughness={0.45} metalness={0.35} />
      </mesh>

      {/* ===== الممر: أبواب فندق + إضاءة حائطية غير متساوية ===== */}
      <DoorUnit position={[c.x0 + 0.1, 0, -4.5]} rotationY={Math.PI / 2} sign={sign1302} />
      <DoorUnit position={[c.x0 + 0.1, 0, -9.5]} rotationY={Math.PI / 2} sign={sign1304} />
      <Sconce position={[c.x1 - 0.1, 1.98, -2.6]} rotationY={-Math.PI / 2} intensity={1.9} />
      <Sconce position={[c.x0 + 0.1, 1.98, -6.9]} rotationY={Math.PI / 2} intensity={1.1} flicker />
      <Sconce position={[c.x1 - 0.1, 1.98, -11.2]} rotationY={-Math.PI / 2} intensity={1.5} />
      <Sconce position={[c.x0 + 0.1, 1.98, -16.4]} rotationY={Math.PI / 2} intensity={0.85} />
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

      {/* كونسول الممر + أباجورة ومرآة */}
      <group position={[c.x1 - 0.42, 0, -8.6]}>
        <Prop name="side_table_01" rotationY={-Math.PI / 2} height={0.72} tint="#6d5c4a" />
        <Prop name="desk_lamp_arm_01" position={[0, 0.72, -0.2]} rotationY={-Math.PI / 2} height={0.44} />
        <mesh position={[0.05, 1.02, -0.2]}>
          <sphereGeometry args={[0.045, 10, 8]} />
          <meshStandardMaterial color="#fff2e2" emissive="#ffdcb8" emissiveIntensity={0.95} toneMapped={false} />
        </mesh>
        <pointLight position={[-0.05, 1.02, -0.2]} color="#ffd3a8" intensity={1.5} distance={4.2} decay={2} />
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
      <Wall a={[r.x1, r.z0]} b={[r.x1, r.z1]} plaster />
      <Wall a={[r.x0, r.z1]} b={[r.x1, r.z1]} plaster />
      <Wall a={[r.x0, r.z0]} b={[r.x1, r.z0]} plaster />
      <Wall a={[r.x0, r.z0]} b={[r.x0, -15.2]} plaster />
      <Wall a={[r.x0, -13.8]} b={[r.x0, r.z1]} plaster />

      <DoorUnit position={[1.95, 0, -14.5]} rotationY={-Math.PI / 2} open={-1.2} />
      <LockScratchProp />
      <mesh position={[c.x1 - 0.1, 1.72, -13.4]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[0.38, 0.38]} />
        <meshStandardMaterial map={roomSign} roughness={0.45} metalness={0.35} />
      </mesh>

      {/* نافذة الفندق بستارة blackout */}
      <HotelWindow position={[4.5, 1.55, r.z0 + 0.14]} />

      {/* ===== أثاث الغرفة (غرفة فندق واقعية) ===== */}
      <Zone z={-11}>
        {/* السرير Queen برأسه على الطوفة اليمنى + كومدينتان وأباجورتان */}
        <HotelBed position={[6.5, 0, -17.6]} rotationY={-Math.PI / 2} />
        <Prop name="side_table_01" position={[7.15, 0, -16.3]} rotationY={-Math.PI / 2} height={0.68} tint="#6f6152" />
        <Prop name="side_table_01" position={[7.15, 0, -18.9]} rotationY={-Math.PI / 2} height={0.68} tint="#6f6152" />
        <Prop name="desk_lamp_arm_01" position={[7.2, 0.68, -18.9]} rotationY={-Math.PI / 2} height={0.42} />
        <Prop name="desk_lamp_arm_01" position={[7.2, 0.68, -16.05]} rotationY={-Math.PI / 2} height={0.4} />
        <HotelPhone position={[7.18, 0.68, -16.6]} rotationY={-Math.PI / 2} />
        <EarringProp />
        <mesh position={[7.15, 0.96, -18.9]}>
          <sphereGeometry args={[0.045, 10, 8]} />
          <meshStandardMaterial color="#fff2e2" emissive="#ffdcb8" emissiveIntensity={0.95} toneMapped={false} />
        </mesh>
        <pointLight position={[6.85, 0.99, -18.9]} color="#ffd0a4" intensity={1.9} distance={4.6} decay={2} />
        <mesh position={[7.15, 0.94, -16.05]}>
          <sphereGeometry args={[0.04, 10, 8]} />
          <meshStandardMaterial color="#fff0dd" emissive="#ffd9b0" emissiveIntensity={0.8} toneMapped={false} />
        </mesh>
        <pointLight position={[6.9, 0.96, -16.05]} color="#ffd2a8" intensity={1.4} distance={4.2} decay={2} />

        {/* مكتب الفندق تحت النافذة + كرسي واحد */}
        <HotelDesk position={[3.15, 0, -19.1]} />
        <Prop name="hotel_desk_chair" position={[3.15, 0, -18.35]} rotationY={Math.PI} height={0.92} />
        <DeskNoteProp />

        {/* تلفزيون على كونسول منخفض مقابل السرير */}
        <Prop name="side_table_01" position={[2.15, 0, -16.9]} rotationY={Math.PI / 2} height={0.66} tint="#6d5e4d" />
        <Prop name="television_02" position={[2.2, 0.66, -16.9]} rotationY={Math.PI / 2} width={0.72} />

        {/* الدولاب قريب من المدخل + طاولة صغيرة وحقيبة */}
        <HotelWardrobe position={[3.5, 0, -13.42]} rotationY={Math.PI} />
        <Prop name="side_table_01" position={[5.7, 0, -13.6]} rotationY={Math.PI} height={0.52} tint="#6f6152" />
        <Prop name="vintage_suitcase" position={[4.5, 0, -13.6]} rotationY={0.5} width={0.6} />

        <Prop
          name="hanging_picture_frame_02"
          position={[r.x1 - 0.11, 1.72, -15.1]}
          rotationY={-Math.PI / 2}
          anchor="origin"
          width={0.85}
        />
      </Zone>
      <LightSwitch position={[2.0, 1.15, -13.9]} rotationY={Math.PI / 2} />

      {/* ===== الإضاءة: دافئة خافتة غير متساوية، نهاية الممر أغمق ===== */}
      <ambientLight intensity={1.02} color="#a2aab8" />
      <hemisphereLight args={["#a3abba", "#8b7563", 1.05]} />
      <CeilingLamp position={[0, H - 0.06, -3.0]} intensity={3.6} />
      <CeilingLamp position={[0, H - 0.06, -10.6]} intensity={2.9} />
      {/* fill قريب من السجادة حتى تبقى أرضية الممر مقروءة بدون فقدان الجو */}
      <pointLight position={[0, 1.15, -2.2]} color="#e9d8c0" intensity={1.5} distance={6.5} decay={2} />
      <pointLight position={[0, 1.1, -7.4]} color="#e2d1ba" intensity={1.3} distance={6.5} decay={2} />
      <pointLight position={[0, 1.1, -12.6]} color="#dccbb5" intensity={1.1} distance={6} decay={2} />
      <pointLight position={[0, 1.05, -17.6]} color="#cfc0ab" intensity={0.85} distance={5.5} decay={2} />
      <Zone z={-11}>
        <CeilingLamp position={[4.4, H - 0.06, -16.6]} intensity={5.4} castShadow />
        <CeilingLamp position={[3.1, H - 0.06, -14.2]} intensity={3.2} />
        {/* fill خفيف للزوايا حتى يبقى الأثاث مقروءًا */}
        <pointLight position={[2.9, 1.7, -14.6]} color="#e8d6bd" intensity={1.9} distance={7} decay={2} />
        <pointLight position={[3.3, 1.6, -18.6]} color="#dfcdb6" intensity={1.7} distance={7} decay={2} />
        <pointLight position={[6.2, 1.7, -15.2]} color="#e2d0b9" intensity={1.5} distance={7} decay={2} />
        <pointLight position={[5.2, 1.05, -17.4]} color="#d8c7b1" intensity={1.2} distance={6} decay={2} />
      </Zone>


    </group>
  );
}
