import type { Metadata } from "next";

import { TextPage } from "@/components/shop/text-page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Privacy", path: "/privacy" });

export default function PrivacyPage() {
  return (
    <TextPage title="Privacy" lede="Policy not set yet.">
      <p>TODO: Replace me. This starter page is not a privacy policy.</p>
    </TextPage>
  );
}
