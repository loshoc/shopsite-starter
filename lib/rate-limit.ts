/**
 * In-process login limiter: 5 attempts per IP per minute.
 *
 * The IP is the first x-forwarded-for hop (clientIp in lib/http.ts), then
 * x-real-ip. That trust is fine on Vercel, which overwrites the header.
 * Self-hosting needs a trusted proxy that strips client-supplied forwarded
 * headers; otherwise a caller can rotate the header and skip this limit.
 *
 * Counts are per instance (this process only). A multi-instance deploy
 * should move the same allow/deny shape to Redis or Upstash.
 */
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;

const buckets = new Map<string, number[]>();

export function allowLoginAttempt(ip: string, now = Date.now()): boolean {
  const recent = (buckets.get(ip) ?? []).filter((stamp) => now - stamp < WINDOW_MS);
  if (recent.length >= MAX_ATTEMPTS) {
    buckets.set(ip, recent);
    return false;
  }
  recent.push(now);
  buckets.set(ip, recent);
  if (buckets.size > 5_000) {
    for (const [key, stamps] of buckets) {
      const fresh = stamps.filter((stamp) => now - stamp < WINDOW_MS);
      if (fresh.length === 0) buckets.delete(key);
    }
  }
  return true;
}

export function resetLoginAttempts(): void {
  buckets.clear();
}
