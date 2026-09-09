import {
  Camera,
  Coffee,
  Footprints,
  KeyRound,
  Link2,
  Lightbulb,
  MessageSquare,
  Search,
  Smartphone,
  Watch,
  X,
} from "lucide-react";
import { useState } from "react";

import { ActionButton } from "@/components/game/shell";
import { SceneCrop } from "@/components/game/scene-crop";
import { CaseTag, Eyebrow } from "@/components/game/ui";
import { evidence as allEvidence, findEvidenceLink, suspects } from "@/game/case-data";
import { useI18n } from "@/i18n";
import type { Deduction, EvidenceItem } from "@/game/types";

const BOARD_TEXT = {
  empty: {
    ar: "اللوحة فاضية. دقّقوا بمسرح الجريمة واسألوا المشتبه فيهم — كل شي تكتشفونه ينعلّق هني.",
    en: "The board is empty. Search the crime scene and question the suspects — anything you find gets pinned here.",
  },
  linkEvidence: { ar: "ربط دليلين", en: "Link two clues" },
  cancelLink: { ar: "إلغاء الربط", en: "Cancel linking" },
  pickTwoHint: { ar: "اختر دليلين مكتشفين ثم اضغط «تحليل الرابط».", en: "Pick two discovered clues, then tap “Analyze the link”." },
  pickTwoFromBoard: { ar: "اختر دليلين من الأدلة المعلّقة على اللوحة.", en: "Pick two clues pinned on the board." },
  selected: { ar: "محدد", en: "Selected" },
  analyzeLink: { ar: "تحليل الرابط", en: "Analyze the link" },
  newDeduction: { ar: "استنتاج جديد", en: "New deduction" },
  savedNote: { ar: "انحفظ باللوحة تحت «الاستنتاجات».", en: "Saved on the board under “Deductions”." },
  noClearLink: { ar: "ما في رابط واضح بين هالدليلين.", en: "There's no clear link between these two clues." },
  deductions: { ar: "الاستنتاجات", en: "Deductions" },
  useInInterrogation: { ar: "استخدم في الاستجواب", en: "Use in interrogation" },
  openEvidence: { ar: "افتح", en: "Open" },
  discovered: { ar: "مكتشف", en: "Found" },
  close: { ar: "إغلاق", en: "Close" },
  investigatorNote: { ar: "ملاحظة المحقق", en: "Investigator's note" },
  observationNote: {
    ar: "الملاحظة وصفية فقط — لمن يخص هذا الدليل يتحدد من ردود المشتبه فيهم.",
    en: "This observation is descriptive only — who it points to is decided by the suspects' answers.",
  },
  forensicNote: { ar: "ملاحظة جنائية · خاصة بالخبير الجنائي", en: "Forensic note · for the forensic expert only" },
  confrontWho: { ar: "واجه مين بهذا الدليل؟", en: "Who do you want to confront with this evidence?" },
  back: { ar: "رجوع", en: "Back" },
} as const;

const ICONS = {
  watch: Watch,
  phone: Smartphone,
  cup: Coffee,
  message: MessageSquare,
  camera: Camera,
  key: KeyRound,
  shoe: Footprints,
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
  canLink = true,
  canConfront = true,
  forensics = false,
}: {
  unlockedIds: string[];
  onConfront: (evidenceId: string, suspectId: string) => void;
  compact?: boolean;
  /** ربط دليلين — صلاحية «المحقق». */
  canLink?: boolean;
  /** استخدام الدليل بالاستجواب — صلاحية «محقق الاستجواب». */
  canConfront?: boolean;
  /** الملاحظات الجنائية التفصيلية — صلاحية «الخبير الجنائي». */
  forensics?: boolean;
  deductions?: Deduction[];
  /** ينفّذ لمن ينجح ربط دليلين — يحفظ الاستنتاج بلوحة الأدلة. */
  onDeduction?: (link: { id: string; title: string; insight: string; pair: string[] }) => void;
  /** يستخدم استنتاج محفوظ بمواجهة مشتبه. */
  onUseDeduction?: (text: string, suspectId: string) => void;
}) {
  const { lang, pick } = useI18n();
  const bt = <K extends keyof typeof BOARD_TEXT>(k: K) => pick(BOARD_TEXT[k].ar, BOARD_TEXT[k].en);
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
    setLinkResult({
      ok: true,
      title: pick(link.title, link.titleEn),
      insight: pick(link.insight, link.insightEn),
    });
    onDeduction?.({ id: link.id, title: link.title, insight: link.insight, pair: [...link.pair] });
  };

  const togglePick = (id: string) => {
    setLinkResult(null);
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id].slice(-2);
    });
  };

  if (items.length === 0) {
    return (
      <div className="surface-panel cine-in px-5 py-10 text-center">
        <p className="text-sm leading-relaxed text-muted-foreground">{bt("empty")}</p>
      </div>
    );
  }

  return (
    <>
      {canLink && items.length >= 2 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <ActionButton
            variant={linking ? "outline" : "primary"}
            className="py-2.5"
            onClick={() => (linking ? resetLinking() : setLinking(true))}
          >
            <Link2 className="size-4" /> {linking ? bt("cancelLink") : bt("linkEvidence")}
          </ActionButton>
          {linking && (
            <p className="text-xs text-muted-foreground">{bt("pickTwoHint")}</p>
          )}
        </div>
      )}

      {linking && (
        <div className="cine-in mb-4 rounded-xl border border-border bg-surface-2 p-3">
          {picked.length < 2 ? (
            <p className="text-sm text-muted-foreground">{bt("pickTwoFromBoard")}</p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-foreground">
                {bt("selected")}: {items
                  .filter((e) => picked.includes(e.id))
                  .map((e) => pick(e.title, e.titleEn))
                  .join(" + ")}
              </p>
              <ActionButton className="py-2" onClick={() => tryLink(picked)}>
                <Search className="size-4" /> {bt("analyzeLink")}
              </ActionButton>
            </div>
          )}
        </div>
      )}

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
              <Eyebrow>{bt("newDeduction")}</Eyebrow>
              <h4 className="mt-1.5 flex items-center gap-2 text-base font-bold">
                <Lightbulb className="size-4 shrink-0 text-evidence" /> {linkResult.title}
              </h4>
              <p className="mt-1.5 text-sm leading-relaxed">{linkResult.insight}</p>
              <p className="mt-2 text-xs text-muted-foreground">{bt("savedNote")}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{bt("noClearLink")}</p>
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

      {(canLink || canConfront) && deductions.length > 0 && (
        <div className="mt-6 space-y-3">
          <Eyebrow>{bt("deductions")}</Eyebrow>
          {deductions.map((d) => (
            <DeductionCard key={d.id} deduction={d} onUse={canConfront ? onUseDeduction : undefined} />
          ))}
        </div>
      )}
      {open && (
        <EvidenceDetail
          item={open}
          canConfront={canConfront}
          forensics={forensics}
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
  const { pick } = useI18n();
  const [picking, setPicking] = useState(false);
  const link = getEvidenceLink(deduction.linkId);
  const title = pick(deduction.title, link?.titleEn ?? deduction.title);
  const insight = pick(deduction.insight, link?.insightEn ?? deduction.insight);
  return (
    <div className="cine-in surface-panel border-evidence/35 p-4">
      <h4 className="flex items-center gap-2 text-base font-bold">
        <Lightbulb className="size-4 shrink-0 text-evidence" /> {title}
      </h4>
      <p className="mt-1.5 text-sm leading-relaxed">{insight}</p>
      {onUse &&
        (!picking ? (
          <ActionButton variant="outline" className="mt-3 w-full py-2.5" onClick={() => setPicking(true)}>
            {pick("استخدم في الاستجواب", "Use in interrogation")}
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
                className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-2.5 text-start transition-colors hover:border-primary/55"
              >
                <img
                  src={s.portrait}
                  alt={pick(s.name, s.nameEn)}
                  loading="lazy"
                  className="size-10 shrink-0 rounded-lg border border-border object-cover object-top grayscale-[35%]"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{pick(s.name, s.nameEn)}</span>
                  <span className="block truncate text-xs text-muted-foreground">{pick(s.role, s.roleEn)}</span>
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
  const { pick } = useI18n();
  const Icon = ICONS[item.icon];
  const title = pick(item.title, item.titleEn);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${pick("افتح", "Open")} ${title}`}
      className={`group cine-in surface-panel relative flex w-full flex-col gap-3 p-3 text-start transition-all duration-300 hover:-translate-y-0.5 hover:border-evidence/55 ${
        selected ? "border-primary/70 ring-1 ring-primary/40" : ""
      }`}
    >
      {/* Evidence tape + pin details */}
      <span className="pointer-events-none absolute -top-2 end-6 z-10 h-5 w-16 rotate-[-6deg] rounded-[2px] bg-evidence/25 ring-1 ring-evidence/35" />
      <span className="pointer-events-none absolute -top-1.5 start-5 z-10 size-2.5 rounded-full bg-primary/80 shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_22%,transparent)]" />
      <span className="relative block h-36 w-full overflow-hidden rounded-lg border border-evidence/25">
        <SceneCrop
          crop={item.crop}
          alt={title}
          className="absolute inset-0 size-full transition-transform duration-700 group-hover:scale-[1.05]"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-card/85 via-transparent to-transparent" />
        <span className="absolute bottom-2 start-2 rounded-md border border-evidence/40 bg-card/85 px-2 py-1 font-mono text-[0.65rem] text-evidence">
          {pick(item.number, item.numberEn)}
        </span>
      </span>
      <span className="flex items-center gap-2">
        <Icon className="size-4 shrink-0 text-evidence" strokeWidth={1.7} />
        <span className="truncate text-base font-bold">{title}</span>
      </span>
    </button>
  );
}

function EvidenceDetail({
  item,
  onClose,
  onConfront,
  canConfront = true,
  forensics = false,
}: {
  item: EvidenceItem;
  onClose: () => void;
  onConfront: (suspectId: string) => void;
  canConfront?: boolean;
  forensics?: boolean;
}) {
  const { pick } = useI18n();
  const bt = <K extends keyof typeof BOARD_TEXT>(k: K) => pick(BOARD_TEXT[k].ar, BOARD_TEXT[k].en);
  const [picking, setPicking] = useState(false);
  const Icon = ICONS[item.icon];
  const title = pick(item.title, item.titleEn);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-background/92 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cine-in surface-panel mx-auto w-full max-w-3xl overflow-hidden p-0"
      >
        <SceneCrop
          crop={item.crop}
          alt={title}
          detail
          className="aspect-[4/3] max-h-[62vh] w-full"
        />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="font-mono text-xs text-muted-foreground">{pick(item.number, item.numberEn)}</span>
              <h3 className="mt-1 flex items-center gap-2 text-xl font-bold">
                <Icon className="size-5 shrink-0 text-evidence" strokeWidth={1.7} /> {title}
              </h3>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <CaseTag tone="evidence">{bt("discovered")}</CaseTag>
              <button
                type="button"
                onClick={onClose}
                aria-label={bt("close")}
                className="rounded-lg border border-border bg-secondary p-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-evidence/25 bg-evidence/8 p-4">
            <Eyebrow>{bt("investigatorNote")}</Eyebrow>
            <p className="mt-1.5 text-sm leading-relaxed">{pick(item.observation, item.observationEn)}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{bt("observationNote")}</p>
          </div>

          {forensics && (
            <div className="mt-4 rounded-xl border border-primary/30 bg-primary/8 p-4">
              <Eyebrow>{bt("forensicNote")}</Eyebrow>
              <p className="mt-1.5 text-sm leading-relaxed">{pick(item.detail, item.detailEn)}</p>
            </div>
          )}

          {!canConfront ? null : !picking ? (
            <ActionButton className="mt-5 w-full" onClick={() => setPicking(true)}>
              {bt("useInInterrogation")}
            </ActionButton>
          ) : (
            <div className="mt-5">
              <Eyebrow>{bt("confrontWho")}</Eyebrow>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {suspects.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onConfront(s.id)}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-2.5 text-start transition-colors hover:border-primary/55"
                  >
                    <img
                      src={s.portrait}
                      alt={pick(s.name, s.nameEn)}
                      loading="lazy"
                      className="size-11 shrink-0 rounded-lg border border-border object-cover object-top grayscale-[35%]"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{pick(s.name, s.nameEn)}</span>
                      <span className="block truncate text-xs text-muted-foreground">{pick(s.role, s.roleEn)}</span>
                    </span>
                  </button>
                ))}
              </div>
              <ActionButton
                variant="outline"
                className="mt-3 w-full"
                onClick={() => setPicking(false)}
              >
                {bt("back")}
              </ActionButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
