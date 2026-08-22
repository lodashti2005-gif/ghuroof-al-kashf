/**
 * دفتر القضية — مرجع مشترك لكل اللاعبين، يتبني تلقائياً من المعلومات اللي
 * الفريق اكتشفها فعلاً فقط: الأدلة المكتشفة، أقوال المشتبه فيهم من جلسات
 * الاستجواب، التناقضات المرصودة، التسلسل الزمني المكتشف، وملاحظات الفريق.
 * ما يعرض أي دليل غير مكتشف ولا أي معلومة مخفية من القصة.
 */
import { useState } from "react";
import { AlertTriangle, Clock, FileText, MessageSquare, NotebookPen, Trash2 } from "lucide-react";

import { ActionButton } from "@/components/game/shell";
import { CaseTag, Eyebrow, EvidenceCard, Panel } from "@/components/game/ui";
import { evidence, suspects } from "@/game/case-data";
import { timelineRows } from "@/game/role-intel";
import { useRoom } from "@/game/use-room";

type TabId = "evidence" | "statements" | "contradictions" | "timeline" | "notes";

const TABS: { id: TabId; title: string; icon: typeof FileText }[] = [
  { id: "evidence", title: "الأدلة المكتشفة", icon: FileText },
  { id: "statements", title: "أقوال المشتبه فيهم", icon: MessageSquare },
  { id: "contradictions", title: "التناقضات", icon: AlertTriangle },
  { id: "timeline", title: "التسلسل الزمني", icon: Clock },
  { id: "notes", title: "ملاحظات الفريق", icon: NotebookPen },
];

const time = (ms: number) =>
  new Date(ms).toLocaleTimeString("ar-KW", { hour: "2-digit", minute: "2-digit" });

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm leading-relaxed text-muted-foreground">
      {text}
    </p>
  );
}

export function CaseNotebook() {
  const { room, me, actions } = useRoom();
  const [tab, setTab] = useState<TabId>("evidence");
  const [text, setText] = useState("");

  const unlocked = room?.unlockedEvidence ?? [];
  const unlockedItems = evidence.filter((e) => unlocked.includes(e.id));
  const contradictions = room?.contradictions ?? [];
  const notes = room?.notes ?? [];

  // أقوال المشتبه فيهم: فقط اللي قالوه فعلاً بجلسات الاستجواب المشتركة.
  const statementGroups = suspects
    .map((s) => ({
      id: s.id,
      name: s.name,
      role: s.role,
      lines: (room?.suspects[s.id]?.transcript ?? []).filter(
        (m) => m.role === "suspect" && m.text.trim().length > 0,
      ),
    }))
    .filter((g) => g.lines.length > 0);

  const interrogated = new Set(statementGroups.map((g) => g.id));
  // التسلسل الزمني: صفوف الأدلة تنفتح بعد اكتشافها، وأقوال المشتبه فيهم بعد
  // ما ينستجوبون فعلاً — بدون أي حدث ما اكتشفه الفريق.
  const timeline = timelineRows.filter((r) => {
    if (r.requires) return unlocked.includes(r.requires);
    if (r.kind !== "claim") return true;
    const owner = suspects.find((s) => r.text.includes(s.name.split(" ")[0] ?? s.name));
    return owner ? interrogated.has(owner.id) : false;
  });

  const counts: Record<TabId, number> = {
    evidence: unlockedItems.length,
    statements: statementGroups.reduce((n, g) => n + g.lines.length, 0),
    contradictions: contradictions.length,
    timeline: timeline.length,
    notes: notes.length,
  };

  const save = () => {
    const value = text.trim();
    if (!value || !me) return;
    actions.addNote({ author: me.name, text: value });
    setText("");
  };

  return (
    <Panel className="cine-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow>مرجع مشترك</Eyebrow>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-bold">
            <NotebookPen className="size-4 text-muted-foreground" /> دفتر القضية
          </h2>
        </div>
        <CaseTag>يتحدّث لحظياً لكل الفريق</CaseTag>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 font-display text-xs transition-colors ${
                on
                  ? "border-primary/50 bg-primary/12 text-primary"
                  : "border-border bg-surface-2 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" /> {t.title}
              <span className="font-mono text-[0.65rem] opacity-80">{counts[t.id]}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {tab === "evidence" &&
          (unlockedItems.length === 0 ? (
            <Empty text="ما في أدلة مكتشفة بعد — ادخلوا مسرح الجريمة ودققوا بالتفاصيل." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {unlockedItems.map((item) => (
                <EvidenceCard key={item.id} item={item} unlocked />
              ))}
            </div>
          ))}

        {tab === "statements" &&
          (statementGroups.length === 0 ? (
            <Empty text="ما في أقوال محفوظة بعد — أي كلام يقوله المشتبه بالاستجواب ينحفظ هنا." />
          ) : (
            <div className="space-y-4">
              {statementGroups.map((g) => (
                <div key={g.id} className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold">{g.name}</h3>
                    <span className="font-mono text-[0.7rem] text-muted-foreground">{g.role}</span>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {g.lines.map((m) => (
                      <li
                        key={m.id}
                        className="rounded-lg border border-border bg-background/40 px-3 py-2 text-sm leading-relaxed"
                      >
                        «{m.text}»
                        <span
                          dir="ltr"
                          className="mt-1 block font-mono text-[0.65rem] text-muted-foreground"
                        >
                          {time(m.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}

        {tab === "contradictions" &&
          (contradictions.length === 0 ? (
            <Empty text="ما ينرصد تناقض إلا لمن يجمع الفريق معلومات كافية تكشفه — ما في شي بعد." />
          ) : (
            <ul className="space-y-3">
              {contradictions.map((c) => (
                <li
                  key={c.id}
                  className="rounded-xl border border-evidence/35 bg-evidence/5 px-4 py-3 text-sm leading-relaxed"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-bold text-evidence">
                      <AlertTriangle className="size-3.5" /> {c.suspectName}
                    </span>
                    <span dir="ltr" className="font-mono text-[0.7rem] text-muted-foreground">
                      {time(c.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-muted-foreground">
                    <span className="text-foreground">قوله:</span> «{c.claim}»
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    <span className="text-foreground">
                      {c.source === "evidence"
                        ? "يتعارض مع دليل:"
                        : c.source === "timeline"
                          ? "يتعارض مع وقائع القضية:"
                          : "يتعارض مع قوله السابق:"}
                    </span>{" "}
                    {c.conflictsWith}
                  </p>
                  <p className="mt-1.5 font-mono text-[0.7rem] text-muted-foreground/80">
                    رصده {c.author}
                    {c.confronted ? " · تمت المواجهة" : ""}
                  </p>
                </li>
              ))}
            </ul>
          ))}

        {tab === "timeline" &&
          (timeline.length === 0 ? (
            <Empty text="التسلسل الزمني يتبني من الأدلة والأقوال المكتشفة — ابدأوا التحقيق أول." />
          ) : (
            <ul className="space-y-2">
              {timeline.map((r, i) => (
                <li
                  key={`${r.time}-${i}`}
                  className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm leading-relaxed ${
                    r.conflict ? "border-evidence/35 bg-evidence/5" : "border-border bg-surface-2"
                  }`}
                >
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">{r.time}</span>
                  <span className="min-w-0">
                    {r.text}
                    <span className="ms-2 font-mono text-[0.65rem] text-muted-foreground">
                      {r.kind === "claim" ? "قول مشتبه" : "تسجيل"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ))}

        {tab === "notes" && (
          <div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder="اكتب ملاحظة قصيرة يشوفها كل الفريق..."
                className="w-full resize-none rounded-xl border border-input bg-surface-2 px-3.5 py-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary/60"
              />
              <ActionButton
                type="submit"
                variant="outline"
                className="mt-2 w-full py-2.5"
                disabled={!text.trim()}
              >
                أضف الملاحظة
              </ActionButton>
            </form>

            <ul className="mt-4 space-y-2">
              {notes.length === 0 && <Empty text="ما في ملاحظات بعد." />}
              {notes.map((n) => (
                <li key={n.id} className="rounded-lg border border-border bg-surface-2 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-[0.65rem] text-muted-foreground">
                      {n.author}
                      {n.tag ? ` · ${n.tag}` : ""}
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
          </div>
        )}
      </div>
    </Panel>
  );
}
