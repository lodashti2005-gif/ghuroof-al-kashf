import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Send, Timer, Unlock } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ActionButton, GameShell } from "@/components/game/shell";
import { CaseTag, Eyebrow, Panel, StressMeter } from "@/components/game/ui";
import { INTERROGATION_SECONDS, getEvidence, getSuspect } from "@/game/case-data";
import { generateSuspectReply, suggestedQuestions } from "@/game/dialogue";
import { formatClock, useRoom } from "@/game/use-room";

export const Route = createFileRoute("/interrogation/$suspectId")({
  head: () => ({
    meta: [
      { title: "غرفة الاستجواب — غرفة التحقيق" },
      {
        name: "description",
        content: "خمس دقائق، مؤشر توتر، وتناقضات. استجوب المشتبه واكشف اللي يخبيه.",
      },
      { property: "og:title", content: "غرفة الاستجواب" },
      { property: "og:description", content: "خمس دقائق مع المشتبه. كل سؤال يرفع الضغط." },
    ],
  }),
  component: InterrogationRoom,
});

function InterrogationRoom() {
  const { suspectId } = Route.useParams();
  const { room, me, actions } = useRoom();
  const navigate = useNavigate();
  const suspect = getSuspect(suspectId);
  const runtime = room?.suspects[suspectId];
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [unlockToast, setUnlockToast] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const askedTopics = useMemo(
    () => (runtime?.transcript ?? []).filter((m) => m.role === "investigator").map((m) => m.text),
    [runtime?.transcript],
  );

  // Countdown — the host-independent local clock. A Supabase-backed room would
  // read a server deadline instead.
  useEffect(() => {
    if (!runtime || runtime.finished || runtime.timeLeft <= 0) return;
    const id = setInterval(() => {
      const current = room?.suspects[suspectId];
      if (!current || current.finished) return;
      actions.setTimeLeft(suspectId, current.timeLeft - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [runtime, room, suspectId, actions]);

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

  const send = (value: string) => {
    const text = value.trim();
    if (!text || locked || !me) return;
    setDraft("");
    actions.pushMessage(suspectId, { role: "investigator", author: me.name, text });
    setTyping(true);

    const reply = generateSuspectReply({
      suspectId,
      message: text,
      stress: runtime?.stress ?? 0,
      askedTopics,
      unlockedEvidence: room?.unlockedEvidence ?? [],
    });

    setTimeout(
      () => {
        actions.pushMessage(suspectId, {
          role: "suspect",
          author: suspect.name,
          text: reply.text,
        });
        actions.bumpStress(suspectId, reply.stressDelta);
        if (reply.unlock) {
          actions.unlockEvidence(reply.unlock);
          const item = getEvidence(reply.unlock);
          if (item) {
            setUnlockToast(item.title);
            setTimeout(() => setUnlockToast(null), 3600);
          }
        }
        setTyping(false);
      },
      700 + Math.random() * 700,
    );
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
            <div className="relative aspect-[4/5]">
              <img
                src={suspect.portrait}
                alt={`صورة ${suspect.name}`}
                width={912}
                height={1104}
                className="absolute inset-0 size-full object-cover object-top grayscale-[30%]"
              />
              <div
                className="absolute inset-0"
                style={{ background: "var(--gradient-portrait)" }}
                aria-hidden="true"
              />
              <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 font-mono text-xs text-primary">
                <span className="size-1.5 rounded-full bg-primary blink-record" /> REC
              </span>
              <div className="absolute inset-x-4 bottom-4">
                <h2 className="text-xl font-bold">{suspect.name}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {suspect.role} · {suspect.age} سنة
                </p>
              </div>
            </div>
            <div className="border-t border-border p-4">
              <StressMeter value={runtime?.stress ?? 0} />
            </div>
          </div>

          <Panel className="cine-in">
            <Eyebrow>معلومات مؤكدة</Eyebrow>
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
            <CaseTag tone={locked ? "muted" : "danger"}>
              {locked ? "الجلسة مغلقة" : "جارية"}
            </CaseTag>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {(runtime?.transcript.length ?? 0) === 0 && (
              <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                ابدأ بسؤال. لاحظ إن الأسلوب الهادي يفتحهم أكثر، والضغط يرفع التوتر.
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
              <p className="font-mono text-xs text-muted-foreground">{suspect.name} يفكر...</p>
            )}
          </div>

          <div className="border-t border-border px-5 py-4">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={locked}
                  onClick={() => send(q)}
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
                send(draft);
              }}
            >
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(draft);
                  }
                }}
                rows={1}
                disabled={locked}
                placeholder={locked ? "انتهى وقت الاستجواب" : "اكتب سؤالك..."}
                className="min-h-12 flex-1 resize-none rounded-xl border border-input bg-surface-2 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary/60 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={locked || !draft.trim()}
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
            <p className="text-sm">
              دليل جديد انفتح: <span className="font-bold">{unlockToast}</span>
            </p>
          </div>
        </div>
      )}
    </GameShell>
  );
}
