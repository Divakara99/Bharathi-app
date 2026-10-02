import { normalizeName } from "@/lib/employees";

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const periodLabel = (year: number, month: number, cycle: number) =>
  `${MONTH_NAMES[month - 1]} ${year} (${cycle === 1 ? "1 – 15" : "16 – End"})`;

export type ReportInput = {
  empName: string;
  year: number;
  month: number;
  cycle: number;
  deliveries: number;
  pricePerDelivery: number;
  notes: string | null;
};

export function parseReportInput(
  body: unknown,
): { ok: true; data: ReportInput } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const empName = normalizeName(String(b.empName ?? ""));
  const year = Number(b.year);
  const month = Number(b.month);
  const cycle = Number(b.cycle);
  const deliveries = Number(b.deliveries ?? 0);
  const pricePerDelivery = Number(b.pricePerDelivery ?? 0);
  const notes = b.notes ? String(b.notes).slice(0, 300) : null;

  if (!empName) return { ok: false, error: "Employee name is required" };
  if (empName.length > 60) return { ok: false, error: "Employee name is too long" };
  if (
    !Number.isInteger(year) || year < 2000 || year > 2100 ||
    !Number.isInteger(month) || month < 1 || month > 12 ||
    (cycle !== 1 && cycle !== 2)
  ) {
    return { ok: false, error: "Invalid period" };
  }
  if (!Number.isFinite(deliveries) || !Number.isFinite(pricePerDelivery)) {
    return { ok: false, error: "Enter valid numbers" };
  }
  if (deliveries < 0 || pricePerDelivery < 0) {
    return { ok: false, error: "Values cannot be negative" };
  }
  if (!Number.isInteger(deliveries)) {
    return { ok: false, error: "Deliveries must be a whole number" };
  }

  return {
    ok: true,
    data: { empName, year, month, cycle, deliveries, pricePerDelivery, notes },
  };
}
