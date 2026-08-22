import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, Fingerprint, KeyRound, ShieldAlert, X } from "lucide-react";
import { useState } from "react";

import heroScene from "@/assets/scene-hero.jpg";
import { ActionButton } from "@/components/game/shell";
import { Eyebrow } from "@/components/game/ui";
import { GAME_NAME, GAME_TAGLINE, activeCase } from "@/game/game-meta";
import { useRoom } from "@/game/use-room";


export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "قضية الشاليه — ابدأ التحقيق | ورا السالفة" },
      {
        name: "description",
        content:
          "لعبة تحقيق جماعية بالعربي. اجمعوا أصحابكم بغرفة واحدة، حققوا مع المشتبهين، واكشفوا قاتل بدر في قضية الشاليه.",
      },
      { property: "og:title", content: "ورا السالفة — قضية الشاليه" },

      { property: "og:description", content: "الحقيقة ما تنقال... تنكشف. لعبة تحقيق جماعية." },
    ],
  }),
  component: PlayCase,
});

type Mode = null | "create" | "join";

function PlayCase() {
  const [mode, setMode] = useState<Mode>(null);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <img
        src={heroScene}
        alt="مسرح جريمة داخل شاليه معتم"
        width={1920}
        height={1088}
        className="absolute inset-0 size-full object-cover opacity-70"
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

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col justify-between px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg file-tape">
              <ShieldAlert className="size-4.5" />
            </span>
            <span className="font-display text-sm font-bold">إدارة التحقيقات</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/cases"
              className="font-display text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              القضايا
            </Link>
            <span className="hidden font-mono text-xs text-muted-foreground sm:block">
              ملف {activeCase.code} · سري
            </span>
          </div>
        </header>


        <div className="cine-in max-w-2xl py-14">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1.5">
            <span className="size-1.5 rounded-full bg-primary blink-record" />
            <span className="font-display text-xs tracking-wide text-primary">
              قضية مفتوحة · أربعة مشتبهين
            </span>
          </div>

          <h1 className="text-5xl font-extrabold leading-[1.15] sm:text-7xl">{GAME_NAME}</h1>
          <p className="mt-3 font-display text-xl font-bold text-primary sm:text-3xl">
            {activeCase.title}
          </p>
          <p className="mt-3 font-display text-base text-muted-foreground sm:text-xl">
            {GAME_TAGLINE}
          </p>

          <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            جمعة أصحاب، غرفة واحدة، وقضية قتل ما تنحل إلا بالتناقضات. حققوا مع المشتبهين، اجمعوا
            الأدلة، وصوتوا على القاتل قبل ما ينتهي الوقت.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ActionButton onClick={() => setMode("create")} className="px-7 py-3.5 text-base">
              <Fingerprint className="size-4.5" /> ابدأ التحقيق
            </ActionButton>
            <ActionButton
              variant="outline"
              onClick={() => setMode("join")}
              className="px-7 py-3.5 text-base"
            >
              <KeyRound className="size-4.5" /> انضم لغرفة
            </ActionButton>
          </div>
        </div>

        <footer className="grid gap-3 border-t border-border/60 pt-6 sm:grid-cols-3">
          {[
            { k: "الضحية", v: "بدر · 32 سنة" },
            { k: "الموقع", v: "شاليه خاص – الكويت" },
            { k: "وقت الوفاة", v: "01:40 – 02:00 فجراً" },
          ].map((row) => (
            <div key={row.k} className="min-w-0">
              <Eyebrow>{row.k}</Eyebrow>
              <p className="mt-1 truncate text-sm">{row.v}</p>
            </div>
          ))}
        </footer>
      </div>

      {mode && <EntryModal mode={mode} onClose={() => setMode(null)} />}
    </div>
  );
}

function EntryModal({ mode, onClose }: { mode: "create" | "join"; onClose: () => void }) {
  const { actions } = useRoom();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const nickname = name.trim();
    if (nickname.length < 2) {
      setError("اكتب اسم من حرفين على الأقل");
      return;
    }
    if (mode === "join" && !/^\d{6}$/.test(code.trim())) {
      setError("رمز الغرفة لازم يكون 6 أرقام");
      return;
    }
    setError(null);
    setBusy(true);
    const res =
      mode === "create"
        ? await actions.createRoom(nickname)
        : await actions.joinRoom(code.trim(), nickname);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "ما قدرنا ندخلك الغرفة");
      return;
    }
    navigate({ to: "/lobby" });
  };


  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/85 p-4 backdrop-blur-sm">
      <div className="surface-panel cine-in w-full max-w-md p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Eyebrow>{mode === "create" ? "غرفة جديدة" : "دخول غرفة"}</Eyebrow>
            <h2 className="mt-1 text-2xl font-bold">
              {mode === "create" ? "ابدأ التحقيق" : "انضم لغرفة"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="grid size-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Field label="اسمك بالتحقيق">
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="مثال: أبو خالد"
              maxLength={18}
              className="w-full rounded-xl border border-input bg-surface-2 px-4 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/60"
            />
          </Field>

          {mode === "join" && (
            <Field label="رمز الغرفة (6 أرقام)">
              <input
                value={code}
                inputMode="numeric"
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setError(null);
                }}
                placeholder="000000"
                dir="ltr"
                className="w-full rounded-xl border border-input bg-surface-2 px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] outline-none focus:border-primary/60"
              />
            </Field>
          )}

          {error && (
            <p className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
              {error}
            </p>
          )}

          <ActionButton type="submit" disabled={busy} className="w-full py-3.5 text-base">
            {busy ? "لحظة..." : mode === "create" ? "أنشئ الغرفة" : "دخول"}{" "}
            <ArrowLeft className="size-4" />
          </ActionButton>

        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
