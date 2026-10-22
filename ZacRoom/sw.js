/* Local application assets only. No project or photograph data is cached here. */
const manifest = [{"revision":"18484111fdb578e9539c36ed433d157e","url":"manifest.webmanifest"},{"revision":"7325dccda73d710b3dd997e6f8470f50","url":"index.html"},{"revision":"5163088949fbcbffd59eb3282188122f","url":"icon.svg"},{"revision":"f1f5b5999eb72c2c47d46b5579534e60","url":"icon-512.png"},{"revision":"c86af67c3134b722e78a20f1c02d06f1","url":"icon-192.png"},{"revision":"e5b45f853081d098d74e5f3c7de0de52","url":"assets/RoomScene-vi4ewdKz.js"},{"revision":"ef7464f0473ee30f88b9acd098e1bf24","url":"assets/model-DBoB9Jan.js"},{"revision":"41a9874038f5e6b677426417fe74c69d","url":"assets/index-D8rSOzi5.css"},{"revision":"cae81b2836a423c82a6c7658c6770f9f","url":"assets/index-Btmul90-.js"},{"revision":"5ed9ebe521b756d42591738e3e49cf98","url":"assets/firebase-BEYW1Q7z.js"},{"revision":"f7579a5ca09f071d8b84fee1a351ddec","url":"assets/archive-Bq97H_gZ.js"}];
const BUILD = '08821208c8ce';
const integrity = {"assets/RoomScene-vi4ewdKz.js":"d82f009f780f11b14349959d8704e42e10fd37114fe9950b4c5c0a8f0f52d64e","assets/archive-Bq97H_gZ.js":"3f103fbcb77abfda06d8cda704fff0b3b135c1e3f8479621c8c6f77eb8a59600","assets/firebase-BEYW1Q7z.js":"2d73aa12284f9e563d88b369df2836261b58e15094f28915b847c4548e9bce58","assets/index-Btmul90-.js":"ed5c09e1f5f8fc338d44959dad504efe580cd62b7f9ac50378f01aa1f8362994","assets/index-D8rSOzi5.css":"5fa4abb3fee0f9b95031dfa0b23123f30b9d77bde03ac5adfa073f96583462c6","assets/model-DBoB9Jan.js":"ed73a8d06409e103459d2893632e9e747d362e0286d0eb187e0cc8d90698158c","icon-192.png":"51097f46a520a099a3619c0cc30559396a4fb7540df84bd6ce9e88af0ae767a5","icon-512.png":"d3e6c36f171575a3bf0ce43776ddaef13fe526101075b8a5c90987690ef43af1","icon.svg":"3d827e315d6b27868145c495317e518f01ef808b72ae03547f9e09b522a7f64b","index.html":"5c61450ac2084d90990c126053c4a1ff5e91961f91439e963d6c3a5096ba0122","manifest.webmanifest":"49ca983d4c3f52be444bb2bd825b2be983804a57bb5992f55175c62f6a53d78e"};
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
