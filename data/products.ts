/**
 * Catalogue identity only. `stockUnits` is the seed quantity for an empty
 * stock table. It is not live availability. Checkout reads Postgres (or the
 * local-development in-memory fallback) and fails closed when that quantity is short.
 *
 * `npm run import:products` rewrites `products.generated.json`. Values in that
 * file are JSON data, never interpolated into this module.
 */
import generated from "./products.generated.json" with { type: "json" };

export type ProductVariant = {
  skuId: string;
  priceCents: number;
  stockUnits: number;
  options: { name: string; value: string }[];
};

export type Product = {
  id: string;
  handle: string;
  skuId: string;
  name: string;
  description: string;
  details: string;
  priceCents: number;
  stockUnits: number;
  images: string[];
  variants: ProductVariant[];
  featured?: boolean;
  hidden?: boolean;
};

type GeneratedCatalog = {
  products: Product[];
};

function normalize(product: Product): Product {
  const variants =
    product.variants && product.variants.length > 0
      ? product.variants
      : [
          {
            skuId: product.skuId,
            priceCents: product.priceCents,
            stockUnits: product.stockUnits,
            options: [],
          },
        ];
  return {
    ...product,
    handle: product.handle || product.id,
    images: product.images ?? [],
    variants,
  };
}

export const products: Product[] = (generated as GeneratedCatalog).products.map(normalize);

export function variantLabel(name: string, options: { name: string; value: string }[]): string {
  if (options.length === 0) return name;
  return `${name} (${options.map((option) => `${option.name}: ${option.value}`).join(", ")})`;
}

export function listSellableSkus(): {
  skuId: string;
  stockUnits: number;
  priceCents: number;
  name: string;
  featured: boolean;
}[] {
  return products.flatMap((product) =>
    product.variants.map((variant) => ({
      skuId: variant.skuId,
      stockUnits: variant.stockUnits,
      priceCents: variant.priceCents,
      name: variantLabel(product.name, variant.options),
      featured: Boolean(product.featured),
    })),
  );
}

export function getProduct(id: string): Product | undefined {
  return products.find((product) => product.id === id || product.handle === id);
}

export function getProductBySku(skuId: string): Product | undefined {
  for (const product of products) {
    const variant = product.variants.find((entry) => entry.skuId === skuId);
    if (!variant) continue;
    if (product.variants.length === 1 && variant.skuId === product.skuId) return product;
    return {
      ...product,
      skuId: variant.skuId,
      priceCents: variant.priceCents,
      stockUnits: variant.stockUnits,
      name: variantLabel(product.name, variant.options),
    };
  }
  return undefined;
}
