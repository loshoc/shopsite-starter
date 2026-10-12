import type { OrderRecord } from "@/lib/types";

export type AdminOrderFilter = "all" | "oversold";

/** Fields the orders screen and the admin orders API are allowed to show. */
export type AdminOrderView = {
  email: string | null;
  totalCents: number;
  currency: string;
  status: OrderRecord["status"];
  stripeSessionId: string;
  dashboardUrl: string;
  restocked: boolean;
  oversold: boolean;
  createdAt: string;
};

export function presentAdminOrder(order: OrderRecord, dashboardUrl: string): AdminOrderView {
  return {
    email: order.email,
    totalCents: order.totalCents,
    currency: order.currency,
    status: order.status,
    stripeSessionId: order.stripeSessionId,
    dashboardUrl,
    restocked: order.restocked,
    oversold: order.oversold,
    createdAt: order.createdAt,
  };
}

export function filterAdminOrders<T extends { oversold: boolean }>(
  orders: readonly T[],
  filter: AdminOrderFilter,
): T[] {
  if (filter === "oversold") return orders.filter((order) => order.oversold);
  return [...orders];
}

export function oversoldBadge(oversold: boolean): "Oversold" | null {
  return oversold ? "Oversold" : null;
}
