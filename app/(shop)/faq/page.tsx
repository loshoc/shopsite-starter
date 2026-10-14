import type { Metadata } from "next";

import { TextPage } from "@/components/shop/text-page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "FAQ", path: "/faq" });

export default function FaqPage() {
  return (
    <TextPage title="FAQ" lede="TODO: Replace me.">
      <p>Demo answers are not filled in. Replace this page before you go live.</p>
    </TextPage>
  );
}
