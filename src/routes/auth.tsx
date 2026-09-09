import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { ActionButton } from "@/components/game/shell";
import { Eyebrow } from "@/components/game/ui";
import { GAME_NAME } from "@/game/game-meta";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/activity";
import { useI18n } from "@/i18n";

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
  const { pick, dir } = useI18n();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [pasted, setPasted] = useState("");


  useEffect(() => {
    const url = new URL(window.location.href);
    const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
    if (url.searchParams.get("reset") === "1") {
      setMode("in");
      setMsg(
        pick(
          "تم تغيير كلمة السر بنجاح — سجّل دخولك بكلمة السر الجديدة.",
          "Your password was changed — sign in with the new password.",
        ),
      );
      window.history.replaceState({}, "", "/auth");
      return;
    }
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
      setError(pick("اكتب إيميل صحيح", "Enter a valid email address"));
      return;
    }
    if (password.length < 6) {
      setError(pick("كلمة السر لازم ٦ حروف على الأقل", "Password must be at least 6 characters"));
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
        setError(pick("الإيميل أو كلمة السر غلط", "Wrong email or password"));
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
      setError(pick("ما قدرنا نسجّل الحساب، جرب إيميل ثاني", "We couldn't create the account — try another email"));
      return;
    }
    void trackEvent("signup", { path: "/auth" });
    setPending(true);
    setMsg(
      pick(
        "تم إنشاء الحساب وأرسلنا لك إيميل التأكيد. افتح الإيميل واضغط على سطر «تأكيد البريد الإلكتروني» — كل السطر رابط قابل للضغط، وإذا ما ظهر لك زر واضح انسخ الرابط والصقه في المتصفح. بعد التأكيد ارجع هنا وسجّل دخول.",
        "Your account was created and we sent you a confirmation email. Open it and tap the \"Confirm your email\" line — the whole line is a link. If you don't see a clear button, copy the link and paste it into your browser. Once confirmed, come back here and sign in.",
      ),
    );
  };

  /** إرسال رابط إعادة تعيين كلمة السر لنفس نظام المصادقة الحالي. */
  const sendReset = async () => {
    setError(null);
    setMsg(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError(
        pick(
          "اكتب إيميلك أولاً عشان نرسل لك رابط إعادة التعيين",
          "Enter your email first so we can send the reset link",
        ),
      );
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (err) {
      setError(
        pick(
          "ما قدرنا نرسل رابط إعادة التعيين، جرب بعد شوي",
          "We couldn't send the reset link — try again shortly",
        ),
      );
      return;
    }
    setMsg(
      pick(
        "أرسلنا لك رابط إعادة تعيين كلمة السر على إيميلك. افتح الرابط واختر كلمة سر جديدة، وإذا ما ظهر لك زر واضح انسخ الرابط والصقه في المتصفح.",
        "We emailed you a password reset link. Open it and choose a new password; if you don't see a clear button, copy the link and paste it into your browser.",
      ),
    );
  };

  const verifyPastedLink = async () => {
    setError(null);
    setMsg(null);
    const raw = pasted.trim();
    if (!raw) {
      setError(pick("الصق الرابط اللي وصلك في الإيميل", "Paste the link you received in the email"));
      return;
    }
    let tokenHash: string | null = null;
    let otpType: string | null = null;
    try {
      const u = new URL(raw);
      const hash = new URLSearchParams(u.hash.replace(/^#/, ""));
      tokenHash = u.searchParams.get("token_hash") || u.searchParams.get("token") || hash.get("token_hash");
      otpType = u.searchParams.get("type") || hash.get("type");
      if (!tokenHash && hash.get("access_token")) {
        // Link already contains a session — just follow it.
        window.location.href = raw;
        return;
      }
    } catch {
      // Maybe the user pasted only the token itself.
      if (/^[A-Za-z0-9_-]{6,}$/.test(raw)) tokenHash = raw;
    }
    if (!tokenHash) {
      setError(
        pick(
          "الرابط غير مكتمل، انسخه كامل من الإيميل وجرب مرة ثانية",
          "That link is incomplete — copy the full link from the email and try again",
        ),
      );
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.verifyOtp({
      type: (otpType as "signup" | "email" | "magiclink" | "recovery") || "signup",
      token_hash: tokenHash,
    });
    setBusy(false);
    if (err) {
      setError(
        pick(
          "الرابط منتهي أو غير صحيح، أعد إرسال إيميل التأكيد وجرب الرابط الجديد",
          "That link expired or is invalid — resend the confirmation email and use the new link",
        ),
      );
      return;
    }
    await supabase.auth.signOut();
    setPasted("");
    setPending(false);
    setConfirmed(true);
    setMode("in");
    setMsg(pick("تم تأكيد بريدك، سجّل دخولك الحين.", "Your email is confirmed — sign in now."));
  };

  const resend = async () => {
    setError(null);
    setMsg(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError(pick("اكتب إيميلك عشان نعيد الإرسال", "Enter your email so we can resend it"));
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth?confirmed=1` },
    });
    setBusy(false);
    if (err) {
      setError(
        pick(
          "ما قدرنا نعيد الإرسال الحين، جرب بعد دقيقة",
          "We couldn't resend it right now — try again in a minute",
        ),
      );
      return;
    }
    setMsg(
      pick(
        "أرسلنا لك إيميل تأكيد جديد. تأكد من مجلد الإعلانات أو الـSpam.",
        "We sent a new confirmation email. Check your promotions or spam folder too.",
      ),
    );
  };


  return (
    <div dir={dir} className="min-h-screen bg-background">
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
            {pick("القضايا", "Cases")}{" "}
            <ArrowRight className={`size-3.5 ${dir === "ltr" ? "rotate-180" : ""}`} />
          </Link>
        </header>

        {confirmed && (
          <div className="cine-in mt-8 rounded-xl border border-evidence/50 bg-evidence/15 px-4 py-3.5 text-sm font-medium text-evidence">
            {pick(
              "تم تأكيد بريدك الإلكتروني بنجاح، تقدر تسجل الدخول الحين.",
              "Your email was confirmed — you can sign in now.",
            )}
          </div>
        )}

        <div className="surface-panel cine-in mt-6 p-6">
          <Eyebrow>{pick("حساب اللاعب", "Player account")}</Eyebrow>
          <h1 className="mt-1 text-2xl font-bold">
            {mode === "in" ? pick("دخول", "Sign in") : pick("حساب جديد", "New account")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {pick(
              "الحساب يحتاجه اللي بيشتري القضية ويفتح الغرفة. باقي اللاعبين يدخلون برمز الغرفة بدون حساب وبدون شراء.",
              "Only the person who buys the case and opens the room needs an account. Everyone else joins with the room code — no account, no purchase.",
            )}
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <label className="block">
              <span className="mb-2 block text-sm text-muted-foreground">{pick("الإيميل", "Email")}</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                dir="ltr"
                className="w-full rounded-xl border border-input bg-surface-2 px-4 py-3 text-base outline-none focus:border-primary/60"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-muted-foreground">{pick("كلمة السر", "Password")}</span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                dir="ltr"
                className="w-full rounded-xl border border-input bg-surface-2 px-4 py-3 text-base outline-none focus:border-primary/60"
              />
              {mode === "in" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void sendReset()}
                  className="mt-2 font-display text-xs text-primary transition-colors hover:text-foreground disabled:opacity-60"
                >
                  {pick("نسيت كلمة السر؟", "Forgot your password?")}
                </button>
              )}
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
              {busy
                ? pick("لحظة...", "One moment...")
                : mode === "in"
                  ? pick("دخول", "Sign in")
                  : pick("إنشاء حساب", "Create account")}
            </ActionButton>
          </form>

          {(pending || mode === "up") && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void resend()}
              className="mt-3 w-full rounded-xl border border-evidence/50 bg-evidence/10 px-4 py-2.5 font-display text-xs text-evidence transition-colors hover:bg-evidence/20 disabled:opacity-60"
            >
              {pick("ما وصلك إيميل التأكيد؟ أعد الإرسال", "No confirmation email? Resend it")}
            </button>
          )}

          <div className="mt-5 rounded-xl border border-border bg-surface-2 p-4">
            <p className="text-sm font-medium">{pick("تأكيد بلصق الرابط", "Confirm by pasting the link")}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {pick(
                "إذا الزر في الإيميل ما ظهر لك، انسخ رابط التأكيد من الإيميل والصقه هنا ونأكّد لك بريدك مباشرة.",
                "If the button in the email didn't show up, copy the confirmation link from the email and paste it here and we'll confirm your address right away.",
              )}
            </p>
            <textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              dir="ltr"
              rows={3}
              placeholder="https://..."
              className="mt-3 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-xs outline-none focus:border-primary/60"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void verifyPastedLink()}
              className="mt-2 w-full rounded-xl border border-primary/50 bg-primary/10 px-4 py-2.5 font-display text-xs text-primary transition-colors hover:bg-primary/20 disabled:opacity-60"
            >
              {busy ? pick("لحظة...", "One moment...") : pick("أكّد بريدي من الرابط", "Confirm my email from the link")}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "in" ? "up" : "in");
              setError(null);
              setMsg(null);
            }}
            className="mt-4 w-full font-display text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {mode === "in"
              ? pick("ما عندك حساب؟ سجّل حساب جديد", "No account? Create one")
              : pick("عندك حساب؟ سجّل دخول", "Already have an account? Sign in")}
          </button>
        </div>
      </div>
    </div>
  );
}
