import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Clock3,
  Gauge,
  Lock,
  Play,
  ShieldAlert,
  ShoppingCart,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AccountMenu } from "@/components/site/account-menu";
import { ResumeCaseButton } from "@/components/game/resume-case-button";
import { Eyebrow } from "@/components/game/ui";
import { GAME_NAME, GAME_NAME_EN, GAME_TAGLINE, GAME_TAGLINE_EN } from "@/game/game-meta";
import { useI18n } from "@/i18n";
import { useCaseStore, type StoreCase } from "@/game/entitlements";
import { formatTrialClock, useDeviceTrial } from "@/game/device-trial";
import { formatCasePrice } from "@/game/pricing";
import { trackEvent } from "@/lib/activity";

export const Route = createFileRoute("/cases")({
  head: () => ({
    meta: [
      { title: "متجر القضايا — ورا السالفة" },
      {
        name: "description",
        content:
          "متجر قضايا ورا السالفة: اختر قضية، شوف صعوبتها وعدد اللاعبين ومدة اللعب، واشترِ القضية مرة واحدة وادعُ أصحابك برمز الغرفة.",
      },
      { property: "og:title", content: "متجر القضايا — ورا السالفة" },
      {
        property: "og:description",
        content: "كل قضية لها سالفة... دوركم تعرفون وراها شنو.",
      },
    ],
  }),
  component: CasesPage,
});

function CasesPage() {
  const { cases, myCases, signedIn, loading } = useCaseStore();
  const { t, pick, dir } = useI18n();
  const Forward = dir === "rtl" ? ArrowLeft : ArrowRight;

  useEffect(() => {
    // تتبّع تسويقي فقط: مشاهدة متجر القضايا.
    void trackEvent("cases_view", { path: "/cases" });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg file-tape">
              <ShieldAlert className="size-4.5" />
            </span>
            <span className="font-display text-sm font-bold">{pick(GAME_NAME, GAME_NAME_EN)}</span>
          </Link>
          <div className="flex items-center gap-3">
            <AccountMenu />
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 font-display text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("store.home")} <Forward className="size-3.5" />
            </Link>
          </div>
        </header>

        <div className="cine-in mt-10">
          <Eyebrow>{t("store.eyebrow")}</Eyebrow>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-5xl">{t("store.title")}</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {pick(GAME_TAGLINE, GAME_TAGLINE_EN)}
          </p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {t("store.note")}
          </p>
        </div>

        <ResumeCaseButton className="mt-6" />

        <section className="mt-8">
          <h2 className="font-display text-sm font-bold text-muted-foreground">
            {t("store.allCases")}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {cases.map((item) => (
              <CaseCard key={item.id} item={item} signedIn={signedIn} />
            ))}
          </div>
        </section>

        <section className="mt-12 pb-6">
          <h2 className="font-display text-sm font-bold text-muted-foreground">
            {t("store.myCases")}
          </h2>
          {loading ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : myCases.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("store.empty")}</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {myCases.map((item) => (
                <div
                  key={item.id}
                  className="surface-panel flex items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-bold">
                      {pick(item.title, item.titleEn)}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1.5 font-mono text-[11px] text-primary">
                      <BadgeCheck className="size-3.5" />{" "}
                      {item.free ? t("store.trialBadge") : t("store.purchased")}
                    </p>
                  </div>
                  <Link
                    to={item.id === "last-trip" ? "/last-trip/lobby" : "/play"}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 font-display text-xs font-bold text-primary-foreground"
                  >
                    <Play className="size-3.5" /> {t("store.startCase")}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function CaseCard({ item, signedIn }: { item: StoreCase; signedIn: boolean }) {
  const { t, lang, pick } = useI18n();
  const price = formatCasePrice(item.id, null, lang);
  const soon = item.status === "soon";

  return (
    <article
      className={`surface-panel flex flex-col overflow-hidden transition-colors ${
        item.owned ? "hover:border-primary/50" : ""
      }`}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <img
          src={item.cover}
          alt={t("store.coverAlt", { title: pick(item.title, item.titleEn) })}
          loading="lazy"
          width={1280}
          height={800}
          className={`size-full object-cover ${item.owned ? "" : "opacity-55 grayscale-[35%]"}`}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, oklch(0 0 0 / 0.85), transparent 65%)" }}
          aria-hidden="true"
        />
        <span
          className={`absolute top-3 start-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-display text-[11px] backdrop-blur ${
            item.owned
              ? "border-primary/40 bg-primary/15 text-primary"
              : "border-border bg-background/70 text-muted-foreground"
          }`}
        >
          {item.owned ? (
            <>
              <BadgeCheck className="size-3.5" />{" "}
              {item.free ? t("store.trialBadge") : t("store.purchased")}
            </>
          ) : (
            <>
              <Lock className="size-3.5" /> {t("store.locked")}
            </>
          )}
        </span>

        {!item.free && !item.owned && !soon && (
          <span className="absolute top-3 end-3 inline-flex items-center rounded-xl bg-primary px-3 py-1.5 font-display text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
            {price}
          </span>
        )}

        <div className="absolute bottom-3 right-4 left-4">
          <span className="font-mono text-[11px] text-muted-foreground">
            {t("store.file", { code: item.code })}
          </span>
          <h3 className="text-xl font-bold sm:text-2xl">{pick(item.title, item.titleEn)}</h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {pick(item.teaser, item.teaserEn)}
        </p>

        <ul className="grid grid-cols-2 gap-2 font-mono text-[11px] text-muted-foreground">
          <li className="inline-flex items-center gap-1.5">
            <Gauge className="size-3.5" /> {pick(item.difficulty, item.difficultyEn)}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" /> {pick(item.players, item.playersEn)}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Clock3 className="size-3.5" /> {pick(item.playTime, item.playTimeEn)}
          </li>
          {item.suspects ? (
            <li className="inline-flex items-center gap-1.5">
              <ShieldAlert className="size-3.5" /> {t("store.suspectsCount", { n: item.suspects })}
            </li>
          ) : null}
        </ul>

        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
          <span className="font-display text-sm font-bold">{price}</span>

          <span className="font-mono text-[11px] text-muted-foreground">
            {soon
              ? t("store.inPrep")
              : item.owned
                ? t("store.tryFirstTen")
                : t("store.needsPurchase")}
          </span>
        </div>

        <div className="mt-auto">
          {item.owned ? (
            <Link
              to={item.id === "last-trip" ? "/last-trip/lobby" : "/play"}
              onClick={() => {
                // تتبّع تسويقي فقط.
                void trackEvent(item.free ? "trial_click" : "case_start", {
                  caseId: item.id,
                  path: "/cases",
                });
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-display text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              <Play className="size-4" />{" "}
              {item.free ? t("store.tryFirstTen") : t("store.startCase")}
            </Link>
          ) : soon ? (
            <button
              type="button"
              disabled
              className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-5 py-3 font-display text-sm font-bold text-muted-foreground"
            >
              <Lock className="size-4" /> {t("store.inPrep")}
            </button>
          ) : (
            <div className="space-y-2">
              <TrialCta item={item} />
              <Link
                to="/purchase/$caseId"
                params={{ caseId: item.id }}
                search={{ room: undefined }}
                onClick={() => {
                  void trackEvent("case_view", { caseId: item.id, path: "/cases" });
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/50 bg-primary/10 px-5 py-3 font-display text-sm font-bold text-primary transition-colors hover:bg-primary/20"
              >
                <ShoppingCart className="size-4" /> {t("store.buyWithPrice", { price })}
              </Link>
            </div>
          )}

          {!item.owned && !soon && !signedIn && (
            <p className="mt-2 text-center font-mono text-[11px] text-muted-foreground">
              {t("store.needAccount")}{" "}
              <Link to="/auth" className="text-primary">
                {t("store.signIn")}
              </Link>
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * زر التجربة المجانية بدون حساب: يبدأ الـ١٠ دقائق عند الضغط فقط، ويكمل من
 * المتبقي لو رجع اللاعب. بعد انتهائها ما يظهر الزر لنفس الجهاز.
 */
function TrialCta({ item }: { item: StoreCase }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { trial, start } = useDeviceTrial(item.id);
  const [busy, setBusy] = useState(false);
  const to = item.id === "last-trip" ? "/last-trip/lobby" : "/play";

  if (trial?.started && trial.expired) {
    return (
      <p className="text-center font-mono text-[11px] text-muted-foreground">
        {t("store.trialEnded")}
      </p>
    );
  }

  if (trial?.started) {
    return (
      <Link
        to={to}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-display text-sm font-bold text-primary-foreground"
      >
        <Play className="size-4" />{" "}
        {t("store.continueTrial", { clock: formatTrialClock(trial.remainingSeconds) })}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        void trackEvent("case_view", { caseId: item.id, path: "/cases" });
        void trackEvent("trial_click", { caseId: item.id, path: "/cases" });
        const next = await start();
        setBusy(false);
        if (next) {
          void trackEvent("trial_start", { caseId: item.id });
          navigate({ to });
        }
      }}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-display text-sm font-bold text-primary-foreground disabled:opacity-60"
    >
      <Play className="size-4" /> {busy ? t("store.moment") : t("store.startTrial")}
    </button>
  );
}
