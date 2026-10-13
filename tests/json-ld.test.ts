import assert from "node:assert/strict";
import test from "node:test";

import { centsToPrice, productJsonLd, serializeJsonLd, type JsonLdProduct } from "../lib/json-ld.ts";

const origin = "https://shop.example.com";

function product(overrides: Partial<JsonLdProduct> = {}): JsonLdProduct {
  return {
    name: "Linen market tote",
    description: "Washed oat linen.",
    skuId: "SKU-TOTE-01",
    priceCents: 4800,
    images: ["/products/linen.png"],
    orderable: true,
    storeVariants: [{ skuId: "SKU-TOTE-01", priceCents: 4800, orderable: true }],
    ...overrides,
  };
}

test("JSON-LD escapes script breakout characters", () => {
  const hostile = "</script><script>alert(1)</script>";
  const raw = serializeJsonLd({ name: hostile, note: "a & b < c > d" });
  assert.equal(raw.includes("</"), false);
  assert.equal(raw.includes("<"), false);
  assert.equal(raw.includes(">"), false);
  assert.equal(raw.includes("&"), false);
  assert.equal(JSON.parse(raw).name, hostile);

  const data = productJsonLd(
    product({ name: hostile, description: `hello ${hostile} there` }),
    `${origin}/products/tote`,
    "usd",
    origin,
  );
  const html = serializeJsonLd(data);
  assert.equal(html.includes("</script>"), false);
  assert.equal(JSON.parse(html).name, hostile);
});

test("hidden products are omitted and sold-out offers are not in stock", () => {
  assert.equal(productJsonLd(product({ hidden: true }), `${origin}/products/x`, "usd", origin), null);

  const soldOut = productJsonLd(
    product({
      orderable: false,
      storeVariants: [{ skuId: "SKU-TOTE-01", priceCents: 4800, orderable: false }],
    }),
    `${origin}/products/linen-market-tote`,
    "usd",
    origin,
  );
  assert.equal(JSON.stringify(soldOut).includes("InStock"), false);
  const offer = soldOut?.offers as { availability: string; price: string; sku: string };
  assert.equal(offer.availability, "https://schema.org/OutOfStock");
  assert.equal(offer.price, "48.00");
  assert.equal(offer.sku, "SKU-TOTE-01");
  assert.equal(productJsonLd(product({ images: [] }), `${origin}/products/linen-market-tote`, "usd", origin)?.image, undefined);
  assert.deepEqual(
    productJsonLd(product(), `${origin}/products/linen-market-tote`, "usd", origin)?.image,
    ["https://shop.example.com/products/linen.png"],
  );
});

test("in-stock products advertise schema.org InStock and integer cents", () => {
  const data = productJsonLd(product(), `${origin}/products/linen-market-tote`, "usd", origin);
  const offer = data?.offers as { availability: string; priceCurrency: string; price: string };
  assert.equal(offer.availability, "https://schema.org/InStock");
  assert.equal(offer.priceCurrency, "USD");
  assert.equal(offer.price, "48.00");
  assert.equal(centsToPrice(50), "0.50");
  assert.equal(data?.sku, "SKU-TOTE-01");
  assert.equal(data?.description, "Washed oat linen.");
});

test("variant offers keep their own availability", () => {
  const data = productJsonLd(
    product({
      storeVariants: [
        { skuId: "SKU-A", priceCents: 1000, orderable: true },
        { skuId: "SKU-B", priceCents: 2500, orderable: false },
      ],
    }),
    `${origin}/products/linen-market-tote`,
    "usd",
    origin,
  );
  const aggregate = data?.offers as {
    "@type": string;
    lowPrice: string;
    highPrice: string;
    offers: { sku: string; availability: string }[];
  };
  assert.equal(aggregate["@type"], "AggregateOffer");
  assert.equal(aggregate.lowPrice, "10.00");
  assert.equal(aggregate.highPrice, "25.00");
  assert.equal(aggregate.offers[0]?.availability, "https://schema.org/InStock");
  assert.equal(aggregate.offers[1]?.availability, "https://schema.org/OutOfStock");
});
