import { requireAdminApi } from "@/lib/admin-guard";
import { listOrders } from "@/lib/db";
import { adminJson } from "@/lib/http";
import { stripeDashboardUrl } from "@/lib/stripe";
import { InventoryUnavailable, type OrderRecord } from "@/lib/types";

export const runtime = "nodejs";

/** Thin rows only: email, total, status, session id, Dashboard link. */
export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;
  try {
    const orders = await listOrders();
    return adminJson({ orders: orders.map(toThinOrder) });
  } catch (error) {
    if (error instanceof InventoryUnavailable) {
      return adminJson({ error: "Inventory store is unavailable." }, 503);
    }
    return adminJson({ error: "Could not load orders." }, 500);
  }
}

function toThinOrder(order: OrderRecord) {
  return {
    email: order.email,
    totalCents: order.totalCents,
    currency: order.currency,
    status: order.status,
    stripeSessionId: order.stripeSessionId,
    dashboardUrl: stripeDashboardUrl(order.paymentIntentId, order.stripeSessionId),
    restocked: order.restocked,
    createdAt: order.createdAt,
  };
}
