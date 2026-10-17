import assert from "node:assert/strict";
import test from "node:test";

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
});

test("escape returns focus to the bag control only when focus is elsewhere", () => {
  assert.equal(shouldMoveFocusToBag(null), true);
  assert.equal(shouldMoveFocusToBag("bag-close"), true);
  assert.equal(shouldMoveFocusToBag("bag-control"), false);
});

