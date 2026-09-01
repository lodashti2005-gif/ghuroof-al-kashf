import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { isTrialCase } from "./trial-cases";
import { caseRegistry, type CaseSummary } from "./game-meta";


/**
 * ملكية القضايا (Entitlements).
 *
 * مهم: هذي الطبقة للعرض فقط. القرار النهائي — هل يقدر اللاعب يفتح غرفة لقضية
 * مدفوعة — يتحقق بالسيرفر داخل دالة `room_create` عن طريق
 * `has_case_entitlement(auth.uid(), case_id)`. ما نعتمد أبداً على حالة
 * المتصفح أو localStorage لفتح قضية مدفوعة.
 *
 * اللاعبين اللي ينضمون بالرمز ما يحتاجون شراء — الملكية مطلوبة من قائد الغرفة
 * (اللي فتح الغرفة) فقط.
 */

export interface StoreCase extends CaseSummary {
  /** القضية مملوكة للمستخدم الحالي (أو مفتوحة للجميع). */
  owned: boolean;
  /** مشتراة فعلياً بحساب المستخدم. */
  purchased: boolean;
}

export interface PurchaseRow {
  case_id: string;
  status: string;
  purchased_at: string | null;
}

export function useCaseStore() {
  const [userId, setUserId] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data: auth } = await supabase.auth.getSession();
      const uid = auth.session?.user.id ?? null;
      setUserId(uid);
      if (!uid) {
        setPurchases([]);
        return;
      }
      const { data } = await supabase
        .from("case_purchases")
        .select("case_id, status, purchased_at");
      setPurchases((data as PurchaseRow[] | null) ?? []);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    void load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void load();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const cases: StoreCase[] = caseRegistry.map((item) => {
    const purchased = purchases.some((p) => p.case_id === item.id && p.status === "paid");
    // القضية التجريبية (١٠ دقائق) ما تُعتبر ملكية كاملة — لازم يظهر السعر وزر
    // الشراء لغير المالكين، والملكية تُمنح بالشراء المؤكد فقط.
    const openForAll = item.free && !isTrialCase(item.id);
    return { ...item, purchased, owned: openForAll || purchased };
  });


  return {
    loading,
    signedIn: !!userId,
    cases,
    myCases: cases.filter((c) => c.owned && c.status === "available"),
    reload: load,
  };
}
