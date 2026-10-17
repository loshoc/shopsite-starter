import { getProductBySku } from "@/data/products";
import type { ReservationLine } from "@/lib/types";

/**
 * The bag the buyer already has. Stripe Checkout and PayPal both read this
 * shape. There is no second cart.
 */
export async function parseCartLines(request: Request): Promise<ReservationLine[] | null> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return null;
  }
  if (!body || typeof body !== "object") return null;
  const raw = (body as { lines?: unknown }).lines;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 20) return null;
  const merged = new Map<string, number>();
  for (const line of raw) {
    if (!line || typeof line !== "object") return null;
    const skuId = (line as { skuId?: unknown }).skuId;
    const qty = (line as { qty?: unknown }).qty;
    if (typeof skuId !== "string" || !/^[\w-]{1,64}$/.test(skuId)) return null;
    if (!getProductBySku(skuId)) return null;
    if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 1 || qty > 99) return null;
    const next = (merged.get(skuId) ?? 0) + qty;
    if (next > 99) return null;
    merged.set(skuId, next);
  }
  return [...merged.entries()].map(([skuId, qty]) => ({ skuId, qty }));
}
