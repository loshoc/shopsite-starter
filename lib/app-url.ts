export type AppUrlEnv = {
  appUrl?: string | null;
  nodeEnv?: string | null;
  vercelEnv?: string | null;
  vercelUrl?: string | null;
};

const DEV_ORIGIN = "http://localhost:3000";

const MISSING_MESSAGE =
  "NEXT_PUBLIC_APP_URL is required in production. Set the public site origin with no trailing slash before the Vercel production build. Vercel preview builds can omit it and fall back to https://$VERCEL_URL.";

const INVALID_MESSAGE =
  "NEXT_PUBLIC_APP_URL must be an absolute http(s) origin with no path, query, hash, or credentials, and no trailing slash.";

export function localOnlyAppUrlMessage(origin: string): string {
  return `NEXT_PUBLIC_APP_URL cannot be a local-only host in production (${origin}). Use the public site origin. localhost, 127.0.0.1, and similar hosts are refused.`;
}

type Origin = { origin: string; hostname: string };

export function resolveAppUrl(env: AppUrlEnv = envFromProcess()): string {
  const nodeEnv = env.nodeEnv ?? "";
  const configured = env.appUrl?.trim() ?? "";
  if (!configured) {
    if (nodeEnv === "production" && env.vercelEnv === "preview") {
      const preview = parseOrigin(normalizePreviewUrl(env.vercelUrl));
      if (preview.ok) return accept(preview.origin, nodeEnv);
    }
    if (nodeEnv === "production") throw new Error(MISSING_MESSAGE);
    return DEV_ORIGIN;
  }

  const parsed = parseOrigin(configured);
  if (!parsed.ok) {
    if (nodeEnv === "production") throw new Error(parsed.message);
    return DEV_ORIGIN;
  }
  return accept(parsed.origin, nodeEnv);
}

/** Production builds call this from `next.config.ts` so a bad origin fails the build. */
export function assertProductionAppUrl(env: AppUrlEnv = envFromProcess()): void {
  if ((env.nodeEnv ?? "") !== "production") return;
  resolveAppUrl(env);
}

export function appUrl(): string {
  return resolveAppUrl();
}

function accept(origin: Origin, nodeEnv: string): string {
  if (nodeEnv === "production" && isLocalOnlyHost(origin.hostname)) {
    throw new Error(localOnlyAppUrlMessage(origin.origin));
  }
  return origin.origin;
}

function envFromProcess(): AppUrlEnv {
  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    vercelUrl: process.env.VERCEL_URL,
  };
}

function normalizePreviewUrl(vercelUrl: string | null | undefined): string {
  const host = vercelUrl?.trim().replace(/\/+$/, "") ?? "";
  if (!host) return "";
  if (/^https?:\/\//i.test(host)) return host;
  return `https://${host}`;
}

function parseOrigin(raw: string): { ok: true; origin: Origin } | { ok: false; message: string } {
  if (!raw) return { ok: false, message: MISSING_MESSAGE };
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, message: INVALID_MESSAGE };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, message: INVALID_MESSAGE };
  }
  if (url.username || url.password || url.search || url.hash) {
    return { ok: false, message: INVALID_MESSAGE };
  }
  if (url.pathname !== "/" && url.pathname !== "") {
    return { ok: false, message: INVALID_MESSAGE };
  }
  return { ok: true, origin: { origin: url.origin, hostname: url.hostname } };
}

export function isLocalOnlyHost(hostname: string): boolean {
  const host = normalizeHost(hostname);
  if (!host) return true;
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "localhost.localdomain" || host.endsWith(".localhost.localdomain")) return true;
  if (host.endsWith(".local")) return true;
  if (host === "host.docker.internal" || host === "kubernetes.docker.internal") return true;
  if (host === "0.0.0.0" || host === "::" || host === "::1" || host === "0:0:0:0:0:0:0:1") return true;
  if (/^127(?:\.\d{1,3}){3}$/.test(host)) return true;
  return isMappedLoopback(host);
}

function normalizeHost(hostname: string): string {
  return hostname
    .trim()
    .toLowerCase()
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/\.+$/, "")
    .split("%")[0] ?? "";
}

/** IPv4 loopback hidden in IPv6-mapped form, including Node's `::ffff:7f00:1`. */
function isMappedLoopback(host: string): boolean {
  const dotted = host.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (dotted?.[1] && /^127(?:\.\d{1,3}){3}$/.test(dotted[1])) return true;
  const hex = host.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (!hex?.[1] || !hex[2]) return false;
  const hi = Number.parseInt(hex[1], 16);
  const lo = Number.parseInt(hex[2], 16);
  if (!Number.isInteger(hi) || !Number.isInteger(lo)) return false;
  const a = (hi >> 8) & 255;
  return a === 127;
}
