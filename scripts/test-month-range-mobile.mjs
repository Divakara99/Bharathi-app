import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import ExcelJS from "exceljs";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const year = new Date().getUTCFullYear();
const alpha = { id: 7001, name: "Ramesh" }, beta = { id: 7002, name: "Divakar" };
const reports = [
  { id: 1, empName: alpha.name, year, month: 1, cycle: 1, deliveries: 1, pricePerDelivery: "20.00", totalValue: "20.00", notes: "OUTSIDE JANUARY" },
  { id: 2, empName: alpha.name, year, month: 3, cycle: 1, deliveries: 100, pricePerDelivery: "20.00", totalValue: "2000.00", notes: "MARCH" },
  { id: 3, empName: alpha.name, year, month: 3, cycle: 2, deliveries: 150, pricePerDelivery: "20.00", totalValue: "3000.00", notes: "MARCH SECOND" },
  { id: 4, empName: beta.name, year, month: 6, cycle: 2, deliveries: 200, pricePerDelivery: "25.00", totalValue: "5000.00", notes: "JUNE" },
  { id: 5, empName: alpha.name, year, month: 7, cycle: 1, deliveries: 10, pricePerDelivery: "20.00", totalValue: "200.00", notes: "OUTSIDE JULY" },
];
const expenses = [
  { id: 11, employeeId: alpha.id, employeeName: alpha.name, year, month: 3, amount: "600.00", notes: "Fuel" },
  { id: 12, employeeId: beta.id, employeeName: beta.name, year, month: 6, amount: "800.00", notes: "Salary" },
  { id: 13, employeeId: null, employeeName: null, year, month: 4, amount: "100.00", notes: "Rent" },
  { id: 14, employeeId: alpha.id, employeeName: alpha.name, year, month: 7, amount: "25.00", notes: "OUTSIDE JULY" },
];
async function snapshot() {
  const get = async (path) => { const r = await fetch(base + path); assert.equal(r.status, 200); return r.json(); };
  const [e, r, c] = await Promise.all([get("/api/employees"), get("/api/reports"), get("/api/expenses")]);
  const sort = (rows) => [...rows].sort((a, b) => a.id - b.id);
  return { employees: sort(e.employees), reports: sort(r.reports), expenses: sort(c.expenses) };
}
const before = await snapshot();
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, acceptDownloads: true });
  await context.route("**/api/employees", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ employees: [alpha, beta] }) }));
  await context.route("**/api/reports?*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ reports }) }));
  await context.route("**/api/expenses?*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ expenses }) }));
  await context.route("https://wa.me/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<title>Month range handoff</title>" }));
  const page = await context.newPage(), errors = [], exportRequests = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => { if (new URL(request.url()).pathname === "/api/export") exportRequests.push(new URL(request.url())); });
  async function mount(width) {
    await page.setViewportSize({ width, height: 844 });
    await page.setContent(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><iframe id="preview" sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups allow-popups-to-escape-sandbox" src="${base}" style="width:${width}px;height:844px;border:0"></iframe></body></html>`);
    const app = page.frameLocator("#preview");
    await app.getByRole("heading", { name: "Bharathi Enterprises", exact: true }).waitFor();
    if (width < 768) await app.getByRole("navigation").getByRole("button", { name: /Summary/ }).click();
    return app;
  }
  let app = await mount(390);
  const summary = app.locator("#screen-summary");
  await summary.getByLabel("Report from month", { exact: true }).selectOption("3");
  await summary.getByLabel("Report to month", { exact: true }).selectOption("6");
  const whatsapp = summary.getByRole("region", { name: "Final report & WhatsApp", exact: true });
  const share = whatsapp.getByRole("link", { name: "Send on WhatsApp", exact: true });
  await share.waitFor();
  const text = new URL(await share.getAttribute("href")).searchParams.get("text");
  assert.ok(text.includes(`Period: March – June ${year}`));
  assert.ok(text.includes("*Remaining value: ₹8,500.00*"));
  assert.ok(!text.includes("OUTSIDE"));
  assert.ok((await summary.getByTestId("totals-cards").innerText()).includes("₹8,500.00"));
  assert.equal(await summary.locator("article[data-testid^='month-']").count(), 4);
  const popupPending = page.waitForEvent("popup"); await share.click();
  const popup = await popupPending; await popup.waitForLoadState("domcontentloaded");
  assert.equal(new URL(popup.url()).searchParams.get("text"), text); await popup.close();
  console.log("PASS mobile: From March to June controls summary, correct range balance and complete WhatsApp handoff.");

  const downloads = summary.getByRole("region", { name: "Download all details", exact: true });
  assert.equal(await downloads.getByLabel("Full export period", { exact: true }).inputValue(), "selected");
  assert.ok((await downloads.getByTestId("export-range-label").innerText()).includes(`March – June ${year}`));
  for (const format of ["csv", "xlsx"]) {
    const pending = page.waitForEvent("download");
    await downloads.getByRole("button", { name: format === "csv" ? "Download full CSV" : "Download full Excel (.xlsx)", exact: true }).click();
    const download = await pending;
    assert.ok(download.suggestedFilename().includes("Mar-to-Jun"));
    const requested = exportRequests.at(-1);
    assert.equal(requested.searchParams.get("fromMonth"), "3");
    assert.equal(requested.searchParams.get("toMonth"), "6");
    assert.equal(requested.searchParams.get("year"), String(year));
    const bytes = await readFile(await download.path());
    if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(bytes);
      for (const name of ["Delivery Reports", "Monthly Expenses", "Employee Monthly", "Monthly Totals"]) {
        const sheet = workbook.getWorksheet(name), headers = sheet.getRow(1).values.slice(1);
        const monthColumn = headers.indexOf("Month Number") + 1;
        for (let row = 2; row <= sheet.rowCount; row++) assert.ok(sheet.getRow(row).getCell(monthColumn).value >= 3 && sheet.getRow(row).getCell(monthColumn).value <= 6);
      }
    } else assert.ok(bytes.toString("utf8").includes(`March – June ${year}`));
  }
  const compactPending = page.waitForEvent("download");
  await summary.getByRole("button", { name: "Download summary CSV", exact: true }).click();
  const compact = await compactPending;
  assert.ok(compact.suggestedFilename().includes("Mar-to-Jun"));
  const compactText = (await readFile(await compact.path())).toString("utf8");
  assert.ok(compactText.includes('"March"')); assert.ok(compactText.includes('"June"'));
  assert.ok(!compactText.includes('"January"')); assert.ok(!compactText.includes('"July"'));
  console.log("PASS mobile: full CSV, Excel and summary CSV all use the same inclusive range and month-labelled filenames.");

  await summary.getByLabel("Summary employee filter", { exact: true }).selectOption(alpha.name);
  assert.ok(new URL(await share.getAttribute("href")).searchParams.get("text").includes("*Remaining value: ₹4,400.00*"));
  await summary.getByLabel("Report from month", { exact: true }).selectOption("8");
  assert.equal(await summary.getByLabel("Report to month", { exact: true }).inputValue(), "8");
  await summary.getByLabel("Report to month", { exact: true }).selectOption("2");
  assert.equal(await summary.getByLabel("Report from month", { exact: true }).inputValue(), "2");
  await summary.getByRole("button", { name: "Full year", exact: true }).click();
  assert.equal(await summary.getByLabel("Report from month", { exact: true }).inputValue(), "1");
  assert.equal(await summary.getByLabel("Report to month", { exact: true }).inputValue(), "12");
  await downloads.getByLabel("Full export period", { exact: true }).selectOption("all");
  assert.ok((await downloads.getByTestId("export-range-label").innerText()).includes("in each saved year"));
  console.log("PASS mobile: employee selection remains correct; endpoints cannot reverse; Full year reset and all-years behavior are clear.");
  for (const width of [320, 720, 1024]) {
    app = await mount(width);
    await app.locator("#screen-summary").getByLabel("Report from month", { exact: true }).waitFor();
    assert.equal(await app.locator("html").evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  }
  assert.deepEqual(errors, []);
  console.log("PASS: phone, tablet and desktop range controls fit without browser errors.");
} finally {
  await browser.close();
  assert.deepEqual(await snapshot(), before);
  console.log("PASS: every range/share/download test is read-only; original saved data is unchanged.");
}
