/* Local application assets only. No project or photograph data is cached here. */
const manifest = [{"revision":"03a2b13f9fc140c56230282b0aa9f781","url":"manifest.webmanifest"},{"revision":"fae0519cfdc19c98ccdccec0440fef06","url":"index.html"},{"revision":"5163088949fbcbffd59eb3282188122f","url":"icon.svg"},{"revision":"f1f5b5999eb72c2c47d46b5579534e60","url":"icon-512.png"},{"revision":"c86af67c3134b722e78a20f1c02d06f1","url":"icon-192.png"},{"revision":"585161eb1dcaa6ddf7d94736998864ff","url":"assets/sharing-BqKrq6g5.js"},{"revision":"f27fa3f66b45dd0843d223139a23ff34","url":"assets/SharePanel-atf9RuTS.js"},{"revision":"ef92449e0fac0d32d175fc89188100df","url":"assets/SharedViewer-D_ISaBPC.js"},{"revision":"8502921e78b6b9f68b62fc7eef7fb807","url":"assets/RoomScene-D9Ymjohw.js"},{"revision":"95545ffc2e977aef59564719eb6f2187","url":"assets/model-Drbl3XaK.js"},{"revision":"8b1413091a51ddcfec63e5ef119b03fe","url":"assets/jsx-runtime-Wy9s6hX0.js"},{"revision":"7414dd1d879c90e89de753511c2c4245","url":"assets/index-F94BbdUT.js"},{"revision":"5f9199915b2c2304a87c310978304207","url":"assets/index-4BQBZXdY.css"},{"revision":"b7c3bb8fbfe232bbb3d943762bb4edcb","url":"assets/firebase-DWzrqfYp.js"},{"revision":"a84c65a2121bec8716c39e777c46350f","url":"assets/archive-Bi7MrO3b.js"}];
const BUILD = '2b11260b54bb';
const integrity = {"assets/RoomScene-D9Ymjohw.js":"be587aa7e161d4f8c9b2efbc8918c5f9febf8b59c6ced3de708fb02d3572dada","assets/SharePanel-atf9RuTS.js":"eb7ff57469c1d4bfbd29d69f2dae62ce4667c824dc270fde6512ae7ee98ca193","assets/SharedViewer-D_ISaBPC.js":"87dc69951cefdba898c19648c5249b68195ff3cd1bb824b1240286d930af602c","assets/archive-Bi7MrO3b.js":"d5dc4d70b31506247d6d8f0372702e978ae803b08f2e21bdb8bb2d93c426f155","assets/firebase-DWzrqfYp.js":"dd78812d394c4fa465352dee5bb96940181a6a175dff745c8ce43587e59c5d87","assets/index-4BQBZXdY.css":"588d5ca40a323506c54d2ad147e43a09b4c83eaf2917a8de9caba82665cdb6a4","assets/index-F94BbdUT.js":"19136a579d3fa9f91312aceaf3f0014d51556d22b893bce2a0784b7e0e1a9b51","assets/jsx-runtime-Wy9s6hX0.js":"bcb9f6586cd973c2fb2faa4a2d38d4b06660e2fe2806aaa0de1c39306ff0f69a","assets/model-Drbl3XaK.js":"4681e2ed00dd967c750fc7a105ed1672eccfc5ffe1030d729730b5522dffae97","assets/sharing-BqKrq6g5.js":"5bd97dbfa96c590a57b9fea01f400359d72fe8fe1d68869b38fe6fcb484a036a","icon-192.png":"51097f46a520a099a3619c0cc30559396a4fb7540df84bd6ce9e88af0ae767a5","icon-512.png":"d3e6c36f171575a3bf0ce43776ddaef13fe526101075b8a5c90987690ef43af1","icon.svg":"3d827e315d6b27868145c495317e518f01ef808b72ae03547f9e09b522a7f64b","index.html":"6ebb61e9e782cd99631e088c59e8bf8499562223b7f248af92b6b8b844512547","manifest.webmanifest":"5e61328e25010852e2868cda9881ee54a1aa1a3e1462d5e6a65b7f66b2741102"};
const CACHE = 'zac-room-' + BUILD;
const paths = manifest.map((entry) => new URL(entry.url, self.registration.scope).href);
const expected = new Map(
  Object.entries(integrity).map(([name, hash]) => [
    new URL(name, self.registration.scope).href,
    hash,
  ]),
);
async function verified(url, response) {
  if (!response?.ok) return false;
  const bytes = await response.clone().arrayBuffer();
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('');
  return hash === expected.get(url);
}
async function fetchVerified(cache, url) {
  const response = await fetch(new Request(url, { cache: 'reload' }));
  if (!(await verified(url, response))) throw new Error('Resource integrity check failed: ' + url);
  await cache.put(url, response);
}
self.addEventListener('install', (event) =>
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      for (const url of paths) await fetchVerified(cache, url);
    })(),
  ),
);
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET') return;
  const shell = new URL('index.html', self.registration.scope).href,
    key = event.request.mode === 'navigate' ? shell : event.request.url;
  if (paths.includes(key))
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE),
          cached = await cache.match(key);
        return cached ?? fetch(event.request);
      })(),
    );
  else if (url.pathname.startsWith(new URL('assets/', self.registration.scope).pathname))
    event.respondWith((async () => (await caches.match(event.request)) ?? fetch(event.request))());
});
self.addEventListener('message', (event) => {
  if (event.data?.type === 'ACTIVATE') {
    void self.skipWaiting();
    return;
  }
  if (!['VERIFY', 'REPAIR'].includes(event.data?.type)) return;
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      let missing = 0;
      for (const url of paths) {
        if (!(await verified(url, await cache.match(url)))) {
          if (event.data.type === 'REPAIR') {
            try {
              await fetchVerified(cache, url);
            } catch {
              /* report incomplete */
            }
          }
          if (!(await verified(url, await cache.match(url)))) missing++;
        }
      }
      event.ports[0]?.postMessage({ ready: missing === 0, build: BUILD, missing });
    })(),
  );
});
