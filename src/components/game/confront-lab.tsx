import { useServerFn } from "@tanstack/react-start";
import { FlaskConical, RotateCcw, Send } from "lucide-react";
import { useState } from "react";

import { ActionButton } from "@/components/game/shell";
import { Eyebrow, Panel } from "@/components/game/ui";
import { lastTripEvidence } from "@/game/cases/last-trip-evidence";
import { lastTripWitnessClaims } from "@/game/cases/last-trip-witness-claims";
import { askLastTripSuspect } from "@/lib/last-trip-interrogation.functions";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

const UI_TEXT = {
  labMode: { ar: "وضع اختبار", en: "Lab mode" },
  hide: { ar: "إخفاء", en: "Hide" },
  run: { ar: "تشغيل", en: "Run" },
  labDesc: {
    ar: "مواجهة تجريبية فورية بأي دليل أو قول — بدون أي تأثير على بيانات القضية.",
    en: "Instant experimental confrontation with any evidence or statement — no effect on case data.",
  },
  isolatedSession: {
    ar: "جلسة معزولة: ما تُسجَّل بسجل الغرفة، وما تغيّر التوتر المشترك، وما تُحسب مواجهة مستهلكة.",
    en: "Isolated session: Not logged in room history, doesn't change shared stress, and doesn't count as a used confrontation.",
  },
  expEvidence: { ar: "دليل تجريبي", en: "Experimental evidence" },
  noEvidence: { ar: "بدون دليل", en: "No evidence" },
  expWitness: { ar: "قول شاهد تجريبي", en: "Experimental witness claim" },
  noWitness: { ar: "بدون قول", en: "No claim" },
  startStress: { ar: "توتر البداية التجريبي", en: "Starting experimental stress" },
  expQuestion: { ar: "سؤال تجريبي (اختياري)…", en: "Experimental question (optional)..." },
  tryIt: { ar: "جرّب", en: "Try it" },
  resetLab: { ar: "تصفير الجلسة التجريبية", en: "Reset experimental session" },
  investigatorLab: { ar: "المحقق (تجريبي)", en: "Investigator (Exp)" },
  suspectLab: { ar: " (تجريبي)", en: " (Exp)" },
  contradictionCaught: { ar: "· رصد تناقض تجريبي", en: "· Experimental contradiction caught" },
  thinking: { ar: " يفكر", en: " is thinking" },
  errorNoText: {
    ar: "اختر دليل أو قول شاهد، أو اكتب سؤال تجريبي.",
    en: "Select evidence or a witness claim, or type an experimental question.",
  },
  errorNoReply: { ar: "ما وصل رد — جرّب مرة ثانية.", en: "No reply received — try again." },
  authorInvestigator: { ar: "المحقق", en: "Investigator" },
  replySuffix: { ar: " شنو ردك؟", en: ", what's your response?" },
  aboutSuffix: { ar: "شنو تقول عن ", en: "What do you say about " },
} as const;

type Turn = { id: string; role: "investigator" | "suspect"; text: string; contradiction?: boolean };

/**
 * وضع اختبار (Sandbox) داخل غرفة الاستجواب:
 * يشغّل مواجهة تجريبية فورية بأي دليل أو قول شاهد بدون أي تأثير على
 * بيانات القضية — لا يلمس حالة الغرفة ولا التوتر المشترك ولا التخزين المحلي.
 */
export function ConfrontLab({
  suspectId,
  suspectName,
}: {
  suspectId: string;
  suspectName: string;
}) {
  const { lang, pick } = useI18n();
  const ask = useServerFn(askLastTripSuspect);
  const [open, setOpen] = useState(false);
  const [evidenceId, setEvidenceId] = useState("");
  const [witnessId, setWitnessId] = useState("");
  const [stress, setStress] = useState(35);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [lastDelta, setLastDelta] = useState<number | null>(null);

  const evidence = lastTripEvidence.find((e) => e.id === evidenceId);
  const witness = lastTripWitnessClaims.find((w) => w.id === witnessId);

  const run = async () => {
    const text =
      question.trim() ||
      (witness ? `${witness.text}${pick(UI_TEXT.replySuffix.ar, UI_TEXT.replySuffix.en)}` : "") ||
      (evidence
        ? `${pick(UI_TEXT.aboutSuffix.ar, UI_TEXT.aboutSuffix.en)}${pick(evidence.title, evidence.titleEn)}؟`
        : "");
    if (!text) {
      setError(pick(UI_TEXT.errorNoText.ar, UI_TEXT.errorNoText.en));
      return;
    }
    setError(null);
    setBusy(true);
    const mine: Turn = { id: crypto.randomUUID(), role: "investigator", text };
    const history = [...turns, mine];
    setTurns(history);
    setQuestion("");
    try {
      const reply = await ask({
        data: {
          suspectId,
          message: text,
          stress,
          lang,
          // بيئة معزولة: نفتح الدليل المختار للتجربة فقط داخل هذا النداء.
          unlockedEvidence: evidence ? [evidence.id] : [],
          confrontEvidenceId: evidence?.id ?? null,
          confrontWitnessId: witness?.id ?? null,
          confrontHistory: [],
          contradictionCount: 0,
          transcript: history.slice(-20).map((t) => ({
            role: t.role,
            author:
              t.role === "investigator"
                ? pick(UI_TEXT.authorInvestigator.ar, UI_TEXT.authorInvestigator.en)
                : suspectName,
            text: t.text,
          })),
        },
      });
      setLastDelta(reply.stressDelta);
      setStress((s) => Math.max(0, Math.min(100, s + reply.stressDelta)));
      setTurns((t) => [
        ...t,
        {
          id: crypto.randomUUID(),
          role: "suspect",
          text: reply.text,
          ...(reply.contradiction ? { contradiction: true } : {}),
        },
      ]);
    } catch {
      setError(pick(UI_TEXT.errorNoReply.ar, UI_TEXT.errorNoReply.en));
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setTurns([]);
    setLastDelta(null);
    setStress(35);
    setError(null);
  };

  return (
    <Panel className="cine-in border-dashed">
      <div className="flex items-center justify-between gap-2">
        <Eyebrow>{pick(UI_TEXT.labMode.ar, UI_TEXT.labMode.en)}</Eyebrow>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2.5 py-1.5 text-xs hover:border-primary/60"
        >
          <FlaskConical className="size-3.5" />{" "}
          {open ? pick(UI_TEXT.hide.ar, UI_TEXT.hide.en) : pick(UI_TEXT.run.ar, UI_TEXT.run.en)}
        </button>
      </div>

      {!open ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {pick(UI_TEXT.labDesc.ar, UI_TEXT.labDesc.en)}
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="rounded-md border border-border bg-secondary/40 px-2.5 py-2 text-[0.7rem] leading-relaxed text-muted-foreground">
            {pick(UI_TEXT.isolatedSession.ar, UI_TEXT.isolatedSession.en)}
          </p>

          <label className="block text-xs">
            <span className="text-muted-foreground">
              {pick(UI_TEXT.expEvidence.ar, UI_TEXT.expEvidence.en)}
            </span>
            <select
              value={evidenceId}
              onChange={(e) => setEvidenceId(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-secondary px-2 py-2 text-xs outline-none focus:border-primary/60"
            >
              <option value="">{pick(UI_TEXT.noEvidence.ar, UI_TEXT.noEvidence.en)}</option>
              {lastTripEvidence.map((e) => (
                <option key={e.id} value={e.id}>
                  {pick(e.title, e.titleEn)}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs">
            <span className="text-muted-foreground">
              {pick(UI_TEXT.expWitness.ar, UI_TEXT.expWitness.en)}
            </span>
            <select
              value={witnessId}
              onChange={(e) => setWitnessId(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-secondary px-2 py-2 text-xs outline-none focus:border-primary/60"
            >
              <option value="">{pick(UI_TEXT.noWitness.ar, UI_TEXT.noWitness.en)}</option>
              {lastTripWitnessClaims.map((w) => (
                <option key={w.id} value={w.id}>
                  {pick(w.label, w.labelEn)}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs">
            <span className="text-muted-foreground">
              {pick(UI_TEXT.startStress.ar, UI_TEXT.startStress.en)}:{" "}
              <span className="font-mono tabular-nums">{stress}</span>
              {lastDelta !== null && (
                <span className="ms-2 text-primary">
                  ({lastDelta >= 0 ? "+" : ""}
                  {lastDelta})
                </span>
              )}
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={stress}
              onChange={(e) => setStress(Number(e.target.value))}
              className="mt-2 w-full accent-primary"
            />
          </label>

          <div className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={pick(UI_TEXT.expQuestion.ar, UI_TEXT.expQuestion.en)}
              className="min-w-0 flex-1 rounded-md border border-border bg-secondary px-3 py-2 text-xs outline-none focus:border-primary/60"
            />
            <ActionButton type="button" disabled={busy} onClick={() => void run()}>
              <Send className="size-4" /> {pick(UI_TEXT.tryIt.ar, UI_TEXT.tryIt.en)}
            </ActionButton>
          </div>

          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-2.5 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          {turns.length > 0 && (
            <div className="max-h-64 space-y-2 overflow-y-auto pl-1">
              {turns.map((t) => (
                <div
                  key={t.id}
                  className={cn(
                    "rounded-md border px-2.5 py-2 text-xs leading-relaxed",
                    t.role === "investigator"
                      ? "border-border bg-secondary"
                      : "border-primary/30 bg-primary/5",
                  )}
                >
                  <p className="mb-1 text-[0.65rem] text-muted-foreground">
                    {t.role === "investigator"
                      ? pick(UI_TEXT.investigatorLab.ar, UI_TEXT.investigatorLab.en)
                      : `${suspectName}${pick(UI_TEXT.suspectLab.ar, UI_TEXT.suspectLab.en)}`}
                  </p>
                  <p>{t.text}</p>
                  {t.contradiction && (
                    <p className="mt-1.5 text-[0.7rem] text-primary">
                      {pick(UI_TEXT.contradictionCaught.ar, UI_TEXT.contradictionCaught.en)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {busy && (
            <p className="text-[0.7rem] text-muted-foreground">
              …{suspectName}
              {pick(UI_TEXT.thinking.ar, UI_TEXT.thinking.en)}
            </p>
          )}

          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 text-[0.7rem] text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3.5" /> {pick(UI_TEXT.resetLab.ar, UI_TEXT.resetLab.en)}
          </button>
        </div>
      )}
    </Panel>
  );
}
