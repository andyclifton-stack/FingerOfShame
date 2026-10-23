/* Local application assets only. No project or photograph data is cached here. */
const manifest = [{"revision":"18484111fdb578e9539c36ed433d157e","url":"manifest.webmanifest"},{"revision":"bbf59527e79478fdadd92136ece3d345","url":"index.html"},{"revision":"5163088949fbcbffd59eb3282188122f","url":"icon.svg"},{"revision":"f1f5b5999eb72c2c47d46b5579534e60","url":"icon-512.png"},{"revision":"c86af67c3134b722e78a20f1c02d06f1","url":"icon-192.png"},{"revision":"e59451de3a2a94120d8284c7719b2d28","url":"assets/RoomScene-DzQCkY23.js"},{"revision":"61aa7e43d7b245e292fbfade8c26d64a","url":"assets/model-C12OoSFe.js"},{"revision":"bd068c721c448cf9d8bc6caa9799c27f","url":"assets/index-DThYLg2P.css"},{"revision":"13e873a838ce8c19042cee25bb9a41f5","url":"assets/index-B_ltdznv.js"},{"revision":"26326f3a17719bea6f553ba6a5ca4d5f","url":"assets/firebase-Q33P-kLa.js"},{"revision":"6891ad6570697a8c7eba7f87e50ce1f3","url":"assets/archive-Mb38snbO.js"}];
const BUILD = '3a5be6e47e75';
const integrity = {"assets/RoomScene-DzQCkY23.js":"b3593e38a0c38d6c1ec23b1f23dfaaf6e823d09d217f994ef36756c3027d5a5f","assets/archive-Mb38snbO.js":"2df1ac4ac3d54a7f2b458788b65f5f1cb275b847616e5cec1410f7f72bb60cc4","assets/firebase-Q33P-kLa.js":"1c1904360c949dade9f6aaff5df259ec562c1f3bc238c9fa2731e9ada1c7b1e4","assets/index-B_ltdznv.js":"0e2834d3e9572f246698b40126735c66671fea381537610bb70bfd97d8eae441","assets/index-DThYLg2P.css":"1896e7dc4410bfc9ced670a6006671175dc444b575a63ba39f13df14978b80a1","assets/model-C12OoSFe.js":"0a7102ef489e185d856a6e1574a9acaa6673181dbb2c454ddb226738ad35194b","icon-192.png":"51097f46a520a099a3619c0cc30559396a4fb7540df84bd6ce9e88af0ae767a5","icon-512.png":"d3e6c36f171575a3bf0ce43776ddaef13fe526101075b8a5c90987690ef43af1","icon.svg":"3d827e315d6b27868145c495317e518f01ef808b72ae03547f9e09b522a7f64b","index.html":"b7638fa74a4263ef20b7b8f6d0d93d16517e8482f245a69c09a55ffa99b7ec45","manifest.webmanifest":"49ca983d4c3f52be444bb2bd825b2be983804a57bb5992f55175c62f6a53d78e"};
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
