import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { siteConfig } from "../data/site.config.ts";
import { formatMoney } from "../lib/format.ts";

function read(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("formatMoney follows siteConfig.currency and keeps en-US", () => {
  const config = siteConfig as { currency: string };
  const original = config.currency;
  assert.equal(formatMoney(1800), formatMoney(1800, original));
  const other = original.toLowerCase() === "eur" ? "gbp" : "eur";
  config.currency = other;
  try {
    assert.equal(formatMoney(1800), formatMoney(1800, other));
    assert.notEqual(formatMoney(1800), formatMoney(1800, original));
  } finally {
    config.currency = original;
  }
  assert.equal(formatMoney(1800), formatMoney(1800, original));
  assert.match(read("lib/format.ts"), /en-US/);
  assert.equal(read("lib/format.ts").includes('"usd"'), false);
});

test("PDP, bag, cards, and Stripe follow siteConfig.currency", () => {
  const files = [
    "lib/format.ts",
    "lib/stripe.ts",
    "lib/stripe-events.ts",
    "components/shop/product-card.tsx",
    "components/shop/product-purchase.tsx",
    "components/shop/cart-drawer.tsx",
  ];
  for (const file of files) {
    const source = read(file);
    assert.match(source, /siteConfig\.currency/, file);
    assert.equal(source.includes('"usd"') || source.includes("'usd'"), false, file);
  }
  assert.match(read("lib/stripe.ts"), /currency: siteConfig\.currency/);
  assert.match(read("lib/stripe-events.ts"), /session\.currency \?\? siteConfig\.currency/);
});
