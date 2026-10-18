import type { Metadata } from "next";
import Link from "next/link";

import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Checkout canceled",
  path: "/cancel",
  index: false,
});

export default function CancelPage() {
  return (
    <div className="shop-pad-loose mx-auto max-w-xl">
      <h1 className="shop-display font-medium tracking-tight">Checkout canceled.</h1>
      <p className="mt-3 text-muted">Nothing was charged. The bag is still here if you want to try again.</p>
      <Link href="/shop" className="shop-link shop-link-rest shop-focus shop-follow text-sm">
        Return to the shop
      </Link>
    </div>
  );
}
