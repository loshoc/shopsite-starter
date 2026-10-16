# Packaging

Release checklist for the buyer zip. Cold start stays in [README.md](README.md). Brand, import, stock, checkout, and SEO stay in [PLAYBOOK.md](PLAYBOOK.md).

`package.json` `"version"` is `1.0.0`, the same tag as [CHANGELOG.md](CHANGELOG.md).

[LICENSE](LICENSE) is already the MIT license (Copyright 2026 ShopSite contributors). Ship that file with the zip.

## Buyer zip

Ship a clean archive of the `1.0.0` tree. Include application source and these root files:

- `app/`, `components/`, `data/`, `lib/`, `public/`, `scripts/`, `assets/`
- `instrumentation.ts`, `proxy.ts`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `components.json`
- `package.json`, `package-lock.json`
- `README.md`
- `PLAYBOOK.md`
- `DEPLOY-CHECKLIST.md` (Vercel and Stripe steps; the playbook links here)
- `LICENSE`
- `CHANGELOG.md`
- `PACKAGING.md`
- `.env.example`
- `.gitignore`
- `products-template.csv` (repo root; made-up housewares demo rows — refresh or drop these after a custom catalogue; see **Scrub before you zip**)
- `DOCUMENTATION-CHECKLIST.md`
- `INVENTORY.md` (stock and oversold behavior the playbook points at)
- `docs/legal/` (placeholder policy templates; storefront shells stay empty)

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

`.env.example` uses placeholders only. The unmodified starter keeps made-up catalogue copy, the housewares rows in `products-template.csv`, and the sample PNGs in `public/products/` so cold start still has a catalogue.

### Demo media after a catalogue swap

Cold start uses that housewares sample (`cedar-spoon`, `linen-napkin`, `stone-bowl`). After the store uses a custom catalogue, scrub the sample before you zip or deploy:

- [ ] Replace or delete demo files under `public/products/` (`cedar-spoon.png`, `linen-napkin.png`, `linen-napkin-fold.png`, `stone-bowl.png`). Keep only images the shipped catalogue references.
- [ ] Refresh `products-template.csv`. Replace the housewares demo rows (cedar-spoon, linen-napkin, stone-bowl) with your products, or drop the file when the archive no longer includes a template.

Run that scrub on a rebranded zip and on the deployed `public/` tree. The playbook points here from **Customize the brand** and **Import products**.

### Legal shells

Legal shells stay in the zip. Do not fill them in.

- [ ] `/shipping`, `/returns`, `/faq`, `/privacy`, and `/terms` still say `TODO: Replace me`. Policy pages also say `Policy not set yet`. Do not write a privacy, terms, returns, or shipping policy into the zip.
- [ ] `components/shop/footer.tsx` still says `Replace this line with your store footer.` `components/shop/text-page.tsx` still says `Replace this line with your page label.`

Buyers replace those shells and the footer before their own go-live. That pass is PLAYBOOK **Legal pages and footer** and DOCUMENTATION-CHECKLIST **Legal pages and footer**. Placeholder templates are in [docs/legal/](docs/legal/README.md). Leave the placeholders as written.

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
