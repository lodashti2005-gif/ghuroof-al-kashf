/**
 * المقدمة السينمائية لقضية «آخر رحلة» — ٩ مشاهد قبل بداية التحقيق.
 *
 * مهم: هذي المقدمة ما تكشف هوية القاتل. بمشاهد الحمام والتنظيف والزبالة يظهر
 * «الشخص الثاني» كظل بدون اسم، وأسماء المجموعة تظهر فقط بالمشاهد اللي ما
 * تكشف شي (الكوفي، واكتشاف راشد). ما نلمس قضية الشاليه ولا أي نظام موجود.
 *
 * كل سطر ظاهر للاعب له نسخة إنجليزية، والاختيار يتم حسب لغة اللاعب.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Search, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { ActionButton } from "@/components/game/shell";
import { LAST_TRIP_CASE_ID, lastTripCase } from "@/game/cases/last-trip";
import { lastTripT } from "@/game/cases/last-trip-strings";
import { useRoom } from "@/game/use-room";
import { useI18n } from "@/i18n";

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
  | { kind: "narration"; text: string; textEn: string }
  | { kind: "beat"; text: string; textEn: string }
  | { kind: "say"; who: string; whoEn: string; text: string; textEn: string; anon?: boolean };

type Scene = {
  id: string;
  label: string;
  labelEn: string;
  image?: string;
  dim?: number;
  title?: string;
  titleEn?: string;
  lines: Line[];
  cta: string;
  ctaEn: string;
};

const SOMEONE = { who: "أحد الربع", whoEn: "One of the group" };
const OTHER_VOICE = { who: "صوت ثاني", whoEn: "A second voice" };
const RASHID = { who: "راشد", whoEn: "Rashid" };

const SCENES: Scene[] = [
  {
    id: "station",
    label: "المشهد ١ — المحطة",
    labelEn: "Scene 1 — The rest stop",
    image: parking,
    dim: 0.5,
    lines: [
      {
        kind: "narration",
        text: "ليل. محطة طريق بعيدة وهادية، الإضاءة خافتة والسيارات قليلة.",
        textEn: "Night. A remote, quiet highway rest stop, dim lights and few cars.",
      },
      {
        kind: "beat",
        text: "سيارة الشباب تدخل المحطة… ينزلون ويتوجهون للكوفي.",
        textEn: "The friends' car pulls in… they get out and head for the coffee shop.",
      },
      {
        kind: "narration",
        text: "راشد مستانس ويضحك مع ربعه، والكلام كله يدور حوله.",
        textEn: "Rashid is in high spirits, laughing with his friends, the night revolving around him.",
      },
      {
        kind: "beat",
        text: "وبين المجموعة… واحد ساكت أكثر من اللازم.",
        textEn: "And among them… one of them is far too quiet.",
      },
    ],
    cta: "كمل",
    ctaEn: "Continue",
  },
  {
    id: "cafe",
    label: "المشهد ٢ — داخل الكوفي",
    labelEn: "Scene 2 — Inside the coffee shop",
    image: coffeeShop,
    dim: 0.44,
    lines: [
      {
        kind: "beat",
        text: "الشباب قاعدين مع بعض، والجو طبيعي.",
        textEn: "They're all sitting together, everything feels normal.",
      },
      { kind: "say", ...RASHID, text: "شدعوه؟ من متى وإنت ساكت؟", textEn: "What's up with you? How long have you been this quiet?" },
      { kind: "say", ...SOMEONE, text: "مافيني شي، بس تعبان شوي.", textEn: "Nothing's wrong, I'm just a bit tired.", anon: true },
      { kind: "say", ...RASHID, text: "إنت دايم تقول مافيني شي.", textEn: "You always say nothing's wrong." },
      {
        kind: "beat",
        text: "يضحكون… وتمر اللحظة عادية.",
        textEn: "They laugh… and the moment passes like any other.",
      },
    ],
    cta: "كمل",
    ctaEn: "Continue",
  },
  {
    id: "tension",
    label: "المشهد ٣ — بداية التوتر",
    labelEn: "Scene 3 — The tension starts",
    image: corridor,
    dim: 0.55,
    lines: [
      { kind: "beat", text: "بعد فترة، راشد يقوم من مكانه.", textEn: "A while later, Rashid gets up." },
      { kind: "say", ...RASHID, text: "بروح الحمام وبرجع.", textEn: "I'm going to the restroom, back in a minute." },
      { kind: "beat", text: "يمشي باتجاه الممر.", textEn: "He walks toward the corridor." },
      {
        kind: "beat",
        text: "بعد لحظات… واحد ثاني يقوم من الطاولة.",
        textEn: "Moments later… someone else gets up from the table.",
      },
      { kind: "say", ...SOMEONE, text: "برجع.", textEn: "Be right back.", anon: true },
      {
        kind: "narration",
        text: "يتجه بنفس الاتجاه. الكاميرا تبقى مع المجموعة.",
        textEn: "He heads the same way. The camera stays with the group.",
      },
    ],
    cta: "كمل",
    ctaEn: "Continue",
  },
  {
    id: "far-bathroom",
    label: "المشهد ٤ — الحمام الطرفي",
    labelEn: "Scene 4 — The far restroom",
    image: farBathroom,
    dim: 0.66,
    lines: [
      {
        kind: "beat",
        text: "راشد يدخل… وبعد ثواني يدخل شخص وراه. الباب ينغلق.",
        textEn: "Rashid goes in… seconds later someone follows him. The door closes.",
      },
      { kind: "narration", text: "أصوات كلام منخفض من الداخل.", textEn: "Low voices from inside." },
      { kind: "say", ...RASHID, text: "خلاص، لا تكبر الموضوع.", textEn: "Enough, don't blow this up." },
      { kind: "say", ...OTHER_VOICE, text: "أنا اللي مكبر الموضوع؟", textEn: "I'm the one blowing it up?", anon: true },
      { kind: "say", ...RASHID, text: "إي، لأن كل شي تحوله منافسة.", textEn: "Yes, because you turn everything into a competition." },
      {
        kind: "say",
        ...OTHER_VOICE,
        text: "مو كل شي عندك سهل مثل ما تتوقع.",
        textEn: "Not everything is as easy as you assume.",
        anon: true,
      },
      { kind: "say", ...RASHID, text: "إحنا ربع، مو داخلين سباق.", textEn: "We're friends, we're not in a race." },
      {
        kind: "narration",
        text: "النبرة تتصاعد… وما نشوف اللي صار.",
        textEn: "The voices rise… and we don't see what happened.",
      },
    ],
    cta: "كمل",
    ctaEn: "Continue",
  },
  {
    id: "incident",
    label: "المشهد ٥ — لحظة الحادث",
    labelEn: "Scene 5 — The moment it happened",
    image: farSink,
    dim: 0.72,
    lines: [
      { kind: "beat", text: "صوت حركة قوية… دفعة.", textEn: "A sharp movement… a shove." },
      {
        kind: "beat",
        text: "راشد يتراجع للخلف ويطيح باتجاه المغسلة.",
        textEn: "Rashid stumbles backward and falls toward the sink.",
      },
      { kind: "beat", text: "صوت ارتطام قوي. صمت.", textEn: "A hard impact. Silence." },
      {
        kind: "narration",
        text: "الأشياء اللي حول المغسلة تطيح… وظل واقف ما يتحرك.",
        textEn: "Things around the sink clatter down… and a figure stands there, not moving.",
      },
      { kind: "say", ...OTHER_VOICE, text: "راشد…؟", textEn: "Rashid…?", anon: true },
      { kind: "beat", text: "لا رد.", textEn: "No answer." },
    ],
    cta: "كمل",
    ctaEn: "Continue",
  },
  {
    id: "cleanup",
    label: "المشهد ٦ — محاولة إخفاء الأثر",
    labelEn: "Scene 6 — Covering the traces",
    image: farSink,
    dim: 0.78,
    lines: [
      {
        kind: "beat",
        text: "الظل يقترب من المغسلة وينظر للحنفية.",
        textEn: "The figure steps to the sink and looks at the tap.",
      },
      {
        kind: "beat",
        text: "يفتح الماء… ويمسح المكان بكلينكس.",
        textEn: "He runs the water… and wipes the area with tissues.",
      },
      {
        kind: "narration",
        text: "لقطات قريبة وسريعة: يد… ماء… حنفية… كلينكس… ونفس متسارع.",
        textEn: "Quick close-ups: a hand… water… the tap… tissues… and racing breath.",
      },
      {
        kind: "beat",
        text: "يوقف الماء. ينظر للباب. يخرج.",
        textEn: "He shuts off the water. Looks at the door. Leaves.",
      },
    ],
    cta: "كمل",
    ctaEn: "Continue",
  },
  {
    id: "trash",
    label: "المشهد ٧ — الزبالة",
    labelEn: "Scene 7 — The trash bin",
    image: trashBin,
    dim: 0.62,
    lines: [
      {
        kind: "beat",
        text: "يمشي باتجاه الكوفي، وقبل ما يدخل يتوقف عند حاوية الزبالة.",
        textEn: "He walks back toward the coffee shop and stops at the trash bin before going in.",
      },
      {
        kind: "beat",
        text: "ينظر حوله… ويرمي الكلينكس داخلها.",
        textEn: "He glances around… and drops the tissues inside.",
      },
      {
        kind: "narration",
        text: "يدخل الكوفي ويتصرف وكأن ما صار شي.",
        textEn: "He walks into the coffee shop and acts as if nothing happened.",
      },
    ],
    cta: "كمل",
    ctaEn: "Continue",
  },
  {
    id: "discovery",
    label: "المشهد ٨ — اكتشاف راشد",
    labelEn: "Scene 8 — Finding Rashid",
    image: corridor,
    dim: 0.6,
    lines: [
      {
        kind: "beat",
        text: "بعد فترة، أحدهم يلاحظ غياب راشد.",
        textEn: "After a while, someone notices Rashid is gone.",
      },
      { kind: "say", who: "مشعل", whoEn: "Mishal", text: "وين راشد؟ طوّل.", textEn: "Where's Rashid? He's taking forever." },
      { kind: "say", ...SOMEONE, text: "يمكن بالحمام.", textEn: "Maybe he's in the restroom.", anon: true },
      {
        kind: "beat",
        text: "يمر وقت قصير… ناصر يروح يدور عليه.",
        textEn: "A short time passes… Nasser goes looking for him.",
      },
      { kind: "say", who: "ناصر", whoEn: "Nasser", text: "شباب… تعالوا.", textEn: "Guys… come here." },
      {
        kind: "narration",
        text: "راشد ملقى قرب المغسلة. صمت… والكاميرا تبتعد ببطء.",
        textEn: "Rashid is lying near the sink. Silence… and the camera slowly pulls away.",
      },
    ],
    cta: "كمل",
    ctaEn: "Continue",
  },
  {
    id: "final",
    label: "المشهد الأخير",
    labelEn: "Final scene",
    image: entrance,
    dim: 0.68,
    title: lastTripCase.title,
    titleEn: lastTripCase.titleEn,
    lines: [
      {
        kind: "narration",
        text: "كلهم كانوا موجودين بنفس المكان… وكل واحد فيهم عنده رواية.",
        textEn: "They were all in the same place… and every one of them has a story.",
      },
      {
        kind: "narration",
        text: "لكن واحد منهم… ما قال الحقيقة.",
        textEn: "But one of them… didn't tell the truth.",
      },
    ],
    cta: "ابدأ التحقيق",
    ctaEn: "Start the investigation",
  },
];

/** علامة «قرأ المقدمة» لكل غرفة/جلسة — تمنع لوب المقدمة بعد الرجوع أو التحديث. */
const introSeenKey = (roomCode: string | null | undefined) =>
  `wr_intro_seen:${LAST_TRIP_CASE_ID}:${roomCode ?? "solo"}`;

function markIntroSeen(roomCode: string | null | undefined) {
  try {
    window.localStorage.setItem(introSeenKey(roomCode), "1");
  } catch {
    /* التخزين غير متاح — الاعتماد على مرحلة الغرفة */
  }
}

function LastTripIntroRoute() {
  const navigate = useNavigate();
  const { lang, dir, pick } = useI18n();
  const { room, isHost, actions } = useRoom();

  const [step, setStep] = useState(0);
  const scene = SCENES[Math.min(step, SCENES.length - 1)]!;

  // المقدمة تمت قراءتها سابقاً (نفس الغرفة/الجلسة) أو القضية بدأت فعلاً →
  // ننتقل مباشرة للمرحلة التالية بدون إعادة عرض المقدمة.
  useEffect(() => {
    const inRoom = !!room && room.caseId === LAST_TRIP_CASE_ID;
    if (inRoom && room && room.phase !== "intro" && room.phase !== "lobby") {
      navigate({ to: "/last-trip/scene", replace: true });
      return;
    }
    let seen = false;
    try {
      seen = window.localStorage.getItem(introSeenKey(room?.code)) === "1";
    } catch {
      seen = false;
    }
    if (seen) navigate({ to: "/last-trip/scene", replace: true });
  }, [room, navigate]);

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

  const finishIntro = () => {
    markIntroSeen(room?.code);
    // المضيف يحرّك الغرفة للمرحلة التالية فيتبعه بقية الفريق تلقائياً.
    if (room && room.caseId === LAST_TRIP_CASE_ID && isHost && room.phase === "intro") {
      actions.setPhase("investigation");
    }
    navigate({ to: "/last-trip/scene", replace: true });
  };

  const advance = () => {
    if (!done) {
      skipToEndOfScene();
      return;
    }
    if (step >= SCENES.length - 1) {
      finishIntro();
      return;
    }
    setStep((n) => n + 1);
  };


  const NextIcon = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <main dir={dir} className="relative min-h-screen overflow-hidden bg-background">
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
          {pick(scene.label, scene.labelEn)}
        </p>

        {scene.title && shown >= 1 && (
          <h1 className="intro-line mt-6 text-4xl font-black leading-tight sm:text-6xl">
            {pick(scene.title, scene.titleEn)}
          </h1>
        )}

        <div className="mt-8 w-full max-w-xl space-y-3">
          {scene.lines.slice(0, shown).map((line, i) =>
            line.kind === "say" ? (
              <div
                key={`${scene.id}-${i}`}
                className="intro-line flex items-start gap-3 rounded-2xl border border-border/70 bg-background/55 px-5 py-4 text-start backdrop-blur-sm"
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
                    {pick(line.who, line.whoEn)}
                  </span>
                  <span className="mt-1 block text-base leading-relaxed">
                    «{pick(line.text, line.textEn)}»
                  </span>
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
                {pick(line.text, line.textEn)}
              </p>
            ),
          )}
        </div>

        <div className="mt-10 flex w-full max-w-sm flex-col gap-3">
          <ActionButton className="w-full py-3.5 text-base" onClick={advance}>
            {done ? pick(scene.cta, scene.ctaEn) : lastTripT(lang, "skipWaiting")}{" "}
            {done && step >= SCENES.length - 1 ? (
              <Search className="size-4" />
            ) : (
              <NextIcon className="size-4" />
            )}
          </ActionButton>
          <Link
            to="/last-trip/scene"
            className="font-mono text-[11px] text-muted-foreground underline-offset-4 hover:underline"
          >
            {lastTripT(lang, "skipIntro")}
          </Link>
        </div>
      </div>
    </main>
  );
}
