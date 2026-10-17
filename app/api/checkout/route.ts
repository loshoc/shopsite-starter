import { parseCartLines } from "@/lib/cart-lines";
import { productionDatabaseProblem } from "@/lib/database-url";
import { InventoryUnavailable } from "@/lib/types";
import { checkAvailability } from "@/lib/stock";
import { createCheckoutSession, stripeSecretProblem } from "@/lib/stripe";
import { LIVE_STRIPE_LOCAL_MESSAGE, liveStripeLocalProblemFromEnv, requestHostValues } from "@/lib/stripe-live";

export const runtime = "nodejs";

/**
 * P0-1: availability is checked before any Stripe session is created.
 * requested > liveQty (missing row = 0) returns 409 and stops here.
 */
export async function POST(request: Request) {
  const lines = await parseCartLines(request);
  if (!lines) {
    return Response.json({ error: "Cart is empty or invalid." }, { status: 400 });
  }

  const requestHosts = requestHostValues(request.headers);
  if (!stripeSecretProblem()) {
    const liveProblem = liveStripeLocalProblemFromEnv(requestHosts);
    if (liveProblem) {
      return Response.json({ error: liveProblem }, { status: 503 });
    }
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

    const liveProblem = liveStripeLocalProblemFromEnv(requestHosts);
    if (liveProblem) {
      return Response.json({ error: liveProblem }, { status: 503 });
    }

    const url = await createCheckoutSession(lines, requestHosts);
    return Response.json({ url });
  } catch (error) {
    if (error instanceof Error && error.message === LIVE_STRIPE_LOCAL_MESSAGE) {
      return Response.json({ error: LIVE_STRIPE_LOCAL_MESSAGE }, { status: 503 });
    }
    if (error instanceof InventoryUnavailable) {
      const problem = productionDatabaseProblem();
      return Response.json(
        { error: problem ?? "Inventory is unavailable. Checkout was not started." },
        { status: 503 },
      );
    }
    console.error("checkout failed", error instanceof Error ? error.name : "error");
    return Response.json({ error: "Checkout could not be started." }, { status: 502 });
  }
}

