import type { Metadata } from "next";

import { JsonLd } from "@/components/shop/json-ld";
import { ProductGrid } from "@/components/shop/product-card";
import { appUrl } from "@/lib/app-url";
import { listStoreProducts } from "@/lib/catalogue";
import { breadcrumbJsonLd } from "@/lib/json-ld";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Shop", path: "/shop" });

export default async function ShopPage() {
  const catalogue = await listStoreProducts();
  const origin = appUrl();
  return (
    <div className="shop-pad mx-auto max-w-6xl">
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: "Home", path: "/" },
            { name: "Shop", path: "/shop" },
          ],
          origin,
        )}
      />
      <h1 className="shop-title font-medium tracking-tight">Shop</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Live quantity comes from stock, not the catalogue seed. Sold out means sold out.
      </p>
      {catalogue.unavailable ? (
        <p className="mt-4 text-sm text-danger">Inventory is unavailable, so checkout is closed.</p>
      ) : null}
      <ProductGrid products={catalogue.products} />
    </div>
  );
}
