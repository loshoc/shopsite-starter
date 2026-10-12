/** Exact placeholder shipped in Packaging's .env.example. */
const EXAMPLE_DATABASE_URL = "postgresql://USER:PASSWORD@HOST:5432/DATABASE";

/**
 * Empty or the example placeholder means "no database": the in-memory
 * fallback is used. A real URL is used as Postgres and never silently
 * swapped for memory if the connection fails.
 */
export function configuredDatabaseUrl(value = process.env.DATABASE_URL): string | null {
  const url = value?.trim() ?? "";
  if (!url) return null;
  if (url === EXAMPLE_DATABASE_URL || url.includes("USER:PASSWORD@HOST")) return null;
  return url;
}
