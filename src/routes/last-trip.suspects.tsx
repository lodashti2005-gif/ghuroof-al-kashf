import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Gavel, MessageSquare, Search, ShieldAlert } from "lucide-react";

import { ActionButton } from "@/components/game/shell";
import { LastTripRoleGate } from "@/components/game/last-trip-role-gate";
import { LastTripTrialGate, LastTripTrialBadge } from "@/components/game/last-trip-trial-gate";
import { useLastTripRole } from "@/game/cases/last-trip-role-state";
import { useLastTripInterrogations } from "@/game/cases/last-trip-interrogation-progress";
import { CaseTag, Eyebrow, Panel } from "@/components/game/ui";
import { lastTripCase } from "@/game/cases/last-trip";
import {
  LAST_TRIP_SUSPECT_TOTAL,
  lastTripSuspects,
  lastTripVictim,
} from "@/game/cases/last-trip-suspects";
import { useI18n } from "@/i18n";
import { lastTripT } from "@/game/cases/last-trip-strings";

export const Route = createFileRoute("/last-trip/suspects")({
  head: () => ({
    meta: [
      { title: "الشخصيات — آخر رحلة" },
      {
        name: "description",
        content:
          "ملفات شخصيات قضية «آخر رحلة»: الضحية راشد وخمسة مشتبه فيهم — جاسم، سالم، عبدالله، مشعل، ناصر.",
      },
      { property: "og:title", content: "الشخصيات — آخر رحلة" },
      {
        property: "og:description",
        content: "خمس ملفات مشتبه فيهم وملف الضحية بقضية «آخر رحلة».",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LastTripSuspectsScreen,
});

function LastTripSuspectsScreen() {
  return (
    <LastTripTrialGate>
      <LastTripRoleGate>
      <LastTripSuspectsRoute />
      </LastTripRoleGate>
    </LastTripTrialGate>
  );
}

function LastTripSuspectsRoute() {
  const { role } = useLastTripRole();
  const { allDone, count, total, isDone } = useLastTripInterrogations();
  const { lang, dir, pick } = useI18n();
  const tt = (key: Parameters<typeof lastTripT>[1], vars?: Record<string, string | number>) =>
    lastTripT(lang, key, vars);
  const BackArrow = dir === "rtl" ? ArrowRight : ArrowLeft;

  return (
    <div dir={dir} className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <Panel className="cine-in flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <Eyebrow>{tt("suspectFilesEyebrow")}</Eyebrow>
            <h1 className="mt-1.5 text-xl font-bold sm:text-2xl">
              {tt("suspectsTitle", { title: pick(lastTripCase.title, lastTripCase.titleEn) })}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {tt("suspectsDesc")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LastTripTrialBadge />
            <CaseTag>{lastTripCase.code}</CaseTag>
            {role && <CaseTag>{tt("yourRole", { role: pick(role.title, role.titleEn) })}</CaseTag>}
            <CaseTag tone="danger">{tt("suspectTotal", { n: LAST_TRIP_SUSPECT_TOTAL })}</CaseTag>
            <CaseTag>{tt("interrogationsCount", { count, total })}</CaseTag>
            {allDone && (
              <Link to="/last-trip/accusation">
                <ActionButton variant="danger">
                  <Gavel className="size-4" /> {tt("accusation")}
                </ActionButton>
              </Link>
            )}
            <Link to="/last-trip/scene">
              <ActionButton variant="outline">
                <Search className="size-4" /> {tt("crimeScene")}
              </ActionButton>
            </Link>
            <Link to="/cases">
              <ActionButton variant="outline">
                <BackArrow className="size-4" /> {tt("caseStore")}
              </ActionButton>
            </Link>
          </div>
        </Panel>

        {/* الضحية — للعرض فقط، غير قابل للاستجواب */}
        <Panel className="cine-in">
          <div className="flex flex-col gap-5 sm:flex-row">
            <div className="relative w-full overflow-hidden rounded-lg sm:w-56">
              <img
                src={lastTripVictim.portrait}
                alt={tt("photoOf", { name: pick(lastTripVictim.name, lastTripVictim.nameEn) })}
                width={912}
                height={1104}
                loading="lazy"
                className="aspect-[4/5] w-full object-cover object-top grayscale-[45%]"
              />
              <div
                className="absolute inset-0"
                style={{ background: "var(--gradient-portrait)" }}
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0 flex-1">
              <Eyebrow>{tt("victim")}</Eyebrow>
              <h2 className="mt-1 text-2xl font-bold">
                {pick(lastTripVictim.name, lastTripVictim.nameEn)}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {tt("yearsOld", { n: lastTripVictim.age })} · {pick(lastTripVictim.personality, lastTripVictim.personalityEn)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {pick(lastTripVictim.summary, lastTripVictim.summaryEn)}
              </p>
              <ul className="mt-4 space-y-2">
                {pick(lastTripVictim.known, lastTripVictim.knownEn).map((k) => (
                  <li key={k} className="flex gap-2 text-sm leading-relaxed">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-evidence" />
                    <span>{k}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-2.5 py-1.5 font-mono text-[0.7rem] text-muted-foreground">
                <ShieldAlert className="size-3.5" /> {tt("notInterrogatable")}
              </p>
            </div>
          </div>
        </Panel>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lastTripSuspects.map((s) => {
            const name = pick(s.name, s.nameEn);
            return (
            <Panel key={s.id} className="cine-in flex flex-col gap-4 p-0">
              <div className="relative overflow-hidden rounded-t-lg">
                <img
                  src={s.portrait}
                  alt={tt("photoOf", { name })}
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
                  <h3 className="text-xl font-bold">{name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {pick(s.relation, s.relationEn)} · {tt("yearsOld", { n: s.age })}
                  </p>
                </div>
              </div>
              <div className="space-y-3 px-5 pb-5">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {pick(s.personality, s.personalityEn)}
                </p>
                <p className="rounded-md border border-border bg-secondary px-2.5 py-2 text-xs leading-relaxed text-muted-foreground">
                  {tt("whereWere", { where: pick(s.whereabouts, s.whereaboutsEn) })}
                </p>
                <ul className="space-y-2">
                  {pick(s.known, s.knownEn).map((k) => (
                    <li key={k} className="flex gap-2 text-sm leading-relaxed">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/70" />
                      <span>{k}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/last-trip/interrogation/$suspectId"
                  params={{ suspectId: s.id }}
                  className="block"
                >
                  <ActionButton
                    variant={isDone(s.id) ? "outline" : "primary"}
                    className="w-full justify-center"
                  >
                    <MessageSquare className="size-4" />{" "}
                    {isDone(s.id) ? tt("interrogateDone", { name }) : tt("interrogate", { name })}
                  </ActionButton>
                </Link>
              </div>
            </Panel>
            );
          })}
        </div>
      </div>
    </div>
  );
}
