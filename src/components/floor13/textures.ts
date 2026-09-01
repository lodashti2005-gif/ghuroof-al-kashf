import * as THREE from "three";

/**
 * خامات إجرائية خفيفة (Canvas) — بدون أي تحميل من الشبكة، مناسبة للجوال.
 * تُنشأ مرة واحدة وتُخزَّن بالكاش.
 */
const cache = new Map<string, THREE.Texture>();

function make(
  key: string,
  size: number,
  draw: (ctx: CanvasRenderingContext2D, s: number) => void,
  repeat: [number, number],
): THREE.Texture {
  const cached = cache.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}

function noise(ctx: CanvasRenderingContext2D, s: number, alpha: number) {
  for (let i = 0; i < s * s * 0.35; i++) {
    const x = Math.random() * s;
    const y = Math.random() * s;
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * alpha})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
}

/** سجادة فندق قديمة بنقشة معينات باهتة. */
export function carpetTexture() {
  return make(
    "carpet",
    256,
    (ctx, s) => {
      ctx.fillStyle = "#3a2018";
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = "rgba(150,110,70,0.22)";
      ctx.lineWidth = 3;
      for (let i = -s; i < s * 2; i += 48) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + s, s);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(i + s, 0);
        ctx.lineTo(i, s);
        ctx.stroke();
      }
      noise(ctx, s, 0.35);
    },
    [2, 14],
  );
}

/** ورق جدران عمودي داكن. */
export function wallpaperTexture(repeat: [number, number] = [2, 1]) {
  return make(
    "wallpaper",
    256,
    (ctx, s) => {
      ctx.fillStyle = "#2a2321";
      ctx.fillRect(0, 0, s, s);
      for (let x = 0; x < s; x += 16) {
        ctx.fillStyle = x % 32 === 0 ? "rgba(210,180,140,0.06)" : "rgba(0,0,0,0.18)";
        ctx.fillRect(x, 0, 8, s);
      }
      noise(ctx, s, 0.3);
    },
    repeat,
  );
}

/** خشب داكن للمكتب والأبواب. */
export function woodTexture(repeat: [number, number] = [1, 1]) {
  return make(
    "wood",
    256,
    (ctx, s) => {
      ctx.fillStyle = "#3b2a20";
      ctx.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y += 6) {
        ctx.fillStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.12})`;
        ctx.fillRect(0, y, s, 2 + Math.random() * 3);
      }
      noise(ctx, s, 0.25);
    },
    repeat,
  );
}

/** لوحة نص (رقم الطابق / رقم الغرفة) كخامة. */
export function signTexture(text: string, sub?: string) {
  return make(
    `sign-${text}-${sub ?? ""}`,
    256,
    (ctx, s) => {
      ctx.fillStyle = "#171310";
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = "#7d6541";
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, s - 20, s - 20);
      ctx.fillStyle = "#d9c08a";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `bold ${sub ? 110 : 150}px serif`;
      ctx.fillText(text, s / 2, sub ? s / 2 - 22 : s / 2);
      if (sub) {
        ctx.font = "bold 44px serif";
        ctx.fillText(sub, s / 2, s / 2 + 74);
      }
    },
    [1, 1],
  );
}
