import { Link } from "@tanstack/react-router";
import {
  Camera,
  Coffee,
  Footprints,
  Fingerprint,
  KeyRound,
  Lock,
  Maximize2,
  MessageSquareWarning,
  Smartphone,
  Watch,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { evidence as allEvidence } from "@/game/case-data";
import { SceneCrop } from "@/components/game/scene-crop";
import { useI18n } from "@/i18n";
import type { EvidenceItem, Suspect } from "@/game/types";

const UI_TEXT = {
  stressLabel: { ar: "مؤشر التوتر", en: "Stress meter" },
  onEdge: { ar: "على حد الانفجار", en: "About to break" },
  veryTense: { ar: "متوتر بشدة", en: "Very tense" },
  tense: { ar: "متوتر", en: "Tense" },
  calm: { ar: "مرتاح", en: "Calm" },
  confrontTag: { ar: "مواجهة بدليل", en: "Confronted with evidence" },
  close: { ar: "إغلاق", en: "Close" },
  foundAt: { ar: "مكان العثور", en: "Found at" },
  viewDetails: { ar: "عرض التفاصيل", en: "View details" },
  undiscovered: { ar: "دليل غير مكتشف", en: "Undiscovered evidence" },
  locked: { ar: "مقفل", en: "Locked" },
  zoomAlt: { ar: "تكبير صورة", en: "Zoom into image of" },
  discovered: { ar: "مكتشف", en: "Found" },
  photoOf: { ar: "صورة", en: "Photo of" },
  age: { ar: "العمر", en: "Age" },
  openFile: { ar: "ملف مفتوح", en: "Open file" },
  timeLeft: { ar: "الوقت المتبقي", en: "Time left" },
  finished: { ar: "انتهى", en: "Finished" },
  available: { ar: "متاح", en: "Available" },
  investigationProgress: { ar: "تقدم التحقيق", en: "Investigation progress" },
  yearsOld: { ar: "سنة", en: "years old" },
} as const;

export function Panel({
  children,
  className,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "aside";
}) {
  return <As className={cn("surface-panel p-5 sm:p-6", className)}>{children}</As>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-eyebrow uppercase", className)}>{children}</p>;
}

export function CaseTag({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "danger" | "evidence";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-display text-[0.7rem] tracking-wide",
        tone === "muted" && "border-border bg-secondary text-muted-foreground",
        tone === "danger" && "border-primary/50 bg-primary/12 text-primary",
        tone === "evidence" && "border-evidence/40 bg-evidence/10 text-evidence",
      )}
    >
      {children}
    </span>
  );
}

/** يحرّك الرقم المعروض تدريجياً نحو القيمة الحقيقية (بلا قفزات مفاجئة). */
function useEasedValue(target: number, step = 1) {
  const clamped = Math.max(0, Math.min(100, Math.round(target)));
  const [shown, setShown] = useState(clamped);
  const shownRef = useRef(clamped);

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      if (t - last >= 40) {
        last = t;
        const diff = clamped - shownRef.current;
        if (diff !== 0) {
          const move =
            Math.sign(diff) * Math.min(Math.abs(diff), Math.max(step, Math.abs(diff) / 8));
          shownRef.current = Math.round(shownRef.current + move);
          setShown(shownRef.current);
        }
      }
      if (shownRef.current !== clamped) raf = requestAnimationFrame(tick);
    };
    if (shownRef.current !== clamped) raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [clamped, step]);

  return shown;
}

export function StressMeter({ value, compact = false }: { value: number; compact?: boolean }) {
  const { pick } = useI18n();
  const shown = useEasedValue(value);
  const label =
    shown >= 80
      ? pick(UI_TEXT.onEdge.ar, UI_TEXT.onEdge.en)
      : shown >= 60
        ? pick(UI_TEXT.veryTense.ar, UI_TEXT.veryTense.en)
        : shown >= 35
          ? pick(UI_TEXT.tense.ar, UI_TEXT.tense.en)
          : pick(UI_TEXT.calm.ar, UI_TEXT.calm.en);
  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {pick(UI_TEXT.stressLabel.ar, UI_TEXT.stressLabel.en)}
        </span>
        <span dir="ltr" className="font-mono text-foreground">
          {shown}
          <span className="text-muted-foreground">%</span>
        </span>
      </div>
      <div
        className={cn(
          "relative overflow-hidden rounded-full bg-secondary",
          compact ? "h-1.5" : "h-2.5",
        )}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-linear"
          style={{
            width: `${shown}%`,
            background:
              shown >= 70
                ? "var(--gradient-blood)"
                : `color-mix(in oklab, var(--evidence) ${Math.max(30, shown)}%, var(--muted-foreground))`,
          }}
        />
      </div>
      {!compact && <p className="mt-1.5 text-xs text-muted-foreground">{label}</p>}
    </div>
  );
}

const EVIDENCE_ICONS = {
  watch: Watch,
  phone: Smartphone,
  cup: Coffee,
  message: MessageSquareWarning,
  camera: Camera,
  key: KeyRound,
  shoe: Footprints,
} as const;

function formatClock(seconds: number) {
  const s = Math.max(0, seconds);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Compact evidence card used inside the interrogation transcript. */
export function EvidenceConfrontCard({ item }: { item: EvidenceItem }) {
  const { pick } = useI18n();
  const Icon = EVIDENCE_ICONS[item.icon];
  return (
    <div className="flex items-start gap-3 rounded-2xl rounded-tr-sm border border-evidence/45 bg-evidence/8 px-3.5 py-3">
      <span className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-evidence/35">
        <SceneCrop
          crop={item.crop}
          alt={pick(item.title, item.titleEn)}
          className="absolute inset-0 size-full"
        />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.65rem] text-muted-foreground">
            {pick(item.number, item.numberEn)}
          </span>
          <CaseTag tone="evidence">
            <Icon className="size-3" /> {pick(UI_TEXT.confrontTag.ar, UI_TEXT.confrontTag.en)}
          </CaseTag>
        </div>
        <p className="mt-1 text-sm font-bold leading-tight">{pick(item.title, item.titleEn)}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {pick(item.description, item.descriptionEn)}
        </p>
      </div>
    </div>
  );
}

function EvidenceLightbox({ item, onClose }: { item: EvidenceItem; onClose: () => void }) {
  const { pick } = useI18n();
  const title = pick(item.title, item.titleEn);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center bg-background/92 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cine-in surface-panel w-full max-w-3xl overflow-hidden p-0"
      >
        <SceneCrop
          crop={item.crop}
          alt={title}
          detail
          className="aspect-[4/3] max-h-[70vh] w-full"
        />
        <div className="flex items-start justify-between gap-3 p-4">
          <div className="min-w-0">
            <span className="font-mono text-xs text-muted-foreground">
              {pick(item.number, item.numberEn)}
            </span>
            <h3 className="mt-1 text-lg font-bold">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {pick(item.detail, item.detailEn)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {pick(UI_TEXT.foundAt.ar, UI_TEXT.foundAt.en)}: {pick(item.foundAt, item.foundAtEn)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={pick(UI_TEXT.close.ar, UI_TEXT.close.en)}
            className="shrink-0 rounded-lg border border-border bg-secondary p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function EvidenceCard({
  item,
  unlocked,
  onSelect,
  selectLabel,
}: {
  item: EvidenceItem;
  unlocked: boolean;
  onSelect?: () => void;
  selectLabel?: string;
}) {
  const { pick } = useI18n();
  const [zoom, setZoom] = useState(false);
  const label = selectLabel ?? pick(UI_TEXT.viewDetails.ar, UI_TEXT.viewDetails.en);

  // Undiscovered evidence must leak nothing: no title, number, icon or hint.
  if (!unlocked) {
    return (
      <div
        aria-label={pick(UI_TEXT.undiscovered.ar, UI_TEXT.undiscovered.en)}
        className="cine-in surface-panel flex w-full flex-col gap-3 p-4 text-start opacity-70"
      >
        <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-border bg-surface-2">
          <Lock className="size-8 text-muted-foreground/60" strokeWidth={1.4} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-muted-foreground">🔒</span>
            <CaseTag tone="muted">{pick(UI_TEXT.locked.ar, UI_TEXT.locked.en)}</CaseTag>
          </div>
          <h3 className="mt-1.5 truncate text-base font-bold text-muted-foreground">
            {pick(UI_TEXT.undiscovered.ar, UI_TEXT.undiscovered.en)}
          </h3>
        </div>
      </div>
    );
  }

  const Icon = EVIDENCE_ICONS[item.icon];
  const title = pick(item.title, item.titleEn);
  return (
    <>
      <div className="group cine-in surface-panel flex w-full flex-col gap-3 p-4 text-start transition-all duration-300 hover:border-evidence/50">
        <button
          type="button"
          onClick={() => setZoom(true)}
          aria-label={`${pick(UI_TEXT.zoomAlt.ar, UI_TEXT.zoomAlt.en)} ${title}`}
          className="relative h-40 w-full overflow-hidden rounded-xl border border-evidence/25"
        >
          <SceneCrop
            crop={item.crop}
            alt={title}
            className="absolute inset-0 size-full transition-transform duration-700 group-hover:scale-[1.04]"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-card/85 via-transparent to-transparent" />
          <span className="absolute bottom-2 start-2 grid size-8 place-items-center rounded-lg border border-evidence/40 bg-card/80 text-evidence">
            <Maximize2 className="size-4" strokeWidth={1.6} />
          </span>
        </button>
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {pick(item.number, item.numberEn)}
            </span>
            <CaseTag tone="evidence">
              <Icon className="size-3" /> {pick(UI_TEXT.discovered.ar, UI_TEXT.discovered.en)}
            </CaseTag>
          </div>
          <h3 className="mt-1.5 truncate text-base font-bold">{title}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {pick(item.description, item.descriptionEn)}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground/85">
            {pick(UI_TEXT.foundAt.ar, UI_TEXT.foundAt.en)}: {pick(item.foundAt, item.foundAtEn)}
          </p>
          {onSelect && (
            <button
              type="button"
              onClick={onSelect}
              className="mt-3 w-full rounded-lg border border-evidence/45 bg-evidence/10 px-3 py-2 text-xs font-bold text-evidence transition-colors hover:bg-evidence/20"
            >
              {label}
            </button>
          )}
        </div>
      </div>
      {zoom && <EvidenceLightbox item={item} onClose={() => setZoom(false)} />}
    </>
  );
}

export function SuspectCard({
  suspect,
  stress,
  finished,
  timeLeft,
  href,
}: {
  suspect: Suspect;
  stress?: number;
  finished?: boolean;
  timeLeft?: number;
  href?: { to: string; params?: Record<string, string> };
}) {
  const { pick } = useI18n();

  const body = (
    <div className="surface-panel cine-in flex h-full flex-col gap-4 overflow-hidden p-0 transition-colors duration-300 hover:border-primary/45 sm:grid sm:grid-cols-[11rem_minmax(0,1fr)]">
      {/* الصورة على اليمين في RTL */}
      <div className="relative h-44 w-full overflow-hidden sm:h-full sm:min-h-[15rem]">
        <img
          src={suspect.portrait}
          alt={`${pick(UI_TEXT.photoOf.ar, UI_TEXT.photoOf.en)} ${pick(suspect.name, suspect.nameEn)}`}
          loading="lazy"
          width={912}
          height={1104}
          className="absolute inset-0 size-full object-cover object-top grayscale-[35%] transition-transform duration-700 hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent sm:bg-gradient-to-l sm:from-transparent sm:to-card/80" />
        <span className="absolute bottom-2 right-3 font-mono text-[0.65rem] text-muted-foreground sm:hidden">
          {pick(UI_TEXT.age.ar, UI_TEXT.age.en)} {suspect.age}{" "}
          {pick(UI_TEXT.yearsOld.ar, UI_TEXT.yearsOld.en)}
        </span>
      </div>

      <div className="flex min-w-0 flex-col gap-3 px-4 pb-5 sm:px-1 sm:py-6 sm:pe-5">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 truncate text-lg font-bold leading-tight sm:text-xl">
              {pick(suspect.name, suspect.nameEn)}
            </h3>
            <span
              dir="ltr"
              className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:block"
            >
              {suspect.age}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <CaseTag>{pick(suspect.role, suspect.roleEn)}</CaseTag>
            {typeof stress !== "number" && (
              <CaseTag tone="danger">
                <Fingerprint className="size-3" /> {pick(UI_TEXT.openFile.ar, UI_TEXT.openFile.en)}
              </CaseTag>
            )}
          </div>
          <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {pick(suspect.personality, suspect.personalityEn)}
          </p>
          {suspect.known[0] && (
            <p className="mt-2 line-clamp-2 border-r-2 border-border pe-0 ps-2.5 text-xs leading-relaxed text-muted-foreground/85">
              {pick(suspect.known[0], suspect.knownEn?.[0] || suspect.known[0])}
            </p>
          )}
        </div>

        {typeof stress === "number" && (
          <div className="mt-auto space-y-2.5">
            {typeof timeLeft === "number" && (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5">
                <span className="text-xs text-muted-foreground">
                  {pick(UI_TEXT.timeLeft.ar, UI_TEXT.timeLeft.en)}
                </span>
                <span
                  dir="ltr"
                  className={cn(
                    "font-mono text-xs",
                    timeLeft <= 0
                      ? "text-muted-foreground"
                      : timeLeft < 60
                        ? "text-primary"
                        : "text-foreground",
                  )}
                >
                  {formatClock(timeLeft)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <StressMeter value={stress} compact />
              </div>
              <CaseTag tone={finished ? "muted" : "danger"}>
                {finished
                  ? pick(UI_TEXT.finished.ar, UI_TEXT.finished.en)
                  : pick(UI_TEXT.available.ar, UI_TEXT.available.en)}
              </CaseTag>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (!href) return body;
  return (
    <Link
      to={href.to}
      params={href.params as never}
      className="block h-full focus-visible:outline-none"
    >
      {body}
    </Link>
  );
}

export function ProgressRing({ value, label }: { value: number; label: string }) {
  const { pick } = useI18n();
  return (
    <div className="flex items-center gap-4">
      <div
        className="relative grid size-16 shrink-0 place-items-center rounded-full"
        style={{
          background: `conic-gradient(var(--primary) ${value * 3.6}deg, var(--secondary) 0deg)`,
        }}
      >
        <span className="grid size-12 place-items-center rounded-full bg-card font-mono text-sm">
          {value}%
        </span>
      </div>
      <div className="min-w-0">
        <Eyebrow>
          {pick(UI_TEXT.investigationProgress.ar, UI_TEXT.investigationProgress.en)}
        </Eyebrow>
        <p className="mt-1 truncate text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function evidenceById(id: string) {
  return allEvidence.find((e) => e.id === id);
}
