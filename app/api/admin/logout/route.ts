import { NextResponse } from "next/server";

import { ADMIN_COOKIE, adminCookieBase, cookieIsSecure } from "@/lib/admin-cookie";
import { revokeCurrentAdminSession } from "@/lib/admin-auth";
import { requireAdminApi } from "@/lib/admin-guard";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  try {
    await revokeCurrentAdminSession();
  } catch {
    // Clear the cookie even when the session row cannot be deleted.
  }
  const response = NextResponse.redirect(new URL("/admin/login", request.url), 303);
  response.cookies.set(ADMIN_COOKIE, "", {
    ...adminCookieBase(cookieIsSecure(request.headers)),
    maxAge: 0,
  });
  return response;
}
