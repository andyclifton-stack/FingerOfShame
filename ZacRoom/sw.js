/* Local application assets only. No project or photograph data is cached here. */
const manifest = [{"revision":"18484111fdb578e9539c36ed433d157e","url":"manifest.webmanifest"},{"revision":"3f6ada9e5e3e21669b5d8e3dc96b51de","url":"index.html"},{"revision":"5163088949fbcbffd59eb3282188122f","url":"icon.svg"},{"revision":"f1f5b5999eb72c2c47d46b5579534e60","url":"icon-512.png"},{"revision":"c86af67c3134b722e78a20f1c02d06f1","url":"icon-192.png"},{"revision":"43b3a63175d812032c7f82fae7c1e753","url":"assets/RoomScene-BeW22BbT.js"},{"revision":"15d745489c2a2a168356bb349761db7f","url":"assets/model-DjVEmxHQ.js"},{"revision":"f390c41d560ffbda090ede97638f6014","url":"assets/index-katu85Tt.js"},{"revision":"bd068c721c448cf9d8bc6caa9799c27f","url":"assets/index-DThYLg2P.css"},{"revision":"8cb5f74dcc410b825b49af8afca39195","url":"assets/firebase-DXv8jysX.js"},{"revision":"3c7b735e9766804aa4df506e546379a9","url":"assets/archive-G8LAraGI.js"}];
const BUILD = '5e13b7742eb0';
const integrity = {"assets/RoomScene-BeW22BbT.js":"510f9cc414f61f87873ca9244ee84a6608adb855f323f5c8d64ad74b9fc52033","assets/archive-G8LAraGI.js":"076857cfcd6193f805e911d65c13669fe4a16ad1487164e2aa6f6ecc0b1c5ae6","assets/firebase-DXv8jysX.js":"f75509b45abcef846003912e383fb8692586986f28850753a5035aefd3475826","assets/index-DThYLg2P.css":"1896e7dc4410bfc9ced670a6006671175dc444b575a63ba39f13df14978b80a1","assets/index-katu85Tt.js":"5e7058d8a0aae87e82b53bc43044c9d3bfb38ed8059ae5ae9ccbc5b57d781bfd","assets/model-DjVEmxHQ.js":"b2dfc532135981c4d2c9e7bd80f68ae23633e8e1426caa8da7fe93b9a1a80cb3","icon-192.png":"51097f46a520a099a3619c0cc30559396a4fb7540df84bd6ce9e88af0ae767a5","icon-512.png":"d3e6c36f171575a3bf0ce43776ddaef13fe526101075b8a5c90987690ef43af1","icon.svg":"3d827e315d6b27868145c495317e518f01ef808b72ae03547f9e09b522a7f64b","index.html":"950665d9392262f13cba08bc2264983da1d8270609e55877e48e357ce970bb49","manifest.webmanifest":"49ca983d4c3f52be444bb2bd825b2be983804a57bb5992f55175c62f6a53d78e"};
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
