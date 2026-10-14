"use client";

import { useCart } from "@/components/shop/cart-provider";
import { cn } from "@/lib/utils";

export function AddToCart({
  skuId,
  disabled,
  qty = 1,
  label = "Add to bag",
  className,
}: {
  skuId: string;
  disabled?: boolean;
  qty?: number;
  label?: string;
  className?: string;
}) {
  const cart = useCart();
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => cart.add(skuId, qty)}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-full bg-fg px-4 text-sm text-surface transition hover:opacity-80 disabled:cursor-not-allowed disabled:bg-fg/20",
        className,
      )}
    >
      {disabled ? "Sold out" : label}
    </button>
  );
}
