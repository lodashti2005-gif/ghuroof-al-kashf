/**
 * قدرة الدور — أداة واحدة خاصة لكل دور، تُستخدم مرة بكل جولة ووقت دور اللاعب
 * فقط. كل استخدام ينحفظ بالحالة المشتركة (معرّف ثابت) فما يتكرر مع الـ refresh،
 * وكل الفريق يشوف منو استخدم شنو.
 */
import { useNavigate } from "@tanstack/react-router";
import { Hourglass, Link2, MessageSquare, ScanSearch, Sparkles, Clock } from "lucide-react";
import { useState } from "react";

import { ActionButton } from "@/components/game/shell";
import { CaseTag, Eyebrow, Panel } from "@/components/game/ui";
import { evidence as allEvidence, findEvidenceLink, suspects } from "@/game/case-data";
import { abilityForRole, abilityKey, deepForensics, findAbility } from "@/game/abilities";
import { timelineRows } from "@/game/role-intel";
import { roleById } from "@/game/roles";
import { useRoom } from "@/game/use-room";
import { useTurn } from "@/game/use-turn";

const chip =
  "rounded-lg border border-border bg-surface-2 px-3 py-2 text-start text-xs leading-relaxed transition-colors hover:border-primary/50";
const chipOn = "border-primary/70 ring-1 ring-primary/40";

export function AbilityPanel() {
  const { room, me, actions } = useRoom();
  const navigate = useNavigate();
  const { turn, canAct, discussion } = useTurn();

  const roleId = me ? room?.roles?.[me.id] : undefined;
  const role = roleById(roleId);
  const ability = abilityForRole(roleId);
  const round = turn?.round ?? 1;

  const [picked, setPicked] = useState<string[]>([]);
  const used = findAbility(room?.abilities, round, me?.id, ability?.kind);

  if (!ability || !me || !room) return null;

  const unlocked = allEvidence.filter((e) => room.unlockedEvidence.includes(e.id));
  const Icon =
    ability.kind === "forensic"
      ? ScanSearch
      : ability.kind === "question"
        ? MessageSquare
        : ability.kind === "link"
          ? Link2
          : Clock;

  const save = (summary: string, result: string) => {
    actions.recordAbility({
      id: abilityKey(round, me.id, ability.kind),
      round,
      playerId: me.id,
      playerName: me.name,
      roleTitle: role?.title ?? "لاعب",
      kind: ability.kind,
      label: ability.label,
      summary,
      result,
    });
  };

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <Eyebrow>قدرة دورك</Eyebrow>
        <h2 className="mt-1 flex items-center gap-2 text-lg font-bold">
          <Icon className="size-4 text-evidence" /> {ability.label}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{ability.hint}</p>
      </div>
      <CaseTag tone={used ? "muted" : "evidence"}>
        {used ? "استُخدمت هالجولة" : `متاحة · الجولة ${round}`}
      </CaseTag>
    </div>
  );

  // مقفلة: وقت النقاش أو مو دورك.
  if (discussion || !canAct) {
    return (
      <Panel className="cine-in border-dashed">
        {header}
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Hourglass className="size-3.5" />
          {discussion ? "وقت النقاش — قدرات الأدوار مقفلة." : "انتظر دورك لتستخدم قدرتك."}
        </p>
      </Panel>
    );
  }

  if (used) {
    return (
      <Panel className="cine-in">
        {header}
        <div className="mt-3 rounded-xl border border-evidence/40 bg-evidence/8 p-3">
          <p className="text-sm font-bold">{used.summary}</p>
          {used.result && <p className="mt-1.5 text-sm leading-relaxed">{used.result}</p>}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          القدرة تنستخدم مرة واحدة بكل جولة — ترجع تتفتح بالجولة الجاية.
        </p>
      </Panel>
    );
  }

  return (
    <Panel className="cine-in border-primary/30">
      {header}

      {ability.kind === "forensic" &&
        (unlocked.length === 0 ? (
          <Empty />
        ) : (
          <div className="mt-4 space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {unlocked.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setPicked([e.id])}
                  className={`${chip} ${picked[0] === e.id ? chipOn : ""}`}
                >
                  {e.title}
                </button>
              ))}
            </div>
            <ActionButton
              className="w-full py-2.5"
              disabled={!picked[0]}
              onClick={() => {
                const item = unlocked.find((e) => e.id === picked[0]);
                if (!item) return;
                save(
                  `فحص جنائي إضافي · ${item.title}`,
                  deepForensics[item.id] ?? item.observation,
                );
                setPicked([]);
              }}
            >
              <ScanSearch className="size-4" /> افحص الدليل
            </ActionButton>
          </div>
        ))}

      {ability.kind === "question" && (
        <div className="mt-4 space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {suspects.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setPicked([s.id])}
                className={`${chip} ${picked[0] === s.id ? chipOn : ""}`}
              >
                {s.name} — {s.role}
              </button>
            ))}
          </div>
          <ActionButton
            className="w-full py-2.5"
            disabled={!picked[0]}
            onClick={() => {
              const s = suspects.find((x) => x.id === picked[0]);
              if (!s) return;
              save(`سؤال إضافي · ${s.name}`, "سؤال واحد إضافي بدون خصم من وقت الاستجواب.");
              void navigate({
                to: "/interrogation/$suspectId",
                params: { suspectId: s.id },
                search: { bonus: "1" },
              });
            }}
          >
            <MessageSquare className="size-4" /> ابدأ السؤال الإضافي
          </ActionButton>
        </div>
      )}

      {ability.kind === "link" &&
        (unlocked.length < 2 ? (
          <Empty text="تحتاجون دليلين مكتشفين على الأقل." />
        ) : (
          <div className="mt-4 space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {unlocked.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() =>
                    setPicked((prev) =>
                      prev.includes(e.id)
                        ? prev.filter((x) => x !== e.id)
                        : [...prev, e.id].slice(-2),
                    )
                  }
                  className={`${chip} ${picked.includes(e.id) ? chipOn : ""}`}
                >
                  {e.title}
                </button>
              ))}
            </div>
            <ActionButton
              className="w-full py-2.5"
              disabled={picked.length < 2}
              onClick={() => {
                const [a, b] = picked;
                if (!a || !b) return;
                const names = unlocked
                  .filter((e) => picked.includes(e.id))
                  .map((e) => e.title)
                  .join(" + ");
                const link = findEvidenceLink(a, b);
                if (link) {
                  actions.addDeduction({
                    linkId: link.id,
                    title: link.title,
                    insight: link.insight,
                    evidenceIds: [...link.pair],
                    author: me.name,
                  });
                  save(`ربط الأدلة · ${names}`, `يوجد رابط محتمل — ${link.insight}`);
                } else {
                  save(`ربط الأدلة · ${names}`, "ما في رابط واضح بينهم حالياً.");
                }
                setPicked([]);
              }}
            >
              <Sparkles className="size-4" /> حلّل الرابط
            </ActionButton>
          </div>
        ))}

      {ability.kind === "timeline" && <TimelineAbility onConfirm={save} />}
    </Panel>
  );
}

/** التسلسل الزمني الخاص: معلومات مكتشفة فقط، مرتبة، مع تأشير حدث واحد. */
function TimelineAbility({
  onConfirm,
}: {
  onConfirm: (summary: string, result: string) => void;
}) {
  const { room } = useRoom();
  const [marked, setMarked] = useState<number | null>(null);
  const unlocked = room?.unlockedEvidence ?? [];
  const rows = timelineRows.filter((r) => !r.requires || unlocked.includes(r.requires));

  return (
    <div className="mt-4 space-y-3">
      <p className="text-xs text-muted-foreground">
        هذا العرض خاص لك — يحتوي المعلومات المكتشفة فقط. أشّر على حدث واحد مشبوه وشاركه الفريق.
      </p>
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => setMarked(i)}
              className={`flex w-full items-start gap-3 rounded-xl border p-3 text-start transition-colors ${
                marked === i ? "border-primary/70 ring-1 ring-primary/40" : "border-border"
              } bg-surface-2`}
            >
              <span dir="ltr" className="shrink-0 font-mono text-xs text-primary">
                {r.time}
              </span>
              <span className="min-w-0 flex-1 text-sm leading-relaxed">{r.text}</span>
            </button>
          </li>
        ))}
      </ul>
      <ActionButton
        className="w-full py-2.5"
        disabled={marked === null}
        onClick={() => {
          const row = marked === null ? undefined : rows[marked];
          if (!row) return;
          onConfirm("مراجعة التسلسل الزمني", `حدث مشبوه · ${row.time}: ${row.text}`);
          setMarked(null);
        }}
      >
        <Clock className="size-4" /> شارك الحدث المشبوه
      </ActionButton>
    </div>
  );
}

function Empty({ text = "ما في أدلة مكتشفة بعد — فتشوا مسرح الجريمة أول." }: { text?: string }) {
  return (
    <p className="mt-4 rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
      {text}
    </p>
  );
}

/** حركات الجولة — يشوفها كل الفريق (منو استخدم قدرته وشنو صار). */
export function RoundActionsPanel() {
  const { room } = useRoom();
  const round = room?.turn?.round ?? 1;
  const items = (room?.abilities ?? []).filter((a) => a.round === round);

  return (
    <Panel className="cine-in">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-muted-foreground" />
          <h2 className="font-display text-sm font-bold">حركات الجولة {round}</h2>
        </div>
        <CaseTag>{items.length}</CaseTag>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          ما أحد استخدم قدرته بهذي الجولة.
        </p>
      ) : (
        <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto pe-1">
          {items.map((a) => (
            <li key={a.id} className="rounded-lg border border-border bg-surface-2 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-mono text-[0.62rem] text-muted-foreground">
                  {a.playerName} · {a.roleTitle}
                </span>
                <span className="shrink-0 rounded-md border border-primary/35 bg-primary/10 px-1.5 py-0.5 font-mono text-[0.6rem] text-primary">
                  {a.label}
                </span>
              </div>
              <p className="mt-1 text-sm font-bold leading-relaxed">{a.summary}</p>
              {a.result && (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a.result}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
