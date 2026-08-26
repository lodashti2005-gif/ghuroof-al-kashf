import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  Gauge,
  Lock,
  Play,
  ShieldAlert,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Eyebrow } from "@/components/game/ui";
import { GAME_NAME, GAME_TAGLINE } from "@/game/game-meta";
import { useCaseStore, type StoreCase } from "@/game/entitlements";
import { formatCasePrice } from "@/game/pricing";

export const Route = createFileRoute("/cases")({
  head: () => ({
    meta: [
      { title: "متجر القضايا — ورا السالفة" },
      {
        name: "description",
        content:
          "متجر قضايا ورا السالفة: اختر قضية، شوف صعوبتها وعدد اللاعبين ومدة اللعب، واشترِ القضية مرة واحدة وادعُ أصحابك برمز الغرفة.",
      },
      { property: "og:title", content: "متجر القضايا — ورا السالفة" },
      {
        property: "og:description",
        content: "كل قضية لها سالفة... دوركم تعرفون وراها شنو.",
      },
    ],
  }),
  component: CasesPage,
});

function CasesPage() {
  const { cases, myCases, signedIn, loading } = useCaseStore();

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
          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="font-display text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {signedIn ? "حسابك" : "دخول"}
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 font-display text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              الرئيسية <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </header>

        <div className="cine-in mt-10">
          <Eyebrow>متجر القضايا</Eyebrow>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-5xl">القضايا</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {GAME_TAGLINE}
          </p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            واحد بس يشتري القضية ويفتح الغرفة — باقي الفريق يدخلون برمز الغرفة بدون شراء.
          </p>
        </div>


        <section className="mt-8">
          <h2 className="font-display text-sm font-bold text-muted-foreground">كل القضايا</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {cases.map((item) => (
              <CaseCard key={item.id} item={item} signedIn={signedIn} />
            ))}

          </div>
        </section>

        <section className="mt-12 pb-6">
          <h2 className="font-display text-sm font-bold text-muted-foreground">قضاياي</h2>
          {loading ? (
            <p className="mt-3 text-sm text-muted-foreground">جاري التحميل...</p>
          ) : myCases.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              ما عندك قضايا حالياً. اشترِ قضية وتظهر لك هنا.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {myCases.map((item) => (
                <div
                  key={item.id}
                  className="surface-panel flex items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-bold">{item.title}</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 font-mono text-[11px] text-primary">
                      <BadgeCheck className="size-3.5" /> {item.free ? "متاحة" : "تم الشراء ✓"}
                    </p>
                  </div>
                  <Link
                    to={item.id === "last-trip" ? "/last-trip/lobby" : "/play"}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 font-display text-xs font-bold text-primary-foreground"
                  >
                    <Play className="size-3.5" /> ابدأ القضية
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function CaseCard({ item, signedIn }: { item: StoreCase; signedIn: boolean }) {

  const soon = item.status === "soon";

  return (
    <article
      className={`surface-panel flex flex-col overflow-hidden transition-colors ${
        item.owned ? "hover:border-primary/50" : ""
      }`}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <img
          src={item.cover}
          alt={`غلاف ${item.title}`}
          loading="lazy"
          width={1280}
          height={800}
          className={`size-full object-cover ${item.owned ? "" : "opacity-55 grayscale-[35%]"}`}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, oklch(0 0 0 / 0.85), transparent 65%)" }}
          aria-hidden="true"
        />
        <span
          className={`absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-display text-[11px] backdrop-blur ${
            item.owned
              ? "border-primary/40 bg-primary/15 text-primary"
              : "border-border bg-background/70 text-muted-foreground"
          }`}
        >
          {item.owned ? (
            <>
              <BadgeCheck className="size-3.5" /> {item.free ? "متاحة" : "تم الشراء ✓"}
            </>
          ) : (
            <>
              <Lock className="size-3.5" /> مقفلة
            </>
          )}
        </span>
        <div className="absolute bottom-3 right-4 left-4">
          <span className="font-mono text-[11px] text-muted-foreground">ملف {item.code}</span>
          <h3 className="text-xl font-bold sm:text-2xl">{item.title}</h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">{item.teaser}</p>

        <ul className="grid grid-cols-2 gap-2 font-mono text-[11px] text-muted-foreground">
          <li className="inline-flex items-center gap-1.5">
            <Gauge className="size-3.5" /> {item.difficulty}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" /> {item.players}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Clock3 className="size-3.5" /> {item.playTime}
          </li>
          {item.suspects ? (
            <li className="inline-flex items-center gap-1.5">
              <ShieldAlert className="size-3.5" /> {item.suspects} مشتبهين
            </li>
          ) : null}
        </ul>

        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
          <span className="font-display text-sm font-bold">
            {item.free ? "متاحة للتجربة" : formatCasePrice(item.id)}
          </span>

          <span className="font-mono text-[11px] text-muted-foreground">
            {soon ? "قيد التجهيز" : item.owned ? (item.id === "last-trip" ? "متاحة للتجربة" : "متاحة") : "تحتاج شراء"}
          </span>
        </div>

        <div className="mt-auto">
          {item.owned ? (
            <Link
              to={item.id === "last-trip" ? "/last-trip/lobby" : "/play"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-display text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              <Play className="size-4" /> ابدأ القضية
            </Link>
          ) : soon ? (
            <button
              type="button"
              disabled
              className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-5 py-3 font-display text-sm font-bold text-muted-foreground"
            >
              <Lock className="size-4" /> قيد التجهيز
            </button>
          ) : (
            <Link
              to="/purchase/$caseId"
              params={{ caseId: item.id }}
              search={{ room: undefined }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/50 bg-primary/10 px-5 py-3 font-display text-sm font-bold text-primary transition-colors hover:bg-primary/20"
            >
              <ShoppingCart className="size-4" /> شراء القضية
            </Link>

          )}
          {!item.owned && !soon && !signedIn && (
            <p className="mt-2 text-center font-mono text-[11px] text-muted-foreground">
              الشراء يحتاج حساب — <Link to="/auth" className="text-primary">دخول</Link>
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
