import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { importProductCsv } from "../../lib/import/pipeline.ts";

const root = path.resolve(import.meta.dirname, "../..");
const fixtures = path.join(root, "tests", "fixtures");
const publicDir = path.join(root, "public");

test("shopify sample uses local images, variants, and an image-only row", () => {
  const result = importProductCsv(fs.readFileSync(path.join(fixtures, "shopify-sample.csv"), "utf8"), {
    publicDir,
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.format, "shopify");
  assert.equal(result.patterns.length, 0);
  assert.deepEqual(
    result.products.map((product) => product.handle),
    ["cedar-spoon", "linen-napkin", "stone-bowl"],
  );
  const napkin = result.products[1];
  assert.ok(napkin);
  assert.deepEqual(
    napkin.variants.map((variant) => variant.skuId),
    ["NAPKIN-LINEN-OAT", "NAPKIN-LINEN-SAGE"],
  );
  assert.deepEqual(napkin.images, ["/products/linen-napkin.png", "/products/linen-napkin-fold.png"]);
  assert.equal(napkin.variants[0]?.priceCents, 2200);
  assert.equal(napkin.variants[1]?.priceCents, 2400);
  assert.deepEqual(napkin.variants[1]?.options, [{ name: "Color", value: "Sage" }]);
  assert.equal(result.products[0]?.variants[0]?.options.length, 0);
  assert.match(result.products[0]?.description ?? "", /fallen cedar/);
  assert.match(result.products[0]?.description ?? "", /Oil it monthly/);
  assert.equal(result.stock.find((row) => row.skuId === "SPOON-CEDAR-01")?.qty, 6);
});

test("products template imports the housewares catalogue", () => {
  const text = fs.readFileSync(path.join(root, "products-template.csv"), "utf8");
  const result = importProductCsv(text, { publicDir });
  assert.deepEqual(result.errors, []);
  assert.equal(result.format, "template");
  assert.equal(result.patterns.length, 0);
  assert.equal(result.products.length, 3);
  assert.deepEqual(
    result.products.map((product) => product.handle),
    ["cedar-spoon", "linen-napkin", "stone-bowl"],
  );
  assert.deepEqual(result.products[1]?.images, ["/products/linen-napkin.png", "/products/linen-napkin-fold.png"]);
  assert.equal(result.products[1]?.variants.length, 2);
  assert.equal(result.products[2]?.priceCents, 3600);
});
