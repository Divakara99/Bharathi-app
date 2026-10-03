import assert from "node:assert/strict";
import { buildFinalReport, buildWhatsAppMessage, whatsAppShareUrl } from "../src/lib/final-report";
import type { EmployeeRow, ExpenseRow, ReportRow } from "../src/lib/delivery-totals";

const alpha: EmployeeRow = { id: 1, name: "Ramesh" };
const beta: EmployeeRow = { id: 2, name: "பாரதி" };
const rows: ReportRow[] = [
  { id: 2, empName: "Ramesh", year: 2026, month: 1, cycle: 2, deliveries: 150, pricePerDelivery: "20.00", totalValue: "3000.00", notes: "Second cycle" },
  { id: 1, empName: "ramesh", year: 2026, month: 1, cycle: 1, deliveries: 100, pricePerDelivery: "20.00", totalValue: "2000.00", notes: "Fuel & incentive" },
  { id: 3, empName: "பாரதி", year: 2026, month: 1, cycle: 1, deliveries: 200, pricePerDelivery: "25.00", totalValue: "5000.00", notes: "தமிழ்" },
  { id: 4, empName: "Ramesh", year: 2026, month: 2, cycle: 2, deliveries: 10, pricePerDelivery: "10.00", totalValue: "100.00", notes: null },
  { id: 5, empName: "Ramesh", year: 2025, month: 1, cycle: 1, deliveries: 1000, pricePerDelivery: "100.00", totalValue: "100000.00", notes: "Other year" },
];
const expenses: ExpenseRow[] = [
  { id: 11, employeeId: 1, employeeName: "Ramesh", year: 2026, month: 1, amount: "600.00", notes: "Fuel" },
  { id: 12, employeeId: 2, employeeName: "பாரதி", year: 2026, month: 1, amount: "800.00", notes: "Salary" },
  { id: 13, employeeId: null, employeeName: null, year: 2026, month: 1, amount: "100.00", notes: "Rent" },
  { id: 14, employeeId: 1, employeeName: "Ramesh", year: 2025, month: 1, amount: "50000.00", notes: "Other year" },
];
const input = { year: 2026, month: null, employees: [alpha, beta], reports: rows, expenses };
const original = JSON.stringify(input);
const all = buildFinalReport(input);
assert.equal(all.totals.deliveries, 460);
assert.equal(all.totals.total, 10100);
assert.equal(all.totals.expenses, 1500);
assert.equal(all.totals.net, 8600);
assert.equal(all.generalExpenses.length, 1);
assert.equal(all.employees.find((person) => person.employee.id === 1)!.totals.net, 4500);
assert.equal(all.missingExpenses, true);
assert.equal(all.hasData, true);
assert.equal(JSON.stringify(input), original);
const text = buildWhatsAppMessage(all);
assert.ok(text.includes("*BHARATHI ENTERPRISES*"));
assert.ok(text.includes("Ramesh, பாரதி"));
assert.ok(text.includes("Entry 1 · 1 – 15"));
assert.ok(text.includes("Entry 2 · 16 – 31"));
assert.ok(text.includes("100 deliveries × ₹20.00 = ₹2,000.00"));
assert.ok(text.includes("150 deliveries × ₹20.00 = ₹3,000.00"));
assert.ok(text.includes("200 deliveries × ₹25.00 = ₹5,000.00"));
assert.ok(text.includes("Monthly expenses: ₹600.00 · Fuel"));
assert.ok(text.includes("Total value: ₹10,100.00"));
assert.ok(text.includes("Total expenses value: ₹1,500.00"));
assert.ok(text.includes("*Remaining value: ₹8,600.00*"));
assert.ok(!text.includes("Other year"));
assert.ok(text.includes("Not entered"));
assert.ok(text.includes("remaining value may change") || text.includes("Remaining value may change"));
const url = new URL(whatsAppShareUrl(text));
assert.equal(url.origin, "https://wa.me");
assert.equal(url.searchParams.get("text"), text);
console.log("PASS: readable entry-wise report, prices, monthly expense notes and correct final totals; WhatsApp link preserves the complete formatted message.");

const selected = buildFinalReport({ ...input, selectedEmployee: alpha, month: 1 });
assert.equal(selected.totals.deliveries, 250);
assert.equal(selected.totals.total, 5000);
assert.equal(selected.totals.expenses, 600);
assert.equal(selected.totals.net, 4400);
assert.equal(selected.generalExpenses.length, 0);
assert.equal(selected.missingExpenses, false);
assert.equal(selected.employees.length, 1);
const selectedMessage = buildWhatsAppMessage(selected);
assert.ok(selectedMessage.includes("Period: January 2026"));
assert.ok(!selectedMessage.includes("பாரதி"));
assert.ok(!selectedMessage.includes("February 2026"));
assert.ok(!selectedMessage.includes("Rent"));
assert.ok(selectedMessage.includes("*Remaining value: ₹4,400.00*"));
console.log("PASS: selected employee/month excludes everyone else's data; one monthly expense is never deducted twice.");

const empty = buildFinalReport({ ...input, selectedEmployee: alpha, month: 3 });
assert.equal(empty.hasData, false);
assert.equal(empty.totals.net, 0);
const costOnly = buildFinalReport({ ...input, reports: [], selectedEmployee: alpha, month: 1 });
assert.equal(costOnly.hasData, true);
assert.equal(costOnly.totals.net, -600);
assert.ok(buildWhatsAppMessage(costOnly).includes("No delivery entries."));
const zeroCost = buildFinalReport({ ...input, selectedEmployee: alpha, month: 1, expenses: [{ ...expenses[0], amount: "0.00" }] });
assert.equal(zeroCost.missingExpenses, false);
assert.equal(zeroCost.totals.net, 5000);
const leap = buildFinalReport({ ...input, year: 2028, selectedEmployee: alpha, month: 2,
  reports: [{ ...rows[3], year: 2028 }], expenses: [] });
assert.ok(buildWhatsAppMessage(leap).includes("16 – 29"));
console.log("PASS: empty months, expense-only periods, zero expenses, incomplete expenses and leap-year month end.");
