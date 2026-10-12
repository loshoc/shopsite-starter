import fs from "node:fs";
import path from "node:path";

export type DevStockFile = {
  quantities: Record<string, number>;
};

export function devStockPath(root = process.cwd()): string {
  return path.join(root, "data", "dev-stock.json");
}

/** In-memory dev stock persisted so a later process sees an idempotent seed. */
export function readDevStockQuantities(file = devStockPath()): Record<string, number> {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as DevStockFile;
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
  } catch {
    return {};
  }
}

export function writeDevStockQuantities(quantities: Record<string, number>, file = devStockPath()): void {
  const body: DevStockFile = { quantities };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(body, null, 2) + "\n");
}
