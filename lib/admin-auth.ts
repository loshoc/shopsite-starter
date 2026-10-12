import "server-only";

import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";

import { ADMIN_COOKIE, SESSION_TTL_SECONDS, readSession, signSession } from "@/lib/admin-cookie";
import { adminSecretProblem } from "@/lib/admin-secret";
import { adminSessionExists, deleteAdminSession, replaceAdminSession } from "@/lib/db";

/**
 * Admin auth v1: one shared ADMIN_SECRET and an httpOnly session cookie.
 *
 * Upgrade path (not in this kit): replace this module with Clerk or Auth.js
 * when a shop needs users, roles, or SSO. Do not add Clerk to the core kit.
 */

export function adminConfigProblem(): string | null {
  return adminSecretProblem(process.env.ADMIN_SECRET);
}

export function secretsEqual(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function hasValidAdminSession(): Promise<boolean> {
  const problem = adminConfigProblem();
  if (problem) return false;
  try {
    const jar = await cookies();
    const token = jar.get(ADMIN_COOKIE)?.value;
    if (!token) return false;
    const session = readSession(token, process.env.ADMIN_SECRET ?? "");
    if (!session) return false;
    return await adminSessionExists(session.sid);
  } catch (error) {
    unstable_rethrow(error);
    return false;
  }
}

/** Deletes every previous session, then returns a new signed cookie value. */
export async function issueAdminSession(): Promise<string> {
  const secret = process.env.ADMIN_SECRET ?? "";
  const problem = adminSecretProblem(secret);
  if (problem) throw new Error(problem);
  const sid = randomBytes(32).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const exp = now + SESSION_TTL_SECONDS;
  await replaceAdminSession(sid, new Date(exp * 1000).toISOString());
  return signSession({ sid, exp, iat: now }, secret);
}

export async function revokeCurrentAdminSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return;
  const session = readSession(token, process.env.ADMIN_SECRET ?? "");
  if (!session) return;
  await deleteAdminSession(session.sid);
}
