import "server-only";

import { connection } from "next/server";

import { products, type Product, type ProductVariant } from "@/data/products";
import { listStockRecords, stockMode } from "@/lib/db";
import { isOrderable, type LiveQty } from "@/lib/inventory-policy";

export type StoreVariant = ProductVariant & {
  orderable: boolean;
  liveQty: number | null;
  liveStatus: LiveQty["status"];
};

export type StoreProduct = Product & {
  orderable: boolean;
  liveQty: number | null;
  liveStatus: LiveQty["status"];
  storeVariants: StoreVariant[];
};

export async function listStoreProducts(): Promise<{
  products: StoreProduct[];
  mode: "memory" | "postgres" | "unavailable";
  unavailable: boolean;
}> {
  await connection();
  try {
    const records = await listStockRecords();
    const bySku = new Map(records.map((row) => [row.skuId, row]));
    return {
      mode: stockMode(),
      unavailable: false,
      products: products
        .filter((product) => !product.hidden)
        .map((product) => decorate(product, bySku, false)),
    };
  } catch {
    return {
      mode: stockMode(),
      unavailable: true,
      products: products
        .filter((product) => !product.hidden)
        .map((product) => decorate(product, new Map(), true)),
    };
  }
}

function decorate(
  product: Product,
  bySku: Map<string, { qty: number; status: LiveQty["status"] }>,
  unavailable = false,
): StoreProduct {
  const live = liveQty(bySku.get(product.skuId), unavailable);
  const storeVariants = product.variants.map((variant) => {
    const variantLive = liveQty(bySku.get(variant.skuId), unavailable);
    return {
      ...variant,
      orderable: isOrderable(variantLive, product.hidden),
      liveQty: variantLive.status === "unlimited" ? null : variantLive.qty,
      liveStatus: variantLive.status,
    };
  });
  return {
    ...product,
    orderable: isOrderable(live, product.hidden),
    liveQty: live.status === "unlimited" ? null : live.qty,
    liveStatus: live.status,
    storeVariants,
  };
}

function liveQty(
  row: { qty: number; status: LiveQty["status"] } | undefined,
  unavailable: boolean,
): LiveQty {
  if (unavailable) return { qty: 0, status: "missing" };
  if (row) return { qty: row.qty, status: row.status };
  return { qty: 0, status: "missing" };
}

export async function getStoreProduct(id: string): Promise<StoreProduct | null> {
  const catalogue = await listStoreProducts();
  return catalogue.products.find((product) => product.id === id) ?? null;
}
