import type { Metadata } from "next";
import Link from "next/link";

import { ClearCart } from "@/components/shop/clear-cart";
import { formatMoney, maskEmail } from "@/lib/format";
import { readPayPalCheckoutSummary } from "@/lib/paypal";
import { pageMetadata } from "@/lib/seo";
import { readCheckoutSummary } from "@/lib/stripe";

export const metadata: Metadata = pageMetadata({
  title: "Order received",
  path: "/success",
  index: false,
});

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; paypal_order_id?: string }>;
}) {
  const { session_id: sessionId, paypal_order_id: paypalOrderId } = await searchParams;
  const summary = sessionId
    ? await readCheckoutSummary(sessionId)
    : paypalOrderId
      ? await readPayPalCheckoutSummary(paypalOrderId)
      : null;

  return (
    <div className="shop-pad-loose mx-auto max-w-xl">
      <ClearCart />
      <h1 className="shop-display font-medium tracking-tight">Thank you.</h1>
      <p className="mt-3 text-muted">
        {paypalOrderId
          ? "PayPal accepted the payment. Stock and the order row update only after the signed PayPal webhook. This page does not mark the order paid."
          : "Stripe has the payment. This page only shows a masked email and the total, never the card."}
      </p>
      {summary ? (
        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Email</dt>
            <dd>{summary.email ? maskEmail(summary.email) : "Guest"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Total</dt>
            <dd>{formatMoney(summary.totalCents, summary.currency)}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-6 text-sm text-muted">
          {paypalOrderId
            ? "If PayPal sent you here, the receipt is in your PayPal account."
            : "If Stripe redirected you here, the receipt is in your inbox when email is collected at Checkout."}
        </p>
      )}
      <Link href="/shop" className="shop-link shop-link-rest shop-focus shop-follow text-sm">
        Continue browsing
      </Link>
    </div>
  );
}
