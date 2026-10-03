import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { createPwaSafetyScript, isProductionPwa, PWA_CACHE_PREFIX } from "../src/lib/pwa-safety";

async function bootstrap(production: boolean, host: string, controlled = false, recovered = false) {
  const origin = `https://${host}`;
  const keys = [PWA_CACHE_PREFIX + "v1", "other-app-cache"];
  const removed: string[] = [];
  let unregistered = 0, unrelated = 0, reloads = 0;
  const worker = { scriptURL: origin + "/sw.js" };
  const context: Record<string, unknown> = {
    URL, Promise,
    location: { hostname: host, origin, reload: () => { reloads++; } },
    navigator: { serviceWorker: {
      controller: controlled ? worker : null,
      getRegistrations: async () => [
        { scope: origin + "/", active: worker, unregister: async () => { unregistered++; return true; } },
        { scope: origin + "/other/", active: { scriptURL: origin + "/other/sw.js" }, unregister: async () => { unrelated++; return true; } },
      ],
    } },
    caches: { keys: async () => keys, delete: async (key: string) => { removed.push(key); return true; } },
    sessionStorage: { getItem: () => recovered ? "1" : null, setItem: () => {} },
    localStorage: { clear: () => { throw new Error("Must not clear local data"); } },
  };
  context.window = context;
  vm.runInNewContext(createPwaSafetyScript(production), context);
  await new Promise((resolve) => setTimeout(resolve, 5));
  return { removed, unregistered, unrelated, reloads };
}
async function main() {
  assert.equal(isProductionPwa(false, "localhost"), false);
  assert.equal(isProductionPwa(true, "bharathi.vercel.app"), true);
  assert.equal(isProductionPwa(true, "bharathi.v0.build"), false);
  assert.equal(isProductionPwa(true, "v0.build"), false);
  assert.equal(isProductionPwa(true, "myv0.build.example.org"), true);
  assert.deepEqual(await bootstrap(true, "bharathi.vercel.app"), { removed: [], unregistered: 0, unrelated: 0, reloads: 0 });
  assert.deepEqual(await bootstrap(false, "localhost"), { removed: [PWA_CACHE_PREFIX + "v1"], unregistered: 1, unrelated: 0, reloads: 0 });
  assert.equal((await bootstrap(true, "bharathi.v0.build", true)).reloads, 1);
  assert.equal((await bootstrap(true, "bharathi.v0.build", true, true)).reloads, 0);
  console.log("PASS: production PWA preserved; development/v0 cleanup is scoped, leaves unrelated data alone and cannot create a reload loop.");

  const source = await readFile("public/sw.js", "utf8");
  for (const host of ["bharathi.vercel.app", "bharathi.v0.build"]) {
    const listeners: Record<string, (event: unknown) => void> = {};
    let handled = 0;
    const origin = `https://${host}`;
    vm.runInNewContext(source, {
      URL, Promise, Response,
      self: { location: { hostname: host, origin }, addEventListener: (name: string, action: (event: unknown) => void) => { listeners[name] = action; } },
      caches: { match: async () => new Response("public icon") },
      fetch: async () => new Response("network"),
    });
    for (const path of ["/_next/static/chunks/update.js", "/_next/webpack-hmr", "/_next/data/build/page.json", "/api/reports", "/api/export?format=xlsx"]) {
      listeners.fetch({ request: { method: "GET", url: origin + path, mode: "cors" }, respondWith: () => { handled++; } });
    }
    assert.equal(handled, 0, host);
    listeners.fetch({ request: { method: "GET", url: origin + "/icons/app-192.png", mode: "cors" }, respondWith: () => { handled++; } });
    assert.equal(handled, host.endsWith(".v0.build") ? 0 : 1);
  }
  console.log("PASS: service worker never intercepts Next.js chunks, HMR or private API responses; v0 preview bypasses every fetch.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
