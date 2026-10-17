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
      className={cn("shop-btn-primary shop-focus h-10 px-4 text-sm", className)}
    >
      {disabled ? "Sold out" : label}
    </button>
  );
}
