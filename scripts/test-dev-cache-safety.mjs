import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { openSync, closeSync, readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const port = 3101;
const base = `http://127.0.0.1:${port}`;
const logPath = "/tmp/dev-cache-safety-server.log";
const output = openSync(logPath, "w");
const server = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
  env: { ...process.env, NODE_ENV: "development", NEXT_TELEMETRY_DISABLED: "1" }, detached: true, stdio: ["ignore", output, output],
});
closeSync(output);
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 70; attempt++) {
    if (server.exitCode !== null) throw new Error("Temporary dev server stopped before starting");
    try { const r = await fetch(base + "/api/health", { signal: AbortSignal.timeout(1500) }); if (r.ok) { ready = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.equal(ready, true, "Dev server health did not become ready");
  browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Bharathi Enterprises", exact: true }).waitFor();
  assert.equal(await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length), 0);
  assert.equal(await page.getByRole("region", { name: "Install Bharathi Enterprises", exact: true }).count(), 0);
  console.log("PASS actual next dev: app renders without registering an installation worker.");

  // Simulate an earlier installed worker, then verify the pre-hydration cleanup removes only owned cache.
  await page.evaluate(async () => {
    localStorage.setItem("qa-keep-settings", "preserve");
    await (await caches.open("qa-unrelated-cache")).put("/qa-unrelated", new Response("preserve"));
    await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.evaluate(async () => {
    await (await caches.open("bharathi-public-assets-v1")).put("/_next/static/chunks/old-qa.js", new Response("outdated chunk"));
  });
  try { await page.reload({ waitUntil: "domcontentloaded" }); } catch (error) { if (!String(error).includes("ERR_ABORTED")) throw error; }
  await page.getByRole("heading", { name: "Bharathi Enterprises", exact: true }).waitFor();
  await page.waitForFunction(async () => {
    const keys = await caches.keys();
    const registrations = await navigator.serviceWorker.getRegistrations();
    return !keys.some((key) => key.startsWith("bharathi-public-assets-")) && registrations.length === 0;
  });
  assert.equal(await page.evaluate(() => localStorage.getItem("qa-keep-settings")), "preserve");
  assert.equal(await page.evaluate(async () => Boolean(await caches.match("/qa-unrelated"))), true);
  await page.getByRole("navigation").getByRole("button", { name: /Summary/ }).click();
  await page.locator("#screen-summary").waitFor({ state: "visible" });
  assert.deepEqual(errors, []);
  console.log("PASS actual next dev: old root worker/chunk cache removed before hydration; settings and unrelated caches preserved; app still navigates without runtime errors.");
} catch (error) {
  console.error(readFileSync(logPath, "utf8").slice(-5000));
  throw error;
} finally {
  if (browser) await browser.close();
  if (server.pid) {
    try { process.kill(-server.pid, "SIGTERM"); } catch {}
    await new Promise((resolve) => setTimeout(resolve, 800));
    try { process.kill(-server.pid, "SIGKILL"); } catch {}
  }
}
console.log("PASS: temporary development server and browser stopped; no application data was changed.");
