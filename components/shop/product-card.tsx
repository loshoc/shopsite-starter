import Link from "next/link";

import { AddToCart } from "@/components/shop/add-to-cart";
import { ProductMedia } from "@/components/shop/product-media";
import type { StoreProduct } from "@/lib/catalogue";
import { descriptionText } from "@/lib/description-text";
import { formatMoney } from "@/lib/format";

export function ProductCard({ product }: { product: StoreProduct }) {
  return (
    <article className="shop-card flex flex-col">
      <Link href={`/products/${product.id}`} className="group block">
        <ProductMedia name={product.name} images={product.images} className="aspect-[4/5] w-full" />
        <h2 className="shop-card-title shop-card-inset font-medium group-hover:underline">{product.name}</h2>
        <p className="shop-card-inset mt-1 text-sm leading-6 text-muted">{descriptionText(product.description)}</p>
        <p className="shop-card-inset mt-2 text-sm">{formatMoney(product.priceCents)}</p>
      </Link>
      <div className="shop-card-inset shop-card-action mt-3">
        <AddToCart skuId={product.skuId} disabled={!product.orderable} />
      </div>
    </article>
  );
}
