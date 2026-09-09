/**
 * تعيين كلمة سر جديدة بعد فتح رابط الاستعادة.
 *
 * الصفحة عامة (بدون حماية) لأن جلسة الاستعادة تجي من الرابط نفسه. لو الرابط
 * منتهي أو غلط نعرض رسالة واضحة مع زر «إرسال رابط جديد».
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";

import { ActionButton } from "@/components/game/shell";
import { Eyebrow } from "@/components/game/ui";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "كلمة سر جديدة — ورا السالفة" },
      {
        name: "description",
        content: "اختر كلمة سر جديدة لحسابك في ورا السالفة بعد فتح رابط الاستعادة.",
      },
      { property: "og:title", content: "كلمة سر جديدة — ورا السالفة" },
      { property: "og:description", content: "إعادة تعيين كلمة السر في لعبة ورا السالفة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { pick, dir } = useI18n();
  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // جلسة الاستعادة تُلتقط من الرابط (hash أو code) عبر عميل المصادقة.
  useEffect(() => {
    let alive = true;
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      setReady(!!data.session?.user);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(!!session?.user);
    });
    void check();
    const t = window.setTimeout(() => void check(), 1200);
    return () => {
      alive = false;
      window.clearTimeout(t);
      window.clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, []);

  const save = async () => {
    setError(null);
    if (password.length < 6) {
      setError(pick("كلمة السر لازم ٦ حروف على الأقل", "Password must be at least 6 characters"));
      return;
    }
    if (password !== confirm) {
      setError(pick("كلمتا السر ما تطابقن", "The passwords don't match"));
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setBusy(false);
      setError(
        pick(
          "ما قدرنا نغيّر كلمة السر — يمكن الرابط منتهي. أرسل رابط جديد وحاول مرة ثانية.",
          "We couldn't change your password — the link may have expired. Request a new link and try again.",
        ),
      );
      return;
    }
    await supabase.auth.signOut();
    setBusy(false);
    navigate({ to: "/auth", search: { reset: "1" } as never });
  };

  return (
    <div dir={dir} className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <Link
          to="/auth"
          className="inline-flex items-center gap-1.5 font-display text-xs text-muted-foreground hover:text-foreground"
        >
          {pick("رجوع لتسجيل الدخول", "Back to sign in")}{" "}
          <ArrowRight className={`size-3.5 ${dir === "ltr" ? "rotate-180" : ""}`} />
        </Link>

        <div className="surface-panel cine-in mt-6 p-6">
          <span className="grid size-11 place-items-center rounded-2xl border border-border bg-secondary/60">
            <KeyRound className="size-5 text-primary" />
          </span>
          <Eyebrow className="mt-4">{pick("استعادة الحساب", "Account recovery")}</Eyebrow>
          <h1 className="mt-1 text-2xl font-bold">{pick("كلمة سر جديدة", "New password")}</h1>

          {ready === false ? (
            <>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {pick(
                  "الرابط منتهي أو غير صحيح. أرسل رابط جديد لإعادة تعيين كلمة السر.",
                  "This link is invalid or expired. Request a new password reset link.",
                )}
              </p>
              <Link
                to="/auth"
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 font-display text-sm font-bold text-primary-foreground"
              >
                {pick("إرسال رابط جديد", "Send a new link")}
              </Link>
            </>
          ) : ready === null ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {pick("لحظة، نتحقق من الرابط…", "One moment, checking the link…")}
            </p>
          ) : (
            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
            >
              <label className="block">
                <span className="mb-2 block text-sm text-muted-foreground">
                  {pick("كلمة السر الجديدة", "New password")}
                </span>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  dir="ltr"
                  className="w-full rounded-xl border border-input bg-surface-2 px-4 py-3 text-base outline-none focus:border-primary/60"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-muted-foreground">
                  {pick("تأكيد كلمة السر", "Confirm password")}
                </span>
                <input
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
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

              <ActionButton type="submit" disabled={busy} className="w-full py-3.5 text-base">
                {busy ? pick("لحظة...", "One moment...") : pick("حفظ كلمة السر", "Save password")}
              </ActionButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
