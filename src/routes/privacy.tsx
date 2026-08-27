import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldAlert } from "lucide-react";

import { GAME_NAME } from "@/game/game-meta";
import { Eyebrow } from "@/components/game/ui";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — ورا السالفة" },
      {
        name: "description",
        content:
          "سياسة الخصوصية لموقع ولعبة ورا السالفة: البيانات التي نجمعها وكيف نستخدمها ونحميها.",
      },
      { property: "og:title", content: "Privacy Policy — ورا السالفة" },
      {
        property: "og:description",
        content:
          "سياسة الخصوصية لموقع ولعبة ورا السالفة: البيانات التي نجمعها وكيف نستخدمها ونحميها.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
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

        <article className="cine-in mt-10">
          <Eyebrow>سياسة الخصوصية</Eyebrow>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Privacy Policy</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            آخر تحديث: {new Date().toLocaleDateString("ar-KW")}.
          </p>

          <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground">
            <section className="surface-panel p-5 sm:p-6">
              <h2 className="text-lg font-bold">١. البيانات التي نجمعها</h2>
              <p className="mt-2 text-muted-foreground">
                نجمع عنوان البريد الإلكتروني واسم المستخدم عند إنشاء الحساب، بالإضافة إلى بيانات
                الجلسات والغرف اللازمة لتشغيل اللعبة الجماعية. كما نجمع بيانات الدفع الأساسية
                (مثل معرف المعاملة) عند الشراء عبر Paddle.
              </p>
            </section>

            <section className="surface-panel p-5 sm:p-6">
              <h2 className="text-lg font-bold">٢. كيف نستخدم البيانات</h2>
              <p className="mt-2 text-muted-foreground">
                نستخدم بياناتك لتشغيل حسابك، ومزامنة تقدم اللعبة، ومعالجة المشتريات، وتحسين
                الأداء، والرد على استفساراتك. لا نبيع بياناتك لأطراف ثالثة.
              </p>
            </section>

            <section className="surface-panel p-5 sm:p-6">
              <h2 className="text-lg font-bold">٣. الخدمات الخارجية</h2>
              <p className="mt-2 text-muted-foreground">
                نستخدم Paddle لمعالجة المدفوعات ومزود استضافة خلفية لقاعدة البيانات والمصادقة.
                هذه الخدمات تخضع لسياسات خصوصيتها الخاصة، ونحن نختار مزودين يتبعون معايير أمان
                عالية.
              </p>
            </section>

            <section className="surface-panel p-5 sm:p-6">
              <h2 className="text-lg font-bold">٤. ملفات تعريف الارتباط والتخزين المحلي</h2>
              <p className="mt-2 text-muted-foreground">
                نستخدم التخزين المحلي والكوكيز اللازمة لتشغيل الجلسة والحفاظ على تسجيل الدخول.
                لا نستخدم كوكيز تتبع إعلاني.
              </p>
            </section>

            <section className="surface-panel p-5 sm:p-6">
              <h2 className="text-lg font-bold">٥. الأمان</h2>
              <p className="mt-2 text-muted-foreground">
                نطبق Row Level Security على قاعدة البيانات ونستخدم اتصالات مشفرة. مع ذلك، لا
                يوجد نظام آمن بنسبة ١٠٠٪، لذا ننصحك بحماية بيانات حسابك.
              </p>
            </section>

            <section className="surface-panel p-5 sm:p-6">
              <h2 className="text-lg font-bold">٦. حقوقك</h2>
              <p className="mt-2 text-muted-foreground">
                يحق لك طلب حذف حسابك وبياناتك عبر التواصل معنا. سنبذل جهدنا المعقول للاستجابة
                خلال فترة زمنية مناسبة.
              </p>
            </section>

            <section className="surface-panel p-5 sm:p-6">
              <h2 className="text-lg font-bold">٧. التواصل</h2>
              <p className="mt-2 text-muted-foreground">
                لأي سؤال حول الخصوصية، راسلنا عبر{" "}
                <Link to="/contact" className="text-primary underline underline-offset-4">
                  Contact Us
                </Link>
                .
              </p>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
