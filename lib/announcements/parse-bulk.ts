export type BulkParseMode = "auto" | "paragraph" | "tabular";

export interface ParsedAnnouncement {
  title: string;
  content: string;
  priority?: number;
  publishDate?: string;
  expiryDate?: string;
  isActive?: boolean;
  errors: string[];
}

export interface BulkParseResult {
  items: ParsedAnnouncement[];
  mode: "paragraph" | "tabular";
  delimiter?: "\t" | ",";
  hadHeader: boolean;
}

const HEADER_KEYS = new Set([
  "title",
  "content",
  "body",
  "priority",
  "publishdate",
  "publish_date",
  "publish",
  "expirydate",
  "expiry_date",
  "expiry",
  "isactive",
  "is_active",
  "active",
]);

const FIELD_ALIASES: Record<string, keyof ParsedAnnouncement> = {
  title: "title",
  content: "content",
  body: "content",
  priority: "priority",
  publishdate: "publishDate",
  publish_date: "publishDate",
  publish: "publishDate",
  expirydate: "expiryDate",
  expiry_date: "expiryDate",
  expiry: "expiryDate",
  isactive: "isActive",
  is_active: "isActive",
  active: "isActive",
};

const POSITIONAL: (keyof ParsedAnnouncement)[] = [
  "title",
  "content",
  "priority",
  "publishDate",
  "expiryDate",
  "isActive",
];

function detectMode(text: string): { mode: "paragraph" | "tabular"; delimiter?: "\t" | "," } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { mode: "paragraph" };

  const tabRows = lines.filter((l) => l.includes("\t")).length;
  if (tabRows >= Math.ceil(lines.length / 2)) {
    return { mode: "tabular", delimiter: "\t" };
  }

  const commaRows = lines.filter((l) => /,/.test(l) && !/^[^,]*$/.test(l)).length;
  // Only treat as CSV if every row has a comma — paragraph titles often don't.
  if (commaRows === lines.length && lines.length >= 2) {
    return { mode: "tabular", delimiter: "," };
  }

  return { mode: "paragraph" };
}

function splitCsvLine(line: string, delimiter: "\t" | ","): string[] {
  if (delimiter === "\t") return line.split("\t");
  // Minimal CSV: handles "quoted, fields" but not escaped quotes.
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function looksLikeHeader(cells: string[]): boolean {
  const normalized = cells.map((c) => c.trim().toLowerCase().replace(/\s+/g, ""));
  let hits = 0;
  for (const c of normalized) if (HEADER_KEYS.has(c)) hits++;
  return hits >= Math.max(2, Math.ceil(cells.length / 2));
}

function coerceField(field: keyof ParsedAnnouncement, raw: string, errors: string[]): unknown {
  const value = raw.trim();
  if (value === "") return undefined;

  switch (field) {
    case "priority": {
      const n = Number(value);
      if (!Number.isFinite(n)) {
        errors.push(`Invalid priority "${raw}"`);
        return undefined;
      }
      return Math.max(0, Math.trunc(n));
    }
    case "isActive": {
      const v = value.toLowerCase();
      if (["true", "yes", "y", "1", "active"].includes(v)) return true;
      if (["false", "no", "n", "0", "inactive"].includes(v)) return false;
      errors.push(`Invalid active flag "${raw}"`);
      return undefined;
    }
    case "publishDate":
    case "expiryDate":
      return value;
    default:
      return value;
  }
}

function parseTabular(text: string, delimiter: "\t" | ","): BulkParseResult {
  const rawLines = text.split(/\r?\n/);
  const lines = rawLines.filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { items: [], mode: "tabular", delimiter, hadHeader: false };
  }

  const firstCells = splitCsvLine(lines[0], delimiter);
  const hadHeader = looksLikeHeader(firstCells);

  let columns: (keyof ParsedAnnouncement | null)[];
  let dataLines: string[];

  if (hadHeader) {
    columns = firstCells.map((cell) => {
      const key = cell.trim().toLowerCase().replace(/\s+/g, "");
      return FIELD_ALIASES[key] ?? null;
    });
    dataLines = lines.slice(1);
  } else {
    columns = POSITIONAL.slice(0, firstCells.length);
    dataLines = lines;
  }

  const items: ParsedAnnouncement[] = dataLines.map((line) => {
    const cells = splitCsvLine(line, delimiter);
    const item: ParsedAnnouncement = { title: "", content: "", errors: [] };
    cells.forEach((cell, idx) => {
      const field = columns[idx];
      if (!field) return;
      const v = coerceField(field, cell, item.errors);
      if (v === undefined) return;
      // @ts-expect-error narrowed by field
      item[field] = v;
    });
    if (!item.title.trim()) item.errors.push("Title is required");
    if (!item.content.trim()) item.errors.push("Content is required");
    return item;
  });

  return { items, mode: "tabular", delimiter, hadHeader };
}

function parseParagraph(text: string): BulkParseResult {
  // Blocks separated by a blank line OR a line of dashes (---).
  const blocks: string[] = [];
  let current: string[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const isSeparator = line.trim() === "" || /^-{3,}$/.test(line.trim());
    if (isSeparator) {
      if (current.length) {
        blocks.push(current.join("\n"));
        current = [];
      }
    } else {
      current.push(line);
    }
  }
  if (current.length) blocks.push(current.join("\n"));

  const items: ParsedAnnouncement[] = blocks.map((block) => {
    const trimmed = block.replace(/^\s+|\s+$/g, "");
    const lines = trimmed.split(/\r?\n/);
    const title = (lines[0] ?? "").trim();
    const content = lines.slice(1).join("\n").trim();
    const item: ParsedAnnouncement = { title, content, errors: [] };
    if (!title) item.errors.push("Title is required");
    if (!content) item.errors.push("Content is required");
    return item;
  });

  return { items, mode: "paragraph", hadHeader: false };
}

export function parseBulkAnnouncements(
  text: string,
  mode: BulkParseMode = "auto"
): BulkParseResult {
  const trimmed = text.trim();
  if (!trimmed) return { items: [], mode: "paragraph", hadHeader: false };

  let resolved: { mode: "paragraph" | "tabular"; delimiter?: "\t" | "," };
  if (mode === "auto") {
    resolved = detectMode(trimmed);
  } else if (mode === "tabular") {
    resolved = detectMode(trimmed);
    if (resolved.mode !== "tabular") {
      resolved = { mode: "tabular", delimiter: trimmed.includes("\t") ? "\t" : "," };
    }
  } else {
    resolved = { mode: "paragraph" };
  }

  if (resolved.mode === "tabular") {
    return parseTabular(trimmed, resolved.delimiter ?? "\t");
  }
  return parseParagraph(trimmed);
}
