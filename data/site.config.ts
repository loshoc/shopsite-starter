/** Brand and operations. Density, chrome, and color recipe live in `data/recipe.ts`. */
export const siteConfig = {
  name: "Demo Shop",
  tagline: "Cedar spoon, linen napkin, and stone bowl.",
  description:
    "A demo storefront for the ShopSite starter. Replace the brand and catalogue. Leave the admin UI alone unless you mean to change operations.",
  supportEmail: "support@example.com",
  currency: "usd" as const,
  lowStockDefault: 2,
  /**
   * One line under Add to bag. Leave empty. The product page hides it until set.
   * Write it only after /shipping is a real policy.
   */
  shippingNote: "",
  /**
   * One line under Add to bag. Leave empty. The product page hides it until set.
   * Write it only after /returns is a real policy.
   */
  returnsNote: "",
  /** Question and answer pairs for /faq. Leave empty until you write them. */
  faqs: [] as { question: string; answer: string }[],
  /**
   * Stripe Checkout session lifetime in minutes.
   * Session create clamps this to 31–1440 minutes. Stripe's minimum is 30;
   * the extra minute keeps expires_at above that floor if the request is delayed.
   */
  checkoutExpiryMinutes: 60,
};
