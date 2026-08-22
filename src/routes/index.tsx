import { createFileRoute, Link } from "@tanstack/react-router";
import { Fingerprint, Files, ShieldAlert } from "lucide-react";

import heroScene from "@/assets/scene-hero.jpg";
import { Eyebrow } from "@/components/game/ui";
import { GAME_NAME, GAME_SUBTITLE, playableCases } from "@/game/game-meta";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ورا السالفة — لعبة قضايا غامضة جماعية" },
      {
        name: "description",
        content:
          "ورا السالفة: منصة قضايا غامضة بالعربي تلعبونها مع أصحابكم. اختاروا قضية، حققوا مع المشتبهين، واكشفوا القاتل قبل ما ينتهي الوقت.",
      },
      { property: "og:title", content: "ورا السالفة — كل قضية لها سالفة" },
      {
        property: "og:description",
        content: "لعبة تحقيق جماعية بالعربي. اختاروا قضية وابدأوا التحقيق.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <img
        src={heroScene}
        alt="غرفة تحقيق معتمة"
        width={1920}
        height={1088}
        className="absolute inset-0 size-full object-cover opacity-60"
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

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col justify-between gap-10 px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg file-tape">
              <ShieldAlert className="size-4.5" />
            </span>
            <span className="font-display text-sm font-bold">إدارة التحقيقات</span>
          </div>
          <Link
            to="/cases"
            className="font-display text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            القضايا
          </Link>
        </header>

        <div className="cine-in max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1.5">
            <span className="size-1.5 rounded-full bg-primary blink-record" />
            <span className="font-display text-xs tracking-wide text-primary">
              لعبة تحقيق جماعية · بالكويتي
            </span>
          </div>

          <h1 className="text-5xl font-extrabold leading-[1.15] sm:text-7xl">{GAME_NAME}</h1>
          <p className="mt-4 max-w-xl font-display text-lg text-muted-foreground sm:text-2xl">
            {GAME_SUBTITLE}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/cases"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 font-display text-base font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              <Fingerprint className="size-4.5" /> ابدأ اللعب
            </Link>
            <Link
              to="/cases"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-2/70 px-7 py-3.5 font-display text-base font-bold text-foreground transition-colors hover:border-primary/60"
            >
              <Files className="size-4.5" /> القضايا
            </Link>
          </div>
        </div>

        <footer className="grid gap-3 border-t border-border/60 pt-6 sm:grid-cols-3">
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
