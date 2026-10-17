import assert from "node:assert/strict";
import test from "node:test";

import { recipePalettes, storefrontRecipe } from "../data/recipe.ts";
import { theme } from "../lib/theme.ts";
import { robotsDisallow, siteDescription, sitemapEntries } from "../lib/seo.ts";

test("default description is Shop {name}. {tagline}.", () => {
  assert.equal(siteDescription({ name: "North", tagline: "Quiet goods" }), "Shop North. Quiet goods.");
  assert.equal(siteDescription({ name: "North", tagline: "Quiet goods..." }), "Shop North. Quiet goods.");
});

test("sitemap lists public pages and visible products only", () => {
  const entries = sitemapEntries("https://shop.example.com", [
    { id: "tote" },
    { id: "secret", hidden: true },
  ]);
  const urls = entries.map((entry) => entry.url);
  assert.deepEqual(urls, [
    "https://shop.example.com",
    "https://shop.example.com/shop",
    "https://shop.example.com/shipping",
    "https://shop.example.com/returns",
    "https://shop.example.com/faq",
    "https://shop.example.com/privacy",
    "https://shop.example.com/terms",
    "https://shop.example.com/products/tote",
  ]);
  const joined = urls.join(" ");
  for (const blocked of ["/admin", "/api", "/success", "/cancel"]) {
    assert.equal(joined.includes(blocked), false, blocked);
  }
  assert.deepEqual([...robotsDisallow], ["/admin", "/api", "/success", "/cancel"]);
});

test("theme follows the active storefront recipe", () => {
  assert.deepEqual(theme, recipePalettes[storefrontRecipe.id]);
});
