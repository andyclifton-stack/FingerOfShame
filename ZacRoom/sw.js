/* Local application assets only. No project or photograph data is cached here. */
const manifest = [{"revision":"03a2b13f9fc140c56230282b0aa9f781","url":"manifest.webmanifest"},{"revision":"9fd96b1673570e85f50f55cdee64c5dd","url":"index.html"},{"revision":"5163088949fbcbffd59eb3282188122f","url":"icon.svg"},{"revision":"f1f5b5999eb72c2c47d46b5579534e60","url":"icon-512.png"},{"revision":"c86af67c3134b722e78a20f1c02d06f1","url":"icon-192.png"},{"revision":"bf05202e80b017454dc6e041878bfd62","url":"assets/RoomScene-D3YkR355.js"},{"revision":"850dd2db058b089bb87b905fd4af0c6a","url":"assets/model-uONgxWHX.js"},{"revision":"b8d1fb1859cec4a54d0638f064855583","url":"assets/index-_yHICnQN.js"},{"revision":"9c28bfcb4f8b894db6f4c830fd6c6316","url":"assets/index-BzCWsI6R.css"},{"revision":"0fa948741c9ce605b500157f541fe6e8","url":"assets/firebase-DoPEEPYm.js"},{"revision":"3eb86063a79c7871e39211a6a71790c3","url":"assets/archive-BuyJg-X7.js"}];
const BUILD = '652626b3fb57';
const integrity = {"assets/RoomScene-D3YkR355.js":"e76b21af234aa8853d0482aa202fd5f5b3a94f0519c4d51f147e7c4f6f779976","assets/archive-BuyJg-X7.js":"5eb19087f03ed51432fb8e26839568a320a4eab5067f543463abb7aad224eeea","assets/firebase-DoPEEPYm.js":"efbc77c375696eca731b3814968e955f9bc52bdd03e38c55d2aca3bda178facc","assets/index-BzCWsI6R.css":"d4fc708ebc3235c0e93ef7e9a031a216a390a9082b9b37138f30d38ee1c6390d","assets/index-_yHICnQN.js":"8d2947b4e3a72b8700aa7471453ac40453b6cd8df3578c850cce053df025a496","assets/model-uONgxWHX.js":"46a10159397746ad8b1fd80cb668b7768006e6ee4f6c49e9f79da0ec6bc940a3","icon-192.png":"51097f46a520a099a3619c0cc30559396a4fb7540df84bd6ce9e88af0ae767a5","icon-512.png":"d3e6c36f171575a3bf0ce43776ddaef13fe526101075b8a5c90987690ef43af1","icon.svg":"3d827e315d6b27868145c495317e518f01ef808b72ae03547f9e09b522a7f64b","index.html":"f67c16f97467e2ec908b8793b481e6cd56faf7a27935c11824bfb0f81f0d3871","manifest.webmanifest":"5e61328e25010852e2868cda9881ee54a1aa1a3e1462d5e6a65b7f66b2741102"};
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
