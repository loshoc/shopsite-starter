import type { Metadata } from "next";

import { TextPage } from "@/components/shop/text-page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Terms", path: "/terms" });

export default function TermsPage() {
  return (
    <TextPage title="Terms" lede="Policy not set yet.">
      <p>TODO: Replace me. This starter page is not terms of sale.</p>
    </TextPage>
  );
}
