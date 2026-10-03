const CACHE = "dartscore-__VERSION__";
const FILES = __ASSETS__;
const ROOT = new URL("./", self.location.href);
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll(FILES.map((file) => new URL(file, ROOT).href)),
      ),
  );
  // Wait for existing pages to close: never swap bundles under an active match.
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await Promise.all(
        (await caches.keys())
          .filter((key) => key.startsWith("dartscore-") && key !== CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
      for (const client of await self.clients.matchAll())
        client.postMessage({ type: "OFFLINE_READY" });
    })(),
  );
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "CHECK_OFFLINE")
    event.waitUntil(
      caches.open(CACHE).then(async (cache) => {
        if (await cache.match(new URL("index.html", ROOT).href))
          event.source?.postMessage({ type: "OFFLINE_READY" });
      }),
    );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    url.origin !== ROOT.origin ||
    !url.pathname.startsWith(ROOT.pathname)
  )
    return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      if (event.request.mode === "navigate") {
        try {
          const response = await fetch(event.request);
          if (response.ok) return response;
          throw new Error("Navigation unavailable");
        } catch {
          return (
            (await cache.match(new URL("index.html", ROOT).href)) ||
            Response.error()
          );
        }
      }
      return (await cache.match(event.request)) || fetch(event.request);
    })(),
  );
});
