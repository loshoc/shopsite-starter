import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { siteConfig } from "../data/site.config.ts";
import {
  CHECKOUT_EXPIRY_DEFAULT_MINUTES,
  checkoutExpiresAt,
  checkoutExpiresAtFromConfig,
  resolveCheckoutExpiryMinutes,
} from "../lib/checkout-expiry.ts";

const NOW = 1_700_000_000;

test("checkout expiry defaults to 60 minutes", () => {
  assert.equal(siteConfig.checkoutExpiryMinutes, 60);
  assert.equal(CHECKOUT_EXPIRY_DEFAULT_MINUTES, 60);
  assert.equal(resolveCheckoutExpiryMinutes(siteConfig.checkoutExpiryMinutes), 60);
  assert.equal(checkoutExpiresAtFromConfig(siteConfig, NOW), NOW + 60 * 60);
});

test("changing checkoutExpiryMinutes changes expires_at", () => {
  assert.equal(checkoutExpiresAtFromConfig({ checkoutExpiryMinutes: 90 }, NOW), NOW + 90 * 60);
  assert.notEqual(
    checkoutExpiresAtFromConfig({ checkoutExpiryMinutes: 90 }, NOW),
    checkoutExpiresAtFromConfig(siteConfig, NOW),
  );
});

test("checkout expiry clamps 29 and 0 to 30 minutes and 1441 to 1440", () => {
  const warnings: unknown[][] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(args);
  };
  try {
    assert.doesNotThrow(() => {
      assert.equal(resolveCheckoutExpiryMinutes(29), 30);
      assert.equal(resolveCheckoutExpiryMinutes(0), 30);
      assert.equal(checkoutExpiresAt(NOW, 29), NOW + 30 * 60);
      assert.equal(checkoutExpiresAt(NOW, 0), NOW + 30 * 60);
      assert.equal(resolveCheckoutExpiryMinutes(1441), 1440);
      assert.equal(checkoutExpiresAt(NOW, 1441), NOW + 1440 * 60);
    });
    assert.equal(warnings.length, 0);
  } finally {
    console.warn = original;
  }
});

test("non-numeric checkoutExpiryMinutes falls back to 60 and warns", () => {
  const warnings: unknown[][] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(args);
  };
  try {
    const bad: unknown[] = [Number.NaN, "90", undefined];
    for (const value of bad) {
      const before = warnings.length;
      let expires = 0;
      assert.doesNotThrow(() => {
        expires = checkoutExpiresAt(NOW, value);
      });
      assert.equal(expires, NOW + 60 * 60);
      assert.equal(warnings.length, before + 1);
      assert.match(String(warnings[before]?.[0]), /checkoutExpiryMinutes/);
    }
  } finally {
    console.warn = original;
  }
});

test("Checkout session create sends expires_at from site config", () => {
  const source = readFileSync(new URL("../lib/stripe.ts", import.meta.url), "utf8");
  assert.match(source, /expires_at:\s*checkoutExpiresAtFromConfig\(siteConfig,/);
  const events = readFileSync(new URL("../lib/stripe-events.ts", import.meta.url), "utf8");
  assert.doesNotMatch(events, /type === "checkout\.session\.expired"/);
});
