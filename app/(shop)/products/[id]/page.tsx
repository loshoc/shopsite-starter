import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCart } from "@/components/shop/add-to-cart";
import { ProductMark } from "@/components/shop/product-mark";
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
      <ProductMark id={product.id} className="min-h-80 w-full" />
      <div>
        <Link href="/shop" className="text-xs uppercase tracking-[0.18em] text-copper">
          Back to the shop
        </Link>
        <h1 className="mt-4 font-serif text-5xl tracking-tight">{product.name}</h1>
        <p className="mt-4 text-lg text-ink/75">{product.description}</p>
        <p className="mt-6 text-sm leading-7 text-ink/80">{product.details}</p>
        <p className="mt-6 font-serif text-3xl">{formatMoney(product.priceCents)}</p>
        <p className="mt-2 text-sm text-ink/60">{qtyLabel}</p>
        <div className="mt-6">
          <AddToCart skuId={product.skuId} disabled={!product.orderable} />
        </div>
      </div>
    </div>
  );
}
