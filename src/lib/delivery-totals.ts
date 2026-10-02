export type ReportRow = {
  id: number;
  empName: string;
  year: number;
  month: number;
  cycle: number;
  deliveries: number;
  pricePerDelivery: string;
  totalValue: string;
  notes: string | null;
};

export type ExpenseRow = {
  id: number;
  employeeId: number | null;
  employeeName: string | null;
  year: number;
  month: number;
  amount: string;
  notes: string | null;
};

export type EmployeeRow = { id: number; name: string };

export const sameEmployeeName = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

export function employeeReports(rows: ReportRow[], employee: EmployeeRow): ReportRow[] {
  return rows.filter((row) => sameEmployeeName(row.empName, employee.name));
}

export function employeeExpenses(rows: ExpenseRow[], employee: EmployeeRow): ExpenseRow[] {
  return rows.filter((row) => row.employeeId === employee.id);
}

// Sum in paise so repeated decimal amounts do not introduce rounding drift.
export function calculateTotals(reports: ReportRow[], expenses: ExpenseRow[]) {
  const totalPaise = reports.reduce((sum, row) => sum + Math.round(Number(row.totalValue) * 100), 0);
  const expensePaise = expenses.reduce((sum, row) => sum + Math.round(Number(row.amount) * 100), 0);
  return {
    deliveries: reports.reduce((sum, row) => sum + row.deliveries, 0),
    total: totalPaise / 100,
    expenses: expensePaise / 100,
    net: (totalPaise - expensePaise) / 100,
    entries: reports.length,
    expenseEntries: expenses.length,
  };
}

export function employeeTotals(reports: ReportRow[], expenses: ExpenseRow[], employee: EmployeeRow) {
  return calculateTotals(employeeReports(reports, employee), employeeExpenses(expenses, employee));
}
