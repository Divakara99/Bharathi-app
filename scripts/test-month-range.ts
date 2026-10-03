import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { monthRange, monthRangeLabel } from "../src/lib/report-range";
import { buildFinalReport, buildWhatsAppMessage } from "../src/lib/final-report";
import { buildExportTables, buildFullCsv, buildFullXlsx, type ExportSnapshot } from "../src/lib/full-export";
import { exportFilename } from "../src/lib/export-filenames";

async function main() {
  assert.throws(() => monthRange(7, 3), /To month/);
  assert.throws(() => monthRange(0, 12), /valid/);
  assert.throws(() => monthRange(1, 13), /valid/);
  assert.equal(monthRangeLabel(2026, monthRange(3, 6)), "March – June 2026");
  assert.equal(monthRangeLabel(2026, monthRange(3, 3)), "March 2026");
  const date = new Date("2026-06-30T10:00:00Z");
  const alpha = { id: 1, name: "Ramesh", createdAt: date };
  const beta = { id: 2, name: "Divakar", createdAt: date };
  const reports = [
    { id: 1, empName: alpha.name, year: 2026, month: 1, cycle: 1, deliveries: 1, pricePerDelivery: "20.00", totalValue: "20.00", notes: "OUTSIDE JANUARY", createdAt: date },
    { id: 2, empName: alpha.name, year: 2026, month: 3, cycle: 1, deliveries: 100, pricePerDelivery: "20.00", totalValue: "2000.00", notes: "MARCH", createdAt: date },
    { id: 3, empName: alpha.name, year: 2026, month: 3, cycle: 2, deliveries: 150, pricePerDelivery: "20.00", totalValue: "3000.00", notes: "MARCH SECOND", createdAt: date },
    { id: 4, empName: beta.name, year: 2026, month: 6, cycle: 2, deliveries: 200, pricePerDelivery: "25.00", totalValue: "5000.00", notes: "JUNE", createdAt: date },
    { id: 5, empName: alpha.name, year: 2026, month: 7, cycle: 1, deliveries: 10, pricePerDelivery: "20.00", totalValue: "200.00", notes: "OUTSIDE JULY", createdAt: date },
    { id: 6, empName: alpha.name, year: 2025, month: 3, cycle: 1, deliveries: 10, pricePerDelivery: "20.00", totalValue: "200.00", notes: "OTHER YEAR MARCH", createdAt: date },
  ];
  const expenses = [
    { id: 11, employeeId: 1, employeeName: alpha.name, year: 2026, month: 3, amount: "600.00", notes: "Fuel", updatedAt: date },
    { id: 12, employeeId: 2, employeeName: beta.name, year: 2026, month: 6, amount: "800.00", notes: "Salary", updatedAt: date },
    { id: 13, employeeId: null, employeeName: null, year: 2026, month: 4, amount: "100.00", notes: "Rent", updatedAt: date },
    { id: 14, employeeId: 1, employeeName: alpha.name, year: 2026, month: 7, amount: "25.00", notes: "OUTSIDE JULY COST", updatedAt: date },
    { id: 15, employeeId: 1, employeeName: alpha.name, year: 2025, month: 3, amount: "10.00", notes: "OTHER YEAR COST", updatedAt: date },
  ];
  const snapshot: ExportSnapshot = { employees: [alpha, beta], reports, expenses };
  const original = JSON.stringify(snapshot);
  const range = monthRange(3, 6);
  const report = buildFinalReport({ year: 2026, ...range, employees: snapshot.employees, reports, expenses });
  assert.equal(report.period, "March – June 2026");
  assert.equal(report.totals.deliveries, 450);
  assert.equal(report.totals.total, 10000);
  assert.equal(report.totals.expenses, 1500);
  assert.equal(report.totals.net, 8500);
  const message = buildWhatsAppMessage(report);
  assert.ok(message.includes("Period: March – June 2026"));
  assert.ok(message.includes("*Remaining value: ₹8,500.00*"));
  assert.ok(message.includes("16 – 30"));
  assert.ok(!message.includes("OUTSIDE"));
  assert.ok(!message.includes("OTHER YEAR"));
  const selected = buildFinalReport({ year: 2026, ...range, employees: snapshot.employees, reports, expenses, selectedEmployee: alpha });
  assert.equal(selected.totals.net, 4400);
  assert.equal(selected.generalExpenses.length, 0);
  console.log("PASS: WhatsApp inclusive range keeps both endpoint months, excludes other years/months and calculates correct employee/business balances.");

  const tables = buildExportTables(snapshot, { year: 2026, employeeName: null, generatedAt: date, ...range });
  const table = (name: string) => tables.find((value) => value.name === name)!;
  assert.equal(table("Delivery Reports").rows.length, 3);
  assert.equal(table("Monthly Expenses").rows.length, 3);
  assert.equal(table("Employee Monthly").rows.length, 8);
  assert.equal(table("Monthly Totals").rows.length, 4);
  for (const value of tables) for (const row of value.rows) {
    if (row.month !== undefined) assert.ok(row.month >= 3 && row.month <= 6);
    if (row.year !== undefined) assert.equal(row.year, 2026);
  }
  const grand = table("Grand Totals").rows.find((row) => row.recordType === "Business Grand Total")!;
  assert.equal(grand.totalValue, report.totals.total);
  assert.equal(grand.expenses, report.totals.expenses);
  assert.equal(grand.netEarnings, report.totals.net);
  assert.equal(table("Employee Yearly").rows[0].recordType, "Employee Month-Range Total");
  assert.ok(table("Export Info").rows.some((row) => row.notes?.includes("March – June 2026")));
  const csv = buildFullCsv(tables);
  assert.ok(!csv.includes("OUTSIDE"));
  assert.ok(!csv.includes("OTHER YEAR"));
  const workbook = new ExcelJS.Workbook();
  const bytes = await buildFullXlsx(tables, date);
  await workbook.xlsx.load(bytes.buffer);
  assert.equal(workbook.getWorksheet("Delivery Reports")!.rowCount, 4);
  assert.equal(workbook.getWorksheet("Employee Monthly")!.rowCount, 9);
  const filename = exportFilename([alpha.name, beta.name], 2026, "xlsx", "Full-Details", range);
  assert.ok(filename.includes("Mar-to-Jun"));
  assert.ok(filename.includes("Ramesh"));
  console.log("PASS: CSV/Excel detail rows, monthly/yearly/grand totals, period notes and filename are restricted to the same range.");

  const same = buildExportTables(snapshot, { year: 2026, employeeName: null, generatedAt: date, fromMonth: 3, toMonth: 3 });
  assert.equal(same.find((value) => value.name === "Monthly Totals")!.rows.length, 1);
  const allYears = buildExportTables(snapshot, { year: null, employeeName: null, generatedAt: date, ...range });
  assert.equal(allYears.find((value) => value.name === "Delivery Reports")!.rows.length, 4);
  assert.equal(allYears.find((value) => value.name === "Employee Monthly")!.rows.length, 16);
  assert.equal(allYears.find((value) => value.name === "Grand Totals")!.rows.find((row) => row.recordType === "Business Grand Total")!.netEarnings, 8690);
  const full = buildExportTables(snapshot, { year: null, employeeName: null, generatedAt: date });
  assert.equal(full.find((value) => value.name === "Delivery Reports")!.rows.length, reports.length);
  assert.equal(full.find((value) => value.name === "Employee Monthly")!.rows.length, 48);
  assert.equal(JSON.stringify(snapshot), original);
  console.log("PASS: single month, full year, all-years range and empty monthly rows remain valid; test data not mutated.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
