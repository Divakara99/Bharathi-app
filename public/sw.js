/* Bharathi Enterprises production PWA: only public icons and an offline notice.
   Never intercept Next.js chunks/HMR, APIs, exports, mutations or development previews. */
const CACHE_PREFIX = "bharathi-public-assets-";
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const IS_DEVELOPMENT_PREVIEW = self.location.hostname === "v0.build" || self.location.hostname.endsWith(".v0.build");
const PUBLIC_ASSETS = [
  "/offline.html", "/icons/app-192.png", "/icons/app-512.png",
  "/icons/app-maskable-512.png", "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil((IS_DEVELOPMENT_PREVIEW ? Promise.resolve()
    : caches.open(CACHE_NAME).then((cache) => cache.addAll(PUBLIC_ASSETS)))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys
    .filter((key) => key.startsWith(CACHE_PREFIX) && (IS_DEVELOPMENT_PREVIEW || key !== CACHE_NAME))
    .map((key) => caches.delete(key))))
    .then(() => IS_DEVELOPMENT_PREVIEW ? self.registration.unregister() : self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (IS_DEVELOPMENT_PREVIEW || request.method !== "GET" || url.origin !== self.location.origin) return;
  // Let the browser/Next.js serve every versioned chunk, data request and HMR response directly.
  if (url.pathname === "/_next" || url.pathname.startsWith("/_next/") || url.pathname === "/api" || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => {
      const offline = await caches.match("/offline.html");
      return offline || new Response("Connect to the internet to open Bharathi Enterprises.", {
        status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }));
    return;
  }
  if (PUBLIC_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(url.pathname).then((cached) => cached || fetch(request)));
  }
});
