import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Home, Lock, Skull } from "lucide-react";
import { useEffect, useState } from "react";

import { ActionButton } from "@/components/game/shell";
import { CaseTag, Eyebrow, Panel } from "@/components/game/ui";
import { lastTripCase } from "@/game/cases/last-trip";
import { lastTripSuspects } from "@/game/cases/last-trip-suspects";
import { getLastTripEnding } from "@/lib/last-trip-ending.functions";
import { useRoom } from "@/game/use-room";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/last-trip/ending")({
  head: () => ({
    meta: [
      { title: "نهاية القضية — آخر رحلة" },
      {
        name: "description",
        content: "شاشة نهاية قضية «آخر رحلة» — تفتح لفريق الغرفة بعد الاتهام النهائي.",
      },
      { property: "og:title", content: "نهاية القضية — آخر رحلة" },
      { property: "og:description", content: "تفتح لفريق الغرفة بعد الاتهام النهائي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LastTripEndingRoute,
});

function LastTripEndingRoute() {
  const { room, actions } = useRoom();
  const navigate = useNavigate();
  const fetchEnding = useServerFn(getLastTripEnding);
  const [shown, setShown] = useState(1);

  const playerId = actions.getSession()?.playerId ?? null;
  const unlocked =
    !!room && room.caseId === "last-trip" && !!playerId && room.ltAcc?.stage === "ending";

  // بدون غرفة صالحة وصلت مرحلة النهاية: ما نعرض أي شي، ونرجّع اللاعب للقضايا.
  useEffect(() => {
    if (room === undefined) return;
    if (!unlocked) {
      const t = setTimeout(() => void navigate({ to: "/cases" }), 400);
      return () => clearTimeout(t);
    }
  }, [room, unlocked, navigate]);

  const { data } = useQuery({
    queryKey: ["last-trip-ending", room?.code ?? null],
    enabled: unlocked,
    queryFn: () => fetchEnding({ data: { code: room!.code, playerId: playerId! } }),
  });

  if (!unlocked) {
    return (
      <div dir="rtl" className="grid min-h-screen place-items-center bg-background px-4">
        <Panel className="max-w-md space-y-3 text-center">
          <Lock className="mx-auto size-5 text-muted-foreground" />
          <h1 className="text-lg font-bold">النهاية مقفلة</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            شاشة النهاية تفتح لفريق الغرفة بعد ما يخلصون الاتهام النهائي.
          </p>
          <Link to="/cases">
            <ActionButton variant="outline">
              <Home className="size-4" /> القضايا
            </ActionButton>
          </Link>
        </Panel>
      </div>
    );
  }

  const culprit = lastTripSuspects.find((s) => s.id === data?.culpritId) ?? null;
  const beats = data?.beats ?? [];
  const done = shown >= beats.length;


  return (
    <div dir="rtl" className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-5">
        <Panel className="cine-in overflow-hidden p-0">
          <div className="grid gap-0 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]">
            <div className="relative min-h-[15rem]">
              {culprit && (
                <img
                  src={culprit.portrait}
                  alt={`صورة ${culprit.name}`}
                  width={912}
                  height={1104}
                  className="absolute inset-0 size-full object-cover object-top"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-card/70" />
            </div>
            <div className="p-6">
              <Eyebrow>نهاية القضية — {lastTripCase.title}</Eyebrow>
              <h1 className="mt-2 flex items-center gap-2 text-3xl font-extrabold">
                <Skull className="size-6 text-destructive" />
                القاتل: {culprit?.name ?? "…"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{culprit?.relation}</p>
              <div className="mt-4">
                <CaseTag tone="danger">الحل الكامل</CaseTag>
              </div>
            </div>
          </div>
        </Panel>

        <div className="space-y-3">
          {beats.slice(0, shown).map((b, i) => (
            <Panel key={b.title} className={cn("cine-in", i === shown - 1 && "border-primary/40")}>
              <Eyebrow>
                {i + 1}. {b.title}
              </Eyebrow>
              <p className="mt-2 text-sm leading-relaxed">{b.text}</p>
            </Panel>
          ))}
        </div>

        <Panel className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {done ? "انتهت القضية." : `${shown} من ${beats.length}`}
          </p>
          <div className="flex flex-wrap gap-2">
            {!done && (
              <ActionButton onClick={() => setShown((n) => n + 1)}>
                <ArrowLeft className="size-4" /> كمّل
              </ActionButton>
            )}
            {done && (
              <Link to="/cases">
                <ActionButton variant="outline">
                  <Home className="size-4" /> القضايا
                </ActionButton>
              </Link>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
