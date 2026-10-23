/* Local application assets only. No project or photograph data is cached here. */
const manifest = [{"revision":"18484111fdb578e9539c36ed433d157e","url":"manifest.webmanifest"},{"revision":"9ce484eb5411dd96d4f9cb497d8b2e27","url":"index.html"},{"revision":"5163088949fbcbffd59eb3282188122f","url":"icon.svg"},{"revision":"f1f5b5999eb72c2c47d46b5579534e60","url":"icon-512.png"},{"revision":"c86af67c3134b722e78a20f1c02d06f1","url":"icon-192.png"},{"revision":"09b7dd39ee0a75ab64b7d87740c4c0ea","url":"assets/RoomScene-DKhv-UW9.js"},{"revision":"386e4e9c88307ec97131fa1a7fa25d25","url":"assets/model-Bs5l4rUZ.js"},{"revision":"4ba4705d9898361b894273e2be630352","url":"assets/index-J9kbiEeG.css"},{"revision":"e1100e53c36d3226719c8ec83cd41c86","url":"assets/index-0KmQfgGB.js"},{"revision":"fa8cf3a25c8e6337a3131ceb88c079eb","url":"assets/firebase-Dtcy7IPa.js"},{"revision":"b49c0c94b5c23ae302b36e3e2b907c37","url":"assets/archive-B8Yv0CfW.js"}];
const BUILD = '9ebcbc149d74';
const integrity = {"assets/RoomScene-DKhv-UW9.js":"5ae6b87ce943787ec5dc9b9ad6126ae5f050e02300b24c9c21b83aaad624ad4f","assets/archive-B8Yv0CfW.js":"b274b34e23f7fc671ad172eb7e468f33c086f8b8c1b91a822cac38a9b4ff519c","assets/firebase-Dtcy7IPa.js":"9bdb0df36699fd591701a989d0dcdf9960bfad2fa0ef41500ad9ed17242e69b3","assets/index-0KmQfgGB.js":"a51e90126fa4e63fee7332ef399c24b9430529e8161e406efacf647081059465","assets/index-J9kbiEeG.css":"41e050db73f779727ec7887b6da7e449db884a70c90622cff93e34391fefa376","assets/model-Bs5l4rUZ.js":"3c58a6e74784055eceee7e1532a2a1d39ec2d403ed6f29d416dfe683e6470374","icon-192.png":"51097f46a520a099a3619c0cc30559396a4fb7540df84bd6ce9e88af0ae767a5","icon-512.png":"d3e6c36f171575a3bf0ce43776ddaef13fe526101075b8a5c90987690ef43af1","icon.svg":"3d827e315d6b27868145c495317e518f01ef808b72ae03547f9e09b522a7f64b","index.html":"9568366fb78ef568bee69932b92d83ad5b74bca6de1471d3d71360184926063c","manifest.webmanifest":"49ca983d4c3f52be444bb2bd825b2be983804a57bb5992f55175c62f6a53d78e"};
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
