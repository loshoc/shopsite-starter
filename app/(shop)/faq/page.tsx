import type { Metadata } from "next";

import { TextPage } from "@/components/shop/text-page";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <TextPage title="FAQ" lede="Short answers for the demo shop.">
      <p>You can check out as a guest. Stripe collects the email.</p>
      <p>Coupons are promotion codes on the Stripe Checkout page. Tax uses Stripe Tax when the account has it turned on.</p>
      <p>If an item is sold out, checkout stops before a payment page is created.</p>
    </TextPage>
  );
}
