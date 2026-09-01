import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import {
  FLOOR13_EVIDENCE,
  FLOOR13_EVIDENCE_TOTAL,
  type Floor13EvidencePoint,
} from "@/game/cases/floor13/scene-data";
import type { Floor13Controls } from "./floor13-player";

const Floor13Canvas = lazy(() => import("./floor13-canvas"));

const toArabicDigits = (n: number) =>
  String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);

function useKeys() {
  const keys = useRef(new Set<string>());
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current.add(e.code);
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const blur = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);
  return keys;
}

/** عصا تحكم لمس (أسفل يسار الشاشة). */
function Joystick({ controls }: { controls: React.RefObject<Floor13Controls> }) {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const set = (x: number, y: number) => {
    setKnob({ x, y });
    if (controls.current) controls.current.move = { x: x / 52, y: y / 52 };
  };

  const handle = (e: React.PointerEvent) => {
    const el = base.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const d = Math.hypot(dx, dy);
    const max = 52;
    if (d > max) {
      dx = (dx / d) * max;
      dy = (dy / d) * max;
    }
    set(dx, dy);
  };

  return (
    <div
      ref={base}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        handle(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) handle(e);
      }}
      onPointerUp={(e) => {
        e.currentTarget.releasePointerCapture(e.pointerId);
        set(0, 0);
      }}
      onPointerCancel={() => set(0, 0)}
      className="pointer-events-auto absolute bottom-6 left-5 h-32 w-32 touch-none rounded-full border border-amber-200/25 bg-black/35 backdrop-blur-sm"
    >
      <div
        className="absolute left-1/2 top-1/2 h-14 w-14 rounded-full border border-amber-200/40 bg-amber-100/20"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
      <span className="absolute -top-6 right-0 text-[11px] text-amber-100/50">تحرّك</span>
    </div>
  );
}

export function Floor13Experience({ onExit }: { onExit: () => void }) {
  const controls = useRef<Floor13Controls>({ move: { x: 0, y: 0 }, look: { dx: 0, dy: 0 } });
  const keys = useKeys();
  const [entered, setEntered] = useState(false);
  const [nearId, setNearId] = useState<string | null>(null);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [card, setCard] = useState<Floor13EvidencePoint | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const onNearChange = useCallback((id: string | null) => setNearId(id), []);

  const near = nearId ? (FLOOR13_EVIDENCE.find((e) => e.id === nearId) ?? null) : null;

  const inspect = () => {
    if (!near) return;
    setCard(near);
    setFound((prev) => {
      if (prev.has(near.id)) return prev;
      const next = new Set(prev);
      next.add(near.id);
      return next;
    });
  };

  // النظر بسحب الإصبع / الماوس
  const lookPointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const onLookDown = (e: React.PointerEvent) => {
    lookPointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };
  const onLookMove = (e: React.PointerEvent) => {
    const p = lookPointer.current;
    if (!p || p.id !== e.pointerId) return;
    controls.current.look.dx += e.clientX - p.x;
    controls.current.look.dy += e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
  };
  const onLookUp = () => {
    lookPointer.current = null;
  };

  // دعم Pointer Lock على الكمبيوتر
  useEffect(() => {
    if (!entered) return;
    const el = stageRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== el) return;
      controls.current.look.dx += e.movementX;
      controls.current.look.dy += e.movementY;
    };
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, [entered]);

  useEffect(() => {
    if (!entered) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyE" || e.code === "Enter") inspect();
      if (e.code === "Escape") setCard(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div
      ref={stageRef}
      dir="rtl"
      className="fixed inset-0 z-[60] select-none overflow-hidden bg-[#0b0a09] text-amber-50"
    >
      {entered ? (
        <>
          <div
            className="absolute inset-0 touch-none"
            onPointerDown={(e) => {
              onLookDown(e);
              if (e.pointerType === "mouse" && document.pointerLockElement !== stageRef.current) {
                stageRef.current?.requestPointerLock?.();
              }
            }}
            onPointerMove={onLookMove}
            onPointerUp={onLookUp}
            onPointerCancel={onLookUp}
          >
            <Suspense fallback={<LoadingVeil label="جاري تحميل الطابق…" />}>
              <Floor13Canvas
                controls={controls}
                keys={keys}
                found={found}
                onNearChange={onNearChange}
              />
            </Suspense>
          </div>

          {/* ===== HUD ===== */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-amber-200/20 bg-black/55 px-4 py-2 text-sm backdrop-blur">
              <span className="text-amber-200/70">الأدلة المكتشفة</span>
              <span className="font-bold text-amber-100">
                {toArabicDigits(found.size)}/{toArabicDigits(FLOOR13_EVIDENCE_TOTAL)}
              </span>
            </div>

            <button
              onClick={onExit}
              className="pointer-events-auto absolute left-4 top-4 rounded-full border border-amber-200/20 bg-black/55 px-4 py-2 text-sm text-amber-100/90 backdrop-blur active:scale-95"
            >
              ← خروج
            </button>

            <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-100/45" />

            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center text-[11px] text-amber-100/35">
              الغرفة ١٣٠٦ في نهاية الممر على اليمين
            </div>

            <Joystick controls={controls} />

            <span className="absolute bottom-8 right-6 text-[11px] text-amber-100/40">
              اسحب إصبعك لتحريك النظر
            </span>

            {near && !card && (
              <button
                onClick={inspect}
                className="pointer-events-auto absolute bottom-32 left-1/2 -translate-x-1/2 rounded-full border border-amber-300/40 bg-amber-100/10 px-7 py-3 text-base font-semibold text-amber-100 shadow-lg backdrop-blur active:scale-95"
              >
                افحص 🔍
              </button>
            )}
          </div>

          {/* ===== بطاقة الدليل ===== */}
          {card && (
            <div className="absolute inset-0 z-20 flex items-end justify-center bg-black/55 p-5 pb-10 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl border border-amber-200/25 bg-[#14110e]/95 p-5 shadow-2xl">
                <div className="mb-1 text-[11px] tracking-widest text-amber-300/60">
                  تم اكتشافه • غرفة ١٣٠٦ / الطابق ١٣
                </div>
                <h3 className="mb-2 text-lg font-bold text-amber-100">{card.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-amber-50/70">{card.description}</p>
                <button
                  onClick={() => setCard(null)}
                  className="w-full rounded-xl border border-amber-200/25 bg-amber-100/10 py-3 text-sm font-semibold text-amber-100 active:scale-[0.98]"
                >
                  إغلاق
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <IntroGate onEnter={() => setEntered(true)} onExit={onExit} />
      )}
    </div>
  );
}

function LoadingVeil({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0b0a09] text-sm text-amber-100/60">
      {label}
    </div>
  );
}

/** شاشة تحميل سينمائية قصيرة قبل دخول الـ3D (وتضمن إيماءة مستخدم على الجوال). */
function IntroGate({ onEnter, onExit }: { onEnter: () => void; onExit: () => void }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="text-[11px] tracking-[0.3em] text-amber-300/50">ورا السالفة</div>
      <h1 className="text-3xl font-black text-amber-100">الطابق ١٣</h1>
      <p className="max-w-sm text-sm leading-relaxed text-amber-50/55">
        المصعد يتوقف عند الطابق الثالث عشر. الممر ساكت، والغرفة ١٣٠٦ باقي بابها مفتوح…
      </p>
      <div className="h-[2px] w-56 overflow-hidden rounded bg-amber-200/10">
        <div
          className="h-full bg-amber-300/60 transition-all duration-[1600ms] ease-out"
          style={{ width: ready ? "100%" : "8%" }}
        />
      </div>
      {ready ? (
        <button
          onClick={onEnter}
          className="rounded-full border border-amber-300/40 bg-amber-100/10 px-8 py-3 font-semibold text-amber-100 active:scale-95"
        >
          ادخل الطابق ١٣
        </button>
      ) : (
        <span className="text-xs text-amber-100/40">جاري تحميل المشهد…</span>
      )}
      <button onClick={onExit} className="text-xs text-amber-100/35 underline">
        رجوع
      </button>
    </div>
  );
}
