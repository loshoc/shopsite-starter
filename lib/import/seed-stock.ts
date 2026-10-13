import postgres from "postgres";

import { siteConfig } from "../../data/site.config.ts";
import { readStockFile, writeStockFile } from "./stock-file.ts";

export type SeedItem = { skuId: string; qty: number };

export type SeedCounts = { inserted: number; updated: number; skipped: number };

/**
 * Insert missing SKUs. A second pass does not add quantity.
 * `--force` sets qty to the CSV value.
 */
export function applySeedQuantities(
  existing: Map<string, number>,
  items: SeedItem[],
  force: boolean,
): { counts: SeedCounts; next: Map<string, number> } {
  const next = new Map(existing);
  const counts: SeedCounts = { inserted: 0, updated: 0, skipped: 0 };
  for (const item of items) {
    if (!next.has(item.skuId)) {
      next.set(item.skuId, item.qty);
      counts.inserted += 1;
      continue;
    }
    if (force) {
      next.set(item.skuId, item.qty);
      counts.updated += 1;
      continue;
    }
    counts.skipped += 1;
  }
  return { counts, next };
}

export async function seedStockRows(
  items: SeedItem[],
  options: { force: boolean; databaseUrl: string | null; filePath: string },
): Promise<{ mode: "memory" | "postgres"; counts: SeedCounts }> {
  if (options.databaseUrl) {
    return { mode: "postgres", counts: await seedPostgres(options.databaseUrl, items, options.force) };
  }
  const existing = new Map(Object.entries(readStockFile(options.filePath)));
  const applied = applySeedQuantities(existing, items, options.force);
  const quantities: Record<string, number> = {};
  for (const [skuId, qty] of applied.next) quantities[skuId] = qty;
  writeStockFile(quantities, options.filePath);
  return { mode: "memory", counts: applied.counts };
}

async function seedPostgres(url: string, items: SeedItem[], force: boolean): Promise<SeedCounts> {
  const sql = postgres(url, { max: 1, connect_timeout: 8, prepare: !url.includes("pgbouncer=true") });
  const counts: SeedCounts = { inserted: 0, updated: 0, skipped: 0 };
  try {
    await sql`
      create table if not exists product_stock (
        sku_id text primary key,
        qty integer not null default 0 check (qty >= 0),
        sold integer not null default 0 check (sold >= 0),
        incoming integer not null default 0 check (incoming >= 0),
        status text not null default 'active' check (status in ('active', 'hidden', 'unlimited')),
        low_stock_threshold integer not null default 2 check (low_stock_threshold >= 0),
        updated_at timestamptz not null default now()
      )
    `;
    // Match lib/db.ts: orders may already exist without oversold. Stock seed must
    // not leave that schema behind, and a fresh database gets the column too.
    await sql`
      create table if not exists orders (
        stripe_session_id text primary key,
        email text,
        total_cents integer not null,
        currency text not null,
        status text not null check (status in ('paid', 'partially_refunded', 'refunded')),
        payment_intent_id text,
        reservation jsonb not null,
        amount_refunded_cents integer not null default 0,
        restocked boolean not null default false,
        oversold boolean not null default false,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `;
    await sql`
      alter table orders add column if not exists oversold boolean not null default false
    `;
    await sql.begin(async (tx) => {
      for (const item of items) {
        if (force) {
          const updated = await tx<{ sku_id: string }[]>`
            update product_stock
            set qty = ${item.qty}, updated_at = now()
            where sku_id = ${item.skuId}
            returning sku_id
          `;
          if (updated.length > 0) {
            counts.updated += 1;
            continue;
          }
          await tx`
            insert into product_stock (sku_id, qty, sold, incoming, status, low_stock_threshold)
            values (${item.skuId}, ${item.qty}, 0, 0, 'active', ${siteConfig.lowStockDefault})
          `;
          counts.inserted += 1;
          continue;
        }
        const inserted = await tx<{ sku_id: string }[]>`
          insert into product_stock (sku_id, qty, sold, incoming, status, low_stock_threshold)
          values (${item.skuId}, ${item.qty}, 0, 0, 'active', ${siteConfig.lowStockDefault})
          on conflict (sku_id) do nothing
          returning sku_id
        `;
        if (inserted.length > 0) counts.inserted += 1;
        else counts.skipped += 1;
      }
    });
    return counts;
  } catch (error) {
    const message = error instanceof Error ? error.message : "inventory store is unavailable";
    throw new Error(`Stock seed failed: ${message}`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}
