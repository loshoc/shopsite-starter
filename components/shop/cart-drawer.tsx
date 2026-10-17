"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { getProductBySku } from "@/data/products";
import { siteConfig } from "@/data/site.config";
import { PayPalButtons } from "@/components/shop/paypal-buttons";
import { useCart } from "@/components/shop/cart-provider";
import { formatMoney } from "@/lib/format";
import { shouldMoveFocusToBag } from "@/lib/storefront-ui";

const FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled])";

function moveFocusToBag() {
  const bag = document.getElementById("bag-control");
  const activeId = document.activeElement instanceof HTMLElement ? document.activeElement.id : null;
  if (bag instanceof HTMLElement && shouldMoveFocusToBag(activeId)) bag.focus();
}

export function CartDrawer() {
  const cart = useCart();
  const { open, setOpen } = cart;
  const panelRef = useRef<HTMLElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [paypalMessage, setPaypalMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [paypal, setPaypal] = useState<{ clientId: string; currency: string } | null>(null);

  function closeBag() {
    setOpen(false);
    moveFocusToBag();
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/paypal/config", { headers: { accept: "application/json" } })
      .then((response) => response.json())
      .then((data: { enabled?: boolean; clientId?: string; currency?: string }) => {
        if (cancelled) return;
        if (data.enabled && data.clientId && data.currency) {
          setPaypal({ clientId: data.clientId, currency: data.currency });
        } else {
          setPaypal(null);
        }
      })
      .catch(() => {
        if (!cancelled) setPaypal(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("[data-bag-close]")?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        moveFocusToBag();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.tabIndex !== -1);
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, setOpen]);

  if (!open) return null;

  const lines = cart.items.map((item) => {
    const product = getProductBySku(item.skuId);
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
      <button type="button" className="absolute inset-0 bg-fg/30" aria-label="Close bag" tabIndex={-1} onClick={closeBag} />
      <aside
        ref={panelRef}
        id="bag-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bag-title"
        tabIndex={-1}
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-surface shadow-xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="bag-title" className="text-xl font-medium">
            Your bag
          </h2>
          <button
            type="button"
            data-bag-close
            className="text-sm text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            onClick={closeBag}
          >
            Close
          </button>
        </div>
        {lines.length === 0 ? (
          <div className="flex-1 px-5 py-5">
            <p className="text-sm text-muted">Your bag is empty.</p>
            <Link
              href="/shop"
              className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-fg px-4 text-sm text-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
              onClick={() => setOpen(false)}
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {lines.map((line) => (
                <div key={line.skuId} className="flex items-start justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <p className="font-medium">{line.product?.name ?? line.skuId}</p>
                    <p className="text-sm text-muted">
                      {line.product ? formatMoney(line.product.priceCents, siteConfig.currency) : "Unavailable"}
                    </p>
                    <label className="mt-2 flex items-center gap-2 text-xs text-muted">
                      Qty
                      <input
                        className="h-8 w-16 border border-border bg-surface px-2"
                        type="number"
                        min={1}
                        max={99}
                        value={line.qty}
                        onChange={(event) => cart.setQty(line.skuId, Number(event.target.value))}
                      />
                    </label>
                  </div>
                  <button type="button" className="text-xs text-muted underline" onClick={() => cart.remove(line.skuId)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t border-border px-5 py-4">
              <div className="flex items-center justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatMoney(total, siteConfig.currency)}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">
                {paypal
                  ? "Stripe Checkout collects coupons and tax. PayPal is a separate button and does not apply those coupons. Stock is checked before either payment starts, and it changes only after a signed webhook."
                  : "Coupons and tax are collected by Stripe Checkout. Guest checkout is fine. Stock is checked again before the session is created."}
              </p>
              {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
              {paypalMessage ? <p className="mt-3 text-sm text-danger">{paypalMessage}</p> : null}
              <button
                type="button"
                disabled={pending || lines.length === 0}
                onClick={() => void checkout()}
                className="mt-4 h-11 w-full rounded-full bg-fg text-sm text-surface disabled:opacity-40"
              >
                {pending ? "Starting checkout…" : paypal ? "Checkout with Stripe" : "Checkout"}
              </button>
              {paypal ? (
                <PayPalButtons
                  clientId={paypal.clientId}
                  currency={paypal.currency}
                  lines={cart.items}
                  disabled={pending}
                  onMessage={setPaypalMessage}
                />
              ) : null}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
