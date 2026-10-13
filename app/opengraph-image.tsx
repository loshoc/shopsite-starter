import { siteConfig } from "@/data/site.config";
import { ogContentType, ogSize, renderOgImage } from "@/lib/og";

export const alt = `${siteConfig.name}. ${siteConfig.tagline}`;
export const size = ogSize;
export const contentType = ogContentType;

export default function OpenGraphImage() {
  return renderOgImage(siteConfig.name, siteConfig.tagline);
}
