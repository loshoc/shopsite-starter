import type { Metadata } from "next";

import { DisclosureList } from "@/components/shop/disclosure";
import { siteConfig } from "@/data/site.config";
import { pageMetadata } from "@/lib/seo";
import { publishedFaqs } from "@/lib/storefront-ui";

export const metadata: Metadata = pageMetadata({ title: "FAQ", path: "/faq" });

export default function FaqPage() {
  const faqs = publishedFaqs(siteConfig.faqs);
  const items =
    faqs.length > 0
      ? faqs.map((item, index) => ({
          id: `${index}-${item.question}`,
          title: item.question,
          body: item.answer,
        }))
      : [
          {
            id: "replace",
            title: "TODO: Replace me",
            body: "Demo answers are not filled in. Replace this page before you go live.",
            open: true,
          },
        ];

  return (
    <article className="shop-pad mx-auto w-full max-w-2xl">
      <h1 className="shop-title font-medium tracking-tight">FAQ</h1>
      <div className="mt-6">
        <DisclosureList items={items} />
      </div>
    </article>
  );
}
