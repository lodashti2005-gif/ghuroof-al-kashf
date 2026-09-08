/**
 * Live character simulation for the interrogation portrait.
 *
 * The still portrait is treated as a "camera feed": each emotional state maps to
 * a cinematic treatment (breathing zoom, micro head movement, lighting shift,
 * vignette, stress pulse) plus a short reaction transition when the state
 * changes. Nothing is cartoonish — only camera/lighting language.
 *
 * The portrait is rendered through one `SuspectAvatar` slot, so a real AI video
 * avatar can replace the <img> later without touching the state system.
 */
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import type { Suspect, SuspectState } from "@/game/types";
import { useI18n } from "@/i18n";

const STATE_LABEL: Record<SuspectState, { ar: string; en: string }> = {
  calm: { ar: "هادي", en: "Calm" },
  thinking: { ar: "يفكر", en: "Thinking" },
  nervous: { ar: "متوتر", en: "Nervous" },
  defensive: { ar: "يدافع", en: "Defensive" },
  angry: { ar: "متعصب", en: "Angry" },
  shocked: { ar: "مصدوم", en: "Shocked" },
  scared: { ar: "خايف", en: "Scared" },
  suspicious: { ar: "متشكك", en: "Suspicious" },
  silent: { ar: "ساكت", en: "Silent" },
};

const STATE_CLASS: Record<SuspectState, string> = {
  calm: "sim-calm",
  thinking: "sim-thinking",
  nervous: "sim-nervous",
  defensive: "sim-defensive",
  angry: "sim-angry",
  shocked: "sim-shocked",
  scared: "sim-scared",
  suspicious: "sim-suspicious",
  silent: "sim-silent",
};

/** Lighting/vignette overlay tint per state. */
const STATE_GLOW: Record<SuspectState, string> = {
  calm: "transparent",
  thinking: "color-mix(in oklab, var(--evidence) 12%, transparent)",
  nervous: "color-mix(in oklab, var(--primary) 12%, transparent)",
  defensive: "color-mix(in oklab, var(--primary) 16%, transparent)",
  angry: "color-mix(in oklab, var(--primary) 30%, transparent)",
  shocked: "color-mix(in oklab, var(--evidence) 26%, transparent)",
  scared: "color-mix(in oklab, var(--primary) 22%, transparent)",
  suspicious: "color-mix(in oklab, var(--evidence) 16%, transparent)",
  silent: "color-mix(in oklab, var(--muted-foreground) 14%, transparent)",
};

const UI_TEXT = {
  status: { ar: "الحالة:", en: "Status:" },
  speaking: { ar: "يتكلم", en: "Speaking" },
  photoOf: { ar: "صورة", en: "Photo of" },
  yearsOld: { ar: "سنة", en: "years old" },
} as const;

export function SuspectAvatar({
  suspect,
  state = "calm",
  stress,
  speaking = false,
}: {
  suspect: Suspect;
  state?: SuspectState;
  stress: number;
  speaking?: boolean;
}) {
  const { pick } = useI18n();
  const [reacting, setReacting] = useState(false);

  // Short reaction transition whenever the simulated state flips.
  useEffect(() => {
    setReacting(true);
    const t = setTimeout(() => setReacting(false), 900);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <div className="relative aspect-[4/5] overflow-hidden">
      <div
        className={cn(
          "absolute inset-0 sim-stage",
          STATE_CLASS[state],
          reacting && "sim-react",
          speaking && "sim-speaking",
        )}
      >
        <img
          src={suspect.portrait}
          alt={`${pick(UI_TEXT.photoOf.ar, UI_TEXT.photoOf.en)} ${pick(suspect.name, suspect.nameEn)}`}
          width={912}
          height={1104}
          className="absolute inset-0 size-full object-cover object-top grayscale-[30%]"
        />
        {/* jaw/mouth region gets a subtle talking motion while the voice plays */}
        {speaking && (
          <div className="sim-mouth" aria-hidden="true">
            <img
              src={suspect.portrait}
              alt=""
              width={912}
              height={1104}
              className="absolute inset-0 size-full object-cover object-top grayscale-[30%]"
            />
          </div>
        )}
      </div>

      {/* lighting shift */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{ background: STATE_GLOW[state], mixBlendMode: "soft-light" }}
        aria-hidden="true"
      />
      {/* vignette + stress pulse */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          boxShadow: `inset 0 0 ${60 + stress * 0.9}px ${18 + stress * 0.35}px rgba(0,0,0,${0.55 + stress / 320})`,
        }}
        aria-hidden="true"
      />
      {stress >= 65 && (
        <div className="pointer-events-none absolute inset-0 sim-pulse" aria-hidden="true" />
      )}
      <div
        className="absolute inset-0"
        style={{ background: "var(--gradient-portrait)" }}
        aria-hidden="true"
      />

      <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 font-mono text-xs text-primary">
        <span className="size-1.5 rounded-full bg-primary blink-record" /> REC
      </span>
      <span
        className="absolute left-3 top-3 rounded-md border border-border/70 bg-background/70 px-2 py-1 font-mono text-[0.65rem] text-muted-foreground backdrop-blur-sm"
        aria-live="polite"
      >
        {pick(UI_TEXT.status.ar, UI_TEXT.status.en)}{" "}
        {pick(STATE_LABEL[state].ar, STATE_LABEL[state].en)}
      </span>

      {speaking && (
        <span className="absolute right-3 bottom-20 inline-flex items-end gap-[3px] rounded-md border border-border/70 bg-background/70 px-2 py-1.5 backdrop-blur-sm">
          <span className="voice-bar" />
          <span className="voice-bar" />
          <span className="voice-bar" />
          <span className="voice-bar" />
          <span className="mr-1.5 font-mono text-[0.6rem] text-muted-foreground">
            {pick(UI_TEXT.speaking.ar, UI_TEXT.speaking.en)}
          </span>
        </span>
      )}

      <div className="absolute inset-x-4 bottom-4">
        <h2 className="text-xl font-bold">{pick(suspect.name, suspect.nameEn)}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {pick(suspect.role, suspect.roleEn)} · {suspect.age}{" "}
          {pick(UI_TEXT.yearsOld.ar, UI_TEXT.yearsOld.en)}
        </p>
      </div>
    </div>
  );
}

export const stateLabel = (s: SuspectState) => STATE_LABEL[s].ar;
