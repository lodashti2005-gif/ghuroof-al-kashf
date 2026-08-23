import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Clock, FileWarning, Send, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ActionButton } from "@/components/game/shell";
import { CaseTag, Eyebrow, Panel, StressMeter } from "@/components/game/ui";
import { getLastTripSuspect, lastTripSuspects } from "@/game/cases/last-trip-suspects";
import { lastTripEvidence } from "@/game/cases/last-trip-evidence";
import { lastTripWitnessClaims } from "@/game/cases/last-trip-witness-claims";
import {
  formatInterrogationClock,
  useLastTripTimer,
} from "@/game/cases/last-trip-timer";
import {
  getLastTripFoundSnapshot,
  hydrateLastTripProgress,
  subscribeLastTripProgress,
} from "@/game/cases/last-trip-progress";
import { askLastTripSuspect } from "@/lib/last-trip-interrogation.functions";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/last-trip/interrogation/$suspectId")({
  head: () => ({
    meta: [
      { title: "غرفة الاستجواب — آخر رحلة" },
      {
        name: "description",
        content:
          "استجواب مشتبه فيهم قضية «آخر رحلة» داخل غرفة استجواب واقعية باللهجة الكويتية مع مواجهة بالأدلة وأقوال الشهود.",
      },
      { property: "og:title", content: "غرفة الاستجواب — آخر رحلة" },
      {
        property: "og:description",
        content: "اسأل، واجه بالدليل، وراقب مؤشر التوتر — قضية «آخر رحلة».",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LastTripInterrogationRoute,
});

interface Line {
  id: string;
  role: "investigator" | "suspect";
  text: string;
  contradiction?: boolean;
}

type Session = { stress: number; lines: Line[]; confronts: string[]; contradictions: number };

const emptySession = (): Session => ({ stress: 12, lines: [], confronts: [], contradictions: 0 });

function storageKey(id: string) {
  return `last-trip:interrogation:${id}`;
}

function loadSession(id: string): Session {
  if (typeof window === "undefined") return emptySession();
  try {
    const raw = window.localStorage.getItem(storageKey(id));
    if (!raw) return emptySession();
    return { ...emptySession(), ...(JSON.parse(raw) as Partial<Session>) };
  } catch {
    return emptySession();
  }
}

function LastTripInterrogationRoute() {
  const { suspectId } = useParams({ from: "/last-trip/interrogation/$suspectId" });
  const suspect = getLastTripSuspect(suspectId);
  const ask = useServerFn(askLastTripSuspect);

  const [session, setSession] = useState<Session>(emptySession);
  const [found, setFound] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ evidenceId?: string; witnessId?: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const { remaining, expired } = useLastTripTimer(suspectId);


  useEffect(() => {
    hydrateLastTripProgress();
    setFound(getLastTripFoundSnapshot());
    const unsub = subscribeLastTripProgress(() => setFound(getLastTripFoundSnapshot()));
    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    setSession(loadSession(suspectId));
  }, [suspectId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey(suspectId), JSON.stringify(session));
    } catch {
      /* تجاهل */
    }
  }, [session, suspectId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [session.lines.length, busy]);

  const foundEvidence = useMemo(
    () => lastTripEvidence.filter((e) => found.includes(e.id)),
    [found],
  );

  const send = useCallback(
    async (text: string, confront: { evidenceId?: string; witnessId?: string } | null) => {
      if (!suspect || busy || expired || !text.trim()) return;

      setBusy(true);
      const question: Line = { id: crypto.randomUUID(), role: "investigator", text };
      const history = [...session.lines, question];
      setSession((s) => ({ ...s, lines: history }));
      setDraft("");
      setPending(null);

      try {
        const reply = await ask({
          data: {
            suspectId,
            message: text,
            stress: session.stress,
            unlockedEvidence: found,
            confrontEvidenceId: confront?.evidenceId ?? null,
            confrontWitnessId: confront?.witnessId ?? null,
            confrontHistory: session.confronts,
            contradictionCount: session.contradictions,
            transcript: history.slice(-20).map((l) => ({
              role: l.role,
              author: l.role === "investigator" ? "المحقق" : suspect.name,
              text: l.text,
            })),
          },
        });
        const confrontId = confront?.evidenceId ?? confront?.witnessId;
        setSession((s) => ({
          stress: Math.max(0, Math.min(100, s.stress + reply.stressDelta)),
          lines: [
            ...history,
            {
              id: crypto.randomUUID(),
              role: "suspect",
              text: reply.text,
              contradiction: reply.contradiction,
            },
          ],
          confronts: confrontId && !s.confronts.includes(confrontId)
            ? [...s.confronts, confrontId]
            : s.confronts,
          contradictions: s.contradictions + (reply.contradiction ? 1 : 0),
        }));
      } finally {
        setBusy(false);
      }
    },
    [ask, busy, expired, found, session.confronts, session.contradictions, session.lines, session.stress, suspect, suspectId],
  );

  if (!suspect) {
    return (
      <div dir="rtl" className="min-h-screen bg-background p-6">
        <Panel className="mx-auto max-w-lg text-center">
          <p className="text-sm text-muted-foreground">ما فيه مشتبه فيه بهذا المعرّف.</p>
          <Link to="/last-trip/suspects" className="mt-4 inline-block">
            <ActionButton variant="outline">رجوع للشخصيات</ActionButton>
          </Link>
        </Panel>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Panel className="cine-in flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={suspect.portrait}
                alt={`صورة ${suspect.name}`}
                width={96}
                height={120}
                className="size-16 rounded-md object-cover object-top grayscale-[30%]"
              />
              <div>
                <Eyebrow>غرفة الاستجواب</Eyebrow>
                <h1 className="mt-1 text-xl font-bold">{suspect.name}</h1>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {suspect.relation} · {suspect.age} سنة
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-sm tabular-nums",
                  expired
                    ? "border-destructive/50 bg-destructive/10 text-destructive"
                    : remaining <= 30
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-secondary text-foreground",
                )}
                aria-label="الوقت المتبقي لاستجواب هذا المشتبه فيه"
              >
                <Clock className="size-4" /> {formatInterrogationClock(remaining)}
              </span>
              <CaseTag>الأدلة {foundEvidence.length}</CaseTag>

              <Link to="/last-trip/suspects">
                <ActionButton variant="outline">
                  <Users className="size-4" /> الشخصيات
                </ActionButton>
              </Link>
              <Link to="/last-trip/scene">
                <ActionButton variant="outline">
                  <ArrowRight className="size-4" /> مسرح الجريمة
                </ActionButton>
              </Link>
            </div>
          </Panel>

          <Panel className="cine-in">
            <div className="max-h-[52vh] space-y-3 overflow-y-auto pl-1">
              {session.lines.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  ابدأ بسؤال. اسأله بلهجتك عادي: «وين كنت وقتها؟»، «شنو كنت تسوي؟»
                </p>
              )}
              {session.lines.map((l) => (
                <div
                  key={l.id}
                  className={cn(
                    "max-w-[85%] rounded-lg border px-3 py-2 text-sm leading-relaxed",
                    l.role === "investigator"
                      ? "ml-auto border-border bg-secondary"
                      : "border-primary/30 bg-primary/5",
                  )}
                >
                  <p className="mb-1 text-[0.65rem] text-muted-foreground">
                    {l.role === "investigator" ? "المحقق" : suspect.name}
                  </p>
                  <p>{l.text}</p>
                  {l.contradiction && (
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-[0.7rem] text-primary">
                      <FileWarning className="size-3.5" /> في شي بكلامه ما يركب مع الدليل
                    </p>
                  )}
                </div>
              ))}
              {busy && <p className="text-xs text-muted-foreground">…{suspect.name} يفكر</p>}
              <div ref={endRef} />
            </div>

            {pending && !expired && (
              <p className="mt-3 rounded-md border border-evidence/40 bg-evidence/10 px-2.5 py-2 text-xs text-evidence">
                مواجهة مرفقة مع سؤالك الجاي.
              </p>
            )}

            {expired && (
              <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-2.5 py-2 text-xs text-destructive">
                خلص وقت استجواب {suspect.name} — ما تقدر ترسل أسئلة جديدة له.
              </p>
            )}

            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void send(draft, pending);
              }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={expired}
                placeholder={expired ? "انتهى وقت هذا المشتبه فيه" : "اكتب سؤالك…"}
                className="min-w-0 flex-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm outline-none focus:border-primary/60 disabled:opacity-60"
              />
              <ActionButton type="submit" disabled={busy || expired || !draft.trim()}>
                <Send className="size-4" /> إرسال
              </ActionButton>
            </form>

          </Panel>
        </div>

        <div className="space-y-4">
          <Panel className="cine-in">
            <StressMeter value={session.stress} />
          </Panel>

          <Panel className="cine-in">
            <Eyebrow>مواجهة بدليل</Eyebrow>
            {foundEvidence.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                ما عندك أدلة مكتشفة بعد. روح مسرح الجريمة أول.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {foundEvidence.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    disabled={busy || expired}
                    onClick={() => {
                      setPending({ evidenceId: e.id });
                      setDraft(`شنو تقول عن ${e.title}؟`);
                    }}
                    className="w-full rounded-md border border-border bg-secondary px-2.5 py-2 text-right text-xs hover:border-evidence/60"
                  >
                    {e.title}
                  </button>
                ))}
              </div>
            )}
          </Panel>

          <Panel className="cine-in">
            <Eyebrow>مواجهة بأقوال شاهد</Eyebrow>
            <div className="mt-3 space-y-2">
              {lastTripWitnessClaims.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={busy || expired}
                  onClick={() => {
                    setPending({ witnessId: c.id });
                    setDraft(`${c.text} شنو ردك؟`);
                  }}
                  className="w-full rounded-md border border-border bg-secondary px-2.5 py-2 text-right text-xs hover:border-primary/60"
                >
                  {c.label}
                </button>
              ))}
            </div>
          </Panel>

          <Panel className="cine-in">
            <Eyebrow>المشتبه فيهم</Eyebrow>
            <div className="mt-3 flex flex-wrap gap-2">
              {lastTripSuspects.map((s) => (
                <Link
                  key={s.id}
                  to="/last-trip/interrogation/$suspectId"
                  params={{ suspectId: s.id }}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-xs",
                    s.id === suspectId
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "border-border bg-secondary text-muted-foreground",
                  )}
                >
                  {s.name}
                </Link>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
