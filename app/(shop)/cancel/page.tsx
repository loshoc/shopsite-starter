import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Checkout canceled" };

export default function CancelPage() {
  return (
    <div className="mx-auto max-w-xl px-5 py-20">
      <h1 className="font-serif text-5xl tracking-tight">Checkout canceled.</h1>
      <p className="mt-4 text-ink/75">Nothing was charged. The bag is still here if you want to try again.</p>
      <Link href="/shop" className="mt-8 inline-block text-sm text-copper">
        Return to the shop
      </Link>
    </div>
  );
}
