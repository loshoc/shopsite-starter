import fs from "node:fs";
import path from "node:path";

type DevStockFile = {
  quantities: Record<string, number>;
};

/** Test and CLI helper. The Next server reads the fixed path in lib/dev-stock.ts instead. */
export function readStockFile(file: string): Record<string, number> {
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

export function writeStockFile(quantities: Record<string, number>, file: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ quantities }, null, 2) + "\n");
}
