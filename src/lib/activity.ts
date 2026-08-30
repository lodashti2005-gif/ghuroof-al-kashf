/**
 * تتبّع نشاط بسيط وآمن (فتح الموقع، بدء قضية، إنشاء/دخول غرفة).
 *
 * ما نخزّن أي معلومة حساسة: فقط نوع الحدث، القضية، رمز الغرفة، المسار،
 * ومعرّف المستخدم إن كان مسجّل دخول. الزوار يُسجَّلون بدون هوية.
 * القراءة محجوبة عن الجميع إلا المشرف (عبر سياسات القاعدة).
 */
import { supabase } from "@/integrations/supabase/client";

export type PlayerEventType =
  | "site_open"
  | "case_start"
  | "room_create"
  | "room_join";

interface TrackOptions {
  caseId?: string | null;
  roomCode?: string | null;
  path?: string | null;
}

/** لا نكرر نفس الحدث خلال نفس الجلسة/الدقيقة. */
const recent = new Map<string, number>();

export async function trackEvent(
  eventType: PlayerEventType,
  options: TrackOptions = {},
): Promise<void> {
  if (typeof window === "undefined") return;
  const key = `${eventType}:${options.caseId ?? ""}:${options.roomCode ?? ""}:${options.path ?? ""}`;
  const now = Date.now();
  const last = recent.get(key);
  if (last && now - last < 60_000) return;
  recent.set(key, now);

  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id ?? null;
    await supabase.from("player_events").insert({
      user_id: userId,
      event_type: eventType,
      case_id: options.caseId ?? null,
      room_code: options.roomCode ?? null,
      path: options.path ?? null,
    });
  } catch {
    // التتبّع اختياري — أي فشل ما يأثر على اللعب.
  }
}
