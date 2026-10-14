/** Plain grey stand-in when a product has no image. */
export function ProductImagePlaceholder({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-[#e6e6e4] text-sm text-muted ${className}`}>
      <p>Replace me</p>
    </div>
  );
}
