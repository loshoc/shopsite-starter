/**
 * Storefront presentation. Edit this file and rebuild.
 * There is no runtime theme switcher.
 *
 * Ship default: Cool sparse (`default`) + comfortable density + bare chrome.
 * `default` matches `:root` in `app/globals.css` (`#fafaf8` / `#ffffff` / `#111111`).
 * Open Graph colors follow the active id via `lib/theme.ts`.
 */

export const recipeIds = ["default", "ink", "sand"] as const;
export type RecipeId = (typeof recipeIds)[number];

export const densityValues = ["comfortable", "compact"] as const;
export type Density = (typeof densityValues)[number];

export const chromeValues = ["bare", "ruled", "soft-card"] as const;
export type Chrome = (typeof chromeValues)[number];

export const storefrontRecipe = {
  id: "default",
  density: "comfortable",
  chrome: "bare",
} as const satisfies {
  id: RecipeId;
  density: Density;
  chrome: Chrome;
};

export type RecipeTokens = {
  bg: string;
  surface: string;
  fg: string;
  muted: string;
  border: string;
  accent: string;
  accentFg: string;
  highlight: string;
  success: string;
  danger: string;
  ring: string;
};

/** CSS custom property for each token. `accentFg` is `--accent-fg`. */
export const recipeTokenVars = {
  bg: "--bg",
  surface: "--surface",
  fg: "--fg",
  muted: "--muted",
  border: "--border",
  accent: "--accent",
  accentFg: "--accent-fg",
  highlight: "--highlight",
  success: "--success",
  danger: "--danger",
  ring: "--ring",
} as const satisfies Record<keyof RecipeTokens, string>;

/**
 * Color packs. CSS files in `app/recipes/` mirror these hexes.
 * `default` is Cool sparse. `ink` is dark cinematic. `sand` is warmer paper.
 */
export const recipePalettes = {
  default: {
    bg: "#fafaf8",
    surface: "#ffffff",
    fg: "#111111",
    muted: "#5c5c5c",
    border: "#e8e8e8",
    accent: "#111111",
    accentFg: "#ffffff",
    highlight: "#b42318",
    success: "#166534",
    danger: "#b42318",
    ring: "#111111",
  },
  ink: {
    bg: "#0e0f12",
    surface: "#17191f",
    fg: "#f3efe6",
    muted: "#a8a294",
    border: "#2e313a",
    accent: "#f3efe6",
    accentFg: "#0e0f12",
    highlight: "#d7b074",
    success: "#8eae96",
    danger: "#e36a5d",
    ring: "#d7b074",
  },
  sand: {
    bg: "#f3eee6",
    surface: "#faf7f2",
    fg: "#1b1714",
    muted: "#6b635b",
    border: "#e4d7c4",
    accent: "#1b1714",
    accentFg: "#faf7f2",
    highlight: "#9c4324",
    success: "#24382c",
    danger: "#b42318",
    ring: "#9c4324",
  },
} as const satisfies Record<RecipeId, RecipeTokens>;

export function recipeDataAttributes(
  recipe: { id: RecipeId; density: Density; chrome: Chrome } = storefrontRecipe,
) {
  return {
    "data-recipe": recipe.id,
    "data-density": recipe.density,
    "data-chrome": recipe.chrome,
  };
}
