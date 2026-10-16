import { isLocalOnlyHost, resolveAppUrl, type AppUrlEnv } from "@/lib/app-url";

/**
 * Live Stripe keys cannot charge a local origin. Test keys (sk_test_ / pk_test_)
 * stay allowed on localhost. A local app origin or a local request host refuses
 * sk_live_ and pk_live_.
 */
export const LIVE_STRIPE_LOCAL_MESSAGE =
  "Stripe live keys cannot be used on a local address. Use test keys for localhost.";

export type LiveStripeCheck = AppUrlEnv & {
  secretKey?: string | null;
  publishableKey?: string | null;
  requestHosts?: readonly string[] | null;
};

export function requestHostValues(headers: { get(name: string): string | null }): string[] {
  const values: string[] = [];
  for (const name of ["host", "x-forwarded-host"]) {
    const raw = headers.get(name);
    if (!raw) continue;
    for (const part of raw.split(",")) {
      const value = part.trim();
      if (value) values.push(value);
    }
  }
  return values;
}

export function liveStripeLocalProblem(input: LiveStripeCheck): string | null {
  const secret = input.secretKey?.trim() ?? "";
  const publishable = input.publishableKey?.trim() ?? "";
  if (!secret.startsWith("sk_live_") && !publishable.startsWith("pk_live_")) return null;
  if (hasLocalRequestHost(input.requestHosts) || appOriginIsLocal(input)) {
    return LIVE_STRIPE_LOCAL_MESSAGE;
  }
  return null;
}

export function liveStripeLocalProblemFromEnv(requestHosts?: readonly string[] | null): string | null {
  return liveStripeLocalProblem({
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    vercelUrl: process.env.VERCEL_URL,
    requestHosts,
  });
}

function hasLocalRequestHost(hosts: readonly string[] | null | undefined): boolean {
  for (const host of hosts ?? []) {
    const hostname = hostnameFromHost(host);
    if (hostname && isLocalOnlyHost(hostname)) return true;
  }
  return false;
}

function appOriginIsLocal(env: AppUrlEnv): boolean {
  try {
    const origin = resolveAppUrl(env);
    return isLocalOnlyHost(new URL(origin).hostname);
  } catch {
    return true;
  }
}

function hostnameFromHost(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  if (raw === "::1") return "::1";
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `http://${raw}`;
  try {
    const hostname = new URL(withScheme).hostname;
    return hostname || null;
  } catch {
    return null;
  }
}
