import type { NextConfig } from "next";

import { assertProductionAppUrl } from "./lib/app-url";

assertProductionAppUrl();

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // No includeSubDomains or preload: a buyer's other subdomains may still be http.
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      /* import:remotePatterns */
      /* import:remotePatterns:end */
    ],
  },
  // Cache Components stay off. Live stock, Checkout, and admin sessions are
  // request-dynamic; the flag forces a Suspense model this spine does not need.
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
