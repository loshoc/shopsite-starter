import { getProductBySku } from "@/data/products";
import { InventoryUnavailable } from "@/lib/types";
import { checkAvailability } from "@/lib/stock";
import { createCheckoutSession, stripeSecretProblem } from "@/lib/stripe";
import type { ReservationLine } from "@/lib/types";

export const runtime = "nodejs";

/**
 * P0-1: availability is checked before any Stripe session is created.
 * requested > liveQty (missing row = 0) returns 409 and stops here.
 */
export async function POST(request: Request) {
  const lines = await parseLines(request);
  if (!lines) {
    return Response.json({ error: "Cart is empty or invalid." }, { status: 400 });
  }

  try {
    const failure = await checkAvailability(lines);
    if (failure) {
      const status = failure.reason === "unknown" ? 400 : 409;
      const error =
        failure.reason === "unknown"
          ? "Unknown item in the cart."
          : "Not enough stock to start checkout.";
      return Response.json(
        { error, skuId: failure.skuId, requested: failure.requested, liveQty: failure.liveQty },
        { status },
      );
    }

    if (stripeSecretProblem()) {
      return Response.json({ error: "Stripe is not configured." }, { status: 503 });
    }

    const url = await createCheckoutSession(lines);
    return Response.json({ url });
  } catch (error) {
    if (error instanceof InventoryUnavailable) {
      return Response.json({ error: "Inventory is unavailable. Checkout was not started." }, { status: 503 });
    }
    console.error("checkout failed", error instanceof Error ? error.name : "error");
    return Response.json({ error: "Checkout could not be started." }, { status: 502 });
  }
}

async function parseLines(request: Request): Promise<ReservationLine[] | null> {
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
