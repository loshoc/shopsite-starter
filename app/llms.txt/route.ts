import { products } from "@/data/products";
import { siteConfig } from "@/data/site.config";
import { appUrl } from "@/lib/app-url";
import { llmsTxt } from "@/lib/llms";

/** Built once. GET takes no arguments, so a query string cannot change the body. */
export const dynamic = "force-static";

export function llmsBody(): string {
  return llmsTxt({
    origin: appUrl(),
    brand: {
      name: siteConfig.name,
      tagline: siteConfig.tagline,
      description: siteConfig.description,
    },
    products: products.filter((product) => product.hidden !== true),
    currency: siteConfig.currency,
  });
}

export function GET(): Response {
  return new Response(llmsBody(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
