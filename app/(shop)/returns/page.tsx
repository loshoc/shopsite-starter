import type { Metadata } from "next";

import { TextPage } from "@/components/shop/text-page";
import { siteConfig } from "@/data/site.config";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Returns", path: "/returns" });

export default function ReturnsPage() {
  return (
    <TextPage title="Returns" lede="Policy not set yet.">
      <p>TODO: Replace me. This starter page is not a returns policy.</p>
      <p>Contact {siteConfig.supportEmail}.</p>
    </TextPage>
  );
}
