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
    <div className="mx-auto max-w-xl px-5 py-20">
      <h1 className="font-serif text-5xl tracking-tight">Checkout canceled.</h1>
      <p className="mt-4 text-fg/75">Nothing was charged. The bag is still here if you want to try again.</p>
      <Link href="/shop" className="mt-8 inline-block text-sm text-highlight">
        Return to the shop
      </Link>
    </div>
  );
}
