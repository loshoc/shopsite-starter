import type { Metadata } from "next";

import { TextPage } from "@/components/shop/text-page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Shipping", path: "/shipping" });

export default function ShippingPage() {
  return (
    <TextPage title="Shipping" lede="Policy not set yet.">
      <p>TODO: Replace me. This starter page is not a shipping policy.</p>
    </TextPage>
  );
}
