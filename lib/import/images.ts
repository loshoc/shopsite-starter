import fs from "node:fs";
import path from "node:path";

import { blockedImageHost } from "./image-hosts.ts";

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
  | { ok: false; reason: "invalid" }
  | { ok: false; reason: "host"; host: string };

const LOCAL_PATH = /^[A-Za-z0-9._/-]+$/;

/**
 * https URLs become exact remotePatterns (no wildcard host or pathname).
 * Loopback, private, link-local, and metadata hosts are refused first.
 * Site paths must live under public/ and cannot climb out with "..".
 */
export function classifyImage(raw: string, publicDir: string): ClassifiedImage {
  const value = raw.trim();
  if (value.startsWith("/")) return classifyLocal(value, publicDir);
  return classifyRemote(value);
}

function classifyLocal(value: string, publicDir: string): ClassifiedImage {
  if (value.includes("\\") || value.includes("..") || value.includes("//") || /[\s?#*]/.test(value)) {
    return { ok: false, reason: "invalid" };
  }
  const relative = value.slice(1);
  if (!relative || !LOCAL_PATH.test(relative) || relative.startsWith("/")) return { ok: false, reason: "invalid" };
  const root = path.resolve(publicDir);
  const full = path.resolve(root, relative);
  if (full !== root && !full.startsWith(root + path.sep)) return { ok: false, reason: "invalid" };
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) return { ok: false, reason: "invalid" };
  return { ok: true, kind: "local", src: value };
}

function classifyRemote(value: string): ClassifiedImage {
  if (/[\s*]/.test(value) || value.toLowerCase().startsWith("http://")) {
    return { ok: false, reason: "invalid" };
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (url.protocol !== "https:") return { ok: false, reason: "invalid" };
  if (url.username || url.password) return { ok: false, reason: "invalid" };
  if (!url.hostname || url.hostname.includes("*")) return { ok: false, reason: "invalid" };
  if (url.search || url.hash) return { ok: false, reason: "invalid" };
  if (url.pathname.includes("*") || url.pathname.includes("..")) return { ok: false, reason: "invalid" };
  const blocked = blockedImageHost(url.hostname);
  if (blocked) return { ok: false, reason: "host", host: blocked };
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
