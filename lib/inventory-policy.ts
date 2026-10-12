/**
 * Inventory decisions with no database and no Stripe calls.
 *
 * P0-1 Fail-closed sold-out:
 *   For each cart line, if requested > liveQty, reject and do not create a
 *   Checkout Session. A missing stock row counts as qty 0 unless the live
 *   status flag is "unlimited". Catalogue `stockUnits` is not an exemption.
 *   available === 0 is never treated as orderable.
 *
 * P0-2 Partial refunds:
 *   A full refund may restock the reserved units.
 *   A partial refund must not auto-restock. Admin restocks those explicitly.
 *
 * Oversold:
 *   A paid webhook still records the order when a line asks for more than
 *   is on hand. Quantity floors at 0. Unlimited rows are not oversold.
 */

export type LiveStatus = "active" | "hidden" | "unlimited" | "missing";

export type LiveQty = {
  qty: number;
  status: LiveStatus;
};

export function rejectsForStock(requested: number, live: LiveQty): boolean {
  if (!Number.isInteger(requested) || requested < 1) return true;
  if (live.status === "hidden") return true;
  if (live.status === "unlimited") return false;
  return requested > live.qty;
}

export function isOrderable(live: LiveQty, productHidden = false): boolean {
  if (productHidden) return false;
  if (live.status === "hidden") return false;
  if (live.status === "unlimited") return true;
  return live.qty > 0;
}

export type RefundKind = "none" | "partial" | "full";

export function classifyRefund(
  amount: number,
  amountRefunded: number,
  fullyRefunded: boolean,
): RefundKind {
  if (!Number.isFinite(amountRefunded) || amountRefunded <= 0) return "none";
  if (fullyRefunded || (Number.isFinite(amount) && amountRefunded >= amount)) {
    return "full";
  }
  return "partial";
}

/** Full refunds may restock. Partial refunds must not. */
export function shouldAutoRestock(kind: RefundKind): boolean {
  return kind === "full";
}

/**
 * Apply a paid line to on-hand quantity.
 * `qty` is never negative. `oversold` is true only when the request was
 * greater than the quantity on hand before the decrement.
 */
export function applyOnHand(available: number, requested: number): { qty: number; oversold: boolean } {
  const onHand = Number.isFinite(available) ? Math.max(0, available) : 0;
  const ask = Number.isFinite(requested) ? Math.max(0, requested) : 0;
  return {
    qty: Math.max(0, onHand - ask),
    oversold: ask > onHand,
  };
}

/** Unlimited catalogue rows do not flag an order oversold. */
export function lineIsOversold(status: string, available: number, requested: number): boolean {
  if (status === "unlimited") return false;
  return applyOnHand(available, requested).oversold;
}

export type StockBadge = "missing" | "hidden" | "unlimited" | "out" | "low" | "in";

export function stockBadge(input: {
  status: LiveStatus;
  qty: number;
  lowStockThreshold: number;
}): StockBadge {
  if (input.status === "missing") return "missing";
  if (input.status === "hidden") return "hidden";
  if (input.status === "unlimited") return "unlimited";
  if (input.qty <= 0) return "out";
  if (input.qty <= input.lowStockThreshold) return "low";
  return "in";
}
