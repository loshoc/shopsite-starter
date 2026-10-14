import type { Metadata } from "next";

import { siteConfig } from "@/data/site.config";
import { appUrl } from "@/lib/app-url";
import { siteDescription } from "@/lib/seo";

import { fontBody, fontDisplay } from "./fonts";
import "./globals.css";

const description = siteDescription();

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  description,
  openGraph: {
    title: siteConfig.name,
    description,
    url: "/",
    siteName: siteConfig.name,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontBody.variable} ${fontDisplay.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans antialiased">{children}</body>
    </html>
  );
}
