import { ModeBanner } from "@/components/admin/mode-banner";
import { OrdersTable } from "@/components/admin/orders-table";
import { presentAdminOrder, type AdminOrderView } from "@/lib/admin-orders";
import { listOrders, stockMode } from "@/lib/db";
import { orderDashboardUrl } from "@/lib/order-dashboard";
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
          Email, total, status, and a Stripe or PayPal link. No card data.
        </p>
        <p className="text-sm text-muted-foreground">
          Oversold means a paid order asked for more units than were on hand. Resolve it by refunding or restocking.
        </p>
      </div>
      <ModeBanner mode={loaded.mode} />
      <OrdersTable orders={loaded.orders} />
    </div>
  );
}

async function loadOrders(): Promise<{ mode: "memory" | "postgres" | "unavailable"; orders: AdminOrderView[] } | null> {
  try {
    const orders = await listOrders();
    return {
      mode: stockMode(),
      orders: orders.map((order) =>
        presentAdminOrder(order, orderDashboardUrl(order.paymentIntentId, order.stripeSessionId)),
      ),
    };
  } catch (error) {
    if (error instanceof InventoryUnavailable) return null;
    throw error;
  }
}
