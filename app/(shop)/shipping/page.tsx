import type { Metadata } from "next";

import { TextPage } from "@/components/shop/text-page";

export const metadata: Metadata = { title: "Shipping" };

export default function ShippingPage() {
  return (
    <TextPage title="Shipping" lede="Demo copy. Replace it with your own promise.">
      <p>Checkout collects a US or Canadian shipping address. Rates, if you add them, belong in Stripe.</p>
      <p>This starter does not calculate shipping in the app. The bag subtotal is the catalogue price only.</p>
    </TextPage>
  );
}
