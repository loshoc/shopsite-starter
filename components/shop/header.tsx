"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { siteConfig } from "@/data/site.config";
import { useCart } from "@/components/shop/cart-provider";

export function Header() {
  const cart = useCart();
  return (
    <header className="border-b border-border/80">
      <div className="shop-bar mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link href="/" className="shop-link shop-focus text-sm font-medium">
          {siteConfig.name}
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/shop" className="shop-link shop-focus">
            Shop
          </Link>
          <Link href="/shipping" className="shop-link shop-focus hidden sm:inline">
            Shipping
          </Link>
          <Link href="/faq" className="shop-link shop-focus hidden sm:inline">
            FAQ
          </Link>
          <button
            id="bag-control"
            type="button"
            aria-expanded={cart.open}
            aria-controls="bag-drawer"
            className="shop-bag-control shop-focus inline-flex items-center gap-2 rounded-full border border-fg/15 px-3 py-1.5"
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
