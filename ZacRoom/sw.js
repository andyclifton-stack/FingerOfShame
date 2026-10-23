/* Local application assets only. No project or photograph data is cached here. */
const manifest = [{"revision":"18484111fdb578e9539c36ed433d157e","url":"manifest.webmanifest"},{"revision":"017d43482ee49c27fb9e2d62edad3f4b","url":"index.html"},{"revision":"5163088949fbcbffd59eb3282188122f","url":"icon.svg"},{"revision":"f1f5b5999eb72c2c47d46b5579534e60","url":"icon-512.png"},{"revision":"c86af67c3134b722e78a20f1c02d06f1","url":"icon-192.png"},{"revision":"6a36bc2b7b078f98cb3271d584bff52c","url":"assets/RoomScene-CeGOb97d.js"},{"revision":"386e4e9c88307ec97131fa1a7fa25d25","url":"assets/model-Bs5l4rUZ.js"},{"revision":"985de976b1faf4d089f3ff8382a155e8","url":"assets/index-eWhYgoQ2.js"},{"revision":"1df0c57ef33e6479a87dd99937971751","url":"assets/index-BwdY0yEo.css"},{"revision":"2baccaf04e37d324911e98aef3aea6e3","url":"assets/firebase-B_pn-mcq.js"},{"revision":"b49c0c94b5c23ae302b36e3e2b907c37","url":"assets/archive-B8Yv0CfW.js"}];
const BUILD = '4823ee5e5dc2';
const integrity = {"assets/RoomScene-CeGOb97d.js":"03dfeccd3564ef5d53ca985a2cd126b45b017dc5337af356bc8d380fb18c2a79","assets/archive-B8Yv0CfW.js":"b274b34e23f7fc671ad172eb7e468f33c086f8b8c1b91a822cac38a9b4ff519c","assets/firebase-B_pn-mcq.js":"82acfbc548dd69d5502e8e889a23c5525bc2e3c384798289268c7a1c92a4ea61","assets/index-BwdY0yEo.css":"7a630f898442d045df5756478888027cfee0e32b84189556f063be58c008fc71","assets/index-eWhYgoQ2.js":"19745fe611bd6d62e6b34ddd42f10613ec6949fa5af5d4e2e7dbcfed5497b342","assets/model-Bs5l4rUZ.js":"3c58a6e74784055eceee7e1532a2a1d39ec2d403ed6f29d416dfe683e6470374","icon-192.png":"51097f46a520a099a3619c0cc30559396a4fb7540df84bd6ce9e88af0ae767a5","icon-512.png":"d3e6c36f171575a3bf0ce43776ddaef13fe526101075b8a5c90987690ef43af1","icon.svg":"3d827e315d6b27868145c495317e518f01ef808b72ae03547f9e09b522a7f64b","index.html":"64d20d0556fca6ff59c42d9e7b7a11a04e45ea701d375401b33f87c0e7c38849","manifest.webmanifest":"49ca983d4c3f52be444bb2bd825b2be983804a57bb5992f55175c62f6a53d78e"};
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
