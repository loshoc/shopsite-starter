/**
 * In-process login limiter: 5 attempts per IP per minute.
 * A multi-instance deploy should move this to a shared store. The check
 * still runs on every login in this process, which covers a single Node server.
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
