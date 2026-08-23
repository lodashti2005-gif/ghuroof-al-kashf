import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { ActionButton } from "@/components/game/shell";
import { CaseTag, Eyebrow, Panel } from "@/components/game/ui";
import { lastTripCase } from "@/game/cases/last-trip";
import {
  LAST_TRIP_SCENE_START,
  getLastTripSceneView,
  lastTripSceneImageSize,
} from "@/game/cases/last-trip-scene";

/** حالة الاستكشاف محفوظة بمفتاح خاص بهذي القضية فقط — ما تتعلق بقضية الشاليه. */
const VIEW_KEY = "last-trip:scene:view";
const HISTORY_KEY = "last-trip:scene:history";

export const Route = createFileRoute("/last-trip/scene")({
  head: () => ({
    meta: [
      { title: "مسرح الجريمة — آخر رحلة" },
      {
        name: "description",
        content:
          "استكشف محطة الطريق ليلاً بقضية «آخر رحلة»: الموقف، الكوفي شوب، الممر، والحمام البعيد.",
      },
      { property: "og:title", content: "مسرح الجريمة — آخر رحلة" },
      {
        property: "og:description",
        content: "محطة طريق كويتية بالليل… تحرّك بين مواقعها بالضغط داخل الصورة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LastTripSceneRoute,
});

function LastTripSceneRoute() {
  const [viewId, setViewId] = useState<string>(LAST_TRIP_SCENE_START);
  const [history, setHistory] = useState<string[]>([]);
  const [fade, setFade] = useState(false);
  const [miss, setMiss] = useState<string | null>(null);
  const view = getLastTripSceneView(viewId);

  // استعادة آخر موقع بعد الـ refresh (داخل هذي القضية فقط).
  useEffect(() => {
    try {
      const savedView = sessionStorage.getItem(VIEW_KEY);
      const savedHistory = sessionStorage.getItem(HISTORY_KEY);
      if (savedView) setViewId(savedView);
      if (savedHistory) setHistory(JSON.parse(savedHistory) as string[]);
    } catch {
      /* تجاهل */
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(VIEW_KEY, viewId);
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      /* تجاهل */
    }
  }, [viewId, history]);

  useEffect(() => {
    if (!miss) return;
    const t = setTimeout(() => setMiss(null), 1800);
    return () => clearTimeout(t);
  }, [miss]);

  const goTo = (id: string) => {
    if (id === viewId) return;
    setMiss(null);
    setFade(true);
    setHistory((prev) => [...prev, viewId]);
    setTimeout(() => {
      setViewId(id);
      setFade(false);
    }, 180);
  };

  const goBack = () => {
    if (history.length === 0) return;
    setMiss(null);
    setFade(true);
    const previous = history[history.length - 1]!;
    setHistory((prev) => prev.slice(0, -1));
    setTimeout(() => {
      setViewId(previous);
      setFade(false);
    }, 180);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <Panel className="cine-in flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <Eyebrow>معاينة الموقع</Eyebrow>
            <h1 className="mt-1.5 text-xl font-bold sm:text-2xl">
              مسرح الجريمة — {lastTripCase.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              محطة طريق على الخط السريع بعد منتصف الليل. تحرّك بالضغط على الأبواب والأشياء داخل
              الصورة نفسها. الأدلة والاستجواب بعدهم قيد التجهيز.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CaseTag>{lastTripCase.code}</CaseTag>
            <CaseTag tone="evidence">قيد التجهيز</CaseTag>
            <Link to="/cases">
              <ActionButton variant="outline">
                <ArrowRight className="size-4" /> متجر القضايا
              </ActionButton>
            </Link>
          </div>
        </Panel>

        <div className="surface-panel cine-in overflow-hidden p-0">
          <div className="relative w-full select-none overflow-hidden bg-black">
            <div
              className="relative w-full transition-opacity duration-[280ms] ease-out"
              style={{ opacity: fade ? 0 : 1 }}
              onClick={() => setMiss("ماكو شي مهم هنا")}
            >
              <img
                key={view.id}
                src={view.image}
                alt="مشهد داخل محطة الطريق"
                width={lastTripSceneImageSize.width}
                height={lastTripSceneImageSize.height}
                className="block w-full cursor-crosshair"
                style={{ filter: "brightness(1.14) contrast(1.03) saturate(1.04)" }}
              />

              {/* تنقل: مناطق مخفية فوق الأبواب والممرات الحقيقية. */}
              {view.nav.map((n, i) => (
                <button
                  key={`${view.id}-nav-${i}`}
                  type="button"
                  aria-label="التحرك داخل المحطة"
                  data-nav-hotspot={n.to}
                  onClick={(e) => {
                    e.stopPropagation();
                    goTo(n.to);
                  }}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer bg-transparent focus:outline-none"
                  style={{
                    left: `${n.x}%`,
                    top: `${n.y}%`,
                    width: `${n.w}%`,
                    height: `${n.h}%`,
                    minWidth: "44px",
                    minHeight: "44px",
                  }}
                />
              ))}

              {/* أشياء عادية: ينفتح لها وصف قصير بدون أي دليل. */}
              {view.decoys.map((d) => (
                <button
                  key={`${view.id}-${d.id}`}
                  type="button"
                  aria-label="فحص تفصيلة داخل المحطة"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMiss(d.message);
                  }}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-crosshair bg-transparent focus:outline-none"
                  style={{
                    left: `${d.x}%`,
                    top: `${d.y}%`,
                    width: `${d.w}%`,
                    height: `${d.h}%`,
                  }}
                />
              ))}
            </div>

            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 z-30"
              style={{ boxShadow: "inset 0 0 120px 24px rgba(0,0,0,0.55)" }}
            />

            <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between gap-2 bg-gradient-to-b from-black/70 to-transparent p-3">
              {history.length > 0 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goBack();
                  }}
                  className="pointer-events-auto rounded-lg border border-white/20 bg-black/55 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm transition-colors hover:bg-black/75 active:bg-black/90 sm:text-sm"
                >
                  رجوع
                </button>
              ) : (
                <span />
              )}
              <span className="pointer-events-auto rounded-lg bg-black/50 px-2.5 py-1 font-mono text-[11px] tracking-widest text-white/80">
                {view.label}
              </span>
            </div>

            {miss && (
              <div className="pointer-events-none absolute bottom-3 right-1/2 z-40 translate-x-1/2 rounded-lg border border-border bg-card/90 px-3 py-1.5 text-xs text-muted-foreground">
                {miss}
              </div>
            )}
          </div>

          <div className="space-y-1 border-t border-border/70 px-4 py-3 text-xs text-muted-foreground">
            <p className="flex items-center gap-2">
              <Search className="size-3.5 shrink-0" />
              تحرّك بالضغط على الأشياء والأبواب نفسها داخل الصورة.
            </p>
            <p className="leading-relaxed">{view.mood}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
