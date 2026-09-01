import * as THREE from "three";

/**
 * خامات إجرائية خفيفة (Canvas) — بدون أي تحميل من الشبكة، مناسبة للجوال.
 * تُنشأ مرة واحدة وتُخزَّن بالكاش، وبدقة معتدلة (256/512) للأداء.
 */
const cache = new Map<string, THREE.Texture>();

function make(
  key: string,
  size: number,
  draw: (ctx: CanvasRenderingContext2D, s: number) => void,
  repeat: [number, number],
): THREE.Texture {
  const cacheKey = `${key}@${repeat[0]}x${repeat[1]}`;
  const cached = cache.get(cacheKey);
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
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  cache.set(cacheKey, tex);
  return tex;
}

/** خامة رمادية (خشونة/نتوء) بدون تحويل ألوان. */
function makeData(
  key: string,
  size: number,
  draw: (ctx: CanvasRenderingContext2D, s: number) => void,
  repeat: [number, number],
): THREE.Texture {
  const tex = make(key, size, draw, repeat);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

function grain(ctx: CanvasRenderingContext2D, s: number, alpha: number, dark = true) {
  for (let i = 0; i < s * s * 0.4; i++) {
    const x = Math.random() * s;
    const y = Math.random() * s;
    const a = Math.random() * alpha;
    ctx.fillStyle = dark ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`;
    ctx.fillRect(x, y, 1.2, 1.2);
  }
}

/** بقع/تعتيق ناعم. */
function patina(ctx: CanvasRenderingContext2D, s: number, count: number, alpha: number) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * s;
    const y = Math.random() * s;
    const r = s * (0.04 + Math.random() * 0.16);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(0,0,0,${alpha})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** سجادة فندق كلاسيكية: نقشة معينات + زخرفة + وبر. */
export function carpetTexture(repeat: [number, number] = [2, 14]) {
  return make(
    "carpet",
    512,
    (ctx, s) => {
      ctx.fillStyle = "#4a2c22";
      ctx.fillRect(0, 0, s, s);
      // شبكة معينات
      ctx.strokeStyle = "rgba(196,150,96,0.20)";
      ctx.lineWidth = 4;
      for (let i = -s; i < s * 2; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + s, s);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(i + s, 0);
        ctx.lineTo(i, s);
        ctx.stroke();
      }
      // زخرفة مركزية متكررة
      for (let gx = 0; gx < 4; gx++) {
        for (let gy = 0; gy < 4; gy++) {
          const cx = gx * (s / 4) + s / 8;
          const cy = gy * (s / 4) + s / 8;
          ctx.strokeStyle = "rgba(122,52,44,0.55)";
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(cx, cy, s / 22, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = "rgba(168,120,72,0.18)";
          ctx.beginPath();
          ctx.arc(cx, cy, s / 40, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      patina(ctx, s, 14, 0.22);
      grain(ctx, s, 0.3);
      grain(ctx, s, 0.05, false);
    },
    repeat,
  );
}

/** سجادة الغرفة: لون أعمق وحدود. */
export function rugTexture() {
  return make(
    "rug",
    512,
    (ctx, s) => {
      ctx.fillStyle = "#5c3330";
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = "rgba(214,178,120,0.35)";
      ctx.lineWidth = 10;
      ctx.strokeRect(24, 24, s - 48, s - 48);
      ctx.lineWidth = 4;
      ctx.strokeRect(52, 52, s - 104, s - 104);
      for (let i = 0; i < 6; i++) {
        ctx.strokeStyle = "rgba(150,80,66,0.5)";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(s / 2, s / 2, 40 + i * 26, 0, Math.PI * 2);
        ctx.stroke();
      }
      patina(ctx, s, 10, 0.24);
      grain(ctx, s, 0.26);
    },
    [1, 1],
  );
}

/** ورق جدران فندق: خطوط دقيقة + نقشة دمشقية بسيطة. */
export function wallpaperTexture(repeat: [number, number] = [2, 1]) {
  return make(
    "wallpaper",
    512,
    (ctx, s) => {
      const g = ctx.createLinearGradient(0, 0, 0, s);
      g.addColorStop(0, "#3a302a");
      g.addColorStop(1, "#2b2320");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      for (let x = 0; x < s; x += 18) {
        ctx.fillStyle = x % 36 === 0 ? "rgba(222,196,152,0.05)" : "rgba(0,0,0,0.12)";
        ctx.fillRect(x, 0, 9, s);
      }
      // نقشة أوراق صغيرة
      ctx.strokeStyle = "rgba(206,172,118,0.10)";
      ctx.lineWidth = 3;
      for (let gx = 0; gx < 4; gx++) {
        for (let gy = 0; gy < 4; gy++) {
          const cx = gx * (s / 4) + s / 8;
          const cy = gy * (s / 4) + s / 8;
          ctx.beginPath();
          ctx.ellipse(cx, cy, s / 26, s / 14, Math.PI / 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(cx, cy, s / 26, s / 14, -Math.PI / 4, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      patina(ctx, s, 12, 0.26);
      grain(ctx, s, 0.22);
    },
    repeat,
  );
}

/** خشب داكن بعروق واضحة. */
export function woodTexture(repeat: [number, number] = [1, 1]) {
  return make(
    "wood",
    512,
    (ctx, s) => {
      ctx.fillStyle = "#4a3325";
      ctx.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y += 3) {
        const a = 0.04 + Math.random() * 0.14;
        ctx.fillStyle = `rgba(0,0,0,${a})`;
        ctx.fillRect(0, y, s, 1 + Math.random() * 2.4);
      }
      // عروق منحنية
      for (let i = 0; i < 12; i++) {
        ctx.strokeStyle = `rgba(24,14,8,${0.12 + Math.random() * 0.2})`;
        ctx.lineWidth = 1 + Math.random() * 2.5;
        ctx.beginPath();
        const y0 = Math.random() * s;
        ctx.moveTo(0, y0);
        ctx.bezierCurveTo(s * 0.3, y0 + 14, s * 0.6, y0 - 16, s, y0 + 6);
        ctx.stroke();
      }
      // لمعة طلاء
      const g = ctx.createLinearGradient(0, 0, s, s);
      g.addColorStop(0, "rgba(255,214,164,0.06)");
      g.addColorStop(0.5, "rgba(0,0,0,0.05)");
      g.addColorStop(1, "rgba(255,214,164,0.05)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      grain(ctx, s, 0.16);
    },
    repeat,
  );
}

/** قماش (مفرش/ستائر/تنجيد). */
export function fabricTexture(base: string, repeat: [number, number] = [1, 1], key = base) {
  return make(
    `fabric-${key}`,
    256,
    (ctx, s) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < s; i += 2) {
        ctx.fillStyle = "rgba(255,255,255,0.035)";
        ctx.fillRect(i, 0, 1, s);
        ctx.fillStyle = "rgba(0,0,0,0.05)";
        ctx.fillRect(0, i, s, 1);
      }
      patina(ctx, s, 8, 0.14);
      grain(ctx, s, 0.12);
    },
    repeat,
  );
}

/** معدن مصقول قديم (أبواب المصعد/المقابض). */
export function metalTexture(repeat: [number, number] = [1, 1]) {
  return make(
    "metal",
    256,
    (ctx, s) => {
      ctx.fillStyle = "#6a6a6e";
      ctx.fillRect(0, 0, s, s);
      for (let x = 0; x < s; x += 1) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`;
        ctx.fillRect(x, 0, 1, s);
        ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`;
        ctx.fillRect(x, 0, 1, s);
      }
      patina(ctx, s, 6, 0.18);
    },
    repeat,
  );
}

/** خامة خشونة عامة لتنويع الانعكاس. */
export function roughnessTexture(repeat: [number, number] = [1, 1]) {
  return makeData(
    "rough",
    256,
    (ctx, s) => {
      ctx.fillStyle = "#b4b4b4";
      ctx.fillRect(0, 0, s, s);
      patina(ctx, s, 20, 0.35);
      grain(ctx, s, 0.3);
      grain(ctx, s, 0.2, false);
    },
    repeat,
  );
}

/** لوحة نص (رقم الطابق / رقم الغرفة) كخامة نحاسية. */
export function signTexture(text: string, sub?: string) {
  return make(
    `sign-${text}-${sub ?? ""}`,
    256,
    (ctx, s) => {
      const g = ctx.createLinearGradient(0, 0, s, s);
      g.addColorStop(0, "#241d16");
      g.addColorStop(0.5, "#100d0b");
      g.addColorStop(1, "#221b14");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = "#a98a55";
      ctx.lineWidth = 7;
      ctx.strokeRect(11, 11, s - 22, s - 22);
      ctx.strokeStyle = "rgba(255,225,170,0.35)";
      ctx.lineWidth = 2;
      ctx.strokeRect(22, 22, s - 44, s - 44);
      ctx.fillStyle = "#e8cf9c";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `bold ${sub ? 108 : 148}px serif`;
      ctx.fillText(text, s / 2, sub ? s / 2 - 22 : s / 2);
      if (sub) {
        ctx.font = "bold 42px serif";
        ctx.fillText(sub, s / 2, s / 2 + 72);
      }
      patina(ctx, s, 5, 0.2);
    },
    [1, 1],
  );
}

/** لوحة فنية بسيطة للجدران (مناظر باهتة مؤطرة). */
export function paintingTexture(variant = 0) {
  return make(
    `painting-${variant}`,
    256,
    (ctx, s) => {
      const skies = ["#3a3a46", "#42382f", "#33403c"];
      const lands = ["#241f22", "#2b2119", "#1e2724"];
      ctx.fillStyle = skies[variant % 3]!;
      ctx.fillRect(0, 0, s, s);
      const g = ctx.createLinearGradient(0, s * 0.3, 0, s);
      g.addColorStop(0, "rgba(255,220,170,0.10)");
      g.addColorStop(1, "rgba(0,0,0,0.4)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = lands[variant % 3]!;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.72);
      for (let x = 0; x <= s; x += 16) {
        ctx.lineTo(x, s * (0.62 + 0.12 * Math.sin((x / s) * 6 + variant)));
      }
      ctx.lineTo(s, s);
      ctx.lineTo(0, s);
      ctx.closePath();
      ctx.fill();
      patina(ctx, s, 10, 0.3);
      grain(ctx, s, 0.2);
    },
    [1, 1],
  );
}
