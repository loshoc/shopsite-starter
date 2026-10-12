import type { Product, ProductVariant } from "../../data/products.ts";
import { sanitizeDescription } from "../sanitize-description.ts";
import { CsvReadError, parseCsvTable } from "./csv.ts";
import { classifyImage, imageMissing, type RemotePattern } from "./images.ts";
import { parsePriceToCents, parseStockQty } from "./money.ts";
import { detectFormat, shopifyRows, tableFromRows, templateRows, type SourceOption, type SourceRow } from "./sources.ts";

export type { RemotePattern } from "./images.ts";
export { parsePriceToCents } from "./money.ts";

const HANDLE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SKU = /^[\w-]{1,64}$/;

const SHOPIFY_REQUIRED: [string, string][] = [
  ["handle", "Handle"],
  ["title", "Title"],
  ["variant price", "Variant Price"],
];

const TEMPLATE_REQUIRED: [string, string][] = [
  ["handle", "handle"],
  ["name", "name"],
  ["price", "price"],
  ["sku", "sku"],
];

export type StockSeed = { skuId: string; qty: number };

export type ImportResult = {
  format: "shopify" | "template" | null;
  errors: string[];
  warnings: string[];
  products: Product[];
  patterns: RemotePattern[];
  stock: StockSeed[];
};

type Group = {
  handle: string;
  handleLine: number;
  name: string;
  nameLine: number;
  description: string;
  images: { line: number; value: string }[];
  variants: VariantDraft[];
  optionNames: string[];
  hidden: boolean;
  failed: boolean;
  giftCardLine: number | null;
};

type VariantDraft = {
  line: number;
  sku: string;
  price: string;
  stock: string;
  options: SourceOption[];
};

export function importProductCsv(text: string, options: { publicDir: string }): ImportResult {
  const empty: ImportResult = { format: null, errors: [], warnings: [], products: [], patterns: [], stock: [] };
  let rows;
  try {
    rows = parseCsvTable(text);
  } catch (error) {
    if (error instanceof CsvReadError) return { ...empty, errors: [error.message] };
    throw error;
  }
  const table = tableFromRows(rows);
  if (!table || table.keys.size === 0) {
    return { ...empty, errors: ["Row 1: Empty CSV file."] };
  }
  if (table.duplicateColumns.length > 0) {
    return {
      ...empty,
      errors: table.duplicateColumns.map((column) => `Row ${column.line}: Duplicate column "${column.name}".`),
    };
  }
  const format = detectFormat(table.keys);
  if (format === "unknown") {
    return {
      ...empty,
      errors: [
        `Row ${table.headerLine}: Unrecognized CSV format. Expected a Shopify product export or the ShopSite products template.`,
      ],
    };
  }
  if (format === "woocommerce") {
    return {
      ...empty,
      errors: [
        `Row ${table.headerLine}: Unrecognized CSV format. WooCommerce exports are not supported yet. Expected a Shopify product export or the ShopSite products template.`,
      ],
    };
  }
  const required = format === "shopify" ? SHOPIFY_REQUIRED : TEMPLATE_REQUIRED;
  const missing = required.filter(([key]) => !table.keys.has(key));
  if (missing.length > 0) {
    return {
      ...empty,
      format,
      errors: missing.map(([, label]) => `Row ${table.headerLine}: Missing required column "${label}".`),
    };
  }
  const sources = format === "shopify" ? shopifyRows(table) : templateRows(table);
  if (sources.length === 0 || sources.every(isEmptySource)) {
    return { ...empty, format, errors: [`Row ${table.headerLine}: Empty CSV file.`] };
  }
  const built = buildCatalog(sources, options.publicDir);
  return { format, ...built };
}

export function serializeCatalog(products: Product[]): string {
  return JSON.stringify({ products }, null, 2) + "\n";
}

function buildCatalog(rows: SourceRow[], publicDir: string): Omit<ImportResult, "format"> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const products: Product[] = [];
  const stock: StockSeed[] = [];
  const patterns: RemotePattern[] = [];
  const seenPatterns = new Set<string>();
  const seenSkus = new Set<string>();
  const seenHandles = new Set<string>();
  let current: Group | null = null;
  let skipping: string | null = null;

  const flush = () => {
    if (!current || current.failed) {
      current = null;
      return;
    }
    const built = validateGroup(current, publicDir, seenSkus, errors, warnings);
    if (built) {
      products.push(built.product);
      stock.push(...built.stock);
      for (const pattern of built.patterns) {
        const key = `${pattern.hostname}\0${pattern.port}\0${pattern.pathname}\0${pattern.search}`;
        if (seenPatterns.has(key)) continue;
        seenPatterns.add(key);
        patterns.push(pattern);
      }
    }
    current = null;
  };

  for (const row of rows) {
    if (isEmptySource(row)) continue;
    if (!row.handle) {
      errors.push(`Row ${row.line}: Missing handle.`);
      continue;
    }
    if (skipping) {
      if (row.handle === skipping) continue;
      skipping = null;
    }
    if (current && row.handle === current.handle) {
      absorb(current, row, errors, warnings);
      continue;
    }
    if (seenHandles.has(row.handle)) {
      errors.push(`Row ${row.line}: Duplicate handle "${row.handle}".`);
      skipping = row.handle;
      continue;
    }
    flush();
    seenHandles.add(row.handle);
    current = startGroup(row);
    absorb(current, row, errors, warnings);
  }
  flush();

  patterns.sort((a, b) =>
    `${a.hostname}\0${a.port}\0${a.pathname}`.localeCompare(`${b.hostname}\0${b.port}\0${b.pathname}`),
  );
  return { errors, warnings, products, patterns, stock };
}

function startGroup(row: SourceRow): Group {
  return {
    handle: row.handle,
    handleLine: row.line,
    name: "",
    nameLine: row.line,
    description: "",
    images: [],
    variants: [],
    optionNames: [],
    hidden: false,
    failed: false,
    giftCardLine: null,
  };
}

function absorb(group: Group, row: SourceRow, errors: string[], warnings: string[]) {
  if (group.failed) return;
  if (row.giftCard && group.giftCardLine === null) {
    group.giftCardLine = row.line;
    warnings.push(`Warning row ${row.line}: gift cards are imported as ordinary products.`);
  }
  if (row.hidden) group.hidden = true;
  if (row.name) {
    if (group.name && group.name !== row.name) {
      errors.push(`Row ${row.line}: Conflicting definition for handle "${group.handle}".`);
      group.failed = true;
      return;
    }
    if (!group.name) {
      group.name = row.name;
      group.nameLine = row.line;
    }
  }
  if (row.description) {
    if (group.description && group.description !== row.description) {
      errors.push(`Row ${row.line}: Conflicting definition for handle "${group.handle}".`);
      group.failed = true;
      return;
    }
    if (!group.description) group.description = row.description;
  }
  for (let index = 0; index < row.options.length; index += 1) {
    const option = row.options[index];
    if (!option || !option.name) continue;
    const previous = group.optionNames[index];
    if (previous && previous !== option.name) {
      errors.push(`Row ${row.line}: Conflicting definition for handle "${group.handle}".`);
      group.failed = true;
      return;
    }
    group.optionNames[index] = option.name;
  }
  for (const image of row.images) {
    if (!group.images.some((entry) => entry.value === image)) {
      group.images.push({ line: row.line, value: image });
    }
  }
  if (!isVariantRow(row)) return;
  group.variants.push({
    line: row.line,
    sku: row.sku,
    price: row.price,
    stock: row.stock,
    options: row.options,
  });
}

function validateGroup(
  group: Group,
  publicDir: string,
  seenSkus: Set<string>,
  errors: string[],
  warnings: string[],
): { product: Product; stock: StockSeed[]; patterns: RemotePattern[] } | null {
  const groupErrors: string[] = [];
  if (!HANDLE.test(group.handle)) {
    groupErrors.push(`Row ${group.handleLine}: Invalid handle "${group.handle}".`);
  }
  if (!group.name) groupErrors.push(`Row ${group.nameLine}: Missing name.`);
  if (group.name.length > 300) groupErrors.push(`Row ${group.nameLine}: Name is too long.`);
  if (group.description.length > 100_000) groupErrors.push(`Row ${group.handleLine}: Description is too long.`);
  if (group.variants.length === 0) groupErrors.push(`Row ${group.handleLine}: Missing SKU.`);

  const images: string[] = [];
  const patterns: RemotePattern[] = [];
  for (const image of group.images) {
    if (imageMissing(image.value, publicDir)) {
      groupErrors.push(`Row ${image.line}: Image not found in public "${image.value}".`);
      continue;
    }
    const classified = classifyImage(image.value, publicDir);
    if (!classified.ok) {
      groupErrors.push(`Row ${image.line}: Invalid image "${image.value}".`);
      continue;
    }
    if (!images.includes(classified.src)) images.push(classified.src);
    if (classified.kind === "remote") patterns.push(classified.pattern);
  }

  const variants: ProductVariant[] = [];
  const stock: StockSeed[] = [];
  for (const draft of group.variants) {
    if (!draft.sku) {
      groupErrors.push(`Row ${draft.line}: Missing SKU.`);
      continue;
    }
    if (!SKU.test(draft.sku)) {
      groupErrors.push(`Row ${draft.line}: Invalid SKU "${draft.sku}".`);
      continue;
    }
    if (seenSkus.has(draft.sku)) {
      groupErrors.push(`Row ${draft.line}: Duplicate SKU "${draft.sku}".`);
      continue;
    }
    const priceCents = parsePriceToCents(draft.price);
    if (priceCents === null) {
      groupErrors.push(`Row ${draft.line}: Invalid price "${draft.price.trim()}".`);
      continue;
    }
    const qty = parseStockQty(draft.stock);
    if (qty === null) {
      groupErrors.push(`Row ${draft.line}: Invalid stock quantity "${draft.stock.trim()}".`);
      continue;
    }
    const options = resolveOptions(draft, group.optionNames, warnings);
    seenSkus.add(draft.sku);
    variants.push({ skuId: draft.sku, priceCents, stockUnits: qty, options });
    stock.push({ skuId: draft.sku, qty });
    for (const name of group.optionNames) {
      if (!name) continue;
      if (!options.some((option) => option.name === name)) {
        warnings.push(`Warning row ${draft.line}: variant "${draft.sku}" is missing option "${name}".`);
      }
    }
  }

  if (groupErrors.length > 0) {
    errors.push(...groupErrors);
    for (const variant of variants) seenSkus.delete(variant.skuId);
    return null;
  }

  const [first] = variants;
  if (!first) return null;
  const simpleDefault = variants.every(
    (variant) =>
      variant.options.length === 0 ||
      (variant.options.length === 1 &&
        variant.options[0]?.name.toLowerCase() === "title" &&
        variant.options[0]?.value.toLowerCase() === "default title"),
  );
  const normalized = simpleDefault ? variants.map((variant) => ({ ...variant, options: [] })) : variants;
  const product: Product = {
    id: group.handle,
    handle: group.handle,
    skuId: first.skuId,
    name: group.name,
    description: sanitizeDescription(group.description),
    details: "",
    priceCents: first.priceCents,
    stockUnits: first.stockUnits,
    images,
    variants: normalized,
    ...(group.hidden ? { hidden: true } : {}),
  };
  return { product, stock, patterns };
}

function resolveOptions(draft: VariantDraft, optionNames: string[], warnings: string[]): ProductVariant["options"] {
  const options: ProductVariant["options"] = [];
  draft.options.forEach((option, index) => {
    if (!option.value) return;
    const name = option.name || optionNames[index] || "";
    if (name.toLowerCase() === "title" && option.value.toLowerCase() === "default title") return;
    if (!name) {
      warnings.push(`Warning row ${draft.line}: skipped option value "${option.value}" with no option name.`);
      return;
    }
    options.push({ name, value: option.value });
  });
  return options;
}

function isVariantRow(row: SourceRow): boolean {
  if (row.sku || row.price || row.stock) return true;
  return row.options.some((option) => option.value !== "");
}

function isEmptySource(row: SourceRow): boolean {
  return (
    !row.handle &&
    !row.name &&
    !row.description &&
    !row.price &&
    !row.sku &&
    !row.stock &&
    row.images.length === 0 &&
    row.options.every((option) => !option.name && !option.value)
  );
}
