import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DisclosureList } from "@/components/shop/disclosure";
import { JsonLd } from "@/components/shop/json-ld";
import { ProductDescription } from "@/components/shop/product-description";
import { ProductMedia } from "@/components/shop/product-media";
import { ProductPurchase } from "@/components/shop/product-purchase";
import { siteConfig } from "@/data/site.config";
import { getProduct } from "@/data/products";
import { appUrl } from "@/lib/app-url";
import { getStoreProduct, type StoreVariant } from "@/lib/catalogue";
import { descriptionText } from "@/lib/description-text";
import { productJsonLd } from "@/lib/json-ld";
import { metaDescription, pageMetadata, productPath } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = getProduct(id);
  if (!product || product.hidden) {
    return { title: "Product", robots: { index: false, follow: false } };
  }
  return pageMetadata({
    title: product.name,
    description: metaDescription(descriptionText(product.description)),
    path: productPath(product.id),
    imagePath: false,
  });
}

function qtyLabel(variant: StoreVariant): string {
  if (variant.liveStatus === "unlimited") return "Made to order";
  if (variant.orderable) return `${variant.liveQty} in stock`;
  return "Sold out";
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getStoreProduct(id);
  if (!product) notFound();
  const origin = appUrl();
  const pageUrl = `${origin}${productPath(product.id)}`;
  const details = product.details?.trim() ?? "";

  return (
    <>
      <JsonLd data={productJsonLd(product, pageUrl, siteConfig.currency, origin)} />
      <div className="shop-pad shop-split mx-auto grid max-w-6xl md:grid-cols-2">
        <div>
          <ProductMedia name={product.name} images={product.images} className="shop-frame min-h-80 w-full" />
          {product.images.length > 1 ? (
            <div className="shop-thumbs mt-3 grid grid-cols-4">
              {product.images.slice(1).map((src) => (
                <ProductMedia key={src} name={product.name} images={[src]} className="shop-frame aspect-square w-full" />
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <Link href="/shop" className="text-sm text-muted hover:text-fg">
            Back to the shop
          </Link>
          <h1 className="shop-display mt-3 font-medium tracking-tight">{product.name}</h1>
          <ProductDescription html={product.description} className="mt-3 text-base text-muted" />
          <ProductPurchase
            name={product.name}
            variants={product.storeVariants.map((variant) => ({
              skuId: variant.skuId,
              priceCents: variant.priceCents,
              orderable: variant.orderable,
              qtyLabel: qtyLabel(variant),
              options: variant.options,
            }))}
          />
          {details ? (
            <div className="mt-8">
              <DisclosureList items={[{ id: "details", title: "Details", body: details }]} />
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
