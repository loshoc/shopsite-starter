import { descriptionText } from "@/lib/description-text";
import { absoluteUrl, siteDescription } from "@/lib/seo";

/**
 * JSON-LD for a `<script>` tag. `<` is escaped so a catalog string cannot
 * close the script element (`</script>`).
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function centsToPrice(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.trunc(cents));
  const dollars = Math.floor(abs / 100);
  const rem = abs % 100;
  return `${sign}${dollars}.${rem.toString().padStart(2, "0")}`;
}

export type JsonLdVariant = {
  skuId: string;
  priceCents: number;
  orderable: boolean;
};

export type JsonLdProduct = {
  hidden?: boolean;
  name: string;
  description: string;
  skuId: string;
  priceCents: number;
  images: string[];
  orderable: boolean;
  storeVariants?: JsonLdVariant[];
};

/**
 * Hidden products are omitted. Out-of-stock offers stay OutOfStock.
 * `orderable` is live stock, not the catalogue seed. There is no review
 * source, so this object never includes Review or AggregateRating.
 */
export function productJsonLd(
  product: JsonLdProduct,
  pageUrl: string,
  currency: string,
  origin: string,
): Record<string, unknown> | null {
  if (product.hidden) return null;
  const variants =
    product.storeVariants && product.storeVariants.length > 0
      ? product.storeVariants
      : [{ skuId: product.skuId, priceCents: product.priceCents, orderable: product.orderable }];
  const priceCurrency = currency.toUpperCase();
  const offers = variants.map((variant) => ({
    "@type": "Offer",
    sku: variant.skuId,
    price: centsToPrice(variant.priceCents),
    priceCurrency,
    availability: variant.orderable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    url: pageUrl,
  }));
  const images = product.images
    .map((src) => absoluteImage(origin, src))
    .filter((src): src is string => Boolean(src));
  const description = descriptionText(product.description);
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.skuId,
    url: pageUrl,
    offers:
      offers.length === 1
        ? offers[0]
        : {
            "@type": "AggregateOffer",
            priceCurrency,
            lowPrice: centsToPrice(Math.min(...variants.map((variant) => variant.priceCents))),
            highPrice: centsToPrice(Math.max(...variants.map((variant) => variant.priceCents))),
            offerCount: offers.length,
            offers,
          },
  };
  if (description) data.description = description;
  if (images.length > 0) data.image = images;
  return data;
}

const placeholderFaq = /todo:\s*replace me/i;

export function faqPageJsonLd(
  faqs: readonly { question: string; answer: string }[],
  pageUrl?: string,
): Record<string, unknown> | null {
  const mainEntity = publishedFaqPairs(faqs).map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  }));
  if (mainEntity.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    ...(pageUrl ? { url: pageUrl } : {}),
    mainEntity,
  };
}

/**
 * A disclosure is a FAQ only when it is a real question and answer.
 * A section label such as "Details" is not. Question-and-answer blocks
 * inside that body are, when each question is its own line ending in "?".
 */
export function disclosureFaqs(
  items: readonly { title: string; body: string }[],
): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];
  for (const item of items) {
    const title = item.title.trim();
    const body = item.body.trim();
    if (!title || !body || placeholderFaq.test(title) || placeholderFaq.test(body)) continue;
    if (title.endsWith("?")) {
      faqs.push({ question: title, answer: body });
      continue;
    }
    faqs.push(...faqsFromProse(body));
  }
  return publishedFaqPairs(faqs);
}

function faqsFromProse(body: string): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];
  for (const block of body.split(/\n\s*\n/)) {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (lines.length < 2) continue;
    const question = lines[0] ?? "";
    if (!question.endsWith("?") || placeholderFaq.test(question)) continue;
    const answer = lines.slice(1).join("\n").trim();
    if (!answer || placeholderFaq.test(answer)) continue;
    faqs.push({ question, answer });
  }
  return faqs;
}

function publishedFaqPairs(
  faqs: readonly { question: string; answer: string }[],
): { question: string; answer: string }[] {
  const seen = new Set<string>();
  const cleaned: { question: string; answer: string }[] = [];
  for (const item of faqs) {
    const question = item.question.trim();
    const answer = item.answer.trim();
    if (!question || !answer) continue;
    if (placeholderFaq.test(question) || placeholderFaq.test(answer)) continue;
    if (seen.has(question)) continue;
    seen.add(question);
    cleaned.push({ question, answer });
  }
  return cleaned;
}

export function organizationWebSiteJsonLd(
  config: { name: string; tagline: string; description: string },
  origin: string,
): Record<string, unknown> {
  const name = config.name.trim() || "Store";
  const summary = siteDescription({ name: config.name, tagline: config.tagline });
  const about = config.description.trim() || summary;
  const organizationId = `${origin}/#organization`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name,
        url: origin,
        ...(about ? { description: about } : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        name,
        url: origin,
        ...(summary ? { description: summary } : {}),
        publisher: { "@id": organizationId },
      },
    ],
  };
}

export function breadcrumbJsonLd(
  items: readonly { name: string; path: string }[],
  origin: string,
): Record<string, unknown> | null {
  const crumbs = items
    .map((item) => ({ name: item.name.trim(), path: item.path }))
    .filter((item) => item.name.length > 0);
  if (crumbs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path, origin),
    })),
  };
}

function absoluteImage(origin: string, src: string): string | null {
  if (!src) return null;
  if (src.startsWith("/")) return `${origin}${src}`;
  try {
    const url = new URL(src);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.href;
  } catch {
    return null;
  }
}
