import { requireAdminApi } from "@/lib/admin-guard";
import { adminJson } from "@/lib/http";
import { seedAdminStock } from "@/lib/stock";
import { InventoryUnavailable } from "@/lib/types";

export const runtime = "nodejs";

export async function POST() {
  const denied = await requireAdminApi();
  if (denied) return denied;
  try {
    const inserted = await seedAdminStock();
    return adminJson({ ok: true, inserted });
  } catch (error) {
    if (error instanceof InventoryUnavailable) {
      return adminJson({ error: "Inventory store is unavailable." }, 503);
    }
    return adminJson({ error: "Could not seed stock." }, 500);
  }
}
