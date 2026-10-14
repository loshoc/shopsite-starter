import { ImagePlus } from "lucide-react";

/** Shown when a product has no image. Buyers replace it with a real photo. */
export function ProductImagePlaceholder({ className = "" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden text-muted ${className}`}>
      <div className="flex flex-col items-center gap-2 px-6 text-center">
        <ImagePlus className="size-5" strokeWidth={1.5} aria-hidden />
        <p className="text-sm">Replace me</p>
      </div>
    </div>
  );
}
