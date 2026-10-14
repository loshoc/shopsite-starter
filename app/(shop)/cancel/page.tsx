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
    <div className="mx-auto max-w-xl px-5 py-16">
      <h1 className="text-3xl font-medium tracking-tight">Checkout canceled.</h1>
      <p className="mt-3 text-muted">Nothing was charged. The bag is still here if you want to try again.</p>
      <Link href="/shop" className="mt-6 inline-block text-sm underline">
        Return to the shop
      </Link>
    </div>
  );
}
