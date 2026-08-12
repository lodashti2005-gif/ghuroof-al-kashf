import {
  Camera,
  Coffee,
  KeyRound,
  Link2,
  Lightbulb,
  MessageSquare,
  Smartphone,
  Watch,
  X,
} from "lucide-react";
import { useState } from "react";

import { ActionButton } from "@/components/game/shell";
import { SceneCrop } from "@/components/game/scene-crop";
import { CaseTag, Eyebrow } from "@/components/game/ui";
import { evidence as allEvidence, findEvidenceLink, suspects } from "@/game/case-data";
import type { Deduction, EvidenceItem } from "@/game/types";

const ICONS = {
  watch: Watch,
  phone: Smartphone,
  cup: Coffee,
  message: MessageSquare,
  camera: Camera,
  key: KeyRound,
} as const;

/**
 * Police-style evidence board. Only discovered items exist here: no locked
 * placeholders, no totals, nothing that hints at what is still out there.
 */
export function EvidenceBoard({
  unlockedIds,
  onConfront,
  compact = false,
  deductions = [],
  onDeduction,
  onUseDeduction,
}: {
  unlockedIds: string[];
  onConfront: (evidenceId: string, suspectId: string) => void;
  compact?: boolean;
  deductions?: Deduction[];
  /** ينفّذ لمن ينجح ربط دليلين — يحفظ الاستنتاج بلوحة الأدلة. */
  onDeduction?: (link: { id: string; title: string; insight: string; pair: string[] }) => void;
  /** يستخدم استنتاج محفوظ بمواجهة مشتبه. */
  onUseDeduction?: (text: string, suspectId: string) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [linkResult, setLinkResult] = useState<
    { ok: true; title: string; insight: string } | { ok: false } | null
  >(null);
  const items = allEvidence.filter((e) => unlockedIds.includes(e.id));
  const open = items.find((e) => e.id === openId) ?? null;

  const resetLinking = () => {
    setLinking(false);
    setPicked([]);
    setLinkResult(null);
  };

  const tryLink = (ids: string[]) => {
    const link = findEvidenceLink(ids[0]!, ids[1]!);
    if (!link) {
      setLinkResult({ ok: false });
      return;
    }
    setLinkResult({ ok: true, title: link.title, insight: link.insight });
    onDeduction?.({ id: link.id, title: link.title, insight: link.insight, pair: [...link.pair] });
  };

  const togglePick = (id: string) => {
    setLinkResult(null);
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      const next = [...prev, id].slice(-2);
      if (next.length === 2) setTimeout(() => tryLink(next), 0);
      return next;
    });
  };

  if (items.length === 0) {
    return (
      <div className="surface-panel cine-in px-5 py-10 text-center">
        <p className="text-sm leading-relaxed text-muted-foreground">
          اللوحة فاضية. دقّقوا بمسرح الجريمة واسألوا المشتبه فيهم — كل شي تكتشفونه ينعلّق هني.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <ActionButton
          variant={linking ? "primary" : "outline"}
          className="py-2.5"
          onClick={() => (linking ? resetLinking() : setLinking(true))}
          disabled={items.length < 2 && !linking}
        >
          <Link2 className="size-4" /> {linking ? "إلغاء الربط" : "ربط الأدلة"}
        </ActionButton>
        {linking && (
          <p className="text-xs text-muted-foreground">
            اختر دليلين مكتشفين وشوف إذا في رابط بينهم.
          </p>
        )}
      </div>

      {linking && linkResult && (
        <div
          className={`cine-in mb-4 rounded-xl border p-4 ${
            linkResult.ok
              ? "border-evidence/40 bg-evidence/8"
              : "border-border bg-surface-2"
          }`}
        >
          {linkResult.ok ? (
            <>
              <Eyebrow>استنتاج جديد</Eyebrow>
              <h4 className="mt-1.5 flex items-center gap-2 text-base font-bold">
                <Lightbulb className="size-4 shrink-0 text-evidence" /> {linkResult.title}
              </h4>
              <p className="mt-1.5 text-sm leading-relaxed">{linkResult.insight}</p>
              <p className="mt-2 text-xs text-muted-foreground">انحفظ باللوحة تحت «الاستنتاجات».</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">ما في رابط واضح بين هالدليلين.</p>
          )}
        </div>
      )}

      <div
        className={`grid gap-4 sm:grid-cols-2 ${compact ? "lg:grid-cols-3" : "xl:grid-cols-3"}`}
      >
        {items.map((item) => (
          <BoardPin
            key={item.id}
            item={item}
            selected={picked.includes(item.id)}
            onOpen={() => (linking ? togglePick(item.id) : setOpenId(item.id))}
          />
        ))}
      </div>

      {deductions.length > 0 && (
        <div className="mt-6 space-y-3">
          <Eyebrow>الاستنتاجات</Eyebrow>
          {deductions.map((d) => (
            <DeductionCard key={d.id} deduction={d} onUse={onUseDeduction} />
          ))}
        </div>
      )}
      {open && (
        <EvidenceDetail
          item={open}
          onClose={() => setOpenId(null)}
          onConfront={(suspectId) => {
            setOpenId(null);
            onConfront(open.id, suspectId);
          }}
        />
      )}
    </>
  );
}

function DeductionCard({
  deduction,
  onUse,
}: {
  deduction: Deduction;
  onUse?: ((text: string, suspectId: string) => void) | undefined;
}) {
  const [picking, setPicking] = useState(false);
  return (
    <div className="cine-in surface-panel border-evidence/35 p-4">
      <h4 className="flex items-center gap-2 text-base font-bold">
        <Lightbulb className="size-4 shrink-0 text-evidence" /> {deduction.title}
      </h4>
      <p className="mt-1.5 text-sm leading-relaxed">{deduction.insight}</p>
      {onUse &&
        (!picking ? (
          <ActionButton variant="outline" className="mt-3 w-full py-2.5" onClick={() => setPicking(true)}>
            استخدم في الاستجواب
          </ActionButton>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {suspects.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setPicking(false);
                  onUse(deduction.insight, s.id);
                }}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-2.5 text-right transition-colors hover:border-primary/55"
              >
                <img
                  src={s.portrait}
                  alt={s.name}
                  loading="lazy"
                  className="size-10 shrink-0 rounded-lg border border-border object-cover object-top grayscale-[35%]"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{s.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{s.role}</span>
                </span>
              </button>
            ))}
          </div>
        ))}
    </div>
  );
}

function BoardPin({
  item,
  onOpen,
  selected = false,
}: {
  item: EvidenceItem;
  onOpen: () => void;
  selected?: boolean;
}) {
  const Icon = ICONS[item.icon];
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`افتح ${item.title}`}
      className={`group cine-in surface-panel relative flex w-full flex-col gap-3 p-3 text-right transition-all duration-300 hover:-translate-y-0.5 hover:border-evidence/55 ${
        selected ? "border-primary/70 ring-1 ring-primary/40" : ""
      }`}
    >
      {/* Evidence tape + pin details */}
      <span className="pointer-events-none absolute -top-2 right-6 z-10 h-5 w-16 rotate-[-6deg] rounded-[2px] bg-evidence/25 ring-1 ring-evidence/35" />
      <span className="pointer-events-none absolute -top-1.5 left-5 z-10 size-2.5 rounded-full bg-primary/80 shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_22%,transparent)]" />
      <span className="relative block h-36 w-full overflow-hidden rounded-lg border border-evidence/25">
        <SceneCrop
          crop={item.crop}
          alt={item.title}
          className="absolute inset-0 size-full transition-transform duration-700 group-hover:scale-[1.05]"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-card/85 via-transparent to-transparent" />
        <span className="absolute bottom-2 left-2 rounded-md border border-evidence/40 bg-card/85 px-2 py-1 font-mono text-[0.65rem] text-evidence">
          {item.number}
        </span>
      </span>
      <span className="flex items-center gap-2">
        <Icon className="size-4 shrink-0 text-evidence" strokeWidth={1.7} />
        <span className="truncate text-base font-bold">{item.title}</span>
      </span>
    </button>
  );
}

function EvidenceDetail({
  item,
  onClose,
  onConfront,
}: {
  item: EvidenceItem;
  onClose: () => void;
  onConfront: (suspectId: string) => void;
}) {
  const [picking, setPicking] = useState(false);
  const Icon = ICONS[item.icon];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-background/92 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cine-in surface-panel mx-auto w-full max-w-3xl overflow-hidden p-0"
      >
        <SceneCrop
          crop={item.crop}
          alt={item.title}
          detail
          className="aspect-[4/3] max-h-[62vh] w-full"
        />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="font-mono text-xs text-muted-foreground">{item.number}</span>
              <h3 className="mt-1 flex items-center gap-2 text-xl font-bold">
                <Icon className="size-5 shrink-0 text-evidence" strokeWidth={1.7} /> {item.title}
              </h3>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <CaseTag tone="evidence">مكتشف</CaseTag>
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق"
                className="rounded-lg border border-border bg-secondary p-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-evidence/25 bg-evidence/8 p-4">
            <Eyebrow>ملاحظة المحقق</Eyebrow>
            <p className="mt-1.5 text-sm leading-relaxed">{item.observation}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              الملاحظة وصفية فقط — لمن يخص هذا الدليل يتحدد من ردود المشتبه فيهم.
            </p>
          </div>

          {!picking ? (
            <ActionButton className="mt-5 w-full" onClick={() => setPicking(true)}>
              استخدم في الاستجواب
            </ActionButton>
          ) : (
            <div className="mt-5">
              <Eyebrow>واجه مين بهذا الدليل؟</Eyebrow>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {suspects.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onConfront(s.id)}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-2.5 text-right transition-colors hover:border-primary/55"
                  >
                    <img
                      src={s.portrait}
                      alt={s.name}
                      loading="lazy"
                      className="size-11 shrink-0 rounded-lg border border-border object-cover object-top grayscale-[35%]"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{s.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{s.role}</span>
                    </span>
                  </button>
                ))}
              </div>
              <ActionButton
                variant="outline"
                className="mt-3 w-full"
                onClick={() => setPicking(false)}
              >
                رجوع
              </ActionButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
