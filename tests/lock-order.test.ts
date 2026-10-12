import assert from "node:assert/strict";
import test from "node:test";

import { linesInLockOrder } from "../lib/inventory-policy.ts";
import { listOrders, listStockRecords, observePaidLockOrder, saveStockRows } from "../lib/db.ts";
import { dispatchStripeEvent } from "../lib/stripe-events.ts";

const SKU_A = "SKU-MUG-01";
const SKU_B = "SKU-TOTE-01";

test("opposite carts lock in skuId order and both paid webhooks finish", async () => {
  const cartAB = [
    { skuId: SKU_A, qty: 1 },
    { skuId: SKU_B, qty: 1 },
  ];
  const cartBA = [
    { skuId: SKU_B, qty: 1 },
    { skuId: SKU_A, qty: 1 },
  ];
  assert.deepEqual(
    linesInLockOrder(cartAB).map((line) => line.skuId),
    [SKU_A, SKU_B],
  );
  assert.deepEqual(
    linesInLockOrder(cartBA).map((line) => line.skuId),
    [SKU_A, SKU_B],
  );
  assert.deepEqual(
    cartBA.map((line) => line.skuId),
    [SKU_B, SKU_A],
  );

  await saveStockRows([
    { skuId: SKU_A, qty: 5, incoming: 0, status: "active", lowStockThreshold: 2 },
    { skuId: SKU_B, qty: 7, incoming: 0, status: "active", lowStockThreshold: 2 },
  ]);
  const soldA = (await stock(SKU_A)).sold;
  const soldB = (await stock(SKU_B)).sold;

  const seen: string[][] = [];
  observePaidLockOrder((skuIds) => {
    seen.push([...skuIds]);
  });
  try {
    await Promise.all([
      dispatchStripeEvent(paid("evt_lock_ab", "cs_lock_ab", cartAB)),
      dispatchStripeEvent(paid("evt_lock_ba", "cs_lock_ba", cartBA)),
    ]);
  } finally {
    observePaidLockOrder(null);
  }

  assert.equal(seen.length, 2);
  for (const order of seen) {
    assert.deepEqual(order, [SKU_A, SKU_B]);
  }

  const orders = (await listOrders()).filter(
    (order) => order.stripeSessionId === "cs_lock_ab" || order.stripeSessionId === "cs_lock_ba",
  );
  assert.equal(orders.length, 2);
  assert.equal(orders.every((order) => order.oversold === false), true);
  const byId = new Map(orders.map((order) => [order.stripeSessionId, order]));
  assert.deepEqual(
    byId.get("cs_lock_ab")?.reservation.map((line) => line.skuId),
    [SKU_A, SKU_B],
  );
  assert.deepEqual(
    byId.get("cs_lock_ba")?.reservation.map((line) => line.skuId),
    [SKU_B, SKU_A],
  );

  const afterA = await stock(SKU_A);
  const afterB = await stock(SKU_B);
  assert.equal(afterA.qty, 3);
  assert.equal(afterB.qty, 5);
  assert.equal(afterA.qty >= 0, true);
  assert.equal(afterB.qty >= 0, true);
  assert.equal(afterA.sold, soldA + 2);
  assert.equal(afterB.sold, soldB + 2);
});

function paid(eventId: string, sessionId: string, lines: { skuId: string; qty: number }[]) {
  return {
    id: eventId,
    type: "checkout.session.completed",
    data: {
      object: {
        id: sessionId,
        payment_status: "paid",
        customer_details: { email: "buyer@example.com" },
        amount_total: 8000,
        currency: "usd",
        payment_intent: `pi_${sessionId}`,
        metadata: { stockReservation: JSON.stringify(lines) },
      },
    },
  } as never;
}

async function stock(skuId: string) {
  const row = (await listStockRecords()).find((item) => item.skuId === skuId);
  assert.ok(row);
  return row;
}
