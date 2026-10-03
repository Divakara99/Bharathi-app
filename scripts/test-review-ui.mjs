import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const year = new Date().getUTCFullYear();
const employee = { id: 9001, name: '=HYPERLINK("https://example.com")' };
const report = { id: 9011, empName: employee.name, year, month: 1, cycle: 1, deliveries: 10, pricePerDelivery: "20.00", totalValue: "200.00", notes: "QA response only" };
const expense = { id: 9021, employeeId: employee.id, employeeName: employee.name, year, month: 1, amount: "50.00", notes: "Fuel" };
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, acceptDownloads: true });
  let failStaff = false;
  await context.route("**/api/employees", (route) => route.fulfill({ status: failStaff ? 503 : 200, contentType: "application/json", body: JSON.stringify(failStaff ? { error: "QA simulated refresh failure" } : { employees: [employee] }) }));
  await context.route("**/api/reports**", async (route) => {
    if (route.request().method() === "POST") {
      failStaff = true;
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ report }) });
      return;
    }
    const selectedYear = Number(new URL(route.request().url()).searchParams.get("year"));
    if (selectedYear !== year) await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ reports: selectedYear === year ? [report] : [] }) });
  });
  await context.route("**/api/expenses**", async (route) => {
    const selectedYear = Number(new URL(route.request().url()).searchParams.get("year"));
    if (selectedYear !== year) await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ expenses: selectedYear === year ? [expense] : [] }) });
  });
  const page = await context.newPage();
  const errors = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);
  const nav = page.getByRole("navigation");
  await nav.getByRole("button", { name: /Summary/ }).click();
  const summary = page.locator("#screen-summary");
  await summary.getByTestId("totals-cards").getByText("₹150.00", { exact: true }).waitFor();
  const pending = page.waitForEvent("download");
  await summary.getByRole("button", { name: "Download summary CSV", exact: true }).click();
  const download = await pending;
  const csv = await readFile(await download.path(), "utf8");
  assert.ok(csv.includes('"\'=HYPERLINK(""https://example.com"")"'));
  assert.ok(csv.includes('"200.00","50.00","150.00"'));
  console.log("PASS UI: summary CSV preserves money and quotes while treating employee names as text, not formulas.");

  await page.getByLabel("Report year", { exact: true }).selectOption(String(year + 1));
  await page.getByRole("button", { name: "Loading saved report…", exact: true }).waitFor();
  const duringLoad = await summary.getByTestId("totals-cards").innerText();
  assert.ok(!duringLoad.includes("₹150.00"));
  assert.ok(duringLoad.includes("₹0.00"));
  await page.getByRole("button", { name: "Send on WhatsApp", exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Send on WhatsApp", exact: true }).isDisabled(), true);
  console.log("PASS UI: changing year never presents prior-year balances as the new year's report.");

  await page.getByLabel("Report year", { exact: true }).selectOption(String(year));
  await nav.getByRole("button", { name: /Entry/ }).click();
  const entry = page.locator("#screen-entry");
  await entry.getByRole("combobox", { name: "Employee", exact: true }).selectOption(employee.name);
  await entry.getByRole("combobox", { name: "Month", exact: true }).selectOption("2");
  await entry.getByRole("spinbutton", { name: "No. of Deliveries", exact: true }).fill("10");
  await entry.getByRole("spinbutton", { name: "Price / Delivery (₹)", exact: true }).fill("20");
  await entry.getByRole("button", { name: "Save Report", exact: true }).click();
  await summary.waitFor({ state: "visible" });
  await page.getByRole("alert").filter({ hasText: "Report saved, but the employee list could not refresh" }).waitFor();
  assert.ok((await page.getByRole("status").innerText()).includes("report saved"));
  assert.equal(await page.getByRole("link", { name: "Send on WhatsApp", exact: true }).count(), 0);
  console.log("PASS UI: a successful save plus failed refresh is clearly identified as saved, with sharing blocked until refreshed.");
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
console.log("PASS: all UI failure tests use intercepted responses only; no saved data was edited.");
