import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Gavel, NotebookPen, Trash2, Users } from "lucide-react";
import { useState } from "react";

import { ActionButton, GameShell, LeaveRoomButton } from "@/components/game/shell";
import {
  CaseTag,
  EvidenceCard,
  Eyebrow,
  Panel,
  ProgressRing,
  SuspectCard,
} from "@/components/game/ui";
import { caseFile, evidence, suspects } from "@/game/case-data";
import { useRoom } from "@/game/use-room";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة التحقيق — غرفة التحقيق" },
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
  const [openEvidence, setOpenEvidence] = useState<string | null>(null);

  const unlocked = room?.unlockedEvidence ?? [];
  const interrogated = suspects.filter((s) => room?.suspects[s.id]?.finished).length;
  const progress = Math.min(
    100,
    Math.round(
      ((unlocked.length / evidence.length) * 0.7 + (interrogated / suspects.length) * 0.3) * 100,
    ),
  );
  const detail = evidence.find((e) => e.id === openEvidence);

  return (
    <GameShell title="لوحة التحقيق" right={<LeaveRoomButton />}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
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
              label={`${unlocked.length} من ${evidence.length} أدلة · ${interrogated} استجوابات مغلقة`}
            />
          </Panel>

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <Eyebrow>الاستجواب</Eyebrow>
                <h2 className="mt-1 text-xl font-bold">اختر مشتبه وابدأ</h2>
              </div>
              <CaseTag>5 دقائق لكل واحد</CaseTag>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {suspects.map((s) => (
                <SuspectCard
                  key={s.id}
                  suspect={s}
                  stress={room?.suspects[s.id]?.stress ?? 0}
                  finished={room?.suspects[s.id]?.finished ?? false}
                  href={{ to: "/interrogation/$suspectId", params: { suspectId: s.id } }}
                />
              ))}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <Eyebrow>لوحة الأدلة</Eyebrow>
                <h2 className="mt-1 text-xl font-bold">الأدلة</h2>
              </div>
              <CaseTag tone="evidence">
                {unlocked.length} / {evidence.length}
              </CaseTag>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {evidence.map((item) => (
                <EvidenceCard
                  key={item.id}
                  item={item}
                  unlocked={unlocked.includes(item.id)}
                  onSelect={() => unlocked.includes(item.id) && setOpenEvidence(item.id)}
                />
              ))}
            </div>
          </section>
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

          <NotesPanel />

          <Panel className="cine-in">
            <Eyebrow>المرحلة الأخيرة</Eyebrow>
            <h2 className="mt-1.5 text-base font-bold">الاتهام النهائي</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              لمن تخلصون التحقيق، صوتوا كلكم على اللي تشكون فيه، وبعدها تنكشف الحقيقة.
            </p>
            <ActionButton
              variant={isHost ? "primary" : "outline"}
              className="mt-4 w-full"
              onClick={() => {
                if (isHost) actions.setPhase("voting");
                navigate({ to: "/accusation" });
              }}
            >
              <Gavel className="size-4" /> {isHost ? "افتح التصويت" : "روح للتصويت"}
            </ActionButton>
          </Panel>
        </aside>
      </div>

      {detail && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-background/85 p-4 backdrop-blur-sm"
          onClick={() => setOpenEvidence(null)}
        >
          <div
            className="surface-panel cine-in w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-xs text-muted-foreground">{detail.number}</span>
              <CaseTag tone="evidence">مكتشف</CaseTag>
            </div>
            <h3 className="mt-2 text-2xl font-bold">{detail.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {detail.description}
            </p>
            <div className="mt-4 rounded-xl border border-evidence/25 bg-evidence/8 p-4">
              <Eyebrow>تحليل المختبر</Eyebrow>
              <p className="mt-1.5 text-sm leading-relaxed">{detail.detail}</p>
            </div>
            <ActionButton
              variant="outline"
              className="mt-5 w-full"
              onClick={() => setOpenEvidence(null)}
            >
              إغلاق
            </ActionButton>
          </div>
        </div>
      )}
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
