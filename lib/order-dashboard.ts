import "server-only";

import { isPayPalSessionId, paypalDashboardUrl } from "@/lib/paypal";
import { stripeDashboardUrl } from "@/lib/stripe";

export function orderDashboardUrl(paymentIntentId: string | null, sessionId: string): string {
  if (isPayPalSessionId(sessionId)) return paypalDashboardUrl(paymentIntentId);
  return stripeDashboardUrl(paymentIntentId, sessionId);
}
