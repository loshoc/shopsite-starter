import "server-only";

import postgres from "postgres";

import { listSellableSkus } from "@/data/products";
import { readDevStockQuantities } from "@/lib/dev-stock";
import { siteConfig } from "@/data/site.config";
import { configuredDatabaseUrl, productionDatabaseProblem } from "@/lib/database-url";
import { applyOnHand, classifyRefund, lineIsOversold, linesInLockOrder, shouldAutoRestock } from "@/lib/inventory-policy";
import {
  InventoryUnavailable,
  StockNotSeeded,
  type OrderRecord,
  type OrderStatus,
  type PaidCheckout,
  type RefundInput,
  type ReservationLine,
  type StockDraft,
  type StockRecord,
  type StockStatus,
} from "@/lib/types";

type Sql = postgres.Sql;

type Memory = {
  stock: Map<string, StockRecord>;
  events: Set<string>;
  orders: Map<string, OrderRecord>;
  ordersByPaymentIntent: Map<string, string>;
  sessions: Map<string, number>;
  lastEvent: { eventType: string; processedAt: string } | null;
};

const globalStore = globalThis as unknown as { __shopsiteMemory?: Memory };

let client: Sql | null = null;
let clientUrl: string | null = null;
let schemaReady: Promise<void> | null = null;
let memoryQueue: Promise<void> = Promise.resolve();
let paidLockObserver: ((skuIds: readonly string[]) => void) | null = null;

/** Records the skuId order used for paid-checkout row locks. Unset in production. */
export function observePaidLockOrder(observer: ((skuIds: readonly string[]) => void) | null): void {
  paidLockObserver = observer;
}

function linesToLock(lines: ReservationLine[]): ReservationLine[] {
  const ordered = linesInLockOrder(lines);
  paidLockObserver?.(ordered.map((line) => line.skuId));
  return ordered;
}

/** Serializes in-memory paid checkouts so two webhooks cannot both take the last unit. */
function enqueueMemory<T>(task: () => T): Promise<T> {
  const run = memoryQueue.then(task);
  memoryQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function asStatus(value: string): StockStatus {
  if (value === "hidden" || value === "unlimited" || value === "active") return value;
  return "active";
}

function asOrderStatus(value: string): OrderStatus {
  if (value === "partially_refunded" || value === "refunded" || value === "paid") return value;
  return "paid";
}

function asReservation(value: unknown): ReservationLine[] {
  if (!Array.isArray(value)) return [];
  const lines: ReservationLine[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const skuId = (item as { skuId?: unknown }).skuId;
    const qty = (item as { qty?: unknown }).qty;
    if (typeof skuId === "string" && typeof qty === "number" && Number.isInteger(qty) && qty > 0) {
      lines.push({ skuId, qty });
    }
  }
  return lines;
}

/**
 * Per-SKU units actually removed from on-hand. Unlike asReservation this keeps
 * qty 0 (an oversold line removed nothing). Returns undefined for a legacy row
 * with no stored value, so restock falls back to the reservation quantity.
 */
function asTaken(value: unknown): ReservationLine[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const lines: ReservationLine[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const skuId = (item as { skuId?: unknown }).skuId;
    const qty = (item as { qty?: unknown }).qty;
    if (typeof skuId === "string" && typeof qty === "number" && Number.isInteger(qty) && qty >= 0) {
      lines.push({ skuId, qty });
    }
  }
  return lines;
}

/**
 * Local development only. No DATABASE_URL (or the example placeholder) seeds
 * a process-local catalogue so a first run can demo checkout. That seed is
 * not a sold-out bypass: after startup, a missing SKU is qty 0, and
 * requested > qty still rejects. Production never reaches this store.
 * If a real DATABASE_URL is set and Postgres fails, callers get
 * InventoryUnavailable instead of this memory store.
 */
function memory(): Memory {
  const problem = productionDatabaseProblem();
  if (problem) throw new InventoryUnavailable(problem);
  if (!globalStore.__shopsiteMemory) {
    const now = new Date().toISOString();
    const stock = new Map<string, StockRecord>();
    for (const item of listSellableSkus()) {
      stock.set(item.skuId, {
        skuId: item.skuId,
        qty: item.stockUnits,
        sold: 0,
        incoming: 0,
        status: "active",
        lowStockThreshold: siteConfig.lowStockDefault,
        updatedAt: now,
      });
    }
    for (const [skuId, qty] of Object.entries(readDevStockQuantities())) {
      const row = stock.get(skuId);
      if (row) row.qty = qty;
    }
    globalStore.__shopsiteMemory = {
      stock,
      events: new Set(),
      orders: new Map(),
      ordersByPaymentIntent: new Map(),
      sessions: new Map(),
      lastEvent: null,
    };
  }
  return globalStore.__shopsiteMemory;
}

function rememberEvent(mem: Memory, eventType: string) {
  mem.lastEvent = { eventType, processedAt: new Date().toISOString() };
}

/**
 * Reverse a paid order's lines. `sold` drops by the requested qty (reversing
 * the paid increment), but on-hand rises only by `taken` — the units actually
 * removed — so refunding an oversold line never credits phantom stock.
 */
function restockMemory(mem: Memory, lines: ReservationLine[], taken: TakenLookup, now: string) {
  for (const line of lines) {
    const addBack = taken(line.skuId, line.qty);
    const row = mem.stock.get(line.skuId);
    if (!row) {
      mem.stock.set(line.skuId, {
        skuId: line.skuId,
        qty: addBack,
        sold: 0,
        incoming: 0,
        status: "active",
        lowStockThreshold: siteConfig.lowStockDefault,
        updatedAt: now,
      });
      continue;
    }
    row.qty += addBack;
    row.sold = Math.max(0, row.sold - line.qty);
    row.updatedAt = now;
  }
}

/** Units to add back for a SKU: stored `taken`, or the requested qty for legacy orders. */
type TakenLookup = (skuId: string, requested: number) => number;

function takenLookup(order: OrderRecord): TakenLookup {
  if (!order.stockTaken) return (_skuId, requested) => requested;
  const map = new Map(order.stockTaken.map((line) => [line.skuId, line.qty]));
  return (skuId, requested) => map.get(skuId) ?? requested;
}

async function ensureSchema(sql: Sql) {
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
  await sql`
    create table if not exists processed_stock_events (
      event_id text primary key,
      event_type text not null,
      processed_at timestamptz not null default now()
    )
  `;
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
  // Existing databases created before `oversold` keep their rows. Add the column in place.
  await sql`
    alter table orders add column if not exists oversold boolean not null default false
  `;
  // Rows written before stock_taken keep a null; restock falls back to reservation.
  await sql`
    alter table orders add column if not exists stock_taken jsonb
  `;
  await sql`
    create index if not exists orders_payment_intent_idx on orders (payment_intent_id)
  `;
  await sql`
    create table if not exists admin_sessions (
      sid text primary key,
      expires_at timestamptz not null,
      created_at timestamptz not null default now()
    )
  `;
}

async function postgresClient(): Promise<Sql | null> {
  const url = configuredDatabaseUrl();
  if (!url) return null;
  if (!client || clientUrl !== url) {
    const pooled = url.includes("pgbouncer=true") || url.includes("-pooler.");
    client = postgres(url, {
      max: 3,
      connect_timeout: 8,
      idle_timeout: 20,
      prepare: !pooled,
    });
    clientUrl = url;
    schemaReady = null;
  }
  if (!schemaReady) {
    const sql = client;
    schemaReady = ensureSchema(sql).catch((error: unknown) => {
      schemaReady = null;
      throw error;
    });
  }
  try {
    await schemaReady;
  } catch {
    throw new InventoryUnavailable();
  }
  return client;
}

async function withDatabase<T>(fn: (sql: Sql) => Promise<T>): Promise<T> {
  try {
    const sql = await postgresClient();
    if (!sql) throw new Error("memory");
    return await fn(sql);
  } catch (error) {
    if (error instanceof InventoryUnavailable || error instanceof StockNotSeeded) throw error;
    if (error instanceof Error && error.message === "memory") throw error;
    throw new InventoryUnavailable();
  }
}

type StockRow = {
  sku_id: string;
  qty: number;
  sold: number;
  incoming: number;
  status: string;
  low_stock_threshold: number;
  updated_at: Date | string;
};

function mapStock(row: StockRow): StockRecord {
  return {
    skuId: row.sku_id,
    qty: row.qty,
    sold: row.sold,
    incoming: row.incoming,
    status: asStatus(row.status),
    lowStockThreshold: row.low_stock_threshold,
    updatedAt: iso(row.updated_at),
  };
}

type OrderRow = {
  stripe_session_id: string;
  email: string | null;
  total_cents: number;
  currency: string;
  status: string;
  payment_intent_id: string | null;
  reservation: unknown;
  stock_taken: unknown;
  amount_refunded_cents: number;
  restocked: boolean;
  oversold: boolean;
  created_at: Date | string;
  updated_at: Date | string;
};

function mapOrder(row: OrderRow): OrderRecord {
  return {
    stripeSessionId: row.stripe_session_id,
    email: row.email,
    totalCents: row.total_cents,
    currency: row.currency,
    status: asOrderStatus(row.status),
    paymentIntentId: row.payment_intent_id,
    reservation: asReservation(row.reservation),
    stockTaken: asTaken(row.stock_taken),
    amountRefundedCents: row.amount_refunded_cents,
    restocked: row.restocked,
    oversold: row.oversold === true,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export type StockMode = "memory" | "postgres" | "unavailable";

export function stockMode(): StockMode {
  if (productionDatabaseProblem()) return "unavailable";
  return configuredDatabaseUrl() ? "postgres" : "memory";
}

export async function listStockRecords(): Promise<StockRecord[]> {
  if (!configuredDatabaseUrl()) return [...memory().stock.values()];
  return withDatabase(async (sql) => {
    const rows = await sql<StockRow[]>`
      select sku_id, qty, sold, incoming, status, low_stock_threshold, updated_at
      from product_stock
      order by sku_id
    `;
    return rows.map(mapStock);
  });
}

export async function seedStock(): Promise<number> {
  if (!configuredDatabaseUrl()) {
    const mem = memory();
    let inserted = 0;
    const now = new Date().toISOString();
    for (const item of listSellableSkus()) {
      if (mem.stock.has(item.skuId)) continue;
      mem.stock.set(item.skuId, {
        skuId: item.skuId,
        qty: item.stockUnits,
        sold: 0,
        incoming: 0,
        status: "active",
        lowStockThreshold: siteConfig.lowStockDefault,
        updatedAt: now,
      });
      inserted += 1;
    }
    return inserted;
  }
  return withDatabase(async (sql) => {
    let inserted = 0;
    await sql.begin(async (tx) => {
      for (const item of listSellableSkus()) {
        const rows = await tx<{ sku_id: string }[]>`
          insert into product_stock (sku_id, qty, sold, incoming, status, low_stock_threshold)
          values (
            ${item.skuId},
            ${item.stockUnits},
            0,
            0,
            'active',
            ${siteConfig.lowStockDefault}
          )
          on conflict (sku_id) do nothing
          returning sku_id
        `;
        inserted += rows.length;
      }
    });
    return inserted;
  });
}

export async function saveStockRows(drafts: StockDraft[]): Promise<void> {
  if (!configuredDatabaseUrl()) {
    const mem = memory();
    for (const draft of drafts) {
      if (!mem.stock.has(draft.skuId)) throw new StockNotSeeded(draft.skuId);
    }
    const now = new Date().toISOString();
    for (const draft of drafts) {
      const row = mem.stock.get(draft.skuId);
      if (!row) throw new StockNotSeeded(draft.skuId);
      row.qty = draft.qty;
      row.incoming = draft.incoming;
      row.status = draft.status;
      row.lowStockThreshold = draft.lowStockThreshold;
      row.updatedAt = now;
    }
    return;
  }
  await withDatabase(async (sql) => {
    await sql.begin(async (tx) => {
      for (const draft of drafts) {
        const rows = await tx<{ sku_id: string }[]>`
          update product_stock
          set qty = ${draft.qty},
              incoming = ${draft.incoming},
              status = ${draft.status},
              low_stock_threshold = ${draft.lowStockThreshold},
              updated_at = now()
          where sku_id = ${draft.skuId}
          returning sku_id
        `;
        if (rows.length === 0) throw new StockNotSeeded(draft.skuId);
      }
    });
  });
}

export async function receiveIncoming(skuId: string): Promise<boolean> {
  if (!configuredDatabaseUrl()) {
    const row = memory().stock.get(skuId);
    if (!row) throw new StockNotSeeded(skuId);
    if (row.incoming <= 0) return false;
    row.qty += row.incoming;
    row.incoming = 0;
    row.updatedAt = new Date().toISOString();
    return true;
  }
  return withDatabase(async (sql) => {
    const existing = await sql<{ sku_id: string }[]>`
      select sku_id from product_stock where sku_id = ${skuId}
    `;
    if (existing.length === 0) throw new StockNotSeeded(skuId);
    const rows = await sql<{ sku_id: string }[]>`
      update product_stock
      set qty = qty + incoming,
          incoming = 0,
          updated_at = now()
      where sku_id = ${skuId} and incoming > 0
      returning sku_id
    `;
    return rows.length > 0;
  });
}

/**
 * Decrement one line inside the paid-checkout transaction.
 * Locks the stock row so a concurrent webhook sees the updated quantity.
 * Returns whether this line asked for more than was on hand.
 */
async function decrementSql(tx: postgres.TransactionSql, line: ReservationLine): Promise<{ oversold: boolean; taken: number }> {
  let row = (
    await tx<{ qty: number; status: string }[]>`
      select qty, status from product_stock where sku_id = ${line.skuId} for update
    `
  )[0];

  if (!row) {
    const inserted = await tx<{ sku_id: string }[]>`
      insert into product_stock (sku_id, qty, sold, incoming, status, low_stock_threshold)
      values (${line.skuId}, 0, 0, 0, 'active', ${siteConfig.lowStockDefault})
      on conflict (sku_id) do nothing
      returning sku_id
    `;
    if (inserted.length === 0) {
      row = (
        await tx<{ qty: number; status: string }[]>`
          select qty, status from product_stock where sku_id = ${line.skuId} for update
        `
      )[0];
      if (!row) throw new InventoryUnavailable("Stock row disappeared during checkout.");
    }
  }

  const available = row?.qty ?? 0;
  const status = row?.status ?? "active";
  const applied = applyOnHand(available, line.qty);
  await tx`
    update product_stock
    set qty = ${applied.qty},
        sold = sold + ${line.qty},
        updated_at = now()
    where sku_id = ${line.skuId}
  `;
  return { oversold: lineIsOversold(status, available, line.qty), taken: available - applied.qty };
}

async function restockSql(tx: postgres.TransactionSql, line: ReservationLine, addBack: number) {
  await tx`
    insert into product_stock (sku_id, qty, sold, incoming, status, low_stock_threshold)
    values (${line.skuId}, ${addBack}, 0, 0, 'active', ${siteConfig.lowStockDefault})
    on conflict (sku_id) do update
    set qty = product_stock.qty + ${addBack},
        sold = greatest(product_stock.sold - ${line.qty}, 0),
        updated_at = now()
  `;
}

export async function markEventProcessed(eventId: string, eventType: string): Promise<void> {
  if (!configuredDatabaseUrl()) {
    const mem = memory();
    mem.events.add(eventId);
    rememberEvent(mem, eventType);
    return;
  }
  await withDatabase(async (sql) => {
    await sql`
      insert into processed_stock_events (event_id, event_type)
      values (${eventId}, ${eventType})
      on conflict (event_id) do nothing
    `;
  });
}

function applyLineMemory(mem: Memory, line: ReservationLine, now: string): { oversold: boolean; taken: number } {
  const row = mem.stock.get(line.skuId);
  const available = row?.qty ?? 0;
  const status = row?.status ?? "active";
  const applied = applyOnHand(available, line.qty);
  if (!row) {
    mem.stock.set(line.skuId, {
      skuId: line.skuId,
      qty: applied.qty,
      sold: line.qty,
      incoming: 0,
      status: "active",
      lowStockThreshold: siteConfig.lowStockDefault,
      updatedAt: now,
    });
  } else {
    row.qty = applied.qty;
    row.sold += line.qty;
    row.updatedAt = now;
  }
  return { oversold: lineIsOversold(status, available, line.qty), taken: available - applied.qty };
}

function applyPaidCheckoutMemory(input: PaidCheckout): "duplicate" | "applied" {
  const mem = memory();
  if (mem.events.has(input.eventId) || mem.orders.has(input.stripeSessionId)) {
    mem.events.add(input.eventId);
    rememberEvent(mem, input.eventType);
    return "duplicate";
  }
  const now = new Date().toISOString();
  let oversold = false;
  const stockTaken: ReservationLine[] = [];
  for (const line of linesToLock(input.reservation)) {
    const result = applyLineMemory(mem, line, now);
    if (result.oversold) oversold = true;
    stockTaken.push({ skuId: line.skuId, qty: result.taken });
  }
  const order: OrderRecord = {
    stripeSessionId: input.stripeSessionId,
    email: input.email,
    totalCents: input.totalCents,
    currency: input.currency,
    status: "paid",
    paymentIntentId: input.paymentIntentId,
    reservation: input.reservation,
    stockTaken,
    amountRefundedCents: 0,
    restocked: false,
    oversold,
    createdAt: now,
    updatedAt: now,
  };
  mem.orders.set(order.stripeSessionId, order);
  if (order.paymentIntentId) mem.ordersByPaymentIntent.set(order.paymentIntentId, order.stripeSessionId);
  mem.events.add(input.eventId);
  rememberEvent(mem, input.eventType);
  return "applied";
}

export async function applyPaidCheckout(input: PaidCheckout): Promise<"duplicate" | "applied"> {
  if (!configuredDatabaseUrl()) {
    return enqueueMemory(() => applyPaidCheckoutMemory(input));
  }

  return withDatabase(async (sql) => {
    let outcome: "duplicate" | "applied" = "applied";
    await sql.begin(async (tx) => {
      const inserted = await tx<{ event_id: string }[]>`
        insert into processed_stock_events (event_id, event_type)
        values (${input.eventId}, ${input.eventType})
        on conflict (event_id) do nothing
        returning event_id
      `;
      if (inserted.length === 0) {
        outcome = "duplicate";
        return;
      }
      const existing = await tx<{ stripe_session_id: string }[]>`
        select stripe_session_id from orders where stripe_session_id = ${input.stripeSessionId}
      `;
      if (existing.length > 0) {
        outcome = "duplicate";
        return;
      }
      let oversold = false;
      const stockTaken: ReservationLine[] = [];
      for (const line of linesToLock(input.reservation)) {
        const result = await decrementSql(tx, line);
        if (result.oversold) oversold = true;
        stockTaken.push({ skuId: line.skuId, qty: result.taken });
      }
      await tx`
        insert into orders (
          stripe_session_id, email, total_cents, currency, status,
          payment_intent_id, reservation, stock_taken, amount_refunded_cents, restocked, oversold
        ) values (
          ${input.stripeSessionId},
          ${input.email},
          ${input.totalCents},
          ${input.currency},
          'paid',
          ${input.paymentIntentId},
          ${tx.json(input.reservation)},
          ${tx.json(stockTaken)},
          0,
          false,
          ${oversold}
        )
      `;
    });
    return outcome;
  });
}

/**
 * P0-2: partial refunds update the thin order row and do not change qty.
 * Full refunds restock the reserved units once.
 */
export async function applyRefund(input: RefundInput): Promise<void> {
  const kind = classifyRefund(input.amount, input.amountRefunded, input.fullyRefunded);
  if (!configuredDatabaseUrl()) {
    const mem = memory();
    if (mem.events.has(input.eventId)) return;
    if (kind === "none" || !input.paymentIntentId) {
      mem.events.add(input.eventId);
      rememberEvent(mem, input.eventType);
      return;
    }
    const sessionId = mem.ordersByPaymentIntent.get(input.paymentIntentId);
    const order = sessionId ? mem.orders.get(sessionId) : undefined;
    if (!order) {
      mem.events.add(input.eventId);
      rememberEvent(mem, input.eventType);
      return;
    }
    const now = new Date().toISOString();
    order.amountRefundedCents = input.amountRefunded;
    order.updatedAt = now;
    if (kind === "partial" || !shouldAutoRestock(kind)) {
      order.status = "partially_refunded";
    } else {
      order.status = "refunded";
      if (!order.restocked) {
        restockMemory(mem, order.reservation, takenLookup(order), now);
        order.restocked = true;
      }
    }
    mem.events.add(input.eventId);
    rememberEvent(mem, input.eventType);
    return;
  }

  await withDatabase(async (sql) => {
    await sql.begin(async (tx) => {
      const inserted = await tx<{ event_id: string }[]>`
        insert into processed_stock_events (event_id, event_type)
        values (${input.eventId}, ${input.eventType})
        on conflict (event_id) do nothing
        returning event_id
      `;
      if (inserted.length === 0) return;
      if (kind === "none" || !input.paymentIntentId) return;
      const rows = await tx<OrderRow[]>`
        select stripe_session_id, email, total_cents, currency, status, payment_intent_id,
               reservation, stock_taken, amount_refunded_cents, restocked, oversold, created_at, updated_at
        from orders
        where payment_intent_id = ${input.paymentIntentId}
        for update
      `;
      const order = rows[0] ? mapOrder(rows[0]) : undefined;
      if (!order) return;
      if (kind === "partial" || !shouldAutoRestock(kind)) {
        await tx`
          update orders
          set status = 'partially_refunded',
              amount_refunded_cents = ${input.amountRefunded},
              updated_at = now()
          where stripe_session_id = ${order.stripeSessionId}
        `;
        return;
      }
      if (!order.restocked) {
        const takeback = takenLookup(order);
        for (const line of order.reservation) {
          await restockSql(tx, line, takeback(line.skuId, line.qty));
        }
      }
      await tx`
        update orders
        set status = 'refunded',
            amount_refunded_cents = ${input.amountRefunded},
            restocked = true,
            updated_at = now()
        where stripe_session_id = ${order.stripeSessionId}
      `;
    });
  });
}

export async function explicitRestock(stripeSessionId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!configuredDatabaseUrl()) {
    const order = memory().orders.get(stripeSessionId);
    if (!order) return { ok: false, error: "Order not found." };
    if (order.status === "paid") return { ok: false, error: "Only refunded orders can be restocked." };
    if (order.restocked) return { ok: false, error: "This order was already restocked." };
    if (order.reservation.length === 0) return { ok: false, error: "No reserved units on this order." };
    const now = new Date().toISOString();
    restockMemory(memory(), order.reservation, takenLookup(order), now);
    order.restocked = true;
    order.updatedAt = now;
    return { ok: true };
  }

  return withDatabase(async (sql) => {
    let result: { ok: true } | { ok: false; error: string } = { ok: false, error: "Order not found." };
    await sql.begin(async (tx) => {
      const rows = await tx<OrderRow[]>`
        select stripe_session_id, email, total_cents, currency, status, payment_intent_id,
               reservation, stock_taken, amount_refunded_cents, restocked, oversold, created_at, updated_at
        from orders
        where stripe_session_id = ${stripeSessionId}
        for update
      `;
      const order = rows[0] ? mapOrder(rows[0]) : undefined;
      if (!order) return;
      if (order.status === "paid") {
        result = { ok: false, error: "Only refunded orders can be restocked." };
        return;
      }
      if (order.restocked) {
        result = { ok: false, error: "This order was already restocked." };
        return;
      }
      if (order.reservation.length === 0) {
        result = { ok: false, error: "No reserved units on this order." };
        return;
      }
      const takeback = takenLookup(order);
      for (const line of order.reservation) {
        await restockSql(tx, line, takeback(line.skuId, line.qty));
      }
      await tx`
        update orders
        set restocked = true, updated_at = now()
        where stripe_session_id = ${order.stripeSessionId}
      `;
      result = { ok: true };
    });
    return result;
  });
}

export async function listOrders(): Promise<OrderRecord[]> {
  if (!configuredDatabaseUrl()) {
    return [...memory().orders.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  return withDatabase(async (sql) => {
    const rows = await sql<OrderRow[]>`
      select stripe_session_id, email, total_cents, currency, status, payment_intent_id,
             reservation, stock_taken, amount_refunded_cents, restocked, oversold, created_at, updated_at
      from orders
      order by created_at desc
      limit 100
    `;
    return rows.map(mapOrder);
  });
}

export async function lastStockEvent(): Promise<{ eventType: string; processedAt: string } | null> {
  if (!configuredDatabaseUrl()) return memory().lastEvent;
  return withDatabase(async (sql) => {
    const rows = await sql<{ event_type: string; processed_at: Date | string }[]>`
      select event_type, processed_at
      from processed_stock_events
      order by processed_at desc
      limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    return { eventType: row.event_type, processedAt: iso(row.processed_at) };
  });
}

export async function replaceAdminSession(sid: string, expiresAtIso: string): Promise<void> {
  if (!configuredDatabaseUrl()) {
    const mem = memory();
    mem.sessions.clear();
    mem.sessions.set(sid, new Date(expiresAtIso).getTime());
    return;
  }
  await withDatabase(async (sql) => {
    await sql.begin(async (tx) => {
      await tx`delete from admin_sessions`;
      await tx`
        insert into admin_sessions (sid, expires_at)
        values (${sid}, ${expiresAtIso})
      `;
    });
  });
}

export async function adminSessionExists(sid: string): Promise<boolean> {
  if (!configuredDatabaseUrl()) {
    const expiresAt = memory().sessions.get(sid);
    if (!expiresAt) return false;
    if (expiresAt <= Date.now()) {
      memory().sessions.delete(sid);
      return false;
    }
    return true;
  }
  return withDatabase(async (sql) => {
    const rows = await sql<{ sid: string }[]>`
      select sid from admin_sessions
      where sid = ${sid} and expires_at > now()
    `;
    return rows.length > 0;
  });
}

export async function deleteAdminSession(sid: string): Promise<void> {
  if (!configuredDatabaseUrl()) {
    memory().sessions.delete(sid);
    return;
  }
  await withDatabase(async (sql) => {
    await sql`delete from admin_sessions where sid = ${sid}`;
  });
}
