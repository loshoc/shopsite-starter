import { Instrument_Serif, Inter_Tight } from "next/font/google";

/** Storefront display. Exposes `--font-display` for Tailwind `--font-serif`. */
export const fontDisplay = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

/** Storefront body. Exposes `--font-body` for Tailwind `--font-sans`. */
export const fontBody = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-body",
});
