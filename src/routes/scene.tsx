import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Fingerprint, Search, Unlock, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { SceneCrop } from "@/components/game/scene-crop";
import { ActionButton, GameShell, LeaveRoomButton } from "@/components/game/shell";
import { EvidenceBoard } from "@/components/game/evidence-board";
import { CaseTag, Eyebrow, Panel } from "@/components/game/ui";
import { caseFile, evidence, getEvidence } from "@/game/case-data";
import { SCENE_EVIDENCE_IDS, SCENE_START_VIEW, getSceneView, sceneImageSize } from "@/game/scene";

import { playDiscoverySting } from "@/game/discovery-fx";
import { useRoom } from "@/game/use-room";
import { useI18n } from "@/i18n";
import { useTurn } from "@/game/use-turn";

export const Route = createFileRoute("/scene")({
  head: () => ({
    meta: [
      { title: "مسرح الجريمة — ورا السالفة" },
      {
        name: "description",
        content: "افحص مسرح الجريمة بنفسك، دقّق بالتفاصيل واكتشف الأدلة قبل استجواب المشتبهين.",
      },
      { property: "og:title", content: "مسرح الجريمة" },
      { property: "og:description", content: "معاينة بصرية لمسرح جريمة قضية الشاليه." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SceneRoute,
});

function SceneRoute() {
  const { room, me, actions } = useRoom();
  const navigate = useNavigate();
  const { t } = useI18n();
  const unlockedIds = room?.unlockedEvidence ?? [];
  // وقت النقاش: المشاهدة مفتوحة للجميع، بس ما ينكتشف دليل جديد.
  const { discussion, awaitingNextRound, finalPhase } = useTurn();
  // بعد ما يفتح المضيف «القرار الأخير» يتوقف اكتشاف أي دليل جديد.
  const discoveryPaused = discussion || awaitingNextRound || finalPhase;

  const [found, setFound] = useState<string | null>(null);
  const [miss, setMiss] = useState<string | null>(null);
  const [board, setBoard] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [spark, setSpark] = useState<{ x: number; y: number; k: number } | null>(null);
  const [flash, setFlash] = useState<number | null>(null);
  /** Current first-person view; the player starts outside in the hallway. */
  const [viewId, setViewId] = useState<string>(SCENE_START_VIEW);
  const view = getSceneView(viewId);
  /** Drives the quick cinematic fade between views. */
  const [fade, setFade] = useState(false);
  /** Simple history stack for the back button. */
  const [history, setHistory] = useState<string[]>([]);

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
    const previous = history[history.length - 1];
    const nextHistory = history.slice(0, -1);
    setHistory(nextHistory);
    setTimeout(() => {
      setViewId(previous!);
      setFade(false);
    }, 180);
  };

  /** Guards against double counting from rapid clicks before the room syncs. */
  const claimed = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!miss) return;
    const t = setTimeout(() => setMiss(null), 1800);
    return () => clearTimeout(t);
  }, [miss]);

  useEffect(() => {
    if (!spark) return;
    const t = setTimeout(() => setSpark(null), 1200);
    return () => clearTimeout(t);
  }, [spark]);

  useEffect(() => {
    if (flash === null) return;
    const t = setTimeout(() => setFlash(null), 900);
    return () => clearTimeout(t);
  }, [flash]);

  const inspect = (evidenceId: string, at: { x: number; y: number }) => {
    const item = getEvidence(evidenceId);
    if (!item) return;
    const isNew = !unlockedIds.includes(evidenceId) && !claimed.current.has(evidenceId);
    if (isNew && discoveryPaused) {
      setToast(t("scene.discussionPaused"));
      return;
    }
    setFound(evidenceId);
    if (!isNew) return;

    // Count each discovery exactly once, even on rapid repeat clicks.
    claimed.current.add(evidenceId);
    actions.unlockEvidence(evidenceId);
    setSpark({ x: at.x, y: at.y, k: Date.now() });
    setFlash(Date.now());
    setToast(t("scene.discovered"));
    playDiscoverySting();
  };

  const foundItem = found ? getEvidence(found) : undefined;
  const foundAdded = !!found && unlockedIds.includes(found);
  const unlockedItems = evidence.filter((e) => unlockedIds.includes(e.id));
  const sceneFound = SCENE_EVIDENCE_IDS.filter((id) => unlockedIds.includes(id));
  const sceneTotal = SCENE_EVIDENCE_IDS.length;
  const sceneComplete = sceneFound.length >= sceneTotal;

  return (
    <GameShell title={t("scene.title")} right={<LeaveRoomButton />}>
      <div className="space-y-5">
        <Panel className="cine-in flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <Eyebrow>{t("scene.eyebrow")}</Eyebrow>
            <h1 className="mt-1.5 text-xl font-bold sm:text-2xl">{t("scene.title")}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {caseFile.victim.location} — {t("scene.intro")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CaseTag tone="evidence">
              {t("scene.foundCount", { found: sceneFound.length, total: sceneTotal })}
            </CaseTag>
            <ActionButton variant="outline" onClick={() => setBoard(true)}>
              <Fingerprint className="size-4" /> {t("scene.board")}
            </ActionButton>
            <ActionButton
              variant={sceneComplete ? "primary" : "outline"}
              onClick={() => navigate({ to: "/dashboard" })}
            >
              <Users className="size-4" />
              {sceneComplete ? t("scene.startInterrogation") : t("scene.suspects")}
            </ActionButton>
          </div>
        </Panel>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="surface-panel cine-in overflow-hidden p-0">
            <div className="relative w-full select-none overflow-hidden bg-black">
              <div
                className="relative w-full transition-opacity duration-[280ms] ease-out"
                style={{ opacity: fade ? 0 : 1 }}
                onClick={() => setMiss(t("scene.nothingHere"))}
              >
                <img
                  key={view.id}
                  src={view.image}
                  alt={t("scene.sceneAlt")}
                  width={sceneImageSize.width}
                  height={sceneImageSize.height}
                  className="block w-full cursor-crosshair"
                  style={{ filter: "brightness(1.12) contrast(1.03) saturate(1.04)" }}
                />
                {/* Navigation hotspots: invisible, placed over real objects. */}
                {view.nav.map((n) => (
                  <button
                    key={`${view.id}-${n.to}`}
                    type="button"
                    aria-label={t("scene.moveAria")}
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
                {/* Decoy props: clickable, but nothing useful. */}
                {view.decoys.map((d) => (
                  <button
                    key={`${view.id}-${d.id}`}
                    type="button"
                    aria-label={t("scene.inspectAria")}
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

                {/* Hidden evidence hotspots: no markers, never triggered by navigation. */}
                {view.evidence.map((h) => (
                  <button
                    key={h.evidenceId}
                    type="button"
                    aria-label={t("scene.inspectAria")}
                    data-evidence-hotspot={h.evidenceId}
                    onClick={(e) => {
                      e.stopPropagation();
                      inspect(h.evidenceId, { x: h.x, y: h.y });
                    }}
                    className="absolute z-30 -translate-x-1/2 -translate-y-1/2 cursor-crosshair rounded-full bg-transparent focus:outline-none"
                    style={{
                      left: `${h.x}%`,
                      top: `${h.y}%`,
                      width: `${h.w}%`,
                      height: `${h.h}%`,
                      minWidth: "40px",
                      minHeight: "40px",
                    }}
                  />
                ))}

                {spark && (
                  <span
                    key={spark.k}
                    aria-hidden="true"
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${spark.x}%`, top: `${spark.y}%` }}
                  >
                    <span className="block size-12 animate-ping rounded-full border-2 border-evidence/80 bg-evidence/10" />
                  </span>
                )}
              </div>

              {/* Cinematic frame overlay */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 z-30"
                style={{ boxShadow: "inset 0 0 120px 24px rgba(0,0,0,0.55)" }}
              />
              {flash !== null && (
                <span
                  key={flash}
                  aria-hidden="true"
                  className="evidence-flash pointer-events-none absolute inset-0 z-40"
                />
              )}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between gap-2 bg-gradient-to-b from-black/70 to-transparent p-3">
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goBack();
                    }}
                    className="pointer-events-auto rounded-lg border border-white/20 bg-black/55 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm transition-colors hover:bg-black/75 active:bg-black/90 sm:text-sm"
                  >
                    {t("common.back")}
                  </button>
                )}
                <span className="pointer-events-auto rounded-lg bg-black/50 px-2.5 py-1 font-mono text-[11px] tracking-widest text-white/80">
                  {view.label}
                </span>
              </div>

              {miss && (
                <div className="pointer-events-none absolute bottom-3 left-1/2 z-40 -translate-x-1/2 rounded-lg border border-border bg-card/90 px-3 py-1.5 text-center text-xs text-muted-foreground">
                  {miss}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-border/70 px-4 py-3 text-xs text-muted-foreground">
              <Search className="size-3.5 shrink-0" />
              {t("scene.hint")}
            </div>
          </div>

          {/* Side board: only what the team already discovered. */}
          <aside className="surface-panel cine-in h-fit p-4">
            <Eyebrow>{t("scene.found")}</Eyebrow>
            <p className="mt-1 text-lg font-bold">
              {sceneFound.length}/{sceneTotal}
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-evidence transition-all duration-500"
                style={{ width: `${(sceneFound.length / sceneTotal) * 100}%` }}
              />
            </div>
            <ul className="mt-4 space-y-2">
              {SCENE_EVIDENCE_IDS.map((id, i) => {
                const item = sceneFound.includes(id) ? getEvidence(id) : null;
                return (
                  <li key={id}>
                    {item ? (
                      <button
                        type="button"
                        onClick={() => setFound(item.id)}
                        className="flex w-full items-center gap-3 rounded-lg border border-evidence/40 bg-card p-2 text-start transition-colors hover:border-evidence"
                      >
                        <SceneCrop
                          crop={item.crop}
                          alt={item.title}
                          className="size-12 shrink-0 rounded-md"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold">{item.title}</span>
                          <span className="block font-mono text-[11px] text-muted-foreground">
                            {item.number}
                          </span>
                        </span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/70 p-2">
                        <span className="grid size-12 shrink-0 place-items-center rounded-md bg-secondary text-muted-foreground">
                          <Search className="size-4" />
                        </span>
                        <span className="text-sm leading-relaxed text-muted-foreground">
                          {t("scene.slotEmpty", { n: i + 1 })}
                        </span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            {sceneComplete ? (
              <div className="mt-4 space-y-3 rounded-lg border border-evidence/40 bg-evidence/5 p-3">
                <p className="text-sm font-bold leading-relaxed text-evidence">
                  {t("scene.complete")}
                </p>
                <ActionButton className="w-full" onClick={() => navigate({ to: "/dashboard" })}>
                  <Users className="size-4" /> {t("scene.next")}
                </ActionButton>
              </div>
            ) : (
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                {t("scene.remaining", { n: sceneTotal - sceneFound.length, total: sceneTotal })}
              </p>
            )}
          </aside>
        </div>
      </div>

      {/* Discovered evidence close-up */}
      {foundItem && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-background/90 p-4 backdrop-blur-sm"
          onClick={() => setFound(null)}
        >
          <div
            className="surface-panel cine-in w-full max-w-2xl overflow-hidden p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <SceneCrop
              crop={foundItem.crop}
              alt={foundItem.title}
              detail
              className="aspect-[16/10] max-h-[60vh] w-full"
            />
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-muted-foreground">{foundItem.number}</span>
                <CaseTag tone="evidence">
                  {foundAdded ? t("scene.discoveredTag") : t("scene.suspiciousTag")}
                </CaseTag>
              </div>
              <h2 className="mt-2 text-xl font-bold">{foundItem.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {foundItem.description}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{t("scene.relationNote")}</p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                {foundAdded ? (
                  <ActionButton variant="outline" className="w-full" disabled>
                    <Check className="size-4" /> {t("scene.onBoard")}
                  </ActionButton>
                ) : (
                  <ActionButton
                    className="w-full"
                    onClick={() => inspect(foundItem.id, { x: 50, y: 50 })}
                  >
                    <Fingerprint className="size-4" /> {t("scene.addToBoard")}
                  </ActionButton>
                )}
                <ActionButton variant="outline" className="w-full" onClick={() => setFound(null)}>
                  {t("scene.backToScene")}
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evidence board */}
      {board && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-background/92 p-4 backdrop-blur-sm"
          onClick={() => setBoard(false)}
        >
          <div
            className="surface-panel cine-in mx-auto w-full max-w-4xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <Eyebrow>{t("scene.board")}</Eyebrow>
                <h2 className="mt-1 text-lg font-bold">
                  {t("scene.boardCount", { n: unlockedItems.length })}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setBoard(false)}
                aria-label={t("shell.close")}
                className="rounded-lg border border-border bg-secondary p-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-4">
              <EvidenceBoard
                unlockedIds={unlockedIds}
                compact
                deductions={room?.deductions ?? []}
                onDeduction={(link) =>
                  actions.addDeduction({
                    linkId: link.id,
                    title: link.title,
                    insight: link.insight,
                    evidenceIds: link.pair,
                    author: me?.name ?? t("shell.investigator"),
                  })
                }
                onUseDeduction={(text, suspectId) =>
                  navigate({
                    to: "/interrogation/$suspectId",
                    params: { suspectId },
                    search: { ask: text },
                  })
                }
                onConfront={(evidenceId, suspectId) =>
                  navigate({
                    to: "/interrogation/$suspectId",
                    params: { suspectId },
                    search: { confront: evidenceId },
                  })
                }
              />
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
          <div className="cine-in flex items-center gap-3 rounded-xl border border-evidence/40 bg-card px-4 py-3 shadow-[var(--shadow-noir)]">
            <Unlock className="size-4 shrink-0 text-evidence" />
            <span className="text-sm font-bold">{toast}</span>
          </div>
        </div>
      )}
    </GameShell>
  );
}
