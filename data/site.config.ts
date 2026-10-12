export const siteConfig = {
  name: "Atelier North",
  tagline: "Small goods for unhurried rooms.",
  description:
    "A demo storefront for the ShopSite starter. Replace the brand and catalogue. Leave the admin UI alone unless you mean to change operations.",
  supportEmail: "support@example.com",
  currency: "usd" as const,
  lowStockDefault: 2,
  /**
   * Stripe Checkout session lifetime in minutes.
   * Session create clamps this to Stripe's 30 minute–24 hour window.
   */
  checkoutExpiryMinutes: 60,
};
