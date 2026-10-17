import "server-only";

import { getProductBySku } from "@/data/products";
import { siteConfig } from "@/data/site.config";
import { isObviousPlaceholder } from "@/lib/admin-secret";
import { isLocalOnlyHost, resolveAppUrl } from "@/lib/app-url";
import type { ReservationLine } from "@/lib/types";

/**
 * PayPal is optional. Stripe Checkout stays the primary path.
 * Buttons load NEXT_PUBLIC_PAYPAL_CLIENT_ID only. The client secret and
 * webhook id are server-only and are selected by PAYPAL_MODE so a sandbox
 * client id is never sent with the live secret.
 * Stock and order rows are not written here. The signed webhook does that.
 */

export const LIVE_PAYPAL_LOCAL_MESSAGE =
  "PayPal live credentials cannot be used on a local address. Use sandbox for localhost.";

export type PayPalMode = "sandbox" | "live";

export type PayPalCredentials = {
  mode: PayPalMode;
  clientId: string;
  clientSecret: string;
  webhookId: string;
  publicClientId: string;
};

export type PayPalStorefront =
  | { enabled: false }
  | { enabled: true; clientId: string; currency: string };

export class PayPalConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayPalConfigError";
  }
}

export class PayPalRequestError extends Error {
  constructor() {
    super("PayPal request failed");
    this.name = "PayPalRequestError";
  }
}

type PayPalFetch = (url: string, init?: RequestInit) => Promise<Response>;

type TokenCache = { key: string; token: string; expiresAt: number };

const PAYPAL_ENV_KEYS = [
  "PAYPAL_MODE",
  "NEXT_PUBLIC_PAYPAL_CLIENT_ID",
  "PAYPAL_SANDBOX_CLIENT_ID",
  "PAYPAL_SANDBOX_CLIENT_SECRET",
  "PAYPAL_SANDBOX_WEBHOOK_ID",
  "PAYPAL_LIVE_CLIENT_ID",
  "PAYPAL_LIVE_CLIENT_SECRET",
  "PAYPAL_LIVE_WEBHOOK_ID",
  "PAYPAL_CLIENT_ID",
  "PAYPAL_CLIENT_SECRET",
  "PAYPAL_WEBHOOK_ID",
] as const;

const ZERO_DECIMAL = new Set(["BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"]);

const ID_RE = /^[A-Za-z0-9_-]{16,128}$/;
const ORDER_ID_RE = /^[A-Z0-9]{10,36}$/;

let fetchImpl: PayPalFetch | null = null;
let tokenCache: TokenCache | null = null;

export function resetPayPalForTests(fetchFn?: PayPalFetch | null): void {
  fetchImpl = fetchFn ?? null;
  tokenCache = null;
}

export function paypalApiBase(mode: PayPalMode): string {
  return mode === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
}

export function paypalSessionId(orderId: string): string {
  return `paypal:${orderId}`;
}

export function isPayPalSessionId(sessionId: string): boolean {
  return sessionId.startsWith("paypal:");
}

export function paypalConfigProblem(): string | null {
  if (publicPayPalSecretLeak()) return "PayPal secret must not use NEXT_PUBLIC_.";
  if (genericPayPalSecret()) return "PayPal is not configured.";
  const modeRaw = env("PAYPAL_MODE").toLowerCase();
  const anyCredential = PAYPAL_ENV_KEYS.some((key) => key !== "PAYPAL_MODE" && env(key));
  if (!modeRaw && !anyCredential) return "PayPal is not configured.";
  if (modeRaw !== "sandbox" && modeRaw !== "live") return "PAYPAL_MODE must be sandbox or live.";
  const mode = modeRaw;
  const active = pair(mode);
  const other = pair(mode === "sandbox" ? "live" : "sandbox");
  const publicId = env("NEXT_PUBLIC_PAYPAL_CLIENT_ID");
  if (
    badId(active.clientId) ||
    badSecret(active.clientSecret) ||
    badId(active.webhookId) ||
    badId(publicId)
  ) {
    return "PayPal is not configured.";
  }
  if (publicId !== active.clientId) return "PayPal client id does not match PAYPAL_MODE.";
  if (other.clientId && (other.clientId === active.clientId || other.clientId === publicId)) {
    return "PayPal sandbox and live credentials must not be the same value.";
  }
  if (other.clientSecret && other.clientSecret === active.clientSecret) {
    return "PayPal sandbox and live credentials must not be the same value.";
  }
  if (other.webhookId && other.webhookId === active.webhookId) {
    return "PayPal sandbox and live credentials must not be the same value.";
  }
  const currency = paypalCurrency();
  if (!currency) return "PayPal is not configured.";
  return null;
}

export function paypalLiveLocalProblem(requestHosts?: readonly string[] | null): string | null {
  if (paypalConfigProblem()) return null;
  if (env("PAYPAL_MODE").toLowerCase() !== "live") return null;
  if (hasLocalRequestHost(requestHosts) || appOriginIsLocal()) return LIVE_PAYPAL_LOCAL_MESSAGE;
  return null;
}

export function paypalOfferProblem(requestHosts?: readonly string[] | null): string | null {
  return paypalConfigProblem() ?? paypalLiveLocalProblem(requestHosts);
}

export function paypalStorefrontPayload(requestHosts?: readonly string[] | null): PayPalStorefront {
  if (paypalOfferProblem(requestHosts)) return { enabled: false };
  const creds = mustCreds();
  return { enabled: true, clientId: creds.publicClientId, currency: paypalCurrency()! };
}

export function paypalStatusLabel(requestHosts?: readonly string[] | null): string {
  const problem = paypalOfferProblem(requestHosts);
  if (!problem) return env("PAYPAL_MODE").toLowerCase();
  if (problem === LIVE_PAYPAL_LOCAL_MESSAGE) return "live, hidden on localhost";
  return "not configured";
}

export function paypalDashboardUrl(captureId: string | null): string {
  const mode = env("PAYPAL_MODE").toLowerCase();
  const base = mode === "sandbox" ? "https://www.sandbox.paypal.com" : "https://www.paypal.com";
  if (captureId && /^[A-Z0-9]{8,36}$/.test(captureId)) return `${base}/activity/payment/${captureId}`;
  return `${base}/myaccount/transactions/`;
}

export function buyerPayPalError(problem: string): string {
  return problem === LIVE_PAYPAL_LOCAL_MESSAGE ? problem : "PayPal is not configured.";
}

export async function createPayPalOrder(
  lines: ReservationLine[],
  requestHosts?: readonly string[] | null,
): Promise<string> {
  const problem = paypalOfferProblem(requestHosts);
  if (problem) throw new PayPalConfigError(problem);
  const creds = mustCreds();
  const currency = paypalCurrency();
  if (!currency) throw new PayPalConfigError("PayPal is not configured.");
  const token = await accessToken(creds);
  const response = await paypalFetch(`${paypalApiBase(creds.mode)}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      prefer: "return=representation",
    },
    body: JSON.stringify(orderBody(lines, currency)),
  });
  if (!response.ok) throw new PayPalRequestError();
  const json = (await response.json()) as { id?: unknown };
  if (typeof json.id !== "string" || !ORDER_ID_RE.test(json.id)) throw new PayPalRequestError();
  return json.id;
}

/**
 * Captures a PayPal order the buyer already approved.
 * This does not write stock or an order row. The signed webhook does.
 */
export async function capturePayPalOrder(orderId: string, requestHosts?: readonly string[] | null): Promise<void> {
  if (!ORDER_ID_RE.test(orderId)) throw new PayPalRequestError();
  const problem = paypalOfferProblem(requestHosts);
  if (problem) throw new PayPalConfigError(problem);
  const creds = mustCreds();
  const token = await accessToken(creds);
  const response = await paypalFetch(`${paypalApiBase(creds.mode)}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      prefer: "return=representation",
    },
    body: "{}",
  });
  if (!response.ok) throw new PayPalRequestError();
  const json = (await response.json()) as { status?: unknown };
  if (json.status !== "COMPLETED") throw new PayPalRequestError();
}

export async function getPayPalOrder(orderId: string): Promise<unknown> {
  if (!ORDER_ID_RE.test(orderId)) throw new PayPalRequestError();
  const creds = mustCreds();
  const token = await accessToken(creds);
  const response = await paypalFetch(`${paypalApiBase(creds.mode)}/v2/checkout/orders/${orderId}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new PayPalRequestError();
  return response.json();
}

export async function getPayPalCapture(captureId: string): Promise<unknown> {
  if (!/^[A-Z0-9]{8,36}$/.test(captureId)) throw new PayPalRequestError();
  const creds = mustCreds();
  const token = await accessToken(creds);
  const response = await paypalFetch(`${paypalApiBase(creds.mode)}/v2/payments/captures/${captureId}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new PayPalRequestError();
  return response.json();
}

export type PayPalEvent = {
  id?: string;
  event_type?: string;
  resource?: Record<string, unknown>;
};

export async function verifyPayPalWebhook(
  rawBody: string,
  headers: { get(name: string): string | null },
): Promise<{ ok: true; event: PayPalEvent } | { ok: false; retry: boolean }> {
  if (paypalConfigProblem()) return { ok: false, retry: false };
  const creds = mustCreds();
  const transmissionId = headerValue(headers, "paypal-transmission-id");
  const transmissionTime = headerValue(headers, "paypal-transmission-time");
  const transmissionSig = headerValue(headers, "paypal-transmission-sig");
  const certUrl = headerValue(headers, "paypal-cert-url");
  const authAlgo = headerValue(headers, "paypal-auth-algo");
  if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
    return { ok: false, retry: false };
  }
  if (!safeToken(transmissionId) || !safeToken(transmissionTime) || !safeToken(authAlgo)) {
    return { ok: false, retry: false };
  }
  if (transmissionSig.length < 16 || transmissionSig.length > 4096) return { ok: false, retry: false };
  if (!certUrlAllowed(certUrl, creds.mode)) return { ok: false, retry: false };
  let event: PayPalEvent;
  try {
    const parsed = JSON.parse(rawBody) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { ok: false, retry: false };
    event = parsed as PayPalEvent;
  } catch {
    return { ok: false, retry: false };
  }
  try {
    const token = await accessToken(creds);
    const response = await paypalFetch(`${paypalApiBase(creds.mode)}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: creds.webhookId,
        webhook_event: event,
      }),
    });
    if (!response.ok) return { ok: false, retry: true };
    const json = (await response.json()) as { verification_status?: unknown };
    if (json.verification_status !== "SUCCESS") return { ok: false, retry: false };
    return { ok: true, event };
  } catch {
    return { ok: false, retry: true };
  }
}

/** Display only. Does not write stock or an order. */
export async function readPayPalCheckoutSummary(
  orderId: string,
): Promise<{ email: string | null; totalCents: number; currency: string } | null> {
  if (paypalConfigProblem() || !ORDER_ID_RE.test(orderId)) return null;
  try {
    const order = (await getPayPalOrder(orderId)) as {
      status?: unknown;
      payer?: { email_address?: unknown };
      purchase_units?: { amount?: { currency_code?: unknown; value?: unknown } }[];
    };
    if (order.status !== "COMPLETED") return null;
    const amount = order.purchase_units?.[0]?.amount;
    const cents = parseMoney(amount, paypalCurrency() ?? "");
    if (cents == null) return null;
    const email = order.payer?.email_address;
    return {
      email: typeof email === "string" && email.includes("@") && email.length <= 320 ? email : null,
      totalCents: cents,
      currency: siteConfig.currency,
    };
  } catch {
    return null;
  }
}

export function parseMoney(
  amount: { currency_code?: unknown; value?: unknown } | null | undefined,
  currency: string,
): number | null {
  if (!amount) return null;
  if (typeof amount.currency_code !== "string" || amount.currency_code.toUpperCase() !== currency) return null;
  if (typeof amount.value !== "string" || !/^\d{1,8}\.\d{2}$/.test(amount.value)) return null;
  const [whole, frac] = amount.value.split(".");
  const cents = Number(whole) * 100 + Number(frac);
  if (!Number.isSafeInteger(cents)) return null;
  return cents;
}

export function captureIdFromLinks(links: unknown, mode: PayPalMode): string | null {
  if (!Array.isArray(links)) return null;
  const hosts =
    mode === "sandbox"
      ? new Set(["api.sandbox.paypal.com", "api-m.sandbox.paypal.com"])
      : new Set(["api.paypal.com", "api-m.paypal.com"]);
  for (const link of links) {
    if (!link || typeof link !== "object") continue;
    const rel = (link as { rel?: unknown }).rel;
    const href = (link as { href?: unknown }).href;
    if (rel !== "up" || typeof href !== "string") continue;
    let url: URL;
    try {
      url = new URL(href);
    } catch {
      continue;
    }
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) continue;
    if (!hosts.has(url.hostname)) continue;
    const match = url.pathname.match(/^\/v2\/payments\/captures\/([A-Z0-9]{8,36})$/);
    if (match) return match[1];
  }
  return null;
}

function orderBody(lines: ReservationLine[], currency: string) {
  let total = 0;
  const items = lines.map((line) => {
    const product = getProductBySku(line.skuId);
    if (!product) throw new PayPalRequestError();
    total += product.priceCents * line.qty;
    return {
      name: product.name.slice(0, 127),
      sku: product.skuId,
      quantity: String(line.qty),
      category: "PHYSICAL_GOODS",
      unit_amount: { currency_code: currency, value: formatPayPalAmount(product.priceCents) },
    };
  });
  const value = formatPayPalAmount(total);
  const customId = JSON.stringify(lines);
  return {
    intent: "CAPTURE",
    purchase_units: [
      {
        custom_id: customId.length <= 127 ? customId : undefined,
        amount: {
          currency_code: currency,
          value,
          breakdown: { item_total: { currency_code: currency, value } },
        },
        items,
      },
    ],
    application_context: {
      shipping_preference: "GET_FROM_FILE",
      user_action: "PAY_NOW",
    },
  };
}

function formatPayPalAmount(cents: number): string {
  const whole = Math.floor(cents / 100);
  const frac = String(cents % 100).padStart(2, "0");
  return `${whole}.${frac}`;
}

function paypalCurrency(): string | null {
  const currency = siteConfig.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) return null;
  if (ZERO_DECIMAL.has(currency)) return null;
  return currency;
}

async function accessToken(creds: PayPalCredentials): Promise<string> {
  const key = `${creds.mode}:${creds.clientId}`;
  const now = Date.now();
  if (tokenCache && tokenCache.key === key && tokenCache.expiresAt > now + 30_000) return tokenCache.token;
  const basic = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString("base64");
  const response = await paypalFetch(`${paypalApiBase(creds.mode)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      authorization: `Basic ${basic}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) throw new PayPalRequestError();
  const json = (await response.json()) as { access_token?: unknown; expires_in?: unknown };
  if (typeof json.access_token !== "string" || !json.access_token) throw new PayPalRequestError();
  const expiresIn = typeof json.expires_in === "number" && Number.isFinite(json.expires_in) ? json.expires_in : 300;
  tokenCache = { key, token: json.access_token, expiresAt: now + Math.max(60, expiresIn) * 1000 };
  return json.access_token;
}

function mustCreds(): PayPalCredentials {
  const problem = paypalConfigProblem();
  if (problem) throw new PayPalConfigError(problem);
  const mode = env("PAYPAL_MODE").toLowerCase() as PayPalMode;
  const active = pair(mode);
  return {
    mode,
    clientId: active.clientId,
    clientSecret: active.clientSecret,
    webhookId: active.webhookId,
    publicClientId: env("NEXT_PUBLIC_PAYPAL_CLIENT_ID"),
  };
}

function pair(mode: PayPalMode): { clientId: string; clientSecret: string; webhookId: string } {
  const prefix = mode === "sandbox" ? "PAYPAL_SANDBOX" : "PAYPAL_LIVE";
  return {
    clientId: env(`${prefix}_CLIENT_ID`),
    clientSecret: env(`${prefix}_CLIENT_SECRET`),
    webhookId: env(`${prefix}_WEBHOOK_ID`),
  };
}

function publicPayPalSecretLeak(): boolean {
  for (const key of Object.keys(process.env)) {
    if (!key.startsWith("NEXT_PUBLIC_PAYPAL_")) continue;
    if (key === "NEXT_PUBLIC_PAYPAL_CLIENT_ID") continue;
    if (process.env[key]?.trim()) return true;
  }
  return false;
}

function genericPayPalSecret(): boolean {
  return Boolean(env("PAYPAL_CLIENT_ID") || env("PAYPAL_CLIENT_SECRET") || env("PAYPAL_WEBHOOK_ID"));
}

function badId(value: string): boolean {
  return !ID_RE.test(value) || isObviousPlaceholder(value);
}

function badSecret(value: string): boolean {
  if (!value || value.length < 16 || value.length > 256) return true;
  if (isObviousPlaceholder(value) || /\s/.test(value)) return true;
  return false;
}

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function headerValue(headers: { get(name: string): string | null }, name: string): string {
  return headers.get(name)?.trim() ?? "";
}

function safeToken(value: string): boolean {
  return value.length > 0 && value.length <= 200 && /^[A-Za-z0-9_.:+=\/-]+$/.test(value);
}

function certUrlAllowed(value: string, mode: PayPalMode): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) return false;
  const hosts =
    mode === "sandbox"
      ? ["api.sandbox.paypal.com", "api-m.sandbox.paypal.com"]
      : ["api.paypal.com", "api-m.paypal.com"];
  return hosts.includes(url.hostname) && url.pathname.startsWith("/v1/notifications/certs/");
}

async function paypalFetch(url: string, init?: RequestInit): Promise<Response> {
  if (!url.startsWith("https://")) throw new PayPalRequestError();
  const impl = fetchImpl ?? ((nextUrl: string, nextInit?: RequestInit) => fetch(nextUrl, nextInit));
  return impl(url, init);
}

function hasLocalRequestHost(hosts: readonly string[] | null | undefined): boolean {
  for (const host of hosts ?? []) {
    const hostname = hostnameFromHost(host);
    if (hostname && isLocalOnlyHost(hostname)) return true;
  }
  return false;
}

function appOriginIsLocal(): boolean {
  try {
    return isLocalOnlyHost(new URL(resolveAppUrl()).hostname);
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
    return new URL(withScheme).hostname || null;
  } catch {
    return null;
  }
}
