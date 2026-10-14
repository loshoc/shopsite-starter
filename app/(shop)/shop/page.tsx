import type { Metadata } from "next";

import { ProductCard } from "@/components/shop/product-card";
import { listStoreProducts } from "@/lib/catalogue";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Shop", path: "/shop" });

export default async function ShopPage() {
  const catalogue = await listStoreProducts();
  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <h1 className="text-2xl font-medium tracking-tight">Shop</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Live quantity comes from stock, not the catalogue seed. Sold out means sold out.
      </p>
      {catalogue.unavailable ? (
        <p className="mt-4 text-sm text-danger">Inventory is unavailable, so checkout is closed.</p>
      ) : null}
      <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {catalogue.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
