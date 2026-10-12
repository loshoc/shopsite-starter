export function ModeBanner({ mode }: { mode: "memory" | "postgres" }) {
  if (mode === "postgres") return null;
  return (
    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
      No live database. Stock, orders, and admin sessions are in memory and reset when the server restarts.
      Leave <span className="font-medium">DATABASE_URL</span> as the example placeholder for this demo, or set a real Postgres URL.
      Sold-out checks still fail closed.
    </p>
  );
}
