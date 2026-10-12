"use client";

import { useState } from "react";

import { products } from "@/data/products";
import { useCart } from "@/components/shop/cart-provider";
import { formatMoney } from "@/lib/format";

export function CartDrawer() {
  const cart = useCart();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!cart.open) return null;

  const lines = cart.items.map((item) => {
    const product = products.find((entry) => entry.skuId === item.skuId);
    return { ...item, product };
  });
  const total = lines.reduce((sum, line) => sum + (line.product?.priceCents ?? 0) * line.qty, 0);

  async function checkout() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lines: cart.items.map((item) => ({ skuId: item.skuId, qty: item.qty })) }),
      });
      const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string; liveQty?: number };
      if (!response.ok || !data.url) {
        const qtyNote = typeof data.liveQty === "number" ? ` ${data.liveQty} available.` : "";
        setError((data.error ?? "Checkout could not start.") + qtyNote);
        setPending(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError("Checkout could not start.");
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40">
      <button type="button" className="absolute inset-0 bg-ink/30" aria-label="Close bag" onClick={() => cart.setOpen(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-foam shadow-xl">
        <div className="flex items-center justify-between border-b border-sand px-5 py-4">
          <h2 className="font-serif text-2xl">Your bag</h2>
          <button type="button" className="text-sm text-ink/70" onClick={() => cart.setOpen(false)}>
            Close
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {lines.length === 0 ? <p className="text-sm text-ink/70">Nothing in the bag yet.</p> : null}
          {lines.map((line) => (
            <div key={line.skuId} className="flex items-start justify-between gap-3 border-b border-sand pb-4">
              <div>
                <p className="font-medium">{line.product?.name ?? line.skuId}</p>
                <p className="text-sm text-ink/60">{line.product ? formatMoney(line.product.priceCents) : "Unavailable"}</p>
                <label className="mt-2 flex items-center gap-2 text-xs text-ink/60">
                  Qty
                  <input
                    className="h-8 w-16 border border-sand bg-white px-2"
                    type="number"
                    min={1}
                    max={99}
                    value={line.qty}
                    onChange={(event) => cart.setQty(line.skuId, Number(event.target.value))}
                  />
                </label>
              </div>
              <button type="button" className="text-xs text-copper" onClick={() => cart.remove(line.skuId)}>
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="border-t border-sand px-5 py-4">
          <div className="flex items-center justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatMoney(total)}</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-ink/60">
            Coupons and tax are collected by Stripe Checkout. Guest checkout is fine. Stock is checked again before the session is created.
          </p>
          {error ? <p className="mt-3 text-sm text-copper">{error}</p> : null}
          <button
            type="button"
            disabled={pending || lines.length === 0}
            onClick={() => void checkout()}
            className="mt-4 h-11 w-full rounded-full bg-ink text-sm text-foam disabled:opacity-40"
          >
            {pending ? "Starting checkout…" : "Checkout"}
          </button>
        </div>
      </aside>
    </div>
  );
}
