import assert from "node:assert/strict";
import { calculateTotals, employeeTotals, type EmployeeRow, type ExpenseRow, type ReportRow } from "../src/lib/delivery-totals";

const alpha: EmployeeRow = { id: 1, name: "Alpha" };
const beta: EmployeeRow = { id: 2, name: "Beta" };
const reports: ReportRow[] = [
  { id: 1, empName: "Alpha", year: 2026, month: 1, cycle: 1, deliveries: 10, pricePerDelivery: "20.00", totalValue: "200.00", notes: null },
  { id: 2, empName: "alpha", year: 2026, month: 1, cycle: 2, deliveries: 15, pricePerDelivery: "20.00", totalValue: "300.00", notes: null },
  { id: 3, empName: "Beta", year: 2026, month: 1, cycle: 1, deliveries: 20, pricePerDelivery: "25.00", totalValue: "500.00", notes: null },
];
const expenses: ExpenseRow[] = [
  { id: 1, employeeId: 1, employeeName: "Alpha", year: 2026, month: 1, amount: "100.00", notes: null },
  { id: 2, employeeId: 2, employeeName: "Beta", year: 2026, month: 1, amount: "125.00", notes: null },
  { id: 3, employeeId: null, employeeName: null, year: 2026, month: 1, amount: "50.00", notes: null },
];
assert.deepEqual(employeeTotals(reports, expenses, alpha), { deliveries: 25, total: 500, expenses: 100, net: 400, entries: 2, expenseEntries: 1 });
assert.deepEqual(employeeTotals(reports, expenses, beta), { deliveries: 20, total: 500, expenses: 125, net: 375, entries: 1, expenseEntries: 1 });
assert.deepEqual(calculateTotals(reports, expenses), { deliveries: 45, total: 1000, expenses: 275, net: 725, entries: 3, expenseEntries: 3 });
assert.equal(employeeTotals([], expenses, alpha).net, -100);
assert.equal(employeeTotals([], [], alpha).net, 0);
const decimals = ["0.10", "0.20", "0.10"].map((amount, i) => ({ ...expenses[0], id: i + 1, month: i + 1, amount }));
assert.equal(calculateTotals([], decimals).expenses, 0.4);
console.log("PASS: separate employee balances, both delivery cycles, one monthly deduction, general expenses, negative net and decimal precision.");
