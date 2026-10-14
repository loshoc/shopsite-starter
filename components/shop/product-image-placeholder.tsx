import { ImagePlus } from "lucide-react";

/** Shown when a product has no image. Buyers replace it with a real photo. */
export function ProductImagePlaceholder({ className = "" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-border text-fg ${className}`}>
      <div className="pointer-events-none absolute inset-4 border border-dashed border-fg/20" aria-hidden />
      <div className="relative flex flex-col items-center gap-3 px-6 text-center">
        <ImagePlus className="size-7 text-fg/45" strokeWidth={1.25} aria-hidden />
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-fg/70">Replace me</p>
      </div>
    </div>
  );
}
