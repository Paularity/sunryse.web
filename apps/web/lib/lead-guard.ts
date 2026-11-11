/**
 * Light spam protection for the lead API (no third-party service):
 * - a honeypot field that people never see, so a filled one means a bot;
 * - a per-visitor rate limit. It lives in memory, so it only catches bursts within one server instance;
 *   pair it with Vercel's firewall rate-limit rules in production (see docs/DEPLOY-PLAN.md).
 */

/** Name of the hidden form field. Keep it in sync with the Honeypot component. */
export const HONEYPOT_FIELD = "website";

/** True when the hidden honeypot field was filled in. */
export function isBot(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const value = (body as Record<string, unknown>)[HONEYPOT_FIELD];
  return typeof value === "string" && value.trim() !== "";
}

/** Sliding-window limiter: `allow(key)` is false once a key made `limit` requests within `windowMs`. */
export function createRateLimiter({
  limit,
  windowMs,
  maxKeys = 5000,
}: {
  limit: number;
  windowMs: number;
  maxKeys?: number;
}) {
  const hits = new Map<string, number[]>();
  return function allow(key: string, now = Date.now()): boolean {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.delete(key);
    hits.set(key, recent);
    // Forget the oldest visitors so memory stays bounded.
    while (hits.size > maxKeys) hits.delete(hits.keys().next().value!);
    return true;
  };
}

/** The visitor's IP as reported by the host (Vercel sets x-real-ip / x-forwarded-for). */
export function clientKey(headers: Headers): string {
  return headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
