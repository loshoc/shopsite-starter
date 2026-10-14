/**
 * Browser-only randomness for the admin closed screen.
 * Uses Web Crypto. Does not read, write, or log ADMIN_SECRET.
 * The value stays in the browser until the buyer pastes it into .env.local.
 */

import { adminSecretProblem } from "@/lib/admin-secret";

const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const SECRET_BYTES = 32;

function encodeBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;
    const triple = (a << 16) | (b << 8) | c;
    out += BASE64[(triple >> 18) & 63];
    out += BASE64[(triple >> 12) & 63];
    out += i + 1 < bytes.length ? BASE64[(triple >> 6) & 63] : "=";
    out += i + 2 < bytes.length ? BASE64[triple & 63] : "=";
  }
  return out;
}

/** 32 random bytes, base64-encoded (44 characters). Retries if the result would fail the server check. */
export function generateAdminSecret(): string {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) {
    throw new Error("Web Crypto is unavailable");
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const bytes = new Uint8Array(SECRET_BYTES);
    cryptoApi.getRandomValues(bytes);
    const secret = encodeBase64(bytes);
    if (secret.length >= 32 && adminSecretProblem(secret) === null) return secret;
  }

  throw new Error("Web Crypto did not produce a usable secret");
}

/** Copies text in the browser. Returns "manual" when the clipboard API is missing or rejects. */
export async function copyText(value: string): Promise<"copied" | "manual"> {
  try {
    const clipboard = globalThis.navigator?.clipboard;
    if (!clipboard?.writeText) return "manual";
    await clipboard.writeText(value);
    return "copied";
  } catch {
    return "manual";
  }
}
