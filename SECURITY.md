# Security

ShopSite is a starter kit. It is provided **AS IS**, without warranty, as stated in the [MIT License](LICENSE). This file does not claim the kit is hack-proof. No CDN, WAF, or hosting setting makes a store secure or legally compliant.

This repository is not a hosted store. The maintainer is not the merchant of record for forks or for stores deployed from this kit.

## Reporting a vulnerability

Prefer a [GitHub Security Advisory](https://github.com/loshoc/shopsite-starter/security/advisories/new) for this repository.

If you cannot use GitHub advisories, write to [SECURITY_CONTACT_EMAIL].

## Abuse

Do not use this demo or repository to phish, inject malware, or impersonate ShopSite. Report abuse to the same channel as above.

Scam or malware reports about third-party sites are not affiliated with this repository. Verify downloads only from the official GitHub repository: https://github.com/loshoc/shopsite-starter

## Hardening a store you deploy

These notes are for merchants who run a copy of this kit. They are optional hosting and catalogue practices. The kit does not include a WAF, bot manager, or image pipeline. Nothing below turns the starter into a guaranteed anti-scrape product.

### Product images and metadata

Scrapers and 挂码-style resale often copy catalogue photos. Before you publish product images:

- Strip GPS and other EXIF / XMP location tags from originals. Prefer a clean export (for example sRGB JPEG or WebP) rather than camera RAW dumps.
- Prefer unique crops, mild watermarks, or store-specific overlays when your market has high image-theft risk. Do not rely on watermarks alone.
- Keep a private archive of originals off the public `public/products/` tree. Ship only the web-sized files you intend to serve.
- The import path accepts a file under `public/` or an https URL. It does not strip metadata for you.

### Fraud and abuse review

Sudden traffic, many identical carts, or checkout sessions that never pay can be scraping or carding probes as well as marketing spikes.

- Review Stripe Radar (or your processor’s fraud tools) and PayPal seller protection settings on the live account that owns the keys. Those controls live in the processor dashboard, not in this repository.
- Fail-closed stock and signed webhooks are already in the kit. Do not weaken signature checks to “debug” traffic.
- Never paste live keys, `.env` contents, webhook ids, or customer data into Issues or pull requests. See [CONTRIBUTING.md](CONTRIBUTING.md).

### Edge rate limits and bots

Put rate limits and bot challenges at your edge (for example Cloudflare in front of Vercel, or your host’s WAF). Suggested starting points — tune to your traffic:

- Rate-limit `/api/*`, especially checkout session create and webhooks’ public URLs if abused for noise (webhooks must still accept signed provider traffic).
- Protect `/admin` and `/admin/login` with stricter limits and, where possible, IP allowlists or an extra access rule.
- Challenge or throttle abusive ASNs and known scraper bands when your edge product supports it.

Crawler policy for search and AI bots is already documented in [PLAYBOOK.md](PLAYBOOK.md) **Search visibility** (`GEO_ALLOW_AI_CRAWLERS`, `GEO_KEEP_BINGBOT`, `/robots.txt`). That is indexing control, not a substitute for edge rate limits against hostile scrapers.

Buyer-facing steps: [PLAYBOOK.md](PLAYBOOK.md) **Anti-scrape and abuse hardening**
