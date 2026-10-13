import fs from "node:fs";
import path from "node:path";

export type DevStockFile = {
  quantities: Record<string, number>;
};

/** Fixed path so the Next server trace stays inside data/, not the whole repo. */
const DEV_STOCK_FILE = path.join(process.cwd(), "data", "dev-stock.json");

export function devStockPath(root = process.cwd()): string {
  return path.join(root, "data", "dev-stock.json");
}

export function readDevStockQuantities(): Record<string, number> {
  try {
    const parsed = JSON.parse(fs.readFileSync(DEV_STOCK_FILE, "utf8")) as DevStockFile;
    return quantitiesFrom(parsed);
  } catch {
    return {};
  }
}

export function writeDevStockQuantities(quantities: Record<string, number>): void {
  const body: DevStockFile = { quantities };
  fs.mkdirSync(path.dirname(DEV_STOCK_FILE), { recursive: true });
  fs.writeFileSync(DEV_STOCK_FILE, JSON.stringify(body, null, 2) + "\n");
}

function quantitiesFrom(parsed: DevStockFile): Record<string, number> {
  if (!parsed || typeof parsed !== "object" || !parsed.quantities || typeof parsed.quantities !== "object") {
    return {};
  }
  const quantities: Record<string, number> = {};
  for (const [skuId, qty] of Object.entries(parsed.quantities)) {
    if (typeof qty === "number" && Number.isInteger(qty) && qty >= 0 && qty <= 1_000_000) {
      quantities[skuId] = qty;
    }
  }
  return quantities;
}
