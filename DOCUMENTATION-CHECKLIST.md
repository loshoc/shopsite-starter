# Documentation checklist

Use this before a release. Local install is README **Cold start**. The ship route is README **Start path**. This list checks that the docs still match those two.

## Cold install

- [ ] Local install matches README **Cold start**: `cp .env.example .env.local`, edit `.env.local`, `npm install`, `npm run dev`.
- [ ] Shop: `http://localhost:3000`. Admin: `http://localhost:3000/admin/login`.
- [ ] Open localhost by that name. Admin login may reject `127.0.0.1`.
- [ ] Buyers who deploy follow README **Start path**: unzip, private GitHub, Vercel **Import Git**, then [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md). The docs do not send that buyer to a Vercel zip upload.

## Env: required vs optional

Production needs all of these. Names match `.env.example`.

| Variable | Production | Local first run |
| --- | --- | --- |
| `ADMIN_SECRET` | Required. At least 32 random characters. The example placeholder is rejected. | Same. Generate with `openssl rand -base64 32`. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Required live publishable key. | Test publishable key. |
| `STRIPE_SECRET_KEY` | Required live secret key. Server-only. | Test secret key. |
| `STRIPE_WEBHOOK_SECRET` | Required. From the Dashboard webhook endpoint. | From `stripe listen`, as in the README. |
| `PAYPAL_MODE`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_SANDBOX_*` or `PAYPAL_LIVE_*` | Optional. Set only to offer PayPal beside Stripe. Secret and webhook id are server-only. Sandbox and live are different apps. | Optional. Leave the placeholders to hide PayPal. |
| `DATABASE_URL` | Required real Postgres URL. A missing or placeholder URL refuses boot, admin sessions, and checkout. | Optional. Leave the example placeholder for the in-memory store. |
| `NEXT_PUBLIC_APP_URL` | Required real https origin, no trailing slash. Set it before the Vercel production build. The build fails if it is missing or a local-only host such as localhost. | `http://localhost:3000`. |

Vercel preview builds can omit `NEXT_PUBLIC_APP_URL` and use `https://$VERCEL_URL`.

## No secrets in examples

- [ ] Docs and `.env.example` use placeholders only.
- [ ] No live Stripe keys, webhook secrets, or database passwords in markdown or committed env files.
- [ ] `.env.local` is gitignored and not in the diff.

## Legal pages and footer

Brand and catalogue edits do not clear these. The starter text is a shell.

- [ ] Before go-live, replace `/shipping`, `/returns`, `/faq`, `/privacy`, and `/terms`.
- [ ] `/shipping`, `/returns`, `/privacy`, and `/terms` no longer say `Policy not set yet` or `TODO: Replace me`.
- [ ] `/faq` no longer says `TODO: Replace me`.
- [ ] The kicker in `components/shop/text-page.tsx` no longer says `Replace this line with your page label.` The line in `components/shop/footer.tsx` no longer says `Replace this line with your store footer.`
- [ ] `supportEmail` in `data/site.config.ts` is a real inbox, not `support@example.com`.
- [ ] PLAYBOOK **Legal pages and footer** lists the same files.

## QA walkthrough

The install path is identical to the README. [PLAYBOOK.md](PLAYBOOK.md) starts after that.

- [ ] Brand fields in `data/site.config.ts` match the playbook, including checkout expiry clamped to 31–1440 minutes (default 60).
- [ ] `data/recipe.ts` ships `default`, `comfortable`, and `bare`. `ink` and `sand` are optional color files. There is no theme switcher. Open Graph colors follow the active recipe.
- [ ] `products-template.csv` imports with `npm run import:products -- products-template.csv`.
- [ ] After a custom catalogue, [PACKAGING.md](PACKAGING.md) **Scrub before you zip** says to replace or delete demo `public/products/*` and refresh `products-template.csv` before zip or deploy. The unmodified starter still includes those housewares files for cold start.
- [ ] `--seed-stock` leaves an existing SKU’s quantity alone. `--force` overwrites it.
- [ ] A bad CSV row names that row and does not write the catalogue.
- [ ] `npm run import:shopify` behaves as the same command.
- [ ] With Postgres, **Admin → Stock** seed runs before a product is orderable.
- [ ] Sold-out checkout fails closed. A partial refund does not restock. Oversold means refund or restock by hand.
- [ ] After deploy, `https://YOUR_DOMAIN/sitemap.xml` is the Search Console URL, and `/robots.txt` disallows `/admin`, `/api`, `/success`, and `/cancel`.
- [ ] Deploy steps for Vercel and Stripe live in [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md). README **Start path** is the short route (private GitHub, Vercel **Import Git**). PLAYBOOK **Deploy** points there.
- [ ] [SKILL.md](SKILL.md) **Start** and PLAYBOOK **Start** match: intake, materials, look presets (`data/recipe.ts` `id` / `density` / `chrome`), the page map, Stripe and domain pointers, and file formats. The SKILL stop rule still leaves admin and ops alone and does not add Resend or Clerk.
- [ ] [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md) is the buyer pass before go-live: environment, Stripe key mode, Checkout **Business name**, currency, sold-out checkout, deploy smoke, and trust copy. The README, PLAYBOOK **Start**, and PLAYBOOK **Deploy** link it.
- [ ] DEPLOY-CHECKLIST **Checkout business name** names **Settings → Business → Business details**, the **Business name** field, and **Public details** **Statement descriptor** / **Shortened descriptor**.
