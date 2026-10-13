import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { siteConfig } from "../data/site.config.ts";
import { theme } from "../lib/theme.ts";
import { robotsDisallow, siteDescription, sitemapEntries } from "../lib/seo.ts";

test("default description is Shop {name}. {tagline}.", () => {
  assert.equal(siteDescription(), `Shop ${siteConfig.name}. Small goods for unhurried rooms.`);
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

test("theme hex values mirror the storefront tokens", () => {
  const css = fs.readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const root = css.slice(css.indexOf(":root {"), css.indexOf("\n.admin {"));
  const tokens: Record<string, string> = {
    bg: theme.bg,
    surface: theme.surface,
    fg: theme.fg,
    muted: theme.muted,
    border: theme.border,
    accent: theme.accent,
    "accent-fg": theme.accentFg,
    highlight: theme.highlight,
    success: theme.success,
    danger: theme.danger,
    ring: theme.ring,
  };
  for (const [name, hex] of Object.entries(tokens)) {
    assert.match(root, new RegExp(`--${name}: ${hex};`));
  }
  assert.match(root, /--paper: var\(--bg\);/);
  assert.match(root, /--foam: var\(--surface\);/);
  assert.match(root, /--ink: var\(--fg\);/);
  assert.match(root, /--sand: var\(--border\);/);
  assert.match(root, /--copper: var\(--highlight\);/);
  assert.match(root, /--moss: var\(--success\);/);
  assert.match(css, /--color-bg: var\(--bg\);/);
  assert.match(css, /--color-highlight: var\(--highlight\);/);
  assert.equal(css.includes(".admin {\n  --background: #fafafa;"), true);
});
