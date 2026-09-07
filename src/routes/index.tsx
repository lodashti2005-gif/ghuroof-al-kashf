import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, ArrowRight, ShieldAlert } from "lucide-react";

import heroScene from "@/assets/scene-hero.jpg";
import { AccountMenu } from "@/components/site/account-menu";
import { ResumeCaseButton } from "@/components/game/resume-case-button";
import { Eyebrow } from "@/components/game/ui";
import { GAME_NAME, GAME_NAME_EN, playableCases } from "@/game/game-meta";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ورا السالفة | لعبة تحقيق وقضايا" },
      {
        name: "description",
        content:
          "ورا السالفة — لعبة تحقيق جماعية تعيشون فيها القضية، تجمعون الأدلة، تستجوبون المشتبه فيهم، وتحاولون تكشفون الحقيقة.",
      },
      { property: "og:title", content: "ورا السالفة | لعبة تحقيق وقضايا" },
      {
        property: "og:description",
        content:
          "ورا السالفة — لعبة تحقيق جماعية تعيشون فيها القضية، تجمعون الأدلة، تستجوبون المشتبه فيهم، وتحاولون تكشفون الحقيقة.",
      },

      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Welcome,
});

/** خطوات دليل اللاعب تُقرأ من قاموس الترجمة (steps.1 … steps.10). */
const STEP_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] as const;

function Welcome() {
  const { t, tList, pick, dir } = useI18n();
  const Forward = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <div className="relative min-h-screen bg-background">
      <div className="relative overflow-hidden">
        <img
          src={heroScene}
          alt={t("site.heroAlt")}
          width={1920}
          height={1088}
          className="absolute inset-0 size-full object-cover opacity-50"
        />
        <div
          className="absolute inset-0"
          style={{ background: "var(--gradient-noir)" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 opacity-[0.16]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent 0 3px, oklch(0 0 0 / 0.55) 3px 4px)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-lg file-tape">
                <ShieldAlert className="size-4.5" />
              </span>
              <span className="font-display text-sm font-bold">
                {pick(GAME_NAME, GAME_NAME_EN)}
              </span>
            </div>
            <AccountMenu />
          </div>

          <div className="cine-in mt-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1.5">
              <span className="size-1.5 rounded-full bg-primary blink-record" />
              <span className="font-display text-xs tracking-wide text-primary">
                {t("site.tagline")}
              </span>
            </div>
            <h1 className="text-5xl font-extrabold leading-[1.15] sm:text-6xl">
              {pick(GAME_NAME, GAME_NAME_EN)}
            </h1>
            <p className="mt-4 max-w-xl font-display text-lg text-muted-foreground sm:text-2xl">
              {t("site.heroSub")}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 pb-16 sm:px-8">
        <section className="mt-10">
          <Eyebrow>{t("site.playerGuide")}</Eyebrow>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">{t("site.howToPlay")}</h2>

          <ol className="mt-6 space-y-3">
            {STEP_KEYS.map((n) => (
              <li key={n} className="surface-panel flex gap-4 p-5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 font-display text-sm font-bold text-primary">
                  {n}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-base font-bold">{t(`steps.${n}.title`)}</h3>
                  {tList(`steps.${n}.body`).map((line) => (
                    <p key={line} className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {line}
                    </p>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-5">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="font-display text-sm font-bold text-primary">{t("site.noticeTitle")}</p>
            <p className="mt-1 text-sm leading-relaxed">{t("site.noticeBody")}</p>
          </div>
        </div>

        <ResumeCaseButton className="mt-8" />

        <Link
          to="/cases"
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-7 py-4 font-display text-lg font-bold text-primary-foreground transition-transform hover:scale-[1.01]"
        >
          {t("site.ctaChooseCase")} <Forward className="size-5" />
        </Link>

        <footer className="mt-10 grid gap-3 border-t border-border/60 pt-6 sm:grid-cols-3">
          {[
            {
              k: t("site.statCases"),
              v: t("site.statCasesValue", { count: playableCases.length }),
            },
            { k: t("site.statPlayers"), v: t("site.statPlayersValue") },
            { k: t("site.statDuration"), v: t("site.statDurationValue") },
          ].map((row) => (
            <div key={row.k} className="min-w-0">
              <Eyebrow>{row.k}</Eyebrow>
              <p className="mt-1 truncate text-sm">{row.v}</p>
            </div>
          ))}
        </footer>
      </div>
    </div>
  );
}
