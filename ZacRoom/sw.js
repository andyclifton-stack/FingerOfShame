/* Local application assets only. No project or photograph data is cached here. */
const manifest = [{"revision":"03a2b13f9fc140c56230282b0aa9f781","url":"manifest.webmanifest"},{"revision":"24d8b84d4fb5baed5a337cb14d06283c","url":"index.html"},{"revision":"5163088949fbcbffd59eb3282188122f","url":"icon.svg"},{"revision":"f1f5b5999eb72c2c47d46b5579534e60","url":"icon-512.png"},{"revision":"c86af67c3134b722e78a20f1c02d06f1","url":"icon-192.png"},{"revision":"23143d11a0beaedc56ea016e074d83c2","url":"assets/sharing-DeIdkTok.js"},{"revision":"88d6e25837431f4c8122d8441be07e98","url":"assets/SharePanel-cr_NzOLE.js"},{"revision":"cbaa1c35c9b77dec662f33937f07e217","url":"assets/SharedViewer-BCAbiyHQ.js"},{"revision":"6829cbc662def66e21dcbd5af8395d6a","url":"assets/RoomScene-Di3PeL5U.js"},{"revision":"b2db5ccadbbdaf561108ff756ea76e5b","url":"assets/model-Dre-B5rh.js"},{"revision":"8b1413091a51ddcfec63e5ef119b03fe","url":"assets/jsx-runtime-Wy9s6hX0.js"},{"revision":"0fdf788067978e51ca148233f053383e","url":"assets/index-edTLfx8I.css"},{"revision":"d4835891af875ba8f072796939ef741f","url":"assets/index-D2KqLNi2.js"},{"revision":"ed260727c7c91909a26506f696f8bd86","url":"assets/firebase-CoyGDnMe.js"},{"revision":"2dd89ce703aa3fab851987f5e5546e64","url":"assets/archive-whR-TEsQ.js"}];
const BUILD = '3ab61390fc74';
const integrity = {"assets/RoomScene-Di3PeL5U.js":"170ae168983ae99a380edc3a9e7c6be86903ec1604f800d44388dcfbdc7cc8a1","assets/SharePanel-cr_NzOLE.js":"7947ad41f21e5caa1d9050f60c05c6113edfcf5430d2fd1ebc0e5253c4d90a3d","assets/SharedViewer-BCAbiyHQ.js":"d3397927b774f03d57596fb734b84acb0f85d5da1f9e81d5b4e78519fbe3f7a8","assets/archive-whR-TEsQ.js":"17a596b7f503ca7f3cd5d3013abd6004b82d07c1084266e1c58e57dde6fffffc","assets/firebase-CoyGDnMe.js":"abb966a07a03a46fcbba4c25abef58c066a57271ef478dfac775f5c436d3ebdc","assets/index-D2KqLNi2.js":"c968988ea81759b8a0b255b22a616bc14cbb5b9a7bff2e7d6ef072a0dd10a43f","assets/index-edTLfx8I.css":"2a27ab0223c44f1efd12a7d0cf4145fb1904ffb279102485593d95122f5e80d8","assets/jsx-runtime-Wy9s6hX0.js":"bcb9f6586cd973c2fb2faa4a2d38d4b06660e2fe2806aaa0de1c39306ff0f69a","assets/model-Dre-B5rh.js":"20e71202ac320dc0f0fd89ca5704daf59569ea4e0eaefe8cb67421220e9d26ac","assets/sharing-DeIdkTok.js":"4228218cf5b42de347929542e4f77a486092479a7fc3537ee2ad9cf2cbad61ae","icon-192.png":"51097f46a520a099a3619c0cc30559396a4fb7540df84bd6ce9e88af0ae767a5","icon-512.png":"d3e6c36f171575a3bf0ce43776ddaef13fe526101075b8a5c90987690ef43af1","icon.svg":"3d827e315d6b27868145c495317e518f01ef808b72ae03547f9e09b522a7f64b","index.html":"c6902da93fabef2b6c30d84a9748a8e8decdcc5f812ea67fffc3726227227610","manifest.webmanifest":"5e61328e25010852e2868cda9881ee54a1aa1a3e1462d5e6a65b7f66b2741102"};
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
