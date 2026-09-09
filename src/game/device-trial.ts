/**
 * التجربة المجانية (١٠ دقائق) بدون حساب — مربوطة بالجهاز/المتصفح.
 *
 * - معرّف مجهول ثابت للجهاز (نفس معرّف الزائر المستخدم بالتتبّع) — بدون أي
 *   معلومة شخصية ولا اعتماد على IP.
 * - الحالة الموثوقة بقاعدة البيانات (`device_trials`) والتخزين المحلي طبقة
 *   مساعدة فقط للعرض السريع.
 * - الوقت يبدأ عند ضغط «ابدأ التجربة» فقط، والـrefresh أو الخروج والرجوع
 *   يكمل من المتبقي، وبعد انتهائه ما فيه تجربة جديدة لنفس الجهاز.
 *
 * ما يمس منطق الدفع ولا الأسعار ولا القضايا: مالك القضية (شراء مؤكد) يتجاوز
 * هذي الطبقة بالكامل.
 */
import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/activity";

export const TRIAL_SECONDS = 600;

export interface DeviceTrial {
  /** بدأ اللاعب التجربة على هذا الجهاز. */
  started: boolean;
  remainingSeconds: number;
  expired: boolean;
}

const cacheKey = (caseId: string) => `wsalfa.trial.${caseId}`;

interface CachedTrial {
  startedAt: number;
}

function readCache(caseId: string): DeviceTrial | null {
  try {
    const raw = localStorage.getItem(cacheKey(caseId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedTrial;
    if (!parsed?.startedAt) return null;
    const passed = Math.floor((Date.now() - parsed.startedAt) / 1000);
    const remaining = Math.max(0, TRIAL_SECONDS - passed);
    return { started: true, remainingSeconds: remaining, expired: remaining <= 0 };
  } catch {
    return null;
  }
}

function writeCache(caseId: string, remainingSeconds: number) {
  try {
    localStorage.setItem(
      cacheKey(caseId),
      JSON.stringify({ startedAt: Date.now() - (TRIAL_SECONDS - remainingSeconds) * 1000 }),
    );
  } catch {
    /* تجاهل */
  }
}

interface RpcTrial {
  status?: string;
  started?: boolean;
  remaining_seconds?: number;
  expired?: boolean;
}

function fromRpc(caseId: string, data: unknown): DeviceTrial | null {
  const row = data as RpcTrial | null;
  if (!row || row.status !== "ok") return null;
  const state: DeviceTrial = {
    started: row.started === true,
    remainingSeconds: Math.max(0, Number(row.remaining_seconds ?? TRIAL_SECONDS)),
    expired: row.expired === true,
  };
  if (state.started) writeCache(caseId, state.remainingSeconds);
  return state;
}

/** قراءة حالة التجربة من الخادم (ما تبدأ الوقت). */
export async function fetchDeviceTrial(caseId: string): Promise<DeviceTrial | null> {
  const deviceId = getDeviceId();
  if (!deviceId) return null;
  const { data } = await supabase.rpc("device_trial_state", {
    _device_id: deviceId,
    _case_id: caseId,
  });
  return fromRpc(caseId, data) ?? readCache(caseId);
}

/** بدء التجربة مرة واحدة لكل جهاز — لو موجودة ترجع المتبقي بدون تصفير. */
export async function startDeviceTrial(caseId: string): Promise<DeviceTrial | null> {
  const deviceId = getDeviceId();
  if (!deviceId) return null;
  const { data } = await supabase.rpc("device_trial_start", {
    _device_id: deviceId,
    _case_id: caseId,
  });
  return fromRpc(caseId, data) ?? readCache(caseId);
}

/** حالة التجربة مع عدّاد محلي للعرض ومزامنة دورية مع الخادم. */
export function useDeviceTrial(caseId: string) {
  const [trial, setTrial] = useState<DeviceTrial | null>(null);
  const [loading, setLoading] = useState(true);

  const sync = useCallback(async () => {
    try {
      const next = await fetchDeviceTrial(caseId);
      setTrial(next ?? readCache(caseId));
    } catch {
      // انقطاع شبكة: نكمل بالحالة المحفوظة محلياً بدل تعليق الشاشة.
      setTrial((t) => t ?? readCache(caseId));
    } finally {
      setLoading(false);
    }
  }, [caseId]);


  const start = useCallback(async () => {
    const next = await startDeviceTrial(caseId);
    if (next) setTrial(next);
    return next;
  }, [caseId]);

  useEffect(() => {
    setTrial(readCache(caseId));
    void sync();
    const id = window.setInterval(() => void sync(), 30_000);
    return () => window.clearInterval(id);
  }, [caseId, sync]);

  // عدّاد محلي بين نبضات المزامنة (عرض فقط).
  useEffect(() => {
    const id = window.setInterval(() => {
      setTrial((t) => {
        if (!t || !t.started || t.expired) return t;
        const remaining = Math.max(0, t.remainingSeconds - 1);
        return { ...t, remainingSeconds: remaining, expired: remaining <= 0 };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return { trial, loading, start, reload: sync };
}

export function formatTrialClock(seconds: number) {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
