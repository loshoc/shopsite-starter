# ShopSite playbook

Buyer guide for brand, catalogue, stock, checkout, and SEO. The ship route from the zip to a live store is [README.md](README.md) **Start path** (private GitHub, then Vercel **Import Git**). Local `npm` stays in README **Cold start**.

**Start** below is that brand pass. The same pass for an AI edit is [SKILL.md](SKILL.md) **Start**.

Before go-live, walk [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md). **Deploy** points at the Vercel and Stripe checklist.

Release checks: [DOCUMENTATION-CHECKLIST.md](DOCUMENTATION-CHECKLIST.md).

## Start

Work this section before the deeper pages below. Import commands, stock, the money path, SEO, and the legal file list stay in those pages. Deploy clicks stay in [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md).

### Intake

Write these down before you edit:

- What you sell.
- Market or region.
- Currency. Set `currency` in `data/site.config.ts` to a lowercase ISO 4217 code. The demo is `usd`.
- Price range. Prices are per SKU in the CSV. The kit has no range field.
- Reference sites or brands. Use **Pick elements** below. The app has no picker.

### Materials

Collect these before you treat the shop as ready:

- Logo. The header prints `name` from `data/site.config.ts` as text (`components/shop/header.tsx`). The kit has no logo-image field. A Checkout logo is Stripe Dashboard **Branding**. See [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md) **Checkout business name**.
- Product photos. Demo PNGs under `public/products/` are 32×32 swatches to replace: `cedar-spoon.png`, `linen-napkin.png`, `linen-napkin-fold.png`, `stone-bowl.png`.
- Product name, SKU, and price for each variant.
- Support email. Replace `support@example.com` in `data/site.config.ts`.
- Domain. The https origin the store will serve.
- Stripe account. The account that will own the keys.
- Legal pages. `/shipping`, `/returns`, `/privacy`, `/terms`, and `/faq` ship as shells. See **Draft framing and page map**.

### Look presets

Type stays Inter. `app/fonts.ts` sets `--font-body`. Keep that single family.

There is no theme switcher. Set `storefrontRecipe` in `data/recipe.ts` and rebuild. Fields are `id`, `density`, and `chrome`. Palettes for `default`, `ink`, and `sand` already live in that file and in `app/recipes/`. Ship default is Cool sparse: `default`, `comfortable`, `bare`. `default` colors are `#fafaf8` / `#ffffff` / `#111111`.

`comfortable` is the Cool sparse rhythm. `compact` tightens it. `bare` is flush images and no card border. `ruled` is a hairline. `soft-card` is a soft shadow on the surface color. The intent table and the anti-AI rules are in **Design style**.

| Preset | When to use | `id` | `density` | `chrome` |
| --- | --- | --- | --- | --- |
| Cool sparse | Quiet goods, fashion, or a sparse catalogue. Ship this unless another row fits. | `default` | `comfortable` | `bare` |
| Compact ruled | Dense catalogue, many SKUs, electronics. | `default` | `compact` | `ruled` |
| Warm paper | Paper and rust. | `sand` | `comfortable` | `bare` |
| Ink night | Night, cinematic, jewelry. | `ink` | `comfortable` | `bare` |

Same file, when the row above is close but the chrome should change:

- Dense catalogue with a flush grid: Compact ruled, with `chrome` set to `bare`.
- Soft DTC, lifestyle cards, cool colors: Cool sparse, with `chrome` set to `soft-card`.
- Warm paper with cards: Warm paper, with `chrome` set to `soft-card`.
- Ink with cards: Ink night, with `chrome` set to `soft-card`.

Use `sand` only when you asked for paper and rust. `ink` is dark cinematic.

#### Pick elements from a reference URL

The app has no picker. From the reference URL, note only the pieces this kit can change:

- Header. Store name and which links show. File: `components/shop/header.tsx`. The name is `siteConfig.name`.
- Home. This home is the product grid. File: `app/(shop)/page.tsx`. Keep the grid. Skip a manifesto hero.
- Product card. Image, name, price, and an optional variant hint. The card has no add-to-bag button. File: `components/shop/product-card.tsx`.
- Product page. Gallery, name, description, variant buttons, one Add to bag, and a mobile buy bar. Files: `app/(shop)/products/[id]/page.tsx`, `components/shop/product-purchase.tsx`.
- Bag. Empty state and line layout. File: `components/shop/cart-drawer.tsx`.
- Footer. One store line and the policy links. File: `components/shop/footer.tsx`.

Put those notes into `data/site.config.ts`, the catalogue, and `data/recipe.ts`. Leave the reference site’s fonts and CSS out. Inter stays.

### Draft framing and page map

From the intake answers, set `name`, `tagline`, `description`, `supportEmail`, and `currency` in `data/site.config.ts`. Write factual product names and descriptions. Leave `shippingNote`, `returnsNote`, and `faqs` empty until the policies are real. Empty trust notes stay hidden.

| Page | Route | What ships |
| --- | --- | --- |
| Home | `/` | Product grid. The heading is Products. Demo catalogue until you replace it. |
| Shop (listing) | `/shop` | The same grid, plus a line that stock is live. |
| Product | `/products/[id]` | Demo ids: `cedar-spoon`, `linen-napkin`, `stone-bowl`. |
| Bag | Drawer from the header Bag control | No bag URL. An empty bag is a plain line and **Start shopping**. |
| Checkout | Stripe-hosted, PayPal Buttons optional | No checkout page in the kit. Return routes are `/success` and `/cancel`. PayPal shows in the bag only when its env is set. |
| FAQ | `/faq` | `faqs` ships `[]`. The page shows one `TODO: Replace me` row until you add a question and an answer. |
| Legal shells | `/shipping`, `/returns`, `/privacy`, `/terms` | Copy says `Policy not set yet` and `TODO: Replace me`. |
| Trust lines | Under Add to bag | `shippingNote` and `returnsNote` ship `""` and stay hidden. |

Demo brand until you edit it: name `Demo Shop`, the cedar-spoon tagline, `support@example.com`, currency `usd`. Replace the shells before go-live. File list: **Legal pages and footer**.

### Stripe and domain

Short sequence. The kit leaves `branding_settings`, `statement_descriptor`, and `statement_descriptor_suffix` unset. Checkout shows the Stripe account **Business name**. The storefront title is `name` in `data/site.config.ts`.

1. Use the Stripe account that will own `STRIPE_SECRET_KEY`.
2. Set **Business name**, **Statement descriptor**, and **Shortened descriptor** in the Dashboard. Click path: [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md) **Checkout business name** and [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md) **Checkout business name**.
3. Production env, first production build, webhook, then custom domain: [README.md](README.md) **Start path** and [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md).
4. Confirm before go-live: [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md) **Deploy basics**.

### What to prepare

**Images.** PNG, JPEG, or WebP. Put files in `public/products/` and reference them as `/products/your-file.png`, or use an https URL with no query and no hash. Import accepts a file under `public/` or an https URL. It does not check width, height, or file type. Cards use a 4:5 frame. Replace the 32×32 demo swatches.

**CSV.** Edit `products-template.csv` at the repo root. Save as CSV before import. Header row:

`handle,name,description,price,sku,stock,image_1,image_2,option1_name,option1_value,option2_name,option2_value,option3_name,option3_value`

`handle` is lowercase letters, digits, and single hyphens, for example `cedar-spoon`. `price` is major units with at most two decimal places and no currency symbol, for example `18.00`. Import stores integer cents. `stock` is a non-negative integer. Commands: [README.md](README.md) **Import a catalogue**.

**Env.** Names are in `.env.example`. Local file: `.env.local` (gitignored). Production values go on Vercel. See [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md) for the table.

- `ADMIN_SECRET` — at least 32 random characters. The example placeholder is rejected.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — `pk_test_...` or `pk_live_...`.
- `STRIPE_SECRET_KEY` — `sk_test_...` or `sk_live_...`, same mode as the publishable key.
- `STRIPE_WEBHOOK_SECRET` — `whsec_...`.
- PayPal, optional. Leave the `.env.example` placeholders to stay Stripe-only. `PAYPAL_MODE` is `sandbox` or `live`. `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is the client id for that mode (the only PayPal value that may be public). `PAYPAL_SANDBOX_CLIENT_SECRET` and `PAYPAL_LIVE_CLIENT_SECRET` are server-only. Webhook ids are server-only too. Do not put a secret in any `NEXT_PUBLIC_` name.
- `DATABASE_URL` — `postgresql://USER:PASSWORD@HOST:5432/DATABASE` in production. Local `npm run dev` may keep the example placeholder.
- `NEXT_PUBLIC_APP_URL` — origin, no trailing slash. Local: `http://localhost:3000`. Production: `https://` plus the domain.

**Currency.** `currency` in `data/site.config.ts` is the lowercase ISO code you charge. The demo is `usd`. Product pages, cards, the bag, and Stripe Checkout read that field. Display formatting stays `en-US`. There is no locale field.

## Architecture

The storefront is the stylish shop: `app/(shop)` and `components/shop`. Change layout, copy, and the catalogue there.

Admin is a separate shadcn console for stock and thin orders. Leave `app/admin/**` and `components/ui/**` alone unless you mean to change operations. The stop rule for AI edits is in [SKILL.md](SKILL.md) **Stop rule**. Guided Start is **Start** above and in that file.

Color, density, and chrome are a rebuild of `data/recipe.ts`. There is no theme switcher. Rules for a rebrand are in **Design style** and **Dev file map**.

## Design style

Ship default is Cool sparse. Leave it unless the buyer’s brand table below says otherwise.

- Type is Inter only.
- Color is `#fafaf8` / `#ffffff` / `#111111`. Accent is ink. No terracotta.
- Density and chrome are `comfortable` and `bare`.
- Home is the product grid. No manifesto hero.
- Trust notes and FAQ copy stay empty until the buyer fills them. Empty `shippingNote` and `returnsNote` stay hidden. An empty `faqs` list shows one `TODO: Replace me` row.

### When to flip levers

Set `storefrontRecipe` in `data/recipe.ts` and rebuild. Product, brand, and content only — do not add a switcher. Named presets and the fields to set are in **Start**.

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

`npm test` stays green across that rebrand. It checks kit contracts, not the housewares rows, the sample images, the demo name and tagline, or the Cool sparse selection. Maintainers lock those with `npm run test:demo` (`npm run test:design` is the same). `npm run test:all` runs both. The script list is in the README section **Scripts**.

Brand edits also leave the legal pages and the footer as starter shells. Replace those before go-live. See **Legal pages and footer**.

## Import products

Commands, file detection, image rules, and what gets written are in the README section **Import a catalogue**. Use that section as the source of truth.

`products-template.csv` at the repo root is the starter file. Excel or Google Sheets can edit it; save or download as CSV before you import. The header row is the contract (`handle`, `name`, `description`, `price`, `sku`, `stock`, images, options).

That file and `public/products/` ship the housewares sample (`cedar-spoon`, `linen-napkin`, `stone-bowl`, and the PNGs those rows reference: `cedar-spoon.png`, `linen-napkin.png`, `linen-napkin-fold.png`, `stone-bowl.png`). Replace the rows with your catalogue, then replace or delete those demo files under `public/products/` before you zip or deploy. The checklist is in [PACKAGING.md](PACKAGING.md) under **Scrub before you zip**.

Those demo PNGs are 32×32 swatches. Replace them with real product photos before you treat the shop as buyer-ready.

`hidden` is a field on the product. `lib/catalogue.ts` keeps a product on the storefront only when `!product.hidden`. Hiding a product hides every SKU on it. Variants do not have a `hidden` field. Stock quantity and stock status decide whether a SKU is orderable. A stock status of `hidden` blocks that SKU and leaves the product listed.

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
3. Stripe Checkout collects payment. The name on that page is the Stripe account's **Business name** (**Settings → Business → Business details**). The card or bank statement uses **Statement descriptor** and **Shortened descriptor** under **Public details**. `name` in `data/site.config.ts` is the storefront title. Steps: [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md) **Checkout business name**.
4. The webhook at `/api/webhooks/stripe` checks `STRIPE_WEBHOOK_SECRET` before any write. A bad signature is rejected and stock is untouched.
5. A verified paid event decrements stock and stores a thin order row (email, total, currency, status, Checkout session id, payment intent id, reserved SKUs, and an oversold flag). Card data is not stored.
6. When PayPal is configured, the bag also shows PayPal Buttons. That path checks the same stock, then creates and captures a PayPal order. Stock and the order row change only after `/api/webhooks/paypal` verifies the signature. The return to `/success` does not write stock. Sandbox, then live: [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md).

Forward Stripe webhooks locally with the command in the README cold start. PayPal cannot call localhost; the Dashboard webhook simulator or a tunnel has to reach `/api/webhooks/paypal`.

## SEO

Set `name` and `tagline` in `data/site.config.ts`. Those fields drive titles and descriptions.

`NEXT_PUBLIC_APP_URL` is the public site origin, with no trailing slash. Local development: `http://localhost:3000`. Set the production origin before the first production build. Those rules are in [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md).

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

Placeholder templates for that pass are in [docs/legal/](docs/legal/README.md). Leave the bracket placeholders as written until you set your own values.

`shippingNote` and `returnsNote` ship empty. The product page does not show a shipping or returns line until you set one. Do not fill them with timing this kit does not enforce.

`faqs` ships empty. `/faq` is an accordion whose only row is `TODO: Replace me` until you add a question and an answer.

## Deploy

The ship route is [README.md](README.md) **Start path**. Unzip the kit, push it to a **private** GitHub repo (`.env.example` only, no secrets), then on Vercel use **Import Git**. Prefer that over uploading a zip.

Production env, the first production build, the Stripe webhook, Checkout business name, and the custom domain are in [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md).

Finish **Legal pages and footer** before go-live. Confirm the store with [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md).
