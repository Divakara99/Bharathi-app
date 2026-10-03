import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
if (!process.env.PLAYWRIGHT_MODULE) throw new Error("Set PLAYWRIGHT_MODULE to the test browser package.");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const year = new Date().getUTCFullYear();
const alpha = { id: 7001, name: "Ramesh" };
const beta = { id: 7002, name: "பாரதி" };
const reports = [
  { id: 1, empName: alpha.name, year, month: 1, cycle: 1, deliveries: 100, pricePerDelivery: "20.00", totalValue: "2000.00", notes: "Fuel & incentive" },
  { id: 2, empName: alpha.name, year, month: 1, cycle: 2, deliveries: 150, pricePerDelivery: "20.00", totalValue: "3000.00", notes: "Second cycle" },
  { id: 3, empName: beta.name, year, month: 1, cycle: 1, deliveries: 200, pricePerDelivery: "25.00", totalValue: "5000.00", notes: "தமிழ்" },
  { id: 4, empName: alpha.name, year, month: 2, cycle: 2, deliveries: 10, pricePerDelivery: "10.00", totalValue: "100.00", notes: null },
];
const expenses = [
  { id: 11, employeeId: alpha.id, employeeName: alpha.name, year, month: 1, amount: "600.00", notes: "Fuel" },
  { id: 12, employeeId: beta.id, employeeName: beta.name, year, month: 1, amount: "800.00", notes: "Salary" },
  { id: 13, employeeId: null, employeeName: null, year, month: 1, amount: "100.00", notes: "Rent" },
  { id: 14, employeeId: beta.id, employeeName: beta.name, year: year + 1, month: 4, amount: "120.00", notes: "Expense only" },
];
async function snapshot() {
  const get = async (path) => {
    const response = await fetch(base + path, { signal: AbortSignal.timeout(25000) });
    assert.equal(response.status, 200);
    return response.json();
  };
  const [e, r, x] = await Promise.all([get("/api/employees"), get("/api/reports"), get("/api/expenses")]);
  const sort = (rows) => [...rows].sort((a, b) => a.id - b.id);
  return { employees: sort(e.employees), reports: sort(r.reports), expenses: sort(x.expenses) };
}
const original = await snapshot();
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: async (text) => { window.__copiedReport = text; },
    } });
  });
  // Only browser response fixtures are used; no real database mutation or WhatsApp send occurs.
  await context.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== "GET") throw new Error("Unexpected mutation during read-only report test");
    let payload;
    if (url.pathname === "/api/employees") payload = { employees: [alpha, beta] };
    if (url.pathname === "/api/reports") payload = { reports: reports.filter((row) => row.year === Number(url.searchParams.get("year"))) };
    if (url.pathname === "/api/expenses") payload = { expenses: expenses.filter((row) => row.year === Number(url.searchParams.get("year"))) };
    if (payload) await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) });
    else await route.continue();
  });
  await context.route("https://wa.me/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<title>WhatsApp handoff test</title><p>Message handoff verified. No real message sent.</p>" }));
  const page = await context.newPage();
  const errors = []; page.on("pageerror", (error) => errors.push(error.message));
  async function mount(width) {
    await page.setViewportSize({ width, height: 844 });
    await page.setContent(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><iframe id="preview" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox" src="${base}" style="width:${width}px;height:844px;border:0"></iframe></body></html>`);
    const frame = page.frameLocator("#preview");
    await frame.getByRole("heading", { name: "Bharathi Enterprises", exact: true }).waitFor();
    if (width < 768) await frame.getByRole("navigation").getByRole("button", { name: /Summary/ }).click();
    return frame;
  }
  let app = await mount(390);
  const summary = app.locator("#screen-summary");
  const panel = summary.getByRole("region", { name: "Final report & WhatsApp", exact: true });
  const share = panel.getByRole("link", { name: "Send on WhatsApp", exact: true });
  await share.waitFor({ state: "visible" });
  function message(url) { return new URL(url).searchParams.get("text"); }
  let text = message(await share.getAttribute("href"));
  for (const part of ["Ramesh", "பாரதி", "100 deliveries × ₹20.00 = ₹2,000.00", "150 deliveries × ₹20.00 = ₹3,000.00", "Monthly expenses: ₹600.00 · Fuel", "Total value: ₹10,100.00", "Total expenses value: ₹1,500.00", "*Remaining value: ₹8,600.00*"]) assert.ok(text.includes(part), part);
  const finalTotals = panel.getByTestId("final-report-totals");
  assert.ok((await finalTotals.innerText()).includes("₹8,600.00"));
  const entryCard = panel.getByTestId("share-employee-7001").getByTestId("share-month-1");
  for (const part of ["Deliveries", "Price / delivery", "Total price", "Entry 2 · 16 – 31"]) assert.ok((await entryCard.innerText()).includes(part));
  console.log("PASS mobile: readable entry cards and complete WhatsApp text show correct monthly expenses and final remaining value.");

  await summary.getByLabel("Summary employee filter", { exact: true }).selectOption(alpha.name);
  await summary.getByLabel("Report from month", { exact: true }).selectOption("1");
  await summary.getByLabel("Report to month", { exact: true }).selectOption("1");
  text = message(await share.getAttribute("href"));
  assert.ok(text.includes(`Period: January ${year}`));
  assert.ok(text.includes("*Remaining value: ₹4,400.00*"));
  assert.ok(!text.includes(beta.name));
  assert.ok(!text.includes("Rent"));
  assert.ok(!text.includes(`February ${year}`));
  await panel.getByRole("button", { name: "Copy report", exact: true }).click();
  await panel.getByRole("status").filter({ hasText: "Report copied" }).waitFor();
  assert.equal(await panel.locator("section").first().evaluate(() => window.__copiedReport), text);
  await panel.locator("summary").filter({ hasText: "View WhatsApp message" }).click();
  assert.equal(await panel.getByTestId("whatsapp-message-preview").textContent(), text);
  console.log("PASS mobile: employee/month filter, copy and message preview all contain the same selected report.");

  const popupPending = page.waitForEvent("popup");
  await share.click();
  const popup = await popupPending;
  await popup.waitForLoadState("domcontentloaded");
  assert.equal(message(popup.url()), text);
  assert.equal(await popup.title(), "WhatsApp handoff test");
  await popup.close();
  console.log("PASS: one WhatsApp tap opens the complete prefilled message; external request intercepted, no real messages sent.");

  await summary.getByLabel("Report from month", { exact: true }).selectOption("3");
  await summary.getByLabel("Report to month", { exact: true }).selectOption("3");
  assert.equal(await panel.getByRole("link", { name: "Send on WhatsApp", exact: true }).count(), 0);
  assert.equal(await panel.getByRole("button", { name: "Send on WhatsApp", exact: true }).isDisabled(), true);
  assert.ok((await panel.innerText()).includes("No saved entries for this selection"));
  await summary.getByLabel("Summary employee filter", { exact: true }).selectOption(beta.name);
  await app.getByLabel("Report year", { exact: true }).selectOption(String(year + 1));
  await summary.getByLabel("Report from month", { exact: true }).selectOption("4");
  await summary.getByLabel("Report to month", { exact: true }).selectOption("4");
  await panel.getByRole("link", { name: "Send on WhatsApp", exact: true }).waitFor();
  const negative = message(await panel.getByRole("link", { name: "Send on WhatsApp", exact: true }).getAttribute("href"));
  assert.ok(negative.includes("No delivery entries."));
  assert.ok(negative.includes("*Remaining value: ₹-120.00*"));
  console.log("PASS mobile: empty selections cannot be shared; expense-only reports preserve negative balances.");

  for (const width of [320, 720, 1024]) {
    app = await mount(width);
    await app.locator("#screen-summary").getByRole("region", { name: "Final report & WhatsApp", exact: true }).getByRole("link", { name: "Send on WhatsApp", exact: true }).waitFor();
    assert.equal(await app.locator("html").evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `Overflow at ${width}px`);
  }
  assert.deepEqual(errors, []);
  console.log("PASS: phone, tablet and desktop report layouts fit without horizontal overflow or browser errors.");
} finally {
  await browser.close();
  assert.deepEqual(await snapshot(), original);
  console.log("PASS: all tests were read-only; original employees, delivery records and expenses are unchanged.");
}
