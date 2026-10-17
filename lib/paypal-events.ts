import "server-only";

import { getProductBySku } from "@/data/products";
import { siteConfig } from "@/data/site.config";
import { applyPaidCheckout, applyRefund, markEventProcessed } from "@/lib/db";
import {
  captureIdFromLinks,
  getPayPalCapture,
  getPayPalOrder,
  parseMoney,
  paypalConfigProblem,
  paypalSessionId,
  type PayPalEvent,
  type PayPalMode,
} from "@/lib/paypal";
import type { ReservationLine } from "@/lib/types";

/**
 * Stock and order writes for PayPal. Callers must verify the webhook
 * signature first. A buyer return URL and the capture route do not call this.
 */

type Money = { currency_code?: unknown; value?: unknown };

type PayPalItem = {
  sku?: unknown;
  quantity?: unknown;
  unit_amount?: Money;
};

type PayPalCapture = {
  id?: unknown;
  status?: unknown;
  amount?: Money;
};

type PayPalOrder = {
  status?: unknown;
  payer?: { email_address?: unknown };
  purchase_units?: {
    custom_id?: unknown;
    amount?: Money;
    items?: PayPalItem[];
    payments?: { captures?: PayPalCapture[] };
  }[];
};

export async function dispatchPayPalEvent(event: PayPalEvent): Promise<void> {
  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    await onCaptureCompleted(event);
    return;
  }
  if (event.event_type === "PAYMENT.CAPTURE.REFUNDED") {
    await onCaptureRefunded(event);
  }
}

async function onCaptureCompleted(event: PayPalEvent): Promise<void> {
  const eventId = eventIdOf(event);
  const resource = event.resource;
  if (!eventId || !resource || resource.status !== "COMPLETED") {
    if (eventId) await markEventProcessed(eventId, event.event_type ?? "PAYMENT.CAPTURE.COMPLETED");
    return;
  }
  const captureId = typeof resource.id === "string" ? resource.id : "";
  const related = resource.supplementary_data as { related_ids?: { order_id?: unknown } } | undefined;
  const orderId = related?.related_ids?.order_id;
  if (!/^([A-Z0-9]{8,36})$/.test(captureId) || typeof orderId !== "string") {
    throw new Error("PayPal capture is missing an order id");
  }
  const order = (await getPayPalOrder(orderId)) as PayPalOrder;
  const paid = paidFromOrder(order, captureId);
  if (!paid) throw new Error("PayPal order did not match the catalogue");
  await applyPaidCheckout({
    eventId,
    eventType: event.event_type ?? "PAYMENT.CAPTURE.COMPLETED",
    stripeSessionId: paypalSessionId(orderId),
    email: paid.email,
    totalCents: paid.totalCents,
    currency: paid.currency,
    paymentIntentId: captureId,
    reservation: paid.lines,
  });
}

async function onCaptureRefunded(event: PayPalEvent): Promise<void> {
  const eventId = eventIdOf(event);
  const resource = event.resource;
  if (!eventId || !resource) return;
  if (resource.status !== "COMPLETED") {
    await markEventProcessed(eventId, event.event_type ?? "PAYMENT.CAPTURE.REFUNDED");
    return;
  }
  const mode = paypalMode();
  if (!mode) throw new Error("PayPal is not configured");
  const captureId = captureIdFromLinks(resource.links, mode);
  if (!captureId) throw new Error("PayPal refund is missing a capture id");
  const capture = (await getPayPalCapture(captureId)) as PayPalCapture;
  const currency = siteConfig.currency.toUpperCase();
  const amount = parseMoney(capture.amount, currency);
  const refundAmount = parseMoney(resource.amount as Money, currency);
  if (amount == null || refundAmount == null) throw new Error("PayPal refund amount is invalid");
  const fullyRefunded = capture.status === "REFUNDED";
  await applyRefund({
    eventId,
    eventType: event.event_type ?? "PAYMENT.CAPTURE.REFUNDED",
    paymentIntentId: captureId,
    amount,
    amountRefunded: fullyRefunded ? amount : refundAmount,
    fullyRefunded,
  });
}

function paidFromOrder(
  order: PayPalOrder,
  captureId: string,
): { lines: ReservationLine[]; totalCents: number; email: string | null; currency: string } | null {
  if (order.status !== "COMPLETED") return null;
  const unit = order.purchase_units?.[0];
  if (!unit) return null;
  const currency = siteConfig.currency.toUpperCase();
  const amountCents = parseMoney(unit.amount, currency);
  if (amountCents == null) return null;
  const capture = (unit.payments?.captures ?? []).find((item) => item.id === captureId && item.status === "COMPLETED");
  if (!capture) return null;
  const captureCents = parseMoney(capture.amount, currency);
  if (captureCents == null || captureCents !== amountCents) return null;
  const items = unit.items ?? [];
  if (items.length === 0 || items.length > 20) return null;
  const lines: ReservationLine[] = [];
  let sum = 0;
  for (const item of items) {
    if (typeof item.sku !== "string") return null;
    const product = getProductBySku(item.sku);
    const qty = typeof item.quantity === "string" ? Number(item.quantity) : item.quantity;
    if (!product || typeof qty !== "number" || !Number.isInteger(qty) || qty < 1 || qty > 99) return null;
    const unitCents = parseMoney(item.unit_amount, currency);
    if (unitCents == null || unitCents !== product.priceCents) return null;
    sum += unitCents * qty;
    lines.push({ skuId: item.sku, qty });
  }
  if (sum !== amountCents) return null;
  if (typeof unit.custom_id === "string" && unit.custom_id) {
    if (!sameLines(parseCustomId(unit.custom_id), lines)) return null;
  }
  const email = order.payer?.email_address;
  return {
    lines,
    totalCents: amountCents,
    email: typeof email === "string" && email.includes("@") && email.length <= 320 ? email : null,
    currency: siteConfig.currency,
  };
}

function parseCustomId(raw: string): ReservationLine[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const lines: ReservationLine[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") return null;
      const skuId = (item as { skuId?: unknown }).skuId;
      const qty = (item as { qty?: unknown }).qty;
      if (typeof skuId !== "string" || typeof qty !== "number" || !Number.isInteger(qty) || qty < 1) return null;
      lines.push({ skuId, qty });
    }
    return lines;
  } catch {
    return null;
  }
}

function sameLines(left: ReservationLine[] | null, right: ReservationLine[]): boolean {
  if (!left || left.length !== right.length) return false;
  const sort = (lines: ReservationLine[]) => [...lines].sort((a, b) => a.skuId.localeCompare(b.skuId));
  const a = sort(left);
  const b = sort(right);
  return a.every((line, index) => line.skuId === b[index]?.skuId && line.qty === b[index]?.qty);
}

function eventIdOf(event: PayPalEvent): string | null {
  if (typeof event.id !== "string" || !/^[A-Za-z0-9_-]{8,128}$/.test(event.id)) return null;
  return event.id;
}

function paypalMode(): PayPalMode | null {
  if (paypalConfigProblem()) return null;
  const mode = process.env.PAYPAL_MODE?.trim().toLowerCase();
  return mode === "sandbox" || mode === "live" ? mode : null;
}
