import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");

test("importing the template then building succeeds", { timeout: 240_000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "shopsite-import-"));
  try {
    fs.cpSync(root, tmp, {
      recursive: true,
      filter: (source) => {
        const rel = path.relative(root, source);
        if (!rel) return true;
        const top = rel.split(path.sep)[0];
        return top !== ".git" && top !== ".next" && top !== "node_modules";
      },
    });
    // Hardlink the dependency tree. A full copy duplicates React and breaks
    // prerender (`useContext` of null). A symlink is rejected by Turbopack
    // when the target sits outside the temp project.
    const linked = spawnSync("cp", ["-al", path.join(root, "node_modules"), path.join(tmp, "node_modules")]);
    assert.equal(linked.status, 0, linked.stderr?.toString());
    const imported = spawnSync("npm", ["run", "import:products", "--", "products-template.csv"], {
      cwd: tmp,
      encoding: "utf8",
    });
    assert.equal(imported.status, 0, imported.stderr + imported.stdout);
    assert.match(imported.stdout, /images\.remotePatterns:\n\(none\)/);
    const configPath = path.join(tmp, "next.config.ts");
    const catalogPath = path.join(tmp, "data", "products.generated.json");
    assert.doesNotMatch(fs.readFileSync(configPath, "utf8"), /hostname/);
    const products = JSON.parse(fs.readFileSync(catalogPath, "utf8")) as {
      products: { handle: string; images: string[]; description: string }[];
    };
    assert.equal(products.products.length, 3);
    assert.ok(products.products.every((product) => product.images.every((image) => image.startsWith("/products/"))));
    assert.doesNotMatch(JSON.stringify(products), /<script/i);
    const built = spawnSync("npm", ["run", "build"], {
      cwd: tmp,
      encoding: "utf8",
      env: { ...process.env, NEXT_PUBLIC_APP_URL: "https://shop.example.com" },
    });
    assert.equal(built.status, 0, `${built.stderr}\n${built.stdout}`.slice(-4000));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
