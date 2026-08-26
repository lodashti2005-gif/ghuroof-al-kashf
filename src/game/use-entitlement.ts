/**
 * قراءة حالة ملكية قضية من الخادم (بدون أي منطق فتح بالواجهة).
 */
import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { getCaseEntitlement, type CaseEntitlementResult } from "@/lib/purchase.functions";

export function useCaseEntitlement(caseId: string) {
  const [state, setState] = useState<CaseEntitlementResult | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getSession();
      const isIn = !!auth.session?.user;
      setSignedIn(isIn);
      if (!isIn) {
        setState(null);
        return;
      }
      setState(await getCaseEntitlement({ data: { caseId } }));
    } catch {
      setState(null);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") void load();
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  return { entitlement: state, signedIn, loading, reload: load };
}
