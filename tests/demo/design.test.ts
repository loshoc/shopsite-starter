import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { recipePalettes, storefrontRecipe } from "../../data/recipe.ts";
import { theme } from "../../lib/theme.ts";

function read(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("theme hex values mirror the cool sparse tokens", () => {
  const css = read("app/globals.css");
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
  const fonts = read("app/fonts.ts");
  const layout = read("app/layout.tsx");
  const og = read("lib/og.tsx");
  const license = read("assets/fonts/OFL.txt");
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

test("product page uses variant buttons, one buy action, and an accordion", () => {
  const page = read("app/(shop)/products/[id]/page.tsx");
  const purchase = read("components/shop/product-purchase.tsx");
  const disclosure = read("components/shop/disclosure.tsx");
  for (const source of [page, purchase, disclosure]) {
    assert.equal(source.includes("<select"), false, source.slice(0, 40));
    assert.equal(source.includes('role="tab'), false);
  }
  assert.equal(page.includes("AddToCart"), false);
  assert.equal((purchase.match(/<AddToCart/g) ?? []).length, 1);
  assert.match(purchase, /aria-pressed/);
  assert.match(purchase, /max-md:fixed/);
  assert.match(page, /DisclosureList/);
  assert.match(disclosure, /<details/);
  assert.equal(/free shipping|easy returns|\d+\s*-?\s*days/i.test(purchase), false);
});

test("cards are flush image, name, and price", () => {
  const card = read("components/shop/product-card.tsx");
  assert.equal(card.includes("AddToCart"), false);
  assert.equal(card.includes("rating"), false);
  assert.equal(card.includes("Badge"), false);
  assert.equal(card.includes("border"), false);
  assert.equal(card.includes("shadow"), false);
  assert.match(card, /variantHint/);
  const home = read("app/(shop)/page.tsx");
  assert.equal(home.includes("tagline"), false);
  assert.match(home, /ProductGrid/);
});

test("detail polish keeps one motion and focus system", () => {
  const css = read("app/globals.css");
  const root = css.slice(css.indexOf(":root {"), css.indexOf("\n.admin {"));
  for (const token of [
    "--ease-out: cubic-bezier(0.22, 1, 0.36, 1);",
    "--ease-in-out: cubic-bezier(0.76, 0, 0.24, 1);",
    "--ease-soft: cubic-bezier(0.33, 1, 0.68, 1);",
    "--t-press: 140ms;",
    "--t-hover: 180ms;",
    "--t-ui: 240ms;",
    "--t-drawer: 320ms;",
  ]) {
    assert.match(root, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.equal(css.includes("--t-reveal"), false);
  for (const hook of [
    ".shop-stack-tight > * + *",
    ".shop-focus:focus-visible",
    ".shop-btn-primary:active:not(:disabled)",
    ".shop-link",
    ".shop-chip[aria-pressed=\"true\"]",
    ".shop-bag-panel[data-state=\"closed\"]",
    ".shop-media-img",
  ]) {
    assert.match(css, new RegExp(hook.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /scale\(0\.97\)/);
  assert.match(css, /scale\(1\.03\)/);
  const add = read("components/shop/add-to-cart.tsx");
  const purchase = read("components/shop/product-purchase.tsx");
  const drawer = read("components/shop/cart-drawer.tsx");
  const card = read("components/shop/product-card.tsx");
  assert.match(add, /shop-btn-primary shop-focus/);
  assert.equal(add.includes("hover:opacity-80"), false);
  assert.match(purchase, /shop-chip shop-focus/);
  assert.match(purchase, /data-unavailable/);
  assert.match(drawer, /data-state=\{phase\}/);
  assert.match(drawer, /shop-btn-primary shop-focus/);
  assert.match(card, /shop-stack-tight/);
  assert.match(card, /shop-link/);
  assert.equal(css.includes(".admin {\n  --background: #fafafa;"), true);
  assert.match(css, /\.shop-link:focus-visible/);
  assert.match(css, /\.shop-link-rest/);
  assert.match(css, /\.shop-chip:active/);
  assert.match(css, /\.shop-disclosure:hover \.shop-disclosure-icon/);
  assert.match(css, /\.shop-buy-pad/);
  assert.match(css, /\.shop-bag-line:last-child/);
  assert.match(read("components/shop/disclosure.tsx"), /shop-disclosure/);
  assert.match(read("components/shop/product-purchase.tsx"), /shop-buy-pad/);
  assert.match(read("components/shop/product-description.tsx"), /shop-copy/);
  for (const path of ["app/(shop)/success/page.tsx", "app/(shop)/cancel/page.tsx", "app/not-found.tsx"]) {
    const source = read(path);
    assert.match(source, /shop-link shop-link-rest shop-focus shop-follow/);
    assert.equal(source.includes("underline"), false, path);
  }
});

test("faq is an accordion shell and the placeholder is plain grey", () => {
  const faq = read("app/(shop)/faq/page.tsx");
  assert.match(faq, /TODO: Replace me/);
  assert.match(faq, /DisclosureList/);
  assert.equal(/\d+\s*-?\s*days/i.test(faq), false);
  const placeholder = read("components/shop/product-image-placeholder.tsx");
  assert.match(placeholder, /Replace me/);
  assert.match(placeholder, /#e6e6e4/);
  assert.equal(placeholder.includes("border-dashed"), false);
  assert.equal(placeholder.includes("ImagePlus"), false);
  const drawer = read("components/shop/cart-drawer.tsx");
  const header = read("components/shop/header.tsx");
  assert.match(drawer, /Escape/);
  assert.match(drawer, /shouldMoveFocusToBag/);
  assert.match(drawer, /Start shopping/);
  assert.match(header, /id="bag-control"/);
});
