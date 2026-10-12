import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ADMIN_COOKIE, readSession } from "@/lib/admin-cookie";
import { adminSecretProblem } from "@/lib/admin-secret";
import { ADMIN_RESPONSE_HEADERS } from "@/lib/http";

/**
 * Next.js 16 proxy (the renamed middleware.ts convention).
 * It runs in front of every /admin page and /api/admin route.
 *
 * The proxy checks that ADMIN_SECRET is configured and that the cookie
 * signature and expiry are valid. The session store (rotation on login)
 * is checked again by requireAdminPage() and requireAdminApi().
 *
 * Admin APIs do not send Access-Control-Allow-Origin.
 */

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname === "/api/admin" || pathname.startsWith("/api/admin/");
  if (!isAdminPage && !isAdminApi) return NextResponse.next();

  if (isAdminApi && request.method === "OPTIONS") {
    return new NextResponse(null, { status: 405, headers: ADMIN_RESPONSE_HEADERS });
  }

  if (isAdminApi && isCrossOrigin(request)) {
    return NextResponse.json(
      { error: "Cross-origin admin requests are not allowed." },
      { status: 403, headers: ADMIN_RESPONSE_HEADERS },
    );
  }

  const problem = adminSecretProblem(process.env.ADMIN_SECRET);
  const isLoginPage = pathname === "/admin/login";
  const isLoginApi = pathname === "/api/admin/login";

  if (problem) {
    if (isLoginPage) return NextResponse.next();
    if (isAdminApi) {
      return NextResponse.json({ error: "Admin is not configured." }, { status: 503, headers: ADMIN_RESPONSE_HEADERS });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "error=config";
    return NextResponse.redirect(url);
  }

  if (isLoginPage || isLoginApi) return NextResponse.next();

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const session = token ? readSession(token, process.env.ADMIN_SECRET ?? "") : null;
  if (!session) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: ADMIN_RESPONSE_HEADERS });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  if (isAdminApi) {
    for (const [key, value] of Object.entries(ADMIN_RESPONSE_HEADERS)) {
      response.headers.set(key, value);
    }
  }
  return response;
}

function isCrossOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return Boolean(origin);
  return origin !== request.nextUrl.origin;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin", "/api/admin/:path*"],
};
