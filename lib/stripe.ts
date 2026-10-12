import "server-only";

import Stripe from "stripe";

import { isObviousPlaceholder } from "@/lib/admin-secret";
import { appUrl } from "@/lib/app-url";
import { getProductBySku } from "@/data/products";
import { siteConfig } from "@/data/site.config";
import type { ReservationLine } from "@/lib/types";

let stripe: Stripe | null = null;
let stripeKey: string | null = null;

export type KeyState = "missing" | "placeholder" | "test" | "live";

export function stripeSecretProblem(): string | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (!key) return "STRIPE_SECRET_KEY is missing";
  if (isObviousPlaceholder(key) || (!key.startsWith("sk_test_") && !key.startsWith("sk_live_"))) {
    return "STRIPE_SECRET_KEY is a placeholder";
  }
  return null;
}

export function webhookSecretProblem(): string | null {
  const key = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  if (!key) return "STRIPE_WEBHOOK_SECRET is missing";
  if (isObviousPlaceholder(key) || !key.startsWith("whsec_") || key.length < 16) {
    return "STRIPE_WEBHOOK_SECRET is a placeholder";
  }
  return null;
}

export function stripeMode(): KeyState {
  const problem = stripeSecretProblem();
  if (problem?.includes("missing")) return "missing";
  if (problem) return "placeholder";
  return (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live_") ? "live" : "test";
}

export function publishableKeyState(): KeyState {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
  if (!key) return "missing";
  if (isObviousPlaceholder(key) || !key.startsWith("pk_")) return "placeholder";
  if (key.startsWith("pk_live_")) return "live";
  if (key.startsWith("pk_test_") && key.length > "pk_test_".length) return "test";
  return "placeholder";
}

export function getStripe(): Stripe {
  const problem = stripeSecretProblem();
  if (problem) throw new Error(problem);
  const key = process.env.STRIPE_SECRET_KEY!.trim();
  if (!stripe || stripeKey !== key) {
    stripe = new Stripe(key, {
      typescript: true,
      appInfo: { name: "shopsite-starter" },
    });
    stripeKey = key;
  }
  return stripe;
}

export function stripeDashboardUrl(paymentIntentId: string | null, sessionId: string): string {
  const live = stripeMode() === "live";
  const base = live ? "https://dashboard.stripe.com" : "https://dashboard.stripe.com/test";
  if (paymentIntentId && /^pi_[A-Za-z0-9]+$/.test(paymentIntentId)) {
    return `${base}/payments/${paymentIntentId}`;
  }
  return `${base}/checkout/sessions/${encodeURIComponent(sessionId)}`;
}

/**
 * Coupons via allow_promotion_codes. Tax via Checkout automatic tax.
 * If the Stripe account has not activated Stripe Tax, retry once without it
 * so a fresh test account can still take payment. No extra env var: the
 * Packaging .env.example is the source of truth.
 */
export async function createCheckoutSession(lines: ReservationLine[]): Promise<string> {
  const reservation = JSON.stringify(lines);
  if (reservation.length > 500) {
    throw new Error("Cart is too large to reserve.");
  }
  const origin = appUrl();
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    shipping_address_collection: { allowed_countries: ["US", "CA"] },
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cancel`,
    metadata: { stockReservation: reservation },
    line_items: lines.map((line) => {
      const product = getProductBySku(line.skuId);
      if (!product) throw new Error("Unknown SKU");
      return {
        quantity: line.qty,
        price_data: {
          currency: siteConfig.currency,
          unit_amount: product.priceCents,
          product_data: {
            name: product.name,
            description: product.description,
            metadata: { skuId: product.skuId },
          },
        },
      };
    }),
  };
  const client = getStripe();
  try {
    const session = await client.checkout.sessions.create({
      ...params,
      automatic_tax: { enabled: true },
    });
    if (!session.url) throw new Error("Stripe did not return a Checkout URL");
    return session.url;
  } catch (error) {
    if (!isTaxConfigError(error)) throw error;
    console.error("Stripe Tax is not active; creating Checkout without automatic tax.");
    const session = await client.checkout.sessions.create(params);
    if (!session.url) throw new Error("Stripe did not return a Checkout URL");
    return session.url;
  }
}

function isTaxConfigError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error && typeof error.message === "string" ? error.message.toLowerCase() : "";
  const param = "param" in error && typeof error.param === "string" ? error.param : "";
  return param.startsWith("automatic_tax") || message.includes("stripe tax") || message.includes("automatic tax");
}

export type CheckoutSummary = {
  email: string | null;
  totalCents: number;
  currency: string;
};

/** Thin fields only. The full Session object never reaches the page. */
export async function readCheckoutSummary(sessionId: string): Promise<CheckoutSummary | null> {
  if (stripeSecretProblem()) return null;
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return null;
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    return {
      email: session.customer_details?.email ?? session.customer_email ?? null,
      totalCents: session.amount_total ?? 0,
      currency: session.currency ?? siteConfig.currency,
    };
  } catch {
    return null;
  }
}
