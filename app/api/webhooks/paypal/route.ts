import { dispatchPayPalEvent } from "@/lib/paypal-events";
import { verifyPayPalWebhook } from "@/lib/paypal";

export const runtime = "nodejs";

/**
 * Verify the PayPal signature before any inventory or order write.
 * A bad signature returns 400 and does not touch the database.
 * The buyer return URL and /api/paypal/orders/capture do not write stock.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const verified = await verifyPayPalWebhook(rawBody, request.headers);
  if (!verified.ok) {
    const status = verified.retry ? 500 : 400;
    const error = verified.retry ? "PayPal webhook verification failed." : "Invalid webhook signature.";
    return Response.json({ error }, { status });
  }

  try {
    await dispatchPayPalEvent(verified.event);
  } catch (error) {
    console.error("paypal webhook handler failed", error instanceof Error ? error.name : "error");
    return Response.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return Response.json({ received: true });
}
