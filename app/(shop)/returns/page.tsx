import type { Metadata } from "next";

import { TextPage } from "@/components/shop/text-page";
import { siteConfig } from "@/data/site.config";

export const metadata: Metadata = { title: "Returns" };

export default function ReturnsPage() {
  return (
    <TextPage title="Returns" lede="Refunds happen in the Stripe Dashboard.">
      <p>A full refund can return the reserved units to stock. A partial refund does not. An admin restocks a partial refund by hand.</p>
      <p>Write to {siteConfig.supportEmail} for the human version of this policy.</p>
    </TextPage>
  );
}
