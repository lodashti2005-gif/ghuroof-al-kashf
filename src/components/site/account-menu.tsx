import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { LogOut, ShieldCheck, User } from "lucide-react";
import { useEffect, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GAME_NAME } from "@/game/game-meta";
import { useT } from "@/i18n";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { checkIsAdmin } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";


/**
 * زر الحساب في الهيدر:
 * - غير مسجّل الدخول: رابط «دخول».
 * - مسجّل الدخول: قائمة منسدلة فيها البريد وزر «تسجيل الخروج».
 *
 * تسجيل الخروج ينهي الجلسة ويرجع المستخدم للصفحة الرئيسية /،
 * بدون مسح تقدمه أو مشترياته أو تجربته من قاعدة البيانات.
 */
export function AccountMenu() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const fetchIsAdmin = useServerFn(checkIsAdmin);
  const t = useT();

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setEmail(data.user?.email ?? null);
      setLoading(false);
      if (!data.user) {
        setIsAdmin(false);
        return;
      }
      try {
        const res = await fetchIsAdmin({ data: undefined });
        if (active) setIsAdmin(res.isAdmin);
      } catch {
        if (active) setIsAdmin(false);
      }
    };
    void load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setEmail(null);
        setIsAdmin(false);
      } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        void load();
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [fetchIsAdmin]);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
    } finally {
      setSigningOut(false);
      navigate({ to: "/", replace: true });
    }
  };

  if (loading || !email) {
    return (
      <Link
        to="/auth"
        className="font-display text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        {t("common.signIn")}
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 font-display text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="grid size-6 place-items-center rounded-full bg-primary/15 text-primary">
            <User className="size-3.5" />
          </span>
          <span className="max-w-[12rem] truncate">{email}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
        <DropdownMenuLabel className="font-mono text-[11px] text-muted-foreground">
          {GAME_NAME}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/purchases" className="cursor-pointer">
            {t("common.myPurchases")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/cases" className="cursor-pointer">
            {t("common.cases")}
          </Link>
        </DropdownMenuItem>
        {isAdmin ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin" className="cursor-pointer">
                <ShieldCheck className="size-4" />
                {t("common.ownerPanel")}
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">
          {t("lang.label")}
        </DropdownMenuLabel>
        <div className="px-2 pb-1.5">
          <LanguageSwitcher />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void handleSignOut();
          }}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          {signingOut ? t("common.signingOut") : t("common.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
