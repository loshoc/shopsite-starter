"use client";

import { useEffect } from "react";

import { useCart } from "@/components/shop/cart-provider";

export function ClearCart() {
  const cart = useCart();
  useEffect(() => {
    cart.clear();
    // Clear once when the success page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
