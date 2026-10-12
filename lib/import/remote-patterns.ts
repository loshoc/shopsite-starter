import type { RemotePattern } from "./images.ts";

const START = "/* import:remotePatterns */";
const END = "/* import:remotePatterns:end */";

/** Every string is JSON.stringify'd so a host cannot break out of the TypeScript literal. */
export function renderPattern(pattern: RemotePattern): string {
  return `{ protocol: "https", hostname: ${JSON.stringify(pattern.hostname)}, port: ${JSON.stringify(pattern.port)}, pathname: ${JSON.stringify(pattern.pathname)}, search: ${JSON.stringify(pattern.search)} }`;
}

export function formatPatternReport(patterns: RemotePattern[]): string {
  if (patterns.length === 0) return "images.remotePatterns:\n(none)";
  return ["images.remotePatterns:", ...patterns.map((pattern) => JSON.stringify(pattern))].join("\n");
}

export function applyRemotePatterns(source: string, patterns: RemotePattern[]): string {
  const start = source.indexOf(START);
  const end = source.indexOf(END);
  if (start < 0 || end < start) {
    throw new Error("next.config.ts is missing import:remotePatterns markers.");
  }
  const body = patterns.map((pattern) => `      ${renderPattern(pattern)},`).join("\n");
  const middle = body ? `\n${body}\n      ` : "\n      ";
  return source.slice(0, start + START.length) + middle + source.slice(end);
}
