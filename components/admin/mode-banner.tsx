export function ModeBanner({ mode }: { mode: "memory" | "postgres" | "unavailable" }) {
  if (mode !== "memory") return null;
  return (
    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
      No live database. Stock, orders, and admin sessions are in memory and reset when the server restarts.
      This fallback is local development only. Production requires a real Postgres{" "}
      <span className="font-medium">DATABASE_URL</span> and will not start a session or checkout without one.
      Sold-out checks still fail closed.
    </p>
  );
}
