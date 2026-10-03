import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import * as exportModule from "../src/lib/full-export.ts";
const { buildExportTables, buildFullCsv, buildFullXlsx } = exportModule.default ?? exportModule;

const date = "2026-01-16T10:30:00.000Z";
const employees = [
  { id: 11, name: "Alpha", createdAt: date },
  { id: 12, name: "பாரதி, ரவி", createdAt: date },
];
const snapshot = {
  employees,
  reports: [
    { id: 1, empName: "Alpha", year: 2026, month: 1, cycle: 1, deliveries: 100, pricePerDelivery: "20.00", totalValue: "2000.00", notes: '=HYPERLINK("https://example.com")', createdAt: date },
    { id: 2, empName: "Alpha", year: 2026, month: 1, cycle: 2, deliveries: 150, pricePerDelivery: "20.00", totalValue: "3000.00", notes: 'Fuel, "advance"\nதமிழ் note', createdAt: date },
    { id: 3, empName: employees[1].name, year: 2026, month: 1, cycle: 1, deliveries: 200, pricePerDelivery: "25.00", totalValue: "5000.00", notes: null, createdAt: date },
    { id: 4, empName: "Alpha", year: 2024, month: 2, cycle: 2, deliveries: 1, pricePerDelivery: "10.00", totalValue: "10.00", notes: "Leap year", createdAt: date },
  ],
  expenses: [
    { id: 21, employeeId: 11, employeeName: "Alpha", year: 2026, month: 1, amount: "600.00", notes: "Fuel", updatedAt: date },
    { id: 22, employeeId: 12, employeeName: employees[1].name, year: 2026, month: 1, amount: "800.00", notes: "Salary", updatedAt: date },
    { id: 23, employeeId: null, employeeName: null, year: 2026, month: 1, amount: "100.00", notes: "Rent", updatedAt: date },
  ],
};
const scope = { year: null, employeeName: null, generatedAt: new Date(date) };
const tables = buildExportTables(snapshot, scope);
const getTable = (name) => tables.find((table) => table.name === name);
assert.equal(tables.length, 9);
assert.equal(getTable("Delivery Reports").rows.length, 4);
assert.equal(getTable("Monthly Expenses").rows.length, 3);
assert.equal(getTable("Employee Monthly").rows.length, 48);
assert.equal(getTable("Delivery Reports").rows.find((row) => row.id === 4).periodEnd, "2024-02-29");
const alphaJanuary = getTable("Employee Monthly").rows.find((row) => row.employeeId === 11 && row.year === 2026 && row.month === 1);
assert.equal(alphaJanuary.totalValue, 5000);
assert.equal(alphaJanuary.expenses, 600);
assert.equal(alphaJanuary.netEarnings, 4400);
assert.equal(alphaJanuary.reportCount, 2);
const grand = getTable("Grand Totals").rows.find((row) => row.recordType === "Business Grand Total");
assert.equal(grand.totalValue, 10010);
assert.equal(grand.expenses, 1500);
assert.equal(grand.netEarnings, 8510);
console.log("PASS: all raw details, both cycles, 12-month employee summaries, yearly/grand totals and leap-year periods.");

function parseCsv(text) {
  const matrix = [], row = [];
  let cell = "", quoted = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && char === ',') { row.push(cell); cell = ""; }
    else if (!quoted && (char === '\r' || char === '\n')) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); matrix.push([...row]); row.length = 0; cell = "";
    } else cell += char;
  }
  if (row.length || cell) { row.push(cell); matrix.push(row); }
  const headers = matrix.shift();
  return matrix.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]])));
}
const csv = buildFullCsv(tables);
assert.equal(csv.charCodeAt(0), 0xFEFF);
const csvRows = parseCsv(csv);
assert.equal(csvRows.length, tables.reduce((sum, table) => sum + table.rows.length, 0));
assert.equal(csvRows.find((row) => row["Record Type"] === "Delivery Report" && row["Record ID"] === "2").Notes, snapshot.reports[1].notes);
assert.equal(csvRows.find((row) => row["Record Type"] === "Delivery Report" && row["Record ID"] === "1").Notes, "'" + snapshot.reports[0].notes);
assert.equal(csvRows.find((row) => row["Record Type"] === "Monthly Expense" && row["Record ID"] === "22")["Employee Name"], employees[1].name);
assert.equal(csvRows.find((row) => row["Record Type"] === "Delivery Report" && row["Record ID"] === "1")["Per Delivery Price (INR)"], "20.00");
console.log("PASS: CSV preserves Tamil, commas, quoted/multiline notes, 2-decimal money and prevents formula injection.");

const bytes = await buildFullXlsx(tables, scope.generatedAt);
assert.equal(String.fromCharCode(...bytes.slice(0, 2)), "PK");
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(Buffer.from(bytes));
assert.deepEqual(workbook.worksheets.map((sheet) => sheet.name), tables.map((table) => table.name));
function sheetRows(sheet) {
  const headers = sheet.getRow(1).values.slice(1);
  const rows = [];
  for (let i = 2; i <= sheet.rowCount; i++) rows.push(Object.fromEntries(headers.map((header, index) => [header, sheet.getRow(i).getCell(index + 1).value])));
  return rows;
}
for (const table of tables) assert.equal(workbook.getWorksheet(table.name).rowCount, table.rows.length + 1);
const excelReports = sheetRows(workbook.getWorksheet("Delivery Reports"));
assert.equal(excelReports.find((row) => row["Record ID"] === 1)["Per Delivery Price (INR)"], 20);
assert.equal(excelReports.find((row) => row["Record ID"] === 1).Notes, snapshot.reports[0].notes);
assert.equal(excelReports.find((row) => row["Record ID"] === 2).Notes, snapshot.reports[1].notes);
assert.equal(sheetRows(workbook.getWorksheet("Grand Totals")).find((row) => row["Record Type"] === "Business Grand Total")["Net Earnings (INR)"], 8510);
console.log("PASS: genuine .xlsx opens with 9 worksheets; prices and balances are numeric, notes remain literal text.");

const base = process.env.TEST_BASE_URL;
if (base) {
  const get = async (path) => {
    const response = await fetch(base + path, { signal: AbortSignal.timeout(60000) });
    return response;
  };
  const state = async () => {
    const values = await Promise.all([get("/api/employees"), get("/api/reports"), get("/api/expenses")]);
    for (const response of values) assert.equal(response.status, 200);
    const data = await Promise.all(values.map((r) => r.json()));
    const sort = (rows) => [...rows].sort((a, b) => a.id - b.id);
    return { employees: sort(data[0].employees), reports: sort(data[1].reports), expenses: sort(data[2].expenses) };
  };
  const before = await state();
  const excelResponse = await get("/api/export?format=xlsx&year=all&employeeId=all");
  assert.equal(excelResponse.status, 200);
  const disposition = excelResponse.headers.get("Content-Disposition");
  assert.ok(disposition.includes("filename*=UTF-8''"));
  const downloadName = decodeURIComponent(disposition.split("filename*=UTF-8''")[1]);
  assert.ok(downloadName.includes("All-Years-"));
  assert.ok(downloadName.endsWith(".xlsx"));
  assert.ok(!downloadName.includes("All-Employees"));
  assert.ok(excelResponse.headers.get("Content-Type").includes("spreadsheetml"));
  const exported = new ExcelJS.Workbook();
  await exported.xlsx.load(Buffer.from(await excelResponse.arrayBuffer()));
  const deliveryRows = sheetRows(exported.getWorksheet("Delivery Reports"));
  const expenseRows = sheetRows(exported.getWorksheet("Monthly Expenses"));
  assert.equal(deliveryRows.length, before.reports.length);
  assert.equal(expenseRows.length, before.expenses.length);
  for (const report of before.reports) {
    const row = deliveryRows.find((r) => r["Record ID"] === report.id);
    assert.equal(row["Employee Name"], report.empName);
    assert.equal(row.Deliveries, report.deliveries);
    assert.equal(row["Per Delivery Price (INR)"], Number(report.pricePerDelivery));
    assert.equal(row["Total Value (INR)"], Number(report.totalValue));
    assert.equal(row.Notes ?? "", report.notes ?? "");
    assert.equal(row["Created At (UTC)"], report.createdAt);
  }
  for (const expense of before.expenses) {
    const row = expenseRows.find((r) => r["Record ID"] === expense.id);
    assert.equal(row["Employee Name"], expense.employeeName ?? "General business expenses");
    assert.equal(row["Expenses (INR)"], Number(expense.amount));
    assert.equal(row.Notes ?? "", expense.notes ?? "");
    assert.equal(row["Updated At (UTC)"], expense.updatedAt);
  }
  const csvResponse = await get("/api/export?format=csv&year=all&employeeId=all");
  assert.equal(csvResponse.status, 200);
  assert.ok(csvResponse.headers.get("Content-Disposition").includes(".csv"));
  const fullCsvRows = parseCsv(await csvResponse.text());
  assert.equal(fullCsvRows.filter((r) => r["Record Type"] === "Delivery Report").length, before.reports.length);
  assert.equal(fullCsvRows.filter((r) => r["Record Type"] === "Monthly Expense").length, before.expenses.length);
  console.log("PASS: API downloads complete saved data as valid CSV/XLSX with correct filenames, prices, notes and dates.");
  if (before.employees.length) {
    const selected = before.employees[0];
    const savedYears = [...new Set([...before.reports.map((r) => r.year), ...before.expenses.map((e) => e.year)])];
    const selectedYear = savedYears[0] ?? new Date().getUTCFullYear();
    const filtered = await get(`/api/export?format=xlsx&year=${selectedYear}&employeeId=${selected.id}`);
    assert.equal(filtered.status, 200);
    const selectedWorkbook = new ExcelJS.Workbook();
    await selectedWorkbook.xlsx.load(Buffer.from(await filtered.arrayBuffer()));
    assert.equal(sheetRows(selectedWorkbook.getWorksheet("Employees")).length, 1);
    assert.equal(sheetRows(selectedWorkbook.getWorksheet("Employee Monthly")).length, 12);
    const ownReports = before.reports.filter((r) => r.year === selectedYear && r.empName.toLowerCase() === selected.name.toLowerCase());
    const ownExpenses = before.expenses.filter((e) => e.year === selectedYear && e.employeeId === selected.id);
    assert.equal(sheetRows(selectedWorkbook.getWorksheet("Delivery Reports")).length, ownReports.length);
    assert.equal(sheetRows(selectedWorkbook.getWorksheet("Monthly Expenses")).length, ownExpenses.length);
    console.log("PASS: selected employee/year exports only that person's details and their 12 monthly totals.");
  }
  for (const path of ["/api/export?format=pdf", "/api/export?year=bad", "/api/export?employeeId=0"]) assert.equal((await get(path)).status, 400);
  assert.equal((await get("/api/export?employeeId=2147483647")).status, 404);
  assert.deepEqual(await state(), before);
  console.log("PASS: invalid export options are rejected; saved data is unchanged after every download.");
}
