import { products } from "@/data/products";
import { siteConfig } from "@/data/site.config";
import { appUrl } from "@/lib/app-url";
import { descriptionText } from "@/lib/description-text";
import { centsToPrice } from "@/lib/json-ld";
import { absoluteUrl, productPath, publicPaths, siteDescription } from "@/lib/seo";

const pageCopy: Record<string, { label: string; blurb: string }> = {
  "/": { label: "Home", blurb: "" },
  "/shop": { label: "Shop", blurb: "Product catalogue." },
  "/shipping": { label: "Shipping", blurb: "Shipping page." },
  "/returns": { label: "Returns", blurb: "Returns page." },
  "/faq": { label: "FAQ", blurb: "Questions and answers." },
  "/privacy": { label: "Privacy", blurb: "Privacy page." },
  "/terms": { label: "Terms", blurb: "Terms page." },
};

type LlmsProduct = {
  id: string;
  name: string;
  description: string;
  hidden?: boolean;
  priceCents: number;
  variants?: readonly { priceCents: number }[];
};

/**
 * Public store summary for answer engines.
 * Uses the store name, tagline, description, and visible catalogue rows only.
 * Hidden products (including unpublished imports) are omitted.
 * No customer records, support inbox, or environment values.
 */
export function llmsTxt(input: {
  origin: string;
  brand: { name: string; tagline: string; description: string };
  products: readonly LlmsProduct[];
  currency: string;
}): string {
  const name = input.brand.name.trim() || "Store";
  const summary = siteDescription({ name: input.brand.name, tagline: input.brand.tagline });
  const about = input.brand.description.trim();
  const blocks: string[] = [`# ${name}`];
  if (summary) blocks.push(`> ${summary}`);
  if (about && about !== summary) blocks.push(about);

  const pages = publicPaths
    .map((page) => {
      const copy = pageCopy[page.path];
      const blurb = page.path === "/" ? summary : (copy?.blurb ?? "");
      return link(copy?.label ?? page.path, absoluteUrl(page.path, input.origin), blurb);
    })
    .join("\n");
  blocks.push(`## Pages\n\n${pages}`);

  const products = input.products.filter((product) => product.hidden !== true);
  if (products.length > 0) {
    const lines = products
      .map((product) =>
        link(
          product.name,
          absoluteUrl(productPath(encodeURIComponent(product.id)), input.origin),
          productDetail(product, input.currency),
        ),
      )
      .join("\n");
    blocks.push(`## Products\n\n${lines}`);
  }

  return `${blocks.join("\n\n")}\n`;
}

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

function productDetail(product: LlmsProduct, currency: string): string {
  return [descriptionText(product.description), listedPrice(product, currency)].filter(Boolean).join(" ");
}

function listedPrice(product: LlmsProduct, currency: string): string {
  const amounts =
    product.variants && product.variants.length > 0
      ? product.variants.map((variant) => variant.priceCents)
      : [product.priceCents];
  const prices = amounts.filter((cents) => Number.isFinite(cents));
  if (prices.length === 0) return "";
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const code = currency.trim().toUpperCase() || "USD";
  if (low === high) return `${centsToPrice(low)} ${code}`;
  return `${centsToPrice(low)}–${centsToPrice(high)} ${code}`;
}

function link(label: string, url: string, detail: string): string {
  const text = markdownLabel(label) || url;
  const extra = detail.replace(/\s+/g, " ").trim();
  return extra ? `- [${text}](${url}): ${extra}` : `- [${text}](${url})`;
}

function markdownLabel(value: string): string {
  return value
    .replace(/[\[\]]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
