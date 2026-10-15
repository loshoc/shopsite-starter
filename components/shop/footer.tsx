import Link from "next/link";

import { siteConfig } from "@/data/site.config";

const links = [
  ["/shipping", "Shipping"],
  ["/returns", "Returns"],
  ["/faq", "FAQ"],
  ["/privacy", "Privacy"],
  ["/terms", "Terms"],
] as const;

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="shop-footer mx-auto flex max-w-6xl flex-col sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium">{siteConfig.name}</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Replace this line with your store footer.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="text-muted hover:text-fg">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
