/* Local application assets only. No project or photograph data is cached here. */
const manifest = [{"revision":"18484111fdb578e9539c36ed433d157e","url":"manifest.webmanifest"},{"revision":"53528fe3013964343ee88a000212b5ee","url":"index.html"},{"revision":"5163088949fbcbffd59eb3282188122f","url":"icon.svg"},{"revision":"f1f5b5999eb72c2c47d46b5579534e60","url":"icon-512.png"},{"revision":"c86af67c3134b722e78a20f1c02d06f1","url":"icon-192.png"},{"revision":"2ed2e1fe0ed5eb1101dc6f6bab3e4466","url":"assets/RoomScene-4ktnbqve.js"},{"revision":"386e4e9c88307ec97131fa1a7fa25d25","url":"assets/model-Bs5l4rUZ.js"},{"revision":"ccc93ed6c6575d2c7bfb0e79927a8d23","url":"assets/index-DdtbB33R.js"},{"revision":"fb3193699ec31469bdc6f2c4633bedf9","url":"assets/index-BWyyvfga.css"},{"revision":"c04720979fc02aa67dc92421f10a6291","url":"assets/firebase-BTm8I98r.js"},{"revision":"b49c0c94b5c23ae302b36e3e2b907c37","url":"assets/archive-B8Yv0CfW.js"}];
const BUILD = '5f6ec82e870f';
const integrity = {"assets/RoomScene-4ktnbqve.js":"daca546e4e888be2a8df84b9336991bf1003f719d4618b34d08f7147054b610d","assets/archive-B8Yv0CfW.js":"b274b34e23f7fc671ad172eb7e468f33c086f8b8c1b91a822cac38a9b4ff519c","assets/firebase-BTm8I98r.js":"54cafe79091290296aa3d781d6e8caaeef3b7c6058515f2f5916c402a4140df5","assets/index-BWyyvfga.css":"c4a12479f07437a865c6aa8d7fa06e311ae0d873c2ac13296f2efb0198e9f643","assets/index-DdtbB33R.js":"7093a700c33c22ee26a695fa04d115aba8b069d22453fe4c96ddad9f52ed12d1","assets/model-Bs5l4rUZ.js":"3c58a6e74784055eceee7e1532a2a1d39ec2d403ed6f29d416dfe683e6470374","icon-192.png":"51097f46a520a099a3619c0cc30559396a4fb7540df84bd6ce9e88af0ae767a5","icon-512.png":"d3e6c36f171575a3bf0ce43776ddaef13fe526101075b8a5c90987690ef43af1","icon.svg":"3d827e315d6b27868145c495317e518f01ef808b72ae03547f9e09b522a7f64b","index.html":"eb759d5c25706542aba77c9e1bf925f9ad6087b354589b5c229584ff0d394103","manifest.webmanifest":"49ca983d4c3f52be444bb2bd825b2be983804a57bb5992f55175c62f6a53d78e"};
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
