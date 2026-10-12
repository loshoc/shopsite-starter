export function appUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ?? "";
  if (/^https?:\/\//.test(raw)) return raw;
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL must be an absolute http(s) URL");
  }
  return "http://localhost:3000";
}
