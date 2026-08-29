/**
 * لوحة «محاكاة لاعبين» — اختبار محلي فقط.
 *
 * تضيف لاعبين وهميين بنفس المتصفح بدون حسابات ولا دفع، وتخليك تتنقل بين
 * هوياتهم لتشغيل المواجهة التجريبية بأدوار مختلفة. ما تلمس حالة الغرفة
 * المشتركة ولا قاعدة البيانات — كل شي محفوظ محلياً بهذا الجهاز.
 */
import { UserPlus, Users2, X } from "lucide-react";

import { ActionButton } from "@/components/game/shell";
import { CaseTag, Eyebrow, Panel } from "@/components/game/ui";
import { lastTripRoles } from "@/game/cases/last-trip-roles";
import * as sim from "@/game/sim-players";
import { useRoom } from "@/game/use-room";
import { cn } from "@/lib/utils";

export function SimPlayersPanel() {
  const { sim: state, room } = useRoom();

  return (
    <Panel className="cine-in">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users2 className="size-4 text-primary" />
          <Eyebrow>محاكاة لاعبين (اختبار)</Eyebrow>
        </div>
        {state.active ? (
          <CaseTag tone="evidence">شغّال</CaseTag>
        ) : (
          <CaseTag tone="muted">متوقف</CaseTag>
        )}
      </div>

      {!state.active ? (
        <>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            شغّل لاعبَين إضافيين بنفس الجهاز بدون حساب ولا دفع، وبدّل الهوية بينهم
            لتجربة المواجهة التجريبية بأدوار مختلفة. محلي بالكامل — ما يظهر لأي
            لاعب ثاني.
          </p>
          <ActionButton className="mt-4 w-full justify-center" onClick={() => sim.enableSim(2)}>
            <UserPlus className="size-4" /> شغّل لاعبَين وهميين
          </ActionButton>
        </>
      ) : (
        <>
          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={() => sim.actAs(null)}
              className={cn(
                "w-full rounded-xl border px-3 py-2.5 text-right text-xs transition-colors",
                state.asId === null
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border bg-secondary/50 text-muted-foreground",
              )}
            >
              هويتي الحقيقية {room?.code ? `· غرفة ${room.code}` : ""}
            </button>

            {state.players.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl border px-3 py-2.5",
                  state.asId === p.id
                    ? "border-primary/60 bg-primary/10"
                    : "border-border bg-secondary/50",
                )}
              >
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => sim.actAs(p.id)}
                    className="block w-full truncate text-right text-xs font-semibold"
                  >
                    {p.name}
                    {state.asId === p.id && <span className="ms-2 text-primary">(الهوية الحالية)</span>}
                  </button>
                  <select
                    value={p.roleId}
                    onChange={(e) => sim.setSimRole(p.id, e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-border bg-background px-2 py-1 text-[0.7rem] text-muted-foreground"
                  >
                    {lastTripRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => sim.removeSimPlayer(p.id)}
                  aria-label={`حذف ${p.name}`}
                  className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-primary"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton variant="outline" className="px-4 py-2 text-xs" onClick={() => sim.addSimPlayer()}>
              <UserPlus className="size-3.5" /> أضف لاعب وهمي
            </ActionButton>
            <ActionButton variant="ghost" className="px-4 py-2 text-xs" onClick={() => sim.disableSim()}>
              أوقف المحاكاة
            </ActionButton>
          </div>

          <p className="mt-3 text-[0.7rem] leading-relaxed text-muted-foreground">
            المواجهة التجريبية تبقى معزولة: ما تنعكس على أي لاعب حقيقي ولا تستهلك
            مواجهة القضية.
          </p>
        </>
      )}
    </Panel>
  );
}
