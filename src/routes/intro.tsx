/**
 * المقدمة السينمائية لقضية الشاليه — ٨ مشاهد بملء الشاشة قبل توزيع الأدوار.
 * الحالة مشتركة بقاعدة البيانات (`room.intro`): القائد يقدّم المشاهد، وكل
 * الأجهزة تشوف نفس المشهد، والتحديث أو الدخول المتأخر يوصل اللاعب لنفس المشهد
 * الحالي. آخر زر يشغّل نظام توزيع الأدوار الموجود نفسه بدون أي نظام جديد.
 * ما تكشف أي دليل ولا القاتل ولا أي معلومة يفترض تنكشف بالتحقيق.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Search, MessageSquare, Users2 } from "lucide-react";
import { useEffect, useState } from "react";

import { ActionButton } from "@/components/game/shell";
import { useRoom } from "@/game/use-room";
import { caseFile, suspects } from "@/game/case-data";
import chaletHero from "@/assets/scene-hero.jpg";
import hallway from "@/assets/scene/hallway.jpg";

export const Route = createFileRoute("/intro")({
  head: () => ({
    meta: [
      { title: "مقدمة قضية الشاليه — ورا السالفة" },
      {
        name: "description",
        content: "افتتاحية سينمائية لقضية الشاليه: ليلة عادية بشاليه خاص، وقضية بدت من باب غرفة.",
      },
      { property: "og:title", content: "مقدمة قضية الشاليه — ورا السالفة" },
      {
        property: "og:description",
        content: "ليلة كان المفروض تنتهي بشكل عادي — ابدأ قضية الشاليه مع فريقك.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IntroSequence,
});

type Scene = {
  id: string;
  image?: string;
  /** درجة تعتيم الصورة (٠ فاتح – ١ مظلم). */
  dim?: number;
  lines: string[];
  cta: string;
  kind?: "title" | "people" | "timeline" | "file" | "rules" | "ready";
  /** صفوف التسلسل الزمني — أوقات موجودة أصلاً بالقضية بدون أي حدث جديد. */
  beats?: { time: string; text: string }[];
};

const SCENES: Scene[] = [
  {
    id: "title",
    kind: "title",
    image: chaletHero,
    dim: 0.42,
    lines: ["ورا السالفة", "قضية الشاليه", "ليلة كان المفروض تنتهي بشكل عادي..."],
    cta: "ابدأ القضية",
  },
  {
    id: "day",
    kind: "people",
    image: chaletHero,
    dim: 0.34,
    lines: ["بدأ اليوم مثل أي تجمع عادي.", "خمسة أشخاص اجتمعوا في الشاليه..."],
    cta: "كمل",
  },
  {
    id: "timeline",
    kind: "timeline",
    image: chaletHero,
    dim: 0.48,
    lines: ["أحداث الليلة"],
    beats: [
      { time: "10:30 م", text: "الكل كان مجتمع بالصالة." },
      { time: "بعدها بوقت قصير...", text: "بدأ كل واحد يتحرك بمكان مختلف." },
      { time: "قريب 01:30 ص", text: "حسب أقوالهم، القعدة خلصت... والباقي مو واضح." },
    ],
    cta: "كمل",
  },
  {
    id: "shift",
    image: chaletHero,
    dim: 0.58,
    lines: ["لكن الليلة ما كملت مثل ما بدأت.", "صار شي داخل إحدى غرف الشاليه."],
    cta: "كمل",
  },
  {
    id: "discovery",
    image: hallway,
    dim: 0.4,
    lines: ["بعد فترة...", "انفتح باب الغرفة.", "ومن هني... بدأت القضية."],
    cta: "كمل",
  },
  {
    id: "file",
    kind: "file",
    dim: 1,
    lines: ["كل شخص موجود بالشاليه عنده جزء من السالفة.", "مهمتكم تعرفون شنو صار فعلاً."],
    cta: "كمل",
  },
  {
    id: "rules",
    kind: "rules",
    dim: 1,
    lines: ["لا تثق بأي استنتاج قبل ما تربط الأدلة."],
    cta: "كمل",
  },
  {
    id: "ready",
    kind: "ready",
    dim: 1,
    lines: ["القضية جاهزة.", "لكن قبل ما يبدأ التحقيق...", "كل واحد منكم له دور."],
    cta: "وزّع الأدوار",
  },
];

const RULES = [
  { icon: Search, title: "فتش", text: "فتش مسرح الجريمة بنفسك." },
  { icon: MessageSquare, title: "استجوب", text: "دقق بأقوال المشتبه فيهم." },
  { icon: Users2, title: "ناقش", text: "شارك اللي اكتشفته مع فريقك." },
];

/** أطراف الليلة كما هم معروفين للجميع — بدون أي وصف يوجّه الشك لأحد. */
const CAST = [
  { name: "فهد", portrait: suspects.find((s) => s.id === "fahad")?.portrait },
  { name: "نوره", portrait: suspects.find((s) => s.id === "noura")?.portrait },
  { name: "يوسف", portrait: suspects.find((s) => s.id === "yousef")?.portrait },
  { name: "دانه", portrait: suspects.find((s) => s.id === "dana")?.portrait },
  { name: "بدر", portrait: caseFile.victim.portrait },
];

function IntroSequence() {
  const { room, isHost, actions } = useRoom();
  const navigate = useNavigate();

  const step = Math.min(Math.max(room?.intro ?? 0, 0), SCENES.length - 1);
  const scene = SCENES[step]!;

  // كل الأجهزة تتبع الحالة المشتركة: الأدوار وزّعت → شاشة الأدوار، والغرفة
  // رجعت للانتظار → غرفة الانتظار. ما نغيّر أي نظام موجود.
  useEffect(() => {
    if (!room) return;
    if (room.phase === "roles") navigate({ to: "/roles" });
    else if (room.phase === "lobby") navigate({ to: "/lobby" });
    else if (room.phase !== "intro") navigate({ to: "/case" });
  }, [room, navigate]);

  // ظهور تدريجي للسطور، ويبدأ من جديد مع كل مشهد.
  const total = scene.lines.length + (scene.beats?.length ?? 0);
  const [shown, setShown] = useState(1);
  useEffect(() => {
    setShown(1);
    const timers = Array.from({ length: total }, (_, i) =>
      window.setTimeout(() => setShown(i + 1), i * 1500),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [step, total]);

  if (!room) {
    return (
      <main className="grid min-h-screen place-items-center bg-background">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> جاري تحميل ملف القضية...
        </p>
      </main>
    );
  }

  const advance = () => {
    if (!isHost) return;
    if (step >= SCENES.length - 1) {
      void actions.startRoles(room.players.map((p) => p.id));
      navigate({ to: "/roles" });
      return;
    }
    actions.setIntroStep(step + 1);
  };

  const beatsShown = Math.max(0, shown - scene.lines.length);

  return (
    <main dir="rtl" className="relative min-h-screen overflow-hidden bg-background">
      {scene.image && (
        <div key={scene.id} className="absolute inset-0">
          <img
            src={scene.image}
            alt=""
            aria-hidden="true"
            className="intro-kenburns size-full object-cover"
            style={{ filter: "brightness(1.45) contrast(1.05) saturate(0.95)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, rgba(0,0,0,${Math.min(
                (scene.dim ?? 0.7) + 0.15,
                1,
              )}) 0%, rgba(0,0,0,${scene.dim ?? 0.7}) 55%, rgba(0,0,0,${
                (scene.dim ?? 0.7) * 0.85
              }) 100%)`,
            }}
          />
        </div>
      )}
      {!scene.image && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,color-mix(in_oklab,var(--color-surface-2)_75%,transparent),transparent_65%)]" />
      )}
      <div key={`veil-${scene.id}`} className="intro-veil pointer-events-none absolute inset-0 bg-black" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-14 text-center">
        <p className="font-mono text-[0.7rem] tracking-[0.3em] text-muted-foreground">
          {step + 1} / {SCENES.length}
        </p>

        {/* المشهد ١ — العنوان */}
        {scene.kind === "title" ? (
          <div className="mt-8 space-y-5">
            <p className="intro-line font-display text-sm tracking-[0.45em] text-muted-foreground">
              {scene.lines[0]}
            </p>
            {shown >= 2 && (
              <h1 className="intro-line text-4xl font-black leading-tight sm:text-6xl">
                {scene.lines[1]}
              </h1>
            )}
            {shown >= 3 && (
              <p className="intro-line text-base leading-relaxed text-muted-foreground sm:text-lg">
                {scene.lines[2]}
              </p>
            )}
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {scene.lines.slice(0, shown).map((line, i) => (
              <p
                key={line}
                className={`intro-line ${
                  i === 0
                    ? "text-2xl font-bold leading-snug sm:text-3xl"
                    : "text-base leading-relaxed text-muted-foreground sm:text-lg"
                }`}
              >
                {line}
              </p>
            ))}
          </div>
        )}

        {/* المشهد ٢ — أطراف الليلة */}
        {scene.kind === "people" && shown >= scene.lines.length && (
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {CAST.map((p, i) => (
              <li
                key={p.name}
                className="intro-line w-24 shrink-0"
                style={{ animationDelay: `${i * 160}ms` }}
              >
                <div className="aspect-square overflow-hidden rounded-2xl border border-border/70 bg-surface-2 grayscale-[35%]">
                  {p.portrait && (
                    <img src={p.portrait} alt={p.name} className="size-full object-cover" />
                  )}
                </div>
                <p className="mt-2 font-display text-sm">{p.name}</p>
              </li>
            ))}
          </ul>
        )}

        {/* المشهد ٣ — تسلسل قصير، حدث واحد بكل مرة */}
        {scene.kind === "timeline" && (
          <ul className="mt-8 w-full max-w-xl space-y-3 text-right">
            {(scene.beats ?? []).slice(0, beatsShown).map((b) => (
              <li
                key={b.time}
                className="intro-line rounded-2xl border border-border/70 bg-background/50 px-5 py-4 backdrop-blur-sm"
              >
                <span dir="auto" className="font-mono text-xs text-muted-foreground">
                  {b.time}
                </span>
                <p className="mt-1.5 text-base leading-relaxed">{b.text}</p>
              </li>
            ))}
          </ul>
        )}

        {/* المشهد ٦ — ملف القضية */}
        {scene.kind === "file" && (
          <div className="intro-line mt-8 w-full max-w-xl rounded-2xl border border-border bg-surface-2/80 p-6 text-right backdrop-blur-sm">
            <p className="font-mono text-[0.7rem] tracking-[0.3em] text-muted-foreground">
              ملف القضية · {caseFile.code}
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ["القضية", caseFile.title],
                ["الحالة", "قيد التحقيق"],
                ["المشتبه فيهم", "5"],
                ["الأدلة", "غير معروف"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0"
                >
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-bold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* المشهد ٧ — قواعد التحقيق */}
        {scene.kind === "rules" && (
          <ul className="mt-8 grid w-full gap-3 sm:grid-cols-3">
            {RULES.map((r, i) => {
              const Icon = r.icon;
              return (
                <li
                  key={r.title}
                  className="intro-line rounded-2xl border border-border bg-surface-2/80 p-5 backdrop-blur-sm"
                  style={{ animationDelay: `${i * 180}ms` }}
                >
                  <Icon className="mx-auto size-5 text-primary" />
                  <h2 className="mt-3 font-display text-base font-bold">{r.title}</h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{r.text}</p>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-10 w-full max-w-sm">
          {isHost ? (
            <ActionButton className="w-full py-3.5 text-base" onClick={advance}>
              {scene.cta} <ArrowLeft className="size-4" />
            </ActionButton>
          ) : (
            <p className="rounded-xl border border-border bg-background/60 px-4 py-3 text-sm text-muted-foreground backdrop-blur-sm">
              القائد يتابع ملف القضية...
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
