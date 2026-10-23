/* Local application assets only. No project or photograph data is cached here. */
const manifest = [{"revision":"03a2b13f9fc140c56230282b0aa9f781","url":"manifest.webmanifest"},{"revision":"a317e395bb97c7d2573029cea6552ff0","url":"index.html"},{"revision":"5163088949fbcbffd59eb3282188122f","url":"icon.svg"},{"revision":"f1f5b5999eb72c2c47d46b5579534e60","url":"icon-512.png"},{"revision":"c86af67c3134b722e78a20f1c02d06f1","url":"icon-192.png"},{"revision":"26e27c07b43990c8dd95301da9404e53","url":"assets/sharing-6rwnvQMb.js"},{"revision":"c8ef6bd101420a3fa961237a78f6ade7","url":"assets/SharePanel-Beja3KAg.js"},{"revision":"98aebb5f81988021298b11e89ed7b4c5","url":"assets/SharedViewer-XLpFtagv.js"},{"revision":"97a82ab1640081601b3f85b36ce00ea8","url":"assets/RoomScene-Bw5qf2xk.js"},{"revision":"95545ffc2e977aef59564719eb6f2187","url":"assets/model-Drbl3XaK.js"},{"revision":"8b1413091a51ddcfec63e5ef119b03fe","url":"assets/jsx-runtime-Wy9s6hX0.js"},{"revision":"2c6d8df33ac35fdf8f8f39affdd51b5c","url":"assets/index-BZvDw8Hc.js"},{"revision":"5f9199915b2c2304a87c310978304207","url":"assets/index-4BQBZXdY.css"},{"revision":"f7e74c6525d161143df47ade0df46f7a","url":"assets/firebase-D16MEnyU.js"},{"revision":"a84c65a2121bec8716c39e777c46350f","url":"assets/archive-Bi7MrO3b.js"}];
const BUILD = '498c1bab9395';
const integrity = {"assets/RoomScene-Bw5qf2xk.js":"abd09796876a06501859ed89e369628e382264daed69cbb076d3b0fbef1e0b39","assets/SharePanel-Beja3KAg.js":"d5e78cdda3308ab83f7242fa4ca344578d4d29f31e24c2cc2a7bcfe39df8354d","assets/SharedViewer-XLpFtagv.js":"2e89da11f42aa3de1767121b627b9a9fa91d494dcc640b3dbdc76191508e9dd0","assets/archive-Bi7MrO3b.js":"d5dc4d70b31506247d6d8f0372702e978ae803b08f2e21bdb8bb2d93c426f155","assets/firebase-D16MEnyU.js":"ac4f8101c324b8d80d51c154fa46bd530bcb3107dc28567809bd14efd317abcc","assets/index-4BQBZXdY.css":"588d5ca40a323506c54d2ad147e43a09b4c83eaf2917a8de9caba82665cdb6a4","assets/index-BZvDw8Hc.js":"31b82a484758c37cd098b114d55705db08f06cb7da433fca646613499c05c6e5","assets/jsx-runtime-Wy9s6hX0.js":"bcb9f6586cd973c2fb2faa4a2d38d4b06660e2fe2806aaa0de1c39306ff0f69a","assets/model-Drbl3XaK.js":"4681e2ed00dd967c750fc7a105ed1672eccfc5ffe1030d729730b5522dffae97","assets/sharing-6rwnvQMb.js":"ed59876308673a27623c752916c721f4959a2d6799be94c168958ab2dd23e96f","icon-192.png":"51097f46a520a099a3619c0cc30559396a4fb7540df84bd6ce9e88af0ae767a5","icon-512.png":"d3e6c36f171575a3bf0ce43776ddaef13fe526101075b8a5c90987690ef43af1","icon.svg":"3d827e315d6b27868145c495317e518f01ef808b72ae03547f9e09b522a7f64b","index.html":"486750463282693c17a89801e3763022fba8c1cd79fca48f50f5cfb7de9ff956","manifest.webmanifest":"5e61328e25010852e2868cda9881ee54a1aa1a3e1462d5e6a65b7f66b2741102"};
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
