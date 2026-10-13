import { descriptionText } from "@/lib/description-text";

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

/** Hidden products are omitted. Out-of-stock offers stay OutOfStock. */
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
