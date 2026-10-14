# Changelog

## 0.1.0

First buyer tag for the MVP on main (`bdff806`).

- `.gitignore` and `.env.example` hygiene. The only environment file in the tree is `.env.example`, and its values are placeholders. Secrets, `.env`, `.env.local`, `.vercel`, `node_modules`, `.next`, and local `data/dev-stock.json` stay out of the kit.
- Demo storefront, Stripe Checkout, and a separate admin.
- Fail-closed stock checks and no automatic restock on partial refunds.
- Admin session cookie, signed webhook handling, and thin order rows.
- In-memory stock when `DATABASE_URL` is unset or still the example placeholder, local development only. Production requires a real URL.
- Oversold orders. A paid webhook sets `orders.oversold` when a line asks for more than was on hand. Quantity floors at 0. On boot, Postgres runs `ALTER TABLE orders ADD COLUMN IF NOT EXISTS oversold boolean NOT NULL DEFAULT false`, so an existing database keeps its rows.
- `checkoutExpiryMinutes` in `data/site.config.ts` (default 60) sets Stripe Checkout `expires_at`. The value sent is clamped to 31–1440 minutes.
- Product CSV import. `npm run import:products` (alias `npm run import:shopify`) reads the ShopSite template or a Shopify product export. The starter file is `products-template.csv` at the repo root.
- Production SEO: metadata and Open Graph, sitemap, robots, product JSON-LD, and canonical URLs from `NEXT_PUBLIC_APP_URL`.
- Production builds refuse a missing or local-only `NEXT_PUBLIC_APP_URL`. Vercel preview builds can fall back to `https://$VERCEL_URL`.
- Thin docs: `PLAYBOOK.md` for brand, import, stock, and checkout, including the SEO note. Cold start stays in `README.md`. `DOCUMENTATION-CHECKLIST.md` is the release check for those docs.
- Admin closed-screen Generate secret: when `ADMIN_SECRET` is missing or still a placeholder, `/admin/login` offers a client-only Generate secret button (`crypto.getRandomValues`, 32 bytes / 44-character base64), copies it to the clipboard with a manual fallback, and shows the steps to put the value in `.env.local` and restart. The server never writes the secret to disk. Fail-closed still blocks admin until a real secret is configured.
