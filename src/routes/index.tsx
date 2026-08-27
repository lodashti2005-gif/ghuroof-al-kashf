import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, ShieldAlert } from "lucide-react";

import heroScene from "@/assets/scene-hero.jpg";
import { Eyebrow } from "@/components/game/ui";
import { GAME_NAME, playableCases } from "@/game/game-meta";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ورا السالفة | لعبة تحقيق وقضايا" },
      {
        name: "description",
        content:
          "ورا السالفة — لعبة تحقيق جماعية تعيشون فيها القضية، تجمعون الأدلة، تستجوبون المشتبه فيهم، وتحاولون تكشفون الحقيقة.",
      },
      { property: "og:title", content: "ورا السالفة | لعبة تحقيق وقضايا" },
      {
        property: "og:description",
        content:
          "ورا السالفة — لعبة تحقيق جماعية تعيشون فيها القضية، تجمعون الأدلة، تستجوبون المشتبه فيهم، وتحاولون تكشفون الحقيقة.",
      },

      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Welcome,
});

const STEPS: { n: string; title: string; body: string[] }[] = [
  { n: "1", title: "اختاروا القضية", body: ["اختاروا القضية اللي تبون تحققون فيها."] },
  {
    n: "2",
    title: "ادخلوا مع ربعكم",
    body: ["اللعبة جماعية، وكل لاعب يدخل نفس الغرفة."],
  },
  {
    n: "3",
    title: "كل لاعب له دور",
    body: ["كل لاعب يحصل على دور وقدرة مختلفة تساعد الفريق في التحقيق."],
  },
  {
    n: "4",
    title: "فتشوا مسرح الجريمة",
    body: [
      "تحركوا داخل المكان بأنفسكم.",
      "اضغطوا على الأشياء داخل الصورة واستكشفوا المكان.",
      "الأدلة مو كلها واضحة، فلا تعتمدون على قائمة أدلة جاهزة.",
    ],
  },
  {
    n: "5",
    title: "اجمعوا الأدلة",
    body: ["كل دليل تكتشفونه ينضاف إلى دفتر القضية للفريق."],
  },
  {
    n: "6",
    title: "استجوبوا المشتبهين",
    body: [
      "كل مشتبه له قصته ومعلوماته الخاصة.",
      "اسألوا الأسئلة، راقبوا التناقضات، واستخدموا الأدلة المناسبة أثناء الاستجواب.",
    ],
  },
  {
    n: "7",
    title: "انتبهوا للوقت",
    body: ["كل مشتبه له وقت استجواب محدد.", "رتبوا أسئلتكم ولا تضيعون الوقت."],
  },
  {
    n: "8",
    title: "تعاونوا",
    body: [
      "مو كل لاعب يقدر يسوي كل شيء.",
      "استفيدوا من أدوار بعض وربطوا المعلومات مع بعض.",
    ],
  },
  {
    n: "9",
    title: "الاتهام النهائي",
    body: ["بعد انتهاء التحقيق، اختاروا الشخص اللي تعتقدون إنه المسؤول عن الجريمة."],
  },
  {
    n: "10",
    title: "اكتشفوا الحقيقة",
    body: [
      "إذا كان اتهامكم صحيح، تشوفون كشف القضية.",
      "وإذا كان غلط، تقدرون تعيدون الاتهام أو تشوفون النهاية.",
    ],
  },
];

function Welcome() {
  return (
    <div dir="rtl" className="relative min-h-screen bg-background">
      <div className="relative overflow-hidden">
        <img
          src={heroScene}
          alt="غرفة تحقيق معتمة"
          width={1920}
          height={1088}
          className="absolute inset-0 size-full object-cover opacity-50"
        />
        <div
          className="absolute inset-0"
          style={{ background: "var(--gradient-noir)" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 opacity-[0.16]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent 0 3px, oklch(0 0 0 / 0.55) 3px 4px)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg file-tape">
              <ShieldAlert className="size-4.5" />
            </span>
            <span className="font-display text-sm font-bold">ورا السالفة | Wara Al Salfa</span>
          </div>

          <div className="cine-in mt-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1.5">
              <span className="size-1.5 rounded-full bg-primary blink-record" />
              <span className="font-display text-xs tracking-wide text-primary">
                لعبة تحقيق جماعية · بالكويتي
              </span>
            </div>
            <h1 className="text-5xl font-extrabold leading-[1.15] sm:text-6xl">{GAME_NAME}</h1>
            <p className="mt-4 max-w-xl font-display text-lg text-muted-foreground sm:text-2xl">
              مو كل واحد يقول الحقيقة… ومهمتكم تعرفون ورا السالفة.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 pb-16 sm:px-8">
        <section className="mt-10">
          <Eyebrow>دليل اللاعب</Eyebrow>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">شلون تلعب؟</h2>

          <ol className="mt-6 space-y-3">
            {STEPS.map((step) => (
              <li key={step.n} className="surface-panel flex gap-4 p-5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 font-display text-sm font-bold text-primary">
                  {step.n}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-base font-bold">{step.title}</h3>
                  {step.body.map((line) => (
                    <p key={line} className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {line}
                    </p>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-5">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="font-display text-sm font-bold text-primary">تنبيه مهم</p>
            <p className="mt-1 text-sm leading-relaxed">
              اللعبة تعتمد على الملاحظة وربط الأدلة، فلا تستعجلون الاتهام.
            </p>
          </div>
        </div>

        <Link
          to="/cases"
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-7 py-4 font-display text-lg font-bold text-primary-foreground transition-transform hover:scale-[1.01]"
        >
          فهمت — اختيار القضية <ArrowLeft className="size-5" />
        </Link>

        <footer className="mt-10 grid gap-3 border-t border-border/60 pt-6 sm:grid-cols-3">
          {[
            { k: "القضايا المتاحة", v: `${playableCases.length} قضية` },
            { k: "عدد اللاعبين", v: "من 2 إلى 6 لاعبين" },
            { k: "مدة الجلسة", v: "40 – 60 دقيقة" },
          ].map((row) => (
            <div key={row.k} className="min-w-0">
              <Eyebrow>{row.k}</Eyebrow>
              <p className="mt-1 truncate text-sm">{row.v}</p>
            </div>
          ))}
        </footer>
      </div>
    </div>
  );
}
