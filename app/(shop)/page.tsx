import type { Metadata } from "next";

import { ProductGrid } from "@/components/shop/product-card";
import { listStoreProducts } from "@/lib/catalogue";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ path: "/" });

export default async function HomePage() {
  const catalogue = await listStoreProducts();

  return (
    <div className="shop-pad mx-auto max-w-6xl">
      <h1 className="shop-title font-medium tracking-tight">Products</h1>
      {catalogue.unavailable ? (
        <p className="mt-3 text-sm text-danger">Inventory is unavailable. Nothing is orderable until it returns.</p>
      ) : null}
      <ProductGrid products={catalogue.products} />
    </div>
  );
}
