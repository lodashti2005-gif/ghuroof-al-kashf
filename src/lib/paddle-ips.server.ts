/**
 * قائمة عناوين Paddle المسموح لها (Webhook allowlist) — سيرفر فقط.
 *
 * المصدر الوحيد للحقيقة هو https://api.paddle.com/ips (data.ipv4_cidrs)،
 * فما نثبّت أي عنوان داخل الكود. نخزّن النتيجة بالذاكرة لمدة قصيرة عشان
 * ما نطلب القائمة مع كل حدث.
 */

const PADDLE_IPS_URL = "https://api.paddle.com/ips";
const TTL_MS = 60 * 60 * 1000; // ساعة

let cache: { ips: string[]; fetchedAt: number } | null = null;

/** يجيب قائمة عناوين Paddle الحالية (/32 CIDRs مُحوّلة لعناوين مجرّدة). */
export async function getPaddleAllowedIps(): Promise<string[]> {
  if (cache && Date.now() - cache.fetchedAt < TTL_MS) return cache.ips;

  const res = await fetch(PADDLE_IPS_URL, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    if (cache) return cache.ips; // نستخدم آخر قائمة ناجحة عند فشل الشبكة
    throw new Error(`paddle_ips_fetch_failed_${res.status}`);
  }

  const body = (await res.json()) as { data?: { ipv4_cidrs?: string[] } };
  const cidrs = body.data?.ipv4_cidrs ?? [];
  const ips = cidrs
    .map((cidr) => cidr.split("/")[0]?.trim() ?? "")
    .filter((ip) => ip.length > 0);

  if (ips.length === 0) {
    if (cache) return cache.ips;
    throw new Error("paddle_ips_empty");
  }

  cache = { ips, fetchedAt: Date.now() };
  return ips;
}

/** يستخرج IP الطالب من ترويسات البروكسي. */
export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    null
  );
}

/** يتحقق أن الطلب جاي من عنوان Paddle. */
export async function isPaddleRequestIp(request: Request): Promise<{ ok: boolean; ip: string | null }> {
  const ip = getClientIp(request);
  if (!ip) return { ok: false, ip: null };
  const allowed = await getPaddleAllowedIps();
  return { ok: allowed.includes(ip), ip };
}
