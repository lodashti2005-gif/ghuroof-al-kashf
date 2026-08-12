import { Link } from "@tanstack/react-router";
import {
  Camera,
  Coffee,
  Fingerprint,
  KeyRound,
  Lock,
  MessageSquareWarning,
  Smartphone,
  Watch,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { evidence as allEvidence } from "@/game/case-data";
import type { EvidenceItem, Suspect } from "@/game/types";

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

export function StressMeter({ value, compact = false }: { value: number; compact?: boolean }) {
  const label =
    value >= 80 ? "على حد الانفجار" : value >= 60 ? "متوتر بشدة" : value >= 35 ? "متوتر" : "مرتاح";
  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">مؤشر التوتر</span>
        <span dir="ltr" className="font-mono text-foreground">
          {value}
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
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${value}%`,
            background:
              value >= 70
                ? "var(--gradient-blood)"
                : `color-mix(in oklab, var(--evidence) ${Math.max(30, value)}%, var(--muted-foreground))`,
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
} as const;

export function EvidenceCard({
  item,
  unlocked,
  onSelect,
}: {
  item: EvidenceItem;
  unlocked: boolean;
  onSelect?: () => void;
}) {
  const Icon = EVIDENCE_ICONS[item.icon];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group cine-in surface-panel flex w-full flex-col gap-3 p-4 text-right transition-all duration-300",
        unlocked ? "hover:border-evidence/50" : "opacity-70",
      )}
    >
      <div
        className={cn(
          "relative flex h-28 items-center justify-center overflow-hidden rounded-xl border",
          unlocked ? "border-evidence/25 bg-evidence/8" : "border-border bg-surface-2",
        )}
      >
        <Icon
          className={cn("size-10", unlocked ? "text-evidence" : "text-muted-foreground/50")}
          strokeWidth={1.4}
        />
        {!unlocked && (
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-background/70 py-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5" /> مقفل
          </span>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-muted-foreground">{item.number}</span>
          <CaseTag tone={unlocked ? "evidence" : "muted"}>{unlocked ? "مكتشف" : "مقفل"}</CaseTag>
        </div>
        <h3 className="mt-1.5 truncate text-base font-bold">{item.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {unlocked ? item.description : item.unlockHint}
        </p>
      </div>
    </button>
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

  const body = (
    <div className="surface-panel cine-in flex h-full flex-col gap-4 overflow-hidden p-0 transition-colors duration-300 hover:border-primary/45 sm:grid sm:grid-cols-[11rem_minmax(0,1fr)]">
      {/* الصورة على اليمين في RTL */}
      <div className="relative h-44 w-full overflow-hidden sm:h-full sm:min-h-[15rem]">
        <img
          src={suspect.portrait}
          alt={`صورة ${suspect.name}`}
          loading="lazy"
          width={912}
          height={1104}
          className="absolute inset-0 size-full object-cover object-top grayscale-[35%] transition-transform duration-700 hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent sm:bg-gradient-to-l sm:from-transparent sm:to-card/80" />
        <span className="absolute bottom-2 right-3 font-mono text-[0.65rem] text-muted-foreground sm:hidden">
          العمر {suspect.age}
        </span>
      </div>

      <div className="flex min-w-0 flex-col gap-3 px-4 pb-5 sm:px-1 sm:py-6 sm:pe-5">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 truncate text-lg font-bold leading-tight sm:text-xl">
              {suspect.name}
            </h3>
            <span
              dir="ltr"
              className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:block"
            >
              {suspect.age}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <CaseTag>{suspect.role}</CaseTag>
            {typeof stress !== "number" && (
              <CaseTag tone="danger">
                <Fingerprint className="size-3" /> ملف مفتوح
              </CaseTag>
            )}
          </div>
          <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {suspect.personality}
          </p>
          {suspect.known[0] && (
            <p className="mt-2 line-clamp-2 border-r-2 border-border pe-0 ps-2.5 text-xs leading-relaxed text-muted-foreground/85">
              {suspect.known[0]}
            </p>
          )}
        </div>

        {typeof stress === "number" && (
          <div className="mt-auto flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <StressMeter value={stress} compact />
            </div>
            <CaseTag tone={finished ? "muted" : "danger"}>{finished ? "انتهى" : "متاح"}</CaseTag>
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
        <Eyebrow>تقدم التحقيق</Eyebrow>
        <p className="mt-1 truncate text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function evidenceById(id: string) {
  return allEvidence.find((e) => e.id === id);
}
