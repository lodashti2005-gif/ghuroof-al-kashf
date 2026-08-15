import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Fingerprint, Search, Unlock, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { SceneCrop } from "@/components/game/scene-crop";
import { ActionButton, GameShell, LeaveRoomButton } from "@/components/game/shell";
import { EvidenceBoard } from "@/components/game/evidence-board";
import { CaseTag, Eyebrow, Panel } from "@/components/game/ui";
import { caseFile, evidence, getEvidence } from "@/game/case-data";
import {
  SCENE_EVIDENCE_IDS,
  sceneDecoys,
  sceneHotspots,
  sceneImage,
  sceneImageSize,
} from "@/game/scene";
import { playDiscoverySting } from "@/game/discovery-fx";
import { useRoom } from "@/game/use-room";

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
  const unlockedIds = room?.unlockedEvidence ?? [];

  const [found, setFound] = useState<string | null>(null);
  const [miss, setMiss] = useState<string | null>(null);
  const [board, setBoard] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [spark, setSpark] = useState<{ x: number; y: number; k: number } | null>(null);
  const [flash, setFlash] = useState<number | null>(null);
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
    setFound(evidenceId);
    if (!isNew) return;
    // Count each discovery exactly once, even on rapid repeat clicks.
    claimed.current.add(evidenceId);
    actions.unlockEvidence(evidenceId);
    setSpark({ x: at.x, y: at.y, k: Date.now() });
    setFlash(Date.now());
    setToast("🔎 انضاف الدليل للوحة الأدلة");
    playDiscoverySting();
  };


  const foundItem = found ? getEvidence(found) : undefined;
  const foundAdded = !!found && unlockedIds.includes(found);
  const unlockedItems = evidence.filter((e) => unlockedIds.includes(e.id));
  const sceneFound = SCENE_EVIDENCE_IDS.filter((id) => unlockedIds.includes(id));
  const sceneTotal = SCENE_EVIDENCE_IDS.length;
  const sceneComplete = sceneFound.length >= sceneTotal;

  return (
    <GameShell title="مسرح الجريمة" right={<LeaveRoomButton />}>
      <div className="space-y-5">
        <Panel className="cine-in flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <Eyebrow>معاينة الموقع</Eyebrow>
            <h1 className="mt-1.5 text-xl font-bold sm:text-2xl">مسرح الجريمة</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {caseFile.victim.location} — دقّقوا بالصورة واضغطوا على أي شي يشدكم. بعض الأشياء ما
              تعني شي، وبعضها دليل. الأدلة اللي تكتشفونها تنضاف تلقائياً للوحة الأدلة وتصير جاهزة
              للمواجهة بالاستجواب.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CaseTag tone="evidence">
              الأدلة المكتشفة: {sceneFound.length}/{sceneTotal}
            </CaseTag>
            <ActionButton variant="outline" onClick={() => setBoard(true)}>
              <Fingerprint className="size-4" /> لوحة الأدلة
            </ActionButton>
            <ActionButton
              variant={sceneComplete ? "primary" : "outline"}
              onClick={() => navigate({ to: "/dashboard" })}
            >
              <Users className="size-4" />
              {sceneComplete ? "ابدأ الاستجواب" : "المشتبه فيهم"}
            </ActionButton>
          </div>
        </Panel>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="surface-panel cine-in overflow-hidden p-0">
            <div
              className="relative w-full select-none"
              onClick={() => setMiss("ما في شي مهم بهذا المكان")}
            >
              <img
                src={sceneImage}
                alt="صورة مسرح الجريمة داخل الشاليه"
                width={sceneImageSize.width}
                height={sceneImageSize.height}
                className="block w-full cursor-crosshair"
                style={{ filter: "brightness(1.12) contrast(1.03) saturate(1.04)" }}
              />
              {/* Decoy props: clickable, but nothing useful. Rendered under the hotspots. */}
              {sceneDecoys.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  aria-label="فحص تفصيلة في مسرح الجريمة"
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
              {/* Hidden hotspots: no rings, no markers, nothing that hints location. */}
              {sceneHotspots.map((h) => (
                <button
                  key={h.evidenceId}
                  type="button"
                  aria-label="فحص تفصيلة في مسرح الجريمة"
                  data-evidence-hotspot={h.evidenceId}
                  onClick={(e) => {
                    e.stopPropagation();
                    inspect(h.evidenceId, { x: h.x, y: h.y });
                  }}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-crosshair rounded-full bg-transparent focus:outline-none"
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
              {miss && (
                <div className="pointer-events-none absolute bottom-3 right-1/2 translate-x-1/2 rounded-lg border border-border bg-card/90 px-3 py-1.5 text-xs text-muted-foreground">
                  {miss}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 border-t border-border/70 px-4 py-3 text-xs text-muted-foreground">
              <Search className="size-3.5 shrink-0" />
              كل واحد فيكم يفحص زاوية، والملاحظات تتشارك بين الفريق.
            </div>
          </div>

          {/* Side board: only what the team already discovered. */}
          <aside className="surface-panel cine-in h-fit p-4">
            <Eyebrow>الأدلة المكتشفة</Eyebrow>
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
                        className="flex w-full items-center gap-3 rounded-lg border border-evidence/40 bg-card p-2 text-right transition-colors hover:border-evidence"
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
                        <span className="text-sm text-muted-foreground">دليل رقم {i + 1} — بعده مو مكتشف</span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            {sceneComplete ? (
              <div className="mt-4 space-y-3 rounded-lg border border-evidence/40 bg-evidence/5 p-3">
                <p className="text-sm font-bold text-evidence">
                  خلصت معاينة مسرح الجريمة — كل الأدلة بيدكم
                </p>
                <ActionButton className="w-full" onClick={() => navigate({ to: "/dashboard" })}>
                  <Users className="size-4" /> انتقل للمرحلة التالية
                </ActionButton>
              </div>
            ) : (
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                باقي {sceneTotal - sceneFound.length} أدلة بالصورة. المرحلة التالية تفتح بعد ما
                تكملون {sceneTotal}/{sceneTotal}.
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
                <CaseTag tone="evidence">{foundAdded ? "تم الاكتشاف" : "شي مشبوه"}</CaseTag>
              </div>
              <h2 className="mt-2 text-xl font-bold">{foundItem.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {foundItem.description}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                علاقته بالقضية ما تتوضح إلا من استجواب المشتبه المناسب.
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                {foundAdded ? (
                  <ActionButton variant="outline" className="w-full" disabled>
                    <Check className="size-4" /> موجود بلوحة الأدلة
                  </ActionButton>
                ) : (
                  <ActionButton className="w-full" onClick={() => inspect(foundItem.id, { x: 50, y: 50 })}>
                    <Fingerprint className="size-4" /> إضافة إلى لوحة الأدلة
                  </ActionButton>
                )}
                <ActionButton
                  variant="outline"
                  className="w-full"
                  onClick={() => setFound(null)}
                >
                  رجوع لمسرح الجريمة
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
                <Eyebrow>لوحة الأدلة</Eyebrow>
                <h2 className="mt-1 text-lg font-bold">
                  الأدلة المكتشفة: {unlockedItems.length}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setBoard(false)}
                aria-label="إغلاق"
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
                  author: me?.name ?? "محقق",
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
