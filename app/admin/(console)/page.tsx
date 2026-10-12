import Link from "next/link";

import { ModeBanner } from "@/components/admin/mode-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listOrders, lastStockEvent, stockMode } from "@/lib/db";
import { formatWhen } from "@/lib/format";
import { listAdminStock } from "@/lib/stock";
import { publishableKeyState, stripeMode, webhookSecretProblem } from "@/lib/stripe";
import { InventoryUnavailable } from "@/lib/types";

export default async function DashboardPage() {
  const data = await loadDashboard();
  if (!data) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="text-sm">Inventory store is unavailable. Checkout stays closed until DATABASE_URL connects.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Overview</h1>
      <ModeBanner mode={data.mode} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="SKUs" value={String(data.skuCount)} />
        <Stat label="Out of stock" value={String(data.outOfStock)} />
        <Stat label="Orders" value={String(data.orderCount)} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Low stock</CardTitle>
        </CardHeader>
        <CardContent>
          {data.low.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing at or under its threshold.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {data.low.map((row) => (
                <li key={row.skuId}>
                  {row.name} · {row.qty} left
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Stripe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>Secret key: {data.stripe}</p>
          <p>Publishable key: {data.publishable}</p>
          <p>Webhook secret: {data.webhook}</p>
          <p>Last webhook: {data.lastEvent ?? "none yet"}</p>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/admin/stock">
          Stock
        </Link>
        <Link className="underline" href="/admin/orders">
          Orders
        </Link>
        <Link className="underline" href="/">
          Storefront
        </Link>
      </div>
    </div>
  );
}

async function loadDashboard() {
  try {
    const stock = await listAdminStock();
    const orders = await listOrders();
    const lastEvent = await lastStockEvent();
    const low = stock.rows.filter((row) => row.badge === "low");
    return {
      mode: stockMode(),
      skuCount: stock.rows.length,
      outOfStock: stock.rows.filter((row) => row.badge === "out" || row.badge === "missing").length,
      orderCount: orders.length,
      low,
      stripe: stripeMode(),
      publishable: publishableKeyState(),
      webhook: webhookSecretProblem() ? "not configured" : "configured",
      lastEvent: lastEvent ? `${lastEvent.eventType} · ${formatWhen(lastEvent.processedAt)}` : null,
    };
  } catch (error) {
    if (error instanceof InventoryUnavailable) return null;
    throw error;
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
