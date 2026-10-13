import type { Metadata } from "next";

import { ProductCard } from "@/components/shop/product-card";
import { listStoreProducts } from "@/lib/catalogue";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Shop", path: "/shop" });

export default async function ShopPage() {
  const catalogue = await listStoreProducts();
  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="font-serif text-5xl tracking-tight">The edit</h1>
      <p className="mt-3 max-w-xl text-ink/70">
        Three demo objects. Live quantity comes from stock, not the catalogue seed. Sold out means sold out.
      </p>
      {catalogue.unavailable ? (
        <p className="mt-6 text-sm text-copper">Inventory is unavailable, so checkout is closed.</p>
      ) : null}
      <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {catalogue.products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index + 1} />
        ))}
      </div>
    </div>
  );
}
