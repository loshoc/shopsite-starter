import Link from "next/link";

import { AddToCart } from "@/components/shop/add-to-cart";
import { ProductMedia } from "@/components/shop/product-media";
import type { StoreProduct } from "@/lib/catalogue";
import { descriptionText } from "@/lib/description-text";
import { formatMoney } from "@/lib/format";

export function ProductCard({ product }: { product: StoreProduct }) {
  return (
    <article className="flex flex-col">
      <Link href={`/products/${product.id}`} className="group block">
        <ProductMedia name={product.name} images={product.images} className="aspect-[4/5] w-full" />
        <h2 className="mt-3 text-base font-medium group-hover:underline">{product.name}</h2>
        <p className="mt-1 text-sm leading-6 text-muted">{descriptionText(product.description)}</p>
        <p className="mt-2 text-sm">{formatMoney(product.priceCents)}</p>
      </Link>
      <div className="mt-3">
        <AddToCart skuId={product.skuId} disabled={!product.orderable} />
      </div>
    </article>
  );
}
