# Changelog

## 0.1.0

- Demo storefront, Stripe Checkout, and a separate admin.
- Fail-closed stock checks and no automatic restock on partial refunds.
- Admin session cookie, signed webhook handling, and thin order rows.
- In-memory stock when `DATABASE_URL` is unset or still the example placeholder, local development only. Production requires a real URL.
