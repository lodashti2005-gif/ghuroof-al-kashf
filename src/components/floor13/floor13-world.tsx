import { useMemo } from "react";
import * as THREE from "three";
import { FLOOR13_EVIDENCE, FLOOR13_LAYOUT } from "@/game/cases/floor13/scene-data";
import {
  carpetTexture,
  fabricTexture,
  metalTexture,
  paintingTexture,
  roughnessTexture,
  rugTexture,
  signTexture,
  wallpaperTexture,
  woodTexture,
} from "./textures";

const H = FLOOR13_LAYOUT.wallHeight;
const T = 0.16;

/** طوفة مع وزرة سفلية (baseboard) وحافة علوية (crown) لتفاصيل معمارية. */
function Wall({
  a,
  b,
  height = H,
  y = 0,
  map,
  rough,
  trim = true,
  wood,
}: {
  a: [number, number];
  b: [number, number];
  height?: number;
  y?: number;
  map?: THREE.Texture;
  rough?: THREE.Texture;
  trim?: boolean;
  wood?: THREE.Texture;
}) {
  const cx = (a[0] + b[0]) / 2;
  const cz = (a[1] + b[1]) / 2;
  const dx = Math.abs(b[0] - a[0]);
  const dz = Math.abs(b[1] - a[1]);
  const w = Math.max(dx, T);
  const d = Math.max(dz, T);
  const along = dx > dz;
  const bw = along ? w : T * 1.35;
  const bd = along ? T * 1.35 : d;
  return (
    <group>
      <mesh position={[cx, y + height / 2, cz]} receiveShadow>
        <boxGeometry args={[w, height, d]} />
        <meshStandardMaterial
          map={map ?? null}
          roughnessMap={rough ?? null}
          color={map ? "#ffffff" : "#37302b"}
          roughness={0.9}
        />
      </mesh>
      {trim && (
        <>
          {/* وزرة خشب */}
          <mesh position={[cx, y + 0.075, cz]} receiveShadow>
            <boxGeometry args={[bw, 0.15, bd]} />
            <meshStandardMaterial map={wood ?? null} color={wood ? "#ffffff" : "#2f2419"} roughness={0.7} />
          </mesh>
          {/* حافة علوية */}
          <mesh position={[cx, y + height - 0.06, cz]}>
            <boxGeometry args={[bw, 0.1, bd]} />
            <meshStandardMaterial color="#4b4039" roughness={0.85} />
          </mesh>
        </>
      )}
    </group>
  );
}

/** إطار باب + لوحة باب + مقبض نحاسي. */
function DoorUnit({
  position,
  rotationY = 0,
  wood,
  metal,
  open = 0,
  sign,
}: {
  position: [number, number, number];
  rotationY?: number;
  wood: THREE.Texture;
  metal: THREE.Texture;
  open?: number;
  sign?: THREE.Texture;
}) {
  const w = 1.0;
  const h = 2.15;
  return (
    <group position={position} rotation-y={rotationY}>
      {/* إطار */}
      <mesh position={[-(w / 2 + 0.06), h / 2, 0]} castShadow>
        <boxGeometry args={[0.12, h + 0.12, 0.16]} />
        <meshStandardMaterial map={wood} roughness={0.65} />
      </mesh>
      <mesh position={[w / 2 + 0.06, h / 2, 0]} castShadow>
        <boxGeometry args={[0.12, h + 0.12, 0.16]} />
        <meshStandardMaterial map={wood} roughness={0.65} />
      </mesh>
      <mesh position={[0, h + 0.06, 0]} castShadow>
        <boxGeometry args={[w + 0.24, 0.12, 0.16]} />
        <meshStandardMaterial map={wood} roughness={0.65} />
      </mesh>
      {/* لوحة الباب (تدور حول الحافة) */}
      <group position={[-w / 2, 0, 0]} rotation-y={open}>
        <group position={[w / 2, 0, 0]}>
          <mesh position={[0, h / 2, 0]} castShadow>
            <boxGeometry args={[w, h, 0.06]} />
            <meshStandardMaterial map={wood} roughness={0.6} />
          </mesh>
          {/* حشوات الباب */}
          <mesh position={[0, h * 0.68, 0.035]}>
            <boxGeometry args={[w * 0.62, h * 0.3, 0.012]} />
            <meshStandardMaterial color="#3a281c" roughness={0.7} />
          </mesh>
          <mesh position={[0, h * 0.3, 0.035]}>
            <boxGeometry args={[w * 0.62, h * 0.3, 0.012]} />
            <meshStandardMaterial color="#3a281c" roughness={0.7} />
          </mesh>
          {/* مقبض */}
          <mesh position={[w * 0.36, 1.05, 0.08]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.026, 0.026, 0.12, 10]} />
            <meshStandardMaterial map={metal} color="#c8a35e" metalness={0.85} roughness={0.3} />
          </mesh>
          <mesh position={[w * 0.36, 1.05, 0.035]}>
            <cylinderGeometry args={[0.05, 0.05, 0.02, 12]} />
            <meshStandardMaterial color="#a4854b" metalness={0.8} roughness={0.35} />
          </mesh>
        </group>
      </group>
      {sign && (
        <mesh position={[w / 2 + 0.28, 1.72, 0.09]}>
          <planeGeometry args={[0.32, 0.32]} />
          <meshStandardMaterial map={sign} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

/** إضاءة حائط فندق (شمعدان). */
function Sconce({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh>
        <boxGeometry args={[0.06, 0.3, 0.1]} />
        <meshStandardMaterial color="#8a7145" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0.1, 0.14, 0]}>
        <cylinderGeometry args={[0.13, 0.09, 0.2, 12, 1, true]} />
        <meshStandardMaterial
          color="#d8c193"
          emissive="#ffd9a8"
          emissiveIntensity={0.4}
          roughness={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight color="#ffd2a0" intensity={3.4} distance={7} decay={2} position={[0.22, 0.1, 0]} />
    </group>
  );
}

function CeilingLamp({
  position,
  castShadow = false,
}: {
  position: [number, number, number];
  castShadow?: boolean;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.12, 8]} />
        <meshStandardMaterial color="#3a322a" roughness={0.7} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.3, 0.22, 0.16, 14, 1, true]} />
        <meshStandardMaterial
          color="#e2cda4"
          emissive="#ffe0b8"
          emissiveIntensity={0.34}
          roughness={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, -0.07, 0]}>
        <sphereGeometry args={[0.09, 10, 8]} />
        <meshStandardMaterial color="#fff3dd" emissive="#ffe9c8" emissiveIntensity={0.9} />
      </mesh>
      <pointLight
        color="#ffdcb0"
        intensity={9.5}
        distance={11}
        decay={2}
        position={[0, -0.3, 0]}
        castShadow={castShadow}
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-bias={-0.002}
      />
    </group>
  );
}

/** مفتاح كهرباء صغير. */
function LightSwitch({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh>
        <boxGeometry args={[0.09, 0.13, 0.02]} />
        <meshStandardMaterial color="#c9c3b4" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.016]}>
        <boxGeometry args={[0.04, 0.06, 0.012]} />
        <meshStandardMaterial color="#8e887b" roughness={0.5} />
      </mesh>
    </group>
  );
}

function Painting({
  position,
  rotationY = 0,
  variant = 0,
  size = [0.7, 0.55] as [number, number],
}: {
  position: [number, number, number];
  rotationY?: number;
  variant?: number;
  size?: [number, number];
}) {
  const art = useMemo(() => paintingTexture(variant), [variant]);
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh>
        <boxGeometry args={[size[0] + 0.09, size[1] + 0.09, 0.05]} />
        <meshStandardMaterial color="#7a6238" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.031]}>
        <planeGeometry args={size} />
        <meshStandardMaterial map={art} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Curtain({
  position,
  width = 1.5,
  fabric,
}: {
  position: [number, number, number];
  width?: number;
  fabric: THREE.Texture;
}) {
  const folds = 7;
  return (
    <group position={position}>
      {/* قضيب */}
      <mesh position={[0, 1.15, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.022, 0.022, width + 0.3, 8]} />
        <meshStandardMaterial color="#8a7145" metalness={0.7} roughness={0.4} />
      </mesh>
      {Array.from({ length: folds }).map((_, i) => {
        const x = -width / 2 + (i / (folds - 1)) * width;
        const r = 0.055 + (i % 2 === 0 ? 0.02 : 0);
        return (
          <mesh key={i} position={[x, 0.05, 0]} castShadow>
            <cylinderGeometry args={[r, r * 1.15, 2.2, 7]} />
            <meshStandardMaterial map={fabric} color="#8d5f4a" roughness={0.95} />
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

export function Floor13World({ found }: { found: Set<string> }) {
  const carpet = useMemo(() => carpetTexture([2, 14]), []);
  const roomCarpet = useMemo(() => carpetTexture([5, 7]), []);
  const rug = useMemo(() => rugTexture(), []);
  const paper = useMemo(() => wallpaperTexture([4, 1]), []);
  const paperShort = useMemo(() => wallpaperTexture([2, 1]), []);
  const wood = useMemo(() => woodTexture([2, 1]), []);
  const woodFine = useMemo(() => woodTexture([1, 1]), []);
  const metal = useMemo(() => metalTexture(), []);
  const rough = useMemo(() => roughnessTexture([3, 3]), []);
  const linen = useMemo(() => fabricTexture("#9a9184", [2, 2], "linen"), []);
  const velvet = useMemo(() => fabricTexture("#7d4a3c", [1, 1], "velvet"), []);
  const upholstery = useMemo(() => fabricTexture("#4a3a30", [1, 1], "uphol"), []);
  const floorSign = useMemo(() => signTexture("١٣", "الطابق"), []);
  const roomSign = useMemo(() => signTexture("١٣٠٦"), []);
  const sign1304 = useMemo(() => signTexture("١٣٠٤"), []);
  const sign1302 = useMemo(() => signTexture("١٣٠٢"), []);

  const c = FLOOR13_LAYOUT.corridor;
  const r = FLOOR13_LAYOUT.room;
  const corridorLen = c.z1 - c.z0;
  const roomW = r.x1 - r.x0;
  const roomLen = r.z1 - r.z0;

  return (
    <group>
      {/* ===== أرضيات ===== */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, (c.z0 + c.z1) / 2]} receiveShadow>
        <planeGeometry args={[c.x1 - c.x0, corridorLen]} />
        <meshStandardMaterial map={carpet} roughnessMap={rough} roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[(r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2]} receiveShadow>
        <planeGeometry args={[roomW, roomLen]} />
        <meshStandardMaterial map={roomCarpet} roughnessMap={rough} roughness={1} />
      </mesh>

      {/* ===== أسقف ===== */}
      <mesh rotation-x={Math.PI / 2} position={[0, H, (c.z0 + c.z1) / 2]}>
        <planeGeometry args={[c.x1 - c.x0, corridorLen]} />
        <meshStandardMaterial color="#2a241f" roughness={1} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[(r.x0 + r.x1) / 2, H, (r.z0 + r.z1) / 2]}>
        <planeGeometry args={[roomW, roomLen]} />
        <meshStandardMaterial color="#2c261f" roughness={1} />
      </mesh>

      {/* ===== طوفات الممر ===== */}
      <Wall a={[c.x0, c.z0]} b={[c.x0, c.z1]} map={paper} rough={rough} wood={wood} />
      <Wall a={[c.x1, c.z1]} b={[c.x1, -16.8]} map={paper} rough={rough} wood={wood} />
      <Wall a={[c.x1, -19.2]} b={[c.x1, c.z0]} map={paper} rough={rough} wood={wood} />
      <Wall a={[c.x0, c.z0]} b={[c.x1, c.z0]} map={paperShort} rough={rough} wood={wood} />
      <Wall a={[c.x0, c.z1]} b={[c.x1, c.z1]} map={paperShort} rough={rough} wood={wood} />

      {/* باب المصعد المعدني + إطار نحاسي */}
      <mesh position={[0, 1.12, c.z1 - 0.1]}>
        <boxGeometry args={[1.72, 2.24, 0.06]} />
        <meshStandardMaterial map={metal} color="#8f8f95" metalness={0.85} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.12, c.z1 - 0.14]}>
        <boxGeometry args={[0.025, 2.24, 0.02]} />
        <meshStandardMaterial color="#0f0e10" />
      </mesh>
      <mesh position={[0, 2.28, c.z1 - 0.12]}>
        <boxGeometry args={[1.9, 0.1, 0.08]} />
        <meshStandardMaterial color="#a4854b" metalness={0.8} roughness={0.35} />
      </mesh>
      {/* زر المصعد */}
      <mesh position={[1.05, 1.15, c.z1 - 0.12]}>
        <boxGeometry args={[0.1, 0.16, 0.03]} />
        <meshStandardMaterial color="#b59a63" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* لوحة الطابق ١٣ فوق المصعد */}
      <mesh position={[0, 2.62, c.z1 - 0.11]}>
        <planeGeometry args={[0.7, 0.7]} />
        <meshStandardMaterial map={floorSign} toneMapped={false} />
      </mesh>

      {/* أبواب غرف الممر (زينة) + شمعدانات + لوحات */}
      <DoorUnit
        position={[c.x0 + 0.1, 0, -5.4]}
        rotationY={Math.PI / 2}
        wood={wood}
        metal={metal}
        sign={sign1302}
      />
      <DoorUnit
        position={[c.x0 + 0.1, 0, -12.6]}
        rotationY={Math.PI / 2}
        wood={wood}
        metal={metal}
        sign={sign1304}
      />
      <Sconce position={[c.x0 + 0.14, 1.95, -2.4]} />
      <Sconce position={[c.x0 + 0.14, 1.95, -9.2]} />
      <Sconce position={[c.x1 - 0.14, 1.95, -6.4]} rotationY={Math.PI} />
      <Sconce position={[c.x1 - 0.14, 1.95, -13.4]} rotationY={Math.PI} />
      <Painting position={[c.x1 - 0.12, 1.6, -3.6]} rotationY={-Math.PI / 2} variant={0} />
      <Painting position={[c.x0 + 0.12, 1.6, -15.4]} rotationY={Math.PI / 2} variant={2} />
      <LightSwitch position={[c.x1 - 0.11, 1.15, -16.05]} rotationY={-Math.PI / 2} />

      {/* طاولة كونسول بالممر */}
      <group position={[c.x0 + 0.45, 0, -8.2]}>
        <mesh position={[0, 0.78, 0]} castShadow>
          <boxGeometry args={[0.42, 0.06, 1.1]} />
          <meshStandardMaterial map={woodFine} roughness={0.6} />
        </mesh>
        {[
          [-0.15, -0.48],
          [-0.15, 0.48],
          [0.15, -0.48],
          [0.15, 0.48],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x!, 0.39, z!]}>
            <cylinderGeometry args={[0.03, 0.024, 0.78, 8]} />
            <meshStandardMaterial color="#33261b" roughness={0.7} />
          </mesh>
        ))}
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.13, 0.16, 0.22, 12]} />
          <meshStandardMaterial color="#cbb184" emissive="#ffd6a2" emissiveIntensity={0.32} roughness={0.6} />
        </mesh>
        <pointLight position={[0, 0.95, 0]} color="#ffd2a0" intensity={2.6} distance={5} decay={2} />
      </group>

      {/* ===== غرفة ١٣٠٦ ===== */}
      <Wall a={[r.x1, r.z0]} b={[r.x1, r.z1]} map={paper} rough={rough} wood={wood} />
      <Wall a={[r.x0, r.z1]} b={[r.x1, r.z1]} map={paper} rough={rough} wood={wood} />
      <Wall a={[r.x0, r.z0]} b={[r.x1, r.z0]} map={paper} rough={rough} wood={wood} />

      {/* باب الغرفة مفتوح داخل المدخل */}
      <DoorUnit
        position={[1.95, 0, -18.0]}
        rotationY={-Math.PI / 2}
        wood={wood}
        metal={metal}
        open={-1.15}
      />
      {/* لوحة رقم الغرفة على طوفة الممر جنب الباب */}
      <mesh position={[c.x1 - 0.1, 1.75, -16.35]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[0.42, 0.42]} />
        <meshStandardMaterial map={roomSign} toneMapped={false} />
      </mesh>

      {/* نافذة + ستائر على الطوفة البعيدة */}
      <mesh position={[(r.x0 + r.x1) / 2 + 1.2, 1.55, r.z0 + 0.12]}>
        <planeGeometry args={[1.6, 1.5]} />
        <meshStandardMaterial color="#121821" emissive="#28405e" emissiveIntensity={0.5} roughness={0.4} />
      </mesh>
      <Curtain position={[(r.x0 + r.x1) / 2 + 1.2, 1.35, r.z0 + 0.24]} width={2.1} fabric={velvet} />

      {/* ===== أثاث الغرفة ===== */}
      {/* مكتب بأدراج وأغراض */}
      <group position={[6.5, 0, -22.2]}>
        <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.95, 0.07, 0.88]} />
          <meshStandardMaterial map={woodFine} roughness={0.55} />
        </mesh>
        <mesh position={[0, 0.735, 0]}>
          <boxGeometry args={[2.02, 0.03, 0.94]} />
          <meshStandardMaterial color="#5b452f" roughness={0.5} />
        </mesh>
        {/* وحدة أدراج */}
        <group position={[0.6, 0.36, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.62, 0.7, 0.8]} />
            <meshStandardMaterial map={woodFine} roughness={0.65} />
          </mesh>
          {[-0.2, 0.02, 0.24].map((y, i) => (
            <group key={i} position={[0, y, 0.405]}>
              <mesh>
                <boxGeometry args={[0.54, 0.18, 0.015]} />
                <meshStandardMaterial color="#3b2b1e" roughness={0.6} />
              </mesh>
              <mesh position={[0, 0, 0.03]} rotation-z={Math.PI / 2}>
                <cylinderGeometry args={[0.014, 0.014, 0.16, 8]} />
                <meshStandardMaterial color="#c8a35e" metalness={0.8} roughness={0.3} />
              </mesh>
            </group>
          ))}
        </group>
        {[
          [-0.9, -0.38],
          [-0.9, 0.38],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x!, 0.37, z!]} castShadow>
            <cylinderGeometry args={[0.035, 0.028, 0.75, 8]} />
            <meshStandardMaterial color="#33261b" roughness={0.7} />
          </mesh>
        ))}
        {/* أباجورة المكتب */}
        <group position={[-0.72, 0.78, 0.12]}>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.09, 0.11, 0.03, 12]} />
            <meshStandardMaterial color="#8a7145" metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.24, 8]} />
            <meshStandardMaterial color="#8a7145" metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.14, 0.19, 0.2, 14, 1, true]} />
            <meshStandardMaterial
              color="#e0c795"
              emissive="#ffdcae"
              emissiveIntensity={0.42}
              roughness={0.55}
              side={THREE.DoubleSide}
            />
          </mesh>
          <pointLight position={[0, 0.28, 0]} color="#ffcf96" intensity={5.5} distance={6} decay={2} />
        </group>
        {/* أغراض: أوراق، فنجان، دفتر، قلم */}
        <mesh rotation-x={-Math.PI / 2} position={[0.08, 0.79, 0.02]} rotation-z={0.12}>
          <planeGeometry args={[0.3, 0.42]} />
          <meshStandardMaterial color="#ded7c6" roughness={0.95} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position={[-0.02, 0.787, -0.1]} rotation-z={-0.3}>
          <planeGeometry args={[0.28, 0.4]} />
          <meshStandardMaterial color="#cdc5b2" roughness={0.95} />
        </mesh>
        <mesh position={[-0.34, 0.815, 0.24]}>
          <boxGeometry args={[0.24, 0.05, 0.32]} />
          <meshStandardMaterial color="#3d2b3a" roughness={0.7} />
        </mesh>
        <group position={[0.28, 0.82, 0.3]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.045, 0.038, 0.085, 14]} />
            <meshStandardMaterial color="#ded9cd" roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.045, 0]} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.04, 14]} />
            <meshStandardMaterial color="#20140d" roughness={0.25} />
          </mesh>
        </group>
        <mesh position={[0.05, 0.795, 0.26]} rotation-z={Math.PI / 2} rotation-y={0.4}>
          <cylinderGeometry args={[0.006, 0.006, 0.14, 6]} />
          <meshStandardMaterial color="#141414" roughness={0.5} />
        </mesh>
      </group>

      {/* كرسي مكتب منجّد */}
      <group position={[6.4, 0, -20.95]} rotation-y={0.25}>
        <mesh position={[0, 0.46, 0]} castShadow>
          <boxGeometry args={[0.52, 0.11, 0.52]} />
          <meshStandardMaterial map={upholstery} roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.82, 0.23]} rotation-x={-0.12} castShadow>
          <boxGeometry args={[0.5, 0.62, 0.09]} />
          <meshStandardMaterial map={upholstery} roughness={0.95} />
        </mesh>
        <mesh position={[0, 1.14, 0.21]}>
          <boxGeometry args={[0.5, 0.08, 0.1]} />
          <meshStandardMaterial color="#33261b" roughness={0.7} />
        </mesh>
        {[
          [-0.21, -0.21],
          [0.21, -0.21],
          [-0.21, 0.21],
          [0.21, 0.21],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x!, 0.22, z!]} castShadow>
            <cylinderGeometry args={[0.028, 0.022, 0.45, 8]} />
            <meshStandardMaterial color="#2b2018" roughness={0.75} />
          </mesh>
        ))}
      </group>

      {/* سجادة وسط الغرفة */}
      <mesh rotation-x={-Math.PI / 2} position={[5.4, 0.013, -19.2]} receiveShadow>
        <planeGeometry args={[3.4, 2.5]} />
        <meshStandardMaterial map={rug} roughness={1} />
      </mesh>

      {/* سرير بتفاصيله */}
      <group position={[3.5, 0, -16.6]}>
        {/* هيكل */}
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.55, 0.44, 2.15]} />
          <meshStandardMaterial map={woodFine} roughness={0.7} />
        </mesh>
        {/* مرتبة */}
        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[1.5, 0.24, 2.08]} />
          <meshStandardMaterial map={linen} color="#b7ae9f" roughness={0.95} />
        </mesh>
        {/* مفرش علوي مطوي */}
        <mesh position={[0, 0.675, 0.34]} castShadow>
          <boxGeometry args={[1.52, 0.05, 1.4]} />
          <meshStandardMaterial map={velvet} color="#7a4a3e" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.7, -0.36]}>
          <boxGeometry args={[1.52, 0.06, 0.28]} />
          <meshStandardMaterial map={linen} color="#cfc7b6" roughness={0.9} />
        </mesh>
        {/* مخدات */}
        {[-0.34, 0.34].map((x, i) => (
          <mesh key={i} position={[x, 0.74, -0.78]} rotation-x={-0.18} castShadow>
            <boxGeometry args={[0.62, 0.16, 0.4]} />
            <meshStandardMaterial map={linen} color="#ddd6c6" roughness={0.9} />
          </mesh>
        ))}
        {/* ظهر السرير */}
        <mesh position={[0, 0.95, -1.1]} castShadow>
          <boxGeometry args={[1.62, 1.0, 0.1]} />
          <meshStandardMaterial map={upholstery} color="#5a4437" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.47, -1.1]}>
          <boxGeometry args={[1.66, 0.08, 0.14]} />
          <meshStandardMaterial map={woodFine} roughness={0.6} />
        </mesh>
      </group>

      {/* كومدينة يسار السرير + كومدينة يمين */}
      {[
        [2.45, -17.6],
        [4.6, -17.6],
      ].map(([x, z], i) => (
        <group key={i} position={[x!, 0, z!]}>
          <mesh position={[0, 0.31, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.56, 0.62, 0.5]} />
            <meshStandardMaterial map={woodFine} roughness={0.65} />
          </mesh>
          {[0.16, 0.44].map((y, j) => (
            <group key={j} position={[0, y, 0.255]}>
              <mesh>
                <boxGeometry args={[0.48, 0.2, 0.015]} />
                <meshStandardMaterial color="#3b2b1e" roughness={0.6} />
              </mesh>
              <mesh position={[0, 0, 0.03]}>
                <sphereGeometry args={[0.025, 10, 8]} />
                <meshStandardMaterial color="#c8a35e" metalness={0.8} roughness={0.3} />
              </mesh>
            </group>
          ))}
          {i === 0 && (
            <>
              <mesh position={[0, 0.68, 0]}>
                <cylinderGeometry args={[0.1, 0.13, 0.16, 12]} />
                <meshStandardMaterial
                  color="#dcc494"
                  emissive="#ffd9ab"
                  emissiveIntensity={0.36}
                  roughness={0.6}
                />
              </mesh>
              <pointLight position={[0, 0.72, 0]} color="#ffd0a0" intensity={3.2} distance={5} decay={2} />
            </>
          )}
        </group>
      ))}

      {/* دولاب بأبواب ومقابض */}
      <group position={[8.95, 0, -15.4]}>
        <mesh position={[0, 1.08, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.62, 2.16, 1.5]} />
          <meshStandardMaterial map={woodFine} roughness={0.7} />
        </mesh>
        {[-0.37, 0.37].map((z, i) => (
          <group key={i} position={[-0.32, 1.08, z]}>
            <mesh>
              <boxGeometry args={[0.02, 1.94, 0.66]} />
              <meshStandardMaterial color="#3f2d1f" roughness={0.65} />
            </mesh>
            <mesh position={[-0.02, 0, z > 0 ? -0.26 : 0.26]}>
              <cylinderGeometry args={[0.018, 0.018, 0.16, 8]} />
              <meshStandardMaterial color="#c8a35e" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 2.2, 0]}>
          <boxGeometry args={[0.7, 0.1, 1.58]} />
          <meshStandardMaterial color="#4b3826" roughness={0.6} />
        </mesh>
      </group>

      {/* لوحة ومفتاح داخل الغرفة */}
      <Painting position={[r.x1 - 0.12, 1.7, -20.6]} rotationY={-Math.PI / 2} variant={1} size={[0.9, 0.65]} />
      <LightSwitch position={[2.05, 1.15, -19.05]} rotationY={Math.PI / 2} />

      {/* ===== إضاءة ===== */}
      <ambientLight intensity={0.34} color="#8b93a6" />
      <hemisphereLight args={["#9aa6bd", "#3a2c22", 0.42]} />
      <CeilingLamp position={[0, H - 0.22, -3]} />
      <CeilingLamp position={[0, H - 0.22, -10]} />
      <CeilingLamp position={[0, H - 0.22, -16.5]} />
      <CeilingLamp position={[4.4, H - 0.22, -17.5]} castShadow />
      <CeilingLamp position={[6.6, H - 0.22, -21.5]} castShadow />

      {/* ===== نقاط الأدلة ===== */}
      {FLOOR13_EVIDENCE.map((e) => (
        <EvidenceGlint key={e.id} position={e.position} found={found.has(e.id)} />
      ))}
    </group>
  );
}
