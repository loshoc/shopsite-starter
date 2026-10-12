import { getProductBySku } from "@/data/products";
import { requireAdminApi } from "@/lib/admin-guard";
import { adminJson } from "@/lib/http";
import { receiveAdminStock } from "@/lib/stock";
import { InventoryUnavailable, StockNotSeeded } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  let skuId = "";
  try {
    const body = (await request.json()) as { skuId?: unknown };
    if (typeof body.skuId === "string") skuId = body.skuId;
  } catch {
    skuId = "";
  }
  if (!getProductBySku(skuId)) return adminJson({ error: "Unknown SKU." }, 400);
  try {
    const received = await receiveAdminStock(skuId);
    return adminJson({ ok: true, received });
  } catch (error) {
    if (error instanceof StockNotSeeded) return adminJson({ error: error.message }, 409);
    if (error instanceof InventoryUnavailable) {
      return adminJson({ error: "Inventory store is unavailable." }, 503);
    }
    return adminJson({ error: "Could not receive stock." }, 500);
  }
}
