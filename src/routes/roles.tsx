import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, EyeOff, Loader2, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { ActionButton, GameShell, LeaveRoomButton } from "@/components/game/shell";
import { CaseTag, Eyebrow, Panel } from "@/components/game/ui";
import { roleById } from "@/game/roles";
import { RoleGlyph } from "@/components/game/role-glyph";
import { useRoom } from "@/game/use-room";

export const Route = createFileRoute("/roles")({
  head: () => ({
    meta: [
      { title: "هويتك في التحقيق — ورا السالفة" },
      {
        name: "description",
        content: "كل محقق يحصل دور خاص فيه: محقق، خبير جنائي، مسؤول مراقبة، أو محقق استجواب.",
      },
      { property: "og:title", content: "هويتك في التحقيق — ورا السالفة" },
      { property: "og:description", content: "دورك خاص بجهازك، وما أحد بالفريق يشوفه." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RolesScreen,
});

function RolesScreen() {
  const { room, me, isHost, actions } = useRoom();
  const navigate = useNavigate();
  const [stuck, setStuck] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const myRole = roleById(me ? room?.roles?.[me.id] : undefined);
const readyCount = room?.ready?.length ?? 0;
const total = Math.max(
  room?.players.length ?? 0,
  Object.keys(room?.roles ?? {}).length
);
  const iAmReady = !!me && !!room?.ready?.includes(me.id);
  const allReady = total > 0 && readyCount >= total;
  // كل اللاعبين النشطين عندهم دور محفوظ بالحالة المشتركة.
  const allRolesAssigned =
    (room?.players.length ?? 0) > 0 &&
    (room?.players ?? []).every((p) => !!room?.roles?.[p.id]);

  useEffect(() => {
    if (!room) return;
    if (room.phase === "lobby") {
      navigate({ to: "/lobby" });
      return;
    }
    // ما ننقل اللاعب من بطاقة دوره إلا بعد ما يضغط «فهمت دوري».
    if (room.phase !== "roles" && iAmReady) navigate({ to: "/case" });
  }, [room, iAmReady, navigate]);

  // لو ما وصل الدور (اللاعب دخل متأخر أو فوّت الحدث): مزامنة ثم يعطي نفسه دور ناقص.
  useEffect(() => {
    if (myRole || !me) {
      setStuck(false);
      return;
    }
    let alive = true;
    const t1 = window.setTimeout(() => void actions.resync(), 1200);
    const t2 = window.setTimeout(() => void actions.claimRole(me.id), 3000);
    const t3 = window.setTimeout(() => alive && setStuck(true), 8000);
    return () => {
      alive = false;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [myRole, me, actions]);

  const resync = async () => {
    setSyncing(true);
    await actions.resync();
    if (me) await actions.claimRole(me.id);
    setSyncing(false);
  };

  // كل اللاعبين جاهزين → المضيف يفتح القضية للفريق كله.
  useEffect(() => {
   // if (isHost && allReady && room?.phase === "roles") actions.setPhase("intro");
  }, [isHost, allReady, room?.phase, actions]);


  return (
    <GameShell title="هويتك في التحقيق" right={<LeaveRoomButton />}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Panel className="cine-in text-center">
          <Eyebrow>هويتك في التحقيق</Eyebrow>
          {myRole ? (
            <>
              <div className="mx-auto mt-5 grid size-20 place-items-center rounded-2xl border border-border bg-surface-2 text-primary">
                <RoleGlyph icon={myRole.icon} className="size-9" />
              </div>
              <h1 className="mt-4 text-3xl font-extrabold">{myRole.title}</h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                {myRole.mission}
              </p>
              <p className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs text-muted-foreground">
                <EyeOff className="size-3.5" /> هذا الدور خاص بجهازك — ما أحد بالفريق يشوفه
              </p>

              <ActionButton
                className="mt-6 w-full py-3.5 text-base"
                disabled={iAmReady}
                onClick={() => me && actions.markReady(me.id)}
              >
                {iAmReady ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> بانتظار باقي الفريق
                  </>
                ) : (
                  <>
                    فهمت دوري — ابدأ التحقيق <ArrowLeft className="size-4" />
                  </>
                )}
              </ActionButton>
              {isHost && allReady && allRolesAssigned && (
  <ActionButton
    className="mt-3 w-full py-3.5 text-base"
    onClick={() => actions.setPhase("intro")}
  >
    ابدأ التحقيق للجميع
  </ActionButton>
)}
            </>
          ) : (
            <p className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> جاري توزيع الأدوار...
            </p>
          )}
        </Panel>

        <Panel className="cine-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <h2 className="font-display text-base font-bold">استعداد الفريق</h2>
            </div>
            <CaseTag>
              {readyCount}/{total}
            </CaseTag>
          </div>

          <ul className="mt-4 space-y-2.5">
            {room?.players.map((p) => {
              const ready = room.ready?.includes(p.id);
              return (
                <li
                  key={p.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3"
                >
                  <span className="truncate text-sm">
                    {p.name}
                    {me?.id === p.id && (
                      <span className="ms-2 font-mono text-[0.68rem] text-muted-foreground">أنت</span>
                    )}
                  </span>
                  <CaseTag tone={ready ? "evidence" : "muted"}>
                    {ready ? "جاهز" : "يقرأ دوره"}
                  </CaseTag>

                </li>
              );
            })}
          </ul>

          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
            الأدوار تتوزع عشوائياً كل جولة، وكل واحد يشوف دوره بس. القضية والأدلة والتقدم مشتركة
            بين الفريق كله.
          </p>
        </Panel>
      </div>
    </GameShell>
  );
}
