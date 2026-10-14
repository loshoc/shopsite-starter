"use client";

import { useCart } from "@/components/shop/cart-provider";

export function AddToCart({
  skuId,
  disabled,
  qty = 1,
  label = "Add to bag",
}: {
  skuId: string;
  disabled?: boolean;
  qty?: number;
  label?: string;
}) {
  const cart = useCart();
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => cart.add(skuId, qty)}
      className="inline-flex h-10 items-center justify-center rounded-full bg-fg px-4 text-sm text-surface transition hover:opacity-80 disabled:cursor-not-allowed disabled:bg-fg/20"
    >
      {disabled ? "Sold out" : label}
    </button>
  );
}
