# ShopSite skill stop rule

Customize `app/(shop)` and `components/shop` for the brand: layout, copy, and catalogue in `data/products.ts` and `data/site.config.ts`.

Leave `app/admin`, `components/ui`, `components/admin`, and the inventory libraries alone unless the user explicitly asks to change operations.

Do not add Resend, newsletters, audiences, or campaign email to the core kit. Do not add Clerk; admin auth stays the shared secret until someone asks to replace it.
