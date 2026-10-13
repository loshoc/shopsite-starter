import fs from "node:fs";
import path from "node:path";

import { configuredDatabaseUrl, productionDatabaseProblem } from "../lib/database-url.ts";
import { devStockPath } from "../lib/dev-stock.ts";
import { importProductCsv, serializeCatalog } from "../lib/import/pipeline.ts";
import { applyRemotePatterns, formatPatternReport } from "../lib/import/remote-patterns.ts";
import { seedStockRows } from "../lib/import/seed-stock.ts";

const USAGE = "Usage: npm run import:products -- <file.csv> [--seed-stock] [--force]";

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const args = process.argv.slice(2);
let file: string | null = null;
let seed = false;
let force = false;

for (const arg of args) {
  if (arg === "--seed-stock") {
    seed = true;
    continue;
  }
  if (arg === "--force") {
    force = true;
    continue;
  }
  if (arg === "--help" || arg === "-h") {
    console.log(USAGE);
    process.exit(0);
  }
  if (arg.startsWith("-")) fail(`Unknown flag "${arg}".\n${USAGE}`);
  if (file) fail(`Unexpected extra argument "${arg}".\n${USAGE}`);
  file = arg;
}

if (!file) fail(USAGE);
if (force && !seed) fail(`--force requires --seed-stock.\n${USAGE}`);

const csvPath = path.resolve(file);
if (!fs.existsSync(csvPath)) fail(`CSV file not found: ${file}`);
const stat = fs.statSync(csvPath);
if (!stat.isFile()) fail(`CSV path is not a file: ${file}`);

if (seed) {
  const problem = productionDatabaseProblem();
  if (problem) fail(problem);
}

const root = process.cwd();
const result = importProductCsv(fs.readFileSync(csvPath, "utf8"), {
  publicDir: path.join(root, "public"),
});

for (const warning of result.warnings) console.error(warning);
if (result.errors.length > 0) {
  for (const error of result.errors) console.error(error);
  process.exit(1);
}

const catalogPath = path.join(root, "data", "products.generated.json");
fs.writeFileSync(catalogPath, serializeCatalog(result.products));

const configPath = path.join(root, "next.config.ts");
const nextConfig = applyRemotePatterns(fs.readFileSync(configPath, "utf8"), result.patterns);
fs.writeFileSync(configPath, nextConfig);

const variantCount = result.products.reduce((sum, product) => sum + product.variants.length, 0);
console.log(
  `Imported ${result.products.length} products (${variantCount} variants) from ${file} (${result.format}).`,
);
console.log("Wrote data/products.generated.json.");
console.log(formatPatternReport(result.patterns));
console.log("Updated next.config.ts.");

if (seed) {
  try {
    const seeded = await seedStockRows(result.stock, {
      force,
      databaseUrl: configuredDatabaseUrl(),
      filePath: devStockPath(root),
    });
    console.log(
      `Stock seed (${seeded.mode}): inserted ${seeded.counts.inserted}, updated ${seeded.counts.updated}, skipped ${seeded.counts.skipped}.`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stock seed failed.";
    fail(message);
  }
}
