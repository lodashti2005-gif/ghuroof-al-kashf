/**
 * شاشة «دورك في القضية» لقضية «آخر رحلة» فقط.
 *
 * تظهر بعد توزيع الأدوار وتبقى ثابتة حتى يضغط اللاعب «فهمت دوري — متابعة».
 * ما تعرض أدوار باقي اللاعبين أبداً.
 */
import { ArrowLeft, EyeOff, Loader2, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ActionButton } from "@/components/game/shell";
import { CaseTag, Eyebrow, Panel } from "@/components/game/ui";
import { useLastTripRole } from "@/game/cases/last-trip-role-state";

export function LastTripRoleGate({ children }: { children: React.ReactNode }) {
  const { inRoom, role, acknowledged, acknowledge, roleId } = useLastTripRole();
  const [slow, setSlow] = useState(false);

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
    <div dir="rtl" className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <Panel className="cine-in w-full max-w-lg text-center">
        <Eyebrow>دورك في القضية</Eyebrow>
        {role ? (
          <>
            <h1 className="mt-4 text-3xl font-extrabold">{role.title}</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              {role.mission}
            </p>
            <div className="mt-5 rounded-xl border border-border bg-secondary/40 p-4 text-right">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <CaseTag>قدرتك الخاصة</CaseTag>
              </div>
              <p className="mt-2 text-sm leading-relaxed">{role.ability}</p>
            </div>
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs text-muted-foreground">
              <EyeOff className="size-3.5" /> هذا الدور خاص بجهازك — ما أحد بالفريق يشوفه
            </p>
            <ActionButton className="mt-6 w-full justify-center py-3.5 text-base" onClick={acknowledge}>
              فهمت دوري — متابعة <ArrowLeft className="size-4" />
            </ActionButton>
          </>
        ) : (
          slow ? (
          <>
            <h1 className="mt-4 text-2xl font-bold">ما وصلك دور بعد</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              توزيع الأدوار ما اكتمل، أو الأدوار الستة كلها محجوزة. ارجع لصفحة القضية
              وتأكد من عدد اللاعبين، وبعدها جرب مرة ثانية.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link to="/last-trip/suspects">
                <ActionButton>رجوع للشخصيات</ActionButton>
              </Link>
              <Link to="/last-trip/lobby">
                <ActionButton variant="outline">غرفة الانتظار</ActionButton>
              </Link>
            </div>
          </>
          ) : (
          <p className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> جاري توزيع الأدوار…
            {roleId ? "" : ""}
          </p>
          )
        )}
      </Panel>
    </div>
  );
}
