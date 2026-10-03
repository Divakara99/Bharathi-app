import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";

const require = createRequire(import.meta.url);
if (!process.env.PLAYWRIGHT_MODULE) throw new Error("Set PLAYWRIGHT_MODULE to a locally installed Playwright module.");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const pin = process.env.TEST_DELETE_PIN ?? "9676";
const prefix = `QA mobile ${randomUUID().slice(0, 8)}`;
const year = new Date().getUTCFullYear();
const owned = { employees: [], reports: [], expenses: [] };
const inr = (n) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
async function request(path, body) {
  const response = await fetch(base + path, {
    ...(body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(25000),
  });
  return { status: response.status, data: await response.json() };
}
async function snapshot() {
  const values = await Promise.all([request("/api/employees"), request("/api/reports"), request("/api/expenses")]);
  values.forEach((r) => assert.equal(r.status, 200));
  const sort = (rows) => [...rows].sort((a, b) => a.id - b.id);
  return { employees: sort(values[0].data.employees), reports: sort(values[1].data.reports), expenses: sort(values[2].data.expenses) };
}
async function addEmployee(suffix) {
  const r = await request("/api/employees", { name: `${prefix} ${suffix}` });
  assert.equal(r.status, 201); owned.employees.push(r.data.employee.id); return r.data.employee;
}
async function addReport(employee, cycle, deliveries, price) {
  const r = await request("/api/reports", { empName: employee.name, year, month: 1, cycle, deliveries, pricePerDelivery: price, notes: prefix });
  assert.equal(r.status, 201); owned.reports.push(r.data.report.id);
}
async function assertTiles(section, deliveries, total, expenses, net) {
  const cards = section.getByTestId("totals-cards");
  for (const [label, value] of [["Total Deliveries", String(deliveries)], ["Total Value", inr(total)], ["Total Expenses", inr(expenses)], ["Net Earnings", inr(net)]]) {
    const text = await cards.getByText(label, { exact: true }).locator("..").innerText();
    assert.ok(text.includes(value), `${label}: expected ${value}; found ${text}`);
  }
}
let baseline, browser;
try {
  baseline = await snapshot();
  const alpha = await addEmployee("Alpha");
  const beta = await addEmployee("Beta");
  await addReport(alpha, 1, 100, 20);
  await addReport(alpha, 2, 150, 20);
  await addReport(beta, 1, 200, 25);
  const betaCreated = await request("/api/expenses", { employeeId: beta.id, year, month: 1, amount: 800, notes: prefix });
  assert.equal(betaCreated.status, 201); owned.expenses.push(betaCreated.data.expense.id);
  browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, acceptDownloads: true });
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  async function mount(width, height) {
    await page.setViewportSize({ width, height });
    await page.setContent(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><iframe id="preview" sandbox="allow-scripts allow-same-origin allow-forms allow-downloads" src="${base}" style="width:${width}px;height:${height}px;border:0"></iframe></body></html>`);
    const frame = page.frameLocator("#preview");
    await frame.getByRole("heading", { name: "Bharathi Enterprises", exact: true }).waitFor();
    return frame;
  }
  let frame = await mount(390, 844);
  const nav = () => frame.getByRole("navigation", { name: "App navigation" });
  await nav().getByRole("button", { name: /Expenses/ }).click();
  let expenseScreen = frame.locator("#screen-expenses");
  await expenseScreen.getByRole("combobox", { name: "Expense employee", exact: true }).selectOption(String(alpha.id));
  await expenseScreen.getByRole("combobox", { name: "Expense month", exact: true }).selectOption("1");
  await expenseScreen.getByLabel("Monthly expense amount (₹)", { exact: true }).fill("600");
  await expenseScreen.getByLabel("Expense notes (optional)", { exact: true }).fill(prefix);
  assert.ok((await expenseScreen.innerText()).includes(inr(4400)));
  const savedResponse = page.waitForResponse((r) => r.url().includes("/api/expenses") && r.request().method() === "POST");
  await expenseScreen.getByRole("button", { name: "Save Monthly Expenses", exact: true }).click();
  const firstSave = await savedResponse; assert.equal(firstSave.status(), 201);
  const savedAlpha = (await firstSave.json()).expense; owned.expenses.push(savedAlpha.id);
  let summary = frame.locator("#screen-summary");
  await summary.waitFor({ state: "visible" });
  assert.equal(await summary.getByLabel("Summary employee filter", { exact: true }).inputValue(), alpha.name);
  await assertTiles(summary, 250, 5000, 600, 4400);
  assert.equal(await summary.locator("article[data-testid^='month-']").count(), 12);
  console.log("PASS phone: employee-specific monthly entry, live net, correct year totals and all 12 months.");

  await summary.getByTestId("month-1").getByRole("button", { name: "Edit expenses", exact: true }).click();
  await expenseScreen.waitFor({ state: "visible" });
  assert.equal(await expenseScreen.getByRole("combobox", { name: "Expense employee", exact: true }).inputValue(), String(alpha.id));
  assert.equal(await expenseScreen.getByLabel("Monthly expense amount (₹)", { exact: true }).inputValue(), "600");
  await expenseScreen.getByLabel("Monthly expense amount (₹)", { exact: true }).fill("650");
  const updatedResponse = page.waitForResponse((r) => r.url().includes("/api/expenses") && r.request().method() === "POST");
  await expenseScreen.getByRole("button", { name: "Update Monthly Expenses", exact: true }).click();
  const update = await updatedResponse; assert.equal(update.status(), 201);
  assert.equal((await update.json()).expense.id, savedAlpha.id);
  await summary.waitFor({ state: "visible" });
  await assertTiles(summary, 250, 5000, 650, 4350);
  console.log("PASS phone: editing preloads the right employee/month and updates the same expense row.");

  const downloadPending = page.waitForEvent("download");
  await summary.getByRole("button", { name: "Download summary CSV", exact: true }).click();
  const download = await downloadPending;
  const csv = await readFile(await download.path(), "utf8");
  assert.ok(csv.includes(`"${alpha.name}","${year}","January","250","5000.00","650.00","4350.00"`));
  assert.ok(!csv.includes(beta.name));
  console.log("PASS phone: exported CSV contains only the selected employee's correct totals.");

  await summary.getByLabel("Summary employee filter", { exact: true }).selectOption(beta.name);
  await assertTiles(summary, 200, 5000, 800, 4200);
  await summary.getByLabel("Summary employee filter", { exact: true }).selectOption("");
  const originalReports = baseline.reports.filter((r) => r.year === year);
  const originalExpenses = baseline.expenses.filter((e) => e.year === year);
  const baseDeliveries = originalReports.reduce((sum, r) => sum + r.deliveries, 0);
  const baseTotal = originalReports.reduce((sum, r) => sum + Number(r.totalValue), 0);
  const baseExpense = originalExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  await assertTiles(summary, baseDeliveries + 450, baseTotal + 10000, baseExpense + 1450, baseTotal + 10000 - baseExpense - 1450);
  console.log("PASS phone: employee filter switches balances; All employees adds incomes/expenses once.");

  await nav().getByRole("button", { name: /Staff/ }).click();
  const staff = frame.locator("#screen-staff");
  const alphaCard = staff.getByTestId(`staff-${alpha.id}`);
  assert.ok((await alphaCard.innerText()).includes(inr(4350)));
  for (const action of ["Totals", "Records", "Delivery entry", "Expenses", "Delete employee"]) await alphaCard.getByRole("button", { name: action, exact: true }).waitFor({ state: "visible" });
  await alphaCard.getByRole("button", { name: "Records", exact: true }).click();
  const records = frame.locator("#screen-records");
  await records.waitFor({ state: "visible" });
  assert.equal(await records.getByLabel("Records employee filter", { exact: true }).inputValue(), alpha.name);
  await records.getByLabel("Records month filter", { exact: true }).selectOption("1");
  await assertTiles(records, 250, 5000, 650, 4350);
  assert.equal(await records.getByTestId(`expense-${betaCreated.data.expense.id}`).count(), 0);
  console.log("PASS phone: staff has all requested actions and records include only the selected employee.");

  const expenseCard = records.getByTestId(`expense-${savedAlpha.id}`);
  await expenseCard.getByRole("button", { name: "Delete expenses", exact: true }).click();
  let dialog = frame.getByRole("dialog", { name: /Enter PIN to delete/ });
  const pinInput = dialog.getByLabel("PIN", { exact: true });
  assert.equal(await pinInput.inputValue(), "");
  assert.equal(await pinInput.getAttribute("placeholder"), null);
  assert.equal(await pinInput.getAttribute("type"), "password");
  await dialog.getByRole("button", { name: "Show PIN", exact: true }).click();
  assert.equal(await pinInput.getAttribute("type"), "text");
  await pinInput.fill(pin);
  await dialog.getByRole("button", { name: "Hide PIN", exact: true }).click();
  assert.equal(await pinInput.getAttribute("type"), "password");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expenseCard.getByRole("button", { name: "Delete expenses", exact: true }).click();
  assert.equal(await pinInput.inputValue(), "");
  await pinInput.fill("1234");
  const wrongPending = page.waitForResponse((r) => r.url().endsWith("/api/delete"));
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();
  assert.equal((await wrongPending).status(), 403);
  await dialog.getByRole("alert").filter({ hasText: "Wrong PIN" }).waitFor();
  await pinInput.fill(pin);
  const correctPending = page.waitForResponse((r) => r.url().endsWith("/api/delete"));
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();
  assert.equal((await correctPending).status(), 200);
  await dialog.waitFor({ state: "hidden" });
  await expenseCard.waitFor({ state: "hidden" });
  assert.equal((await request(`/api/expenses?employeeId=${beta.id}&year=${year}`)).data.expenses[0].amount, "800.00");
  console.log("PASS phone: blank PIN, Show/Hide, Cancel, wrong PIN protection, and deletion of one employee's expense only.");

  for (const width of [320, 720, 1024]) {
    frame = await mount(width, 844);
    if (width < 768) await frame.getByRole("navigation").getByRole("button", { name: /Summary/ }).click();
    await frame.locator("#screen-summary").waitFor({ state: "visible" });
    assert.equal(await frame.locator("html").evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `Horizontal overflow at ${width}px`);
  }
  assert.deepEqual(runtimeErrors, []);
  console.log("PASS: phone, tablet and desktop layouts fit without horizontal page overflow or browser errors.");
} finally {
  if (browser) await browser.close();
  for (const kind of ["report", "expense", "employee"]) {
    for (const id of owned[kind === "report" ? "reports" : kind === "expense" ? "expenses" : "employees"]) {
      const r = await request("/api/delete", { kind, id, pin });
      assert.ok(r.status === 200 || r.status === 404, JSON.stringify(r.data));
    }
  }
  if (baseline) {
    assert.deepEqual(await snapshot(), baseline);
    console.log("PASS: all test rows removed; every original saved record is unchanged.");
  }
}
