import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Copy, Crown, Play, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { ActionButton, GameShell, LeaveRoomButton } from "@/components/game/shell";
import { Eyebrow, Panel, CaseTag } from "@/components/game/ui";
import { caseFile } from "@/game/case-data";
import { useI18n } from "@/i18n";
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
  const { pick } = useI18n();
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
    <GameShell title={pick("غرفة الانتظار", "Waiting room")} right={<LeaveRoomButton />}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Panel className="cine-in">
          <Eyebrow>{pick("رمز الغرفة", "Room code")}</Eyebrow>
          <div className="mt-3 flex items-center gap-3">
            <p dir="ltr" className="font-mono text-4xl tracking-[0.35em] sm:text-5xl">
              {room?.code ?? "······"}
            </p>
            <button
              type="button"
              onClick={copy}
              aria-label={pick("نسخ الرمز", "Copy code")}
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-secondary text-muted-foreground transition-colors hover:text-primary"
            >
              {copied ? <Check className="size-4 text-evidence" /> : <Copy className="size-4" />}
            </button>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {pick(
              "عطِ أصحابك هالرمز عشان يدخلون نفس الغرفة. كل واحد يختار اسمه، وبعدين المضيف يبدأ القضية.",
              "Share this code with your friends so they join the same room. Everyone picks a name, then the host starts the case.",
            )}
          </p>

          <div className="mt-6 rounded-xl border border-border bg-surface-2 p-4">
            <Eyebrow>{pick("القضية المختارة", "Selected case")}</Eyebrow>
            <h2 className="mt-1.5 text-xl font-bold">{pick(caseFile.title, caseFile.titleEn)}</h2>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {pick(caseFile.victim.summary, caseFile.victim.summaryEn)}
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
              <Play className="size-4.5" /> {pick("ابدأ القضية", "Start the case")}
            </ActionButton>
          ) : (
            <p className="mt-6 rounded-xl border border-border bg-secondary/60 px-4 py-3 text-center text-sm text-muted-foreground">
              {pick("انتظر المضيف يبدأ القضية", "Waiting for the host to start the case")}
            </p>
          )}
        </Panel>

        <Panel className="cine-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <h2 className="font-display text-base font-bold">{pick("المحققون بالغرفة", "Investigators in the room")}</h2>
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
                    <Crown className="size-3" /> {pick("المضيف", "Host")}
                  </CaseTag>
                )}
              </li>
            ))}
          </ul>

          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
            {pick(
              "الغرفة أونلاين وتتحدث لحظياً — أي لاعب يدخل من أي جهاز يبين هنا على طول.",
              "The room is online and live — any player who joins from any device shows up here instantly.",
            )}
          </p>
        </Panel>
      </div>
    </GameShell>
  );
}
