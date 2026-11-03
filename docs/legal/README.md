# ShopSite Legal Templates (for buyers)

> **Disclaimer:** These are practical templates for informational use only. They are **not** formal legal advice. Have qualified counsel review and adapt them for your jurisdiction, products, and business model before publishing.

This pack helps people who use ShopSite customize storefront policies for their own stores. The public ShopSite core is MIT-licensed. See the repository root [LICENSE](../../LICENSE) (Copyright (c) 2026 Kiwi Guo).

Storefront Terms, Privacy, and Returns templates are not part of the OSS license grant and must be replaced before go-live.

The former paid-kit EULA is archived at [archive/EULA-KIT-LICENSE.md](archive/EULA-KIT-LICENSE.md). It is not the current license. Optional paid offerings, if offered, are described only as a stub in [COMMERCIAL-ADD-ONS.md](COMMERCIAL-ADD-ONS.md).

## What stays empty in the shipped kit

Per issue #12 / PR #20 (legal/footer scrub on `main`), the starter kit itself ships only shell pages such as:

- “Policy not set yet”
- “TODO Replace me”

The kit must **not** invent store policy text, return windows, jurisdictions, or contact details. Buyers copy and customize templates from this pack (or their own counsel-approved policies) into those shells.

## How to use

1. Copy the relevant `.md` files into your store’s docs or content tree.
2. Replace every placeholder in `[BRACKETS]` (for example `[STORE_NAME]`, `[SUPPORT_EMAIL]`).
3. Delete sections that do not apply (for example optional analytics/cookies if you add none).
4. Have counsel review for your jurisdiction and product category.
5. Publish via your store’s policy routes (Terms, Privacy, Returns, Shipping, etc.).
6. Keep storefront Terms, Privacy, and Returns separate from the MIT license. Those pages govern your customers. The templates here are not filled in for you.

## Suggested kit paths

Place buyer-facing templates where store operators will find them, for example:

| Path | Purpose |
|------|---------|
| `docs/legal/` | Human-readable policy templates + this README |
| `content/policies/` | MD/MDX sources wired to Next.js routes |
| `app/(store)/legal/` or `app/(marketing)/` | Route handlers / pages that render policy content |

Example mapping:

- `TERMS-OF-SERVICE.md` → `/terms` or `/legal/terms`
- `PRIVACY-POLICY.md` → `/privacy` or `/legal/privacy`
- `RETURNS-AND-SHIPPING.md` → `/returns` and `/shipping` (or one combined page)
- `archive/EULA-KIT-LICENSE.md` — archived former paid-kit EULA (not the current license, and not storefront customer terms)
- `COMMERCIAL-ADD-ONS.md` — stub for optional paid offerings (not a binding contract)
- `LICENSE-NOTICE.md` → optional short notice for a project built from the kit

## Placeholders you will see

Common tokens across files:

- `[STORE_NAME]` — public brand name of the buyer’s store
- `[LEGAL_ENTITY]` — legal name of the company or sole proprietor
- `[SUPPORT_EMAIL]` — customer / privacy contact
- `[JURISDICTION]` — governing law / venue (country or state)
- `[EFFECTIVE_DATE]` — date the policy takes effect
- `[RETURN_DAYS]` — return window if you offer one
- `[SELLER_NAME]` / `[SELLER_ENTITY]` — seller identity placeholders in the archived EULA and the commercial stub
- `[KIT_NAME]` — product name (default: ShopSite)
- `[LICENSE_SEATS]` — seat wording in the archived EULA only
- `[REFUND_POLICY_URL]` — refund-policy placeholder on the sales site, if a paid offering is published
- `[SALES_SITE_URL]` / `[SELLER_SUPPORT_EMAIL]` — placeholders in the commercial stub

Search the pack for `[` to find every customization point.

## Related docs for maintainers

- **Tech Writer** should link this pack from `PLAYBOOK` and `PACKAGING` so release and docs checklists point here.
- Version this legal pack with each kit release.
- Do **not** paste filled-in store policies into the empty kit shells; keep the scrubbed placeholders in the product zip.
- Vulnerability and abuse reports: [SECURITY.md](../../SECURITY.md).

## Files in this pack

| File | Audience |
|------|----------|
| `TERMS-OF-SERVICE.md` | Buyer’s store customers |
| `PRIVACY-POLICY.md` | Buyer’s store customers / data subjects |
| `RETURNS-AND-SHIPPING.md` | Buyer’s store customers (optional short pages) |
| `archive/EULA-KIT-LICENSE.md` | Archived former paid-kit EULA (not the current license) |
| `COMMERCIAL-ADD-ONS.md` | Stub only; not a binding contract |
| `LICENSE-NOTICE.md` | Optional short notice in a project built from the kit |
| `THIRD-PARTY-AND-COMPLIANCE.md` | The Seller and buyers (notes, not a customer contract) |
