import Image from "next/image";

import { ProductMark } from "@/components/shop/product-mark";

export function ProductMedia({
  id,
  name,
  images,
  className = "",
}: {
  id: string;
  name: string;
  images: string[];
  className?: string;
}) {
  const src = images[0];
  if (!src) return <ProductMark id={id} className={className} />;
  return (
    <div className={`relative overflow-hidden bg-sand ${className}`}>
      <Image src={src} alt={name} fill className="object-cover" sizes="(min-width: 768px) 40vw, 100vw" />
    </div>
  );
}
