/**
 * Production boot rejects a missing, short, or placeholder ADMIN_SECRET.
 * `next build` does not boot the server, so the check is skipped there.
 * Development still starts the storefront; /admin stays closed until the
 * secret is valid (see proxy.ts and the login route).
 */
export async function register() {
  const phase = process.env.NEXT_PHASE;
  if (phase === "phase-production-build" || phase === "phase-production-export") return;
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== "nodejs") return;

  const { adminSecretProblem } = await import("./lib/admin-secret");
  const problem = adminSecretProblem(process.env.ADMIN_SECRET);
  if (!problem) return;

  const message = `Refusing to boot admin: ${problem}`;
  if (process.env.NODE_ENV === "production") {
    throw new Error(message);
  }
  console.error(`[shopsite] ${message}. /admin returns 503 until ADMIN_SECRET is a random 32+ character value.`);
}
