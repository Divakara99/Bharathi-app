import {
  calculateTotals, employeeExpenses, employeeReports, sameEmployeeName,
  type EmployeeRow, type ExpenseRow, type ReportRow,
} from "@/lib/delivery-totals";
import { cycleDayRange } from "@/lib/report-period";
import { isInMonthRange, monthRange, monthRangeLabel } from "@/lib/report-range";

export const REPORT_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const reportMoney = (value: number) => "₹" + value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
type Totals = ReturnType<typeof calculateTotals>;
export type FinalReportMonth = {
  month: number;
  label: string;
  reports: ReportRow[];
  expenses: ExpenseRow[];
  totals: Totals;
  missingExpenses: boolean;
};
export type FinalReportEmployee = {
  employee: EmployeeRow;
  months: FinalReportMonth[];
  totals: Totals;
};
export type FinalReport = {
  year: number;
  month: number | null;
  period: string;
  names: string[];
  employees: FinalReportEmployee[];
  generalExpenses: ExpenseRow[];
  totals: Totals;
  hasData: boolean;
  missingExpenses: boolean;
};

export function buildFinalReport(input: {
  year: number;
  month?: number | null;
  fromMonth?: number;
  toMonth?: number;
  employees: EmployeeRow[];
  reports: ReportRow[];
  expenses: ExpenseRow[];
  selectedEmployee?: EmployeeRow;
}): FinalReport {
  const { year, selectedEmployee } = input;
  const range = monthRange(input.fromMonth ?? input.month ?? 1, input.toMonth ?? input.month ?? 12);
  const month = range.fromMonth === range.toMonth ? range.fromMonth : null;
  const matchPeriod = (row: { year: number; month: number }) => row.year === year && isInMonthRange(row.month, range);
  const reports = input.reports.filter(matchPeriod).filter((row) => !selectedEmployee || sameEmployeeName(row.empName, selectedEmployee.name))
    .sort((a, b) => a.month - b.month || a.cycle - b.cycle || a.id - b.id);
  const expenses = input.expenses.filter(matchPeriod).filter((row) => !selectedEmployee || row.employeeId === selectedEmployee.id)
    .sort((a, b) => a.month - b.month || a.id - b.id);
  const roster = selectedEmployee ? [selectedEmployee] : [...input.employees];
  // Keep any legacy report names, without assigning general expenses to them.
  let legacyId = -1;
  for (const row of reports) {
    if (!roster.some((employee) => sameEmployeeName(employee.name, row.empName))) roster.push({ id: legacyId--, name: row.empName });
  }
  for (const row of expenses) {
    if (row.employeeId !== null && row.employeeName && !roster.some((employee) => employee.id === row.employeeId)) {
      roster.push({ id: row.employeeId, name: row.employeeName });
    }
  }
  const employees = roster.map((employee): FinalReportEmployee => {
    const ownReports = employeeReports(reports, employee);
    const ownExpenses = employeeExpenses(expenses, employee);
    const activeMonths = [...new Set([...ownReports.map((row) => row.month), ...ownExpenses.map((row) => row.month)])].sort((a, b) => a - b);
    const months = activeMonths.map((number): FinalReportMonth => {
      const monthReports = ownReports.filter((row) => row.month === number);
      const monthExpenses = ownExpenses.filter((row) => row.month === number);
      return {
        month: number, label: `${REPORT_MONTHS[number - 1]} ${year}`, reports: monthReports, expenses: monthExpenses,
        totals: calculateTotals(monthReports, monthExpenses), missingExpenses: monthReports.length > 0 && monthExpenses.length === 0,
      };
    });
    return { employee, months, totals: calculateTotals(ownReports, ownExpenses) };
  }).filter((person) => person.totals.entries > 0 || person.totals.expenseEntries > 0 || !!selectedEmployee)
    .sort((a, b) => a.employee.name.localeCompare(b.employee.name));
  return {
    year, month, period: monthRangeLabel(year, range),
    names: employees.map((person) => person.employee.name), employees,
    generalExpenses: selectedEmployee ? [] : expenses.filter((row) => row.employeeId === null),
    totals: calculateTotals(reports, expenses), hasData: reports.length > 0 || expenses.length > 0,
    missingExpenses: employees.some((person) => person.months.some((period) => period.missingExpenses)),
  };
}

// User-entered names and notes stay readable without becoming WhatsApp formatting markers.
const plainText = (value: string) => value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/[*_~`]/g, "").replace(/\s+/g, " ").trim();
const number = (value: number) => value.toLocaleString("en-IN");
export function buildWhatsAppMessage(report: FinalReport): string {
  const lines = [
    "*BHARATHI ENTERPRISES*", "Ekart · Delivery & Expense Report", `Period: ${report.period}`,
    `Employees: ${report.names.length ? report.names.map(plainText).join(", ") : "General business expenses"}`,
    "──────────────────",
  ];
  for (const person of report.employees) {
    lines.push("", `*${plainText(person.employee.name)}*`);
    let entry = 0;
    for (const period of person.months) {
      lines.push("", `*${period.label}*`);
      if (!period.reports.length) lines.push("No delivery entries.");
      for (const row of period.reports) {
        entry++;
        lines.push(`Entry ${entry} · ${cycleDayRange(row.cycle, row.year, row.month)}`,
          `${number(row.deliveries)} deliveries × ${reportMoney(Number(row.pricePerDelivery))} = ${reportMoney(Number(row.totalValue))}`);
        if (row.notes) lines.push(`Note: ${plainText(row.notes)}`);
      }
      lines.push(`Month delivery value: ${reportMoney(period.totals.total)}`);
      if (period.expenses.length) {
        for (const expense of period.expenses) {
          lines.push(`Monthly expenses: ${reportMoney(Number(expense.amount))}${expense.notes ? ` · ${plainText(expense.notes)}` : ""}`);
        }
      } else lines.push("Monthly expenses: Not entered (₹0.00 used)");
      lines.push(`Month remaining: ${reportMoney(period.totals.net)}`);
    }
    lines.push("", `*${plainText(person.employee.name)} — totals*`,
      `Deliveries: ${number(person.totals.deliveries)}`, `Total value: ${reportMoney(person.totals.total)}`,
      `Total expenses value: ${reportMoney(person.totals.expenses)}`, `Remaining value: ${reportMoney(person.totals.net)}`,
      "──────────────────");
  }
  if (report.generalExpenses.length) {
    lines.push("", "*General business expenses*");
    for (const expense of report.generalExpenses) {
      lines.push(`${REPORT_MONTHS[expense.month - 1]} ${expense.year}: ${reportMoney(Number(expense.amount))}${expense.notes ? ` · ${plainText(expense.notes)}` : ""}`);
    }
    lines.push("General expenses are included once in the final total.", "──────────────────");
  }
  lines.push("", "*FINAL TOTALS*", `Total deliveries: ${number(report.totals.deliveries)}`,
    `Total value: ${reportMoney(report.totals.total)}`, `Total expenses value: ${reportMoney(report.totals.expenses)}`,
    `*Remaining value: ${reportMoney(report.totals.net)}*`, "Remaining = Total value − Total expenses");
  if (report.missingExpenses) lines.push("", "Note: Some monthly expenses are not entered yet. Remaining value may change.");
  if (!report.hasData) lines.push("", "No saved entries for this selection.");
  return lines.join("\n");
}

export function whatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
