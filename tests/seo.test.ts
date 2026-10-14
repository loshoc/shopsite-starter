import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { recipePalettes, storefrontRecipe } from "../data/recipe.ts";
import { siteConfig } from "../data/site.config.ts";
import { theme } from "../lib/theme.ts";
import { robotsDisallow, siteDescription, sitemapEntries } from "../lib/seo.ts";

test("default description is Shop {name}. {tagline}.", () => {
  assert.equal(siteDescription(), `Shop ${siteConfig.name}. Linen tote, stoneware mug, and wool scarf.`);
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
  const shipped = recipePalettes.default;
  const tokens: Record<string, string> = {
    bg: shipped.bg,
    surface: shipped.surface,
    fg: shipped.fg,
    muted: shipped.muted,
    border: shipped.border,
    accent: shipped.accent,
    "accent-fg": shipped.accentFg,
    highlight: shipped.highlight,
    success: shipped.success,
    danger: shipped.danger,
    ring: shipped.ring,
  };
  for (const [name, hex] of Object.entries(tokens)) {
    assert.match(root, new RegExp(`--${name}: ${hex};`));
  }
  assert.deepEqual(theme, recipePalettes[storefrontRecipe.id]);
  for (const legacy of ["paper", "foam", "ink", "sand", "copper", "moss"]) {
    assert.equal(css.includes(`--${legacy}`), false, legacy);
  }
  assert.match(css, /--font-sans: var\(--font-body\)/);
  assert.match(css, /--font-serif: var\(--font-body\)/);
  assert.equal(css.includes("--font-outfit"), false);
  assert.equal(css.includes("--font-fraunces"), false);
  assert.equal(css.includes("#9c4324"), false);
  assert.equal(css.includes("#f3eee6"), false);
  assert.match(css, /--color-bg: var\(--bg\);/);
  assert.match(css, /--color-highlight: var\(--highlight\);/);
  assert.equal(css.includes(".admin {\n  --background: #fafafa;"), true);
});

test("storefront font is Inter only", () => {
  const fonts = fs.readFileSync(new URL("../app/fonts.ts", import.meta.url), "utf8");
  const layout = fs.readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const og = fs.readFileSync(new URL("../lib/og.tsx", import.meta.url), "utf8");
  const license = fs.readFileSync(new URL("../assets/fonts/OFL.txt", import.meta.url), "utf8");
  assert.match(fonts, /import \{ Inter \} from "next\/font\/google"/);
  assert.match(fonts, /variable: "--font-body"/);
  for (const dropped of ["Instrument", "Inter_Tight", "Fraunces", "Outfit"]) {
    assert.equal(fonts.includes(dropped), false, dropped);
    assert.equal(layout.includes(dropped), false, dropped);
    assert.equal(og.includes(dropped), false, dropped);
  }
  assert.match(layout, /fontInter\.variable/);
  assert.match(og, /Inter-Medium\.woff/);
  assert.match(og, /fontFamily: "Inter"/);
  assert.match(license, /Inter Project Authors/);
  assert.equal(license.includes("Fraunces"), false);
  assert.equal(license.includes("Instrument Serif"), false);
});
