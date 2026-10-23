/* Local application assets only. No project or photograph data is cached here. */
const manifest = [{"revision":"03a2b13f9fc140c56230282b0aa9f781","url":"manifest.webmanifest"},{"revision":"2be16c9b1fdad9e22fa2cc68c7e8d602","url":"index.html"},{"revision":"5163088949fbcbffd59eb3282188122f","url":"icon.svg"},{"revision":"f1f5b5999eb72c2c47d46b5579534e60","url":"icon-512.png"},{"revision":"c86af67c3134b722e78a20f1c02d06f1","url":"icon-192.png"},{"revision":"9ba8fcca9939e646d4ab2c3b302b9c31","url":"assets/sharing-BMNkbGYx.js"},{"revision":"9c886a1c6b012e2ea365ef71f412d9bc","url":"assets/SharePanel-kOYo7gpN.js"},{"revision":"97f6b56ec4a481770b0fe1c20a11ab09","url":"assets/SharedViewer-kr7KR2GX.js"},{"revision":"df442d3dc953792ad07e31c5460ef93e","url":"assets/RoomScene-CWAwbG0W.js"},{"revision":"b2db5ccadbbdaf561108ff756ea76e5b","url":"assets/model-Dre-B5rh.js"},{"revision":"8b1413091a51ddcfec63e5ef119b03fe","url":"assets/jsx-runtime-Wy9s6hX0.js"},{"revision":"358c50ffa79332400909dd2d7b7d1efd","url":"assets/index-TKs_lCaZ.js"},{"revision":"0fdf788067978e51ca148233f053383e","url":"assets/index-edTLfx8I.css"},{"revision":"06ac8d7e1b74fca4ab6cd0da6c2376f5","url":"assets/firebase-BTb8cY1p.js"},{"revision":"2dd89ce703aa3fab851987f5e5546e64","url":"assets/archive-whR-TEsQ.js"}];
const BUILD = '7b0df30fec15';
const integrity = {"assets/RoomScene-CWAwbG0W.js":"5a310bfa05ea294d3c585506b01e291b30d83ddb520f57803ced85e1a4c52561","assets/SharePanel-kOYo7gpN.js":"844ce8f5f6d8d022d8e461208ab8330e60280c0a43e2361403bf4f8f2bf2f48f","assets/SharedViewer-kr7KR2GX.js":"1b0a0992092d3723168e8bfa052da7067c1a23483aeabefbf782ca5cb911e473","assets/archive-whR-TEsQ.js":"17a596b7f503ca7f3cd5d3013abd6004b82d07c1084266e1c58e57dde6fffffc","assets/firebase-BTb8cY1p.js":"287f284453675c53a0b4562218a2acd20350d522cfecad7cb6640291390fffe1","assets/index-TKs_lCaZ.js":"3be24d9d1177a8b71bff154960c96467a4de2edb05d23e3afe333a79617c0b5a","assets/index-edTLfx8I.css":"2a27ab0223c44f1efd12a7d0cf4145fb1904ffb279102485593d95122f5e80d8","assets/jsx-runtime-Wy9s6hX0.js":"bcb9f6586cd973c2fb2faa4a2d38d4b06660e2fe2806aaa0de1c39306ff0f69a","assets/model-Dre-B5rh.js":"20e71202ac320dc0f0fd89ca5704daf59569ea4e0eaefe8cb67421220e9d26ac","assets/sharing-BMNkbGYx.js":"95c988998f31215864f806f280745bbbdfe04d8ebadc4d45775ea3590f7be46a","icon-192.png":"51097f46a520a099a3619c0cc30559396a4fb7540df84bd6ce9e88af0ae767a5","icon-512.png":"d3e6c36f171575a3bf0ce43776ddaef13fe526101075b8a5c90987690ef43af1","icon.svg":"3d827e315d6b27868145c495317e518f01ef808b72ae03547f9e09b522a7f64b","index.html":"5c078afa4bcf9c52f5f573a849955fc6734d075002aba86e5dd77068d93a0c82","manifest.webmanifest":"5e61328e25010852e2868cda9881ee54a1aa1a3e1462d5e6a65b7f66b2741102"};
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
