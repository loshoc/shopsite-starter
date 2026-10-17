import { buyerPayPalError, capturePayPalOrder, paypalOfferProblem, PayPalConfigError } from "@/lib/paypal";
import { requestHostValues } from "@/lib/stripe-live";

export const runtime = "nodejs";

/**
 * Server-side capture after the buyer approves a PayPal button.
 * The response is not a stock write. Order rows are created only from
 * the signed webhook at /api/webhooks/paypal.
 */
export async function POST(request: Request) {
  const orderId = await parseOrderId(request);
  if (!orderId) {
    return Response.json({ error: "PayPal order is invalid." }, { status: 400 });
  }

  const requestHosts = requestHostValues(request.headers);
  const offerProblem = paypalOfferProblem(requestHosts);
  if (offerProblem) {
    return Response.json({ error: buyerPayPalError(offerProblem) }, { status: 503 });
  }

  try {
    await capturePayPalOrder(orderId, requestHosts);
    return Response.json({ ok: true, orderId });
  } catch (error) {
    if (error instanceof PayPalConfigError) {
      return Response.json({ error: buyerPayPalError(error.message) }, { status: 503 });
    }
    console.error("paypal capture failed", error instanceof Error ? error.name : "error");
    return Response.json({ error: "PayPal capture could not be completed." }, { status: 502 });
  }
}

async function parseOrderId(request: Request): Promise<string | null> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return null;
  }
  if (!body || typeof body !== "object") return null;
  const orderId = (body as { orderId?: unknown }).orderId;
  if (typeof orderId !== "string" || !/^[A-Z0-9]{10,36}$/.test(orderId)) return null;
  return orderId;
}
