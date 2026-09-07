/**
 * نظام الترجمة المركزي (ar / en).
 *
 * - العربية هي الافتراضية (RTL)، والإنجليزية LTR.
 * - اختيار اللغة يُحفظ على الجهاز (localStorage) وعلى الحساب (عمود
 *   `profiles.locale`) لمن يكون مسجّل دخول.
 * - تغيير اللغة لا يمسّ أي حالة لعب: التقدّم والغرف والتجربة والشراء تبقى كما هي.
 *
 * أي نص واجهة جديد يُضاف للقاموسين في `translations/ar.ts` و`translations/en.ts`.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/integrations/supabase/client";
import { ar } from "./translations/ar";
import { en } from "./translations/en";

export type Lang = "ar" | "en";

const STORAGE_KEY = "wr_lang";
const DICTS: Record<Lang, unknown> = { ar, en };

const isLang = (v: unknown): v is Lang => v === "ar" || v === "en";

function lookup(dict: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
}

function fill(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_, k: string) =>
    vars[k] === undefined ? `{{${k}}}` : String(vars[k]),
  );
}

interface I18nValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  /** اختار اللاعب لغته من قبل (يستخدم لعرض شاشة الاختيار أول مرة). */
  chosen: boolean;
  setLang: (lang: Lang) => void;
  /** نص مفرد. */
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** قائمة نصوص (مثل خطوات التعليمات). */
  tList: (key: string) => string[];
  /** اختيار محتوى جاهز بلغتين (عناوين القضايا، الأدلة، الحوارات…). */
  pick: <T>(arValue: T, enValue: T | undefined | null) => T;
}

const I18nContext = createContext<I18nValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");
  const [chosen, setChosen] = useState(true);

  // القراءة بعد الـhydration فقط حتى لا يختلف الرندر بين السيرفر والمتصفح.
  useEffect(() => {
    let active = true;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) {
      setLangState(stored);
      setChosen(true);
    } else {
      setChosen(false);
      // لو اللاعب مسجّل دخول ومحفوظة لغته بالحساب، نستخدمها.
      void (async () => {
        const { data } = await supabase.auth.getSession();
        const uid = data.session?.user.id;
        if (!uid || !active) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("locale")
          .eq("id", uid)
          .maybeSingle();
        const remote = (profile as { locale?: string | null } | null)?.locale;
        if (active && isLang(remote)) {
          setLangState(remote);
          setChosen(true);
          window.localStorage.setItem(STORAGE_KEY, remote);
        }
      })();
    }
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    setChosen(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* التخزين محجوب — نكمل بالذاكرة فقط. */
    }
    // حفظ على الحساب بأفضل مجهود، وبدون تعطيل الواجهة لو فشل.
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id;
      if (!uid) return;
      await supabase.from("profiles").update({ locale: next }).eq("id", uid);
    })();
  }, []);

  const value = useMemo<I18nValue>(() => {
    const t = (key: string, vars?: Record<string, string | number>) => {
      const hit = lookup(DICTS[lang], key) ?? lookup(DICTS.ar, key);
      return typeof hit === "string" ? fill(hit, vars) : key;
    };
    const tList = (key: string) => {
      const hit = lookup(DICTS[lang], key) ?? lookup(DICTS.ar, key);
      return Array.isArray(hit) ? (hit as string[]) : [];
    };
    return {
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      chosen,
      setLang,
      t,
      tList,
      pick: (arValue, enValue) =>
        lang === "en" && enValue !== undefined && enValue !== null ? enValue : arValue,
    };
  }, [lang, chosen, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <LanguageProvider>");
  return ctx;
}

/** اختصار شائع: `const t = useT();` */
export function useT() {
  return useI18n().t;
}
