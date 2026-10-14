# Documentation checklist

Use this before a release. The cold-start path is the README. This list checks that the docs still match it.

## Cold install

- [ ] Follow README **Cold start** only: `cp .env.example .env.local`, edit `.env.local`, `npm install`, `npm run dev`.
- [ ] Shop: `http://localhost:3000`. Admin: `http://localhost:3000/admin/login`.
- [ ] Open localhost by that name. Admin login may reject `127.0.0.1`.

## Env: required vs optional

Production needs all of these. Names match `.env.example`.

| Variable | Production | Local first run |
| --- | --- | --- |
| `ADMIN_SECRET` | Required. At least 32 random characters. The example placeholder is rejected. | Same. Generate with `openssl rand -base64 32`. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Required live publishable key. | Test publishable key. |
| `STRIPE_SECRET_KEY` | Required live secret key. Server-only. | Test secret key. |
| `STRIPE_WEBHOOK_SECRET` | Required. From the Dashboard webhook endpoint. | From `stripe listen`, as in the README. |
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
- [ ] The kicker in `components/shop/text-page.tsx` and the line in `components/shop/footer.tsx` no longer say `TODO: Replace me`.
- [ ] `supportEmail` in `data/site.config.ts` is a real inbox, not `support@example.com`.
- [ ] PLAYBOOK **Legal pages and footer** lists the same files.

## QA walkthrough

The install path is identical to the README. [PLAYBOOK.md](PLAYBOOK.md) starts after that.

- [ ] Brand fields in `data/site.config.ts` match the playbook, including checkout expiry clamped to 31–1440 minutes (default 60).
- [ ] `products-template.csv` imports with `npm run import:products -- products-template.csv`.
- [ ] After a custom catalogue, [PACKAGING.md](PACKAGING.md) **Scrub before you zip** says to replace or delete demo `public/products/*` and refresh `products-template.csv` before zip or deploy. The unmodified starter still includes those housewares files for cold start.
- [ ] `--seed-stock` leaves an existing SKU’s quantity alone. `--force` overwrites it.
- [ ] A bad CSV row names that row and does not write the catalogue.
- [ ] `npm run import:shopify` behaves as the same command.
- [ ] With Postgres, **Admin → Stock** seed runs before a product is orderable.
- [ ] Sold-out checkout fails closed. A partial refund does not restock. Oversold means refund or restock by hand.
- [ ] After deploy, `https://YOUR_DOMAIN/sitemap.xml` is the Search Console URL, and `/robots.txt` disallows `/admin`, `/api`, `/success`, and `/cancel`.
- [ ] Deploy steps for Vercel and Stripe live in [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md) and PLAYBOOK **Deploy**.
