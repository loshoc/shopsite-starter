/**
 * Catalogue identity only. `stockUnits` is the seed quantity for an empty
 * stock table. It is not live availability. Checkout reads Postgres (or the
 * in-memory fallback) and fails closed when that quantity is short.
 */
export type Product = {
  id: string;
  skuId: string;
  name: string;
  description: string;
  details: string;
  priceCents: number;
  stockUnits: number;
  featured?: boolean;
  hidden?: boolean;
};

export const products: Product[] = [
  {
    id: "linen-market-tote",
    skuId: "SKU-TOTE-01",
    name: "Linen market tote",
    description: "Washed oat linen with a flat base and leather-wrapped handles.",
    details:
      "Holds a week of greens without slouching. Unlined, so it folds into a drawer. Spot clean. Demo SKU for the starter catalogue.",
    priceCents: 4800,
    stockUnits: 8,
    featured: true,
  },
  {
    id: "speckled-mug",
    skuId: "SKU-MUG-01",
    name: "Speckled stoneware mug",
    description: "A 10 oz cup with a sand foot and an iron-flecked glaze.",
    details:
      "Dishwasher safe. The speckles are under the glaze, not paint. Pair it with the tote or leave it by the kettle.",
    priceCents: 3200,
    stockUnits: 14,
  },
  {
    id: "wool-camp-scarf",
    skuId: "SKU-SCARF-01",
    name: "Wool camp scarf",
    description: "Undyed merino in a loose rib, long enough to wrap twice.",
    details:
      "Light enough for a cool morning and dense enough for a drafty train. Dry flat. The third demo SKU.",
    priceCents: 7800,
    stockUnits: 4,
  },
];

export function getProduct(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}

export function getProductBySku(skuId: string): Product | undefined {
  return products.find((product) => product.skuId === skuId);
}
