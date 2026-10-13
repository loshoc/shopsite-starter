# ShopSite playbook

A short walk after the README cold start. Install, env, and `npm run dev` stay in the README. Use this page for brand, catalogue, stock, checkout, and SEO.

Release checks: [DOCUMENTATION-CHECKLIST.md](DOCUMENTATION-CHECKLIST.md).

## Architecture

The storefront is the stylish shop: `app/(shop)` and `components/shop`. Change layout, copy, and the catalogue there.

Admin is a separate shadcn console for stock and thin orders. Leave `app/admin/**` and `components/ui/**` alone unless you mean to change operations. Fuller stop-rules for AI edits are in [SKILL.md](SKILL.md).

## Customize the brand

Edit `data/site.config.ts`.

| Field | What to set |
| --- | --- |
| `name` | Store name. Page titles use it (`Store · Page`). |
| `tagline` | Short line on the home page. With `name`, it is the default meta description: `Shop {name}. {tagline}.` |
| `description` | Brand sentence in this file. Replace the demo sentence with your own. Titles and the default meta description come from `name` and `tagline`. |
| `supportEmail` | Address shown on the returns page (`support@example.com` in the demo). |
| `currency` | Checkout currency. The demo is `usd`. |
| `lowStockDefault` | Low-stock threshold written when a stock row is created. Default `2`. |
| `checkoutExpiryMinutes` | Stripe Checkout lifetime in minutes. Default `60`. Values are clamped to **31–1440** (Stripe’s window is 30 minutes to 24 hours; the kit sends at least 31 so a delayed request still clears that floor). |

## Import products

Commands, file detection, image rules, and what gets written are in the README section **Import a catalogue**. Use that section as the source of truth.

`products-template.csv` at the repo root is the starter file. Excel or Google Sheets can edit it; save or download as CSV before you import. The header row is the contract (`handle`, `name`, `description`, `price`, `sku`, `stock`, images, options).

```bash
npm run import:products -- file.csv
npm run import:products -- file.csv --seed-stock
npm run import:products -- file.csv --seed-stock --force
```

`npm run import:shopify` is an alias of the same command.

- `--seed-stock` inserts a stock row only when that SKU does not already have one. Run it again and the quantity stays the same.
- `--force` requires `--seed-stock`. It **overwrites** quantity with the CSV value. It does not add. Use it only when you mean to replace live counts.
- A bad row fails the whole import. The message names the row (for example `Row 3: Missing SKU.`). The catalogue file is left unchanged.
- Warnings can print while the import still succeeds. Errors stop it.

## Stock and admin

Open the shop and admin as `http://localhost:3000` (admin login is `http://localhost:3000/admin/login`). Admin login may reject `127.0.0.1`.

With Postgres, open **Admin → Stock** and seed the catalogue before you expect items to be orderable. Seed inserts missing SKUs only. A missing stock row is quantity 0.

Sold-out checkout is fail-closed: the API refuses the cart and does not open Stripe. A partial refund does not restock. An **Oversold** badge means refund the order or restock by hand in admin. Details: [INVENTORY.md](INVENTORY.md).

## Money path

1. The buyer adds lines to the cart.
2. Checkout reads live stock. If a line wants more than is on hand, checkout stops and no Stripe session is created.
3. Stripe Checkout collects payment.
4. The webhook at `/api/webhooks/stripe` checks `STRIPE_WEBHOOK_SECRET` before any write. A bad signature is rejected and stock is untouched.
5. A verified paid event decrements stock and stores a thin order row (email, total, currency, status, Checkout session id, payment intent id, reserved SKUs, and an oversold flag). Card data is not stored.

Forward webhooks locally with the command in the README cold start.

## SEO

Set `name` and `tagline` in `data/site.config.ts`. Those fields drive titles and descriptions.

`NEXT_PUBLIC_APP_URL` is the public site origin, with no trailing slash. Set it to the real https origin before a Vercel production build. The production build fails when it is missing or a local-only host such as localhost. Vercel preview builds can omit it and use `https://$VERCEL_URL`. Local development: `http://localhost:3000`.

After deploy, submit `https://YOUR_DOMAIN/sitemap.xml` in Google Search Console. `/robots.txt` already blocks `/admin`, `/api`, `/success`, and `/cancel`.
