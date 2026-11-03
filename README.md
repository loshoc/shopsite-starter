# ShopSite starter

Next.js storefront, Stripe Checkout, and a separate admin for stock and thin orders.

The core is MIT open source. See [LICENSE](LICENSE). Contributor setup is [CONTRIBUTING.md](CONTRIBUTING.md). Vulnerability reports: [SECURITY.md](SECURITY.md).

## Start path

This is the route from a clone of this repository to a live store. Clone the public repo, or clone your fork. Deploy from a GitHub repository you control with Vercel **Import Git**. Do not upload a zip to Vercel. A private repository is fine if you want one.

1. Clone.

```bash
git clone https://github.com/loshoc/shopsite-starter.git
cd shopsite-starter
```

For your own store or a pull request, fork the repository on GitHub and clone that fork. The URL is the same shape with your user in place of `loshoc`. `.gitignore` already excludes `.env`, `.env.local`, and `node_modules`. Commit `.env.example` only. Do not commit secrets. `git status` should include `.env.example` and should omit `.env.local`.

2. On Vercel, open **Add New… → Project** and **Import** that GitHub repo. If Vercel asks, connect GitHub and grant access to that repo. Do not drag a zip onto Vercel. Continue to environment variables before the first deploy.
3. Set **Production** environment variables from the names in `.env.example`. Set `NEXT_PUBLIC_APP_URL` to the https origin you will serve, with no trailing slash, before the first build.
4. Run the first production build.
5. Add the Stripe webhook.
6. Attach the custom domain.

Values, the build, the webhook, Checkout **Business name**, the domain, and smoke checks: [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md).

Local `npm` is **Cold start** below. Brand, catalogue, and look: [PLAYBOOK.md](PLAYBOOK.md) **Start**. The same Start for an AI edit: [SKILL.md](SKILL.md) **Start**. Before go-live: [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md).

## Cold start

Deploying follows [Start path](#start-path) above. This section is the local `npm` run.

> Requires Node.js 22.13 or newer (check with `node -v`; `.nvmrc` pins it). Node 20 warns at `npm ci` and fails at `npm test`.

```bash
cp .env.example .env.local
```

Edit `.env.local`:

- `ADMIN_SECRET` — at least 32 random characters. The placeholder in `.env.example` is rejected. `openssl rand -base64 32`
- Stripe test keys and `STRIPE_WEBHOOK_SECRET` from the Dashboard or `stripe listen`
- `DATABASE_URL` — leave the example placeholder for an in-memory first run with `npm run dev`, or set a real Postgres URL. Production refuses to boot, and refuses admin sessions and checkout, until this is a real URL
- `NEXT_PUBLIC_APP_URL` — public site origin, no trailing slash. Local development: `http://localhost:3000`. Production rules are in [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md)

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

PayPal is optional. Placeholders in `.env.example` keep the bag on Stripe only. To offer PayPal Buttons as well, set `PAYPAL_MODE=sandbox` and the sandbox client id, secret, and webhook id from the PayPal Developer Dashboard. `NEXT_PUBLIC_PAYPAL_CLIENT_ID` must be that same sandbox client id. The secret and webhook id stay server-only. For live, use a different live app, set `PAYPAL_MODE=live`, and point the public client id at the live client id. Stock changes only after the signed webhook at `/api/webhooks/paypal`. Sandbox steps are in [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md).

With Postgres, open Admin → Stock and seed the catalogue before expecting items to be orderable. A missing stock row is quantity 0. `npm run dev` can use the in-memory fallback, which seeds demo quantities and still blocks checkout at zero. Production does not use that fallback.

Set real production Stripe keys and `STRIPE_WEBHOOK_SECRET` on the deployed project before going live. Do not commit `.env.local`. That setup is **Start path** and [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md).

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
- `npm test` — kit-integrity only (checkout gates, admin auth, import pipeline, live-key refuse, currency wiring). Rebranding `products-template.csv`, the sample files under `public/products/`, `data/site.config.ts`, or `data/recipe.ts` does not fail this command.
- `npm run test:demo` — shipped housewares catalogue and Cool sparse recipe. `npm run test:design` is the same command. For maintainers of the starter, not for a buyer rebrand.
- `npm run test:all` — kit-integrity and the demo suite.
- `npm run lint`
- `npm run import:products -- <file.csv> [--seed-stock] [--force]`
- `npm run import:shopify -- <file.csv> [--seed-stock] [--force]`

Buyer walkthrough: [PLAYBOOK.md](PLAYBOOK.md) **Start**. Ship route: **Start path** above.

Before go-live: [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md). Vercel and Stripe detail: [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md).

## License

ShopSite is MIT-licensed. Copyright (c) 2026 Kiwi Guo. See [LICENSE](LICENSE).

Storefront Terms, Privacy, and Returns templates in [docs/legal/](docs/legal/README.md) are not part of that grant. Replace the empty policy shells before go-live. Vulnerability reports: [SECURITY.md](SECURITY.md). Contributor setup: [CONTRIBUTING.md](CONTRIBUTING.md).
