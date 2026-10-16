# ShopSite starter

Next.js storefront, Stripe Checkout, and a separate admin for stock and thin orders.

## Cold start

> Requires Node.js 22.12 or newer (check with `node -v`; `.nvmrc` pins it). Node 20 warns at `npm ci` and fails at `npm test`.

```bash
cp .env.example .env.local
```

Edit `.env.local`:

- `ADMIN_SECRET` — at least 32 random characters. The placeholder in `.env.example` is rejected. `openssl rand -base64 32`
- Stripe test keys and `STRIPE_WEBHOOK_SECRET` from the Dashboard or `stripe listen`
- `DATABASE_URL` — leave the example placeholder for an in-memory first run with `npm run dev`, or set a real Postgres URL. Production refuses to boot, and refuses admin sessions and checkout, until this is a real URL
- `NEXT_PUBLIC_APP_URL` — public site origin, no trailing slash. Required in production: the build fails if it is missing or a local-only host such as localhost. Set it before a Vercel production build. Vercel preview builds can omit it and use `https://$VERCEL_URL`. Local development: `http://localhost:3000`

```bash
npm install
npm run dev
```

Shop: http://localhost:3000  
Admin: http://localhost:3000/admin/login

The admin cookie is `HttpOnly`, `SameSite=Strict`, and `Secure` in production (`npm start` needs HTTPS). `npm run dev` allows the cookie on http://localhost.

Forward webhooks while developing:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

With Postgres, open Admin → Stock and seed the catalogue before expecting items to be orderable. A missing stock row is quantity 0. `npm run dev` can use the in-memory fallback, which seeds demo quantities and still blocks checkout at zero. Production does not use that fallback.

Buyers set real production Stripe keys and `STRIPE_WEBHOOK_SECRET` before going live. Do not commit `.env.local`.

## Inventory

Sold-out checkout is fail-closed. Partial refunds do not restock automatically. See `INVENTORY.md`.

## Not in this kit

Marketing email, newsletters, audiences, campaigns, and Resend are a separate add-on.

Admin auth is a shared secret and an httpOnly cookie. Clerk or Auth.js is an upgrade path, not included.

## Import a catalogue

```bash
npm run import:products -- products-template.csv
npm run import:products -- path/to/products_export.csv --seed-stock
npm run import:products -- path/to/products_export.csv --seed-stock --force
```

`npm run import:shopify` is the same command. The file is detected as a Shopify product export or as `products-template.csv`. The catalogue is written to `data/products.generated.json`. Descriptions are allowlist-sanitized, prices are integer cents, and only https URLs or files under `public/` are accepted. https hosts are written to `images.remotePatterns` in `next.config.ts` as exact host and path entries. Loopback, private, link-local, and cloud-metadata hosts are rejected and are not written. A product with no images still imports; the shop shows a plain grey Replace me placeholder on the card and the product page until an image is added.

`--seed-stock` inserts a stock row only when that SKU does not already have one. Run it again and the quantity stays the same. `--force` requires `--seed-stock` and sets the quantity (it does not add). Without Postgres, the seed is stored in `data/dev-stock.json` for the local in-memory store.

## Scripts

- `npm run dev`
- `npm run build`
- `npm test`
- `npm run lint`
- `npm run import:products -- <file.csv> [--seed-stock] [--force]`
- `npm run import:shopify -- <file.csv> [--seed-stock] [--force]`

Buyer walkthrough (brand, import, stock, checkout, SEO): [PLAYBOOK.md](PLAYBOOK.md).

## License

The kit is licensed, not sold, under the ShopSite End-User License Agreement in [docs/legal/EULA-KIT-LICENSE.md](docs/legal/EULA-KIT-LICENSE.md). See [LICENSE](LICENSE). `docs/legal/SELLER-CHECKLIST.md` is for the Seller. It stays in the repository and is not in the buyer zip.
