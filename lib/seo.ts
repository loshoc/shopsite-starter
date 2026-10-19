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

/**
 * Crawlers named in `/robots.txt` so a buyer can allow or block them as a group.
 * `GEO_ALLOW_AI_CRAWLERS=1` (the default when unset) allows them on public pages.
 * `0` disallows them. Private paths stay disallowed either way.
 * `GEO_KEEP_BINGBOT=1` keeps Bingbot on public pages when that group is off.
 * Unset, or any value other than `1`, leaves Bingbot in the group.
 */
export const aiCrawlerAgents = [
  "GPTBot",
  "Google-Extended",
  "PerplexityBot",
  "ClaudeBot",
  "Bingbot",
] as const;

const aiCrawlerOff = new Set(["0", "false", "no", "off"]);

export function allowAiCrawlers(
  value: string | null | undefined = process.env.GEO_ALLOW_AI_CRAWLERS,
): boolean {
  const raw = (value ?? "").trim().toLowerCase();
  if (!raw) return true;
  return !aiCrawlerOff.has(raw);
}

/** True only for `GEO_KEEP_BINGBOT=1`. Unset and every other value stay off. */
export function keepBingbot(
  value: string | null | undefined = process.env.GEO_KEEP_BINGBOT,
): boolean {
  return (value ?? "").trim() === "1";
}

export type RobotsRule = {
  userAgent: string | string[];
  allow?: string;
  disallow: string | string[];
};

export type RobotsDocument = {
  rules: RobotsRule[];
  sitemap: string;
};

export function robotsPolicy(
  sitemap: string,
  allowAi = allowAiCrawlers(),
  keepBing = keepBingbot(),
): RobotsDocument {
  const agents = [...aiCrawlerAgents];
  const blocked = [...robotsDisallow];
  const separateBingbot = keepBing && !allowAi;
  const group = separateBingbot ? agents.filter((agent) => agent !== "Bingbot") : agents;
  const ai: RobotsRule = allowAi
    ? { userAgent: group, allow: "/", disallow: blocked }
    : { userAgent: group, disallow: ["/", ...blocked] };
  const rules: RobotsRule[] = [
    {
      userAgent: "*",
      allow: "/",
      disallow: blocked,
    },
    ai,
  ];
  if (separateBingbot) {
    rules.push({
      userAgent: "Bingbot",
      allow: "/",
      disallow: blocked,
    });
  }
  return { rules, sitemap };
}

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
