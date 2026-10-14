/** Brand and operations. Density, chrome, and color recipe live in `data/recipe.ts`. */
export const siteConfig = {
  name: "Demo Shop",
  tagline: "Linen tote, stoneware mug, and wool scarf.",
  description:
    "A demo storefront for the ShopSite starter. Replace the brand and catalogue. Leave the admin UI alone unless you mean to change operations.",
  supportEmail: "support@example.com",
  currency: "usd" as const,
  lowStockDefault: 2,
  /**
   * Stripe Checkout session lifetime in minutes.
   * Session create clamps this to 31–1440 minutes. Stripe's minimum is 30;
   * the extra minute keeps expires_at above that floor if the request is delayed.
   */
  checkoutExpiryMinutes: 60,
};
