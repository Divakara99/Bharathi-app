import ExcelJS from "exceljs";
import { calculateTotals, sameEmployeeName, type EmployeeRow, type ExpenseRow, type ReportRow } from "@/lib/delivery-totals";

export const EXPORT_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export type ExportSnapshot = {
  employees: (EmployeeRow & { createdAt: Date | string })[];
  reports: (ReportRow & { createdAt: Date | string })[];
  expenses: (ExpenseRow & { updatedAt: Date | string })[];
};
export type ExportScope = { year: number | null; employeeName: string | null; generatedAt: Date };
type Cell = string | number | null;
export type ExportRecord = {
  recordType: string;
  id?: number | null;
  employeeId?: number | null;
  employeeName?: string;
  year?: number;
  month?: number;
  monthName?: string;
  cycle?: string;
  periodStart?: string;
  periodEnd?: string;
  deliveries?: number;
  price?: number;
  totalValue?: number;
  expenses?: number;
  netEarnings?: number;
  reportCount?: number;
  expenseCount?: number;
  expenseStatus?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};
export type ExportColumn = { key: keyof ExportRecord; label: string; width: number; money?: boolean };
export type ExportTable = { name: string; columns: ExportColumn[]; rows: ExportRecord[] };
export const EXPORT_COLUMNS: ExportColumn[] = [
  { key: "recordType", label: "Record Type", width: 28 },
  { key: "id", label: "Record ID", width: 12 },
  { key: "employeeId", label: "Employee ID", width: 13 },
  { key: "employeeName", label: "Employee Name", width: 30 },
  { key: "year", label: "Year", width: 9 },
  { key: "month", label: "Month Number", width: 15 },
  { key: "monthName", label: "Month", width: 15 },
  { key: "cycle", label: "15-Day Cycle", width: 22 },
  { key: "periodStart", label: "Period Start", width: 16 },
  { key: "periodEnd", label: "Period End", width: 16 },
  { key: "deliveries", label: "Deliveries", width: 14 },
  { key: "price", label: "Per Delivery Price (INR)", width: 25, money: true },
  { key: "totalValue", label: "Total Value (INR)", width: 21, money: true },
  { key: "expenses", label: "Expenses (INR)", width: 21, money: true },
  { key: "netEarnings", label: "Net Earnings (INR)", width: 21, money: true },
  { key: "reportCount", label: "Delivery Report Count", width: 24 },
  { key: "expenseCount", label: "Expense Entry Count", width: 23 },
  { key: "expenseStatus", label: "Expense Status", width: 19 },
  { key: "notes", label: "Notes", width: 50 },
  { key: "createdAt", label: "Created At (UTC)", width: 28 },
  { key: "updatedAt", label: "Updated At (UTC)", width: 28 },
];
const columns = (keys: (keyof ExportRecord)[]) => keys.map((key) => EXPORT_COLUMNS.find((column) => column.key === key)!);
const iso = (value: Date | string | null) => value ? new Date(value).toISOString() : "";
const money = (value: string) => Math.round(Number(value) * 100) / 100;
const totalsRecord = (reports: ReportRow[], expenses: ExpenseRow[]) => {
  const totals = calculateTotals(reports, expenses);
  return { deliveries: totals.deliveries, totalValue: totals.total, expenses: totals.expenses, netEarnings: totals.net,
    reportCount: totals.entries, expenseCount: totals.expenseEntries, expenseStatus: totals.expenseEntries ? "Entered" : "Not entered" };
};
const summaryColumns = columns(["recordType", "employeeId", "employeeName", "year", "month", "monthName", "deliveries", "totalValue", "expenses", "netEarnings", "reportCount", "expenseCount", "expenseStatus"]);

export function buildExportTables(snapshot: ExportSnapshot, scope: ExportScope): ExportTable[] {
  // Also retain names from old reports which have no employee-list row.
  const roster: { id: number | null; name: string; createdAt: Date | string | null }[] = snapshot.employees.map((employee) => ({ ...employee }));
  for (const report of snapshot.reports) {
    if (!roster.some((employee) => sameEmployeeName(employee.name, report.empName))) {
      roster.push({ id: null, name: report.empName, createdAt: null });
    }
  }
  roster.sort((a, b) => a.name.localeCompare(b.name));
  const savedYears = [...new Set([...snapshot.reports.map((row) => row.year), ...snapshot.expenses.map((row) => row.year)])].sort((a, b) => a - b);
  const years = scope.year !== null ? [scope.year] : savedYears.length ? savedYears : [scope.generatedAt.getUTCFullYear()];
  const info: ExportRecord[] = [
    { recordType: "Export Info", notes: "App: Bharathi Enterprises — Ekart Delivery Monitor" },
    { recordType: "Export Info", notes: `Years: ${scope.year ?? "All saved years"}` },
    { recordType: "Export Info", notes: `Employees: ${scope.employeeName ?? "All employees"}` },
    { recordType: "Export Info", notes: `Saved rows: ${snapshot.employees.length} employees; ${snapshot.reports.length} delivery reports; ${snapshot.expenses.length} monthly expenses.` },
    { recordType: "Export Info", notes: "All amounts are INR. Timestamps are UTC. Expenses are monthly, not per 15-day cycle. Net = Total Value - Expenses." },
    { recordType: "Export Info", notes: "Delivery and expense records are separate. Summary rows are calculated totals, not extra transactions. Do not sum detailed and summary rows together." },
    { recordType: "Export Info", notes: "General business expenses are included once in business totals and never assigned to individual employees." },
    { recordType: "Export Info", notes: "Each employee monthly summary includes all 12 months; zero values and Not entered indicate no saved expense entry." },
    { recordType: "Export Info", notes: "If there are no saved reports or expenses, empty monthly summaries use the current year." },
    { recordType: "Export Info", notes: "Generated at", createdAt: scope.generatedAt.toISOString() },
  ];
  const employeeRows: ExportRecord[] = roster.map((employee) => ({ recordType: "Employee", id: employee.id, employeeId: employee.id,
    employeeName: employee.name, createdAt: iso(employee.createdAt) }));
  const reportRows: ExportRecord[] = [...snapshot.reports].sort((a, b) => a.year - b.year || a.month - b.month || a.cycle - b.cycle || a.id - b.id).map((report) => {
    const lastDay = new Date(Date.UTC(report.year, report.month, 0)).getUTCDate();
    const date = (day: number) => `${report.year}-${String(report.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return { recordType: "Delivery Report", id: report.id, employeeId: roster.find((employee) => sameEmployeeName(employee.name, report.empName))?.id ?? null,
      employeeName: report.empName, year: report.year, month: report.month, monthName: EXPORT_MONTHS[report.month - 1],
      cycle: report.cycle === 1 ? "Cycle 1 (1–15)" : "Cycle 2 (16–end)", periodStart: date(report.cycle === 1 ? 1 : 16), periodEnd: date(report.cycle === 1 ? 15 : lastDay),
      deliveries: report.deliveries, price: money(report.pricePerDelivery), totalValue: money(report.totalValue), reportCount: 1,
      notes: report.notes ?? "", createdAt: iso(report.createdAt) };
  });
  const expenseRows: ExportRecord[] = [...snapshot.expenses].sort((a, b) => a.year - b.year || a.month - b.month || a.id - b.id).map((expense) => ({
    recordType: "Monthly Expense", id: expense.id, employeeId: expense.employeeId, employeeName: expense.employeeName ?? "General business expenses",
    year: expense.year, month: expense.month, monthName: EXPORT_MONTHS[expense.month - 1], expenses: money(expense.amount),
    expenseCount: 1, expenseStatus: "Entered", notes: expense.notes ?? "", updatedAt: iso(expense.updatedAt),
  }));
  const employeeMonthly: ExportRecord[] = [];
  const employeeYearly: ExportRecord[] = [];
  const businessMonthly: ExportRecord[] = [];
  const businessYearly: ExportRecord[] = [];
  const overall: ExportRecord[] = [];
  for (const employee of roster) {
    const ownReports = snapshot.reports.filter((report) => sameEmployeeName(report.empName, employee.name));
    const ownExpenses = employee.id === null ? [] : snapshot.expenses.filter((expense) => expense.employeeId === employee.id);
    for (const year of years) {
      const yearReports = ownReports.filter((row) => row.year === year);
      const yearExpenses = ownExpenses.filter((row) => row.year === year);
      for (let month = 1; month <= 12; month++) {
        employeeMonthly.push({ recordType: "Employee Monthly Total", employeeId: employee.id, employeeName: employee.name, year, month, monthName: EXPORT_MONTHS[month - 1],
          ...totalsRecord(yearReports.filter((row) => row.month === month), yearExpenses.filter((row) => row.month === month)) });
      }
      employeeYearly.push({ recordType: "Employee Yearly Total", employeeId: employee.id, employeeName: employee.name, year, ...totalsRecord(yearReports, yearExpenses) });
    }
    overall.push({ recordType: "Employee Grand Total", employeeId: employee.id, employeeName: employee.name, ...totalsRecord(ownReports, ownExpenses) });
  }
  for (const year of years) {
    const yearReports = snapshot.reports.filter((row) => row.year === year);
    const yearExpenses = snapshot.expenses.filter((row) => row.year === year);
    for (let month = 1; month <= 12; month++) {
      businessMonthly.push({ recordType: scope.employeeName ? "Selected Employee Monthly Total" : "Business Monthly Total", employeeName: scope.employeeName ?? "All employees + general business expenses", year, month, monthName: EXPORT_MONTHS[month - 1],
        ...totalsRecord(yearReports.filter((row) => row.month === month), yearExpenses.filter((row) => row.month === month)) });
    }
    businessYearly.push({ recordType: scope.employeeName ? "Selected Employee Yearly Total" : "Business Yearly Total", employeeName: scope.employeeName ?? "All employees + general business expenses", year, ...totalsRecord(yearReports, yearExpenses) });
  }
  overall.push({ recordType: scope.employeeName ? "Selected Employee Grand Total" : "Business Grand Total", employeeName: scope.employeeName ?? "All employees + general business expenses", ...totalsRecord(snapshot.reports, snapshot.expenses) });
  return [
    { name: "Export Info", columns: columns(["recordType", "notes", "createdAt"]), rows: info },
    { name: "Employees", columns: columns(["recordType", "id", "employeeId", "employeeName", "createdAt"]), rows: employeeRows },
    { name: "Delivery Reports", columns: columns(["recordType", "id", "employeeId", "employeeName", "year", "month", "monthName", "cycle", "periodStart", "periodEnd", "deliveries", "price", "totalValue", "notes", "createdAt"]), rows: reportRows },
    { name: "Monthly Expenses", columns: columns(["recordType", "id", "employeeId", "employeeName", "year", "month", "monthName", "expenses", "notes", "updatedAt"]), rows: expenseRows },
    { name: "Employee Monthly", columns: summaryColumns, rows: employeeMonthly },
    { name: "Employee Yearly", columns: summaryColumns.filter((column) => column.key !== "month" && column.key !== "monthName"), rows: employeeYearly },
    { name: "Monthly Totals", columns: summaryColumns, rows: businessMonthly },
    { name: "Yearly Totals", columns: summaryColumns.filter((column) => column.key !== "month" && column.key !== "monthName"), rows: businessYearly },
    { name: "Grand Totals", columns: summaryColumns.filter((column) => !["year", "month", "monthName"].includes(column.key)), rows: overall },
  ];
}

// Keep names/notes as literal text, not spreadsheet formulas. Numeric negative balances remain numeric.
export function csvCell(value: Cell | undefined, isMoney = false): string {
  let text = typeof value === "number" && isMoney ? value.toFixed(2) : value == null ? "" : String(value);
  if (typeof value === "string" && /^[\s\uFEFF]*[=+\-@]/.test(value)) text = "'" + text;
  return `"${text.replaceAll('"', '""')}"`;
}
export function buildFullCsv(tables: ExportTable[]): string {
  const rows = [EXPORT_COLUMNS.map((column) => csvCell(column.label)).join(",")];
  for (const table of tables) for (const row of table.rows) {
    rows.push(EXPORT_COLUMNS.map((column) => csvCell(row[column.key], column.money)).join(","));
  }
  return "\uFEFF" + rows.join("\r\n") + "\r\n";
}

export async function buildFullXlsx(tables: ExportTable[], generatedAt: Date): Promise<Uint8Array<ArrayBuffer>> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Bharathi Enterprises";
  workbook.title = "Bharathi Enterprises — Full Delivery Details";
  workbook.subject = "Employees, delivery reports, monthly expenses and financial totals";
  workbook.created = generatedAt;
  workbook.modified = generatedAt;
  for (const table of tables) {
    const sheet = workbook.addWorksheet(table.name, { views: [{ state: "frozen", ySplit: 1 }], properties: { defaultRowHeight: 20 } });
    sheet.columns = table.columns.map((column) => ({ header: column.label, key: column.key, width: column.key === "notes" && table.name === "Export Info" ? 100 : column.width }));
    sheet.addRows(table.rows);
    const header = sheet.getRow(1);
    header.height = 32;
    header.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4338CA" } };
      cell.alignment = { vertical: "middle", wrapText: true };
    });
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, sheet.rowCount), column: table.columns.length } };
    table.columns.forEach((column, index) => {
      if (column.money) sheet.getColumn(index + 1).numFmt = '#,##0.00;[Red]-#,##0.00';
    });
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.eachCell((cell) => {
        cell.alignment = { vertical: "top", wrapText: true };
        if (rowNumber % 2 === 0) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F7FB" } };
      });
    });
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
