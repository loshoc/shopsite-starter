import type { Metadata } from "next";

import { siteConfig } from "@/data/site.config";

import { appUrl } from "@/lib/app-url";

/** `Shop {storeName}. {tagline}.` Tagline punctuation is normalized to one period. */
export function siteDescription(config: { name: string; tagline: string } = siteConfig): string {
  const name = config.name.trim();
  const tagline = config.tagline.trim().replace(/\.+$/, "");
  return `Shop ${name}. ${tagline}.`;
}

export function metaDescription(value: string, fallback = siteDescription()): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  if (clean.length <= 160) return clean;
  const slice = clean.slice(0, 157);
  const space = slice.lastIndexOf(" ");
  const cut = space > 100 ? slice.slice(0, space) : slice;
  return `${cut.trim()}...`;
}

export const publicPaths = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/shop", changeFrequency: "weekly", priority: 0.8 },
  { path: "/shipping", changeFrequency: "yearly", priority: 0.3 },
  { path: "/returns", changeFrequency: "yearly", priority: 0.3 },
  { path: "/faq", changeFrequency: "yearly", priority: 0.4 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
] as const;

/** Checkout receipts and operations. Not linked from the public sitemap. */
export const robotsDisallow = ["/admin", "/api", "/success", "/cancel"] as const;

export function productPath(id: string): string {
  return `/products/${id}`;
}

export function absoluteUrl(path: string, origin = appUrl()): string {
  if (path === "/" || path === "") return origin;
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${suffix}`;
}

export type SitemapEntry = {
  url: string;
  changeFrequency: "weekly" | "yearly" | "monthly";
  priority: number;
};

export function sitemapEntries(
  origin: string,
  products: readonly { id: string; hidden?: boolean }[],
): SitemapEntry[] {
  const pages: SitemapEntry[] = publicPaths.map((page) => ({
    url: absoluteUrl(page.path, origin),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
  const visible = products
    .filter((product) => !product.hidden)
    .map((product) => ({
      url: absoluteUrl(productPath(product.id), origin),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  return [...pages, ...visible];
}

const ogImageSize = { width: 1200, height: 630 };

export function pageMetadata(input: {
  title?: string;
  description?: string;
  path: string;
  index?: boolean;
  /**
   * Image route relative to metadataBase.
   * Omit to use the root card. Pass false on routes whose own
   * opengraph-image file should supply the URL (dynamic segments inside
   * a route group get a hashed path).
   */
  imagePath?: string | false;
  imageAlt?: string;
}): Metadata {
  const description = input.description ?? siteDescription();
  const socialTitle = input.title ? `${input.title} · ${siteConfig.name}` : siteConfig.name;
  const image =
    input.imagePath === false
      ? undefined
      : {
          url: input.imagePath ?? "/opengraph-image",
          width: ogImageSize.width,
          height: ogImageSize.height,
          alt: input.imageAlt ?? `${siteConfig.name}. ${siteConfig.tagline}`,
        };
  return {
    ...(input.title ? { title: input.title } : {}),
    description,
    alternates: { canonical: input.path },
    openGraph: {
      title: socialTitle,
      description,
      url: input.path,
      siteName: siteConfig.name,
      type: "website",
      locale: "en_US",
      ...(image ? { images: [image] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      ...(image ? { images: [image.url] } : {}),
    },
    ...(input.index === false ? { robots: { index: false, follow: false } } : {}),
  };
}
