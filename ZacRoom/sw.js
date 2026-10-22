/* Local application assets only. No project or photograph data is cached here. */
const manifest = [{"revision":"18484111fdb578e9539c36ed433d157e","url":"manifest.webmanifest"},{"revision":"254da22d319ed4bb140dd1968dccfa78","url":"index.html"},{"revision":"5163088949fbcbffd59eb3282188122f","url":"icon.svg"},{"revision":"f1f5b5999eb72c2c47d46b5579534e60","url":"icon-512.png"},{"revision":"c86af67c3134b722e78a20f1c02d06f1","url":"icon-192.png"},{"revision":"318005fe1df7469c4cd69e6642dc6c3c","url":"assets/RoomScene-BMFruH5T.js"},{"revision":"ef7464f0473ee30f88b9acd098e1bf24","url":"assets/model-DBoB9Jan.js"},{"revision":"3c705525bb840d57bbb48b64e75f5036","url":"assets/index-cnseTD0W.css"},{"revision":"54a23e849efce4a9ee8ae62298b536e3","url":"assets/index-BFq_ptTr.js"},{"revision":"0c5071b2d989f276ec1688a200300f75","url":"assets/firebase-C-qLf9PU.js"},{"revision":"f7579a5ca09f071d8b84fee1a351ddec","url":"assets/archive-Bq97H_gZ.js"}];
const BUILD = 'da44849260b0';
const integrity = {"assets/RoomScene-BMFruH5T.js":"0bbaed026008e4e9e9ef3c24f997643b73236fd5151cf596e1f9a73d8339463d","assets/archive-Bq97H_gZ.js":"3f103fbcb77abfda06d8cda704fff0b3b135c1e3f8479621c8c6f77eb8a59600","assets/firebase-C-qLf9PU.js":"56630f7c0ddcf575b671fa4cbea2472bc16e4490bb500e747351c63b1f2cb7d9","assets/index-BFq_ptTr.js":"68f323618c2abe8f935e5c62f6dd0185b801cbecebff29f2c00545e62dd0acd9","assets/index-cnseTD0W.css":"6399aef35a9db2a0915b7bfb13fc7f5b1ff1792fa2378714e7bc430944c3344b","assets/model-DBoB9Jan.js":"ed73a8d06409e103459d2893632e9e747d362e0286d0eb187e0cc8d90698158c","icon-192.png":"51097f46a520a099a3619c0cc30559396a4fb7540df84bd6ce9e88af0ae767a5","icon-512.png":"d3e6c36f171575a3bf0ce43776ddaef13fe526101075b8a5c90987690ef43af1","icon.svg":"3d827e315d6b27868145c495317e518f01ef808b72ae03547f9e09b522a7f64b","index.html":"cd0b7d2668cd69af7707ab99bb01bf8a629795e5406185ece2910fb9e9b08daa","manifest.webmanifest":"49ca983d4c3f52be444bb2bd825b2be983804a57bb5992f55175c62f6a53d78e"};
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
