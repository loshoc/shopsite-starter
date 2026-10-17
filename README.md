# ShopSite starter

Next.js storefront, Stripe Checkout, and a separate admin for stock and thin orders.

## Start path

This is the route from the buyer zip to a live store. Get the buyer zip from [Release v1.1.0](https://github.com/loshoc/shopsite-starter/releases/tag/v1.1.0) (asset `shopsite-starter-1.1.0.zip`). Prefer a **private** GitHub repo and Vercel **Import Git** over uploading a zip to Vercel.

1. Unzip the buyer kit.
2. Create an empty **private** GitHub repository. Leave it without a README or license file so the first push is this tree. From the unzipped folder, push the tree. When the folder is not already a Git checkout, use the commands below. `.gitignore` already excludes `.env`, `.env.local`, and `node_modules`. Commit `.env.example` only. Do not commit secrets.

```bash
git init
git add .
git status
git commit -m "Import ShopSite kit"
git branch -M main
git remote add origin https://github.com/OWNER/REPO.git
git push -u origin main
```

Replace `OWNER/REPO`. `git status` should include `.env.example` and should omit `.env.local`.

3. On Vercel, open **Add New… → Project** and **Import** that private repo. If Vercel asks, connect GitHub and grant access to that repo. Do not drag the zip onto Vercel. Continue to environment variables before the first deploy.
4. Set **Production** environment variables from the names in `.env.example`. Set `NEXT_PUBLIC_APP_URL` to the https origin you will serve, with no trailing slash, before the first build.
5. Run the first production build.
6. Add the Stripe webhook.
7. Attach the custom domain.

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

The kit is licensed, not sold, under the ShopSite End-User License Agreement in [docs/legal/EULA-KIT-LICENSE.md](docs/legal/EULA-KIT-LICENSE.md). See [LICENSE](LICENSE).
