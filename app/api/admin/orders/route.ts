import { requireAdminApi } from "@/lib/admin-guard";
import { presentAdminOrder } from "@/lib/admin-orders";
import { listOrders } from "@/lib/db";
import { adminJson } from "@/lib/http";
import { orderDashboardUrl } from "@/lib/order-dashboard";
import { InventoryUnavailable } from "@/lib/types";

export const runtime = "nodejs";

/** Thin rows only: email, total, status, oversold, session id, Dashboard link. */
export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;
  try {
    const orders = await listOrders();
    return adminJson({
      orders: orders.map((order) =>
        presentAdminOrder(order, orderDashboardUrl(order.paymentIntentId, order.stripeSessionId)),
      ),
    });
  } catch (error) {
    if (error instanceof InventoryUnavailable) {
      return adminJson({ error: "Inventory store is unavailable." }, 503);
    }
    return adminJson({ error: "Could not load orders." }, 500);
  }
}
