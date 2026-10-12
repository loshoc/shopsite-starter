import { headerKey, isBlankRow, type CsvRow } from "./csv.ts";

export type SourceOption = { name: string; value: string };

export type SourceRow = {
  line: number;
  handle: string;
  name: string;
  description: string;
  price: string;
  sku: string;
  stock: string;
  images: string[];
  options: SourceOption[];
  hidden: boolean;
  giftCard: boolean;
};

export type ColumnTable = {
  headerLine: number;
  keys: Map<string, number>;
  rows: CsvRow[];
  duplicateColumns: { line: number; name: string }[];
};

const SHOPIFY_HINTS = ["variant price", "body (html)", "variant sku", "image src", "option1 name", "variant inventory qty"];
const TEMPLATE_HINTS = ["name", "price", "sku", "description", "stock", "image_1", "option1_name"];

export type CsvFormat = "shopify" | "template" | "woocommerce" | "unknown";

export function tableFromRows(rows: CsvRow[]): ColumnTable | null {
  const dataRows = rows.filter((row) => !isBlankRow(row));
  const header = dataRows[0];
  if (!header) return null;
  const body = dataRows.slice(1);
  const width = usedWidth(header, body);
  const keys = new Map<string, number>();
  const duplicateColumns: { line: number; name: string }[] = [];
  for (let index = 0; index < width; index += 1) {
    const name = (header.cells[index] ?? "").trim();
    if (!name) continue;
    const key = headerKey(name);
    if (keys.has(key)) {
      duplicateColumns.push({ line: header.line, name });
      continue;
    }
    keys.set(key, index);
  }
  return {
    headerLine: header.line,
    keys,
    rows: body.map((row) => ({ line: row.line, cells: row.cells.slice(0, width) })),
    duplicateColumns,
  };
}

export function detectFormat(keys: Map<string, number>): CsvFormat {
  const shopify = SHOPIFY_HINTS.some((key) => keys.has(key));
  const template = TEMPLATE_HINTS.some((key) => keys.has(key));
  const woo = keys.has("regular price") || keys.has("sale price");
  if (woo && !shopify) return "woocommerce";
  if (shopify) return "shopify";
  if (template) return "template";
  if (keys.has("title")) return "shopify";
  return "unknown";
}

export function shopifyRows(table: ColumnTable): SourceRow[] {
  return table.rows.filter((row) => !isBlankRow(row)).map((row) => ({
    line: row.line,
    handle: cell(table, row, "handle"),
    name: cell(table, row, "title"),
    description: cell(table, row, "body (html)"),
    price: cell(table, row, "variant price"),
    sku: cell(table, row, "variant sku"),
    stock: cell(table, row, "variant inventory qty"),
    images: compact([cell(table, row, "image src")]),
    options: optionSlots(table, row, [
      ["option1 name", "option1 value"],
      ["option2 name", "option2 value"],
      ["option3 name", "option3 value"],
    ]),
    hidden: hiddenFrom(cell(table, row, "published"), cell(table, row, "status")),
    giftCard: /^(true|yes|1)$/i.test(cell(table, row, "gift card")),
  }));
}

export function templateRows(table: ColumnTable): SourceRow[] {
  const imageIndexes = [...table.keys.entries()]
    .filter(([key]) => /^image_\d+$/.test(key))
    .sort((a, b) => Number(a[0].slice("image_".length)) - Number(b[0].slice("image_".length)))
    .map(([, index]) => index);
  return table.rows.filter((row) => !isBlankRow(row)).map((row) => ({
    line: row.line,
    handle: cell(table, row, "handle"),
    name: cell(table, row, "name"),
    description: cell(table, row, "description"),
    price: cell(table, row, "price"),
    sku: cell(table, row, "sku"),
    stock: cell(table, row, "stock"),
    images: compact(imageIndexes.map((index) => (row.cells[index] ?? "").trim())),
    options: optionSlots(table, row, [
      ["option1_name", "option1_value"],
      ["option2_name", "option2_value"],
      ["option3_name", "option3_value"],
    ]),
    hidden: false,
    giftCard: false,
  }));
}

function usedWidth(header: CsvRow, body: CsvRow[]): number {
  let last = -1;
  const consider = (cells: string[]) => {
    cells.forEach((value, index) => {
      if (value.trim() !== "") last = Math.max(last, index);
    });
  };
  consider(header.cells);
  for (const row of body) consider(row.cells);
  return last + 1;
}

function cell(table: ColumnTable, row: CsvRow, key: string): string {
  const index = table.keys.get(key);
  if (index === undefined) return "";
  return (row.cells[index] ?? "").trim();
}

function optionSlots(table: ColumnTable, row: CsvRow, slots: [string, string][]): SourceOption[] {
  return slots.map(([nameKey, valueKey]) => ({
    name: cell(table, row, nameKey),
    value: cell(table, row, valueKey),
  }));
}

function compact(values: string[]): string[] {
  return values.filter((value) => value !== "");
}

function hiddenFrom(published: string, status: string): boolean {
  const pub = published.toLowerCase();
  const stat = status.toLowerCase();
  return pub === "false" || pub === "0" || stat === "draft" || stat === "archived";
}
