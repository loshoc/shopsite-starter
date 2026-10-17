# Deploy checklist

Vercel and Stripe steps for a buyer deploy. Tech Writer can fold this into the docs. Cold start stays in [README.md](README.md). After the app runs locally, follow [PLAYBOOK.md](PLAYBOOK.md). Before go-live, confirm the result with [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md).

Names below match [.env.example](.env.example). Values are placeholders. Never paste live secrets into the repo, this file, or a public demo.

## 1. Create the Vercel project

Create a Vercel project from this repository. Leave the production build until the environment in the next section is saved. Vercel bakes `NEXT_PUBLIC_*` values in at build time.

## 2. Set environment before the production build

Set these on the Vercel project for **Production** before the first production build. Use the same names locally in `.env.local` (copy from `.env.example`).

| Variable | What to set |
| --- | --- |
| `ADMIN_SECRET` | At least 32 random characters. Example: `openssl rand -base64 32`. Server-only. The placeholder in `.env.example` is rejected. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key. `pk_test_...` for a private test deploy or a public demo. `pk_live_...` only on the buyer's own production store. |
| `STRIPE_SECRET_KEY` | Secret key paired with the publishable key (`sk_test_...` or `sk_live_...`). Server-only. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the webhook endpoint (`whsec_...`). Server-only. Dashboard endpoint in production; `stripe listen` locally. |
| `DATABASE_URL` | A real Postgres URL in production (`postgresql://USER:PASSWORD@HOST:5432/DATABASE`). A missing URL or the example placeholder refuses boot. |
| `NEXT_PUBLIC_APP_URL` | Public https origin, no trailing slash: `https://shop.example.com`. The production build fails when this is missing or a local-only host (`localhost`, `127.0.0.1`, and similar). |

Vercel **Preview** builds may omit `NEXT_PUBLIC_APP_URL`. They fall back to `https://$VERCEL_URL`. Production does not.

A shared or public demo stays on Stripe test keys (`pk_test_...`, `sk_test_...`). Live keys stay on the buyer's production project.

## 3. Stripe webhook

In the Stripe Dashboard (test mode or live mode, matching the keys above), add an endpoint:

`https://shop.example.com/api/webhooks/stripe`

Replace the host with `NEXT_PUBLIC_APP_URL`. Send at least:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`

Copy that endpoint's signing secret into `STRIPE_WEBHOOK_SECRET`, then run the production build.

Local forwarding (printed `whsec_...` goes in `.env.local` only):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## 4. Checkout business name

The name on the Stripe-hosted Checkout page is this Stripe account's **Business name**. `name` in `data/site.config.ts` is the storefront title (header and page titles). The kit leaves `branding_settings.display_name` unset, so Checkout keeps the Dashboard value.

Use the Stripe account that owns `STRIPE_SECRET_KEY`. Test keys and live keys on that account share its **Business name**. Another Stripe account has its own. If this account was used for a different store, Checkout still shows that account's **Business name** until you change it.

1. Open [Business details](https://dashboard.stripe.com/settings/business-details): **Settings → Business → Business details**.
2. Set **Business name** to the store name customers should see on Checkout. [Stripe's Checkout appearance docs](https://docs.stripe.com/payments/checkout/customization/appearance) call this field the way to change a Checkout page's name.
3. Under **Public details**, click **Edit**. Set **Statement descriptor** to a recognizable form of that name. Stripe requires 5–22 Latin characters, at least one letter, and none of `<`, `>`, `\`, `'`, `"`, or `*`. Set **Shortened descriptor** when you want a shorter card-statement prefix (2–10 characters). Click **Save**. The statement descriptor is the text on the customer's card or bank statement. It is a separate field from the Checkout page name. The kit leaves `statement_descriptor` and `statement_descriptor_suffix` unset, so the statement uses these account values. Details: [Statement descriptors](https://docs.stripe.com/get-started/account/statement-descriptors).
4. Logo, icon, and colors are **Settings → Business → Branding** ([Branding settings](https://dashboard.stripe.com/settings/branding)). The kit does not upload them.

`appInfo.name` on the Stripe client (`shopsite-starter`) identifies the integration to Stripe. Customers do not see it on Checkout.

Run a test Checkout and confirm the page shows this store's **Business name** before you go live.

## 5. Smoke the real domain

After the production deployment:

- Home: `https://shop.example.com/`
- A product page. The demo catalogue includes `https://shop.example.com/products/cedar-spoon`
- Admin login on that same host: `https://shop.example.com/admin/login` (sign in with the production `ADMIN_SECRET`)

Open the site by the public hostname. Admin login may reject `127.0.0.1`. With Postgres, seed stock in **Admin → Stock** before expecting a product to be orderable.
