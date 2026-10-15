# ShopSite Legal Templates (for buyers)

> **Disclaimer:** These are practical templates for informational use only. They are **not** formal legal advice. Have qualified counsel review and adapt them for your jurisdiction, products, and business model before publishing.

This pack helps **ShopSite kit buyers** customize storefront policies for their own stores, and includes a **kit license (EULA)** for the ShopSite starter kit product sold by Kiwi Guo.

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
6. Keep the **kit EULA** separate: it governs the ShopSite starter kit purchase (seller ↔ you), not your customers’ purchases on your storefront.

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
- `EULA-KIT-LICENSE.md` → sales site / purchase flow (not your storefront customer terms)
- `LICENSE-NOTICE.md` → optional repo-root notice for the buyer’s project

## Placeholders you will see

Common tokens across files:

- `[STORE_NAME]` — public brand name of the buyer’s store
- `[LEGAL_ENTITY]` — legal name of the company or sole proprietor
- `[SUPPORT_EMAIL]` — customer / privacy contact
- `[JURISDICTION]` — governing law / venue (country or state)
- `[EFFECTIVE_DATE]` — date the policy takes effect
- `[RETURN_DAYS]` — return window if you offer one
- `[SELLER_NAME]` / `[SELLER_ENTITY]` — Kiwi Guo / seller entity for kit EULA
- `[KIT_NAME]` — product name (default: ShopSite)
- `[LICENSE_SEATS]` — single vs multi-seat (seller decision)
- `[REFUND_POLICY_URL]` — kit purchase refund policy on the sales site

Search the pack for `[` to find every customization point.

## Related docs for maintainers

- **Tech Writer** should link this pack from `PLAYBOOK` and `PACKAGING` so release and docs checklists point here.
- Version this legal pack with each kit release (see `SELLER-CHECKLIST.md`).
- Do **not** paste filled-in store policies into the empty kit shells; keep the scrubbed placeholders in the product zip.

## Files in this pack

| File | Audience |
|------|----------|
| `TERMS-OF-SERVICE.md` | Buyer’s store customers |
| `PRIVACY-POLICY.md` | Buyer’s store customers / data subjects |
| `RETURNS-AND-SHIPPING.md` | Buyer’s store customers (optional short pages) |
| `EULA-KIT-LICENSE.md` | Kit purchaser ↔ seller |
| `LICENSE-NOTICE.md` | Optional short notice in buyer repo root |
| `THIRD-PARTY-AND-COMPLIANCE.md` | Seller + buyers (notes, not a customer contract) |
| `SELLER-CHECKLIST.md` | Kiwi / release owner before kit zip ships |
