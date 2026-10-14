# ShopSite playbook

A short walk after the README cold start. Install, env, and `npm run dev` stay in the README. Use this page for brand, catalogue, stock, checkout, and SEO. **Deploy** links to the Vercel and Stripe checklist.

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
| `supportEmail` | Address shown on the returns page. The demo is `support@example.com`. Replace it before go-live. |
| `currency` | Checkout currency. The demo is `usd`. |
| `lowStockDefault` | Low-stock threshold written when a stock row is created. Default `2`. |
| `checkoutExpiryMinutes` | Stripe Checkout lifetime in minutes. Default `60`. Values are clamped to **31–1440** (Stripe’s window is 30 minutes to 24 hours; the kit sends at least 31 so a delayed request still clears that floor). |

Changing `data/site.config.ts` leaves the sample catalogue on disk. After the store uses your own products, replace or delete demo files under `public/products/` and refresh `products-template.csv` before you zip or deploy. The checklist is in [PACKAGING.md](PACKAGING.md) under **Scrub before you zip**.

Brand edits also leave the legal pages and the footer as starter shells. Replace those before go-live. See **Legal pages and footer**.

## Import products

Commands, file detection, image rules, and what gets written are in the README section **Import a catalogue**. Use that section as the source of truth.

`products-template.csv` at the repo root is the starter file. Excel or Google Sheets can edit it; save or download as CSV before you import. The header row is the contract (`handle`, `name`, `description`, `price`, `sku`, `stock`, images, options).

That file and `public/products/` ship the housewares sample (`cedar-spoon`, `linen-napkin`, `stone-bowl`, and the PNGs those rows reference: `cedar-spoon.png`, `linen-napkin.png`, `linen-napkin-fold.png`, `stone-bowl.png`). Replace the rows with your catalogue, then replace or delete those demo files under `public/products/` before you zip or deploy. The checklist is in [PACKAGING.md](PACKAGING.md) under **Scrub before you zip**.

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

When admin is closed because `ADMIN_SECRET` is missing or still the placeholder, use **Generate secret** on that screen. It makes a client-only random value of at least 32 characters and copies it to the clipboard; paste it into `.env.local` as `ADMIN_SECRET` and restart the app. Fail-closed remains: the server never writes the secret, and admin stays blocked until the env is set and the process restarts.

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

## Legal pages and footer

Do this before go-live. Editing the brand or the catalogue does not replace these files. The starter copy is a shell, not a policy.

- [ ] Replace `/shipping` in `app/(shop)/shipping/page.tsx`.
- [ ] Replace `/returns` in `app/(shop)/returns/page.tsx`.
- [ ] Replace `/faq` in `app/(shop)/faq/page.tsx`.
- [ ] Replace `/privacy` in `app/(shop)/privacy/page.tsx`.
- [ ] Replace `/terms` in `app/(shop)/terms/page.tsx`.
- [ ] Replace the kicker in `components/shop/text-page.tsx` (`TODO: Replace me`).
- [ ] Replace the footer line in `components/shop/footer.tsx` (`TODO: Replace me`).
- [ ] Set `supportEmail` in `data/site.config.ts` to a real inbox. The demo is `support@example.com`.

Privacy, terms, returns, and shipping say `Policy not set yet`. Write your own pages. Do not ship the shell. Do not state shipping or return timing this kit does not enforce.

## Deploy

Finish **Legal pages and footer** before the first production deploy. Vercel and Stripe steps are in [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md).

Set the production environment before the first production build. Vercel bakes `NEXT_PUBLIC_*` values in at build time.

`NEXT_PUBLIC_APP_URL` is fail-closed on that build. It must be the real https origin, with no trailing slash. The production build fails when it is missing or a local-only host (`localhost`, `127.0.0.1`, and similar). Preview builds may omit it and use `https://$VERCEL_URL`.

The Stripe webhook URL is `https://YOUR_DOMAIN/api/webhooks/stripe` on that same origin. After deploy, smoke the home page, a product page, and admin login on the real hostname. Admin login may reject `127.0.0.1`.
