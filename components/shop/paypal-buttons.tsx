"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type CartLine = { skuId: string; qty: number };

type PayPalButtonsApi = {
  close: () => Promise<void> | void;
  render: (target: string) => Promise<void>;
};

type PayPalNamespace = {
  Buttons: (options: {
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onCancel: () => void;
    onError: () => void;
  }) => PayPalButtonsApi;
};

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

const CLIENT_ID_RE = /^[A-Za-z0-9_-]{16,128}$/;
const CURRENCY_RE = /^[A-Z]{3}$/;

export function PayPalButtons({
  clientId,
  currency,
  lines,
  disabled,
  onMessage,
}: {
  clientId: string;
  currency: string;
  lines: CartLine[];
  disabled: boolean;
  onMessage: (message: string) => void;
}) {
  const router = useRouter();
  const hostRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef(lines);
  const onMessageRef = useRef(onMessage);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    linesRef.current = lines;
    onMessageRef.current = onMessage;
    disabledRef.current = disabled;
  });

  useEffect(() => {
    if (!CLIENT_ID_RE.test(clientId) || !CURRENCY_RE.test(currency)) {
      onMessageRef.current("PayPal is not configured.");
      return;
    }
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let buttons: PayPalButtonsApi | null = null;

    async function mount() {
      await loadPayPalScript(clientId, currency);
      if (cancelled || !host || !window.paypal) return;
      host.replaceChildren();
      buttons = window.paypal.Buttons({
        createOrder: async () => {
          if (disabledRef.current) {
            throw new Error("Checkout is already starting.");
          }
          const response = await fetch("/api/paypal/orders", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ lines: linesRef.current }),
          });
          const data = (await response.json().catch(() => ({}))) as { orderId?: string; error?: string };
          if (!response.ok || !data.orderId) {
            const message = data.error ?? "PayPal checkout could not start.";
            onMessageRef.current(message);
            throw new Error(message);
          }
          return data.orderId;
        },
        onApprove: async (data) => {
          const response = await fetch("/api/paypal/orders/capture", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ orderId: data.orderID }),
          });
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          if (!response.ok) {
            const message = body.error ?? "PayPal capture could not be completed.";
            onMessageRef.current(message);
            throw new Error(message);
          }
          router.push(`/success?paypal_order_id=${encodeURIComponent(data.orderID)}`);
        },
        onCancel: () => onMessageRef.current("PayPal checkout was cancelled."),
        onError: () => onMessageRef.current("PayPal checkout could not start."),
      });
      if (cancelled) return;
      await buttons.render("#paypal-button-container");
    }

    void mount().catch(() => {
      if (!cancelled) onMessageRef.current("PayPal could not be loaded.");
    });

    return () => {
      cancelled = true;
      void buttons?.close();
      host.replaceChildren();
    };
  }, [clientId, currency, router]);

  return (
    <div className={disabled ? "mt-3 pointer-events-none opacity-40" : "mt-3"}>
      <p className="mb-2 text-xs text-muted">Pay with PayPal</p>
      <div id="paypal-button-container" ref={hostRef} />
    </div>
  );
}

function loadPayPalScript(clientId: string, currency: string): Promise<void> {
  const params = new URLSearchParams({
    "client-id": clientId,
    currency,
    intent: "capture",
    components: "buttons",
    "disable-funding": "card,credit,venmo,paylater",
  });
  const src = `https://www.paypal.com/sdk/js?${params.toString()}`;
  const existing = document.querySelector<HTMLScriptElement>("script[data-paypal-sdk]");
  if (existing?.src === src && window.paypal) return Promise.resolve();
  existing?.remove();
  delete window.paypal;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.paypalSdk = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("PayPal script failed"));
    document.head.appendChild(script);
  });
}
