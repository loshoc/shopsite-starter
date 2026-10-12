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
    <footer className="mt-auto border-t border-sand">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-serif text-lg">{siteConfig.name}</p>
          <p className="mt-1 max-w-sm text-sm text-ink/70">
            Orders are confirmed in Stripe Checkout. Marketing email is not part of this kit.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="text-ink/70 hover:text-copper">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
