import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Lock, Play, ShieldAlert, Users } from "lucide-react";

import { Eyebrow } from "@/components/game/ui";
import { GAME_NAME, caseRegistry, type CaseSummary } from "@/game/game-meta";

export const Route = createFileRoute("/cases")({
  head: () => ({
    meta: [
      { title: "اختر القضية — ورا السالفة" },
      {
        name: "description",
        content:
          "اختر قضية من ملفات ورا السالفة وابدأ التحقيق الجماعي مع أصحابك. قضية الشاليه متاحة الآن وقضايا جديدة قريباً.",
      },
      { property: "og:title", content: "اختر القضية — ورا السالفة" },
      {
        property: "og:description",
        content: "ملفات القضايا المتاحة داخل لعبة ورا السالفة.",
      },
    ],
  }),
  component: CasesPage,
});

function CasesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg file-tape">
              <ShieldAlert className="size-4.5" />
            </span>
            <span className="font-display text-sm font-bold">{GAME_NAME}</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 font-display text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            الرئيسية <ArrowRight className="size-3.5" />
          </Link>
        </header>

        <div className="cine-in mt-10">
          <Eyebrow>ملفات التحقيق</Eyebrow>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-5xl">اختر القضية</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            كل قضية لها ضحية، مشتبهين، وأدلة خاصة بها — بس نفس فريق التحقيق ونفس الأدوار.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {caseRegistry.map((item) => (
            <CaseCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CaseCard({ item }: { item: CaseSummary }) {
  const available = item.status === "available";

  return (
    <article
      className={`surface-panel flex flex-col gap-4 p-5 transition-colors ${
        available ? "hover:border-primary/50" : "opacity-70"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="font-mono text-xs text-muted-foreground">ملف {item.code}</span>
          <h2 className="mt-1 text-xl font-bold sm:text-2xl">{item.title}</h2>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 font-display text-[11px] ${
            available
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border bg-surface-2 text-muted-foreground"
          }`}
        >
          {available ? "متاحة" : "قريباً"}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>

      {item.suspects ? (
        <p className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          <Users className="size-3.5" /> {item.suspects} مشتبهين
        </p>
      ) : null}

      <div className="mt-auto pt-1">
        {available ? (
          <Link
            to="/play"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-display text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            <Play className="size-4" /> ابدأ القضية
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-5 py-3 font-display text-sm font-bold text-muted-foreground"
          >
            <Lock className="size-4" /> قريباً
          </button>
        )}
      </div>
    </article>
  );
}
