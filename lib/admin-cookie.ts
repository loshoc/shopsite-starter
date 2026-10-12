import { createHmac, timingSafeEqual } from "node:crypto";

/** httpOnly session cookie. Production always sets Secure. */
export const ADMIN_COOKIE = "shopsite_admin";

/** Four hours. A new login rotates the session id and drops the previous one. */
export const SESSION_TTL_SECONDS = 60 * 60 * 4;

export type SessionPayload = {
  sid: string;
  exp: number;
  iat: number;
};

export function adminCookieBase(secure: boolean) {
  return {
    httpOnly: true as const,
    secure,
    sameSite: "strict" as const,
    path: "/",
  };
}

/**
 * Production always sets Secure. Local http development omits it so the
 * browser will store the cookie on localhost. Deployed https sets Secure
 * even if NODE_ENV were mis-detected, via x-forwarded-proto.
 */
export function cookieIsSecure(headers: Headers): boolean {
  if (process.env.NODE_ENV === "production") return true;
  return headers.get("x-forwarded-proto") === "https";
}

export function signSession(payload: SessionPayload, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readSession(token: string, secret: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig || !secret) return null;
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const actualBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(actualBuf, expectedBuf)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Partial<SessionPayload>;
    if (typeof parsed.sid !== "string" || parsed.sid.length < 16) return null;
    if (typeof parsed.exp !== "number" || typeof parsed.iat !== "number") return null;
    if (parsed.exp * 1000 <= Date.now()) return null;
    return { sid: parsed.sid, exp: parsed.exp, iat: parsed.iat };
  } catch {
    return null;
  }
}
