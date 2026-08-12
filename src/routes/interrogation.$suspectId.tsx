import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  FileSearch,
  Loader2,
  Mic,
  MicOff,
  RotateCcw,
  Send,
  Square,
  Timer,
  Unlock,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ActionButton, GameShell } from "@/components/game/shell";
import { SuspectAvatar } from "@/components/game/suspect-avatar";
import { CaseTag, Eyebrow, Panel, StressMeter } from "@/components/game/ui";
import { INTERROGATION_SECONDS, evidence as allEvidence, getEvidence, getSuspect } from "@/game/case-data";
import { generateSuspectReply, suggestedQuestions } from "@/game/dialogue";
import * as store from "@/game/room-store";
import { formatClock, useRoom } from "@/game/use-room";
import { useVoice } from "@/game/use-voice";
import { askSuspect } from "@/lib/interrogation.functions";


export const Route = createFileRoute("/interrogation/$suspectId")({
  head: () => ({
    meta: [
      { title: "غرفة الاستجواب — غرفة التحقيق" },
      {
        name: "description",
        content: "خمس دقائق، مؤشر توتر، ومشتبه يتكلم بلهجته. استجوبه بحرية واكشف اللي يخبيه.",
      },
      { property: "og:title", content: "غرفة الاستجواب" },
      { property: "og:description", content: "خمس دقائق مع المشتبه. كل سؤال يرفع الضغط." },
    ],
  }),
  component: InterrogationRoom,
});

// كل مشتبه له صوت بشري مستقل عبر ElevenLabs — التفاصيل في `@/game/voices`.


function InterrogationRoom() {
  const { suspectId } = Route.useParams();
  const { room, me, actions } = useRoom();
  const navigate = useNavigate();
  const ask = useServerFn(askSuspect);
  const suspect = getSuspect(suspectId);
  const runtime = room?.suspects[suspectId];
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [unlockToast, setUnlockToast] = useState<string | null>(null);
  const [confrontOpen, setConfrontOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);

  const transcript = useMemo(() => runtime?.transcript ?? [], [runtime?.transcript]);
  const unlocked = useMemo(
    () => allEvidence.filter((e) => room?.unlockedEvidence.includes(e.id)),
    [room?.unlockedEvidence],
  );

  const voice = useVoice({
    onTranscript: (text) => sendRef.current?.(text),
    suspectId,
  });

  const sendRef = useRef<((text: string, evidenceId?: string) => void) | null>(null);

  // Countdown — each suspect has its own independent 5 minutes. The interval is
  // keyed on the suspect only, so sending a message never restarts or resets it.
  useEffect(() => {
    const id = setInterval(() => {
      const current = store.getSnapshot()?.suspects[suspectId];
      if (!current || current.finished || current.timeLeft <= 0) return;
      actions.setTimeLeft(suspectId, current.timeLeft - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [suspectId, actions]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [runtime?.transcript.length, typing]);

  if (!suspect) {
    return (
      <GameShell title="غرفة الاستجواب">
        <Panel>ما لقينا هذا المشتبه.</Panel>
      </GameShell>
    );
  }

  const locked = !runtime || runtime.finished || runtime.timeLeft <= 0;
  // While a reply is generating, the session stays open but input is blocked so
  // the same question can't be sent twice.
  const busy = typing;
  const state = runtime?.state ?? "calm";

  const announceUnlock = (id: string) => {
    if (room?.unlockedEvidence.includes(id)) return;
    actions.unlockEvidence(id);
    const item = getEvidence(id);
    if (item) {
      setUnlockToast(item.title);
      setTimeout(() => setUnlockToast(null), 3600);
    }
  };

  /**
   * Free-form interrogation turn. The suspect's line comes from the AI model
   * with the full session transcript as memory; the scripted engine is only a
   * last-resort offline fallback if the model call fails.
   */
  const send = async (value: string, evidenceId?: string) => {
    const text = value.trim();
    if (!text || locked || !me || busyRef.current) return;
    busyRef.current = true;
    setDraft("");
    setConfrontOpen(false);
    actions.pushMessage(suspectId, { role: "investigator", author: me.name, text });
    setTyping(true);
    actions.setSuspectState(suspectId, "thinking");

    const history = [...transcript, { role: "investigator" as const, author: me.name, text }].map(
      (m) => ({ role: m.role, author: m.author, text: m.text }),
    );

    try {
      const reply = await ask({
        data: {
          suspectId,
          message: text,
          stress: runtime?.stress ?? 0,
          unlockedEvidence: room?.unlockedEvidence ?? [],
          confrontEvidenceId: evidenceId ?? null,
          transcript: history.slice(-40),
        },
      });
      const line = reply.text?.trim();
      if (!line) throw new Error("empty reply");
      actions.pushMessage(suspectId, { role: "suspect", author: suspect.name, text: line });
      actions.bumpStress(suspectId, reply.stressDelta);
      actions.setSuspectState(suspectId, reply.state, reply.level);
      if (reply.unlock) announceUnlock(reply.unlock);
      voice.speak(line, {
        state: reply.state,
        stress: Math.min(100, (runtime?.stress ?? 0) + reply.stressDelta),
      });

    } catch (error) {
      console.error(error);
      // Never leave a question unanswered: try the offline engine, and if even
      // that fails, speak a generic in-character line.
      let fallbackText = "";
      let fallbackStress = 1;
      let fallbackUnlock: string | null = null;
      try {
        const fallback = generateSuspectReply({
          suspectId,
          message: text,
          stress: runtime?.stress ?? 0,
          transcript,
          unlockedEvidence: room?.unlockedEvidence ?? [],
        });
        fallbackText = fallback.text?.trim() ?? "";
        fallbackStress = fallback.stressDelta;
        fallbackUnlock = fallback.unlock ?? null;
      } catch (engineError) {
        console.error(engineError);
      }
      if (!fallbackText) fallbackText = "شنو تبي تعرف بالضبط؟ اسألني سؤال مباشر وأجاوبك.";
      actions.pushMessage(suspectId, {
        role: "suspect",
        author: suspect.name,
        text: fallbackText,
      });
      actions.bumpStress(suspectId, fallbackStress);
      actions.setSuspectState(suspectId, "nervous");
      if (fallbackUnlock) announceUnlock(fallbackUnlock);
    } finally {
      setTyping(false);
      busyRef.current = false;
    }
  };

  sendRef.current = send;

  const confront = (id: string) => {
    const item = getEvidence(id);
    if (!item) return;
    void send(`أواجهك بدليل — ${item.title}: ${item.description} شنو ردك؟`, id);
  };

  return (
    <GameShell
      title={`استجواب · ${suspect.name}`}
      right={
        <span
          dir="ltr"
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-sm ${
            (runtime?.timeLeft ?? 0) < 60
              ? "border-primary/50 bg-primary/12 text-primary"
              : "border-border bg-secondary text-foreground"
          }`}
        >
          <Timer className="size-3.5" />
          {formatClock(runtime?.timeLeft ?? INTERROGATION_SECONDS)}
        </span>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-5">
          <div className="surface-panel cine-in overflow-hidden p-0">
            <SuspectAvatar
              suspect={suspect}
              state={state}
              stress={runtime?.stress ?? 0}
              speaking={voice.speaking}
            />
            <div className="border-t border-border p-4">
              <StressMeter value={runtime?.stress ?? 0} />
            </div>
          </div>

          <Panel className="cine-in">
            <Eyebrow>أقوال المشتبه فيه</Eyebrow>
            <p className="mt-1.5 text-xs text-muted-foreground/80">
              أقوال غير مؤكدة — ممكن تحتوي كذب.
            </p>
            <ul className="mt-3 space-y-2.5">
              {suspect.known.map((k, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-evidence" />
                  <span>{k}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <ActionButton
            variant="danger"
            className="w-full"
            onClick={() => {
              actions.endInterrogation(suspectId);
              navigate({ to: "/dashboard" });
            }}
          >
            أنهِ الاستجواب <ArrowLeft className="size-4" />
          </ActionButton>
        </aside>

        <Panel className="cine-in flex min-h-[32rem] flex-col p-0">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
            <div className="min-w-0">
              <Eyebrow>غرفة الاستجواب 2</Eyebrow>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                الجلسة مسجلة · {room?.players.length ?? 1} محققين متصلين
              </p>
            </div>
            <div className="flex items-center gap-2">

              {(voice.speaking || voice.loadingVoice) && (
                <button
                  type="button"
                  onClick={voice.stopSpeaking}
                  aria-label="إيقاف الصوت"
                  className="grid size-9 place-items-center rounded-lg border border-border bg-secondary text-muted-foreground transition-colors hover:text-foreground"
                >
                  {voice.loadingVoice ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Square className="size-4" />
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={voice.replay}
                disabled={!voice.hasLast || voice.muted}
                aria-label="إعادة تشغيل آخر رد"
                className="grid size-9 place-items-center rounded-lg border border-border bg-secondary text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              >
                <RotateCcw className="size-4" />
              </button>
              <button
                type="button"
                onClick={voice.toggleMute}
                aria-label={voice.muted ? "تشغيل صوت المشتبه" : "كتم صوت المشتبه"}
                className={`grid size-9 place-items-center rounded-lg border bg-secondary transition-colors hover:text-foreground ${
                  voice.muted
                    ? "border-primary/50 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {voice.muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
              <CaseTag tone={locked ? "muted" : "danger"}>
                {locked ? "الجلسة مغلقة" : "جارية"}
              </CaseTag>
            </div>

          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {(runtime?.transcript.length ?? 0) === 0 && (
              <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                اسأله أي شي بأسلوبك. يفهم أسئلتك المفتوحة ويتذكر كل كلمة قالها قبل.
              </div>
            )}

            {runtime?.transcript.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "investigator" ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[85%] sm:max-w-[70%]">
                  <p className="mb-1 font-mono text-[0.65rem] text-muted-foreground">{m.author}</p>
                  <div
                    className={
                      m.role === "investigator"
                        ? "rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground"
                        : "rounded-2xl rounded-tl-sm border border-border bg-surface-2 px-4 py-2.5 text-sm leading-relaxed"
                    }
                  >
                    {m.text}
                  </div>
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                <span className="flex gap-1">
                  <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                  <span className="size-1.5 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
                  <span className="size-1.5 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
                </span>
                {suspect.name} يفكر...
              </div>
            )}
          </div>

          <div className="border-t border-border px-5 py-4">
            {confrontOpen && (
              <div className="cine-in mb-3 rounded-xl border border-evidence/35 bg-evidence/5 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Eyebrow>اختر دليل للمواجهة</Eyebrow>
                  <button
                    type="button"
                    onClick={() => setConfrontOpen(false)}
                    aria-label="إلغاء"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                {unlocked.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    ما عندك أدلة مكتشفة بعد. اسأل أكثر عشان تفتح ملفات الأدلة.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {unlocked.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        disabled={locked || busy}
                        onClick={() => confront(e.id)}
                        className="rounded-lg border border-evidence/40 bg-card px-3 py-2 text-right text-xs text-foreground transition-colors hover:border-evidence disabled:opacity-40"
                      >
                        <span className="font-mono text-[0.65rem] text-muted-foreground">
                          {e.number}
                        </span>
                        <span className="mr-2">{e.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                disabled={locked || busy}
                onClick={() => setConfrontOpen((v) => !v)}
                className="shrink-0 rounded-full border border-evidence/45 bg-evidence/10 px-3 py-1.5 text-xs text-evidence transition-colors hover:bg-evidence/20 disabled:opacity-40"
              >
                <FileSearch className="ml-1 inline size-3.5" /> واجهه بدليل
              </button>
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={locked || busy}
                  onClick={() => void send(q)}
                  className="shrink-0 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
            </div>
            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void send(draft);
              }}
            >
              {voice.micSupported && (
                <button
                  type="button"
                  disabled={locked || busy}
                  onClick={voice.listening ? voice.stopListening : voice.startListening}
                  aria-label={voice.listening ? "إيقاف التسجيل" : "تسجيل صوتي"}
                  className={`grid size-12 shrink-0 place-items-center rounded-xl border transition-colors disabled:opacity-40 ${
                    voice.listening
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-border bg-surface-2 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {voice.listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                </button>
              )}
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(draft);
                  }
                }}
                rows={1}
                disabled={locked || busy}
                placeholder={
                  locked
                    ? "انتهى وقت الاستجواب"
                    : busy
                      ? "ينتظر رده..."
                      : voice.listening
                      ? "نسمعك..."
                      : "اكتب سؤالك بأي صيغة..."
                }
                className="min-h-12 flex-1 resize-none rounded-xl border border-input bg-surface-2 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary/60 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={locked || !draft.trim() || typing}
                aria-label="إرسال"
                className="grid size-12 shrink-0 place-items-center rounded-xl file-tape disabled:opacity-40"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        </Panel>
      </div>

      {unlockToast && (
        <div className="fixed bottom-6 right-1/2 z-50 translate-x-1/2 sm:right-6 sm:translate-x-0">
          <div className="cine-in flex items-center gap-3 rounded-xl border border-evidence/40 bg-card px-4 py-3 shadow-[var(--shadow-noir)]">
            <Unlock className="size-4 shrink-0 text-evidence" />
            <div className="min-w-0">
              <p className="text-sm font-bold">🔎 تم اكتشاف دليل جديد</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{unlockToast}</p>
            </div>
          </div>
        </div>
      )}
    </GameShell>
  );
}
