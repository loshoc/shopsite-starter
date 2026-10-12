import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const catalogPath = path.join(root, "data", "products.generated.json");
const configPath = path.join(root, "next.config.ts");

test("importing the template then building succeeds", { timeout: 180_000 }, () => {
  const catalog = fs.readFileSync(catalogPath);
  const config = fs.readFileSync(configPath);
  try {
    const imported = spawnSync("npm", ["run", "import:products", "--", "products-template.csv"], {
      cwd: root,
      encoding: "utf8",
    });
    assert.equal(imported.status, 0, imported.stderr + imported.stdout);
    assert.match(imported.stdout, /images\.remotePatterns:\n\(none\)/);
    assert.doesNotMatch(fs.readFileSync(configPath, "utf8"), /hostname/);
    const products = JSON.parse(fs.readFileSync(catalogPath, "utf8")) as {
      products: { handle: string; images: string[]; description: string }[];
    };
    assert.equal(products.products.length, 3);
    assert.ok(products.products.every((product) => product.images.every((image) => image.startsWith("/products/"))));
    assert.doesNotMatch(JSON.stringify(products), /<script/i);
    const built = spawnSync("npm", ["run", "build"], { cwd: root, encoding: "utf8" });
    assert.equal(built.status, 0, built.stderr.slice(-2000) + "\n" + built.stdout.slice(-2000));
  } finally {
    fs.writeFileSync(catalogPath, catalog);
    fs.writeFileSync(configPath, config);
  }
});
