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

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
