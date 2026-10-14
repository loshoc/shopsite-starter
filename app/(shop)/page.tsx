import type { Metadata } from "next";

import { ProductCard } from "@/components/shop/product-card";
import { listStoreProducts } from "@/lib/catalogue";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ path: "/" });

export default async function HomePage() {
  const catalogue = await listStoreProducts();

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <h1 className="text-2xl font-medium tracking-tight">Products</h1>
      {catalogue.unavailable ? (
        <p className="mt-3 text-sm text-danger">Inventory is unavailable. Nothing is orderable until it returns.</p>
      ) : null}
      <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {catalogue.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
