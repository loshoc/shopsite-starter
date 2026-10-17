import { parseCartLines } from "@/lib/cart-lines";
import { productionDatabaseProblem } from "@/lib/database-url";
import { buyerPayPalError, createPayPalOrder, paypalOfferProblem, PayPalConfigError } from "@/lib/paypal";
import { checkAvailability } from "@/lib/stock";
import { requestHostValues } from "@/lib/stripe-live";
import { InventoryUnavailable } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Creates a PayPal order for the same cart lines Stripe Checkout uses.
 * Availability is checked first. This route does not write stock.
 */
export async function POST(request: Request) {
  const lines = await parseCartLines(request);
  if (!lines) {
    return Response.json({ error: "Cart is empty or invalid." }, { status: 400 });
  }

  const requestHosts = requestHostValues(request.headers);
  const offerProblem = paypalOfferProblem(requestHosts);
  if (offerProblem) {
    return Response.json({ error: buyerPayPalError(offerProblem) }, { status: 503 });
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

    const orderId = await createPayPalOrder(lines, requestHosts);
    return Response.json({ orderId });
  } catch (error) {
    if (error instanceof PayPalConfigError) {
      return Response.json({ error: buyerPayPalError(error.message) }, { status: 503 });
    }
    if (error instanceof InventoryUnavailable) {
      const problem = productionDatabaseProblem();
      return Response.json(
        { error: problem ?? "Inventory is unavailable. Checkout was not started." },
        { status: 503 },
      );
    }
    console.error("paypal order failed", error instanceof Error ? error.name : "error");
    return Response.json({ error: "PayPal checkout could not be started." }, { status: 502 });
  }
}
