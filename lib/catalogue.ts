import "server-only";

import { connection } from "next/server";

import { products, type Product } from "@/data/products";
import { listStockRecords, stockMode } from "@/lib/db";
import { isOrderable, type LiveQty } from "@/lib/inventory-policy";

export type StoreProduct = Product & {
  orderable: boolean;
  liveQty: number | null;
  liveStatus: LiveQty["status"];
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
        .map((product) => decorate(product, bySku.get(product.skuId))),
    };
  } catch {
    return {
      mode: stockMode(),
      unavailable: true,
      products: products
        .filter((product) => !product.hidden)
        .map((product) => decorate(product, undefined, true)),
    };
  }
}

function decorate(
  product: Product,
  row: { qty: number; status: LiveQty["status"] } | undefined,
  unavailable = false,
): StoreProduct {
  const live: LiveQty = unavailable
    ? { qty: 0, status: "missing" }
    : row
      ? { qty: row.qty, status: row.status }
      : { qty: 0, status: "missing" };
  return {
    ...product,
    orderable: isOrderable(live, product.hidden),
    liveQty: live.status === "unlimited" ? null : live.qty,
    liveStatus: live.status,
  };
}

export async function getStoreProduct(id: string): Promise<StoreProduct | null> {
  const catalogue = await listStoreProducts();
  return catalogue.products.find((product) => product.id === id) ?? null;
}
