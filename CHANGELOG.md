# Changelog

## Unreleased

- `SECURITY.md` adds **Hardening a store you deploy** (product-image metadata, fraud review, and edge rate limits). PLAYBOOK adds **Anti-scrape and abuse hardening** as the buyer how-to. The kit stays AS IS and does not include a WAF.
- The public ShopSite core is MIT (Copyright (c) 2026 Kiwi Guo). Root `LICENSE` is the standard MIT text, and `package.json` `"license"` is `MIT`. The former paid-kit EULA is archived at `docs/legal/archive/EULA-KIT-LICENSE.md`.
- `CONTRIBUTING.md` is the contributor guide (fork or clone, local run, secrets, tests, and vulnerability reports via `SECURITY.md`). README **Start path** is clone or fork, then your GitHub repo and Vercel **Import Git**. The public install path is no longer the buyer zip.

## 1.1.2

On main after #44 (`3f742b3`).

- Cool sparse detail polish (#42 @ 65bc19c): motion, spacing, focus, button, link, chip, drawer, and image micro-hover. Cool sparse + Inter stays the ship default.
- Optional AI taste rebrand path in PLAYBOOK and SKILL (#43 @ cccdbed). Cool sparse + Inter stays the ship default; the path runs only in a buyer repo with a brand brief.
- Start/Intake taste gate (#44 @ 3f742b3): no brand + product brief keeps Cool sparse; a present brief is the only path into the taste rebrand. Atelier Clay is a prose-only worked example.
- This release bumps package/lockfile to 1.1.2 for the refreshed buyer zip. No dependency changes.

## 1.1.1

On main after #40 (`a2cbed9`).

- PayPal Buttons optional beside Stripe Checkout (#40 @ a2cbed9): placeholders hide PayPal; stock only after signed `/api/webhooks/paypal`; sandbox/live mode trios; live refused on localhost. LAUNCH-CHECKLIST go-live prove: sandbox → signed `PAYMENT.CAPTURE.COMPLETED` webhook → stock, not on capture alone.
- README Start path points at Release buyer zip (#39).
- This release bumps package/lockfile to 1.1.1 for the refreshed buyer zip. No dependency changes.

## 1.1.0

On main after #37 (`05a4c21`).

- Checkout and the Stripe client refuse `sk_live_` / `pk_live_` when the app URL or the request host is local-only (`localhost`, `127.0.0.1`, `::1`, and the same hosts production already rejects). The bag gets 503: "Stripe live keys cannot be used on a local address. Use test keys for localhost." Test keys still work. `formatMoney`, product prices, and the paid-event fallback follow `siteConfig.currency` (#34).
- `LAUNCH-CHECKLIST.md` is the buyer pass before go-live (environment, Stripe key mode, currency, sold-out checkout, deploy smoke, and trust shells). README, PLAYBOOK **Deploy**, DEPLOY-CHECKLIST, DOCUMENTATION-CHECKLIST, and the buyer-zip list point at it. Hosted Checkout shows the Stripe account Business name from Settings → Business → Business details. The kit leaves `branding_settings.display_name` and statement descriptors unset, so `data/site.config.ts` `name` stays the storefront title (#35).
- `npm test` (`npm run test:kit`) runs kit-integrity only. A rebrand of the housewares catalogue, demo site copy, or Cool sparse recipe no longer fails that command. `npm run test:demo` and `npm run test:design` lock the shipped demo. `npm run test:all` runs both (#36).
- One buyer Start path: unzip, private GitHub, then Vercel Import Git. README **Cold start** stays the local `npm` run. PLAYBOOK **Start** and `SKILL.md` **Start** share the guided pass (intake, materials, recipe presets). `SKILL.md` is required in the buyer zip (#37).
- Lockfile root version matches `package.json`. This release sets `package-lock.json` `version` and `packages[""].version` to `1.1.0`. No dependency changes.

## 1.0.0

First buyer release on main (`c517373`).

- Lockfile root version matches `package.json`. #28 synced `package-lock.json` `version` and `packages[""].version` to `0.2.0`. This release sets both files to `1.0.0`. No dependency changes.
- Shop footer and the text-page kicker no longer say `TODO: Replace me`. They tell the buyer which line to replace before go-live (#29). Legal shells, the FAQ row, and empty trust notes stay placeholders.
- Demo catalogue matches the housewares template: cedar spoon, linen napkin, and stone bowl. The tagline and the deploy smoke URL follow that catalogue (#30).
- Placeholder policy templates live in `docs/legal/`. Storefront policy shells stay empty (#31).
- The kit license is proprietary. Root `LICENSE` points at the ShopSite EULA, and `package.json` `"license"` is `SEE LICENSE IN LICENSE`. `docs/legal/SELLER-CHECKLIST.md` stays in the repo and is left out of the buyer zip.
- Playbook notes that product `hidden` drops the whole product, and that the housewares PNGs are 32×32 swatches to replace (#32). Variants have no `hidden` field. A stock status of `hidden` blocks that SKU and leaves the product listed.

## 0.2.0

Cool sparse / Inter storefront redesign on main (`5eae123`).

- Shop fonts are Inter only. Instrument Serif is gone. Colors are Cool sparse semantic tokens, and the home page leads with products. Legacy `paper`, `foam`, `ink`, `sand`, `copper`, and `moss` aliases are removed. `.admin` stays zinc and Geist.
- Build-time `data/recipe.ts` sets `data-density`, `data-chrome`, and `data-recipe` on `<html>`. Ship default is Cool sparse, comfortable, and bare. `ink` and `sand` are optional token files. There is no runtime switcher. Open Graph colors follow the active recipe.
- Product page: variant choices are buttons, there is one Add to bag button, details sit in an accordion, and the buy bar sticks on mobile. Shipping and returns lines show under the button only when `shippingNote` or `returnsNote` is set. Empty trust notes stay hidden.
- Catalogue cards are the image, name, and price, plus a variant hint when options exist. Card frame still follows `data-chrome`.
- `/faq` is an accordion. It stays on `TODO: Replace me` until `faqs` has a question and an answer.
- Missing images use a plain grey Replace me placeholder.
- Escape closes the bag and returns focus to the Bag control.

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
