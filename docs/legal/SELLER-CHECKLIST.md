# Seller checklist — before the ShopSite kit zip ships

> **Disclaimer:** This is a practical operational checklist for informational use only. It is **not** formal legal advice. Have counsel review Seller-facing terms, privacy, and refund practices for your jurisdiction.

**Owner:** the Seller ([SELLER_ENTITY])  
**Kit:** [KIT_NAME] (ShopSite)  
**Release version:** [KIT_VERSION]  
**Legal pack version:** [LEGAL_PACK_VERSION] (keep in sync with release)

Maintainer-only. Keep this file in the repository and leave it out of the buyer zip (see `PACKAGING.md`).

The public ShopSite core is MIT (root `LICENSE`, Copyright (c) 2026 Kiwi Guo). The former paid-kit EULA is archived at `docs/legal/archive/EULA-KIT-LICENSE.md` and is not the current license. Checklist items that name that EULA refer to the former paid kit only. Optional paid offerings, if offered, need separate commercial terms (`COMMERCIAL-ADD-ONS.md`). This file is not that contract.

Use this before cutting a customer-facing zip or marketplace build.

---

## Sales site (Seller ↔ kit purchaser)

- [ ] **Former paid-kit EULA** stays archived at `docs/legal/archive/EULA-KIT-LICENSE.md`. Do not present it as the license for the public core. Optional paid SKUs need their own published terms (`COMMERCIAL-ADD-ONS.md`).
- [ ] **Sales-site Privacy Policy** published (Seller’s own — not the buyer storefront template)
- [ ] **Sales-site Terms** published (Seller’s own)
- [ ] **Refund policy for any paid offering** — if a paid SKU is published, `[REFUND_POLICY_URL]` is filled on the sales site. Do not invent a refund window in this repo.
- [ ] Checkout shows merchant / Seller legal name: `[SELLER_ENTITY]`
- [ ] Support contact live: `[SELLER_SUPPORT_EMAIL]`

## Former paid-kit decisions (archived; not the MIT core)

These placeholders live in `docs/legal/archive/EULA-KIT-LICENSE.md`. They are not license terms for the public core.

- [ ] **Jurisdiction & venue** in that archived EULA: `[JURISDICTION]`, `[VENUE]`
- [ ] **Single vs multi-seat / multi-project** wording in that archived EULA: `[LICENSE_SEATS]`
- [ ] **Agency / client-build** wording in that archived EULA (one client store per license; do not hand the kit over as a reusable template)
- [ ] **Updates & support** wording in that archived EULA (12 months of updates; best-effort email support)
- [ ] Liability-cap wording in that archived EULA (fees paid in the prior 12 months, with no floor)

## Storefront kit contents (buyer product)

- [ ] Empty policy shells only (“Policy not set yet” / “TODO Replace me”) — scrub from issue #12 / PR #20 still on `main`
- [ ] **No invented** store return windows, jurisdictions, or contact emails in shipped storefront routes
- [ ] This legal pack included under suggested path, e.g. `docs/legal/` or `content/policies/`
- [ ] Footer/legal links point at shells or docs, not fake filled policies
- [ ] Stripe env/docs make clear **buyer is merchant of record**

## Docs & packaging

- [ ] **Tech Writer** linked this pack from `PLAYBOOK` and `PACKAGING`
- [ ] README in this pack explains copy-customize workflow for buyers
- [ ] Third-party attributions / license scan current for this release
- [ ] `LEGAL_PACK_VERSION` matches `[KIT_VERSION]` or is recorded in release notes
- [ ] Changelog notes legal pack updates when the license or templates change

## Final smoke checks

- [ ] Search product zip for accidental real addresses / old brand policies
- [ ] Confirm `LICENSE-NOTICE.md` is optional and not confused with store Terms
- [ ] Confirm buyer templates still open with the short “not legal advice” disclaimer
- [ ] Tag release. The former paid-kit EULA is already archived; do not treat it as the license for the public core.

---

**Recorded on the archived paid-kit EULA (not open for the MIT core):**

1. Kit purchase **refund** window and process  
2. **Single vs multi-seat** (and agency use)  
3. Governing **jurisdiction** for that EULA  

Those three applied to the former paid kit. The archived text is `docs/legal/archive/EULA-KIT-LICENSE.md`.
