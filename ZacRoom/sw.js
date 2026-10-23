/* Local application assets only. No project or photograph data is cached here. */
const manifest = [{"revision":"03a2b13f9fc140c56230282b0aa9f781","url":"manifest.webmanifest"},{"revision":"8cd6f0fd5cc58303ec25f33f9e744f61","url":"index.html"},{"revision":"5163088949fbcbffd59eb3282188122f","url":"icon.svg"},{"revision":"f1f5b5999eb72c2c47d46b5579534e60","url":"icon-512.png"},{"revision":"c86af67c3134b722e78a20f1c02d06f1","url":"icon-192.png"},{"revision":"c892478d40cdb43b8e66c968f00ae832","url":"assets/ShoppingList-ny9M6U2v.css"},{"revision":"173f49b6d0c569287bd5c4a0b8cf9b06","url":"assets/ShoppingList-4jHNs_Ch.js"},{"revision":"8534a56574b5ada226a7d9dcdb68b57d","url":"assets/sharing-D1_pxN6b.js"},{"revision":"c4cec3dbdd6e4c6f4c8318993773dc13","url":"assets/SharePanel-D77O__l9.js"},{"revision":"0611f2b6d38285511dd3a3e4aa14de2e","url":"assets/SharedViewer-DvYjHLKE.js"},{"revision":"5901dfa8a9644d8d840e992df7d64095","url":"assets/RoomScene-BhtoaAkF.js"},{"revision":"d63745b3d9e7e7172b8e7711639ffe91","url":"assets/repository-PKyProv9.js"},{"revision":"b2db5ccadbbdaf561108ff756ea76e5b","url":"assets/model-Dre-B5rh.js"},{"revision":"8b1413091a51ddcfec63e5ef119b03fe","url":"assets/jsx-runtime-Wy9s6hX0.js"},{"revision":"2b876b68837933286af81a93f266e3a3","url":"assets/index-eS1qxt2Q.js"},{"revision":"0fdf788067978e51ca148233f053383e","url":"assets/index-edTLfx8I.css"},{"revision":"ee3b41bc99796ea14d588c732e34047b","url":"assets/firebase-Cdo9wTMn.js"},{"revision":"8b123e83b33b37198589a1e1983aa850","url":"assets/archive-D_qzRwGn.js"}];
const BUILD = 'e1ba8946b006';
const integrity = {"assets/RoomScene-BhtoaAkF.js":"7bc98a7671f96197cf7af90cf35296258be36ce3a9326f587993f955d3b4c4e9","assets/SharePanel-D77O__l9.js":"6909e1c9023c978e1559b97bbf217770988372c0034beb9f980ba261715e4c91","assets/SharedViewer-DvYjHLKE.js":"be7044dad88a44605cdf9c03f75b33defecb75cf82e86fb4f2d201e18e5e7fbe","assets/ShoppingList-4jHNs_Ch.js":"204c998ddcba35b533cdee3b50e6ec9d698f47c7a486b2712e6a3a6eb334be3c","assets/ShoppingList-ny9M6U2v.css":"cc010ad6b3696ad39e74d72618cfbd234eee5318f9b0ff079a24380fefd13b8b","assets/archive-D_qzRwGn.js":"63355bc261188e128aebe0f07520b5756df453ecf9f5b4f22ca01d7e50d937e9","assets/firebase-Cdo9wTMn.js":"f942967a457199102c304900547404657ef6ee86a8caa4b82f5697dd674736c1","assets/index-eS1qxt2Q.js":"d6271cca28dd428469bf0872f3baa8aeaccdcd3b5e1f4a72d3a94d5d28e0310e","assets/index-edTLfx8I.css":"2a27ab0223c44f1efd12a7d0cf4145fb1904ffb279102485593d95122f5e80d8","assets/jsx-runtime-Wy9s6hX0.js":"bcb9f6586cd973c2fb2faa4a2d38d4b06660e2fe2806aaa0de1c39306ff0f69a","assets/model-Dre-B5rh.js":"20e71202ac320dc0f0fd89ca5704daf59569ea4e0eaefe8cb67421220e9d26ac","assets/repository-PKyProv9.js":"21d2623f52cf66241b78c2d24f71a1a0036939220edf8553c86a12edf4ce2084","assets/sharing-D1_pxN6b.js":"fb9ca40c2711ebe91e9ac0b8cea7bae6996e9ef4bcac0f79b747e63ba1f5f85d","icon-192.png":"51097f46a520a099a3619c0cc30559396a4fb7540df84bd6ce9e88af0ae767a5","icon-512.png":"d3e6c36f171575a3bf0ce43776ddaef13fe526101075b8a5c90987690ef43af1","icon.svg":"3d827e315d6b27868145c495317e518f01ef808b72ae03547f9e09b522a7f64b","index.html":"7285007402a92380a996053c251b2967169e9801e24df2d178a08c5586136b2b","manifest.webmanifest":"5e61328e25010852e2868cda9881ee54a1aa1a3e1462d5e6a65b7f66b2741102"};
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
