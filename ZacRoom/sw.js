/* Local application assets only. No project or photograph data is cached here. */
const manifest = [{"revision":"18484111fdb578e9539c36ed433d157e","url":"manifest.webmanifest"},{"revision":"c233f034350d1bc04872f28ebc499edb","url":"index.html"},{"revision":"5163088949fbcbffd59eb3282188122f","url":"icon.svg"},{"revision":"f1f5b5999eb72c2c47d46b5579534e60","url":"icon-512.png"},{"revision":"c86af67c3134b722e78a20f1c02d06f1","url":"icon-192.png"},{"revision":"42c261a8388513c2ce764f6c5c83f166","url":"assets/RoomScene-BN_0vBTw.js"},{"revision":"850dd2db058b089bb87b905fd4af0c6a","url":"assets/model-uONgxWHX.js"},{"revision":"bd068c721c448cf9d8bc6caa9799c27f","url":"assets/index-DThYLg2P.css"},{"revision":"fd9f23c66cf830300e54508feb80dc62","url":"assets/index-DCAd-Idv.js"},{"revision":"64dbe823047f3e8075024a58f3c2cbd5","url":"assets/firebase-Cg6z1InG.js"},{"revision":"3eb86063a79c7871e39211a6a71790c3","url":"assets/archive-BuyJg-X7.js"}];
const BUILD = 'c215bd239e36';
const integrity = {"assets/RoomScene-BN_0vBTw.js":"5b762b0bea760833c3fb69a255d8efb7d8dfcb6e0e8a6c10df0ad7f3ead2537e","assets/archive-BuyJg-X7.js":"5eb19087f03ed51432fb8e26839568a320a4eab5067f543463abb7aad224eeea","assets/firebase-Cg6z1InG.js":"d9b8368b906584299b0d532b62712127140f057fc249499043ba00dff5994e08","assets/index-DCAd-Idv.js":"90891504eb61fda92ea71da863f7112440deb76406d1323d4f17abdd3c8dd558","assets/index-DThYLg2P.css":"1896e7dc4410bfc9ced670a6006671175dc444b575a63ba39f13df14978b80a1","assets/model-uONgxWHX.js":"46a10159397746ad8b1fd80cb668b7768006e6ee4f6c49e9f79da0ec6bc940a3","icon-192.png":"51097f46a520a099a3619c0cc30559396a4fb7540df84bd6ce9e88af0ae767a5","icon-512.png":"d3e6c36f171575a3bf0ce43776ddaef13fe526101075b8a5c90987690ef43af1","icon.svg":"3d827e315d6b27868145c495317e518f01ef808b72ae03547f9e09b522a7f64b","index.html":"763122681396aacd009045f07534c7735aee75bf19d5705a0828e541441ec5f9","manifest.webmanifest":"49ca983d4c3f52be444bb2bd825b2be983804a57bb5992f55175c62f6a53d78e"};
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
