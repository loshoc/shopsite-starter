# Launch checklist

Buyer pass before go-live. Walk this list on the store you are about to publish. It checks the environment, Stripe key mode, the Checkout business name, currency, sold-out checkout, deploy smoke, and the trust shells.

Local `npm` stays in [README.md](README.md) **Cold start**. The ship route is [README.md](README.md) **Start path**. Brand and catalogue: [PLAYBOOK.md](PLAYBOOK.md) **Start** (the same pass is in [SKILL.md](SKILL.md) **Start**). Vercel and Stripe setup steps stay in [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md). Stock rules stay in [INVENTORY.md](INVENTORY.md).

Names match [.env.example](.env.example). Never paste live secrets into the repo, this file, or a public demo.

## 1. Environment

- [ ] `.env.local` is the local copy. It is gitignored. Production values live on the Vercel project.
- [ ] `ADMIN_SECRET` is at least 32 random characters (`openssl rand -base64 32`). The placeholder in `.env.example` is rejected, and admin stays closed until it is replaced.
- [ ] `DATABASE_URL` in production is a real Postgres URL (`postgresql://USER:PASSWORD@HOST:5432/DATABASE`). A missing URL or the example placeholder refuses boot, admin sessions, and checkout. Local `npm run dev` may leave the placeholder and use the in-memory store.
- [ ] `NEXT_PUBLIC_APP_URL` is the public https origin, with no trailing slash. The production build fails when it is missing or a local-only host (`localhost`, `127.0.0.1`, and similar). Vercel preview builds may omit it and use `https://$VERCEL_URL`.

## 2. Stripe key mode

Use one mode per environment. The publishable key and the secret key are a pair.

| Environment | Publishable | Secret | Webhook secret |
| --- | --- | --- | --- |
| Localhost and any public demo | `pk_test_...` | `sk_test_...` | `whsec_...` from `stripe listen` or a test-mode endpoint |
| Production store | `pk_live_...` | `sk_live_...` | `whsec_...` from the live-mode endpoint |

- [ ] Localhost uses test keys. Checkout refuses `sk_live_` or `pk_live_` when the app URL or the request host is local-only. The bag shows: `Stripe live keys cannot be used on a local address. Use test keys for localhost.`
- [ ] A public demo stays on test keys. Live keys stay on the production project.
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY` are the same mode (`pk_test_` with `sk_test_`, `pk_live_` with `sk_live_`).
- [ ] `STRIPE_WEBHOOK_SECRET` starts with `whsec_` and belongs to that same mode. A placeholder, or a secret from the other mode, does not match.
- [ ] The endpoint listens for `checkout.session.completed` and `checkout.session.async_payment_succeeded`. The URL is `https://YOUR_DOMAIN/api/webhooks/stripe`.
- [ ] Missing or placeholder Stripe keys return `Stripe is not configured.` Checkout does not open.

## PayPal (optional)

Skip this section to stay Stripe-only. Placeholders in `.env.example` hide PayPal Buttons. Stripe Checkout still runs.

- [ ] `PAYPAL_MODE` is `sandbox` on localhost and on any public demo. `live` is only the production store. Live PayPal on a local address is refused.
- [ ] `NEXT_PUBLIC_PAYPAL_CLIENT_ID` equals `PAYPAL_SANDBOX_CLIENT_ID` or `PAYPAL_LIVE_CLIENT_ID` for that mode. It is the client id for PayPal Buttons, not a secret.
- [ ] The secret and the webhook id for that mode are server-only. No `NEXT_PUBLIC_` name holds `PAYPAL_SANDBOX_CLIENT_SECRET`, `PAYPAL_LIVE_CLIENT_SECRET`, or a webhook id.
- [ ] Sandbox and live client ids and secrets are different apps. The server never sends the sandbox client id with the live secret.
- [ ] The webhook URL is `https://YOUR_DOMAIN/api/webhooks/paypal` for `PAYMENT.CAPTURE.COMPLETED` and `PAYMENT.CAPTURE.REFUNDED`. Stock and the order row change only after that signature verifies. Capturing from the bag does not write stock by itself.
- [ ] Go-live prove (sandbox): stock moves only after a signed PayPal webhook (`PAYMENT.CAPTURE.COMPLETED`), not on capture alone. Path: sandbox → signed webhook → stock.
- [ ] Go-live prove (sandbox): a full refund restocks only after a signed PayPal webhook (`PAYMENT.CAPTURE.REFUNDED`). Path: full refund → signed webhook → stock up. A partial refund does not restock. See **5. Inventory and sold-out**.

Setup steps: [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md) **PayPal sandbox and live**.

## 3. Checkout business name

The name on the Stripe-hosted Checkout page is the Stripe account's **Business name**. `name` in `data/site.config.ts` is the storefront title (header and page titles). The kit leaves `branding_settings.display_name` unset, so Checkout keeps the Dashboard value. Changing the storefront title leaves the Checkout page on the account **Business name**.

Use the Stripe account that owns `STRIPE_SECRET_KEY`. Test keys and live keys on that account share its **Business name**. Another Stripe account has its own.

1. Open [Business details](https://dashboard.stripe.com/settings/business-details): **Settings → Business → Business details**.
2. Set **Business name** to the store name customers should see on Checkout. [Stripe's Checkout appearance docs](https://docs.stripe.com/payments/checkout/customization/appearance) call this field the way to change a Checkout page's name.
3. Under **Public details**, click **Edit**. Set **Statement descriptor** to a recognizable form of that name. Stripe requires 5–22 Latin characters, at least one letter, and none of `<`, `>`, `\`, `'`, `"`, or `*`. Set **Shortened descriptor** when you want a shorter card-statement prefix (2–10 characters). Click **Save**. The statement descriptor is the text on the customer's card or bank statement. It is a separate field from the Checkout page name. The kit leaves `statement_descriptor` and `statement_descriptor_suffix` unset, so the statement uses these account values. Details: [Statement descriptors](https://docs.stripe.com/get-started/account/statement-descriptors).
4. Logo, icon, and colors are **Settings → Business → Branding** ([Branding settings](https://dashboard.stripe.com/settings/branding)). The kit does not upload them.

`appInfo.name` on the Stripe client (`shopsite-starter`) identifies the integration to Stripe. Customers do not see it on Checkout.

- [ ] A test Checkout page shows this store's **Business name**.
- [ ] If this Stripe account was used for a different store, **Business name** and **Statement descriptor** are updated before go-live.
- [ ] `name` in `data/site.config.ts` is the store name on the shop. Checkout still reads the Dashboard **Business name**.

The same steps are in [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md) under **Checkout business name**.

## 4. Currency

- [ ] `currency` in `data/site.config.ts` is the ISO code you charge, lowercase. The demo is `usd`.
- [ ] Catalogue prices are integer cents of that currency. Product pages, cards, the bag, and Stripe Checkout `price_data.currency` read `siteConfig.currency`.
- [ ] A test Checkout session shows that currency. Money formatting stays `en-US`.

## 5. Inventory and sold-out

Details: [INVENTORY.md](INVENTORY.md).

- [ ] With Postgres, **Admin → Stock** is seeded before you treat a product as orderable. Seed inserts missing SKUs only. A missing stock row is quantity 0.
- [ ] Local `npm run dev` with the placeholder `DATABASE_URL` uses the in-memory store. That store seeds demo quantities and still blocks checkout at zero. It resets when the process restarts. Production does not use it.
- [ ] A sold-out selected SKU shows **Sold out** and does not add to the bag.
- [ ] Checkout of a line that wants more than is on hand returns `Not enough stock to start checkout.` and does not create a Stripe session.
- [ ] A partial refund does not restock. An **Oversold** badge means refund the order or restock by hand in admin.

## 6. Deploy basics

The route is [README.md](README.md) **Start path**: a **private** GitHub repo and Vercel **Import Git**. Prefer that over uploading a zip to Vercel. Setup steps stay in [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md). This list checks the result.

- [ ] The Vercel project is an **Import Git** of that private repo.
- [ ] Production environment variables are saved on Vercel before the first production build. Vercel bakes `NEXT_PUBLIC_*` in at build time.
- [ ] The custom domain is attached. `NEXT_PUBLIC_APP_URL` is that https origin, with no trailing slash.
- [ ] Home opens on the public hostname: `https://shop.example.com/`.
- [ ] A product page opens. The demo catalogue includes `https://shop.example.com/products/cedar-spoon`.
- [ ] Admin login opens on that same host: `https://shop.example.com/admin/login`. Admin login may reject `127.0.0.1`.
- [ ] The webhook endpoint matches the key mode on that project.

Replace `shop.example.com` with `NEXT_PUBLIC_APP_URL`.

## 7. Trust copy

Do this before go-live. The starter copy is a shell. PLAYBOOK **Legal pages and footer** lists the same files.

- [ ] `name` in `data/site.config.ts` is your store name. The demo is `Demo Shop`.
- [ ] `supportEmail` is a real inbox. The demo is `support@example.com`.
- [ ] `/shipping`, `/returns`, `/privacy`, and `/terms` no longer say `Policy not set yet` or `TODO: Replace me`.
- [ ] `/faq` no longer says `TODO: Replace me`.
- [ ] The kicker in `components/shop/text-page.tsx` no longer says `Replace this line with your page label.` The line in `components/shop/footer.tsx` no longer says `Replace this line with your store footer.`
- [ ] Grey **Replace me** image placeholders are real photos.
- [ ] After a custom catalogue, demo files under `public/products/` and the housewares rows in `products-template.csv` are scrubbed. See [PACKAGING.md](PACKAGING.md) **Scrub before you zip**.

Placeholder policy templates are in [docs/legal/](docs/legal/README.md). Leave the bracket placeholders as written until you set your own values. Do not state shipping or return timing this kit does not enforce.
