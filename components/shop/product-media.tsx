import Image from "next/image";

import { ProductImagePlaceholder } from "@/components/shop/product-image-placeholder";

export function ProductMedia({
  name,
  images,
  className = "",
}: {
  name: string;
  images: string[];
  className?: string;
}) {
  const src = images[0]?.trim();
  if (!src) return <ProductImagePlaceholder className={className} />;
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image src={src} alt={name} fill className="object-cover" sizes="(min-width: 768px) 40vw, 100vw" />
    </div>
  );
}
