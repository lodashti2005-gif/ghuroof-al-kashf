/**
 * شاشة «دورك في القضية» لقضية «آخر رحلة» فقط.
 *
 * تظهر بعد توزيع الأدوار وتبقى ثابتة حتى يضغط اللاعب «فهمت دوري — متابعة».
 * ما تعرض أدوار باقي اللاعبين أبداً.
 */
import { ArrowLeft, ArrowRight, EyeOff, Loader2, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ActionButton } from "@/components/game/shell";
import { CaseTag, Eyebrow, Panel } from "@/components/game/ui";
import { useLastTripRole } from "@/game/cases/last-trip-role-state";
import { useI18n } from "@/i18n";
import { lastTripT } from "@/game/cases/last-trip-strings";

export function LastTripRoleGate({ children }: { children: React.ReactNode }) {
  const { inRoom, role, acknowledged, acknowledge, roleId } = useLastTripRole();
  const [slow, setSlow] = useState(false);
  const { lang, dir, pick } = useI18n();
  const tt = (key: Parameters<typeof lastTripT>[1], vars?: Record<string, string | number>) =>
    lastTripT(lang, key, vars);
  const NextArrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  // لو تأخر التوزيع أو ما بقى دور شاغر، ما نخلي اللاعب بشاشة انتظار للأبد.
  useEffect(() => {
    if (!inRoom || role) {
      setSlow(false);
      return;
    }
    const t = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(t);
  }, [inRoom, role]);

  if (!inRoom || acknowledged) return <>{children}</>;

  return (
    <div dir={dir} className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <Panel className="cine-in w-full max-w-lg text-center">
        <Eyebrow>{tt("roleGateEyebrow")}</Eyebrow>
        {role ? (
          <>
            <h1 className="mt-4 text-3xl font-extrabold">{pick(role.title, role.titleEn)}</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              {pick(role.mission, role.missionEn)}
            </p>
            <div className="mt-5 rounded-xl border border-border bg-secondary/40 p-4 text-start">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <CaseTag>{tt("specialAbility")}</CaseTag>
              </div>
              <p className="mt-2 text-sm leading-relaxed">{pick(role.ability, role.abilityEn)}</p>
            </div>
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs text-muted-foreground">
              <EyeOff className="size-3.5" /> {tt("deviceOnlyRole")}
            </p>
            <ActionButton className="mt-6 w-full justify-center py-3.5 text-base" onClick={acknowledge}>
              {tt("understoodContinue")} <NextArrow className="size-4" />
            </ActionButton>
          </>
        ) : (
          slow ? (
          <>
            <h1 className="mt-4 text-2xl font-bold">{tt("noRoleYetTitle")}</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              {tt("noRoleYetDesc")}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link to="/last-trip/suspects">
                <ActionButton>{tt("backToSuspects")}</ActionButton>
              </Link>
              <Link to="/last-trip/lobby">
                <ActionButton variant="outline">{tt("waitingRoom")}</ActionButton>
              </Link>
            </div>
          </>
          ) : (
          <p className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> {tt("assigningRoles")}
            {roleId ? "" : ""}
          </p>
          )
        )}
      </Panel>
    </div>
  );
}
