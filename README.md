# ShopSite starter

Next.js storefront, Stripe Checkout, and a separate admin for stock and thin orders.

## Cold start

```bash
cp .env.example .env.local
```

Edit `.env.local`:

- `ADMIN_SECRET` — at least 32 random characters. The placeholder in `.env.example` is rejected. `openssl rand -base64 32`
- Stripe test keys and `STRIPE_WEBHOOK_SECRET` from the Dashboard or `stripe listen`
- `DATABASE_URL` — leave the example placeholder for an in-memory first run with `npm run dev`, or set a real Postgres URL. Production refuses to boot, and refuses admin sessions and checkout, until this is a real URL
- `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` locally, no trailing slash

```bash
npm install
npm run dev
```

Shop: http://localhost:3000  
Admin: http://localhost:3000/admin/login

The admin cookie is `HttpOnly`, `SameSite=Strict`, and `Secure` in production (`npm start` needs HTTPS). `npm run dev` allows the cookie on http://localhost.

Forward webhooks while developing:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

With Postgres, open Admin → Stock and seed the catalogue before expecting items to be orderable. A missing stock row is quantity 0. `npm run dev` can use the in-memory fallback, which seeds demo quantities and still blocks checkout at zero. Production does not use that fallback.

Buyers set real production Stripe keys and `STRIPE_WEBHOOK_SECRET` before going live. Do not commit `.env.local`.

## Inventory

Sold-out checkout is fail-closed. Partial refunds do not restock automatically. See `INVENTORY.md`.

## Not in this kit

Marketing email, newsletters, audiences, campaigns, and Resend are a separate add-on.

Admin auth is a shared secret and an httpOnly cookie. Clerk or Auth.js is an upgrade path, not included.

## Scripts

- `npm run dev`
- `npm run build`
- `npm test`
- `npm run lint`
