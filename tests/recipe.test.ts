import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  recipeDataAttributes,
  recipePalettes,
  recipeTokenVars,
  storefrontRecipe,
  type RecipeId,
  type RecipeTokens,
} from "../data/recipe.ts";
import { theme } from "../lib/theme.ts";

const recipesDir = new URL("../app/recipes/", import.meta.url);

function readRecipeCss(id: RecipeId): string {
  return fs.readFileSync(new URL(`${id}.css`, recipesDir), "utf8");
}

function assertPalette(css: string, id: RecipeId, palette: RecipeTokens) {
  assert.match(css, new RegExp(`html\\[data-recipe="${id}"\\]`));
  for (const [key, cssVar] of Object.entries(recipeTokenVars)) {
    const hex = palette[key as keyof RecipeTokens];
    assert.match(css, new RegExp(`${cssVar}: ${hex};`));
  }
}

test("ship default is comfortable, bare, and cool sparse", () => {
  assert.equal(storefrontRecipe.id, "default");
  assert.equal(storefrontRecipe.density, "comfortable");
  assert.equal(storefrontRecipe.chrome, "bare");
  assert.deepEqual(recipeDataAttributes(), {
    "data-recipe": "default",
    "data-density": "comfortable",
    "data-chrome": "bare",
  });
  assert.equal(recipePalettes.default.bg, "#fafaf8");
  assert.equal(recipePalettes.default.surface, "#ffffff");
  assert.equal(recipePalettes.default.fg, "#111111");
  assert.deepEqual(theme, recipePalettes.default);
});

test("recipe css files mirror the palette packs", () => {
  const globals = fs.readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  for (const id of ["default", "ink", "sand"] as const) {
    assert.match(globals, new RegExp(`@import "./recipes/${id}.css"`));
    assertPalette(readRecipeCss(id), id, recipePalettes[id]);
  }
  assert.notEqual(recipePalettes.ink.bg, recipePalettes.default.bg);
  assert.notEqual(recipePalettes.ink.fg, recipePalettes.default.fg);
  assert.notEqual(recipePalettes.sand.bg, recipePalettes.default.bg);
  assert.equal(recipePalettes.sand.bg, "#f3eee6");
  assert.equal(readRecipeCss("ink").includes("color-scheme: dark"), true);
  assert.equal(readRecipeCss("default").includes("#f3eee6"), false);
  assert.equal(readRecipeCss("default").includes("#9c4324"), false);
  assert.equal(globals.includes("#f3eee6"), false);
  assert.equal(globals.includes("#9c4324"), false);
});

test("density and chrome tokens cover both rhythms and all three frames", () => {
  const css = fs.readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const comfortable = css.slice(
    css.indexOf('html[data-density="comfortable"]'),
    css.indexOf('html[data-density="compact"]'),
  );
  const compact = css.slice(
    css.indexOf('html[data-density="compact"]'),
    css.indexOf('html[data-chrome="bare"]'),
  );
  const bare = css.slice(css.indexOf('html[data-chrome="bare"]'), css.indexOf('html[data-chrome="ruled"]'));
  const ruled = css.slice(css.indexOf('html[data-chrome="ruled"]'), css.indexOf('html[data-chrome="soft-card"]'));
  const soft = css.slice(css.indexOf('html[data-chrome="soft-card"]'), css.indexOf(".shop-pad"));

  assert.match(comfortable, /--type-step: 0;/);
  assert.match(comfortable, /--section-x: 1\.25rem;/);
  assert.match(comfortable, /--section-y: 2rem;/);
  assert.match(comfortable, /--section-y-loose: 4rem;/);
  assert.match(comfortable, /--card-gap: 2rem;/);
  assert.match(comfortable, /--stack-gap: 1\.5rem;/);
  assert.match(comfortable, /--header-y: 1rem;/);
  assert.match(comfortable, /--footer-y: 2\.5rem;/);
  assert.match(comfortable, /--card-title-gap: 0\.75rem;/);

  assert.match(compact, /--type-step: -1;/);
  assert.match(compact, /--section-y: 1\.25rem;/);
  assert.match(compact, /--card-gap: 1rem;/);
  assert.equal(compact.includes("--section-y: 2rem;"), false);

  assert.match(bare, /--card-border-width: 0px;/);
  assert.match(bare, /--card-shadow: none;/);
  assert.match(bare, /--card-radius: 0px;/);
  assert.match(bare, /--card-bg: transparent;/);
  assert.match(ruled, /--card-border-width: 1px;/);
  assert.match(ruled, /--card-border-color: var\(--border\);/);
  assert.match(ruled, /--card-shadow: none;/);
  assert.match(soft, /--card-radius: 1rem;/);
  assert.match(soft, /--card-bg: var\(--surface\);/);
  assert.match(soft, /--card-shadow: 0 1px 2px/);
  assert.equal(soft.includes("--card-shadow: none;"), false);

  assert.match(css, /\.shop-title \{[^}]*var\(--type-step\)/);
  assert.match(css, /\.shop-display \{[^}]*var\(--type-step\)/);
  assert.match(css, /\.shop-card-title \{[^}]*var\(--type-step\)/);
  assert.match(css, /\.shop-card,\s*\.shop-frame \{/);
});

test("html carries the recipe attributes and there is no switcher", () => {
  const layout = fs.readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const shop = fs.readFileSync(new URL("../components/shop/product-card.tsx", import.meta.url), "utf8");
  assert.match(layout, /recipeDataAttributes\(\)/);
  assert.match(shop, /shop-card/);
  assert.equal(layout.includes("setRecipe"), false);
  assert.equal(fs.existsSync(new URL("../components/shop/theme-switcher.tsx", import.meta.url)), false);
});
