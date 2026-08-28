import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Loader2, Mail, MessageCircle, Send, ShieldAlert, User } from "lucide-react";
import { useState } from "react";

import { GAME_NAME } from "@/game/game-meta";
import { Eyebrow } from "@/components/game/ui";
import { submitContact } from "@/lib/contact.functions";
import { cn } from "@/lib/utils";

const BRAND_NAME = "ورا السالفة | Wara Al Salfa";
const CONTACT_EMAIL = "contact@waralsalfa.com";
const WHATSAPP_LINK = "https://wa.me/+96551270774";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — ورا السالفة" },
      {
        name: "description",
        content:
          "تواصل مع فريق ورا السالفة لأي استفسار، دعم فني، أو طلب استرجاع.",
      },
      { property: "og:title", content: "Contact Us — ورا السالفة" },
      {
        property: "og:description",
        content:
          "تواصل مع فريق ورا السالفة لأي استفسار، دعم فني، أو طلب استرجاع.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactPage,
});

const SUBJECTS = [
  { value: "support", label: "دعم فني" },
  { value: "purchase", label: "مشكلة في الشراء" },
  { value: "refund", label: "طلب استرجاع" },
  { value: "feedback", label: "اقتراح أو ملاحظة" },
  { value: "business", label: "شراكة أو تواصل تجاري" },
  { value: "other", label: "موضوع آخر" },
];

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError("");

    try {
      await submitContact({ data: form });
      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "صار خطأ. جرّب مرة ثانية.");
    }
  };

  const field = (key: keyof typeof form, label: string, props?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold">{label}</span>
      <input
        {...props}
        value={form[key]}
        onChange={(e) => setForm((s) => ({ ...s, [key]: e.target.value }))}
        className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/60 focus:bg-secondary"
      />
    </label>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg file-tape">
              <ShieldAlert className="size-4.5" />
            </span>
            <span className="font-display text-sm font-bold">{BRAND_NAME}</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 font-display text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            الرئيسية <ArrowRight className="size-3.5" />
          </Link>
        </header>

        <section className="cine-in mt-10">
          <Eyebrow>تواصل معنا</Eyebrow>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Contact Us</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            عندك سؤال، مشكلة تقنية، أو تبي تتواصل مع فريق {BRAND_NAME}؟ املأ النموذج أدناه
            أو تواصل معنا مباشرة.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="surface-panel flex items-center gap-3 p-4 transition-colors hover:border-primary/40"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Mail className="size-5" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
                <p className="text-sm font-bold" dir="ltr">{CONTACT_EMAIL}</p>
              </div>
            </a>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="surface-panel flex items-center gap-3 p-4 transition-colors hover:border-primary/40"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <MessageCircle className="size-5" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">واتساب</p>
                <p className="text-sm font-bold">@waralsalfa</p>
              </div>
            </a>
          </div>

          <div className="mt-8 surface-panel p-5 sm:p-8">
            {status === "success" ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="size-14 text-evidence" />
                <h2 className="mt-4 text-xl font-bold">وصلتنا رسالتك</h2>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  شكراً لتواصلك. فريقنا راح يراجع رسالتك ويرد عليك عبر البريد الإلكتروني.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-display text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.01]"
                >
                  إرسال رسالة ثانية
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  {field("name", "الاسم", { placeholder: "اسمك الكامل", required: true })}
                  {field("email", "البريد الإلكتروني", {
                    type: "email",
                    placeholder: "your@email.com",
                    required: true,
                    dir: "ltr",
                  })}
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">الموضوع</span>
                  <div className="relative">
                    <select
                      value={form.subject}
                      onChange={(e) => setForm((s) => ({ ...s, subject: e.target.value }))}
                      required
                      className="w-full appearance-none rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary/60 focus:bg-secondary"
                    >
                      <option value="" disabled>
                        اختر موضوع الرسالة
                      </option>
                      {SUBJECTS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      ▾
                    </span>
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">الرسالة</span>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))}
                    required
                    rows={5}
                    placeholder="اكتب رسالتك هنا بالتفصيل..."
                    className="w-full resize-y rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/60 focus:bg-secondary"
                  />
                </label>

                {status === "error" && (
                  <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm text-primary">
                    {error || "صار خطأ أثناء إرسال الرسالة. جرّب مرة ثانية."}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className={cn(
                    "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-display text-sm font-bold text-primary-foreground transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60",
                  )}
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> جارٍ الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="size-4" /> إرسال الرسالة
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-muted-foreground">
                  أو راسلنا مباشرة على{" "}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="inline-flex items-center gap-1 text-primary underline underline-offset-4"
                  >
                    <Mail className="size-3" /> {CONTACT_EMAIL}
                  </a>
                  {" "}أو واتساب{" "}
                  <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary underline underline-offset-4"
                  >
                    <MessageCircle className="size-3" /> @waralsalfa
                  </a>
                </p>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
