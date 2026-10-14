import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { siteConfig } from "../data/site.config.ts";
import {
  displayPriceCents,
  findVariant,
  initialSelection,
  optionAxes,
  publishedFaqs,
  selectOption,
  shouldMoveFocusToBag,
  trustNotes,
  variantHint,
} from "../lib/storefront-ui.ts";

function read(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const napkin = [
  {
    skuId: "oat-small",
    orderable: false,
    options: [
      { name: "Color", value: "Oat" },
      { name: "Size", value: "Small" },
    ],
  },
  {
    skuId: "sage-small",
    orderable: true,
    options: [
      { name: "Color", value: "Sage" },
      { name: "Size", value: "Small" },
    ],
  },
  {
    skuId: "oat-large",
    orderable: true,
    options: [
      { name: "Color", value: "Oat" },
      { name: "Size", value: "Large" },
    ],
  },
];

test("option axes keep catalogue order and unique values", () => {
  assert.deepEqual(optionAxes(napkin), [
    { name: "Color", values: ["Oat", "Sage"] },
    { name: "Size", values: ["Small", "Large"] },
  ]);
  assert.deepEqual(optionAxes([{ options: [] }]), []);
});

test("initial selection prefers an orderable variant", () => {
  const selected = findVariant(napkin, initialSelection(napkin));
  assert.equal(selected?.skuId, "sage-small");
});

test("selecting an option snaps to a real variant", () => {
  const next = selectOption(napkin, { Color: "Oat", Size: "Large" }, "Color", "Sage");
  assert.equal(findVariant(napkin, next)?.skuId, "sage-small");
  assert.equal(next.Size, "Small");
});

test("variant hint and price range stay factual", () => {
  assert.equal(variantHint([{ options: [] }]), null);
  assert.equal(
    variantHint([
      { options: [{ name: "Color", value: "Oat" }] },
      { options: [{ name: "Color", value: "Sage" }] },
    ]),
    "Color: Oat, Sage",
  );
  assert.deepEqual(
    displayPriceCents(
      [{ priceCents: 2200 }, { priceCents: 2400 }],
      2200,
    ),
    { cents: 2200, from: true },
  );
  assert.deepEqual(displayPriceCents([{ priceCents: 4800 }], 4800), { cents: 4800, from: false });
});

test("trust lines and faqs hide unset copy", () => {
  assert.deepEqual(trustNotes("", "  "), []);
  assert.deepEqual(trustNotes(" Posted note ", ""), [{ label: "Shipping", text: "Posted note" }]);
  assert.deepEqual(
    publishedFaqs([
      { question: " ", answer: "Skipped" },
      { question: "Hours", answer: "  " },
      { question: " Where ", answer: " The shop page. " },
    ]),
    [{ question: "Where", answer: "The shop page." }],
  );
  assert.equal(siteConfig.shippingNote.trim(), "");
  assert.equal(siteConfig.returnsNote.trim(), "");
  assert.deepEqual(publishedFaqs(siteConfig.faqs), []);
});

test("escape returns focus to the bag control only when focus is elsewhere", () => {
  assert.equal(shouldMoveFocusToBag(null), true);
  assert.equal(shouldMoveFocusToBag("bag-close"), true);
  assert.equal(shouldMoveFocusToBag("bag-control"), false);
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
