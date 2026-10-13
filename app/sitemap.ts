import type { MetadataRoute } from "next";

import { products } from "@/data/products";
import { appUrl } from "@/lib/app-url";
import { sitemapEntries } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries(appUrl(), products);
}
