import { useServerFn } from "@tanstack/react-start";
import { FlaskConical, RotateCcw, Send } from "lucide-react";
import { useState } from "react";

import { ActionButton } from "@/components/game/shell";
import { Eyebrow, Panel } from "@/components/game/ui";
import { lastTripEvidence } from "@/game/cases/last-trip-evidence";
import { lastTripWitnessClaims } from "@/game/cases/last-trip-witness-claims";
import { askLastTripSuspect } from "@/lib/last-trip-interrogation.functions";
import { cn } from "@/lib/utils";

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
      (witness ? `${witness.text} شنو ردك؟` : "") ||
      (evidence ? `شنو تقول عن ${evidence.title}؟` : "");
    if (!text) {
      setError("اختر دليل أو قول شاهد، أو اكتب سؤال تجريبي.");
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
          // بيئة معزولة: نفتح الدليل المختار للتجربة فقط داخل هذا النداء.
          unlockedEvidence: evidence ? [evidence.id] : [],
          confrontEvidenceId: evidence?.id ?? null,
          confrontWitnessId: witness?.id ?? null,
          confrontHistory: [],
          contradictionCount: 0,
          transcript: history.slice(-20).map((t) => ({
            role: t.role,
            author: t.role === "investigator" ? "المحقق" : suspectName,
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
      setError("ما وصل رد — جرّب مرة ثانية.");
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
        <Eyebrow>وضع اختبار</Eyebrow>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2.5 py-1.5 text-xs hover:border-primary/60"
        >
          <FlaskConical className="size-3.5" /> {open ? "إخفاء" : "تشغيل"}
        </button>
      </div>

      {!open ? (
        <p className="mt-2 text-xs text-muted-foreground">
          مواجهة تجريبية فورية بأي دليل أو قول — بدون أي تأثير على بيانات القضية.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="rounded-md border border-border bg-secondary/40 px-2.5 py-2 text-[0.7rem] leading-relaxed text-muted-foreground">
            جلسة معزولة: ما تُسجَّل بسجل الغرفة، وما تغيّر التوتر المشترك، وما تُحسب
            مواجهة مستهلكة.
          </p>

          <label className="block text-xs">
            <span className="text-muted-foreground">دليل تجريبي</span>
            <select
              value={evidenceId}
              onChange={(e) => setEvidenceId(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-secondary px-2 py-2 text-xs outline-none focus:border-primary/60"
            >
              <option value="">بدون دليل</option>
              {lastTripEvidence.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs">
            <span className="text-muted-foreground">قول شاهد تجريبي</span>
            <select
              value={witnessId}
              onChange={(e) => setWitnessId(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-secondary px-2 py-2 text-xs outline-none focus:border-primary/60"
            >
              <option value="">بدون قول</option>
              {lastTripWitnessClaims.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs">
            <span className="text-muted-foreground">
              توتر البداية التجريبي: <span className="font-mono tabular-nums">{stress}</span>
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
              placeholder="سؤال تجريبي (اختياري)…"
              className="min-w-0 flex-1 rounded-md border border-border bg-secondary px-3 py-2 text-xs outline-none focus:border-primary/60"
            />
            <ActionButton type="button" disabled={busy} onClick={() => void run()}>
              <Send className="size-4" /> جرّب
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
                    {t.role === "investigator" ? "المحقق (تجريبي)" : `${suspectName} (تجريبي)`}
                  </p>
                  <p>{t.text}</p>
                  {t.contradiction && (
                    <p className="mt-1.5 text-[0.7rem] text-primary">· رصد تناقض تجريبي</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {busy && <p className="text-[0.7rem] text-muted-foreground">…{suspectName} يفكر</p>}

          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 text-[0.7rem] text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3.5" /> تصفير الجلسة التجريبية
          </button>
        </div>
      )}
    </Panel>
  );
}
