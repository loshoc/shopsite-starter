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
      className="inline-flex h-10 items-center justify-center rounded-full bg-ink px-4 text-sm text-foam transition hover:bg-copper disabled:cursor-not-allowed disabled:bg-ink/20"
    >
      {disabled ? "Sold out" : label}
    </button>
  );
}
