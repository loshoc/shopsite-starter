import { BlockList, isIP } from "node:net";

/**
 * Hosts that must not become images.remotePatterns. Next would fetch these
 * from the server at build or request time (loopback, RFC1918, link-local,
 * cloud metadata). DNS is not resolved; only the URL hostname is inspected.
 */
const blockedAddresses = new BlockList();
blockedAddresses.addSubnet("0.0.0.0", 8, "ipv4");
blockedAddresses.addSubnet("10.0.0.0", 8, "ipv4");
blockedAddresses.addSubnet("127.0.0.0", 8, "ipv4");
blockedAddresses.addSubnet("169.254.0.0", 16, "ipv4");
blockedAddresses.addSubnet("172.16.0.0", 12, "ipv4");
blockedAddresses.addSubnet("192.168.0.0", 16, "ipv4");
blockedAddresses.addAddress("::", "ipv6");
blockedAddresses.addAddress("::1", "ipv6");
blockedAddresses.addSubnet("fc00::", 7, "ipv6");
blockedAddresses.addSubnet("fe80::", 10, "ipv6");

const METADATA_SUFFIXES = [
  "metadata.google.internal",
  "metadata.goog",
  "metadata.internal",
  "instance-data.ec2.internal",
];

/** Normalized host when the image host is refused, otherwise null. */
export function blockedImageHost(hostname: string): string | null {
  const host = normalizeHost(hostname);
  if (!host) return hostname.trim().toLowerCase() || hostname;
  if (isBlockedName(host) || isBlockedIp(host)) return host;
  return null;
}

function normalizeHost(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^\[/, "").replace(/\]$/, "").replace(/\.+$/, "");
}

function isBlockedName(host: string): boolean {
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "localhost.localdomain" || host.endsWith(".localhost.localdomain")) return true;
  if (host === "metadata" || host === "instance-data") return true;
  return METADATA_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

function isBlockedIp(host: string): boolean {
  const kind = isIP(host);
  if (kind === 4) return blockedAddresses.check(host, "ipv4");
  if (kind === 6) {
    if (blockedAddresses.check(host, "ipv6")) return true;
    return embedsBlockedIpv4(host);
  }
  return false;
}

/** IPv4 literals hidden inside IPv6 forms BlockList does not treat as mapped. */
function embedsBlockedIpv4(host: string): boolean {
  const bytes = expandIpv6(host);
  if (!bytes) return false;
  const zeros = (length: number) => {
    for (let i = 0; i < length; i += 1) if (bytes[i] !== 0) return false;
    return true;
  };
  // IPv4-mapped (::ffff:0:0/96) and deprecated IPv4-compatible (::/96).
  if (zeros(10) && bytes[10] === 0xff && bytes[11] === 0xff) return blockedIpv4At(bytes, 12);
  if (zeros(12)) return blockedIpv4At(bytes, 12);
  // ::ffff:0:x — an extra zero group, not the standard mapped prefix.
  if (zeros(8) && bytes[8] === 0xff && bytes[9] === 0xff && bytes[10] === 0 && bytes[11] === 0) {
    return blockedIpv4At(bytes, 12);
  }
  // NAT64 well-known prefix 64:ff9b::/96 (00:64:ff:9b then 8 zero bytes).
  if (bytes[0] === 0x00 && bytes[1] === 0x64 && bytes[2] === 0xff && bytes[3] === 0x9b && zerosFrom(bytes, 4, 12)) {
    return blockedIpv4At(bytes, 12);
  }
  // 6to4 2002::/16 stores the IPv4 in the next four bytes.
  if (bytes[0] === 0x20 && bytes[1] === 0x02) return blockedIpv4At(bytes, 2);
  return false;
}

function zerosFrom(bytes: Uint8Array, start: number, end: number): boolean {
  for (let i = start; i < end; i += 1) if (bytes[i] !== 0) return false;
  return true;
}

function blockedIpv4At(bytes: Uint8Array, offset: number): boolean {
  const ip = `${bytes[offset]}.${bytes[offset + 1]}.${bytes[offset + 2]}.${bytes[offset + 3]}`;
  return blockedAddresses.check(ip, "ipv4");
}

function expandIpv6(host: string): Uint8Array | null {
  const bare = host.split("%")[0] ?? host;
  if (!bare.includes(":")) return null;
  const halves = bare.split("::");
  if (halves.length > 2) return null;
  const head = parseGroups(halves[0] ?? "");
  if (!head) return null;
  const tail = halves.length === 2 ? parseGroups(halves[1] ?? "") : [];
  if (!tail) return null;
  let groups: number[];
  if (halves.length === 1) {
    if (head.length !== 8) return null;
    groups = head;
  } else {
    const missing = 8 - head.length - tail.length;
    if (missing < 0) return null;
    groups = [...head, ...new Array<number>(missing).fill(0), ...tail];
  }
  if (groups.length !== 8) return null;
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 8; i += 1) {
    const group = groups[i] ?? 0;
    bytes[i * 2] = (group >> 8) & 0xff;
    bytes[i * 2 + 1] = group & 0xff;
  }
  return bytes;
}

function parseGroups(part: string): number[] | null {
  if (part === "") return [];
  const pieces = part.split(":");
  const groups: number[] = [];
  for (let i = 0; i < pieces.length; i += 1) {
    const piece = pieces[i] ?? "";
    if (piece.includes(".")) {
      if (i !== pieces.length - 1) return null;
      const octets = piece.split(".");
      if (octets.length !== 4) return null;
      const nums = octets.map((octet) => (/^\d{1,3}$/.test(octet) ? Number(octet) : Number.NaN));
      if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
      groups.push((((nums[0] ?? 0) << 8) | (nums[1] ?? 0)) & 0xffff);
      groups.push((((nums[2] ?? 0) << 8) | (nums[3] ?? 0)) & 0xffff);
      continue;
    }
    if (!/^[0-9a-f]{1,4}$/.test(piece)) return null;
    groups.push(Number.parseInt(piece, 16));
  }
  return groups;
}
