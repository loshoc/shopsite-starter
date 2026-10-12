import "server-only";

import { connection } from "next/server";
import { redirect } from "next/navigation";

import { adminConfigProblem, hasValidAdminSession } from "@/lib/admin-auth";
import { adminJson } from "@/lib/http";

/** Shared guard for every admin server page under the console layout. */
export async function requireAdminPage(): Promise<void> {
  await connection();
  if (adminConfigProblem()) redirect("/admin/login?error=config");
  if (!(await hasValidAdminSession())) redirect("/admin/login");
}

/** Shared guard for every /api/admin route except login. */
export async function requireAdminApi(): Promise<Response | null> {
  if (adminConfigProblem()) {
    return adminJson({ error: "Admin is not configured." }, 503);
  }
  if (!(await hasValidAdminSession())) {
    return adminJson({ error: "Unauthorized" }, 401);
  }
  return null;
}
