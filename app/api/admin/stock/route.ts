import { requireAdminApi } from "@/lib/admin-guard";
import { adminJson } from "@/lib/http";
import { listAdminStock, parseStockDrafts, saveAdminStock } from "@/lib/stock";
import { InventoryUnavailable, StockNotSeeded } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;
  try {
    return adminJson(await listAdminStock());
  } catch (error) {
    if (error instanceof InventoryUnavailable) {
      return adminJson({ error: "Inventory store is unavailable." }, 503);
    }
    return adminJson({ error: "Could not load stock." }, 500);
  }
}

export async function PUT(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return adminJson({ error: "Invalid stock payload." }, 400);
  }
  const drafts = parseStockDrafts(body);
  if (!drafts) return adminJson({ error: "Invalid stock payload." }, 400);
  try {
    await saveAdminStock(drafts);
    return adminJson({ ok: true });
  } catch (error) {
    if (error instanceof StockNotSeeded) return adminJson({ error: error.message }, 409);
    if (error instanceof InventoryUnavailable) {
      return adminJson({ error: "Inventory store is unavailable." }, 503);
    }
    return adminJson({ error: "Could not save stock." }, 500);
  }
}
