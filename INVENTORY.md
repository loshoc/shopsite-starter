# Inventory

Live quantity is a stock row, not `stockUnits` in `data/products.ts`. `stockUnits` is only the seed count.

## Fail closed

For each cart line, checkout loads the live row. A missing row is quantity 0 unless the live status is `unlimited`. If requested is greater than live quantity, the API returns 409 and does not create a Stripe Checkout session or a PayPal order. Quantity 0 is not a preorder.

If `DATABASE_URL` is unset or still the example placeholder, local development (`npm run dev`) keeps an in-memory stock table seeded once from the catalogue. That seed is not a bypass: after startup, a missing SKU is 0, and a zero row cannot be purchased. Production does not use that store. A missing or placeholder `DATABASE_URL` refuses boot, admin sessions, and checkout. If a real `DATABASE_URL` is set and Postgres is down, checkout returns 503 instead of falling back to memory.

## Refunds

A full refund (`charge.refunded`, or refunded amount covering the charge) may return the reserved units.

A partial refund updates the order status and does not change quantity. Admin → Orders has an explicit “Restock inventory” confirmation for that case.

## Orders

Admin stores email, total, currency, status, Checkout session id, payment intent id (for the refund lookup), the reserved SKUs, and an `oversold` flag. The orders screen shows email, total, status, an Oversold badge, and a Dashboard link. Filter the list to all orders or oversold only. It does not show card data or the Stripe payload.

## Oversold

A paid webhook (`checkout.session.completed` or `checkout.session.async_payment_succeeded` with `payment_status` `paid`) decrements each line to a floor of 0. Lines are locked in `skuId` order so two multi-item carts cannot deadlock. If any line asks for more than was on hand, the order row is marked `oversold`. Replaying the same Stripe event does not decrement again or change the flag. Resolve an oversold order by refunding or restocking. A live `unlimited` row is not marked oversold.

PayPal uses the same decrement. `PAYMENT.CAPTURE.COMPLETED` is applied only after `/api/webhooks/paypal` verifies the signature with PayPal. The bag's capture call and the `/success` page do not write stock or an order. A full PayPal refund (`PAYMENT.CAPTURE.REFUNDED` with capture status `REFUNDED`) may restock. A partial refund does not. The order id is stored as `paypal:` plus the PayPal order id. The capture id is stored in the payment-intent column so the refund can find the row.

## Checkout expiry

`checkoutExpiryMinutes` in `data/site.config.ts` defaults to 60 and sets Stripe Checkout `expires_at`. Stripe allows 30 minutes to 24 hours. The lifetime we send is 31–1440 minutes, so a 30-minute config cannot fall under Stripe's minimum after network delay. `0`, `29`, and `30` all become 31 minutes from now. Values above 1440 minutes clamp to 1440. A non-numeric value falls back to 60. Session expiry does not release stock and does not create an order. There is no `checkout.session.expired` stock handler.

## Not automatic

Low-stock email and a shorter Checkout expiry on the last units are not in this version. Stock is decremented when the paid webhook arrives, after the signature is verified.
