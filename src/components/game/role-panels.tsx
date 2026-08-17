/**
 * أدوات الأدوار — كل لوحة تظهر لدورها فقط، ومعها زر «شارك مع الفريق» اللي
 * يحوّل المعلومة لملاحظة مشتركة تظهر عند الجميع بقسم «معلومات الفريق».
 */
import { AlertTriangle, Camera, Clock, FileText, FlaskConical, Share2 } from "lucide-react";
import { useState } from "react";

import { ActionButton } from "@/components/game/shell";
import { CaseTag, Eyebrow, Panel } from "@/components/game/ui";
import { evidence as allEvidence, suspects } from "@/game/case-data";
import { cameraLog, forensicNotes, statementLog, timelineRows } from "@/game/role-intel";
import { roleById } from "@/game/roles";
import type { Note, RoomState } from "@/game/types";

function ShareButton({ onShare }: { onShare: () => void }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        onShare();
        setDone(true);
        window.setTimeout(() => setDone(false), 1600);
      }}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-evidence/45 bg-evidence/10 px-2.5 py-1.5 text-[0.7rem] font-bold text-evidence transition-colors hover:bg-evidence/20"
    >
      <Share2 className="size-3.5" /> {done ? "تمت المشاركة" : "شارك مع الفريق"}
    </button>
  );
}

/** بطاقة الدور: الاسم + وصف قصير للمهمة. */
export function RoleBanner({ roleId }: { roleId?: string | null }) {
  const role = roleById(roleId);
  if (!role) return null;
  return (
    <Panel className="cine-in border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow>دورك بالتحقيق</Eyebrow>
          <h2 className="mt-1 text-lg font-bold">
            {role.emoji} {role.title}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{role.mission}</p>
        </div>
        <CaseTag>أدواتك فقط</CaseTag>
      </div>
    </Panel>
  );
}

/** الخبير الجنائي: فحص تفصيلي للأدلة المكتشفة + ملاحظات جنائية خاصة. */
export function ForensicsPanel({
  unlockedIds,
  onShare,
}: {
  unlockedIds: string[];
  onShare: (text: string) => void;
}) {
  const items = allEvidence.filter((e) => unlockedIds.includes(e.id));
  return (
    <Panel className="cine-in">
      <div className="flex items-center gap-2">
        <FlaskConical className="size-4 text-evidence" />
        <h2 className="font-display text-base font-bold">الفحص الجنائي</h2>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        ملاحظات المعمل — تظهر لك فقط، وتقدر تشاركها مع الفريق.
      </p>
      {items.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          ما في أدلة مكتشفة للفحص بعد.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((e) => (
            <li key={e.id} className="rounded-xl border border-border bg-surface-2 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[0.65rem] text-muted-foreground">{e.number}</p>
                  <p className="mt-0.5 truncate text-sm font-bold">{e.title}</p>
                </div>
                <ShareButton onShare={() => onShare(`فحص جنائي · ${e.title}: ${forensicNotes[e.id] ?? e.observation}`)} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {forensicNotes[e.id] ?? e.observation}
              </p>
              <p className="mt-1.5 font-mono text-[0.65rem] text-muted-foreground/80">
                موقع الالتقاط: {e.foundAt}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/** مسؤول المراقبة: سجل الكاميرات والتحركات والأوقات. */
export function SurveillancePanel({
  unlockedIds,
  onShare,
}: {
  unlockedIds: string[];
  onShare: (text: string) => void;
}) {
  const rows = cameraLog.filter((r) => !r.requires || unlockedIds.includes(r.requires));
  return (
    <Panel className="cine-in">
      <div className="flex items-center gap-2">
        <Camera className="size-4 text-evidence" />
        <h2 className="font-display text-base font-bold">سجل المراقبة</h2>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        لقطات المدخل والتحركات — بعض اللقطات تنفتح بعد اكتشاف الكاميرا بمسرح الجريمة.
      </p>
      <ul className="mt-4 space-y-2">
        {rows.map((r, i) => (
          <li key={i} className="flex items-start gap-3 rounded-xl border border-border bg-surface-2 p-3">
            <span dir="ltr" className="shrink-0 font-mono text-xs text-primary">
              {r.time}
            </span>
            <span className="min-w-0 flex-1 text-sm leading-relaxed">{r.text}</span>
            <ShareButton onShare={() => onShare(`مراقبة · ${r.time}: ${r.text}`)} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** محلل الجدول الزمني: أقوال + تسجيلات + تعارضات زمنية. */
export function TimelinePanel({
  unlockedIds,
  onShare,
}: {
  unlockedIds: string[];
  onShare: (text: string) => void;
}) {
  const rows = timelineRows.filter((r) => !r.requires || unlockedIds.includes(r.requires));
  return (
    <Panel className="cine-in">
      <div className="flex items-center gap-2">
        <Clock className="size-4 text-evidence" />
        <h2 className="font-display text-base font-bold">الجدول الزمني</h2>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        رتّب الأوقات ولاحظ التعارض بين الأقوال والتسجيلات.
      </p>
      <ul className="mt-4 space-y-2">
        {rows.map((r, i) => (
          <li
            key={i}
            className={`flex items-start gap-3 rounded-xl border p-3 ${
              r.conflict ? "border-evidence/45 bg-evidence/8" : "border-border bg-surface-2"
            }`}
          >
            <span dir="ltr" className="shrink-0 font-mono text-xs text-primary">
              {r.time}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm leading-relaxed">{r.text}</span>
              <span className="mt-1 block font-mono text-[0.62rem] text-muted-foreground">
                {r.kind === "claim" ? "قول مشتبه" : "تسجيل / أثر مادي"}
                {r.conflict ? " · تعارض زمني" : ""}
              </span>
            </span>
            <ShareButton
              onShare={() =>
                onShare(`جدول زمني · ${r.time}: ${r.text}${r.conflict ? " (تعارض زمني)" : ""}`)
              }
            />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** مسؤول الملف: الأقوال + التناقضات + ملخص القضية قبل التصويت. */
export function RecordsPanel({
  room,
  onShare,
}: {
  room: RoomState | null;
  onShare: (text: string) => void;
}) {
  const contradictions = room?.contradictions ?? [];
  const shared = (room?.notes ?? []).filter((n) => n.tag);

  const summary = [
    `الأدلة المكتشفة: ${room?.unlockedEvidence.length ?? 0}`,
    `التناقضات المرصودة: ${contradictions.length}`,
    `الاستنتاجات: ${room?.deductions.length ?? 0}`,
    `معلومات مشتركة من الفريق: ${shared.length}`,
    ...contradictions.slice(0, 3).map((c) => `تناقض · ${c.suspectName}: ${c.claim}`),
  ].join(" | ");

  return (
    <Panel className="cine-in">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-evidence" />
          <h2 className="font-display text-base font-bold">ملف القضية</h2>
        </div>
        <ShareButton onShare={() => onShare(`ملخص القضية · ${summary}`)} />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        سجل الأقوال والتناقضات والملخص النهائي قبل التصويت.
      </p>

      <Eyebrow className="mt-4 block">أقوال المشتبه فيهم</Eyebrow>
      <ul className="mt-2 space-y-2">
        {statementLog.map((s) => (
          <li key={s.id} className="rounded-xl border border-border bg-surface-2 p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="truncate text-sm font-bold">{s.name}</p>
              <ShareButton onShare={() => onShare(`أقوال ${s.name}: ${s.statements.join(" · ")}`)} />
            </div>
            <ul className="mt-1.5 space-y-1">
              {s.statements.map((st, i) => (
                <li key={i} className="text-xs leading-relaxed text-muted-foreground">
                  — {st}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <Eyebrow className="mt-5 block">التناقضات المسجلة</Eyebrow>
      {contradictions.length === 0 ? (
        <p className="mt-2 rounded-lg border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">
          ما في تناقضات مسجلة بعد.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {contradictions.map((c) => (
            <li key={c.id} className="rounded-xl border border-evidence/40 bg-evidence/8 p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-bold">{c.suspectName}</p>
                <ShareButton
                  onShare={() => onShare(`تناقض · ${c.suspectName}: ${c.claim} ↔ ${c.conflictsWith}`)}
                />
              </div>
              <p className="mt-1 text-xs leading-relaxed">{c.claim}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                يتعارض مع: {c.conflictsWith}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/** التناقضات المشتركة — للمحقق ومسؤول الملف. */
export function ContradictionsPanel({ room }: { room: RoomState | null }) {
  const contradictions = room?.contradictions ?? [];
  return (
    <Panel className="cine-in">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 text-evidence" />
        <h2 className="font-display text-base font-bold">التناقضات</h2>
      </div>
      {contradictions.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          ما في تناقضات مرصودة بعد.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {contradictions.map((c) => (
            <li key={c.id} className="rounded-xl border border-evidence/40 bg-evidence/8 p-3">
              <p className="text-sm font-bold">
                {c.suspectName} {c.confronted ? "· تمت المواجهة" : ""}
              </p>
              <p className="mt-1 text-xs leading-relaxed">{c.claim}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                يتعارض مع: {c.conflictsWith}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/** معلومات الفريق: كل ما شاركه اللاعبون من أدواتهم الخاصة. */
export function TeamIntelPanel({ notes }: { notes: Note[] }) {
  const shared = notes.filter((n) => n.tag);
  return (
    <Panel className="cine-in">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Share2 className="size-4 text-muted-foreground" />
          <h2 className="font-display text-sm font-bold">معلومات الفريق</h2>
        </div>
        <CaseTag>{shared.length}</CaseTag>
      </div>
      {shared.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          ما شارك أحد معلومة بعد.
        </p>
      ) : (
        <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto pe-1">
          {shared.map((n) => (
            <li key={n.id} className="rounded-lg border border-border bg-surface-2 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-mono text-[0.62rem] text-muted-foreground">
                  {n.author}
                </span>
                <span className="shrink-0 rounded-md border border-primary/35 bg-primary/10 px-1.5 py-0.5 font-mono text-[0.6rem] text-primary">
                  {n.tag}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed">{n.text}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/** رسالة بديلة لمن يكون الأداة مو من صلاحيات دور اللاعب. */
export function RoleLockedNote({ text }: { text: string }) {
  return (
    <Panel className="cine-in border-dashed">
      <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
      <p className="mt-1.5 text-xs text-muted-foreground/80">
        هذي الأداة تخص دور ثاني بالفريق — تابع «معلومات الفريق» لمن يشاركونك النتيجة.
      </p>
    </Panel>
  );
}

export const roleSuspectsHint = suspects.length;
