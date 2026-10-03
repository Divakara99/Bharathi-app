export function csvCell(value: string | number | null | undefined, money = false): string {
  let text = typeof value === "number" && money ? value.toFixed(2) : value == null ? "" : String(value);
  // Keep user-entered names/notes literal; do not run spreadsheet formulas.
  if (typeof value === "string" && /^[\s\uFEFF]*[=+\-@]/.test(value)) text = "'" + text;
  return `"${text.replaceAll('"', '""')}"`;
}
