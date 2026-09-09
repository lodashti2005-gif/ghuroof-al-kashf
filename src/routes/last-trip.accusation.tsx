import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Check, Gavel, Lock, RotateCcw, ScrollText, X } from "lucide-react";
import { useEffect, useState } from "react";

import { ActionButton } from "@/components/game/shell";
import { LastTripRoleGate } from "@/components/game/last-trip-role-gate";
import { LastTripTrialGate } from "@/components/game/last-trip-trial-gate";
import { CaseTag, Eyebrow, Panel } from "@/components/game/ui";
import { lastTripCase } from "@/game/cases/last-trip";
import { lastTripSuspects } from "@/game/cases/last-trip-suspects";
import { lastTripEvidence } from "@/game/cases/last-trip-evidence";
import { useLastTripInterrogations } from "@/game/cases/last-trip-interrogation-progress";
import { useLastTripAccusation } from "@/game/cases/last-trip-accusation";
import { getLastTripFoundSnapshot, subscribeLastTripProgress, getLastTripFoundServerSnapshot } from "@/game/cases/last-trip-progress";
import { lastTripT } from "@/game/cases/last-trip-strings";
import { useI18n } from "@/i18n";
import { useRoom } from "@/game/use-room";
import { judgeLastTripAccusation } from "@/lib/last-trip-ending.functions";
import { cn } from "@/lib/utils";
import { useSyncExternalStore } from "react";

export const Route = createFileRoute("/last-trip/accusation")({
  head: () => ({
    meta: [
      { title: "الاختيار النهائي — آخر رحلة" },
      {
        name: "description",
        content:
          "شاشة الاتهام بقضية «آخر رحلة»: اختاروا المتهم بعد ما تخلصون استجواب كل الشخصيات.",
      },
      { property: "og:title", content: "الاختيار النهائي — آخر رحلة" },
      {
        property: "og:description",
        content: "اختيار المتهم النهائي بقضية «آخر رحلة».",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LastTripAccusationScreen,
});

function LastTripAccusationScreen() {
  return (
    <LastTripTrialGate>
      <LastTripRoleGate>
      <LastTripAccusationRoute />
      </LastTripRoleGate>
    </LastTripTrialGate>
  );
}

function LastTripAccusationRoute() {
  const { allDone, count, total } = useLastTripInterrogations();
  const { acc, confirm, retry, openEnding } = useLastTripAccusation();
  const { room, actions } = useRoom();
  const navigate = useNavigate();
  const judge = useServerFn(judgeLastTripAccusation);
  const { lang, dir, pick } = useI18n();
  const tt = (key: Parameters<typeof lastTripT>[1], vars?: Record<string, string | number>) =>
    lastTripT(lang, key, vars);

  const [picked, setPicked] = useState<string | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [judgeError, setJudgeError] = useState<string | null>(null);

  const localFound = useSyncExternalStore(
    subscribeLastTripProgress,
    getLastTripFoundSnapshot,
    getLastTripFoundServerSnapshot,
  );
  const unlocked = Array.from(new Set([...(room?.unlockedEvidence ?? []), ...localFound]));
  const unlockedEvidence = lastTripEvidence.filter((e) => unlocked.includes(e.id));

  const accusedSuspect =
    lastTripSuspects.find((s) => s.id === acc.selectedSuspect) ?? null;

  // النهاية مشتركة: أول ما تنفتح لأي لاعب، الكل ينتقل بدون refresh.
  useEffect(() => {
    if (acc.stage === "ending") void navigate({ to: "/last-trip/ending" });
  }, [acc.stage, navigate]);

  // بعد «إعادة الاتهام» نرجع الاختيار فاضي للجميع.
  useEffect(() => {
    if (acc.stage === "select") {
      setPicked(null);
      setReasons([]);
    }
  }, [acc.stage]);

  const submit = async () => {
    if (!picked || busy) return;
    const playerId = actions.getSession()?.playerId ?? null;
    if (!room || room.caseId !== "last-trip" || !playerId) {
      setJudgeError(tt("accusationRoomError"));
      return;
    }
    setBusy(true);
    setJudgeError(null);
    try {
      const verdict = await judge({
        data: { suspectId: picked, code: room.code, playerId },
      });
      confirm(picked, verdict.correct, reasons);
    } catch {
      setJudgeError(tt("accusationJudgeError"));
    } finally {
      setBusy(false);
    }
  };


  return (
    <div dir={dir} className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <Panel className="cine-in flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <Eyebrow>{tt("finalStage")}</Eyebrow>
            <h1 className="mt-1.5 text-xl font-bold sm:text-2xl">
              {tt("accusationTitle", { title: pick(lastTripCase.title, lastTripCase.titleEn) })}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {!allDone
                ? tt("accusationDescLocked")
                : acc.stage === "result"
                  ? tt("accusationDescResult")
                  : tt("accusationDescReady")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CaseTag tone="danger">
              {tt("interrogationsCount", { count, total })}
            </CaseTag>
            <Link to="/last-trip/suspects">
              <ActionButton variant="outline">
                <ArrowRight className="size-4" /> {tt("characters")}
              </ActionButton>
            </Link>
          </div>
        </Panel>

        {!allDone ? (
          <Panel className="cine-in flex items-center gap-3 text-sm text-muted-foreground">
            <Lock className="size-4 shrink-0" /> {tt("accusationLocked", { n: total - count })}
          </Panel>
        ) : acc.stage === "result" ? (
          <ResultPanel
            correct={acc.result === "correct"}
            lang={lang}
            name={accusedSuspect ? pick(accusedSuspect.name, accusedSuspect.nameEn) : ""}
            attempts={acc.attempts.length}
            onRetry={retry}
            onEnding={() => {
              openEnding();
              void navigate({ to: "/last-trip/ending" });
            }}
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lastTripSuspects.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={busy}
                  onClick={() => setPicked(s.id)}
                  className={cn(
                    "cine-in overflow-hidden rounded-lg border bg-surface-2 text-start transition-colors",
                    picked === s.id
                      ? "border-primary ring-1 ring-primary/40"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <div className="relative">
                    <img
                      src={s.portrait}
                      alt={tt("photoOf", { name: pick(s.name, s.nameEn) })}
                      width={912}
                      height={1104}
                      loading="lazy"
                      className="aspect-[4/5] w-full object-cover object-top grayscale-[30%]"
                    />
                    <div
                      className="absolute inset-0"
                      style={{ background: "var(--gradient-portrait)" }}
                      aria-hidden="true"
                    />
                    <div className="absolute inset-x-4 bottom-3">
                      <h2 className="text-xl font-bold">{pick(s.name, s.nameEn)}</h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {pick(s.relation, s.relationEn)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {unlockedEvidence.length > 0 && (
              <Panel className="cine-in">
                <Eyebrow>{tt("accusationReasonsEyebrow")}</Eyebrow>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {tt("accusationReasonsDesc")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {unlockedEvidence.map((e) => {
                    const on = reasons.includes(e.id);
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() =>
                          setReasons((r) =>
                            r.includes(e.id) ? r.filter((x) => x !== e.id) : [...r, e.id],
                          )
                        }
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs transition-colors",
                          on
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50",
                        )}
                      >
                        {on && <Check className="me-1 inline size-3" />}
                        {pick(e.title, e.titleEn)}
                      </button>
                    );
                  })}
                </div>
              </Panel>
            )}

            <Panel className="cine-in flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {picked
                  ? tt("youPicked", {
                      name: (() => {
                        const s = lastTripSuspects.find((x) => x.id === picked);
                        return s ? pick(s.name, s.nameEn) : "";
                      })(),
                    })
                  : tt("pickSuspect")}
              </p>
              <ActionButton variant="danger" disabled={!picked || busy} onClick={() => void submit()}>
                <Gavel className="size-4" /> {busy ? tt("recording") : tt("confirmAccusation")}
              </ActionButton>
            </Panel>

            {judgeError && (
              <Panel className="border-destructive/50 text-sm text-destructive">{judgeError}</Panel>
            )}

          </>
        )}
      </div>
    </div>
  );
}

function ResultPanel({
  correct,
  lang,
  name,
  attempts,
  onRetry,
  onEnding,
}: {
  correct: boolean;
  lang: "ar" | "en";
  name: string;
  attempts: number;
  onRetry: () => void;
  onEnding: () => void;
}) {
  const tt = (key: Parameters<typeof lastTripT>[1], vars?: Record<string, string | number>) =>
    lastTripT(lang, key, vars);
  return (
    <Panel
      className={cn(
        "cine-in space-y-4",
        correct ? "border-primary/50" : "border-destructive/50",
      )}
    >
      <div className="flex items-center gap-2">
        {correct ? (
          <Check className="size-5 text-primary" />
        ) : (
          <X className="size-5 text-destructive" />
        )}
        <h2 className="text-2xl font-extrabold">
          {correct ? tt("correctAccusation") : tt("wrongAccusation")}
        </h2>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {correct
          ? tt("correctAccusationDesc", { name })
          : tt("wrongAccusationDesc", { name })}
      </p>
      {attempts > 1 && (
        <p className="text-xs text-muted-foreground">{tt("attemptsCount", { n: attempts })}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {correct ? (
          <ActionButton variant="danger" onClick={onEnding}>
            <ScrollText className="size-4" /> {tt("revealSolution")}
          </ActionButton>
        ) : (
          <>
            <ActionButton onClick={onRetry}>
              <RotateCcw className="size-4" /> {tt("retryAccusation")}
            </ActionButton>
            <ActionButton variant="outline" onClick={onEnding}>
              <ScrollText className="size-4" /> {tt("watchEnding")}
            </ActionButton>
          </>
        )}
      </div>
    </Panel>
  );
}
