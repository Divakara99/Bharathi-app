import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { cycleDayRange, lastDayOfMonth, exportCycleLabel } from "../src/lib/report-period";
import { employeeNameList, exportFilename, downloadDisposition, filenameFromDisposition } from "../src/lib/export-filenames";
import { buildExportTables, buildFullCsv, buildFullXlsx, type ExportSnapshot } from "../src/lib/full-export";

async function main() {
  assert.equal(cycleDayRange(2, 2026, 2), "16 – 28");
  assert.equal(cycleDayRange(2, 2028, 2), "16 – 29");
  assert.equal(cycleDayRange(2, 2026, 4), "16 – 30");
  assert.equal(cycleDayRange(2, 2026, 1), "16 – 31");
  assert.equal(cycleDayRange(1, 2026, 2), "1 – 15");
  assert.equal(lastDayOfMonth(2100, 2), 28);
  assert.equal(exportCycleLabel(2, 2028, 2), "Cycle 2 (16–29)");
  const names = ["Divakar", "Ramesh", "பாரதி"];
  assert.equal(employeeNameList(["Divakar", "divakar", "Ramesh"]), "Divakar, Ramesh");
  const filename = exportFilename(names, 2026, "xlsx");
  for (const name of names) assert.ok(filename.includes(name));
  assert.ok(!filename.includes("All-Employees"));
  assert.equal(filenameFromDisposition(downloadDisposition(filename), "fallback"), filename);
  const long = exportFilename(Array.from({ length: 40 }, (_, i) => `பாரதி employee ${i}`), null, "csv");
  assert.ok(new TextEncoder().encode(long).length <= 220);
  assert.ok(long.endsWith(".csv"));
  console.log("PASS: correct 28/29/30/31-day labels and name-based UTF-8 download filenames.");

  const date = new Date("2026-04-30T10:00:00Z");
  const snapshot: ExportSnapshot = {
    employees: names.map((name, i) => ({ id: i + 1, name, createdAt: date })),
    reports: [
      { id: 1, empName: names[0], year: 2026, month: 4, cycle: 2, deliveries: 10, pricePerDelivery: "20.00", totalValue: "200.00", notes: "April details", createdAt: date },
      { id: 2, empName: names[1], year: 2028, month: 2, cycle: 2, deliveries: 15, pricePerDelivery: "20.00", totalValue: "300.00", notes: "Leap year details", createdAt: date },
    ],
    expenses: [],
  };
  const tables = buildExportTables(snapshot, { year: null, employeeName: null, generatedAt: date });
  assert.equal(tables[0].name, "Delivery Reports");
  assert.equal(tables[0].rows.find((r) => r.id === 1)?.cycle, "Cycle 2 (16–30)");
  assert.equal(tables[0].rows.find((r) => r.id === 2)?.cycle, "Cycle 2 (16–29)");
  const info = tables.find((t) => t.name === "Export Info")!;
  const infoNames = info.rows.find((r) => r.notes?.startsWith("Employees:"))!.notes!;
  for (const name of names) assert.ok(infoNames.includes(name));
  for (const row of tables.find((t) => t.name === "Monthly Totals")!.rows) {
    for (const name of names) assert.ok(row.employeeName?.includes(name));
    assert.ok(!row.employeeName?.includes("All employees"));
  }
  const csv = buildFullCsv(tables);
  assert.ok(!csv.includes("16–end"));
  assert.ok(csv.includes("Cycle 2 (16–30)"));
  const workbook = new ExcelJS.Workbook();
  const bytes = await buildFullXlsx(tables, date);
  await workbook.xlsx.load(bytes.buffer);
  assert.equal(workbook.worksheets[0].name, "Delivery Reports");
  for (const sheet of workbook.worksheets) {
    assert.equal(sheet.getCell("A1").value, sheet.name === "Export Info" ? "Notes" : "Employee Name");
    assert.equal(sheet.views[0].rightToLeft, false);
    sheet.eachRow((row) => row.eachCell((cell) => assert.equal(cell.alignment.horizontal, "left")));
  }
  const view = workbook.getWorksheet("Delivery Reports")!.views[0];
  if (view.state !== "frozen") throw new Error("Employee name column must be frozen");
  assert.equal(view.xSplit, 1);
  console.log("PASS: Excel opens on details; names start in column A, all information is left aligned, and combined rows list employee names.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
