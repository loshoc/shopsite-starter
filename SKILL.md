# ShopSite skill

## Stop rule

Customize `app/(shop)` and `components/shop` for the brand: layout, copy, and catalogue in `data/products.ts` and `data/site.config.ts`.

Leave `app/admin`, `components/ui`, `components/admin`, and the inventory libraries alone unless the user explicitly asks to change operations.

Do not add Resend, newsletters, audiences, or campaign email to the core kit. Do not add Clerk; admin auth stays the shared secret until someone asks to replace it.

## Start

Follow this before a rebrand. The ship route from the zip to Vercel is [README.md](README.md) **Start path**. The same Start for a person is [PLAYBOOK.md](PLAYBOOK.md) **Start**. Deploy detail is [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md). The pre-go-live pass is [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md).

### Intake

Write these down before editing:

- What the store sells.
- Market or region.
- Currency. This is `currency` in `data/site.config.ts`. Use a lowercase ISO 4217 code. The demo is `usd`.
- Price range. Prices are per SKU in the CSV. There is no range field in the kit.
- Reference sites or brands. Use **Pick elements** below. The app has no picker.

### Materials

Collect these before treating the shop as ready:

- Logo. The header prints `name` from `data/site.config.ts` as text (`components/shop/header.tsx`). The kit has no logo-image field. A Checkout logo is Stripe Dashboard **Branding**. See [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md) **Checkout business name**.
- Product photos. Demo PNGs under `public/products/` are 32×32 swatches to replace: `cedar-spoon.png`, `linen-napkin.png`, `linen-napkin-fold.png`, `stone-bowl.png`.
- Product name, SKU, and price for each variant.
- Support email. Replace `support@example.com` in `data/site.config.ts`.
- Domain. The https origin the store will serve.
- Stripe account. The account that will own the keys.
- Legal pages. `/shipping`, `/returns`, `/privacy`, `/terms`, and `/faq` ship as shells. See **Draft framing and page map**.

### Look presets

Type stays Inter. `app/fonts.ts` sets `--font-body`. Keep that single family.

There is no theme switcher. Set `storefrontRecipe` in `data/recipe.ts` and rebuild. Fields are `id`, `density`, and `chrome`. Palettes for `default`, `ink`, and `sand` already live in that file and in `app/recipes/`. Ship default is Cool sparse: `default`, `comfortable`, `bare`. `default` colors are `#fafaf8` / `#ffffff` / `#111111`. `:root` in `app/globals.css` matches them.

`comfortable` is the Cool sparse rhythm. `compact` tightens it. `bare` is flush images and no card border. `ruled` is a hairline. `soft-card` is a soft shadow on the surface color.

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

`ink` is dark cinematic. `sand` is warmer paper. Use `sand` only when paper and rust was the ask. Rebrand rules stay in [PLAYBOOK.md](PLAYBOOK.md) **Design style**.

#### Pick elements from a reference URL

The app has no picker. From the reference URL, note only the pieces this kit can change:

- Header. Store name and which links show. File: `components/shop/header.tsx`. The name is `siteConfig.name`.
- Home. This home is the product grid. File: `app/(shop)/page.tsx`. Keep the grid. Skip a manifesto hero.
- Product card. Image, name, price, and an optional variant hint. The card has no add-to-bag button. File: `components/shop/product-card.tsx`.
- Product page. Gallery, name, description, variant buttons, one Add to bag, and a mobile buy bar. Files: `app/(shop)/products/[id]/page.tsx`, `components/shop/product-purchase.tsx`.
- Bag. Empty state and line layout. File: `components/shop/cart-drawer.tsx`.
- Footer. One store line and the policy links. File: `components/shop/footer.tsx`.

Put those notes into `data/site.config.ts`, the catalogue, and `data/recipe.ts`. Leave the reference site’s fonts and CSS out. Inter stays.

Exception: under **AI taste rebrand**, fonts may follow the direction sheet or buyer must-keep type — still via `app/fonts.ts`, never by pasting the reference site’s CSS.

### AI taste rebrand

When the user provides a brand brief and asks to rebrand the storefront look:

Install or vendor `design-taste-frontend` and `redesign-existing-projects` separately. They are not inside the buyer zip.

1. Do not alter the kit’s documented ship default. Cool sparse + Inter remain what an untouched zip shows.
2. Inventory brief + materials ([PLAYBOOK.md](PLAYBOOK.md) **Start**). Abort taste restyle if the brief is empty — leave Cool sparse.
3. Prefer `redesign-existing-projects` to keep IA. Optionally run `design-taste-frontend` `scripts/draw.mjs` (`--sector ecommerce` or `physical-product`, `--options 3`, then `--direction <id>`). Use `--keep palette,type` when the brand fixes those.
4. Map to `data/site.config.ts`, catalogue/`public/products/`, `data/recipe.ts`, `app/recipes/*`, `app/fonts.ts`, `lib/theme.ts`. Rebuild. No theme switcher. No checkout/admin rewrite.
5. Preserve sticky buy, variant buttons, trust hide-when-empty, bag Esc. Home stays the product grid.
6. Run `lint.mjs` + `inspect.mjs` (or screenshot QA). Report direction, files touched, and refusals.

Stop rule still applies: leave `app/admin`, `components/ui`, and inventory libraries alone unless the user explicitly asks.

### Draft framing and page map

From the intake answers, set `name`, `tagline`, `description`, `supportEmail`, and `currency` in `data/site.config.ts`. Write factual product names and descriptions. Leave `shippingNote`, `returnsNote`, and `faqs` empty until the policies are real. Empty trust notes stay hidden.

| Page | Route | What ships |
| --- | --- | --- |
| Home | `/` | Product grid. The heading is Products. Demo catalogue until it is replaced. |
| Shop (listing) | `/shop` | The same grid, plus a line that stock is live. |
| Product | `/products/[id]` | Demo ids: `cedar-spoon`, `linen-napkin`, `stone-bowl`. |
| Bag | Drawer from the header Bag control | No bag URL. An empty bag is a plain line and **Start shopping**. |
| Checkout | Stripe-hosted, PayPal Buttons optional | No checkout page in the kit. Return routes are `/success` and `/cancel`. PayPal shows in the bag only when its env is set. |
| FAQ | `/faq` | `faqs` ships `[]`. The page shows one `TODO: Replace me` row until a question and an answer are set. |
| Legal shells | `/shipping`, `/returns`, `/privacy`, `/terms` | Copy says `Policy not set yet` and `TODO: Replace me`. |
| Trust lines | Under Add to bag | `shippingNote` and `returnsNote` ship `""` and stay hidden. |

Demo brand until those fields change: name `Demo Shop`, the cedar-spoon tagline, `support@example.com`, currency `usd`. The legal file list is [PLAYBOOK.md](PLAYBOOK.md) **Legal pages and footer**.

### Stripe and domain

Short sequence. The kit leaves `branding_settings`, `statement_descriptor`, and `statement_descriptor_suffix` unset. Checkout shows the Stripe account **Business name**. The storefront title is `name` in `data/site.config.ts`.

1. Use the Stripe account that will own `STRIPE_SECRET_KEY`.
2. Set **Business name**, **Statement descriptor**, and **Shortened descriptor** in the Dashboard. Click path: [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md) **Checkout business name** and [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md) **Checkout business name**.
3. Production env, first production build, webhook, then custom domain: [README.md](README.md) **Start path** and [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md).
4. Confirm before go-live: [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md) **Deploy basics**.

### What to prepare

**Images.** PNG, JPEG, or WebP. Put files in `public/products/` and reference them as `/products/your-file.png`, or use an https URL with no query and no hash. Import accepts a file under `public/` or an https URL. It does not check width, height, or file type. `http://` URLs are rejected. Cards use a 4:5 frame (`aspect-[4/5]` in `components/shop/product-card.tsx`). Replace the 32×32 demo swatches.

**CSV.** Edit `products-template.csv` at the repo root. Excel or Google Sheets is fine; save as CSV before import. Header row:

`handle,name,description,price,sku,stock,image_1,image_2,option1_name,option1_value,option2_name,option2_value,option3_name,option3_value`

`handle` is lowercase letters, digits, and single hyphens, for example `cedar-spoon`. `price` is major units with at most two decimal places and no currency symbol, for example `18.00`. Import stores integer cents. `stock` is a non-negative integer. Commands: [README.md](README.md) **Import a catalogue**.

**Env.** Names are in `.env.example`. The local file is `.env.local` (gitignored). Production values go on the Vercel project.

- `ADMIN_SECRET` — at least 32 random characters. The example placeholder is rejected.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — `pk_test_...` or `pk_live_...`.
- `STRIPE_SECRET_KEY` — `sk_test_...` or `sk_live_...`, same mode as the publishable key.
- `STRIPE_WEBHOOK_SECRET` — `whsec_...`.
- PayPal, optional. Placeholders hide it. `PAYPAL_MODE` is `sandbox` or `live`. `NEXT_PUBLIC_PAYPAL_CLIENT_ID` matches that mode's client id. Secrets and webhook ids are `PAYPAL_SANDBOX_*` or `PAYPAL_LIVE_*` and are never `NEXT_PUBLIC_`.
- `DATABASE_URL` — `postgresql://USER:PASSWORD@HOST:5432/DATABASE` in production. Local `npm run dev` may keep the example placeholder.
- `NEXT_PUBLIC_APP_URL` — origin, no trailing slash. Local: `http://localhost:3000`. Production: `https://` plus the domain.

Where to paste production values: [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md).

**Currency.** `currency` in `data/site.config.ts` is the lowercase ISO code you charge. The demo is `usd`. Product pages, cards, the bag, and Stripe Checkout read that field. Display formatting stays `en-US` (`lib/format.ts`). There is no locale field.
