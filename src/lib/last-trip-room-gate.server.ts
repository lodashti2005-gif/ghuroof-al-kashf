/**
 * تحقق سيرفري من صلاحية الوصول لبيانات «آخر رحلة» الحساسة (الحكم على الاتهام
 * والنهاية الكاملة).
 *
 * ما نعتمد على أي حماية بالواجهة: كل طلب لازم يجيب رمز غرفة + معرّف لاعب،
 * ونتحقق منهم عبر `room_snapshot` (SECURITY DEFINER + فحص العضوية بالسيرفر).
 * إذا اللاعب مب عضو بالغرفة، أو الغرفة مب لقضية «آخر رحلة»، أو الغرفة ما وصلت
 * مرحلة النهاية — نرفض الطلب ولا نرجّع أي شي من الحل.
 */
import { createClient } from "@supabase/supabase-js";

type Snapshot = {
  room?: { case_id?: string; state?: { ltAcc?: { stage?: string } | null } | null } | null;
} | null;

const LAST_TRIP_CASE_ID = "last-trip";

function serverClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

async function snapshot(code: string, playerId: string): Promise<Snapshot> {
  const supabase = serverClient();
  const { data, error } = await (
    supabase.rpc as unknown as (
      name: string,
      params: Record<string, unknown>,
    ) => Promise<{ data: Snapshot; error: { message: string } | null }>
  )("room_snapshot", { _code: code, _player_id: playerId });
  if (error) return null;
  return data;
}

/** غرفة «آخر رحلة» صالحة واللاعب عضو فيها — مطلوبة للحكم على الاتهام. */
export async function assertLastTripRoom(code: string, playerId: string) {
  const snap = await snapshot(code, playerId);
  if (!snap?.room || snap.room.case_id !== LAST_TRIP_CASE_ID) {
    throw new Error("forbidden");
  }
  return snap;
}

/** نفس الشرط + الغرفة وصلت فعلاً مرحلة النهاية. */
export async function assertLastTripEndingUnlocked(code: string, playerId: string) {
  const snap = await assertLastTripRoom(code, playerId);
  if (snap.room?.state?.ltAcc?.stage !== "ending") throw new Error("forbidden");
  return snap;
}
