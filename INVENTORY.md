# Inventory

Live quantity is a stock row, not `stockUnits` in `data/products.ts`. `stockUnits` is only the seed count.

## Fail closed

For each cart line, checkout loads the live row. A missing row is quantity 0 unless the live status is `unlimited`. If requested is greater than live quantity, the API returns 409 and does not create a Stripe Checkout session. Quantity 0 is not a preorder.

If `DATABASE_URL` is unset or still the example placeholder, the process keeps an in-memory stock table seeded once from the catalogue. That seed is not a bypass: after startup, a missing SKU is 0, and a zero row cannot be purchased. If a real `DATABASE_URL` is set and Postgres is down, checkout returns 503 instead of falling back to memory.

## Refunds

A full refund (`charge.refunded`, or refunded amount covering the charge) may return the reserved units.

A partial refund updates the order status and does not change quantity. Admin → Orders has an explicit “Restock inventory” confirmation for that case.

## Orders

Admin stores email, total, currency, status, Checkout session id, payment intent id (for the refund lookup), and the reserved SKUs. The orders screen shows email, total, status, and a Dashboard link. It does not show card data or the Stripe payload.

## Not automatic

Claiming stock inside the webhook transaction, shorter Checkout expiry on the last units, and low-stock email are not in this version. Stock is decremented when the paid webhook arrives, after the signature is verified.
