import { sanitizeDescription } from "@/lib/sanitize-description";

/** Renders catalogue copy only after the allowlist sanitizer runs. */
export function ProductDescription({ html, className = "" }: { html: string; className?: string }) {
  const safe = sanitizeDescription(html);
  if (!safe) return null;
  return <div className={`shop-copy ${className}`} dangerouslySetInnerHTML={{ __html: safe }} />;
}
