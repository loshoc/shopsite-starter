import type { MetadataRoute } from "next";

import { absoluteUrl, robotsPolicy } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return robotsPolicy(absoluteUrl("/sitemap.xml"));
}
