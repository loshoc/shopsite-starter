import type { Metadata } from "next";
import Link from "next/link";

import { ClearCart } from "@/components/shop/clear-cart";
import { formatMoney } from "@/lib/format";
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
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  const summary = sessionId ? await readCheckoutSummary(sessionId) : null;

  return (
    <div className="mx-auto max-w-xl px-5 py-16">
      <ClearCart />
      <h1 className="text-3xl font-medium tracking-tight">Thank you.</h1>
      <p className="mt-3 text-muted">
        Stripe has the payment. This page only shows the email and total, never the card.
      </p>
      {summary ? (
        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Email</dt>
            <dd>{summary.email ?? "Guest"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Total</dt>
            <dd>{formatMoney(summary.totalCents, summary.currency)}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-6 text-sm text-muted">If Stripe redirected you here, the receipt is in your inbox when email is collected at Checkout.</p>
      )}
      <Link href="/shop" className="mt-6 inline-block text-sm underline">
        Continue browsing
      </Link>
    </div>
  );
}
