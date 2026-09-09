import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Gavel, Lock, Microscope, Phone, Search, Users, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { ActionButton } from "@/components/game/shell";
import { CaseTag, Eyebrow, Panel } from "@/components/game/ui";
import { lastTripCase } from "@/game/cases/last-trip";
import {
  LAST_TRIP_EVIDENCE_TOTAL,
  getLastTripEvidence,
} from "@/game/cases/last-trip-evidence";
import {
  discoverLastTripEvidence,
  getLastTripFoundServerSnapshot,
  getLastTripFoundSnapshot,
  hydrateLastTripProgress,
  mergeLastTripFromRoom,
  subscribeLastTripProgress,
} from "@/game/cases/last-trip-progress";
import { useRoom } from "@/game/use-room";
import { LastTripRoleGate } from "@/components/game/last-trip-role-gate";
import { LastTripTrialGate, LastTripTrialBadge } from "@/components/game/last-trip-trial-gate";
import { useLastTripRole } from "@/game/cases/last-trip-role-state";
import { useLastTripInterrogations } from "@/game/cases/last-trip-interrogation-progress";
import {
  LAST_TRIP_DENIED_MESSAGE,
  LAST_TRIP_DENIED_MESSAGE_EN,
  lastTripEvidenceSpecialty,
} from "@/game/cases/last-trip-roles";
import { lastTripT } from "@/game/cases/last-trip-strings";
import { useI18n } from "@/i18n";
import * as store from "@/game/room-store";
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
  component: LastTripSceneScreen,
});

function LastTripSceneScreen() {
  return (
    <LastTripTrialGate>
      <LastTripRoleGate>
      <LastTripSceneRoute />
      </LastTripRoleGate>
    </LastTripTrialGate>
  );
}

function LastTripSceneRoute() {
  const [viewId, setViewId] = useState<string>(LAST_TRIP_SCENE_START);
  const [history, setHistory] = useState<string[]>([]);
  const [fade, setFade] = useState(false);
  const [miss, setMiss] = useState<string | null>(null);
  const [closeUpId, setCloseUpId] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [showCallLog, setShowCallLog] = useState(false);
  const { lang, dir, pick } = useI18n();
  const tt = (key: Parameters<typeof lastTripT>[1], vars?: Record<string, string | number>) =>
    lastTripT(lang, key, vars);
  const deniedMessage = pick(LAST_TRIP_DENIED_MESSAGE, LAST_TRIP_DENIED_MESSAGE_EN);
  const view = getLastTripSceneView(viewId);

  const found = useSyncExternalStore(
    subscribeLastTripProgress,
    getLastTripFoundSnapshot,
    getLastTripFoundServerSnapshot,
  );
  const { room } = useRoom();
  const { allDone: allInterrogated } = useLastTripInterrogations();
  const { inRoom, role, can, analyzed } = useLastTripRole();

  const [localAnalyzed, setLocalAnalyzed] = useState<string[]>([]);
  const [denied, setDenied] = useState<string | null>(null);
  const analyzedAll = [...analyzed, ...localAnalyzed];
  const closeUp = closeUpId ? getLastTripEvidence(closeUpId) : undefined;

  /** مفتاح الفحص مربوط بالغرفة الحالية حتى ما ينتقل بين الغرف. */
  const analyzedKey = room?.code ? `last-trip:analyzed:room:${room.code}` : "last-trip:analyzed:solo";

  useEffect(() => {
    hydrateLastTripProgress();
    try {
      window.localStorage.removeItem("last-trip:analyzed");
      const raw = window.localStorage.getItem(analyzedKey);
      setLocalAnalyzed(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      /* تجاهل */
    }
  }, [analyzedKey]);


  useEffect(() => {
    if (!denied) return;
    const t = setTimeout(() => setDenied(null), 2600);
    return () => clearTimeout(t);
  }, [denied]);

  /** فحص تفصيلي: صاحب الاختصاص فقط، والنتيجة تنشارك مع الفريق بدفتر القضية. */
  const runAnalysis = (evidenceId: string) => {
    const item = getLastTripEvidence(evidenceId);
    if (!item) return;
    const capability = lastTripEvidenceSpecialty[evidenceId];
    if (!capability || !can(capability)) {
      setDenied(deniedMessage);
      return;
    }
    setLocalAnalyzed((prev) => {
      const next = prev.includes(evidenceId) ? prev : [...prev, evidenceId];
      try {
        window.localStorage.setItem(analyzedKey, JSON.stringify(next));
      } catch {
        /* تجاهل */
      }
      return next;
    });
    if (inRoom) {
      store.markLastTripAnalyzed(evidenceId);
      store.addNote({
        author: pick(role?.title ?? "الفريق", role?.titleEn ?? "The team"),
        tag: pick("فحص", "Analysis"),
        text: `${pick(item.title, item.titleEn)} — ${pick(item.analysis, item.analysisEn)}`,
      });
    }
  };

  // مزامنة الأدلة اللي يلقاها لاعبين ثانين بنفس الغرفة.
  useEffect(() => {
    mergeLastTripFromRoom(room?.unlockedEvidence ?? []);
  }, [room?.unlockedEvidence]);

  const openEvidence = (id: string) => {
    const isNew = discoverLastTripEvidence(id);
    setMiss(null);
    setCloseUpId(id);
    if (isNew) {
      setFlash(true);
      setTimeout(() => setFlash(false), 700);
    }
  };

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
    <div dir={dir} className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <Panel className="cine-in flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <Eyebrow>{tt("sceneEyebrow")}</Eyebrow>
            <h1 className="mt-1.5 text-xl font-bold sm:text-2xl">
              {tt("sceneTitle", { title: pick(lastTripCase.title, lastTripCase.titleEn) })}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {tt("sceneDesc")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LastTripTrialBadge />
            <CaseTag>{lastTripCase.code}</CaseTag>
            {role && <CaseTag>{tt("yourRole", { role: pick(role.title, role.titleEn) })}</CaseTag>}
            <CaseTag tone="evidence">
              {tt("evidenceCount", { found: found.length, total: LAST_TRIP_EVIDENCE_TOTAL })}
            </CaseTag>
            {allInterrogated && (
              <Link to="/last-trip/accusation">
                <ActionButton variant="danger">
                  <Gavel className="size-4" /> {tt("accusation")}
                </ActionButton>
              </Link>
            )}
            <Link to="/last-trip/suspects">
              <ActionButton variant="outline">
                <Users className="size-4" /> {tt("characters")}
              </ActionButton>
            </Link>

            <Link to="/cases">
              <ActionButton variant="outline">
                <ArrowRight className="size-4" /> {tt("caseStore")}
              </ActionButton>
            </Link>
          </div>
        </Panel>

        <div className="surface-panel cine-in overflow-hidden p-0">
          <div className="relative w-full select-none overflow-hidden bg-black">
            <div
              className="relative w-full transition-opacity duration-[280ms] ease-out"
              style={{ opacity: fade ? 0 : 1 }}
              onClick={() => setMiss(tt("nothingHere"))}
            >
              <img
                key={view.id}
                src={view.image}
                alt={tt("sceneAlt")}
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
                  aria-label={tt("moveHint")}
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

              {/* أدلة مخفية: بدون توهج ولا إطار ولا أي مؤشر. */}
              {(view.evidence ?? []).map((e) => (
                <button
                  key={`${view.id}-${e.evidenceId}`}
                  type="button"
                  aria-label={tt("inspectHint")}
                  data-ev={e.evidenceId}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    openEvidence(e.evidenceId);
                  }}
                  className="absolute z-[25] -translate-x-1/2 -translate-y-1/2 cursor-crosshair bg-transparent focus:outline-none"
                  style={{
                    left: `${e.x}%`,
                    top: `${e.y}%`,
                    width: `${e.w}%`,
                    height: `${e.h}%`,
                    minWidth: "38px",
                    minHeight: "38px",
                  }}
                />
              ))}

              {/* أشياء عادية: ينفتح لها وصف قصير بدون أي دليل. */}
              {view.decoys.map((d) => (
                <button
                  key={`${view.id}-${d.id}`}
                  type="button"
                  aria-label={tt("inspectHint")}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMiss(pick(d.message, d.messageEn));
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
                  {tt("goBack")}
                </button>
              ) : (
                <span />
              )}
              <span className="pointer-events-auto rounded-lg bg-black/50 px-2.5 py-1 font-mono text-[11px] tracking-widest text-white/80">
                {pick(view.label, view.labelEn)}
              </span>
            </div>

            {flash && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 z-40 bg-white/25 transition-opacity duration-500"
              />
            )}

            {closeUp && (
              <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
                <div className="w-full max-w-md rounded-xl border border-border bg-card/95 p-4 text-start shadow-2xl">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Eyebrow>{tt("newEvidence")}</Eyebrow>
                      <h2 className="mt-1 text-lg font-bold">{pick(closeUp.title, closeUp.titleEn)}</h2>
                    </div>
                    <button
                      type="button"
                      aria-label={tt("close")}
                      onClick={() => setCloseUpId(null)}
                      className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed">{pick(closeUp.observation, closeUp.observationEn)}</p>
                  {analyzedAll.includes(closeUp.id) ? (
                    <div className="mt-3 rounded-lg border border-evidence/40 bg-evidence/10 p-3 text-sm leading-relaxed">
                      <p className="mb-1 text-[0.7rem] text-evidence">{tt("detailedAnalysis")}</p>
                      <p>{pick(closeUp.analysis, closeUp.analysisEn)}</p>
                    </div>
                  ) : lastTripEvidenceSpecialty[closeUp.id] &&
                    can(lastTripEvidenceSpecialty[closeUp.id]!) ? (
                    <button
                      type="button"
                      onClick={() => runAnalysis(closeUp.id)}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-evidence/50 bg-evidence/10 px-3 py-2 text-sm font-semibold text-evidence transition-colors hover:bg-evidence/20"
                    >
                      <Microscope className="size-4" /> {tt("runAnalysis")}
                    </button>
                  ) : (
                    <p className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                      <Lock className="size-3.5 shrink-0" /> {deniedMessage}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {tt("addedToNotebook")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setCloseUpId(null)}
                    className="mt-4 w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm font-semibold transition-colors hover:bg-secondary/70"
                  >
                    {tt("backToScene")}
                  </button>
                </div>
              </div>
            )}

            {miss && (
              <div className="pointer-events-none absolute bottom-3 right-1/2 z-40 translate-x-1/2 rounded-lg border border-border bg-card/90 px-3 py-1.5 text-xs text-muted-foreground">
                {miss}
              </div>
            )}
          </div>

          <div className="space-y-1 border-t border-border/70 px-4 py-3 text-xs text-muted-foreground">
            <p className="flex items-center gap-2">
              <Search className="size-3.5 shrink-0" />
              {tt("moveTip")}
            </p>
            <p className="leading-relaxed">{pick(view.mood, view.moodEn)}</p>
          </div>
        </div>

        {denied && (
          <p className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">
            {denied}
          </p>
        )}

        {/* ملف عبدالله — سجل المكالمات ما ينلقى بالصور، ينفتح من بيانات التحقيق. */}
        <Panel className="cine-in space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Eyebrow>{tt("abdullahFileEyebrow")}</Eyebrow>
              <h2 className="mt-1 text-base font-bold sm:text-lg">{tt("abdullahFileTitle")}</h2>
            </div>
            <ActionButton variant="outline" onClick={() => {
                if (!can("comms")) {
                  setDenied(deniedMessage);
                  return;
                }
                setShowCallLog(true);
                openEvidence("lt-call-log");
              }}>
              <Phone className="size-4" /> {tt("checkCallLog")}
            </ActionButton>
          </div>
          {showCallLog && (
            <div className="space-y-2 rounded-lg border border-border bg-secondary/25 p-3 text-sm">
              <ul className="space-y-1.5 font-mono text-xs leading-relaxed sm:text-sm">
                <li>{tt("callLog1")}</li>
                <li>{tt("callLog2")}</li>
                <li>{tt("callLog3")}</li>
                <li>{tt("callLog4")}</li>
              </ul>
              <p className="text-xs text-muted-foreground">
                {tt("callLogNote")}
              </p>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
