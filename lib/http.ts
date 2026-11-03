/**
 * Admin API responses are same-origin only. Do not add
 * Access-Control-Allow-Origin here or on /api/admin routes.
 */
export const ADMIN_RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "frame-ancestors 'none'",
} as const;

export function adminJson(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: ADMIN_RESPONSE_HEADERS });
}

/**
 * TRUSTED_CLIENT_IP_HEADER names one header your edge proxy always overwrites
 * (for example cf-connecting-ip behind Cloudflare). Set it only when every
 * request reaches the app through that proxy; otherwise a caller can forge it.
 */
export function clientIp(headers: Headers, trusted = process.env.TRUSTED_CLIENT_IP_HEADER): string {
  const name = trusted?.trim().toLowerCase();
  if (name) {
    const value = headers.get(name)?.split(",")[0]?.trim();
    if (value) return value;
  }
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
