import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Copy, Crown, Play, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { ActionButton, GameShell, LeaveRoomButton } from "@/components/game/shell";
import { Eyebrow, Panel, CaseTag } from "@/components/game/ui";
import { caseFile } from "@/game/case-data";
import { useRoom } from "@/game/use-room";

export const Route = createFileRoute("/lobby")({
  head: () => ({
    meta: [
      { title: "غرفة الانتظار — ورا السالفة" },
      { name: "description", content: "شارك رمز الغرفة مع أصحابك وابدأوا قضية الشاليه." },
      { property: "og:title", content: "غرفة الانتظار — ورا السالفة" },
      { property: "og:description", content: "شارك رمز الغرفة وابدأوا التحقيق مع فريقك." },
    ],
  }),
  component: Lobby,
});

function Lobby() {
  const { room, isHost, actions } = useRoom();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!room) return;
    if (room.phase === "intro") navigate({ to: "/intro" });
    else if (room.phase === "roles") navigate({ to: "/roles" });
    else if (room.phase !== "lobby") navigate({ to: "/case" });
  }, [room, navigate]);

  const copy = () => {
    if (!room) return;
    void navigator.clipboard?.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <GameShell title="غرفة الانتظار" right={<LeaveRoomButton />}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Panel className="cine-in">
          <Eyebrow>رمز الغرفة</Eyebrow>
          <div className="mt-3 flex items-center gap-3">
            <p dir="ltr" className="font-mono text-4xl tracking-[0.35em] sm:text-5xl">
              {room?.code ?? "······"}
            </p>
            <button
              type="button"
              onClick={copy}
              aria-label="نسخ الرمز"
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-secondary text-muted-foreground transition-colors hover:text-primary"
            >
              {copied ? <Check className="size-4 text-evidence" /> : <Copy className="size-4" />}
            </button>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            عطِ أصحابك هالرمز عشان يدخلون نفس الغرفة. كل واحد يختار اسمه، وبعدين المضيف يبدأ القضية.
          </p>

          <div className="mt-6 rounded-xl border border-border bg-surface-2 p-4">
            <Eyebrow>القضية المختارة</Eyebrow>
            <h2 className="mt-1.5 text-xl font-bold">{caseFile.title}</h2>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {caseFile.victim.summary}
            </p>
          </div>

          {isHost ? (
            <ActionButton
              className="mt-6 w-full py-3.5 text-base"
              onClick={() => {
                actions.startIntro();
                navigate({ to: "/intro" });
              }}

            >
              <Play className="size-4.5" /> ابدأ القضية
            </ActionButton>
          ) : (
            <p className="mt-6 rounded-xl border border-border bg-secondary/60 px-4 py-3 text-center text-sm text-muted-foreground">
              انتظر المضيف يبدأ القضية
            </p>
          )}
        </Panel>

        <Panel className="cine-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <h2 className="font-display text-base font-bold">المحققون بالغرفة</h2>
            </div>
            <CaseTag>{room?.players.length ?? 0}</CaseTag>
          </div>

          <ul className="mt-4 space-y-2.5">
            {room?.players.map((p, i) => (
              <li
                key={p.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary font-mono text-xs text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="truncate text-sm">{p.name}</span>
                </div>
                {p.isHost && (
                  <CaseTag tone="danger">
                    <Crown className="size-3" /> المضيف
                  </CaseTag>
                )}
              </li>
            ))}
          </ul>

          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
            الغرفة أونلاين وتتحدث لحظياً — أي لاعب يدخل من أي جهاز يبين هنا على طول.
          </p>
        </Panel>
      </div>
    </GameShell>
  );
}
