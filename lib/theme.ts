/**
 * Hex mirrors of the active storefront recipe in `data/recipe.ts`.
 * `next/og` ImageResponse cannot read CSS variables.
 * The ship default is Cool sparse (`id: "default"`), which matches `:root`
 * in `app/globals.css`. Flip `storefrontRecipe.id` and this object follows.
 */
import { recipePalettes, storefrontRecipe } from "@/data/recipe";

export const theme = recipePalettes[storefrontRecipe.id];
