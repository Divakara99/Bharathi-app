import { monthRange, monthRangeFileLabel, type MonthRange } from "@/lib/report-range";

export function employeeNameList(names: readonly string[]): string {
  const unique = new Map<string, string>();
  for (const raw of names) {
    const name = raw.trim();
    if (name && !unique.has(name.toLowerCase())) unique.set(name.toLowerCase(), name);
  }
  return [...unique.values()].sort((a, b) => a.localeCompare(b)).join(", ");
}

export function exportFilename(
  names: readonly string[], year: number | null, format: "csv" | "xlsx", kind: "Full-Details" | "Summary" = "Full-Details", range: MonthRange = monthRange(),
): string {
  const validRange = monthRange(range.fromMonth, range.toMonth);
  const list = employeeNameList(names) || "No saved names";
  const namePart = list.normalize("NFKC").replace(/[<>:"/\\|?*\u0000-\u001F\u007F]/g, "-")
    .replace(/,\s*/g, "-").replace(/\s+/g, "-").replace(/^[.\-]+|[.\-]+$/g, "");
  const rangePart = validRange.fromMonth === 1 && validRange.toMonth === 12 ? "" : `${monthRangeFileLabel(validRange)}-`;
  const prefix = `Bharathi-Enterprises-${kind}-${year ?? "All-Years"}-${rangePart}`;
  const suffix = `.${format}`;
  const encoder = new TextEncoder();
  const budget = 220 - encoder.encode(prefix + suffix).length;
  let short = "";
  for (const char of namePart) {
    if (encoder.encode(short + char).length > budget - 5) break;
    short += char;
  }
  if (short !== namePart) short += "-etc";
  return prefix + (short || "No-Saved-Names") + suffix;
}

// UTF-8 filename* preserves Tamil and other non-ASCII employee names.
export function downloadDisposition(filename: string): string {
  const ascii = filename.normalize("NFKD").replace(/[^\x20-\x7E]/g, "").replace(/["\\]/g, "-");
  const encoded = encodeURIComponent(filename).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export function filenameFromDisposition(value: string | null, fallback: string): string {
  const encoded = value?.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try { return decodeURIComponent(encoded.trim()); } catch {}
  }
  return value?.match(/filename="([^"]+)"/)?.[1] ?? fallback;
}
