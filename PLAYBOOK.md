# ShopSite playbook

A short walk after the README cold start. Install, env, and `npm run dev` stay in the README. Use this page for design, brand, catalogue, stock, checkout, and SEO. **Deploy** links to the Vercel and Stripe checklist.

Release checks: [DOCUMENTATION-CHECKLIST.md](DOCUMENTATION-CHECKLIST.md).

## Architecture

The storefront is the stylish shop: `app/(shop)` and `components/shop`. Change layout, copy, and the catalogue there.

Admin is a separate shadcn console for stock and thin orders. Leave `app/admin/**` and `components/ui/**` alone unless you mean to change operations. Fuller stop-rules for AI edits are in [SKILL.md](SKILL.md).

Color, density, and chrome are a rebuild of `data/recipe.ts`. There is no theme switcher. Rules for a rebrand are in **Design style** and **Dev file map**.

## Design style

Ship default is Cool sparse. Leave it unless the buyer’s brand table below says otherwise.

- Type is Inter only.
- Color is `#fafaf8` / `#ffffff` / `#111111`. Accent is ink. No terracotta.
- Density and chrome are `comfortable` and `bare`.
- Home is the product grid. No manifesto hero.
- Trust notes and FAQ copy stay empty until the buyer fills them. Empty `shippingNote` and `returnsNote` stay hidden. An empty `faqs` list shows one `TODO: Replace me` row.

### When to flip levers

Set `storefrontRecipe` in `data/recipe.ts` and rebuild. Product, brand, and content only — do not add a switcher.

| Buyer intent | density | chrome | recipe |
| --- | --- | --- | --- |
| Quiet goods, fashion, sparse catalogue | comfortable | bare | default |
| Dense catalogue, many SKUs, electronics | compact | bare or ruled | default |
| Soft DTC, lifestyle cards | comfortable | soft-card | default or sand |
| Night, cinematic, jewelry | comfortable | bare or soft-card | ink |
| Warm boutique (the buyer wants paper and rust) | comfortable | bare | sand |

`default` is Cool sparse (`app/recipes/default.css`, also `:root` in `app/globals.css`). `ink` is dark cinematic. `sand` is warmer paper. Sand is the recipe that brings paper and rust, and only when that row is the buyer’s ask.

### Anti-AI rules

1. Do not ship warm paper and rust as the default.
2. Do not add a serif display pair. Inter is the only storefront family.
3. Do not build an eyebrow, big brand name, one-liner, and pill CTA hero.
4. Do not use soft-bordered cream product cards as the default.
5. Do not put micro all-caps tracked labels everywhere.
6. Do not write poetic empty states. The empty bag is a plain line and **Start shopping**.
7. Placeholders are a plain grey block, not dashed art.
8. Copy is factual product names and descriptions. Do not write “unhurried”, “atelier”, or “thoughtfully”.

### What to edit first

1. `data/site.config.ts` — name, tagline, trust notes, FAQs.
2. Catalogue images and copy.
3. `data/recipe.ts` — only if the brand needs a density, chrome, or recipe shift.
4. Never add a theme switcher UI.

### Fixture check

Acceptance spot-checks after import. They are not ship defaults.

| Fixture | Look |
| --- | --- |
| A premium bag | default · bare · comfortable |
| B playful bag | sand · soft-card · comfortable |
| C electronics | compact · ruled · default |
| D sparse | default · bare · comfortable · 1–2 SKUs |

Multi-option PDP acceptance — re-import products-template.csv and check linen-napkin Color Oat/Sage.

## Dev file map

Same order as **What to edit first**, with the files.

### Edit order

1. `data/site.config.ts` — `name`, `tagline`, `description`, `supportEmail`, `shippingNote`, `returnsNote`, `faqs`.
2. Catalogue — edit `products-template.csv`, then `npm run import:products`. Put images under `public/products/`. The import writes `data/products.generated.json`, which `data/products.ts` loads. Commands and file rules stay in the README section **Import a catalogue**.
3. Only if the brand needs a shift: `data/recipe.ts` — `storefrontRecipe.id`, `density`, and `chrome`. Rebuild. No runtime switcher.
4. Legal shells before go-live — `app/(shop)/shipping/page.tsx`, `app/(shop)/returns/page.tsx`, `app/(shop)/faq/page.tsx`, `app/(shop)/privacy/page.tsx`, `app/(shop)/terms/page.tsx`, `components/shop/footer.tsx`, `components/shop/text-page.tsx`.

### Levers

| Lever | File | Notes |
| --- | --- | --- |
| Color recipe | `data/recipe.ts` and `app/recipes/{default,ink,sand}.css` | Ship default is Cool sparse. `:root` in `app/globals.css` mirrors `default` (`#fafaf8` / `#ffffff` / `#111111`). |
| Density / chrome | `data/recipe.ts` → `data-density` and `data-chrome` on `<html>` | Classes include `shop-pad`, `shop-grid`, `shop-card`, `shop-split`. `comfortable` is the Cool sparse rhythm (section padding, card gap, type step). `bare` is flush images, no card border. `ruled` is a hairline. `soft-card` is a soft shadow on the surface color. |
| Fonts | `app/fonts.ts` → `app/layout.tsx` | Inter only (`--font-body`). |
| OG colors | `lib/theme.ts` | Follows the active recipe id. Open Graph image rendering cannot read CSS variables. |
| Trust under CTA | `siteConfig.shippingNote` / `returnsNote` | Empty means hidden. |
| FAQ accordion | `siteConfig.faqs` | Empty means one `TODO: Replace me` row. A blank question or answer is not shown. |
| Grey placeholders | `components/shop/product-image-placeholder.tsx` | Plain grey block and “Replace me”. |
| Bag empty / Esc | `components/shop/cart-drawer.tsx` | Empty bag is a plain line and Start shopping. Esc closes the drawer and returns focus to the Bag control. |
| PDP sticky buy / variants | `components/shop/product-purchase.tsx` | Mobile buy bar and variant choice. |
| Cards (no CTA) | `components/shop/product-card.tsx` | Image, name, price, and an optional variant hint. No add-to-bag button on the card. |

### Do not touch

On a rebrand, leave these alone:

- `app/admin/**`, `components/ui/**`, Stripe, checkout, the webhook, and the `package.json` version.
- Do not add a theme switcher UI.
- Do not change Inter or the Cool sparse defaults unless the buyer’s brand table says so.

Admin keeps its own tokens on `.admin`. A shop restyle does not repaint the operations UI.

### How design and dev meet

Use the intent table in **Design style** and set `storefrontRecipe` only. The anti-AI rules stay as listed there. Fixtures A–D are acceptance spot-checks after import, not ship defaults.

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
| `shippingNote` | Optional line under Add to bag. Leave `""`. The product page hides it until you set one. |
| `returnsNote` | Optional line under Add to bag. Leave `""`. The product page hides it until you set one. |
| `faqs` | `{ question, answer }` list for `/faq`. Leave `[]`. A blank question or answer is not shown. |

Color, density, and chrome are build-time levers in `data/recipe.ts`. Ship default is `default`, `comfortable`, and `bare`. `ink` and `sand` are optional color files. There is no theme switcher. Edit the file and rebuild. Open Graph colors follow the active id. See **Design style** and **Dev file map**.

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
- A product can import with no images. Cards and the product page show a plain grey **Replace me** placeholder until you add a file under `public/` or an https URL. Swap that placeholder for a real photo before you treat the shop as buyer-ready.

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
- [ ] Replace the kicker in `components/shop/text-page.tsx` (`Replace this line with your page label.`).
- [ ] Replace the footer line in `components/shop/footer.tsx` (`Replace this line with your store footer.`).
- [ ] Set `supportEmail` in `data/site.config.ts` to a real inbox. The demo is `support@example.com`.

Privacy, terms, returns, and shipping say `Policy not set yet`. Write your own pages. Do not ship the shell. Do not state shipping or return timing this kit does not enforce.

`shippingNote` and `returnsNote` ship empty. The product page does not show a shipping or returns line until you set one. Do not fill them with timing this kit does not enforce.

`faqs` ships empty. `/faq` is an accordion whose only row is `TODO: Replace me` until you add a question and an answer.

## Deploy

Finish **Legal pages and footer** before the first production deploy. Vercel and Stripe steps are in [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md).

Set the production environment before the first production build. Vercel bakes `NEXT_PUBLIC_*` values in at build time.

`NEXT_PUBLIC_APP_URL` is fail-closed on that build. It must be the real https origin, with no trailing slash. The production build fails when it is missing or a local-only host (`localhost`, `127.0.0.1`, and similar). Preview builds may omit it and use `https://$VERCEL_URL`.

The Stripe webhook URL is `https://YOUR_DOMAIN/api/webhooks/stripe` on that same origin. After deploy, smoke the home page, a product page, and admin login on the real hostname. Admin login may reject `127.0.0.1`.
