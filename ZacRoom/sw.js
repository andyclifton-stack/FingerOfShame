/* Local application assets only. No project or photograph data is cached here. */
const manifest = [{"revision":"03a2b13f9fc140c56230282b0aa9f781","url":"manifest.webmanifest"},{"revision":"065bcbfa951550543d16aa6674c9c0a3","url":"index.html"},{"revision":"5163088949fbcbffd59eb3282188122f","url":"icon.svg"},{"revision":"f1f5b5999eb72c2c47d46b5579534e60","url":"icon-512.png"},{"revision":"c86af67c3134b722e78a20f1c02d06f1","url":"icon-192.png"},{"revision":"509ace796a7328383d8aae936d5cb550","url":"assets/sharing-BbttDNRY.js"},{"revision":"ea07e9334d1785739e69be4d9613443c","url":"assets/SharePanel-DN2yZ4nz.js"},{"revision":"ce8d4c652e8354a4838ad2c34f1664da","url":"assets/SharedViewer-yC7bL2iq.js"},{"revision":"1200651c76097bbe10b04f8c2d5ea081","url":"assets/RoomScene-BjCo1F44.js"},{"revision":"b2db5ccadbbdaf561108ff756ea76e5b","url":"assets/model-Dre-B5rh.js"},{"revision":"8b1413091a51ddcfec63e5ef119b03fe","url":"assets/jsx-runtime-Wy9s6hX0.js"},{"revision":"b3f538ce917158c041baf86c62b509c7","url":"assets/index-Bmuaf_7Z.js"},{"revision":"5f9199915b2c2304a87c310978304207","url":"assets/index-4BQBZXdY.css"},{"revision":"de0f3fa78c0504d79fc2f808677242d3","url":"assets/firebase-ZrekkDdP.js"},{"revision":"2dd89ce703aa3fab851987f5e5546e64","url":"assets/archive-whR-TEsQ.js"}];
const BUILD = '9c7ee9c7906e';
const integrity = {"assets/RoomScene-BjCo1F44.js":"88c28c13ef3599a7f39179b3b0d30af81120f04a64fde8ab611ab3a428d025cd","assets/SharePanel-DN2yZ4nz.js":"1535c23d4b6687e6dfbfe1f69cb3057ed5b34648158302b73454de96b68e0400","assets/SharedViewer-yC7bL2iq.js":"dc389d2951afb42b473ce95f7411a2449c36937106e1c0c17161274432737d02","assets/archive-whR-TEsQ.js":"17a596b7f503ca7f3cd5d3013abd6004b82d07c1084266e1c58e57dde6fffffc","assets/firebase-ZrekkDdP.js":"d82bd325d779b770dff9eb091cc995e3286620af1e5702b2eb4e2b844d7163cb","assets/index-4BQBZXdY.css":"588d5ca40a323506c54d2ad147e43a09b4c83eaf2917a8de9caba82665cdb6a4","assets/index-Bmuaf_7Z.js":"a11d0bda8f336f0f9d958127fe889f95d933f051bfb1001215f451f03d6630cc","assets/jsx-runtime-Wy9s6hX0.js":"bcb9f6586cd973c2fb2faa4a2d38d4b06660e2fe2806aaa0de1c39306ff0f69a","assets/model-Dre-B5rh.js":"20e71202ac320dc0f0fd89ca5704daf59569ea4e0eaefe8cb67421220e9d26ac","assets/sharing-BbttDNRY.js":"3a78831dd067be1716449e7639b0e5519b22f099239cc0a7706a0b2974b9e67a","icon-192.png":"51097f46a520a099a3619c0cc30559396a4fb7540df84bd6ce9e88af0ae767a5","icon-512.png":"d3e6c36f171575a3bf0ce43776ddaef13fe526101075b8a5c90987690ef43af1","icon.svg":"3d827e315d6b27868145c495317e518f01ef808b72ae03547f9e09b522a7f64b","index.html":"bfad8422cd85a8044eec401693fe251d8365e0bd1e44ea6bcf87feb505187e13","manifest.webmanifest":"5e61328e25010852e2868cda9881ee54a1aa1a3e1462d5e6a65b7f66b2741102"};
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
