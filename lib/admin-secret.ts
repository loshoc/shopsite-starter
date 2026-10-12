/**
 * Pure checks. This module must not read process.env. Callers on the server
 * pass the value in. Do not import it from a Client Component with a secret.
 *
 * ADMIN_SECRET is server-only. Never rename it to NEXT_PUBLIC_*.
 */

const PLACEHOLDER_SNIPPETS = [
  "replace_with",
  "replace-with",
  "changeme",
  "change_me",
  "change-me",
  "placeholder",
  "your_secret",
  "your-secret",
  "your_admin",
  "your-admin",
  "your_publishable",
  "your_webhook",
  "example_secret",
  "set-me",
  "set_me",
  "password",
  "admin_secret",
  "sk_test_your",
  "sk_live_your",
  "whsec_your",
  "pk_test_your",
  "pk_live_your",
];

export function adminSecretProblem(value: string | undefined | null): string | null {
  if (value == null || value.trim() === "") return "ADMIN_SECRET is missing";
  const secret = value.trim();
  if (secret.length < 32) return "ADMIN_SECRET must be at least 32 characters";
  if (isObviousPlaceholder(secret) || /^(.)\1+$/.test(secret)) {
    return "ADMIN_SECRET is an obvious placeholder";
  }
  return null;
}

export function isObviousPlaceholder(value: string | undefined | null): boolean {
  if (value == null || value.trim() === "") return true;
  const lower = value.trim().toLowerCase();
  return PLACEHOLDER_SNIPPETS.some((snippet) => lower.includes(snippet));
}

/** Relative admin path only. Blocks open redirects on the login form. */
export function safeAdminNext(value: string | undefined): string {
  if (!value || !value.startsWith("/admin") || value.startsWith("//") || value.includes("\\")) {
    return "/admin";
  }
  if (value.startsWith("/admin/login")) return "/admin";
  return value;
}
