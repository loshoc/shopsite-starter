import "server-only";

import Stripe from "stripe";

import { applyPaidCheckout, applyRefund, markEventProcessed } from "@/lib/db";
import type { ReservationLine } from "@/lib/types";
import { webhookSecretProblem } from "@/lib/stripe";

export type VerifiedEvent =
  | { ok: true; event: Stripe.Event }
  | { ok: false };

/**
 * Signature first. This function does not touch the database.
 * Callers must ignore the body until ok is true.
 */
export function verifyStripeEvent(rawBody: string, signature: string | null): VerifiedEvent {
  if (!signature || webhookSecretProblem()) return { ok: false };
  try {
    const event = Stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!.trim(),
    );
    return { ok: true, event };
  } catch {
    return { ok: false };
  }
}

export async function dispatchStripeEvent(event: Stripe.Event): Promise<void> {
  // checkout.session.expired is ignored on purpose. Expiry does not release
  // stock and does not create an order row.
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== "paid") {
      // Async methods complete the session before funds settle. Do not
      // decrement stock or insert an order until a paid event arrives.
      await markEventProcessed(event.id, event.type);
      return;
    }
    await applyPaidCheckout({
      eventId: event.id,
      eventType: event.type,
      stripeSessionId: session.id,
      email: session.customer_details?.email ?? session.customer_email ?? null,
      totalCents: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
      paymentIntentId: paymentIntentId(session.payment_intent),
      reservation: parseReservation(session.metadata?.stockReservation),
    });
    return;
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    await applyRefund({
      eventId: event.id,
      eventType: event.type,
      paymentIntentId: paymentIntentId(charge.payment_intent),
      amount: charge.amount,
      amountRefunded: charge.amount_refunded,
      fullyRefunded: charge.refunded,
    });
  }
}

function paymentIntentId(value: string | Stripe.PaymentIntent | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function parseReservation(raw: string | undefined): ReservationLine[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const lines: ReservationLine[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const skuId = (item as { skuId?: unknown }).skuId;
      const qty = (item as { qty?: unknown }).qty;
      if (typeof skuId === "string" && typeof qty === "number" && Number.isInteger(qty) && qty > 0) {
        lines.push({ skuId, qty });
      }
    }
    return lines;
  } catch {
    return [];
  }
}
