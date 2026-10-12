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
