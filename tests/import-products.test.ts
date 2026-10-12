import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { readStockFile } from "../lib/import/stock-file.ts";
import { importProductCsv, parsePriceToCents, serializeCatalog } from "../lib/import/pipeline.ts";
import { renderPattern } from "../lib/import/remote-patterns.ts";
import { applySeedQuantities, seedStockRows } from "../lib/import/seed-stock.ts";

const root = path.resolve(import.meta.dirname, "..");
const fixtures = path.join(root, "tests", "fixtures");
const publicDir = path.join(root, "public");
const title = 'Oak "bowl" `special` ${process.env.SECRET} */';

function read(name: string): string {
  return fs.readFileSync(path.join(fixtures, name), "utf8");
}

function imported(name: string) {
  return importProductCsv(read(name), { publicDir });
}

test("decimal prices become integer cents without float math", () => {
  assert.equal(parsePriceToCents("18"), 1800);
  assert.equal(parsePriceToCents("18.5"), 1850);
  assert.equal(parsePriceToCents("18.50"), 1850);
  assert.equal(parsePriceToCents("00.10"), 10);
  assert.equal(parsePriceToCents("19.99"), 1999);
  assert.equal(parsePriceToCents("0.01"), 1);
  assert.equal(parsePriceToCents("-5.00"), null);
  assert.equal(parsePriceToCents("NaN"), null);
  assert.equal(parsePriceToCents("12.999"), null);
  assert.equal(parsePriceToCents("1e2"), null);
  assert.equal(parsePriceToCents(""), null);
  assert.equal(parsePriceToCents("$18.00"), null);
});

test("shopify sample uses local images, variants, and an image-only row", () => {
  const result = imported("shopify-sample.csv");
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

test("products template imports the same local catalogue shape", () => {
  const text = fs.readFileSync(path.join(root, "products-template.csv"), "utf8");
  const result = importProductCsv(text, { publicDir });
  assert.deepEqual(result.errors, []);
  assert.equal(result.format, "template");
  assert.equal(result.patterns.length, 0);
  assert.equal(result.products.length, 3);
  assert.deepEqual(result.products[1]?.images, ["/products/linen-napkin.png", "/products/linen-napkin-fold.png"]);
  assert.equal(result.products[1]?.variants.length, 2);
  assert.equal(result.products[2]?.priceCents, 3600);
});

test("hostile shopify and template fixtures fail identically and keep the title inert", () => {
  const shopify = imported("hostile-shopify.csv");
  const template = imported("hostile-template.csv");
  const errors = [
    'Row 3: Invalid price "-5.00".',
    'Row 4: Invalid image "http://cdn.example.com/bad.jpg".',
    'Row 5: Invalid price "NaN".',
    'Row 6: Invalid price "12.999".',
    'Row 7: Invalid price "1e2".',
  ];
  assert.deepEqual(shopify.errors, errors);
  assert.deepEqual(template.errors, errors);
  assert.equal(shopify.products.length, 1);
  assert.equal(template.products.length, 1);
  assert.equal(shopify.products[0]?.name, title);
  assert.equal(template.products[0]?.name, title);
  assert.equal(shopify.products[0]?.description, template.products[0]?.description);
  const description = shopify.products[0]?.description ?? "";
  assert.match(description, /Hand thrown/);
  assert.match(description, /https:\/\/cdn\.example\.com\/care/);
  assert.doesNotMatch(description, /<script/i);
  assert.doesNotMatch(description, /alert\(1\)/);
  assert.doesNotMatch(description, /onerror/i);
  assert.doesNotMatch(description, /onclick/i);
  assert.doesNotMatch(description, /javascript:/i);
  assert.doesNotMatch(description, /<style/i);
  const serialized = serializeCatalog(shopify.products);
  assert.equal(JSON.parse(serialized).products[0].name, title);
  assert.doesNotMatch(serialized, /<script/i);
  assert.match(serialized, /\$\{process\.env\.SECRET\}/);
  assert.equal(shopify.patterns.length, 1);
  assert.equal(shopify.patterns[0]?.hostname, "cdn.example.com");
  assert.equal(shopify.patterns[0]?.pathname, "/bowl.jpg");
  assert.equal(shopify.patterns[0]?.search, "");
  assert.doesNotMatch(renderPattern(shopify.patterns[0]!), /\*/);
});

test("empty files, missing columns, duplicate handles, and conflicts name the row", () => {
  assert.deepEqual(imported("empty.csv").errors, ["Row 1: Empty CSV file."]);
  assert.deepEqual(importProductCsv("\uFEFF\n\n", { publicDir }).errors, ["Row 1: Empty CSV file."]);
  assert.deepEqual(imported("shopify-missing-price.csv").errors, ['Row 1: Missing required column "Variant Price".']);
  assert.deepEqual(imported("template-missing-sku.csv").errors, ['Row 1: Missing required column "sku".']);
  assert.deepEqual(imported("shopify-duplicate-handle.csv").errors, ['Row 4: Duplicate handle "alpha-spoon".']);
  assert.deepEqual(imported("template-duplicate-handle.csv").errors, ['Row 4: Duplicate handle "alpha-spoon".']);
  assert.deepEqual(imported("shopify-conflict.csv").errors, ['Row 3: Conflicting definition for handle "alpha-spoon".']);
  assert.deepEqual(imported("template-conflict.csv").errors, ['Row 3: Conflicting definition for handle "alpha-spoon".']);
  const woo = imported("woocommerce.csv");
  assert.match(woo.errors[0] ?? "", /Row 1: Unrecognized CSV format\. WooCommerce exports are not supported yet/);
  const unknown = importProductCsv("foo,bar\n1,2\n", { publicDir });
  assert.match(unknown.errors[0] ?? "", /Row 1: Unrecognized CSV format\. Expected a Shopify product export/);
});

test("BOM, CRLF, spaced headers, blank columns, and blank rows keep file line numbers", () => {
  const templateBom = fs.readFileSync(path.join(fixtures, "template-bom-crlf.csv"));
  assert.equal(templateBom[0], 0xef);
  assert.ok(templateBom.includes(Buffer.from("\r\n")));
  const template = importProductCsv(templateBom.toString("utf8"), { publicDir });
  assert.deepEqual(template.errors, []);
  assert.equal(template.products.length, 2);
  assert.equal(template.products[0]?.priceCents, 1800);

  const shopifyBom = fs.readFileSync(path.join(fixtures, "shopify-bom-crlf.csv"));
  assert.equal(shopifyBom[0], 0xef);
  assert.ok(shopifyBom.includes(Buffer.from("\r\n")));
  const shopify = importProductCsv(shopifyBom.toString("utf8"), { publicDir });
  assert.deepEqual(shopify.errors, []);
  assert.match(shopify.products[0]?.description ?? "", /Oil it monthly/);
  assert.equal(shopify.patterns.length, 0);

  const blankTemplate = imported("template-blank-columns.csv");
  const blankShopify = imported("shopify-blank-columns.csv");
  assert.deepEqual(blankTemplate.errors, ['Row 4: Invalid price "-3.50".']);
  assert.deepEqual(blankShopify.errors, ['Row 4: Invalid price "-3.50".']);
  assert.equal(blankTemplate.products[0]?.handle, "cedar-spoon");
  assert.equal(blankShopify.products[0]?.handle, "cedar-spoon");
  assert.equal(blankTemplate.products[0]?.priceCents, 1800);
});

test("seed stock does not double and force sets quantity", async () => {
  const first = applySeedQuantities(new Map(), [{ skuId: "SPOON-CEDAR-01", qty: 6 }], false);
  assert.equal(first.counts.inserted, 1);
  assert.equal(first.next.get("SPOON-CEDAR-01"), 6);
  const second = applySeedQuantities(first.next, [{ skuId: "SPOON-CEDAR-01", qty: 9 }], false);
  assert.equal(second.counts.skipped, 1);
  assert.equal(second.counts.inserted, 0);
  assert.equal(second.next.get("SPOON-CEDAR-01"), 6);
  const forced = applySeedQuantities(second.next, [{ skuId: "SPOON-CEDAR-01", qty: 4 }], true);
  assert.equal(forced.counts.updated, 1);
  assert.equal(forced.next.get("SPOON-CEDAR-01"), 4);

  const file = path.join(os.tmpdir(), `shopsite-stock-${process.pid}.json`);
  fs.rmSync(file, { force: true });
  const seeded = await seedStockRows(
    [
      { skuId: "SPOON-CEDAR-01", qty: 6 },
      { skuId: "BOWL-STONE-01", qty: 4 },
    ],
    { force: false, databaseUrl: null, filePath: file },
  );
  assert.equal(seeded.mode, "memory");
  assert.equal(seeded.counts.inserted, 2);
  const again = await seedStockRows(
    [
      { skuId: "SPOON-CEDAR-01", qty: 11 },
      { skuId: "BOWL-STONE-01", qty: 4 },
    ],
    { force: false, databaseUrl: null, filePath: file },
  );
  assert.equal(again.counts.skipped, 2);
  assert.equal(readStockFile(file)["SPOON-CEDAR-01"], 6);
  const overwritten = await seedStockRows([{ skuId: "SPOON-CEDAR-01", qty: 1 }], {
    force: true,
    databaseUrl: null,
    filePath: file,
  });
  assert.equal(overwritten.counts.updated, 1);
  assert.equal(readStockFile(file)["SPOON-CEDAR-01"], 1);
  assert.equal(readStockFile(file)["BOWL-STONE-01"], 4);
  fs.rmSync(file, { force: true });
});

test("the cli rejects empty input and --force without --seed-stock", () => {
  const empty = spawnSync(
    "node",
    ["--experimental-strip-types", "scripts/import-products.ts", "tests/fixtures/empty.csv"],
    { cwd: root, encoding: "utf8" },
  );
  assert.notEqual(empty.status, 0);
  assert.match(empty.stderr, /Row 1: Empty CSV file\./);

  const alias = spawnSync("npm", ["run", "import:shopify", "--", "tests/fixtures/empty.csv"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.notEqual(alias.status, 0);
  assert.match(alias.stderr, /Row 1: Empty CSV file\./);

  const force = spawnSync("npm", ["run", "import:products", "--", "products-template.csv", "--force"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.notEqual(force.status, 0);
  assert.match(force.stderr, /--force requires --seed-stock\./);
});

test("remote pattern entries quote every value", () => {
  const rendered = renderPattern({
    protocol: "https",
    hostname: 'cdn.example.com", injected: true',
    port: "",
    pathname: "/bowl.jpg",
    search: "",
  });
  assert.match(rendered, /hostname: "cdn\.example\.com\\", injected: true"/);
  assert.doesNotMatch(rendered, /\*/);
});
