import { requireAdminApi } from "@/lib/admin-guard";
import { explicitRestock } from "@/lib/db";
import { adminJson } from "@/lib/http";
import { InventoryUnavailable } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Explicit restock for partial refunds (and any refund the webhook did not
 * restock). Paid orders are rejected. This is not called by the webhook.
 */
export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  let stripeSessionId = "";
  try {
    const body = (await request.json()) as { stripeSessionId?: unknown };
    if (typeof body.stripeSessionId === "string") stripeSessionId = body.stripeSessionId;
  } catch {
    stripeSessionId = "";
  }
  if (!/^cs_[A-Za-z0-9_]+$/.test(stripeSessionId)) {
    return adminJson({ error: "Unknown order." }, 400);
  }
  try {
    const result = await explicitRestock(stripeSessionId);
    if (!result.ok) return adminJson({ error: result.error }, 409);
    return adminJson({ ok: true });
  } catch (error) {
    if (error instanceof InventoryUnavailable) {
      return adminJson({ error: "Inventory store is unavailable." }, 503);
    }
    return adminJson({ error: "Could not restock this order." }, 500);
  }
}
