/** Exact decimal cents. Rejects negatives, exponents, and more than two places. */
export function parsePriceToCents(raw: string): number | null {
  const value = raw.trim();
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(value)) return null;
  const [whole, frac = ""] = value.split(".");
  const cents = (frac + "00").slice(0, 2);
  const normalizedWhole = whole.replace(/^0+(?=\d)/, "");
  const amount = BigInt(normalizedWhole) * BigInt(100) + BigInt(cents);
  if (amount > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  return Number(amount);
}

/** Blank stock is zero. Anything else must be a non-negative integer within the admin range. */
export function parseStockQty(raw: string): number | null {
  const value = raw.trim();
  if (value === "") return 0;
  if (!/^\d{1,7}$/.test(value)) return null;
  const qty = Number(value);
  if (!Number.isInteger(qty) || qty < 0 || qty > 1_000_000) return null;
  return qty;
}
