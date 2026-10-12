import Link from "next/link";

import { ProductCard } from "@/components/shop/product-card";
import { siteConfig } from "@/data/site.config";
import { listStoreProducts } from "@/lib/catalogue";

export default async function HomePage() {
  const catalogue = await listStoreProducts();
  const featured = catalogue.products.find((product) => product.featured) ?? catalogue.products[0];

  return (
    <div>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.2fr_0.8fr] md:py-24">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-copper">Demo catalogue · 03 objects</p>
          <h1 className="mt-4 font-serif text-5xl leading-[0.95] tracking-tight md:text-7xl">
            {siteConfig.name}
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-ink/75">{siteConfig.tagline}</p>
          <Link
            href="/shop"
            className="mt-8 inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm text-foam hover:bg-copper"
          >
            Shop the edit
          </Link>
        </div>
        {featured ? (
          <div className="border border-sand bg-foam p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-ink/50">On the table</p>
            <div className="mt-4">
              <ProductCard product={featured} index={1} />
            </div>
          </div>
        ) : null}
      </section>
      {catalogue.unavailable ? (
        <p className="mx-auto max-w-6xl px-5 text-sm text-copper">Inventory is unavailable. Nothing is orderable until it returns.</p>
      ) : null}
    </div>
  );
}
