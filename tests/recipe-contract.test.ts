import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { recipeDataAttributes, storefrontRecipe } from "../data/recipe.ts";

test("recipe attributes follow the active storefront recipe", () => {
  assert.deepEqual(recipeDataAttributes(), {
    "data-recipe": storefrontRecipe.id,
    "data-density": storefrontRecipe.density,
    "data-chrome": storefrontRecipe.chrome,
  });
});

test("layout applies recipe attributes and does not ship a switcher", () => {
  const layout = fs.readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /recipeDataAttributes\(\)/);
  assert.equal(layout.includes("setRecipe"), false);
  assert.equal(fs.existsSync(new URL("../components/shop/theme-switcher.tsx", import.meta.url)), false);
});
