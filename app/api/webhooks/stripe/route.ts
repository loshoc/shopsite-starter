import { dispatchStripeEvent, verifyStripeEvent } from "@/lib/stripe-events";

export const runtime = "nodejs";

/**
 * Verify the Stripe signature before any inventory or order write.
 * A bad signature returns 400 and does not touch the database.
 * Handlers are idempotent via processed_stock_events.
 * Partial refunds do not auto-restock (see lib/db.ts applyRefund).
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  const verified = verifyStripeEvent(rawBody, signature);
  if (!verified.ok) {
    return Response.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  try {
    await dispatchStripeEvent(verified.event);
  } catch (error) {
    console.error("stripe webhook handler failed", error instanceof Error ? error.name : "error");
    return Response.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return Response.json({ received: true });
}
