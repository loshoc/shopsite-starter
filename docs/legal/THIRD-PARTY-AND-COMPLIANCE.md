# Third-Party Components and Compliance Notes

> **Disclaimer:** This is a practical template for informational use only. It is **not** formal legal advice. Have qualified counsel and your own compliance review before publishing policies or making market claims. These notes are for **the Seller ([SELLER_ENTITY])** and **kit buyers** — they are not a customer-facing contract.

---

## 1. Open-source and UI stack (typical)

ShopSite is commonly built with components that are **typically MIT-licensed** (confirm in your lockfile / `LICENSE` files each release):

| Component | Typical license | Action |
|-----------|-----------------|--------|
| Next.js | MIT | Keep license notices; do not re-license upstream as proprietary-only |
| React | MIT | Same |
| Tailwind CSS | MIT | Same |
| Other npm deps | Various (MIT, Apache-2.0, etc.) | Run a license scan before release; keep attributions |

**Buyers:** Your modifications do not remove upstream OSS obligations. Keep a `NOTICE` or dependency license list if you redistribute binaries or substantial copies in ways that require it.

**Seller:** Ship accurate attributions for bundled third-party code; do not invent “all rights reserved” over MIT code you do not own.

---

## 2. Stripe

- Using Stripe in the kit means **buyers** must create and use **their own** Stripe accounts.
- **Software ≠ Stripe processing agreement.** Shipping Stripe-integrated code does not enroll anyone in Stripe, set pricing, or make Seller the merchant of record for buyer stores.
- Buyers must accept **Stripe’s terms** and follow Stripe’s restricted-business / compliance rules.
- Payment data privacy: Stripe’s privacy terms apply to data Stripe processes; say so in the buyer’s Privacy Policy (see `PRIVACY-POLICY.md`).
- Seller should not imply Seller processes card payments for buyer stores.

---

## 3. Cookies and consent

- The scrubbed kit should **not** invent analytics or consent-banner defaults.
- If a buyer adds analytics, ads, or non-essential cookies, they need a lawful basis / consent mechanism where required (EU/UK/ePrivacy, some US states, etc.).
- Essential cookies for session/cart/checkout are usually treated differently from analytics — still disclose honestly.
- Template section lives in `PRIVACY-POLICY.md` as **optional** — enable only when true.

---

## 4. Taxes (sales tax / VAT / GST)

- **Buyer’s responsibility** for their storefront: registration, collection, remittance, and correct Stripe Tax / manual tax setup.
- Seller’s responsibility for **kit sales** on the sales site is separate (Seller’s own tax setup).
- Do not hardcode tax-inclusive claims or nexus advice into kit policy shells.

---

## 5. Consumer law, product claims, and regulated goods

- Marketing claims, warranties, and product safety are **buyer’s** responsibility for products they sell.
- Distance-selling / cooling-off rules (e.g. EU consumer rights) may require returns language beyond a voluntary store policy.
- Regulated categories (supplements, cosmetics, medical devices, age-restricted goods, etc.) need category-specific compliance — **not** covered by these templates.

---

## 6. Accessibility

- Aim for accessible storefronts (e.g. WCAG-oriented practices). Legal accessibility obligations vary by jurisdiction and company size.
- These templates do not certify conformance. Buyers should test their customized UI.

---

## 7. Keep attributions; do not invent kit policy defaults

**Do:**

- Keep OSS and Stripe attributions
- Ship empty / “Policy not set yet” shells in the kit (issue #12 / PR #20 on `main`)
- Point buyers at this pack under `docs/legal/` (or similar)
- Version the legal pack with releases

**Do not:**

- Fill store Terms/Privacy/Returns with fictional `[STORE_NAME]` defaults inside the product zip
- Claim Seller is merchant of record for buyer checkouts
- Promise GDPR/CCPA compliance as a feature without buyer configuration
- Copy another brand’s policies verbatim

---

## 8. Suggested internal links for maintainers

- Tech Writer: link from `PLAYBOOK` and `PACKAGING` to this pack
- Release: include `docs/legal/` in the kit zip, except `SELLER-CHECKLIST.md` (maintainer-only; see `PACKAGING.md`)
- Sales site: publish Seller EULA + Seller privacy/terms + kit refund policy separately from buyer storefront shells
