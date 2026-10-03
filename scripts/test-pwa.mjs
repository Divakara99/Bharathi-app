import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";

async function fetchOk(path) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(25000) });
  assert.equal(response.status, 200, `${path} must return 200`);
  return response;
}
async function snapshot() {
  const values = await Promise.all(["/api/employees", "/api/reports", "/api/expenses"].map(async (path) => (await fetchOk(path)).json()));
  const sort = (rows) => [...rows].sort((a, b) => a.id - b.id);
  return { employees: sort(values[0].employees), reports: sort(values[1].reports), expenses: sort(values[2].expenses) };
}

const before = await snapshot();
const home = await (await fetchOk("/")).text();
assert.ok(/<link[^>]*rel="manifest"[^>]*href="\/manifest.webmanifest"/.test(home));
const response = await fetchOk("/manifest.webmanifest");
assert.ok(response.headers.get("Content-Type").includes("manifest+json"));
const manifest = await response.json();
assert.equal(manifest.name, "Bharathi Enterprises — Delivery Monitor");
assert.equal(manifest.id, "/");
assert.equal(manifest.scope, "/");
assert.equal(manifest.start_url, "/");
assert.equal(manifest.display, "standalone");
assert.equal(manifest.prefer_related_applications, false);
for (const size of [192, 512]) {
  const icon = manifest.icons.find((icon) => icon.sizes === `${size}x${size}` && icon.purpose === "any");
  assert.ok(icon, `Missing ${size}px install icon`);
  const response = await fetchOk(icon.src);
  assert.ok(response.headers.get("Content-Type").includes("image/png"));
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(bytes.readUInt32BE(16), size);
  assert.equal(bytes.readUInt32BE(20), size);
}
const maskable = manifest.icons.find((icon) => icon.purpose === "maskable");
assert.ok(maskable);
await fetchOk(maskable.src);
await fetchOk("/icons/apple-touch-icon.png");
const worker = await fetchOk("/sw.js");
assert.ok(worker.headers.get("Content-Type").includes("javascript"));
assert.ok(worker.headers.get("Cache-Control").includes("no-store"));
assert.equal(worker.headers.get("Service-Worker-Allowed"), "/");
await fetchOk("/offline.html");
console.log("PASS: linked manifest, standalone identity, exact 192/512 PNG dimensions, maskable/Apple icons, service-worker headers and offline asset.");

if (process.env.PLAYWRIGHT_MODULE) {
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
  const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Bharathi Enterprises", exact: true }).waitFor();
    await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), { timeout: 20000 });
    const workerInfo = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      return { scope: registration.scope, script: registration.active.scriptURL };
    });
    assert.equal(workerInfo.scope, new URL("/", base).href);
    assert.equal(workerInfo.script, new URL("/sw.js", base).href);
    const session = await context.newCDPSession(page);
    const installation = await session.send("Page.getInstallabilityErrors");
    assert.deepEqual(installation.installabilityErrors, [], JSON.stringify(installation.installabilityErrors));
    console.log("PASS browser: active root-scoped service worker and Chrome reports no PWA installability errors.");

    // Exercise browser events without claiming a native Android install took place.
    assert.equal(await page.getByRole("button", { name: "How to install", exact: true }).count(), 0);
    await page.evaluate(() => {
      const event = new Event("beforeinstallprompt", { cancelable: true });
      event.prompt = async () => { window.__installPromptCalls = (window.__installPromptCalls ?? 0) + 1; };
      event.userChoice = Promise.resolve({ outcome: "dismissed", platform: "web" });
      window.dispatchEvent(event);
    });
    const installCard = page.getByRole("region", { name: "Install Bharathi Enterprises", exact: true });
    assert.equal(await installCard.innerText(), "Install app");
    await installCard.getByRole("button", { name: "Install app", exact: true }).click();
    assert.equal(await page.evaluate(() => window.__installPromptCalls), 1);
    await installCard.waitFor({ state: "hidden" });
    await page.evaluate(() => {
      const event = new Event("beforeinstallprompt", { cancelable: true });
      event.prompt = async () => {};
      event.userChoice = Promise.resolve({ outcome: "accepted", platform: "web" });
      window.dispatchEvent(event);
    });
    await installCard.waitFor({ state: "visible" });
    await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
    await installCard.waitFor({ state: "hidden" });
    console.log("PASS browser: only Install app is shown when eligible; the prompt still works and no help explanation appears.");

    await page.evaluate(async () => { await fetch("/api/reports"); await fetch("/api/expenses"); });
    const cached = await page.evaluate(async () => {
      const names = await caches.keys();
      return (await Promise.all(names.filter((name) => name.startsWith("bharathi-public-assets-")).map(async (name) => (await (await caches.open(name)).keys()).map((request) => new URL(request.url).pathname)))).flat();
    });
    assert.ok(cached.includes("/offline.html"));
    assert.ok(cached.length > 0);
    assert.ok(cached.every((path) => path === "/offline.html" || path.startsWith("/icons/")), JSON.stringify(cached));
    await context.setOffline(true);
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "You're offline", exact: true }).waitFor();
    const apiWasCached = await page.evaluate(async () => {
      try { await fetch("/api/reports"); return true; } catch { return false; }
    });
    assert.equal(apiWasCached, false);
    await context.setOffline(false);
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Bharathi Enterprises", exact: true }).waitFor();
    console.log("PASS browser: offline reconnect screen works; private API responses, financial records and app HTML are not cached.");

    for (const width of [320, 720]) {
      await page.setViewportSize({ width, height: 844 });
      await page.setContent(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><iframe id="preview" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" src="${base}" style="width:${width}px;height:844px;border:0"></iframe></body></html>`);
      const app = page.frameLocator("#preview");
      await app.getByRole("heading", { name: "Bharathi Enterprises", exact: true }).waitFor();
      await app.getByRole("navigation").getByRole("button", { name: /Entry/ }).waitFor();
      assert.equal(await app.getByRole("region", { name: "Install Bharathi Enterprises", exact: true }).count(), 0);
      assert.equal(await app.getByRole("button", { name: "How to install", exact: true }).count(), 0);
      assert.equal(await app.getByRole("link", { name: "Open the app in a new tab", exact: true }).count(), 0);
      assert.equal(await app.locator("html").evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    }
    assert.deepEqual(runtimeErrors, []);
    console.log("PASS browser: no installation explanations in embedded previews; phone/tablet layout remains clean.");
  } finally { await browser.close(); }
}
assert.deepEqual(await snapshot(), before);
console.log("PASS: installation tests do not change any employee, delivery report or expense data.");
