import Link from "next/link";

import { ProductMedia } from "@/components/shop/product-media";
import { siteConfig } from "@/data/site.config";
import type { StoreProduct } from "@/lib/catalogue";
import { formatMoney } from "@/lib/format";
import { displayPriceCents, variantHint } from "@/lib/storefront-ui";

export function ProductCard({ product }: { product: StoreProduct }) {
  const price = displayPriceCents(product.variants, product.priceCents);
  const hint = variantHint(product.variants);
  return (
    <article className="shop-card">
      <Link href={`/products/${product.id}`} className="group block">
        <ProductMedia name={product.name} images={product.images} className="aspect-[4/5] w-full" />
        <div className="shop-card-action">
          <h2 className="shop-card-title shop-card-inset font-medium group-hover:underline">{product.name}</h2>
          <p className="shop-card-inset mt-1 text-sm">
            {price.from
              ? `From ${formatMoney(price.cents, siteConfig.currency)}`
              : formatMoney(price.cents, siteConfig.currency)}
          </p>
          {hint ? <p className="shop-card-inset mt-1 text-sm text-muted">{hint}</p> : null}
        </div>
      </Link>
    </article>
  );
}

export function ProductGrid({ products }: { products: StoreProduct[] }) {
  if (products.length === 0) {
    return <p className="mt-6 text-sm text-muted">No products yet.</p>;
  }
  return (
    <div className="shop-grid grid sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
