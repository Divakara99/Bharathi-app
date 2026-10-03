import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
async function snapshot() {
  const get = async (path) => { const response = await fetch(base + path); assert.equal(response.status, 200); return response.json(); };
  const [e, r, x] = await Promise.all([get("/api/employees"), get("/api/reports"), get("/api/expenses")]);
  const sort = (rows) => [...rows].sort((a, b) => a.id - b.id);
  return { employees: sort(e.employees), reports: sort(r.reports), expenses: sort(x.expenses) };
}
const before = await snapshot();
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = []; page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto(base);
  assert.equal(response.status(), 200);
  await page.getByRole("heading", { name: "Bharathi Enterprises", exact: true }).waitFor();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.evaluate(async () => {
    localStorage.setItem("qa-recovery-settings", "preserve");
    await (await caches.open("qa-other-cache")).put("/qa-settings", new Response("preserve"));
    await (await caches.open("bharathi-public-assets-v1")).put("/_next/static/chunks/qa-old.js", new Response("stale"));
  });
  const recoveryResponse = await page.goto(base + "/cache-recovery.html");
  assert.equal(recoveryResponse.status(), 200);
  assert.ok(recoveryResponse.headers()["cache-control"].includes("no-store"));
  await page.getByRole("heading", { name: "Refresh the app", exact: true }).waitFor();
  assert.equal(await page.evaluate(() => performance.getEntriesByType("resource").some((entry) => entry.name.includes("/_next/"))), false);
  console.log("PASS: recovery screen is a no-store static page and loads without the Next.js client runtime.");
  await page.getByRole("button", { name: "Refresh app cache and reload", exact: true }).click();
  await page.getByRole("heading", { name: "Bharathi Enterprises", exact: true }).waitFor();
  assert.ok(new URL(page.url()).searchParams.has("_refresh"));
  assert.equal(await page.evaluate(() => localStorage.getItem("qa-recovery-settings")), "preserve");
  assert.equal(await page.evaluate(async () => Boolean(await caches.match("/qa-settings"))), true);
  assert.equal(await page.evaluate(async () => (await caches.keys()).includes("bharathi-public-assets-v1")), false);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const ownCachedPaths = await page.evaluate(async () => {
    const names = (await caches.keys()).filter((key) => key.startsWith("bharathi-public-assets-"));
    return (await Promise.all(names.map(async (name) => (await (await caches.open(name)).keys()).map((request) => new URL(request.url).pathname)))).flat();
  });
  assert.ok(ownCachedPaths.every((path) => path === "/offline.html" || path.startsWith("/icons/")));
  assert.deepEqual(errors, []);
  console.log("PASS: cache refresh removes only old app assets; settings/unrelated caches remain and production installation still registers safely.");
} finally {
  await browser.close();
  assert.deepEqual(await snapshot(), before);
  console.log("PASS: no employee, delivery report or expense changed during recovery tests.");
}
