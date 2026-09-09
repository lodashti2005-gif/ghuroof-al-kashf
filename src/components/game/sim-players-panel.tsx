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
import { useI18n } from "@/i18n";
import { useRoom } from "@/game/use-room";
import { cn } from "@/lib/utils";

export function SimPlayersPanel() {
  const { pick } = useI18n();
  const { sim: state, room } = useRoom();

  return (
    <Panel className="cine-in">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users2 className="size-4 text-primary" />
          <Eyebrow>{pick("محاكاة لاعبين (اختبار)", "Player simulation (test)")}</Eyebrow>
        </div>
        {state.active ? (
          <CaseTag tone="evidence">{pick("شغّال", "Running")}</CaseTag>
        ) : (
          <CaseTag tone="muted">{pick("متوقف", "Stopped")}</CaseTag>
        )}
      </div>

      {!state.active ? (
        <>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {pick(
              "شغّل لاعبَين إضافيين بنفس الجهاز بدون حساب ولا دفع، وبدّل الهوية بينهم لتجربة المواجهة التجريبية بأدوار مختلفة. محلي بالكامل — ما يظهر لأي لاعب ثاني.",
              "Run two extra players on this same device with no account and no payment, and switch identities between them to test the confrontation with different roles. Fully local — no other player sees it.",
            )}
          </p>
          <ActionButton className="mt-4 w-full justify-center" onClick={() => sim.enableSim(2)}>
            <UserPlus className="size-4" /> {pick("شغّل لاعبَين وهميين", "Run two simulated players")}
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
              {pick("هويتي الحقيقية", "My real identity")}{" "}
              {room?.code ? pick(`· غرفة ${room.code}`, `· Room ${room.code}`) : ""}
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
                    {state.asId === p.id && <span className="ms-2 text-primary">{pick("(الهوية الحالية)", "(current identity)")}</span>}
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
                  aria-label={pick(`حذف ${p.name}`, `Remove ${p.name}`)}
                  className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-primary"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton variant="outline" className="px-4 py-2 text-xs" onClick={() => sim.addSimPlayer()}>
              <UserPlus className="size-3.5" /> {pick("أضف لاعب وهمي", "Add a simulated player")}
            </ActionButton>
            <ActionButton variant="ghost" className="px-4 py-2 text-xs" onClick={() => sim.disableSim()}>
              {pick("أوقف المحاكاة", "Stop the simulation")}
            </ActionButton>
          </div>

          <p className="mt-3 text-[0.7rem] leading-relaxed text-muted-foreground">
            {pick(
              "المواجهة التجريبية تبقى معزولة: ما تنعكس على أي لاعب حقيقي ولا تستهلك مواجهة القضية.",
              "The test confrontation stays isolated: it doesn't affect any real player and doesn't use up the case confrontation.",
            )}
          </p>
        </>
      )}
    </Panel>
  );
}
