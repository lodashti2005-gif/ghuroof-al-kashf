import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Gavel, NotebookPen, Search, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { EvidenceBoard } from "@/components/game/evidence-board";
import { ActionButton, GameShell, LeaveRoomButton } from "@/components/game/shell";
import {
  CaseTag,
  Eyebrow,
  Panel,
  ProgressRing,
  SuspectCard,
} from "@/components/game/ui";
import {
  ContradictionsPanel,
  ForensicsPanel,
  RecordsPanel,
  RoleBanner,
  RoleLockedNote,
  SurveillancePanel,
  TeamIntelPanel,
  TimelinePanel,
} from "@/components/game/role-panels";
import { INTERROGATION_SECONDS, caseFile, evidence, suspects } from "@/game/case-data";
import { TurnBanner, WaitYourTurnNote } from "@/components/game/turn-banner";
import { AbilityPanel, RoundActionsPanel } from "@/components/game/ability-panel";
import { accessFor } from "@/game/role-access";
import { roleById } from "@/game/roles";
import { useRoom } from "@/game/use-room";
import { useTurn } from "@/game/use-turn";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة التحقيق — ورا السالفة" },
      {
        name: "description",
        content:
          "لوحة القضية: الضحية، المشتبهين، الأدلة المكتشفة، الملاحظات المشتركة وتقدم التحقيق.",
      },
      { property: "og:title", content: "لوحة التحقيق" },
      { property: "og:description", content: "تابع الأدلة والملاحظات وتقدم فريقك بالقضية." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { room, me, isHost, actions } = useRoom();
  const navigate = useNavigate();

  const { canAct } = useTurn();
  const myRoleId = me ? room?.roles?.[me.id] : undefined;
  const roleAccess = accessFor(myRoleId);
  // أدوات الدور تنفتح فقط لصاحب الدور الحالي بالتناوب — المشاهدة تبقى للجميع.
  const access = { ...roleAccess, interrogate: roleAccess.interrogate && canAct };
  const myRole = roleById(myRoleId);
  const share = (text: string) => {
    if (!me) return;
    actions.addNote({ author: me.name, text, tag: myRole?.title ?? "الفريق" });
  };

  const unlocked = room?.unlockedEvidence ?? [];
  const interrogated = suspects.filter((s) => room?.suspects[s.id]?.finished).length;
  const progress = Math.min(
    100,
    Math.round(
      ((unlocked.length / evidence.length) * 0.7 + (interrogated / suspects.length) * 0.3) * 100,
    ),
  );
  const allInterrogated = interrogated === suspects.length;
  const accusationOpen = room?.phase === "voting" || room?.phase === "reveal";

  // كل اللاعبين ينتقلون لحظياً لمن قائد الغرفة يبدأ الاتهام.
  useEffect(() => {
    if (accusationOpen) void navigate({ to: "/accusation" });
  }, [accusationOpen, navigate]);

  return (
    <GameShell title="لوحة التحقيق" right={<LeaveRoomButton />}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <RoleBanner roleId={myRoleId} />
          <TurnBanner />
          <AbilityPanel />
          <Panel className="cine-in grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="flex min-w-0 items-center gap-4">
              <img
                src={caseFile.victim.portrait}
                alt={`صورة الضحية ${caseFile.victim.name}`}
                loading="lazy"
                width={912}
                height={1104}
                className="size-20 shrink-0 rounded-xl border border-border object-cover object-top grayscale-[45%]"
              />
              <div className="min-w-0">
                <Eyebrow>الضحية</Eyebrow>
                <h2 className="mt-1 truncate text-xl font-bold">{caseFile.victim.name}</h2>
                <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                  {caseFile.victim.timeOfDeath} · {caseFile.victim.location}
                </p>
              </div>
            </div>
            <ProgressRing
              value={progress}
              label={`الأدلة المكتشفة: ${unlocked.length} · ${interrogated} استجوابات مغلقة`}
            />
          </Panel>

          <Panel className="cine-in flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <Eyebrow>معاينة الموقع</Eyebrow>
              <h2 className="mt-1 text-lg font-bold">مسرح الجريمة</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                افحصوا الشاليه بأنفسكم ودققوا بالتفاصيل — الأدلة اللي تكتشفونها تنفتح باللوحة.
              </p>
            </div>
            <ActionButton onClick={() => navigate({ to: "/scene" })}>
              <Search className="size-4" /> ادخل مسرح الجريمة
            </ActionButton>
          </Panel>

          {access.interrogate ? (
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <Eyebrow>الاستجواب</Eyebrow>
                <h2 className="mt-1 text-xl font-bold">اختر مشتبه وابدأ</h2>
              </div>
              <CaseTag>5 دقائق لكل واحد</CaseTag>
            </div>
            <div className="grid items-stretch gap-4 md:grid-cols-2">
              {suspects.map((s) => (
                <SuspectCard
                  key={s.id}
                  suspect={s}
                  stress={room?.suspects[s.id]?.stress ?? 0}
                  finished={room?.suspects[s.id]?.finished ?? false}
                  timeLeft={room?.suspects[s.id]?.timeLeft ?? INTERROGATION_SECONDS}
                  href={{ to: "/interrogation/$suspectId", params: { suspectId: s.id } }}
                />

              ))}
            </div>
          </section>
          ) : roleAccess.interrogate ? (
            <WaitYourTurnNote />
          ) : (
            <RoleLockedNote text="استجواب المشتبه فيهم مسؤولية «محقق الاستجواب» بالفريق." />
          )}

          {access.evidenceBoard && (
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <Eyebrow>لوحة الأدلة</Eyebrow>
                <h2 className="mt-1 text-xl font-bold">الأدلة</h2>
              </div>
              <CaseTag tone="evidence">الأدلة المكتشفة: {unlocked.length}</CaseTag>
            </div>
            <EvidenceBoard
              unlockedIds={unlocked}
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
              canLink={access.linkEvidence && canAct}
              canConfront={access.interrogate}
              forensics={access.forensics}
              onConfront={(evidenceId, suspectId) =>
                navigate({
                  to: "/interrogation/$suspectId",
                  params: { suspectId },
                  search: { confront: evidenceId },
                })
              }
            />
          </section>
          )}

          {access.forensics &&
            (canAct ? <ForensicsPanel unlockedIds={unlocked} onShare={share} /> : <WaitYourTurnNote />)}
          {access.surveillance &&
            (canAct ? <SurveillancePanel unlockedIds={unlocked} onShare={share} /> : <WaitYourTurnNote />)}
          {access.timeline &&
            (canAct ? <TimelinePanel unlockedIds={unlocked} onShare={share} /> : <WaitYourTurnNote />)}
          {access.records &&
            (canAct ? <RecordsPanel room={room} onShare={share} /> : <WaitYourTurnNote />)}
          {access.contradictions && !access.records && <ContradictionsPanel room={room} />}

        </div>

        <aside className="min-w-0 space-y-5">
          <Panel className="cine-in">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                <h2 className="font-display text-sm font-bold">بالغرفة الآن</h2>
              </div>
              <CaseTag>{room?.players.length ?? 0}</CaseTag>
            </div>
            <ul className="mt-3 space-y-2">
              {room?.players.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-2.5 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm"
                >
                  <span className="size-1.5 shrink-0 rounded-full bg-evidence" />
                  <span className="truncate">{p.name}</span>
                  {p.isHost && (
                    <span className="ms-auto shrink-0 font-mono text-[0.65rem] text-primary">
                      HOST
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Panel>

          <RoundActionsPanel />

          <TeamIntelPanel notes={room?.notes ?? []} />

          <NotesPanel />

          <Panel className="cine-in">
            <Eyebrow>المرحلة الأخيرة</Eyebrow>
            <h2 className="mt-1.5 text-base font-bold">الاتهام النهائي</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {accusationOpen
                ? "التصويت مفتوح — كل واحد يصوت من جهازه بشكل سري."
                : allInterrogated
                  ? isHost
                    ? "خلصتوا التحقيق مع كل المشتبهين. أنت قائد الغرفة، تقدر تبدأ الاتهام."
                    : "خلصتوا التحقيق. انتظروا قائد الغرفة يبدأ الاتهام النهائي."
                  : `باقي ${suspects.length - interrogated} استجواب قبل ما تفتح مرحلة الاتهام.`}
            </p>
            {accusationOpen ? (
              <ActionButton className="mt-4 w-full" onClick={() => navigate({ to: "/accusation" })}>
                <Gavel className="size-4" /> روح للتصويت
              </ActionButton>
            ) : (
              <ActionButton
                variant={isHost ? "primary" : "outline"}
                className="mt-4 w-full"
                disabled={!isHost || !allInterrogated}
                onClick={() => {
                  actions.startAccusation();
                  navigate({ to: "/accusation" });
                }}
              >
                <Gavel className="size-4" />{" "}
                {isHost ? "الانتقال إلى الاتهام النهائي" : "بانتظار قائد الغرفة"}
              </ActionButton>
            )}
          </Panel>
        </aside>
      </div>

    </GameShell>
  );
}

function NotesPanel() {
  const { room, me, actions } = useRoom();
  const [text, setText] = useState("");

  const save = () => {
    const value = text.trim();
    if (!value || !me) return;
    actions.addNote({ author: me.name, text: value });
    setText("");
  };

  return (
    <Panel className="cine-in">
      <div className="flex items-center gap-2">
        <NotebookPen className="size-4 text-muted-foreground" />
        <h2 className="font-display text-sm font-bold">دفتر المحققين</h2>
      </div>
      <form
        className="mt-3"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="اكتب ملاحظة عن مشتبه أو دليل..."
          className="w-full resize-none rounded-xl border border-input bg-surface-2 px-3.5 py-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary/60"
        />
        <ActionButton
          type="submit"
          variant="outline"
          className="mt-2 w-full py-2.5"
          disabled={!text.trim()}
        >
          احفظ الملاحظة
        </ActionButton>
      </form>

      <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto pe-1">
        {(room?.notes ?? []).length === 0 && (
          <li className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
            ما في ملاحظات بعد
          </li>
        )}
        {room?.notes.map((n) => (
          <li key={n.id} className="rounded-lg border border-border bg-surface-2 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-mono text-[0.65rem] text-muted-foreground">
                {n.author}
              </span>
              <button
                type="button"
                onClick={() => actions.removeNote(n.id)}
                aria-label="حذف الملاحظة"
                className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{n.text}</p>
          </li>
        ))}
      </ul>

      <Link
        to="/accusation"
        className="mt-4 block text-center font-display text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        جاهزين للاتهام؟
      </Link>
    </Panel>
  );
}
