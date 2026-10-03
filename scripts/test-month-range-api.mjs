import assert from "node:assert/strict";
import ExcelJS from "exceljs";
const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
async function get(path) { return fetch(base + path, { signal: AbortSignal.timeout(60000) }); }
async function snapshot() {
  const responses = await Promise.all([get("/api/employees"), get("/api/reports"), get("/api/expenses")]);
  responses.forEach((res) => assert.equal(res.status, 200));
  const data = await Promise.all(responses.map((res) => res.json()));
  const sort = (rows) => [...rows].sort((a, b) => a.id - b.id);
  return { employees: sort(data[0].employees), reports: sort(data[1].reports), expenses: sort(data[2].expenses) };
}
function sheetRows(sheet) {
  const headers = sheet.getRow(1).values.slice(1);
  return Array.from({ length: sheet.rowCount - 1 }, (_, index) => Object.fromEntries(headers.map((header, column) => [header, sheet.getRow(index + 2).getCell(column + 1).value])));
}
const before = await snapshot();
const year = before.reports[0]?.year ?? before.expenses[0]?.year ?? new Date().getUTCFullYear();
const numberSum = (rows, field) => rows.reduce((sum, row) => sum + Math.round(Number(row[field]) * 100), 0) / 100;
for (const [from, to] of [[1, 12], [3, 6], [1, 1], [10, 12]]) {
  for (const format of ["xlsx", "csv"]) {
    const response = await get(`/api/export?format=${format}&year=${year}&fromMonth=${from}&toMonth=${to}`);
    assert.equal(response.status, 200, await response.clone().text());
    const disposition = response.headers.get("Content-Disposition");
    assert.ok(disposition.includes(`.${format}`));
    if (format === "csv") {
      const text = await response.text();
      assert.ok(text.includes('"Record Type"'));
      assert.ok(text.includes("Month range:"));
    } else {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(Buffer.from(await response.arrayBuffer()));
      const reports = before.reports.filter((row) => row.year === year && row.month >= from && row.month <= to);
      const expenses = before.expenses.filter((row) => row.year === year && row.month >= from && row.month <= to);
      const detailRows = sheetRows(workbook.getWorksheet("Delivery Reports"));
      const costRows = sheetRows(workbook.getWorksheet("Monthly Expenses"));
      assert.deepEqual(detailRows.map((row) => row["Record ID"]).sort((a, b) => a - b), reports.map((row) => row.id).sort((a, b) => a - b));
      assert.deepEqual(costRows.map((row) => row["Record ID"]).sort((a, b) => a - b), expenses.map((row) => row.id).sort((a, b) => a - b));
      for (const name of ["Employee Monthly", "Monthly Totals"]) {
        const monthly = sheetRows(workbook.getWorksheet(name));
        assert.ok(monthly.every((row) => row["Month Number"] >= from && row["Month Number"] <= to));
      }
      const grand = sheetRows(workbook.getWorksheet("Grand Totals")).find((row) => row["Record Type"] === "Business Grand Total");
      assert.equal(grand["Total Value (INR)"], numberSum(reports, "totalValue"));
      assert.equal(grand["Expenses (INR)"], numberSum(expenses, "amount"));
      assert.equal(Math.round(grand["Net Earnings (INR)"] * 100), Math.round((numberSum(reports, "totalValue") - numberSum(expenses, "amount")) * 100));
    }
  }
  console.log(`PASS API: months ${from}–${to}, both formats, correct saved rows and range totals.`);
}
const allYears = await get("/api/export?format=xlsx&year=all&fromMonth=3&toMonth=6");
assert.equal(allYears.status, 200);
const combined = new ExcelJS.Workbook();
await combined.xlsx.load(Buffer.from(await allYears.arrayBuffer()));
assert.ok(sheetRows(combined.getWorksheet("Delivery Reports")).every((row) => row["Month Number"] >= 3 && row["Month Number"] <= 6));
for (const params of ["fromMonth=6&toMonth=3", "fromMonth=0&toMonth=6", "fromMonth=1&toMonth=13", "fromMonth=3", "toMonth=6", "fromMonth=bad&toMonth=6"]) {
  assert.equal((await get(`/api/export?year=${year}&${params}`)).status, 400);
}
assert.deepEqual(await snapshot(), before);
console.log("PASS API: all-years filtering, invalid/reversed range rejection, and read-only data preservation.");
