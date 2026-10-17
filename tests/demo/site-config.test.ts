import assert from "node:assert/strict";
import test from "node:test";

import { siteConfig } from "../../data/site.config.ts";
import { checkoutExpiresAtFromConfig } from "../../lib/checkout-expiry.ts";
import { formatMoney } from "../../lib/format.ts";
import { siteDescription } from "../../lib/seo.ts";
import { publishedFaqs } from "../../lib/storefront-ui.ts";

const NOW = 1_700_000_000;

test("demo brand copy is Demo Shop housewares", () => {
  assert.equal(siteConfig.name, "Demo Shop");
  assert.equal(siteConfig.tagline, "Cedar spoon, linen napkin, and stone bowl.");
  assert.equal(siteDescription(), "Shop Demo Shop. Cedar spoon, linen napkin, and stone bowl.");
});

test("demo currency is usd", () => {
  assert.equal(siteConfig.currency, "usd");
  assert.equal(formatMoney(1800), "$18.00");
});

test("demo checkout expiry is 60 minutes", () => {
  assert.equal(siteConfig.checkoutExpiryMinutes, 60);
  assert.equal(checkoutExpiresAtFromConfig(siteConfig, NOW), NOW + 60 * 60);
});

test("demo trust notes and faqs ship empty", () => {
  assert.equal(siteConfig.shippingNote.trim(), "");
  assert.equal(siteConfig.returnsNote.trim(), "");
  assert.deepEqual(publishedFaqs(siteConfig.faqs), []);
});
