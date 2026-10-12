import { CsvError, parse } from "csv-parse/sync";

export type CsvRow = {
  line: number;
  cells: string[];
};

export class CsvReadError extends Error {
  readonly line: number;

  constructor(line: number, message: string) {
    super(`Invalid CSV at row ${line}: ${message}`);
    this.name = "CsvReadError";
    this.line = line;
  }
}

type ParsedRecord = {
  record: string[];
  raw: string | Buffer;
  info: { lines: number };
};

/**
 * Parse a spreadsheet CSV. Strips a UTF-8 BOM, accepts CRLF and lone CR,
 * and reports each record's first physical line (the line a text editor shows).
 */
export function parseCsvTable(text: string): CsvRow[] {
  const stripped = text.replace(/^\uFEFF/, "");
  if (stripped.trim() === "") return [];
  const normalized = stripped.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  let records: ParsedRecord[];
  try {
    records = parse(normalized, {
      bom: true,
      relax_column_count: true,
      skip_empty_lines: false,
      info: true,
      raw: true,
    }) as unknown as ParsedRecord[];
  } catch (error) {
    const line = error instanceof CsvError && typeof error.lines === "number" ? error.lines : 1;
    const message = error instanceof Error ? error.message.split("\n")[0] : "Could not parse CSV.";
    throw new CsvReadError(Math.max(1, line), message);
  }
  return records.map((entry) => ({
    line: startLine(entry.info.lines, rawText(entry.raw)),
    cells: entry.record.map((cell) => cell ?? ""),
  }));
}

export function isBlankRow(row: CsvRow): boolean {
  return row.cells.every((cell) => cell.trim() === "");
}

export function headerKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function rawText(raw: string | Buffer): string {
  return typeof raw === "string" ? raw : raw.toString("utf8");
}

/** info.lines is the last physical line of the record. Raw includes the trailing break. */
function startLine(endLine: number, raw: string): number {
  let newlines = 0;
  for (const char of raw) {
    if (char === "\n") newlines += 1;
  }
  if (raw.endsWith("\n")) newlines -= 1;
  return endLine - newlines;
}
