/**
 * التجربة المحدودة (١٠ دقائق) المربوطة بحساب اللاعب.
 *
 * الوقت المستهلك محفوظ بالخادم داخل `case_trials` — فما يتصفّر بتحديث الصفحة
 * ولا بتسجيل الخروج ولا بالدخول من جهاز ثاني. لو اللاعب مالك القضية (شراء
 * مؤكد عبر Paddle) ما ينطبق عليه أي حد.
 *
 * ملاحظة: هذا الملف ما يمنح أي ملكية ولا يمس منطق الدفع أو الـwebhook.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { isTrialCase } from "@/game/trial-cases";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const TRIAL_TOTAL_SECONDS = 600;

/** أقصى فترة تُحسب لكل نبضة — يمنع احتساب وقت وهو مقفل الصفحة. */
const MAX_TICK_SECONDS = 40;

const input = z.object({
  caseId: z.string().min(1).max(64),
  /** نبضة نشاط: تُحتسب من وقت اللعب. */
  tick: z.boolean().optional(),
});

export interface TrialState {
  caseId: string;
  /** مالك القضية (شراء مؤكد أو ملكية من الخادم) — لا حد زمني. */
  entitled: boolean;
  consumedSeconds: number;
  remainingSeconds: number;
  expired: boolean;
}

export const syncCaseTrial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data, context }): Promise<TrialState> => {
    const { supabase, userId } = context;

    // القضية التجريبية تُفتح بالشراء المؤكد فقط — كون القضية «متاحة للدخول»
    // ما يعني ملكية كاملة. باقي القضايا تعتمد على قرار الخادم كما هو.
    let entitled: boolean;
    if (isTrialCase(data.caseId)) {
      const { data: paid } = await supabase
        .from("case_purchases")
        .select("status")
        .eq("case_id", data.caseId)
        .eq("status", "paid")
        .maybeSingle();
      entitled = !!paid;
    } else {
      const { data: rpc } = await supabase.rpc("has_case_entitlement", {
        _user_id: userId,
        _case_id: data.caseId,
      });
      entitled = rpc === true;
    }

    if (entitled) {
      return {
        caseId: data.caseId,
        entitled: true,
        consumedSeconds: 0,
        remainingSeconds: TRIAL_TOTAL_SECONDS,
        expired: false,
      };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row } = await supabaseAdmin
      .from("case_trials")
      .select("consumed_seconds, last_seen_at")
      .eq("user_id", userId)
      .eq("case_id", data.caseId)
      .maybeSingle();

    let consumed = row?.consumed_seconds ?? 0;

    if (!row) {
      await supabaseAdmin
        .from("case_trials")
        .insert({ user_id: userId, case_id: data.caseId, consumed_seconds: 0 });
    } else if (data.tick) {
      const last = new Date(row.last_seen_at).getTime();
      const delta = Math.max(0, Math.floor((Date.now() - last) / 1000));
      consumed = Math.min(TRIAL_TOTAL_SECONDS, consumed + Math.min(delta, MAX_TICK_SECONDS));
      await supabaseAdmin
        .from("case_trials")
        .update({ consumed_seconds: consumed, last_seen_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("case_id", data.caseId);
    } else {
      await supabaseAdmin
        .from("case_trials")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("case_id", data.caseId);
    }

    const remaining = Math.max(0, TRIAL_TOTAL_SECONDS - consumed);
    return {
      caseId: data.caseId,
      entitled: false,
      consumedSeconds: consumed,
      remainingSeconds: remaining,
      expired: remaining <= 0,
    };
  });
