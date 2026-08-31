/**
 * تتبّع تسويقي آمن (زيارات، جلسات، مسار التحويل، مصدر الزيارة).
 *
 * ما نخزّن أي معلومة حساسة: فقط نوع الحدث، القضية، رمز الغرفة، المسار،
 * معرّف زائر عشوائي محلي، معرّف جلسة، ومصدر الزيارة (UTM/Referrer).
 * ومعرّف المستخدم إن كان مسجّل دخول. الزوار يُسجَّلون بدون هوية.
 * القراءة محجوبة عن الجميع إلا المشرف (عبر سياسات القاعدة).
 */
import { supabase } from "@/integrations/supabase/client";

export type PlayerEventType =
  | "site_open"
  | "signup"
  | "trial_click"
  | "trial_start"
  | "trial_end"
  | "purchase_view"
  | "pay_click"
  | "checkout_open"
  | "case_unlocked"
  | "case_start"
  | "room_create"
  | "room_join";

interface TrackOptions {
  caseId?: string | null;
  roomCode?: string | null;
  path?: string | null;
}

const VISITOR_KEY = "wsalfa.visitor_id";
const SESSION_KEY = "wsalfa.session";

interface SessionInfo {
  id: string;
  source: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
}

function randomId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

/** معرّف زائر ثابت على نفس المتصفح (بدون أي بيانات شخصية). */
function getVisitorId(): string | null {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = randomId();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** تصنيف مصدر الزيارة من UTM أو من الموقع اللي جا منه الزائر. */
function classifySource(utmSource: string | null, referrer: string | null): string {
  const raw = `${utmSource ?? ""} ${referrer ?? ""}`.toLowerCase();
  if (/tiktok/.test(raw)) return "tiktok";
  if (/snapchat|snap\b|sc_/.test(raw)) return "snapchat";
  if (/instagram|\big\b/.test(raw)) return "instagram";
  if (/facebook|fb\.|fbclid/.test(raw)) return "facebook";
  if (/x\.com|twitter/.test(raw)) return "twitter";
  if (/google/.test(raw)) return "google";
  if (/whatsapp/.test(raw)) return "whatsapp";
  if (utmSource) return "other";
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname;
    if (host && host === window.location.hostname) return "direct";
  } catch {
    /* تجاهل */
  }
  return "other";
}

/** جلسة واحدة لكل تبويب/زيارة، مع تثبيت مصدر أول دخول. */
function getSession(): SessionInfo | null {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) return JSON.parse(stored) as SessionInfo;
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source");
    const referrer = document.referrer || null;
    const info: SessionInfo = {
      id: randomId(),
      source: classifySource(utmSource, referrer),
      utmSource,
      utmMedium: params.get("utm_medium"),
      utmCampaign: params.get("utm_campaign"),
      referrer,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(info));
    return info;
  } catch {
    return null;
  }
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
    const session = getSession();
    await supabase.from("player_events").insert({
      user_id: userId,
      event_type: eventType,
      case_id: options.caseId ?? null,
      room_code: options.roomCode ?? null,
      path: options.path ?? null,
      visitor_id: getVisitorId(),
      session_id: session?.id ?? null,
      source: session?.source ?? null,
      utm_source: session?.utmSource ?? null,
      utm_medium: session?.utmMedium ?? null,
      utm_campaign: session?.utmCampaign ?? null,
      referrer: session?.referrer ?? null,
    });
  } catch {
    // التتبّع اختياري — أي فشل ما يأثر على اللعب.
  }
}
