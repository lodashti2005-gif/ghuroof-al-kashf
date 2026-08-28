import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, Clock, MapPin, Play, Skull } from "lucide-react";

import { ActionButton, GameShell, LeaveRoomButton } from "@/components/game/shell";
import { CaseTag, Eyebrow, Panel, SuspectCard } from "@/components/game/ui";
import { caseFile, suspects } from "@/game/case-data";
import { useRoom } from "@/game/use-room";
import { useEffect } from "react";
export const Route = createFileRoute("/case")({
  head: () => ({
    meta: [
      { title: "قضية الشاليه — ورا السالفة" },
      {
        name: "description",
        content: "ملف القضية: بدر، 32 سنة، انلقى ميت داخل غرفة مقفلة بشاليه خاص.",
      },
      { property: "og:title", content: "قضية الشاليه" },
      { property: "og:description", content: "الباب ما كان مكسور، والتلفون اختفى. منو يكذب؟" },
    ],
  }),
  component: CaseIntro,
});

function CaseIntro() {
  const { room, isHost, actions } = useRoom();
  const navigate = useNavigate();
  const v = caseFile.victim;
  const contradictions = room?.contradictions ?? [];
useEffect(() => {
  if (room?.phase === "investigation") {
    navigate({ to: "/dashboard" });
  }
}, [room?.phase, navigate]);
  return (
    <GameShell title={caseFile.title} right={<LeaveRoomButton />}>
      <section className="cine-in surface-panel overflow-hidden p-0">
        <div className="grid gap-0 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <div className="relative min-h-[19rem] md:min-h-[26rem]">
            <img
              src={v.portrait}
              alt={`صورة الضحية ${v.name}`}
              width={912}
              height={1104}
              className="absolute inset-0 size-full object-cover object-top grayscale-[45%]"
            />
            <div
              className="absolute inset-0"
              style={{ background: "var(--gradient-portrait)" }}
              aria-hidden="true"
            />
            <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-md file-tape px-2.5 py-1 font-display text-[0.7rem]">
              <Skull className="size-3" /> الضحية
            </span>
          </div>

          <div className="p-6 sm:p-8">
            <Eyebrow>ملف {caseFile.code} · قضية مفتوحة</Eyebrow>
            <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{v.name}</h1>
            <p className="mt-1 font-mono text-sm text-muted-foreground">العمر {v.age} سنة</p>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <Detail
                icon={<Clock className="size-3.5" />}
                label="وقت الوفاة"
                value={v.timeOfDeath}
              />
              <Detail icon={<MapPin className="size-3.5" />} label="الموقع" value={v.location} />
              <Detail label="سبب الوفاة" value={v.cause} />
              <Detail label="عدد المشتبهين" value="أربعة أشخاص" />
            </dl>

            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {v.summary}
            </p>
          </div>
        </div>
      </section>


      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <Eyebrow>قائمة المشتبهين</Eyebrow>
            <h2 className="mt-1 text-2xl font-bold">أربعة كانوا بالشاليه</h2>
          </div>
          <CaseTag tone="danger">كلهم يخبون شي</CaseTag>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {suspects.map((s) => (
            <SuspectCard key={s.id} suspect={s} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <Eyebrow>سجل الاستجواب</Eyebrow>
            <h2 className="mt-1 text-2xl font-bold">التناقضات</h2>
          </div>
          <CaseTag tone={contradictions.length > 0 ? "evidence" : "muted"}>
            {contradictions.length > 0 ? `${contradictions.length} تناقض مرصود` : "ما فيه شي بعد"}
          </CaseTag>
        </div>
        <Panel className="cine-in">
          {contradictions.length === 0 ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              أي تناقض ينرصد بكلام المشتبه فيهم أثناء الاستجواب ينسجل هنا تلقائياً لكل الفريق.
            </p>
          ) : (
            <ul className="space-y-3">
              {contradictions.map((c) => (
                <li
                  key={c.id}
                  className="rounded-xl border border-evidence/35 bg-evidence/5 px-4 py-3 text-sm leading-relaxed"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-bold text-evidence">
                      <AlertTriangle className="size-3.5" /> {c.suspectName}
                    </span>
                    <span dir="ltr" className="font-mono text-[0.7rem] text-muted-foreground">
                      {new Date(c.createdAt).toLocaleTimeString("ar-KW", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="mt-2 text-muted-foreground">
                    <span className="text-foreground">قوله:</span> «{c.claim}»
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    <span className="text-foreground">
                      {c.source === "evidence"
                        ? "يتعارض مع دليل:"
                        : c.source === "timeline"
                          ? "يتعارض مع وقائع القضية:"
                          : "يتعارض مع قوله السابق:"}
                    </span>{" "}
                    {c.conflictsWith}
                  </p>
                  <p className="mt-1.5 font-mono text-[0.7rem] text-muted-foreground/80">
                    رصده {c.author}
                    {c.confronted ? " · تمت المواجهة" : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
        {isHost ? (
          <ActionButton
            className="py-3.5 text-base"
            onClick={() => {
              actions.setPhase("investigation");
              navigate({ to: "/dashboard" });
            }}
          >
            ادخل اللعبة <ArrowLeft className="size-4" />
          </ActionButton>
        ) : (
          <ActionButton
            variant="outline"
            className="py-3.5 text-base"
            disabled={room?.phase === "intro"}
            onClick={() => navigate({ to: "/dashboard" })}
          >
            {room?.phase === "intro" ? "انتظر المضيف" : "ادخل اللعبة"}
          </ActionButton>
        )}
      </div>
    </GameShell>
  );
}

function Detail({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-surface-2 px-4 py-3">
      <dt className="flex items-center gap-1.5 text-eyebrow uppercase">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}
