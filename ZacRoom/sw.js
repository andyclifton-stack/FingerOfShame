/* Local application assets only. No project or photograph data is cached here. */
const manifest = [{"revision":"18484111fdb578e9539c36ed433d157e","url":"manifest.webmanifest"},{"revision":"cdb98fd960d2dcac7d9b3fc6215673a8","url":"index.html"},{"revision":"5163088949fbcbffd59eb3282188122f","url":"icon.svg"},{"revision":"f1f5b5999eb72c2c47d46b5579534e60","url":"icon-512.png"},{"revision":"c86af67c3134b722e78a20f1c02d06f1","url":"icon-192.png"},{"revision":"a38ff09154a832cfdaf47365973998c1","url":"assets/RoomScene-CEGE6ohe.js"},{"revision":"f62c1279209939ec18282e213b393eb5","url":"assets/model-Ce1q3LqA.js"},{"revision":"5f757ab7eb5eec3047d1d9ba9bb97840","url":"assets/index-CbpfNQa3.css"},{"revision":"8a04f4fe9a137654fa008531d57ecec1","url":"assets/index-C3MJtwDu.js"},{"revision":"660aec33f155ac62c12d0de667398cf6","url":"assets/firebase-dL4zHzs6.js"},{"revision":"5d9a864334f2d059bb20685bb859c0c2","url":"assets/archive-BTGpmzad.js"}];
const BUILD = 'd0db9ca368ec';
const integrity = {"assets/RoomScene-CEGE6ohe.js":"0490c5d05007b057e791a8ac2364b7e526a8aa57c10f5a7cbca64d37c3b83fce","assets/archive-BTGpmzad.js":"5aed38336cf3cc7b3ef0dbc71cd0f75920e756c9555a3046b168a74ed746b78c","assets/firebase-dL4zHzs6.js":"a9de29952779e6f92c650481f94605716d2f85bab17a0bd519380ef818935eae","assets/index-C3MJtwDu.js":"b0b43e65bcb76dff632fac768a16cfd6b5c0b3d49ad4005ef37d51d690d368ca","assets/index-CbpfNQa3.css":"2890b9e8ec18c9c2455584cc16192b241eb6ea72e5f1c876a23e3d7c2086c01a","assets/model-Ce1q3LqA.js":"a3d0fb42bc39e278b2f9e2500b8c33dc9bf1a78e5a82498c69767f3ed9092a82","icon-192.png":"51097f46a520a099a3619c0cc30559396a4fb7540df84bd6ce9e88af0ae767a5","icon-512.png":"d3e6c36f171575a3bf0ce43776ddaef13fe526101075b8a5c90987690ef43af1","icon.svg":"3d827e315d6b27868145c495317e518f01ef808b72ae03547f9e09b522a7f64b","index.html":"4e889be9547b363e91447f48ed179731fe23a4cd65f950c30616b75459b45ecf","manifest.webmanifest":"49ca983d4c3f52be444bb2bd825b2be983804a57bb5992f55175c62f6a53d78e"};
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
