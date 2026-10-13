import { notFound } from "next/navigation";

import { getProduct } from "@/data/products";
import { siteConfig } from "@/data/site.config";
import { formatMoney } from "@/lib/format";
import { ogContentType, ogSize, renderOgImage } from "@/lib/og";

export const alt = siteConfig.name;
export const size = ogSize;
export const contentType = ogContentType;

export default async function ProductOpenGraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product || product.hidden) notFound();
  return renderOgImage(product.name, formatMoney(product.priceCents, siteConfig.currency));
}
