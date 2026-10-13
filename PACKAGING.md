# Packaging

Release checklist for the buyer zip. Cold start stays in [README.md](README.md). Brand, import, stock, checkout, and SEO stay in [PLAYBOOK.md](PLAYBOOK.md).

`package.json` `"version"` is `0.1.0`, the same tag as [CHANGELOG.md](CHANGELOG.md). This pass does not bump it.

[LICENSE](LICENSE) is already the MIT license (Copyright 2026 ShopSite contributors). Ship that file with the zip.

## Buyer zip

Ship a clean archive of the `0.1.0` tree. Include application source and these root files:

- `app/`, `components/`, `data/`, `lib/`, `public/`, `scripts/`, `assets/`
- `instrumentation.ts`, `proxy.ts`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `components.json`
- `package.json`, `package-lock.json`
- `README.md`
- `PLAYBOOK.md`
- `DEPLOY-CHECKLIST.md` (Vercel and Stripe steps; the playbook links here)
- `LICENSE`
- `CHANGELOG.md`
- `.env.example`
- `.gitignore`
- `products-template.csv` (repo root; made-up demo rows)
- `DOCUMENTATION-CHECKLIST.md`
- `INVENTORY.md` (stock and oversold behavior the playbook points at)

`tests/` and `SKILL.md` may stay in the archive. They hold made-up fixtures and editor notes. They are not a substitute for the README or the playbook.

## Scrub before you zip

Leave these out. `.gitignore` already excludes them from git; still check the archive.

- `.env`, `.env.local`, and any `.env.*` file except `.env.example`
- Live or test secrets: Stripe keys, `STRIPE_WEBHOOK_SECRET`, `ADMIN_SECRET`, database passwords
- Private keys and credential files (`*.pem`, `*.key`, `credentials.json`, service-account JSON)
- Personal data: real customer emails, order exports, support inboxes
- `.vercel/`
- `node_modules/`
- `.next/`, `out/`, `dist/`, `build/`, `.turbo/`
- `.stripe/` (CLI login cache and listen fixtures)
- `data/dev-stock.json` (local stock from `npm run import:products -- --seed-stock` without Postgres)
- Logs, coverage, and editor or OS junk (`.idea/`, `.vscode/`, `.DS_Store`)

`.env.example` uses placeholders only. Demo catalogue copy and `products-template.csv` stay made-up.

## Verify the production build

Set a real public origin before `npm run build`. No trailing slash. The production build fails when `NEXT_PUBLIC_APP_URL` is missing or a local-only host (`localhost`, `127.0.0.1`, and similar). Preview builds on Vercel may omit it and use `https://$VERCEL_URL`.

```bash
NEXT_PUBLIC_APP_URL=https://shop.example.com npm run build
```

Replace `https://shop.example.com` with the origin for that release. Use placeholders for every other variable, matching names in `.env.example`:

- `ADMIN_SECRET` — at least 32 characters
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`

A public demo stays on Stripe test keys. Live keys belong on the buyer's own production project.

## Scripts buyers run

| Script | Command |
| --- | --- |
| Local app | `npm run dev` |
| Production build | `npm run build` |
| Production server | `npm run start` |
| Catalogue import | `npm run import:products -- products-template.csv` |
| Same import | `npm run import:shopify -- path/to/products_export.csv` |

`import:shopify` is an alias of `import:products`. Flags `--seed-stock` and `--force` are documented in the README section **Import a catalogue**.

`npm run lint` and `npm test` are for maintainers. Buyers do not need them to run the store.
