import assert from "node:assert/strict";
import test from "node:test";

import { filterAdminOrders, oversoldBadge, presentAdminOrder } from "../lib/admin-orders.ts";
import { listOrders, listStockRecords, saveStockRows } from "../lib/db.ts";
import { dispatchStripeEvent } from "../lib/stripe-events.ts";
import { StockNotSeeded, type OrderRecord } from "../lib/types.ts";
import { seedFixtureStock } from "./stock-fixtures.ts";

const SKU = "FIXTURE-OVERSOLD-01";

test("admin oversold badge and filter follow the order flag", () => {
  const rows = [
    sample("cs_ok", false),
    sample("cs_short", true),
  ];
  const views = rows.map((order) => presentAdminOrder(order, "https://example.test/orders"));
  assert.deepEqual(
    filterAdminOrders(views, "all").map((order) => order.stripeSessionId),
    ["cs_ok", "cs_short"],
  );
  const oversold = filterAdminOrders(views, "oversold");
  assert.deepEqual(
    oversold.map((order) => order.stripeSessionId),
    ["cs_short"],
  );
  assert.equal(oversoldBadge(oversold[0].oversold), "Oversold");
  assert.equal(oversoldBadge(views[0].oversold), null);
});

test("fixture stock is independent of the catalogue, and saveStockRows still refuses an unseeded SKU", async () => {
  const skuId = `FIXTURE-STOCK-${crypto.randomUUID()}`;
  await seedFixtureStock([
    { skuId, qty: 4, incoming: 1, status: "active", lowStockThreshold: 2 },
  ]);
  const row = (await listStockRecords()).find((item) => item.skuId === skuId);
  assert.ok(row);
  assert.equal(row.qty, 4);
  assert.equal(row.sold, 0);
  assert.equal(row.incoming, 1);

  const missing = `FIXTURE-UNSEEDED-${crypto.randomUUID()}`;
  await assert.rejects(
    () =>
      saveStockRows([
        { skuId: missing, qty: 1, incoming: 0, status: "active", lowStockThreshold: 2 },
      ]),
    (error: unknown) => error instanceof StockNotSeeded && error.skuId === missing,
  );
});

test("two concurrent paid webhooks for the last unit: one oversold, stock stays at 0", async () => {
  await seedFixtureStock([
    { skuId: SKU, qty: 1, incoming: 0, status: "active", lowStockThreshold: 2 },
  ]);
  const before = await stockRow();
  const soldBefore = before.sold;
  const ordersBefore = (await listOrders()).length;

  await Promise.all([
    dispatchStripeEvent(paid("evt_oversold_a", "cs_oversold_a", "checkout.session.completed")),
    dispatchStripeEvent(paid("evt_oversold_b", "cs_oversold_b", "checkout.session.async_payment_succeeded")),
  ]);

  const after = await stockRow();
  const pair = (await listOrders()).filter(
    (order) => order.stripeSessionId === "cs_oversold_a" || order.stripeSessionId === "cs_oversold_b",
  );
  assert.equal(pair.length, 2);
  assert.equal(pair.filter((order) => order.oversold).length, 1);
  assert.equal(pair.filter((order) => !order.oversold).length, 1);
  assert.equal(after.qty, 0);
  assert.equal(after.qty >= 0, true);
  assert.equal(after.sold, soldBefore + 2);

  const views = pair.map((order) => presentAdminOrder(order, "https://example.test/orders"));
  const flagged = filterAdminOrders(views, "oversold");
  assert.equal(flagged.length, 1);
  assert.equal(oversoldBadge(flagged[0].oversold), "Oversold");
  assert.equal(filterAdminOrders(views, "all").length, 2);
  const normal = views.find((order) => !order.oversold);
  assert.ok(normal);
  assert.equal(oversoldBadge(normal.oversold), null);

  const snapshot = {
    qty: after.qty,
    sold: after.sold,
    count: (await listOrders()).length,
    flags: pair
      .map((order) => ({ id: order.stripeSessionId, oversold: order.oversold }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  };

  await Promise.all([
    dispatchStripeEvent(paid("evt_oversold_a", "cs_oversold_a", "checkout.session.completed")),
    dispatchStripeEvent(paid("evt_oversold_b", "cs_oversold_b", "checkout.session.async_payment_succeeded")),
  ]);

  const replayed = await stockRow();
  const replayOrders = (await listOrders()).filter(
    (order) => order.stripeSessionId === "cs_oversold_a" || order.stripeSessionId === "cs_oversold_b",
  );
  assert.deepEqual(
    {
      qty: replayed.qty,
      sold: replayed.sold,
      count: (await listOrders()).length,
      flags: replayOrders
        .map((order) => ({ id: order.stripeSessionId, oversold: order.oversold }))
        .sort((a, b) => a.id.localeCompare(b.id)),
    },
    snapshot,
  );

  await dispatchStripeEvent({
    id: "evt_oversold_expired",
    type: "checkout.session.expired",
    data: {
      object: {
        id: "cs_oversold_expired",
        metadata: { stockReservation: JSON.stringify([{ skuId: SKU, qty: 1 }]) },
      },
    },
  } as never);

  const expired = await stockRow();
  const all = await listOrders();
  assert.equal(expired.qty, snapshot.qty);
  assert.equal(expired.sold, snapshot.sold);
  assert.equal(all.length, snapshot.count);
  assert.equal(all.some((order) => order.stripeSessionId === "cs_oversold_expired"), false);
  assert.equal(ordersBefore + 2, snapshot.count);
});

function paid(
  eventId: string,
  sessionId: string,
  type: "checkout.session.completed" | "checkout.session.async_payment_succeeded",
) {
  return {
    id: eventId,
    type,
    data: {
      object: {
        id: sessionId,
        payment_status: "paid",
        customer_details: { email: "buyer@example.com" },
        amount_total: 4800,
        currency: "usd",
        payment_intent: `pi_${sessionId}`,
        metadata: { stockReservation: JSON.stringify([{ skuId: SKU, qty: 1 }]) },
      },
    },
  } as never;
}

async function stockRow() {
  const row = (await listStockRecords()).find((item) => item.skuId === SKU);
  assert.ok(row);
  return row;
}

function sample(stripeSessionId: string, oversold: boolean): OrderRecord {
  return {
    stripeSessionId,
    email: "buyer@example.com",
    totalCents: 4800,
    currency: "usd",
    status: "paid",
    paymentIntentId: `pi_${stripeSessionId}`,
    reservation: [{ skuId: SKU, qty: 1 }],
    amountRefundedCents: 0,
    restocked: false,
    oversold,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}
