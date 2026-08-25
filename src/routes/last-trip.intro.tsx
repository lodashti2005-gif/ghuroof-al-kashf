/**
 * المقدمة السينمائية لقضية «آخر رحلة» — ٩ مشاهد قبل بداية التحقيق.
 *
 * مهم: هذي المقدمة ما تكشف هوية القاتل. بمشاهد الحمام والتنظيف والزبالة يظهر
 * «الشخص الثاني» كظل بدون اسم، وأسماء المجموعة تظهر فقط بالمشاهد اللي ما
 * تكشف شي (الكوفي، واكتشاف راشد). ما نلمس قضية الشاليه ولا أي نظام موجود.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Search, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { ActionButton } from "@/components/game/shell";
import { lastTripCase } from "@/game/cases/last-trip";
import coffeeShop from "@/assets/scene-last-trip/coffee-shop.jpg";
import corridor from "@/assets/scene-last-trip/corridor.jpg";
import entrance from "@/assets/scene-last-trip/entrance.jpg";
import farBathroom from "@/assets/scene-last-trip/far-bathroom.jpg";
import farSink from "@/assets/scene-last-trip/far-sink.jpg";
import parking from "@/assets/scene-last-trip/parking.jpg";
import trashBin from "@/assets/scene-last-trip/trash-bin.jpg";

export const Route = createFileRoute("/last-trip/intro")({
  head: () => ({
    meta: [
      { title: "مقدمة قضية آخر رحلة — ورا السالفة" },
      {
        name: "description",
        content:
          "افتتاحية سينمائية لقضية «آخر رحلة»: محطة طريق بالليل، ربع برحلة عادية، وليلة ما كملت مثل ما بدأت.",
      },
      { property: "og:title", content: "مقدمة قضية آخر رحلة — ورا السالفة" },
      {
        property: "og:description",
        content: "كلهم كانوا بنفس المكان… وكل واحد فيهم عنده رواية.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LastTripIntroRoute,
});

type Line =
  | { kind: "narration"; text: string }
  | { kind: "beat"; text: string }
  | { kind: "say"; who: string; text: string; anon?: boolean };

type Scene = {
  id: string;
  label: string;
  image?: string;
  dim?: number;
  title?: string;
  lines: Line[];
  cta: string;
};

const SCENES: Scene[] = [
  {
    id: "station",
    label: "المشهد ١ — المحطة",
    image: parking,
    dim: 0.5,
    lines: [
      { kind: "narration", text: "ليل. محطة طريق بعيدة وهادية، الإضاءة خافتة والسيارات قليلة." },
      { kind: "beat", text: "سيارة الشباب تدخل المحطة… ينزلون ويتوجهون للكوفي." },
      { kind: "narration", text: "راشد مستانس ويضحك مع ربعه، والكلام كله يدور حوله." },
      { kind: "beat", text: "وبين المجموعة… واحد ساكت أكثر من اللازم." },
    ],
    cta: "كمل",
  },
  {
    id: "cafe",
    label: "المشهد ٢ — داخل الكوفي",
    image: coffeeShop,
    dim: 0.44,
    lines: [
      { kind: "beat", text: "الشباب قاعدين مع بعض، والجو طبيعي." },
      { kind: "say", who: "راشد", text: "شدعوه؟ من متى وإنت ساكت؟" },
      { kind: "say", who: "أحد الربع", text: "مافيني شي، بس تعبان شوي.", anon: true },
      { kind: "say", who: "راشد", text: "إنت دايم تقول مافيني شي." },
      { kind: "beat", text: "يضحكون… وتمر اللحظة عادية." },
    ],
    cta: "كمل",
  },
  {
    id: "tension",
    label: "المشهد ٣ — بداية التوتر",
    image: corridor,
    dim: 0.55,
    lines: [
      { kind: "beat", text: "بعد فترة، راشد يقوم من مكانه." },
      { kind: "say", who: "راشد", text: "بروح الحمام وبرجع." },
      { kind: "beat", text: "يمشي باتجاه الممر." },
      { kind: "beat", text: "بعد لحظات… واحد ثاني يقوم من الطاولة." },
      { kind: "say", who: "أحد الربع", text: "برجع.", anon: true },
      { kind: "narration", text: "يتجه بنفس الاتجاه. الكاميرا تبقى مع المجموعة." },
    ],
    cta: "كمل",
  },
  {
    id: "far-bathroom",
    label: "المشهد ٤ — الحمام الطرفي",
    image: farBathroom,
    dim: 0.66,
    lines: [
      { kind: "beat", text: "راشد يدخل… وبعد ثواني يدخل شخص وراه. الباب ينغلق." },
      { kind: "narration", text: "أصوات كلام منخفض من الداخل." },
      { kind: "say", who: "راشد", text: "خلاص، لا تكبر الموضوع." },
      { kind: "say", who: "صوت ثاني", text: "أنا اللي مكبر الموضوع؟", anon: true },
      { kind: "say", who: "راشد", text: "إي، لأن كل شي تحوله منافسة." },
      { kind: "say", who: "صوت ثاني", text: "مو كل شي عندك سهل مثل ما تتوقع.", anon: true },
      { kind: "say", who: "راشد", text: "إحنا ربع، مو داخلين سباق." },
      { kind: "narration", text: "النبرة تتصاعد… وما نشوف اللي صار." },
    ],
    cta: "كمل",
  },
  {
    id: "incident",
    label: "المشهد ٥ — لحظة الحادث",
    image: farSink,
    dim: 0.72,
    lines: [
      { kind: "beat", text: "صوت حركة قوية… دفعة." },
      { kind: "beat", text: "راشد يتراجع للخلف ويطيح باتجاه المغسلة." },
      { kind: "beat", text: "صوت ارتطام قوي. صمت." },
      { kind: "narration", text: "الأشياء اللي حول المغسلة تطيح… وظل واقف ما يتحرك." },
      { kind: "say", who: "صوت ثاني", text: "راشد…؟", anon: true },
      { kind: "beat", text: "لا رد." },
    ],
    cta: "كمل",
  },
  {
    id: "cleanup",
    label: "المشهد ٦ — محاولة إخفاء الأثر",
    image: farSink,
    dim: 0.78,
    lines: [
      { kind: "beat", text: "الظل يقترب من المغسلة وينظر للحنفية." },
      { kind: "beat", text: "يفتح الماء… ويمسح المكان بكلينكس." },
      { kind: "narration", text: "لقطات قريبة وسريعة: يد… ماء… حنفية… كلينكس… ونفس متسارع." },
      { kind: "beat", text: "يوقف الماء. ينظر للباب. يخرج." },
    ],
    cta: "كمل",
  },
  {
    id: "trash",
    label: "المشهد ٧ — الزبالة",
    image: trashBin,
    dim: 0.62,
    lines: [
      { kind: "beat", text: "يمشي باتجاه الكوفي، وقبل ما يدخل يتوقف عند حاوية الزبالة." },
      { kind: "beat", text: "ينظر حوله… ويرمي الكلينكس داخلها." },
      { kind: "narration", text: "يدخل الكوفي ويتصرف وكأن ما صار شي." },
    ],
    cta: "كمل",
  },
  {
    id: "discovery",
    label: "المشهد ٨ — اكتشاف راشد",
    image: corridor,
    dim: 0.6,
    lines: [
      { kind: "beat", text: "بعد فترة، أحدهم يلاحظ غياب راشد." },
      { kind: "say", who: "مشعل", text: "وين راشد؟ طوّل." },
      { kind: "say", who: "أحد الربع", text: "يمكن بالحمام.", anon: true },
      { kind: "beat", text: "يمر وقت قصير… ناصر يروح يدور عليه." },
      { kind: "say", who: "ناصر", text: "شباب… تعالوا." },
      { kind: "narration", text: "راشد ملقى قرب المغسلة. صمت… والكاميرا تبتعد ببطء." },
    ],
    cta: "كمل",
  },
  {
    id: "final",
    label: "المشهد الأخير",
    image: entrance,
    dim: 0.68,
    title: lastTripCase.title,
    lines: [
      { kind: "narration", text: "كلهم كانوا موجودين بنفس المكان… وكل واحد فيهم عنده رواية." },
      { kind: "narration", text: "لكن واحد منهم… ما قال الحقيقة." },
    ],
    cta: "ابدأ التحقيق",
  },
];

function LastTripIntroRoute() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const scene = SCENES[Math.min(step, SCENES.length - 1)]!;

  const [shown, setShown] = useState(1);
  useEffect(() => {
    setShown(1);
    const timers = Array.from({ length: scene.lines.length }, (_, i) =>
      window.setTimeout(() => setShown(i + 1), i * 1500),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [scene.id, scene.lines.length]);

  const skipToEndOfScene = () => setShown(scene.lines.length);
  const done = shown >= scene.lines.length;

  const advance = () => {
    if (!done) {
      skipToEndOfScene();
      return;
    }
    if (step >= SCENES.length - 1) {
      navigate({ to: "/last-trip/scene" });
      return;
    }
    setStep((n) => n + 1);
  };

  return (
    <main dir="rtl" className="relative min-h-screen overflow-hidden bg-background">
      {scene.image && (
        <div key={scene.id} className="absolute inset-0">
          <img
            src={scene.image}
            alt=""
            aria-hidden="true"
            className="intro-kenburns size-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, rgba(0,0,0,${Math.min(
                (scene.dim ?? 0.6) + 0.18,
                1,
              )}) 0%, rgba(0,0,0,${scene.dim ?? 0.6}) 55%, rgba(0,0,0,${
                (scene.dim ?? 0.6) * 0.9
              }) 100%)`,
            }}
          />
        </div>
      )}
      <div
        key={`veil-${scene.id}`}
        className="intro-veil pointer-events-none absolute inset-0 bg-black"
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-14 text-center">
        <p className="font-mono text-[0.7rem] tracking-[0.3em] text-muted-foreground">
          {step + 1} / {SCENES.length}
        </p>
        <p className="mt-2 font-display text-xs tracking-[0.2em] text-muted-foreground/80">
          {scene.label}
        </p>

        {scene.title && shown >= 1 && (
          <h1 className="intro-line mt-6 text-4xl font-black leading-tight sm:text-6xl">
            {scene.title}
          </h1>
        )}

        <div className="mt-8 w-full max-w-xl space-y-3">
          {scene.lines.slice(0, shown).map((line, i) =>
            line.kind === "say" ? (
              <div
                key={`${scene.id}-${i}`}
                className="intro-line flex items-start gap-3 rounded-2xl border border-border/70 bg-background/55 px-5 py-4 text-right backdrop-blur-sm"
              >
                <span
                  className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border ${
                    line.anon
                      ? "border-destructive/40 bg-destructive/10 text-destructive"
                      : "border-border bg-surface-2 text-muted-foreground"
                  }`}
                >
                  <UserRound className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-xs text-muted-foreground">
                    {line.who}
                  </span>
                  <span className="mt-1 block text-base leading-relaxed">«{line.text}»</span>
                </span>
              </div>
            ) : (
              <p
                key={`${scene.id}-${i}`}
                className={
                  line.kind === "beat"
                    ? "intro-line text-lg font-bold leading-snug sm:text-xl"
                    : "intro-line text-base leading-relaxed text-muted-foreground sm:text-lg"
                }
              >
                {line.text}
              </p>
            ),
          )}
        </div>

        <div className="mt-10 flex w-full max-w-sm flex-col gap-3">
          <ActionButton className="w-full py-3.5 text-base" onClick={advance}>
            {done ? scene.cta : "تخطَّ الانتظار"}{" "}
            {done && step >= SCENES.length - 1 ? (
              <Search className="size-4" />
            ) : (
              <ArrowLeft className="size-4" />
            )}
          </ActionButton>
          <Link
            to="/last-trip/scene"
            className="font-mono text-[11px] text-muted-foreground underline-offset-4 hover:underline"
          >
            تخطي المقدمة
          </Link>
        </div>
      </div>
    </main>
  );
}
