import { requireAdminPage } from "@/lib/admin-guard";
import { siteConfig } from "@/data/site.config";
import { appUrl } from "@/lib/app-url";
import { resolveCheckoutExpiryMinutes } from "@/lib/checkout-expiry";
import { stockMode } from "@/lib/db";
import { paypalStatusLabel } from "@/lib/paypal";
import { publishableKeyState, stripeMode, webhookSecretProblem } from "@/lib/stripe";

export default async function SettingsPage() {
  await requireAdminPage();
  let origin = "Set NEXT_PUBLIC_APP_URL";
  try {
    origin = appUrl();
  } catch {
    origin = "Set NEXT_PUBLIC_APP_URL";
  }
  const mode = stockMode();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Read-only mirrors. Secrets are not shown.</p>
      </div>
      <section className="space-y-1 text-sm">
        <h2 className="font-medium">Storefront</h2>
        <p>Name: {siteConfig.name}</p>
        <p>Tagline: {siteConfig.tagline}</p>
        <p>Support: {siteConfig.supportEmail}</p>
        <p>Currency: {siteConfig.currency}</p>
        <p>Low-stock default: {siteConfig.lowStockDefault}</p>
        <p>Checkout expiry: {resolveCheckoutExpiryMinutes(siteConfig.checkoutExpiryMinutes)} minutes</p>
      </section>
      <section className="space-y-1 text-sm">
        <h2 className="font-medium">Environment</h2>
        <p>App URL: {origin}</p>
        <p>
          Database:{" "}
          {mode === "postgres"
            ? "Postgres"
            : mode === "memory"
              ? "In-memory fallback (local development only)"
              : "Unavailable — set a real DATABASE_URL"}
        </p>
        <p>Stripe secret: {stripeMode()}</p>
        <p>Publishable key: {publishableKeyState()}</p>
        <p>Webhook secret: {webhookSecretProblem() ? "not configured" : "configured"}</p>
        <p>Webhook URL: {origin}/api/webhooks/stripe</p>
        <p>PayPal: {paypalStatusLabel()}</p>
        <p>PayPal webhook URL: {origin}/api/webhooks/paypal</p>
      </section>
      <section className="space-y-2 text-sm text-muted-foreground">
        <p>Coupons and tax are handled by Stripe Checkout, not by an admin discounts screen.</p>
        <p>Marketing email, newsletters, and Resend are not part of this core kit.</p>
        <p>Admin auth is the shared secret in this version. Clerk or Auth.js is an upgrade path, not included.</p>
      </section>
    </div>
  );
}
