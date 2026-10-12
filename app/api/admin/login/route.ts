import { NextResponse } from "next/server";

import { ADMIN_COOKIE, SESSION_TTL_SECONDS, adminCookieBase, cookieIsSecure } from "@/lib/admin-cookie";
import { adminConfigProblem, issueAdminSession, secretsEqual } from "@/lib/admin-auth";
import { ADMIN_RESPONSE_HEADERS, adminJson, clientIp } from "@/lib/http";
import { allowLoginAttempt } from "@/lib/rate-limit";
import { InventoryUnavailable } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const problem = adminConfigProblem();
  if (problem) return adminJson({ error: "Admin is not configured." }, 503);

  if (!allowLoginAttempt(clientIp(request.headers))) {
    return adminJson({ error: "Too many login attempts. Try again in a minute." }, 429);
  }

  let secret = "";
  try {
    const body = (await request.json()) as { secret?: unknown };
    if (typeof body.secret === "string") secret = body.secret;
  } catch {
    secret = "";
  }

  const expected = process.env.ADMIN_SECRET ?? "";
  if (!secretsEqual(secret, expected)) {
    return adminJson({ error: "Invalid admin secret." }, 401);
  }

  try {
    const token = await issueAdminSession();
    const response = NextResponse.json({ ok: true }, { headers: ADMIN_RESPONSE_HEADERS });
    response.cookies.set(ADMIN_COOKIE, token, {
      ...adminCookieBase(cookieIsSecure(request.headers)),
      maxAge: SESSION_TTL_SECONDS,
    });
    return response;
  } catch (error) {
    if (error instanceof InventoryUnavailable) {
      return adminJson({ error: "Admin session store is unavailable." }, 503);
    }
    console.error("admin login failed", error instanceof Error ? error.name : "error");
    return adminJson({ error: "Login failed." }, 500);
  }
}
