/** Exact placeholder shipped in Packaging's .env.example. */
const EXAMPLE_DATABASE_URL = "postgresql://USER:PASSWORD@HOST:5432/DATABASE";

/**
 * Empty or the example placeholder means "no database". Local development
 * may use the in-memory fallback. Production must not: see
 * productionDatabaseProblem. A real URL is used as Postgres and never
 * silently swapped for memory if the connection fails.
 */
export function configuredDatabaseUrl(value = process.env.DATABASE_URL): string | null {
  const url = value?.trim() ?? "";
  if (!url) return null;
  if (url === EXAMPLE_DATABASE_URL || url.includes("USER:PASSWORD@HOST")) return null;
  return url;
}

export const PRODUCTION_DATABASE_MESSAGE =
  "DATABASE_URL is required in production. Set a real Postgres URL. The in-memory fallback is for local development only.";

/**
 * Production fail-closed check. Returns a clear error when NODE_ENV is
 * production and DATABASE_URL is missing or still a placeholder. Development
 * and test return null so the in-memory fallback can run.
 *
 * Pass both arguments in tests. A default parameter still applies when the
 * caller passes undefined, and would read process.env.
 */
export function productionDatabaseProblem(
  databaseUrl: string | undefined = process.env.DATABASE_URL,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): string | null {
  if (nodeEnv !== "production") return null;
  if (configuredDatabaseUrl(databaseUrl ?? "")) return null;
  return PRODUCTION_DATABASE_MESSAGE;
}
