import { ModeBanner } from "@/components/admin/mode-banner";
import { OrdersTable, type ThinOrder } from "@/components/admin/orders-table";
import { listOrders, stockMode } from "@/lib/db";
import { stripeDashboardUrl } from "@/lib/stripe";
import { InventoryUnavailable } from "@/lib/types";

export default async function OrdersPage() {
  const loaded = await loadOrders();
  if (!loaded) {
    return <p className="text-sm">Orders are unavailable because the inventory store is down.</p>;
  }
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Orders</h1>
        <p className="text-sm text-muted-foreground">
          Email, total, status, and a Stripe Dashboard link. No card data.
        </p>
      </div>
      <ModeBanner mode={loaded.mode} />
      <OrdersTable orders={loaded.orders} />
    </div>
  );
}

async function loadOrders(): Promise<{ mode: "memory" | "postgres" | "unavailable"; orders: ThinOrder[] } | null> {
  try {
    const orders = await listOrders();
    return {
      mode: stockMode(),
      orders: orders.map((order) => ({
        email: order.email,
        totalCents: order.totalCents,
        currency: order.currency,
        status: order.status,
        stripeSessionId: order.stripeSessionId,
        dashboardUrl: stripeDashboardUrl(order.paymentIntentId, order.stripeSessionId),
        restocked: order.restocked,
        createdAt: order.createdAt,
      })),
    };
  } catch (error) {
    if (error instanceof InventoryUnavailable) return null;
    throw error;
  }
}
