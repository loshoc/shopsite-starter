import { products } from "@/data/products";
import { siteConfig } from "@/data/site.config";
import { appUrl } from "@/lib/app-url";
import { llmsTxt } from "@/lib/llms";

export function GET() {
  const body = llmsTxt({
    origin: appUrl(),
    brand: {
      name: siteConfig.name,
      tagline: siteConfig.tagline,
      description: siteConfig.description,
    },
    products,
    currency: siteConfig.currency,
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
