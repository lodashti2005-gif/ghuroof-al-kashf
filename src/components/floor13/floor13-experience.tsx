import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import {
  FLOOR13_EVIDENCE,
  FLOOR13_EVIDENCE_TOTAL,
  type Floor13EvidencePoint,
} from "@/game/cases/floor13/scene-data";
import { useI18n } from "@/i18n";
import type { Floor13Controls } from "./floor13-player";

/** نصوص «الطابق ١٣» بلغتين — تُختار حسب لغة اللاعب. */
const F13 = {
  move: { ar: "تحرّك", en: "Move" },
  loadingFloor: { ar: "جاري تحميل الطابق…", en: "Loading the floor…" },
  foundEvidence: { ar: "الأدلة المكتشفة", en: "Evidence found" },
  exit: { ar: "خروج", en: "Exit" },
  roomHint: {
    ar: "الغرفة ١٣٠٦ في نهاية الممر على اليمين",
    en: "Room 1306 is at the end of the corridor on the right",
  },
  allFound: { ar: "تم جمع جميع الأدلة", en: "All the evidence has been collected" },
  dragToLook: { ar: "اسحب إصبعك لتحريك النظر", en: "Drag your finger to look around" },
  inspect: { ar: "افحص 🔍", en: "Inspect 🔍" },
  discovered: {
    ar: "تم اكتشافه • غرفة ١٣٠٦ / الطابق ١٣",
    en: "Discovered • Room 1306 / Floor 13",
  },
  close: { ar: "إغلاق", en: "Close" },
  brand: { ar: "ورا السالفة", en: "Wara Al-Salfa" },
  floorTitle: { ar: "الطابق ١٣", en: "Floor 13" },
  intro: {
    ar: "المصعد يتوقف عند الطابق الثالث عشر. الممر ساكت، والغرفة ١٣٠٦ باقي بابها مفتوح…",
    en: "The lift stops on the thirteenth floor. The corridor is silent, and room 1306 still has its door open…",
  },
  enter: { ar: "ادخل الطابق ١٣", en: "Enter Floor 13" },
  loadingScene: { ar: "جاري تحميل المشهد…", en: "Loading the scene…" },
  back: { ar: "رجوع", en: "Back" },
} as const;

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
  const { pick } = useI18n();
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
      <span className="absolute -top-6 right-0 text-[11px] text-amber-100/50">{pick(F13.move.ar, F13.move.en)}</span>
    </div>
  );
}

export function Floor13Experience({ onExit }: { onExit: () => void }) {
  const { pick } = useI18n();
  const controls = useRef<Floor13Controls>({ move: { x: 0, y: 0 }, look: { dx: 0, dy: 0 } });
  const keys = useKeys();
  const [entered, setEntered] = useState(false);
  const [nearId, setNearId] = useState<string | null>(null);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [card, setCard] = useState<Floor13EvidencePoint | null>(null);
  const [completed, setCompleted] = useState(false);
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
      if (next.size === FLOOR13_EVIDENCE_TOTAL) setCompleted(true);
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
            <Suspense fallback={<LoadingVeil label={pick(F13.loadingFloor.ar, F13.loadingFloor.en)} />}>
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
              <span className="text-amber-200/70">{pick(F13.foundEvidence.ar, F13.foundEvidence.en)}</span>
              <span className="font-bold text-amber-100">
                {pick(toArabicDigits(found.size), String(found.size))}/
                {pick(toArabicDigits(FLOOR13_EVIDENCE_TOTAL), String(FLOOR13_EVIDENCE_TOTAL))}
              </span>
            </div>

            <button
              onClick={onExit}
              className="pointer-events-auto absolute left-4 top-4 rounded-full border border-amber-200/20 bg-black/55 px-4 py-2 text-sm text-amber-100/90 backdrop-blur active:scale-95"
            >
              ← {pick(F13.exit.ar, F13.exit.en)}
            </button>

            <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-100/45" />

            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center text-[11px] text-amber-100/35">
              {pick(F13.roomHint.ar, F13.roomHint.en)}
            </div>

            {completed && (
              <div className="absolute left-1/2 top-16 w-max max-w-[90vw] -translate-x-1/2 rounded-full border border-emerald-300/35 bg-emerald-950/70 px-5 py-2 text-center text-sm font-semibold text-emerald-100 backdrop-blur">
                {pick(F13.allFound.ar, F13.allFound.en)}
              </div>
            )}

            <Joystick controls={controls} />

            <span className="absolute bottom-8 right-6 text-[11px] text-amber-100/40">
              {pick(F13.dragToLook.ar, F13.dragToLook.en)}
            </span>

            {near && !card && (
              <button
                onClick={inspect}
                className="pointer-events-auto absolute bottom-32 left-1/2 -translate-x-1/2 rounded-full border border-amber-300/40 bg-amber-100/10 px-7 py-3 text-base font-semibold text-amber-100 shadow-lg backdrop-blur active:scale-95"
              >
                {pick(F13.inspect.ar, F13.inspect.en)}
              </button>
            )}
          </div>

          {/* ===== بطاقة الدليل ===== */}
          {card && (
            <div className="absolute inset-0 z-20 flex items-end justify-center bg-black/55 p-5 pb-10 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl border border-amber-200/25 bg-[#14110e]/95 p-5 shadow-2xl">
                <div className="mb-1 text-[11px] tracking-widest text-amber-300/60">
                  {pick(F13.discovered.ar, F13.discovered.en)}
                </div>
                <h3 className="mb-2 text-lg font-bold text-amber-100">{pick(card.title, card.titleEn)}</h3>
                <p className="mb-4 text-sm leading-relaxed text-amber-50/70">{pick(card.description, card.descriptionEn)}</p>
                <button
                  onClick={() => setCard(null)}
                  className="w-full rounded-xl border border-amber-200/25 bg-amber-100/10 py-3 text-sm font-semibold text-amber-100 active:scale-[0.98]"
                >
                  {pick(F13.close.ar, F13.close.en)}
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
  const { pick } = useI18n();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="text-[11px] tracking-[0.3em] text-amber-300/50">{pick(F13.brand.ar, F13.brand.en)}</div>
      <h1 className="text-3xl font-black text-amber-100">{pick(F13.floorTitle.ar, F13.floorTitle.en)}</h1>
      <p className="max-w-sm text-sm leading-relaxed text-amber-50/55">
        {pick(F13.intro.ar, F13.intro.en)}
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
          {pick(F13.enter.ar, F13.enter.en)}
        </button>
      ) : (
        <span className="text-xs text-amber-100/40">{pick(F13.loadingScene.ar, F13.loadingScene.en)}</span>
      )}
      <button onClick={onExit} className="text-xs text-amber-100/35 underline">
        {pick(F13.back.ar, F13.back.en)}
      </button>
    </div>
  );
}
