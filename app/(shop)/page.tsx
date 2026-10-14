import type { Metadata } from "next";

import { ProductCard } from "@/components/shop/product-card";
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
      <div className="shop-grid grid sm:grid-cols-2 lg:grid-cols-3">
        {catalogue.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
