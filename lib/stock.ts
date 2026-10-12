import "server-only";

import { getProductBySku, products } from "@/data/products";
import { listStockRecords, receiveIncoming, saveStockRows, seedStock, stockMode } from "@/lib/db";
import { rejectsForStock, stockBadge, type LiveQty } from "@/lib/inventory-policy";
import type { StockDraft, StockStatus } from "@/lib/types";

export type AvailabilityFailure = {
  skuId: string;
  requested: number;
  liveQty: number;
  reason: "sold_out" | "hidden" | "unknown";
};

export type AdminStockRow = {
  skuId: string;
  name: string;
  priceCents: number;
  catalogueQty: number;
  featured: boolean;
  qty: number;
  sold: number;
  incoming: number;
  status: LiveQty["status"];
  lowStockThreshold: number;
  persisted: boolean;
  badge: ReturnType<typeof stockBadge>;
};

/**
 * P0-1. Missing DB row => live qty 0 for non-exempt SKUs.
 * Exemption is only the live status "unlimited", never catalogue stockUnits.
 * Callers must not create a Stripe session when this returns a failure.
 */
export async function checkAvailability(
  lines: { skuId: string; qty: number }[],
): Promise<AvailabilityFailure | null> {
  const records = await listStockRecords();
  const bySku = new Map(records.map((row) => [row.skuId, row]));
  for (const line of lines) {
    const product = getProductBySku(line.skuId);
    if (!product) {
      return { skuId: line.skuId, requested: line.qty, liveQty: 0, reason: "unknown" };
    }
    const row = bySku.get(line.skuId);
    const live: LiveQty = row
      ? { qty: row.qty, status: row.status }
      : { qty: 0, status: "missing" };
    if (product.hidden || live.status === "hidden") {
      return { skuId: line.skuId, requested: line.qty, liveQty: live.qty, reason: "hidden" };
    }
    if (rejectsForStock(line.qty, live)) {
      return { skuId: line.skuId, requested: line.qty, liveQty: live.qty, reason: "sold_out" };
    }
  }
  return null;
}

export async function listAdminStock(): Promise<{ mode: "memory" | "postgres"; rows: AdminStockRow[] }> {
  const records = await listStockRecords();
  const bySku = new Map(records.map((row) => [row.skuId, row]));
  const rows = products.map((product) => {
    const row = bySku.get(product.skuId);
    const status: LiveQty["status"] = row ? row.status : "missing";
    const qty = row?.qty ?? 0;
    const lowStockThreshold = row?.lowStockThreshold ?? 2;
    return {
      skuId: product.skuId,
      name: product.name,
      priceCents: product.priceCents,
      catalogueQty: product.stockUnits,
      featured: Boolean(product.featured),
      qty,
      sold: row?.sold ?? 0,
      incoming: row?.incoming ?? 0,
      status,
      lowStockThreshold,
      persisted: Boolean(row),
      badge: stockBadge({ status, qty, lowStockThreshold }),
    };
  });
  return { mode: stockMode(), rows };
}

const STATUSES = new Set<StockStatus>(["active", "hidden", "unlimited"]);

export function parseStockDrafts(value: unknown): StockDraft[] | null {
  if (!value || typeof value !== "object") return null;
  const rows = (value as { rows?: unknown }).rows;
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 100) return null;
  const drafts: StockDraft[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") return null;
    const skuId = (row as { skuId?: unknown }).skuId;
    const qty = (row as { qty?: unknown }).qty;
    const incoming = (row as { incoming?: unknown }).incoming;
    const status = (row as { status?: unknown }).status;
    const lowStockThreshold = (row as { lowStockThreshold?: unknown }).lowStockThreshold;
    if (typeof skuId !== "string" || !getProductBySku(skuId)) return null;
    if (!isCount(qty) || !isCount(incoming) || !isCount(lowStockThreshold)) return null;
    if (typeof status !== "string" || !STATUSES.has(status as StockStatus)) return null;
    drafts.push({
      skuId,
      qty,
      incoming,
      status: status as StockStatus,
      lowStockThreshold,
    });
  }
  return drafts;
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 1_000_000;
}

export async function saveAdminStock(drafts: StockDraft[]): Promise<void> {
  await saveStockRows(drafts);
}

export async function seedAdminStock(): Promise<number> {
  return seedStock();
}

export async function receiveAdminStock(skuId: string): Promise<boolean> {
  if (!getProductBySku(skuId)) return false;
  return receiveIncoming(skuId);
}
