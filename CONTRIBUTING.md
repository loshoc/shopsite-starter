# Contributing

ShopSite is an MIT open-source Next.js storefront with Stripe Checkout and optional PayPal. The license text is [LICENSE](LICENSE). Copyright (c) 2026 Kiwi Guo.

Use a fork for changes. Local setup matches [README.md](README.md) **Cold start**. Brand, catalogue, and a store you deploy stay in [PLAYBOOK.md](PLAYBOOK.md).

## Get the code

Fork [loshoc/shopsite-starter](https://github.com/loshoc/shopsite-starter), then clone your fork:

```bash
git clone https://github.com/YOUR_USER/shopsite-starter.git
cd shopsite-starter
```

A clone of the upstream repository is enough to run the app. Push a pull request from your fork.

Node.js 22.13 or newer (`node -v`). `.nvmrc` pins it. Node 20 warns at `npm ci` and fails at `npm test`.

## Run locally

Follow [README.md](README.md) **Cold start**:

```bash
cp .env.example .env.local
npm install
npm run dev
```

Edit `.env.local` before you rely on admin or checkout. The placeholder `ADMIN_SECRET` is rejected. Generate one with `openssl rand -base64 32`. Leave `DATABASE_URL` as the example placeholder for the in-memory first run.

Shop: http://localhost:3000  
Admin: http://localhost:3000/admin/login

Open localhost by that name. Admin login may reject `127.0.0.1`.

Webhook forwarding while you develop is in README **Cold start** (`stripe listen`).

Commands already in this repo are listed under README **Scripts**: `npm run dev`, `npm run build`, `npm test`, `npm run test:demo`, `npm run test:all`, and `npm run lint`.

## Secrets

Never commit `.env`, `.env.local`, or any file with real values. `.gitignore` already excludes them. `.env.example` is the only environment file that belongs in git, and it keeps placeholders only.

Do not paste secrets, live keys, `.env` contents, webhook ids, or customer data into Issues or pull requests.

Do not put a secret in a `NEXT_PUBLIC_` name. `GEO_*` stays server-only. Do not prefix those names with `NEXT_PUBLIC_`.

## Pull requests

Keep a pull request small and focused.

Before you open it, run:

```bash
npm test
npm run test:demo
npm run lint
npm run build
```

`npm test` is kit-integrity. `npm run test:demo` locks the shipped housewares catalogue and Cool sparse recipe. `npm run test:design` is the same command. `npm run test:all` runs both. `npm run lint` is eslint.

`npm run build` is the production build. It fails when `NEXT_PUBLIC_APP_URL` is missing or a local-only host (`localhost`, `127.0.0.1`, and similar). The local check in [PACKAGING.md](PACKAGING.md) **Verify the production build** is:

```bash
NEXT_PUBLIC_APP_URL=https://shop.example.com npm run build
```

Use placeholders for every other variable. Names match `.env.example`.

## Conduct

Keep Issues and pull requests constructive.

## Security

Report a vulnerability through [SECURITY.md](SECURITY.md). Prefer a [GitHub Security Advisory](https://github.com/loshoc/shopsite-starter/security/advisories/new). Do not open a public issue for a vulnerability.

Feature requests and ordinary bugs are GitHub Issues. Vulnerabilities go only through a private GitHub Security Advisory, as `SECURITY.md` says. There is no security email.
