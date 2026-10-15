# Seller checklist — before the ShopSite kit zip ships

> **Disclaimer:** This is a practical operational checklist for informational use only. It is **not** formal legal advice. Have counsel review Seller-facing terms, privacy, and refund practices for your jurisdiction.

**Owner:** Kiwi Guo / [SELLER_ENTITY]  
**Kit:** [KIT_NAME] (ShopSite)  
**Release version:** [KIT_VERSION]  
**Legal pack version:** [LEGAL_PACK_VERSION] (keep in sync with release)

Use this before cutting a customer-facing zip or marketplace build.

---

## Sales site (Seller ↔ kit purchaser)

- [ ] **EULA acceptance** on purchase/download (checkbox or equivalent) linking current `EULA-KIT-LICENSE.md` (published URL or embedded version)
- [ ] **Sales-site Privacy Policy** published (Seller’s own — not the buyer storefront template)
- [ ] **Sales-site Terms** published (Seller’s own)
- [ ] **Refund policy for kit purchases** decided and published — `[REFUND_POLICY_URL]` / `[KIT_REFUND_POLICY]` filled (**do not leave ambiguous**)
- [ ] Checkout shows merchant / Seller legal name: `[SELLER_ENTITY]`
- [ ] Support contact live: `[SELLER_SUPPORT_EMAIL]`

## Decisions counsel / Seller must lock

- [ ] **Jurisdiction & venue** for kit EULA: `[JURISDICTION]`, `[VENUE]`
- [ ] **Single vs multi-seat / multi-project** license: `[LICENSE_SEATS]`
- [ ] **Agency / client-build** rules if selling to freelancers: `[AGENCY_USE_RULES]`
- [ ] **Updates & support** promises match reality: `[UPDATES_POLICY]`, `[SUPPORT_POLICY]`
- [ ] Liability caps and warranty language reviewed

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
- [ ] Changelog notes legal pack updates when EULA or templates change

## Final smoke checks

- [ ] Search product zip for accidental real addresses / old brand policies
- [ ] Confirm `LICENSE-NOTICE.md` is optional and not confused with store Terms
- [ ] Confirm buyer templates still open with the short “not legal advice” disclaimer
- [ ] Tag release; archive the exact EULA version accepted at checkout

---

**Still open until Seller decides (track explicitly):**

1. Kit purchase **refund** window and process  
2. **Single vs multi-seat** (and agency use)  
3. Governing **jurisdiction** for Seller EULA  

When those three are filled, update `EULA-KIT-LICENSE.md` and the sales site together.
