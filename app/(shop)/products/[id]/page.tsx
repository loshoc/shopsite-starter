import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCart } from "@/components/shop/add-to-cart";
import { ProductDescription } from "@/components/shop/product-description";
import { ProductMedia } from "@/components/shop/product-media";
import { getProduct } from "@/data/products";
import { getStoreProduct } from "@/lib/catalogue";
import { formatMoney } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = getProduct(id);
  return { title: product?.name ?? "Product" };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getStoreProduct(id);
  if (!product) notFound();
  const qtyLabel =
    product.liveStatus === "unlimited"
      ? "Made to order"
      : product.orderable
        ? `${product.liveQty} in stock`
        : "Sold out";

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-2">
      <div>
        <ProductMedia id={product.id} name={product.name} images={product.images} className="min-h-80 w-full" />
        {product.images.length > 1 ? (
          <div className="mt-3 grid grid-cols-4 gap-3">
            {product.images.slice(1).map((src) => (
              <ProductMedia key={src} id={product.id} name={product.name} images={[src]} className="aspect-square w-full" />
            ))}
          </div>
        ) : null}
      </div>
      <div>
        <Link href="/shop" className="text-xs uppercase tracking-[0.18em] text-copper">
          Back to the shop
        </Link>
        <h1 className="mt-4 font-serif text-5xl tracking-tight">{product.name}</h1>
        <ProductDescription html={product.description} className="mt-4 text-lg text-ink/75" />
        {product.details ? <p className="mt-6 text-sm leading-7 text-ink/80">{product.details}</p> : null}
        <p className="mt-6 font-serif text-3xl">{formatMoney(product.priceCents)}</p>
        <p className="mt-2 text-sm text-ink/60">{qtyLabel}</p>
        <div className="mt-6 space-y-4">
          {product.storeVariants.length > 1 ? (
            product.storeVariants.map((variant) => {
              const label = variant.options.map((option) => `${option.name}: ${option.value}`).join(", ");
              const variantQty =
                variant.liveStatus === "unlimited" ? "Made to order" : variant.orderable ? `${variant.liveQty} in stock` : "Sold out";
              return (
                <div key={variant.skuId} className="flex flex-wrap items-center justify-between gap-3 border-t border-sand pt-4">
                  <div>
                    <p className="text-sm">{label || variant.skuId}</p>
                    <p className="text-sm text-ink/60">
                      {formatMoney(variant.priceCents)} · {variantQty}
                    </p>
                  </div>
                  <AddToCart skuId={variant.skuId} disabled={!variant.orderable} />
                </div>
              );
            })
          ) : (
            <AddToCart skuId={product.skuId} disabled={!product.orderable} />
          )}
        </div>
      </div>
    </div>
  );
}
