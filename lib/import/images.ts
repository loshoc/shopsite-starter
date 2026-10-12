import fs from "node:fs";
import path from "node:path";

export type RemotePattern = {
  protocol: "https";
  hostname: string;
  port: string;
  pathname: string;
  search: string;
};

export type ClassifiedImage =
  | { ok: true; kind: "local"; src: string }
  | { ok: true; kind: "remote"; src: string; pattern: RemotePattern }
  | { ok: false };

const LOCAL_PATH = /^[A-Za-z0-9._/-]+$/;

/**
 * https URLs become exact remotePatterns (no wildcard host or pathname).
 * Site paths must live under public/ and cannot climb out with "..".
 */
export function classifyImage(raw: string, publicDir: string): ClassifiedImage {
  const value = raw.trim();
  if (value.startsWith("/")) return classifyLocal(value, publicDir);
  return classifyRemote(value);
}

function classifyLocal(value: string, publicDir: string): ClassifiedImage {
  if (value.includes("\\") || value.includes("..") || value.includes("//") || /[\s?#*]/.test(value)) {
    return { ok: false };
  }
  const relative = value.slice(1);
  if (!relative || !LOCAL_PATH.test(relative) || relative.startsWith("/")) return { ok: false };
  const root = path.resolve(publicDir);
  const full = path.resolve(root, relative);
  if (full !== root && !full.startsWith(root + path.sep)) return { ok: false };
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) return { ok: false };
  return { ok: true, kind: "local", src: value };
}

function classifyRemote(value: string): ClassifiedImage {
  if (/[\s*]/.test(value) || value.toLowerCase().startsWith("http://")) {
    return { ok: false };
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false };
  }
  if (url.protocol !== "https:") return { ok: false };
  if (url.username || url.password) return { ok: false };
  if (!url.hostname || url.hostname.includes("*")) return { ok: false };
  if (url.search || url.hash) return { ok: false };
  if (url.pathname.includes("*") || url.pathname.includes("..")) return { ok: false };
  const pattern: RemotePattern = {
    protocol: "https",
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname || "/",
    search: "",
  };
  return { ok: true, kind: "remote", src: url.origin + pattern.pathname, pattern };
}

export function imageMissing(raw: string, publicDir: string): boolean {
  const value = raw.trim();
  if (!value.startsWith("/") || value.includes("..") || value.includes("\\") || /[\s?#*]/.test(value)) {
    return false;
  }
  const relative = value.slice(1);
  if (!relative || !LOCAL_PATH.test(relative)) return false;
  const root = path.resolve(publicDir);
  const full = path.resolve(root, relative);
  if (full !== root && !full.startsWith(root + path.sep)) return false;
  return !fs.existsSync(full) || !fs.statSync(full).isFile();
}
