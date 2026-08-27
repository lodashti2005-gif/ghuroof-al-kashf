import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldAlert } from "lucide-react";

import { GAME_NAME } from "@/game/game-meta";
import { Eyebrow } from "@/components/game/ui";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — ورا السالفة" },
      {
        name: "description",
        content:
          "شروط استخدام موقع ولعبة ورا السالفة. اقرأ الشروط قبل إنشاء حساب أو شراء أي قضية.",
      },
      { property: "og:title", content: "Terms of Service — ورا السالفة" },
      {
        property: "og:description",
        content:
          "شروط استخدام موقع ولعبة ورا السالفة. اقرأ الشروط قبل إنشاء حساب أو شراء أي قضية.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
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
          <Eyebrow>الشروط والأحكام</Eyebrow>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Terms of Service</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            آخر تحديث: {new Date().toLocaleDateString("ar-KW")}.
          </p>

          <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground">
            <section className="surface-panel p-5 sm:p-6">
              <h2 className="text-lg font-bold">١. قبول الشروط</h2>
              <p className="mt-2 text-muted-foreground">
                باستخدامك لموقع ولعبة {GAME_NAME}، فإنك توافق على الالتزام بهذه الشروط. إذا ما
                وافقت على أي بند، يرجى عدم استخدام المنصة.
              </p>
            </section>

            <section className="surface-panel p-5 sm:p-6">
              <h2 className="text-lg font-bold">٢. طبيعة المنتج</h2>
              <p className="mt-2 text-muted-foreground">
                {GAME_NAME} لعبة رقمية جماعية عبر المتصفح. القضايا تُباع كمحتوى رقمي قابل للعب
                داخل الغرف التي ينشئها المستخدم. شراء القضية يمنح صاحب الحساب حق فتح الغرف
                واللعب بها مع فريقه.
              </p>
            </section>

            <section className="surface-panel p-5 sm:p-6">
              <h2 className="text-lg font-bold">٣. الحساب والمسؤولية</h2>
              <p className="mt-2 text-muted-foreground">
                أنت مسؤول عن حماية بيانات حسابك وعن أي نشاط يتم من خلاله. يُحظر مشاركة الحساب أو
                استخدامه لأغراض غير قانونية أو مضرة بالمنصة أو بغيرك من المستخدمين.
              </p>
            </section>

            <section className="surface-panel p-5 sm:p-6">
              <h2 className="text-lg font-bold">٤. المشتريات والدفع</h2>
              <p className="mt-2 text-muted-foreground">
                القضايا المدفوعة تُشرى مرة واحدة وتُربط بحسابك. بعد اكتمال الدفع عبر بوابة
                Paddle، تُفتح القضية تلقائياً. الأسعار معروضة بالدينار الكويتي أو ما يعادله،
                وقد تختلف حسب الضرائب والرسوم المحلية.
              </p>
            </section>

            <section className="surface-panel p-5 sm:p-6">
              <h2 className="text-lg font-bold">٥. المحتوى والملكية الفكرية</h2>
              <p className="mt-2 text-muted-foreground">
                جميع الشخصيات والقصص والصور والنصوص والتصميمات ملك لـ {GAME_NAME}. لا يجوز نسخها
                أو توزيعها أو إعادة استخدامها بدون إذن خطي.
              </p>
            </section>

            <section className="surface-panel p-5 sm:p-6">
              <h2 className="text-lg font-bold">٦. التعديلات</h2>
              <p className="mt-2 text-muted-foreground">
                نحتفظ بالحق في تعديل هذه الشروط أو خصائص اللعبة في أي وقت. الاستمرار في استخدام
                المنصة بعد أي تعديل يعني قبولك للشروط المحدّثة.
              </p>
            </section>

            <section className="surface-panel p-5 sm:p-6">
              <h2 className="text-lg font-bold">٧. التواصل</h2>
              <p className="mt-2 text-muted-foreground">
                لأي استفسار أو شكوى، تواصل معنا عبر صفحة{" "}
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
