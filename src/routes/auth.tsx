import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { ActionButton } from "@/components/game/shell";
import { Eyebrow } from "@/components/game/ui";
import { GAME_NAME } from "@/game/game-meta";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "حسابك — ورا السالفة" },
      {
        name: "description",
        content: "سجّل دخولك في ورا السالفة عشان تحتفظ بقضاياك المشتراة وتفتح غرف التحقيق.",
      },
      { property: "og:title", content: "حسابك — ورا السالفة" },
      { property: "og:description", content: "دخول وتسجيل حساب داخل لعبة ورا السالفة." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
    const isConfirmed =
      url.searchParams.get("confirmed") === "1" ||
      hash.get("type") === "signup" ||
      url.searchParams.get("type") === "signup";
    if (isConfirmed) {
      setConfirmed(true);
      setMode("in");
      // Keep verification-only sessions out of the way: the user signs in explicitly.
      void supabase.auth.signOut();
      window.history.replaceState({}, "", "/auth");
    }
  }, []);


  const submit = async () => {
    setError(null);
    setMsg(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("اكتب إيميل صحيح");
      return;
    }
    if (password.length < 6) {
      setError("كلمة السر لازم ٦ حروف على الأقل");
      return;
    }
    setBusy(true);
    if (mode === "in") {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setBusy(false);
      if (err) {
        setError("الإيميل أو كلمة السر غلط");
        return;
      }
      navigate({ to: "/cases" });
      return;
    }
    const { error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth?confirmed=1` },
    });
    setBusy(false);
    if (err) {
      setError("ما قدرنا نسجّل الحساب، جرب إيميل ثاني");
      return;
    }
    setMsg("تم إنشاء الحساب. تحقق من إيميلك للتأكيد بعدها سجّل دخول.");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg file-tape">
              <ShieldAlert className="size-4.5" />
            </span>
            <span className="font-display text-sm font-bold">{GAME_NAME}</span>
          </Link>
          <Link
            to="/cases"
            className="inline-flex items-center gap-1.5 font-display text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            القضايا <ArrowRight className="size-3.5" />
          </Link>
        </header>

        <div className="surface-panel cine-in mt-10 p-6">
          <Eyebrow>حساب اللاعب</Eyebrow>
          <h1 className="mt-1 text-2xl font-bold">
            {mode === "in" ? "دخول" : "حساب جديد"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            الحساب يحتاجه اللي بيشتري القضية ويفتح الغرفة. باقي اللاعبين يدخلون برمز الغرفة
            بدون حساب وبدون شراء.
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <label className="block">
              <span className="mb-2 block text-sm text-muted-foreground">الإيميل</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                dir="ltr"
                className="w-full rounded-xl border border-input bg-surface-2 px-4 py-3 text-base outline-none focus:border-primary/60"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-muted-foreground">كلمة السر</span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                dir="ltr"
                className="w-full rounded-xl border border-input bg-surface-2 px-4 py-3 text-base outline-none focus:border-primary/60"
              />
            </label>

            {error && (
              <p className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
                {error}
              </p>
            )}
            {msg && (
              <p className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-muted-foreground">
                {msg}
              </p>
            )}

            <ActionButton type="submit" disabled={busy} className="w-full py-3.5 text-base">
              {busy ? "لحظة..." : mode === "in" ? "دخول" : "إنشاء حساب"}
            </ActionButton>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "in" ? "up" : "in");
              setError(null);
              setMsg(null);
            }}
            className="mt-4 w-full font-display text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {mode === "in" ? "ما عندك حساب؟ سجّل حساب جديد" : "عندك حساب؟ سجّل دخول"}
          </button>
        </div>
      </div>
    </div>
  );
}
