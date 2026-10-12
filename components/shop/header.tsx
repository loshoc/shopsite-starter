"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { siteConfig } from "@/data/site.config";
import { useCart } from "@/components/shop/cart-provider";

export function Header() {
  const cart = useCart();
  return (
    <header className="border-b border-sand/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="font-serif text-xl tracking-tight">
          {siteConfig.name}
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/shop" className="hover:text-copper">
            Shop
          </Link>
          <Link href="/shipping" className="hidden hover:text-copper sm:inline">
            Shipping
          </Link>
          <Link href="/faq" className="hidden hover:text-copper sm:inline">
            FAQ
          </Link>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-3 py-1.5 hover:border-copper"
            onClick={() => cart.setOpen(true)}
          >
            <ShoppingBag className="size-4" aria-hidden />
            Bag
            <span className="tabular-nums">{cart.count}</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
