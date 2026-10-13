/**
 * Production boot rejects a missing, short, or placeholder ADMIN_SECRET,
 * a missing or placeholder DATABASE_URL, and a missing or local-only
 * NEXT_PUBLIC_APP_URL. `next build` does not boot the server, so these
 * boot checks are skipped during phase-production-build and
 * phase-production-export. The production build itself fails in
 * next.config.ts when NEXT_PUBLIC_APP_URL is missing or local-only.
 * Development still starts the storefront; /admin stays closed until the
 * secret is valid (see proxy.ts and the login route). The in-memory
 * database fallback stays available only outside production.
 */
export async function register() {
  const phase = process.env.NEXT_PHASE;
  if (phase === "phase-production-build" || phase === "phase-production-export") return;
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== "nodejs") return;

  const { adminSecretProblem } = await import("./lib/admin-secret");
  const { assertProductionAppUrl } = await import("./lib/app-url");
  const { productionDatabaseProblem } = await import("./lib/database-url");

  const secretProblem = adminSecretProblem(process.env.ADMIN_SECRET);
  const databaseProblem = productionDatabaseProblem();
  let appUrlProblem: string | null = null;
  try {
    assertProductionAppUrl();
  } catch (error) {
    appUrlProblem = error instanceof Error ? error.message : "NEXT_PUBLIC_APP_URL is invalid";
  }
  if (process.env.NODE_ENV === "production" && (secretProblem || databaseProblem || appUrlProblem)) {
    const parts = [
      secretProblem ? `Refusing to boot admin: ${secretProblem}` : null,
      databaseProblem,
      appUrlProblem,
    ].filter((part): part is string => Boolean(part));
    throw new Error(parts.join(" "));
  }

  if (secretProblem) {
    console.error(
      `[shopsite] Refusing to boot admin: ${secretProblem}. /admin returns 503 until ADMIN_SECRET is a random 32+ character value.`,
    );
  }
}
