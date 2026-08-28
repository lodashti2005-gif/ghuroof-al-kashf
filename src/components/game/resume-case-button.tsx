/**
 * زر «متابعة القضية» — يظهر فقط إذا اللاعب المسجّل عنده جلسة قضية غير منتهية.
 *
 * التقدّم مقروء من قاعدة البيانات (`game_progress` + حالة الغرفة)، فيشتغل بعد
 * إغلاق المتصفح أو تسجيل الخروج أو من جهاز ثاني، ويرجّع اللاعب لآخر نقطة وصلها
 * بدون إعادة خطوات البداية.
 */
import { useNavigate } from "@tanstack/react-router";
import { History } from "lucide-react";
import { useEffect, useState } from "react";

import { caseRegistry } from "@/game/game-meta";
import * as store from "@/game/room-store";

const PLAY_PREFIXES = [
  "/lobby",
  "/roles",
  "/intro",
  "/case",
  "/scene",
  "/dashboard",
  "/notebook",
  "/interrogation",
  "/accusation",
  "/reveal",
  "/last-trip",
];

/** مسار افتراضي حسب القضية والمرحلة لو ما فيه مسار محفوظ. */
function fallbackRoute(caseId: string, phase: string | null): string {
  const lastTrip = caseId === "last-trip";
  switch (phase) {
    case "intro":
      return lastTrip ? "/last-trip/intro" : "/intro";
    case "roles":
      return lastTrip ? "/last-trip/lobby" : "/roles";
    case "investigation":
      return lastTrip ? "/last-trip/scene" : "/dashboard";
    case "voting":
      return lastTrip ? "/last-trip/accusation" : "/accusation";
    case "reveal":
      return lastTrip ? "/last-trip/ending" : "/reveal";
    default:
      return lastTrip ? "/last-trip/lobby" : "/lobby";
  }
}

function targetRoute(saved: store.SavedProgress): string {
  const route = saved.route ?? "";
  if (PLAY_PREFIXES.some((p) => route === p || route.startsWith(`${p}/`))) return route;
  return fallbackRoute(saved.caseId, saved.phase);
}

export function ResumeCaseButton({ className = "" }: { className?: string }) {
  const [saved, setSaved] = useState<store.SavedProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    void store.loadSavedProgress().then((p) => {
      if (alive) setSaved(p);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!saved) return null;

  const title = caseRegistry.find((c) => c.id === saved.caseId)?.title ?? "القضية";

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const ok = await store.resumeSavedProgress(saved);
        setBusy(false);
        if (!ok) {
          setSaved(null);
          return;
        }
        navigate({ to: targetRoute(saved) } as never);
      }}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/45 bg-primary/10 px-6 py-3.5 font-display text-base font-bold text-primary transition-colors hover:bg-primary/15 disabled:opacity-60 ${className}`}
    >
      <History className="size-4.5" />
      {busy ? "نرجّعك لمكانك..." : `متابعة القضية · ${title}`}
    </button>
  );
}
