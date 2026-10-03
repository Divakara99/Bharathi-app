import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import ExcelJS from "exceljs";

const require = createRequire(import.meta.url);
if (!process.env.PLAYWRIGHT_MODULE) throw new Error("Set PLAYWRIGHT_MODULE to the test browser package.");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const pin = process.env.TEST_DELETE_PIN ?? "9676";
const year = new Date().getUTCFullYear();
const suffix = randomUUID().slice(0, 6);
const names = [`QA Save Alpha ${suffix}`, `QA Save Beta ${suffix}`];
const owned = { reports: [], expenses: [], employees: [] };
let browser, baseline;
async function request(path, body) {
  const response = await fetch(base + path, { ...(body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30000) });
  return { status: response.status, data: await response.json() };
}
async function snapshot() {
  const values = await Promise.all([request("/api/employees"), request("/api/reports"), request("/api/expenses")]);
  values.forEach((value) => assert.equal(value.status, 200));
  const sort = (rows) => [...rows].sort((a, b) => a.id - b.id);
  return { employees: sort(values[0].data.employees), reports: sort(values[1].data.reports), expenses: sort(values[2].data.expenses) };
}
function workbookRows(sheet) {
  const headers = sheet.getRow(1).values.slice(1);
  return Array.from({ length: sheet.rowCount - 1 }, (_, index) => Object.fromEntries(headers.map((header, column) => [header, sheet.getRow(index + 2).getCell(column + 1).value])));
}
try {
  baseline = await snapshot();
  const created = [];
  for (const name of names) {
    const result = await request("/api/employees", { name });
    assert.equal(result.status, 201); created.push(result.data.employee); owned.employees.push(result.data.employee.id);
  }
  browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, acceptDownloads: true });
  const page = await context.newPage();
  const errors = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><iframe id="preview" sandbox="allow-scripts allow-same-origin allow-forms allow-downloads" src="${base}" style="width:390px;height:844px;border:0"></iframe></body></html>`);
  const app = page.frameLocator("#preview");
  await app.getByRole("heading", { name: "Bharathi Enterprises", exact: true }).waitFor();
  const entry = app.locator("#screen-entry"), summary = app.locator("#screen-summary"), nav = app.getByRole("navigation");
  const monthSelect = entry.getByRole("combobox", { name: "Month", exact: true });
  const cycleSelect = entry.getByRole("combobox", { name: "Cycle (15 days)", exact: true });
  for (const [month, end] of [["1", 31], ["2", new Date(Date.UTC(year, 2, 0)).getUTCDate()], ["4", 30]]) {
    await monthSelect.selectOption(month);
    assert.equal(await cycleSelect.locator('option[value="2"]').innerText(), `2nd Cycle (16 – ${end})`);
  }
  console.log("PASS mobile: the cycle picker uses each month's real final day.");
  await monthSelect.selectOption("2");
  await cycleSelect.selectOption("2");
  await entry.getByRole("combobox", { name: "Employee", exact: true }).selectOption(names[0]);
  await entry.getByRole("spinbutton", { name: "No. of Deliveries", exact: true }).fill("10");
  await entry.getByRole("spinbutton", { name: "Price / Delivery (₹)", exact: true }).fill("20");
  await entry.getByRole("textbox", { name: "Notes (optional)", exact: true }).fill(names[0]);
  const savePending = page.waitForResponse((response) => response.url().endsWith("/api/reports") && response.request().method() === "POST");
  await entry.getByRole("button", { name: "Save Report", exact: true }).click();
  const saved = await savePending; assert.equal(saved.status(), 201);
  const report = (await saved.json()).report; owned.reports.push(report.id);
  await summary.waitFor({ state: "visible" });
  assert.equal(await summary.getByLabel("Summary employee filter", { exact: true }).inputValue(), names[0]);
  assert.equal(await nav.getByRole("button", { name: /Summary/ }).getAttribute("aria-current"), "page");
  assert.equal(await entry.isVisible(), false);
  console.log("PASS mobile: saving a new delivery opens the saved employee's Summary.");

  await nav.getByRole("button", { name: /Records/ }).click();
  const records = app.locator("#screen-records");
  const card = records.locator("li").filter({ hasText: names[0] }).filter({ has: app.getByRole("button", { name: "Edit", exact: true }) });
  assert.ok((await card.innerText()).includes(`16 – ${new Date(Date.UTC(year, 2, 0)).getUTCDate()}`));
  await card.getByRole("button", { name: "Edit", exact: true }).click();
  await entry.waitFor({ state: "visible" });
  await entry.getByRole("spinbutton", { name: "No. of Deliveries", exact: true }).fill("12");
  const editPending = page.waitForResponse((response) => response.url().endsWith(`/api/reports/${report.id}`) && response.request().method() === "PATCH");
  await entry.getByRole("button", { name: "Update Report", exact: true }).click();
  assert.equal((await editPending).status(), 200);
  await summary.waitFor({ state: "visible" });
  assert.equal(await summary.getByLabel("Summary employee filter", { exact: true }).inputValue(), names[0]);
  console.log("PASS mobile: editing a delivery also returns to Summary; record labels use actual month-end dates.");

  await nav.getByRole("button", { name: /Expenses/ }).click();
  const expenseScreen = app.locator("#screen-expenses");
  await expenseScreen.getByRole("combobox", { name: "Expense employee", exact: true }).selectOption(String(created[0].id));
  await expenseScreen.getByRole("combobox", { name: "Expense month", exact: true }).selectOption("2");
  await expenseScreen.getByRole("spinbutton", { name: "Monthly expense amount (₹)", exact: true }).fill("50");
  await expenseScreen.getByRole("textbox", { name: "Expense notes (optional)", exact: true }).fill(names[0]);
  const expensePending = page.waitForResponse((response) => response.url().endsWith("/api/expenses") && response.request().method() === "POST");
  await expenseScreen.getByRole("button", { name: "Save Monthly Expenses", exact: true }).click();
  const expenseResponse = await expensePending; assert.equal(expenseResponse.status(), 201);
  owned.expenses.push((await expenseResponse.json()).expense.id);
  await summary.waitFor({ state: "visible" });
  assert.equal(await summary.getByLabel("Summary employee filter", { exact: true }).inputValue(), names[0]);
  assert.ok((await summary.getByTestId("totals-cards").innerText()).includes("₹190.00"));
  console.log("PASS mobile: expenses save opens Summary with the correct updated net.");

  const downloads = summary.getByRole("region", { name: "Download all details", exact: true });
  const combinedOption = await downloads.getByLabel("Full export employees", { exact: true }).locator('option[value="all"]').innerText();
  for (const name of names) assert.ok(combinedOption.includes(name));
  for (const format of ["csv", "xlsx"]) {
    const pending = page.waitForEvent("download", { timeout: 90000 });
    await downloads.getByRole("button", { name: format === "csv" ? "Download full CSV" : "Download full Excel (.xlsx)", exact: true }).click();
    const download = await pending;
    assert.ok(!download.suggestedFilename().includes("All-Employees"));
    for (const name of names) assert.ok(download.suggestedFilename().includes(name.replaceAll(" ", "-")));
    const bytes = await readFile(await download.path());
    if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(bytes);
      assert.equal(workbook.worksheets[0].name, "Delivery Reports");
      const reportSheet = workbook.getWorksheet("Delivery Reports");
      assert.equal(reportSheet.getCell("A1").value, "Employee Name");
      reportSheet.eachRow((row) => row.eachCell((cell) => assert.equal(cell.alignment.horizontal, "left")));
      const exported = workbookRows(reportSheet).find((row) => row["Record ID"] === report.id);
      assert.equal(exported["15-Day Cycle"], `Cycle 2 (16–${new Date(Date.UTC(year, 2, 0)).getUTCDate()})`);
      for (const name of names) assert.ok(workbookRows(workbook.getWorksheet("Grand Totals")).find((row) => row["Record Type"] === "Business Grand Total")["Employee Name"].includes(name));
    } else {
      const csv = bytes.toString("utf8");
      for (const name of names) assert.ok(csv.includes(name));
      assert.ok(!csv.includes("16–end"));
    }
  }
  await downloads.getByLabel("Full export employees", { exact: true }).selectOption(String(created[0].id));
  const namedPending = page.waitForEvent("download", { timeout: 90000 });
  await downloads.getByRole("button", { name: "Download full Excel (.xlsx)", exact: true }).click();
  const singleDownload = await namedPending;
  assert.ok(singleDownload.suggestedFilename().includes(names[0].replaceAll(" ", "-")));
  assert.ok(!singleDownload.suggestedFilename().includes(names[1].replaceAll(" ", "-")));
  assert.deepEqual(errors, []);
  console.log("PASS mobile: CSV/Excel downloads list real names, use name-based filenames, and Excel details are left aligned.");
} finally {
  if (browser) await browser.close();
  for (const kind of ["report", "expense", "employee"]) {
    const ids = owned[kind === "report" ? "reports" : kind === "expense" ? "expenses" : "employees"];
    for (const id of ids) {
      const result = await request("/api/delete", { kind, id, pin });
      assert.ok(result.status === 200 || result.status === 404, JSON.stringify(result.data));
    }
  }
  if (baseline) {
    assert.deepEqual(await snapshot(), baseline);
    console.log("PASS: only owned test rows removed; all original saved data is unchanged.");
  }
}
