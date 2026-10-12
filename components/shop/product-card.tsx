import Link from "next/link";

import { AddToCart } from "@/components/shop/add-to-cart";
import { ProductMark } from "@/components/shop/product-mark";
import type { StoreProduct } from "@/lib/catalogue";
import { formatMoney } from "@/lib/format";

export function ProductCard({ product, index }: { product: StoreProduct; index: number }) {
  return (
    <article className="flex flex-col">
      <Link href={`/products/${product.id}`} className="group block">
        <ProductMark id={product.id} className="aspect-[4/5] w-full" />
        <div className="mt-4 flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-2xl tracking-tight group-hover:text-copper">{product.name}</h2>
          <span className="text-xs tabular-nums text-ink/50">0{index}</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-ink/70">{product.description}</p>
        <p className="mt-3 text-sm">{formatMoney(product.priceCents)}</p>
      </Link>
      <div className="mt-4">
        <AddToCart skuId={product.skuId} disabled={!product.orderable} />
      </div>
    </article>
  );
}
