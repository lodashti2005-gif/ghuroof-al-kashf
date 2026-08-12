import { Camera, Coffee, KeyRound, MessageSquare, Smartphone, Watch, X } from "lucide-react";
import { useState } from "react";

import { ActionButton } from "@/components/game/shell";
import { SceneCrop } from "@/components/game/scene-crop";
import { CaseTag, Eyebrow } from "@/components/game/ui";
import { evidence as allEvidence, suspects } from "@/game/case-data";
import type { EvidenceItem } from "@/game/types";

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
}: {
  unlockedIds: string[];
  onConfront: (evidenceId: string, suspectId: string) => void;
  compact?: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const items = allEvidence.filter((e) => unlockedIds.includes(e.id));
  const open = items.find((e) => e.id === openId) ?? null;

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
      <div
        className={`grid gap-4 sm:grid-cols-2 ${compact ? "lg:grid-cols-3" : "xl:grid-cols-3"}`}
      >
        {items.map((item) => (
          <BoardPin key={item.id} item={item} onOpen={() => setOpenId(item.id)} />
        ))}
      </div>
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

function BoardPin({ item, onOpen }: { item: EvidenceItem; onOpen: () => void }) {
  const Icon = ICONS[item.icon];
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`افتح ${item.title}`}
      className="group cine-in surface-panel relative flex w-full flex-col gap-3 p-3 text-right transition-all duration-300 hover:-translate-y-0.5 hover:border-evidence/55"
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
