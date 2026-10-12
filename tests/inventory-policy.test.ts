import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyRefund,
  isOrderable,
  rejectsForStock,
  shouldAutoRestock,
  stockBadge,
} from "../lib/inventory-policy.ts";

test("qty 0 rejects a request instead of allowing a preorder", () => {
  assert.equal(rejectsForStock(1, { qty: 0, status: "active" }), true);
  assert.equal(rejectsForStock(1, { qty: 0, status: "missing" }), true);
  assert.equal(isOrderable({ qty: 0, status: "missing" }), false);
});

test("requested above live qty rejects, equal qty does not", () => {
  assert.equal(rejectsForStock(3, { qty: 2, status: "active" }), true);
  assert.equal(rejectsForStock(2, { qty: 2, status: "active" }), false);
});

test("only the live unlimited flag skips the quantity check", () => {
  assert.equal(rejectsForStock(5, { qty: 0, status: "unlimited" }), false);
  assert.equal(isOrderable({ qty: 0, status: "unlimited" }), true);
  assert.equal(rejectsForStock(1, { qty: 10, status: "hidden" }), true);
});

test("partial refunds do not auto-restock and full refunds may", () => {
  assert.equal(classifyRefund(5000, 2000, false), "partial");
  assert.equal(shouldAutoRestock("partial"), false);
  assert.equal(classifyRefund(5000, 5000, false), "full");
  assert.equal(classifyRefund(5000, 1000, true), "full");
  assert.equal(shouldAutoRestock("full"), true);
  assert.equal(classifyRefund(5000, 0, false), "none");
  assert.equal(shouldAutoRestock("none"), false);
});

test("low and out badges follow live qty", () => {
  assert.equal(stockBadge({ status: "missing", qty: 0, lowStockThreshold: 2 }), "missing");
  assert.equal(stockBadge({ status: "active", qty: 0, lowStockThreshold: 2 }), "out");
  assert.equal(stockBadge({ status: "active", qty: 2, lowStockThreshold: 2 }), "low");
  assert.equal(stockBadge({ status: "active", qty: 3, lowStockThreshold: 2 }), "in");
});
