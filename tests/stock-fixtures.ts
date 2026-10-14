import { listStockRecords } from "../lib/db.ts";
import type { StockDraft, StockRecord } from "../lib/types.ts";

type MemoryStore = {
  stock: Map<string, StockRecord>;
};

/**
 * Inserts stock rows into the in-memory store used when no database is configured.
 * `saveStockRows` still refuses a SKU that was never seeded from the live catalogue.
 * Inventory tests call this so they can name their own SKUs and stay green after
 * `data/products.generated.json` is replaced.
 */
export async function seedFixtureStock(drafts: StockDraft[]): Promise<void> {
  await listStockRecords();
  const mem = (globalThis as { __shopsiteMemory?: MemoryStore }).__shopsiteMemory;
  if (!mem) {
    throw new Error("Fixture stock requires the in-memory inventory store.");
  }
  const now = new Date().toISOString();
  for (const draft of drafts) {
    mem.stock.set(draft.skuId, {
      skuId: draft.skuId,
      qty: draft.qty,
      sold: 0,
      incoming: draft.incoming,
      status: draft.status,
      lowStockThreshold: draft.lowStockThreshold,
      updatedAt: now,
    });
  }
}
