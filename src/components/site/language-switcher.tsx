import { Languages } from "lucide-react";

import { useI18n, type Lang } from "@/i18n";
import { cn } from "@/lib/utils";

const OPTIONS: { id: Lang; label: string }[] = [
  { id: "ar", label: "العربية" },
  { id: "en", label: "English" },
];

/** مبدّل اللغة — يظهر بالهيدر والإعدادات. تغيير اللغة ما يمسّ أي تقدّم. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();

  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        "inline-flex items-center overflow-hidden rounded-full border border-border bg-secondary/60",
        className,
      )}
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => setLang(opt.id)}
          aria-pressed={lang === opt.id}
          className={cn(
            "px-2.5 py-1 font-display text-[11px] transition-colors",
            lang === opt.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/**
 * شاشة اختيار اللغة عند أول دخول فقط.
 * ما تتدخل بأي منطق لعب — مجرد طبقة عرض قبل البداية.
 */
export function LanguageGate() {
  const { chosen, setLang, t } = useI18n();
  if (chosen) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-background/95 px-5 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-2xl">
        <span className="mx-auto grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
          <Languages className="size-5" />
        </span>
        <h2 className="mt-4 font-display text-lg font-bold">
          اختر لغة اللعبة
          <span className="mt-1 block text-sm font-normal text-muted-foreground">
            Choose your language
          </span>
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">{t("lang.chooseHint")}</p>
        <div className="mt-5 grid gap-2.5">
          <button
            type="button"
            onClick={() => setLang("ar")}
            className="w-full rounded-xl bg-primary px-5 py-3 font-display text-base font-bold text-primary-foreground transition-transform hover:scale-[1.01]"
          >
            العربية
          </button>
          <button
            type="button"
            onClick={() => setLang("en")}
            className="w-full rounded-xl border border-border bg-secondary px-5 py-3 font-display text-base font-bold transition-colors hover:border-primary/60"
          >
            English
          </button>
        </div>
      </div>
    </div>
  );
}
