# Deploy checklist

Vercel, Stripe, and optional PayPal steps for a buyer deploy. This file is the detail. The short route is [README.md](README.md) **Start path**: unzip, a **private** GitHub repo, then Vercel **Import Git**. Prefer that over uploading a zip to Vercel. Stripe Checkout works without PayPal.

Local `npm` stays in [README.md](README.md) **Cold start**. Brand and catalogue: [PLAYBOOK.md](PLAYBOOK.md) **Start**. The same Start for an AI edit: [SKILL.md](SKILL.md) **Start**. Before go-live, confirm the result with [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md).

Names below match [.env.example](.env.example). Values are placeholders. Never paste live secrets into the repo, this file, or a public demo.

## 1. Import the private Git repo

Follow [README.md](README.md) **Start path** through the unzip, the private GitHub push, and Vercel **Import Git**. Do not upload the zip to Vercel.

On Vercel, open **Add New… → Project** and **Import** that private GitHub repo. If Vercel asks, connect GitHub and grant access to that repo. Leave the production build until the environment in the next section is saved. Vercel bakes `NEXT_PUBLIC_*` values in at build time.

## 2. Set environment before the production build

Set these on the Vercel project for **Production** before the first production build. Use the same names locally in `.env.local` (copy from `.env.example`).

| Variable | What to set |
| --- | --- |
| `ADMIN_SECRET` | At least 32 random characters. Example: `openssl rand -base64 32`. Server-only. The placeholder in `.env.example` is rejected. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key. `pk_test_...` for a private test deploy or a public demo. `pk_live_...` only on the buyer's own production store. |
| `STRIPE_SECRET_KEY` | Secret key paired with the publishable key (`sk_test_...` or `sk_live_...`). Server-only. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the webhook endpoint (`whsec_...`). Server-only. Dashboard endpoint in production; `stripe listen` locally. |
| `PAYPAL_MODE` | Optional. `sandbox` or `live`. Leave the placeholder to hide PayPal. Stripe Checkout works without it. |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Optional. Client id for that mode (PayPal Buttons). The only PayPal value that may be public. Stripe Checkout works without it. |
| `PAYPAL_SANDBOX_CLIENT_ID` | Optional. Sandbox app client id. Must match the public client id when `PAYPAL_MODE=sandbox`. Server-only. Stripe Checkout works without it. |
| `PAYPAL_SANDBOX_CLIENT_SECRET` | Optional. Sandbox app secret. Server-only. Stripe Checkout works without it. |
| `PAYPAL_SANDBOX_WEBHOOK_ID` | Optional. Sandbox webhook id for `/api/webhooks/paypal`. Server-only. Stripe Checkout works without it. |
| `PAYPAL_LIVE_CLIENT_ID` | Optional. Live app client id. Must match the public client id when `PAYPAL_MODE=live`. Server-only. Live is refused on localhost. Stripe Checkout works without it. |
| `PAYPAL_LIVE_CLIENT_SECRET` | Optional. Live app secret. Server-only. Stripe Checkout works without it. |
| `PAYPAL_LIVE_WEBHOOK_ID` | Optional. Live webhook id. Server-only. Stripe Checkout works without it. |
| `DATABASE_URL` | A real Postgres URL in production (`postgresql://USER:PASSWORD@HOST:5432/DATABASE`). A missing URL or the example placeholder refuses boot. |
| `NEXT_PUBLIC_APP_URL` | Public https origin, no trailing slash: `https://shop.example.com`. The production build fails when this is missing or a local-only host (`localhost`, `127.0.0.1`, and similar). |
| `GEO_ALLOW_AI_CRAWLERS` | Optional. `1` (default) allows GPTBot, Google-Extended, PerplexityBot, ClaudeBot, and Bingbot on public pages. `0` disallows those crawlers. `/admin`, `/api`, `/success`, and `/cancel` stay disallowed either way. Rebuild after a change. |

Vercel **Preview** builds may omit `NEXT_PUBLIC_APP_URL`. They fall back to `https://$VERCEL_URL`. Production does not.

A shared or public demo stays on Stripe test keys (`pk_test_...`, `sk_test_...`). Live keys stay on the buyer's production project.

### First production build

Save the Production environment, then run the production deployment. `NEXT_PUBLIC_APP_URL` must already be the https origin you will serve.

Set `STRIPE_WEBHOOK_SECRET` before this build when you already have `whsec_...`. When the endpoint does not exist yet, run this build, then finish **Stripe webhook** and redeploy.

## 3. Stripe webhook

In the Stripe Dashboard (test mode or live mode, matching the keys above), add an endpoint:

`https://shop.example.com/api/webhooks/stripe`

Replace the host with `NEXT_PUBLIC_APP_URL`. Send at least:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`

Copy that endpoint's signing secret into `STRIPE_WEBHOOK_SECRET` on the Vercel project, then redeploy so production picks it up. The first production build can already have finished. This secret is server-only.

Local forwarding (printed `whsec_...` goes in `.env.local` only):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## PayPal sandbox and live

PayPal is off until the values below replace the placeholders. Stripe Checkout does not change when they are missing. There is no shared `PAYPAL_CLIENT_SECRET`: sandbox and live are different apps, and the server reads only the trio for `PAYPAL_MODE`.

`NEXT_PUBLIC_PAYPAL_CLIENT_ID` is the only PayPal value the browser may see (PayPal Buttons). `PAYPAL_SANDBOX_CLIENT_SECRET`, `PAYPAL_LIVE_CLIENT_SECRET`, and both webhook ids are server-only. Do not create a `NEXT_PUBLIC_` name for them. Vercel bakes `NEXT_PUBLIC_*` at build time, so change the client id and rebuild when you switch modes.

### Sandbox

1. In the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/sandbox), open **Apps & Credentials** and stay on **Sandbox**.
2. Open your app (or create one). Copy the **Client ID** into both `NEXT_PUBLIC_PAYPAL_CLIENT_ID` and `PAYPAL_SANDBOX_CLIENT_ID`. Copy the **Secret** into `PAYPAL_SANDBOX_CLIENT_SECRET`.
3. Set `PAYPAL_MODE=sandbox`.
4. Under the app, add a webhook. URL: `https://YOUR_DOMAIN/api/webhooks/paypal`. Events: `PAYMENT.CAPTURE.COMPLETED` and `PAYMENT.CAPTURE.REFUNDED`. Copy the webhook id into `PAYPAL_SANDBOX_WEBHOOK_ID`.
5. Redeploy so the public client id is baked in. Local `npm run dev` reads `.env.local` on restart.
6. PayPal cannot deliver webhooks to `localhost`. Use the Dashboard webhook simulator, or a tunnel that forwards to `http://localhost:3000/api/webhooks/paypal`.
7. In the bag, **Checkout with Stripe** and **Pay with PayPal** both show. Approving PayPal captures the order on the server. Stock moves only when the signed webhook arrives. A buyer landing on `/success` does not write the order.

Live credentials on a local address hide PayPal. The message is `PayPal live credentials cannot be used on a local address. Use sandbox for localhost.`

### Live

1. Switch the Developer Dashboard to **Live** and use the live app. Its client id and secret are not the sandbox pair.
2. Set `PAYPAL_MODE=live`. Set `NEXT_PUBLIC_PAYPAL_CLIENT_ID` and `PAYPAL_LIVE_CLIENT_ID` to the live client id. Set `PAYPAL_LIVE_CLIENT_SECRET` to the live secret.
3. Add a live webhook for the same path and the same two events. Put that webhook id in `PAYPAL_LIVE_WEBHOOK_ID`.
4. Rebuild and redeploy. Leave the sandbox values in place only when they are the sandbox app, not copies of the live secret.
5. A public demo can stay on sandbox. Live PayPal belongs on the buyer's production project, next to live Stripe keys.

The capture call (`/api/paypal/orders/capture`) talks to PayPal and does not decrement stock. `/api/webhooks/paypal` verifies the signature with PayPal before any order or stock write. A failed verification does not change inventory.

## 4. Checkout business name

The name on the Stripe-hosted Checkout page is this Stripe account's **Business name**. `name` in `data/site.config.ts` is the storefront title (header and page titles). The kit leaves `branding_settings.display_name` unset, so Checkout keeps the Dashboard value.

Use the Stripe account that owns `STRIPE_SECRET_KEY`. Test keys and live keys on that account share its **Business name**. Another Stripe account has its own. If this account was used for a different store, Checkout still shows that account's **Business name** until you change it.

1. Open [Business details](https://dashboard.stripe.com/settings/business-details): **Settings → Business → Business details**.
2. Set **Business name** to the store name customers should see on Checkout. [Stripe's Checkout appearance docs](https://docs.stripe.com/payments/checkout/customization/appearance) call this field the way to change a Checkout page's name.
3. Under **Public details**, click **Edit**. Set **Statement descriptor** to a recognizable form of that name. Stripe requires 5–22 Latin characters, at least one letter, and none of `<`, `>`, `\`, `'`, `"`, or `*`. Set **Shortened descriptor** when you want a shorter card-statement prefix (2–10 characters). Click **Save**. The statement descriptor is the text on the customer's card or bank statement. It is a separate field from the Checkout page name. The kit leaves `statement_descriptor` and `statement_descriptor_suffix` unset, so the statement uses these account values. Details: [Statement descriptors](https://docs.stripe.com/get-started/account/statement-descriptors).
4. Logo, icon, and colors are **Settings → Business → Branding** ([Branding settings](https://dashboard.stripe.com/settings/branding)). The kit does not upload them.

`appInfo.name` on the Stripe client (`shopsite-starter`) identifies the integration to Stripe. Customers do not see it on Checkout.

Run a test Checkout and confirm the page shows this store's **Business name** before you go live.

## 5. Custom domain

Attach the domain after the first production deployment.

1. In the Vercel project, open **Settings → Domains** and add the domain.
2. At the DNS host, add the records Vercel shows for that domain.
3. `NEXT_PUBLIC_APP_URL` must be `https://` that host, with no trailing slash. If the first build used a different origin, set the variable and run another production build. Vercel bakes `NEXT_PUBLIC_*` at build time.
4. The Stripe webhook URL is `https://YOUR_DOMAIN/api/webhooks/stripe` on that same origin. If the endpoint was created on a `*.vercel.app` host, add the endpoint for the custom domain and put that endpoint's `whsec_...` in `STRIPE_WEBHOOK_SECRET`.

## 6. Smoke the real domain

After the production deployment, on the custom domain when it is attached:

- Home: `https://shop.example.com/`
- A product page. The demo catalogue includes `https://shop.example.com/products/cedar-spoon`
- Admin login on that same host: `https://shop.example.com/admin/login` (sign in with the production `ADMIN_SECRET`)

Open the site by the public hostname. Admin login may reject `127.0.0.1`. With Postgres, seed stock in **Admin → Stock** before expecting a product to be orderable.

Replace `shop.example.com` with `NEXT_PUBLIC_APP_URL`.
