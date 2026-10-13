# Changelog

## 0.1.0

- Demo storefront, Stripe Checkout, and a separate admin.
- Fail-closed stock checks and no automatic restock on partial refunds.
- Admin session cookie, signed webhook handling, and thin order rows.
- In-memory stock when `DATABASE_URL` is unset or still the example placeholder, local development only. Production requires a real URL.
- Production SEO: metadata and Open Graph, sitemap, robots, product JSON-LD, and canonical URLs from `NEXT_PUBLIC_APP_URL`.
- Production builds refuse a missing or local-only `NEXT_PUBLIC_APP_URL`. Vercel preview builds can fall back to `https://$VERCEL_URL`.
