import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldAlert } from "lucide-react";

import { GAME_NAME } from "@/game/game-meta";
import { Eyebrow } from "@/components/game/ui";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund Policy — ورا السالفة" },
      {
        name: "description",
        content:
          "سياسة الاسترجاع لموقع ولعبة ورا السالفة: متى يمكنك طلب استرداد المبلغ وكيفية التواصل معنا.",
      },
      { property: "og:title", content: "Refund Policy — ورا السالفة" },
      {
        property: "og:description",
        content:
          "سياسة الاسترجاع لموقع ولعبة ورا السالفة: متى يمكنك طلب استرداد المبلغ وكيفية التواصل معنا.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RefundPage,
});

function RefundPage() {
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
          <Eyebrow>سياسة الاسترجاع</Eyebrow>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Refund Policy</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            آخر تحديث: {new Date().toLocaleDateString("ar-KW")}.
          </p>

          <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground">
            <section className="surface-panel p-5 sm:p-6">
              <h2 className="text-lg font-bold">١. طبيعة المنتج الرقمي</h2>
              <p className="mt-2 text-muted-foreground">
                {GAME_NAME} تبيع محتوى رقمي قابلاً للعب فور الشراء. بمجرد فتح القضية المشتراة،
                يتم منحك حق الوصول إليها. لذلك، تُطبّق سياسة الاسترجاع بما يتناسب مع طبيعة هذا
                النوع من المنتجات.
              </p>
            </section>

            <section className="surface-panel p-5 sm:p-6">
              <h2 className="text-lg font-bold">٢. حالات الاسترجاع المقبولة</h2>
              <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                <li>تمّ خصم المبلغ أكثر من مرة بنفس المعاملة.</li>
                <li>حصل خطأ تقني من جانبنا منعك من الوصول للقضية رغم اكتمال الدفع.</li>
                <li>اشتريت القضية بالخطأ ولم تبدأ اللعب فيها ولم يمر أكثر من ٤٨ ساعة.</li>
              </ul>
            </section>

            <section className="surface-panel p-5 sm:p-6">
              <h2 className="text-lg font-bold">٣. حالات لا تُسترجع</h2>
              <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                <li>لعبت القضية أو بدأتها فعلياً (مثلاً دخلت غرفة اللعب).</li>
                <li>مرّ أكثر من ١٤ يوماً على الشراء.</li>
                <li>الإبلاغ عن مشكلة ناتجة عن جهازك أو اتصال الإنترنت لديك.</li>
              </ul>
            </section>

            <section className="surface-panel p-5 sm:p-6">
              <h2 className="text-lg font-bold">٤. كيف تطلب استرجاع</h2>
              <p className="mt-2 text-muted-foreground">
                ارسل طلبك عبر صفحة{" "}
                <Link to="/contact" className="text-primary underline underline-offset-4">
                  Contact Us
                </Link>{" "}
                مع ذكر البريد المستخدم في الشراء ورقم المعاملة (Transaction ID) إن وجد. نراجع
                الطلب خلال ٥ – ٧ أيام عمل.
              </p>
            </section>

            <section className="surface-panel p-5 sm:p-6">
              <h2 className="text-lg font-bold">٥. طريقة الاسترداد</h2>
              <p className="mt-2 text-muted-foreground">
                إذا وُافق على الطلب، يُعاد المبلغ إلى نفس طريقة الدفع المستخدمة في الشراء. قد
                تستغرق عملية الاسترداد ٥ – ١٠ أيام عمل حسب البنك أو مزود الدفع.
              </p>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
