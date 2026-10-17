import { paypalStorefrontPayload } from "@/lib/paypal";
import { requestHostValues } from "@/lib/stripe-live";

export const runtime = "nodejs";

/** Public client id only. The client secret is never returned. */
export function GET(request: Request) {
  const payload = paypalStorefrontPayload(requestHostValues(request.headers));
  return Response.json(payload, { headers: { "cache-control": "no-store" } });
}
