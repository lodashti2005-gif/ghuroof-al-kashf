import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Clock, FileWarning, Gavel, Lock, Send, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ActionButton } from "@/components/game/shell";
import { CaseTag, Eyebrow, Panel, StressMeter } from "@/components/game/ui";
import { LastTripRoleGate } from "@/components/game/last-trip-role-gate";
import { LastTripTrialGate } from "@/components/game/last-trip-trial-gate";
import { getLastTripSuspect, lastTripSuspects } from "@/game/cases/last-trip-suspects";
import { lastTripEvidenceForSuspect } from "@/game/cases/last-trip-evidence";
import { lastTripWitnessClaimsForSuspect } from "@/game/cases/last-trip-witness-claims";

import { useLastTripRole } from "@/game/cases/last-trip-role-state";
import { LAST_TRIP_DENIED_MESSAGE } from "@/game/cases/last-trip-roles";
import {
  formatInterrogationClock,
  useLastTripTimer,
} from "@/game/cases/last-trip-timer";
import { markLastTripInterrogationDone } from "@/game/cases/last-trip-interrogation-progress";

import {
  getLastTripFoundSnapshot,
  hydrateLastTripProgress,
  mergeLastTripFromRoom,
  subscribeLastTripProgress,
} from "@/game/cases/last-trip-progress";
import * as store from "@/game/room-store";
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
  component: LastTripInterrogationScreen,
});

function LastTripInterrogationScreen() {
  return (
    <LastTripTrialGate>
      <LastTripRoleGate>
      <LastTripInterrogationRoute />
      </LastTripRoleGate>
    </LastTripTrialGate>
  );
}

interface Line {
  id: string;
  role: "investigator" | "suspect";
  text: string;
  contradiction?: boolean;
}

type Session = { stress: number; lines: Line[]; confronts: string[]; contradictions: number };

const emptySession = (): Session => ({ stress: 12, lines: [], confronts: [], contradictions: 0 });

/**
 * تخزين محلي دائم للتحقيق خارج الغرف فقط، مفتاحه مربوط بالغرفة/الوضع الفردي
 * حتى ما تختلط الجلسات. داخل الغرفة المصدر الوحيد هو حالة الغرفة المشتركة.
 */
function storageKey(id: string, scope: string) {
  return `last-trip:interrogation:${scope}:${id}`;
}

function loadSession(id: string, scope: string): Session {
  if (typeof window === "undefined") return emptySession();
  const read = (key: string) => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? ({ ...emptySession(), ...(JSON.parse(raw) as Partial<Session>) } as Session) : null;
    } catch {
      return null;
    }
  };
  // ترحيل الجلسات القديمة (قبل ما يصير المفتاح مربوط بالنطاق).
  return read(storageKey(id, scope)) ?? read(`last-trip:interrogation:${id}`) ?? emptySession();
}

function LastTripInterrogationRoute() {
  const { suspectId } = useParams({ from: "/last-trip/interrogation/$suspectId" });
  const suspect = getLastTripSuspect(suspectId);
  const ask = useServerFn(askLastTripSuspect);
  const navigate = useNavigate();


  const [session, setSession] = useState<Session>(emptySession);
  const [found, setFound] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ evidenceId?: string; witnessId?: string } | null>(null);
  const [denied, setDenied] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const { remaining, expired } = useLastTripTimer(suspectId);
  const { inRoom, room, role, can } = useLastTripRole();

  // المحقق هو الوحيد اللي يرسل الأسئلة، والباقي يشاهد السؤال والرد والتوتر.
  const isInterrogator = can("interrogate");
  const isAnalyst = can("analysis");

  // داخل غرفة: النص والتوتر من الحالة المشتركة (متزامن على كل الأجهزة).
  const shared = inRoom ? room?.suspects?.[suspectId] : undefined;
  const sharedLines = useMemo<Line[]>(
    () =>
      (shared?.transcript ?? []).map((m) => ({
        id: m.id,
        role: m.role,
        text: m.text,
        ...(m.flagged ? { contradiction: true } : {}),
      })),
    [shared?.transcript],
  );
  const lines = inRoom ? sharedLines : session.lines;
  const stress = inRoom ? (shared?.stress ?? 12) : session.stress;
  // المواجهات والتناقضات مشتركة داخل الغرفة: أي لاعب يشوفها فوراً وما تتكرر.
  const confronts = inRoom ? (shared?.confronts ?? []) : session.confronts;
  const contradictionCount = inRoom
    ? (shared?.contradictionCount ?? 0)
    : session.contradictions;


  useEffect(() => {
    hydrateLastTripProgress();
    setFound(getLastTripFoundSnapshot());
    const unsub = subscribeLastTripProgress(() => setFound(getLastTripFoundSnapshot()));
    return () => {
      unsub();
    };
  }, []);

  // أدلة الفريق المشتركة (قاعدة البيانات) — تصل لكل جهاز لحظياً وتبقى بعد الـrefresh.
  const sharedUnlocked = useMemo(
    () => (room?.unlockedEvidence ?? []).filter((id) => id.startsWith("lt-")),
    [room?.unlockedEvidence],
  );

  // دمج أدلة الغرفة بالتقدّم المحلي حتى ما يحتاج أي لاعب يعيد الاكتشاف.
  useEffect(() => {
    mergeLastTripFromRoom(sharedUnlocked);
  }, [sharedUnlocked]);


  // نطاق التخزين المحلي: الغرفة الحالية أو الوضع الفردي — بدون خلط بينهم.
  const scope = room?.code ?? "solo";
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    setSession(loadSession(suspectId, scope));
    loadedFor.current = `${scope}:${suspectId}`;
  }, [suspectId, scope]);

  // ما نكتب قبل ما تُحمّل جلسة نفس المفتاح، عشان الـrefresh ما يمسح السجل.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (loadedFor.current !== `${scope}:${suspectId}`) return;
    try {
      window.localStorage.setItem(storageKey(suspectId, scope), JSON.stringify(session));
    } catch {
      /* تجاهل */
    }
  }, [session, suspectId, scope]);


  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [lines.length, busy]);

  // خلص الوقت → يُحتسب استجواب هذا المشتبه فيه منتهي (يبقى محفوظ بعد الرجوع/الـrefresh).
  useEffect(() => {
    if (expired) markLastTripInterrogationDone(suspectId);
  }, [expired, suspectId]);

  const finishInterrogation = () => {
    markLastTripInterrogationDone(suspectId);
    void navigate({ to: "/last-trip/suspects" });
  };

  useEffect(() => {
    if (!denied) return;
    const t = setTimeout(() => setDenied(null), 2600);
    return () => clearTimeout(t);
  }, [denied]);


  // داخل غرفة: المصدر الوحيد لتوفّر الأدلة هو الحالة المشتركة.
  const availableIds = useMemo(
    () => (inRoom ? sharedUnlocked : found),
    [inRoom, sharedUnlocked, found],
  );

  // أدلة هذا المشتبه فيه فقط — العداد والأزرار تعتمد عليها.
  const foundEvidence = useMemo(
    () => lastTripEvidenceForSuspect(suspectId, availableIds),
    [availableIds, suspectId],
  );

  const witnessClaims = useMemo(
    () => lastTripWitnessClaimsForSuspect(suspectId),
    [suspectId],
  );


  const send = useCallback(
    async (text: string, confront: { evidenceId?: string; witnessId?: string } | null) => {
      if (!suspect || busy || expired || !text.trim()) return;
      if (!isInterrogator) {
        setDenied(LAST_TRIP_DENIED_MESSAGE);
        return;
      }
      const confrontId = confront?.evidenceId ?? confront?.witnessId ?? null;
      // مواجهة مستهلكة من أي لاعب بالغرفة ما تتكرر مرة ثانية.
      if (confrontId && confronts.includes(confrontId)) {
        setPending(null);
        setDenied("هذي المواجهة صارت قبل — ما تنفع تتكرر.");
        return;
      }

      setBusy(true);
      const question: Line = { id: crypto.randomUUID(), role: "investigator", text };
      const history = [...lines, question];
      if (inRoom) {
        store.pushMessage(suspectId, { role: "investigator", author: "المحقق", text });
        // تُسجّل المواجهة فوراً بالحالة المشتركة قبل انتظار الرد.
        if (confrontId) store.recordConfront(suspectId, confrontId);
      } else {
        setSession((s) => ({
          ...s,
          lines: [...s.lines, question],
          confronts:
            confrontId && !s.confronts.includes(confrontId)
              ? [...s.confronts, confrontId]
              : s.confronts,
        }));
      }
      setDraft("");
      setPending(null);

      try {
        const reply = await ask({
          data: {
            suspectId,
            message: text,
            stress,
            unlockedEvidence: availableIds,
            confrontEvidenceId: confront?.evidenceId ?? null,
            confrontWitnessId: confront?.witnessId ?? null,
            confrontHistory: confronts,
            contradictionCount,
            transcript: history.slice(-20).map((l) => ({
              role: l.role,
              author: l.role === "investigator" ? "المحقق" : suspect.name,
              text: l.text,
            })),
          },
        });
        if (inRoom) {
          store.pushMessage(suspectId, {
            role: "suspect",
            author: suspect.name,
            text: reply.text,
            ...(reply.contradiction ? { flagged: true } : {}),
          });
          store.bumpStress(suspectId, reply.stressDelta);
          store.recordConfront(suspectId, confrontId, reply.contradiction);
          if (reply.contradiction) {
            store.addContradiction({
              suspectId,
              suspectName: suspect.name,
              claim: reply.text.slice(0, 200),
              conflictsWith: "كلامه ما يركب مع دليل أو قول مكتشف",
              source: "statement",
              author: "المحقق",
            });
          }
        } else {
          setSession((s) => ({
            ...s,
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
            contradictions: s.contradictions + (reply.contradiction ? 1 : 0),
          }));
        }
      } finally {
        setBusy(false);
      }
    },
    [ask, busy, expired, availableIds, inRoom, isInterrogator, lines, session.confronts, session.contradictions, stress, suspect, suspectId],
  );

  const confrontDisabled = busy || expired || !isInterrogator;

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
              {role && <CaseTag>دورك: {role.title}</CaseTag>}
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

              <ActionButton variant="outline" onClick={finishInterrogation}>
                <Gavel className="size-4" /> أنهِ الاستجواب
              </ActionButton>
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
              {lines.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {isInterrogator
                    ? "ابدأ بسؤال. اسأله بلهجتك عادي: «وين كنت وقتها؟»، «شنو كنت تسوي؟»"
                    : "المحقق هو اللي يسأل — أنت تشوف السؤال والرد ومؤشر التوتر لحظة بلحظة."}
                </p>
              )}
              {lines.map((l) => (
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

            {denied && (
              <p className="mt-3 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-2 text-xs text-primary">
                {denied}
              </p>
            )}

            {expired && (
              <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-2.5 py-2 text-xs text-destructive">
                خلص وقت استجواب {suspect.name} — ما تقدر ترسل أسئلة جديدة له.
              </p>
            )}

            {isInterrogator ? (
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
            ) : (
              <p className="mt-4 flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2.5 text-xs text-muted-foreground">
                <Lock className="size-3.5 shrink-0" /> إرسال الأسئلة من اختصاص المحقق —{" "}
                {LAST_TRIP_DENIED_MESSAGE}
              </p>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel className="cine-in">
            <StressMeter value={stress} />
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
                      if (!isInterrogator) {
                        setDenied(LAST_TRIP_DENIED_MESSAGE);
                        return;
                      }
                      setPending({ evidenceId: e.id });
                      setDraft(`شنو تقول عن ${e.title}؟`);
                    }}
                    className={cn(
                      "w-full rounded-md border border-border bg-secondary px-2.5 py-2 text-right text-xs hover:border-evidence/60",
                      confrontDisabled && "opacity-60",
                    )}
                  >
                    {e.title}
                    {session.confronts.includes(e.id) && (
                      <span className="ms-2 text-[0.65rem] text-muted-foreground">
                        · تمت المواجهة
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </Panel>

          <Panel className="cine-in">
            <Eyebrow>مواجهة بأقوال شاهد</Eyebrow>
            {witnessClaims.length === 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                ما فيه أقوال شهود تخص {suspect.name}.
              </p>
            )}
            <div className="mt-3 space-y-2">
              {witnessClaims.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={busy || expired}
                  onClick={() => {
                    if (!isInterrogator) {
                      setDenied(LAST_TRIP_DENIED_MESSAGE);
                      return;
                    }
                    setPending({ witnessId: c.id });
                    setDraft(`${c.text} شنو ردك؟`);
                  }}
                  className={cn(
                    "w-full rounded-md border border-border bg-secondary px-2.5 py-2 text-right text-xs hover:border-primary/60",
                    confrontDisabled && "opacity-60",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </Panel>

          {/* لوحة المحلل — من اختصاص المحلل فقط. */}
          <Panel className="cine-in">
            <Eyebrow>التناقضات وربط الأقوال</Eyebrow>
            {isAnalyst ? (
              (room?.contradictions ?? []).length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  ما انرصد أي تناقض حتى الآن — تابع الاستجواب.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {(room?.contradictions ?? []).map((c) => (
                    <li
                      key={c.id}
                      className="rounded-md border border-primary/30 bg-primary/5 px-2.5 py-2 text-xs leading-relaxed"
                    >
                      <p className="font-semibold">{c.suspectName}</p>
                      <p className="mt-1 text-muted-foreground">{c.claim}</p>
                      <p className="mt-1 text-[0.7rem] text-primary">{c.conflictsWith}</p>
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="size-3.5 shrink-0" /> {LAST_TRIP_DENIED_MESSAGE}
              </p>
            )}
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
