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
    <div className="mx-auto max-w-xl px-5 py-20">
      <ClearCart />
      <p className="text-xs uppercase tracking-[0.2em] text-copper">Paid</p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">Thank you.</h1>
      <p className="mt-4 text-ink/75">
        Stripe has the payment. This page only shows the email and total, never the card.
      </p>
      {summary ? (
        <dl className="mt-8 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink/60">Email</dt>
            <dd>{summary.email ?? "Guest"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink/60">Total</dt>
            <dd>{formatMoney(summary.totalCents, summary.currency)}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-8 text-sm text-ink/70">If Stripe redirected you here, the receipt is in your inbox when email is collected at Checkout.</p>
      )}
      <Link href="/shop" className="mt-8 inline-block text-sm text-copper">
        Continue browsing
      </Link>
    </div>
  );
}
