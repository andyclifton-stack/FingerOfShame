/* Local application assets only. No project or photograph data is cached here. */
const manifest = [{"revision":"03a2b13f9fc140c56230282b0aa9f781","url":"manifest.webmanifest"},{"revision":"ddb3993e8797d9b4b428708ad04804ef","url":"index.html"},{"revision":"5163088949fbcbffd59eb3282188122f","url":"icon.svg"},{"revision":"f1f5b5999eb72c2c47d46b5579534e60","url":"icon-512.png"},{"revision":"c86af67c3134b722e78a20f1c02d06f1","url":"icon-192.png"},{"revision":"7c94b30fe6a452d3176ef6292e2efee5","url":"assets/sharing-CgSrQWjV.js"},{"revision":"f003b57534cd19c7b7b08d3e5d7b7d05","url":"assets/SharePanel-DhWOlOKf.js"},{"revision":"8befd697a75db35cf66effb0a986fed8","url":"assets/SharedViewer-DLglWl66.js"},{"revision":"e67eb7c26dbd2fbadec881ace8096773","url":"assets/RoomScene-rPR-my7l.js"},{"revision":"b2db5ccadbbdaf561108ff756ea76e5b","url":"assets/model-Dre-B5rh.js"},{"revision":"8b1413091a51ddcfec63e5ef119b03fe","url":"assets/jsx-runtime-Wy9s6hX0.js"},{"revision":"f456f5921276f9ee15338a7a74d8f28a","url":"assets/index-FDJ9kx42.js"},{"revision":"5f9199915b2c2304a87c310978304207","url":"assets/index-4BQBZXdY.css"},{"revision":"a8cfa7feccfaebc39f76eb5eadcadbcc","url":"assets/firebase-Cqk4DhLN.js"},{"revision":"2dd89ce703aa3fab851987f5e5546e64","url":"assets/archive-whR-TEsQ.js"}];
const BUILD = '808e9648bba4';
const integrity = {"assets/RoomScene-rPR-my7l.js":"fecc29d73085db08701938dcedffdf8b51135ebf57a6c30c389c13ca6f3a63ad","assets/SharePanel-DhWOlOKf.js":"650ae1956422d7b6c500e9a60e50db2e6d950aaf76b4fe2ba3f6a6bf20bc4046","assets/SharedViewer-DLglWl66.js":"cd401190c170548052683d1c73104cbb01cbf4117f0753677d5062bbfa4ab0dc","assets/archive-whR-TEsQ.js":"17a596b7f503ca7f3cd5d3013abd6004b82d07c1084266e1c58e57dde6fffffc","assets/firebase-Cqk4DhLN.js":"49287034689b138fae4588bbb020a7c29e496224d4ec43d4759194de921e65cf","assets/index-4BQBZXdY.css":"588d5ca40a323506c54d2ad147e43a09b4c83eaf2917a8de9caba82665cdb6a4","assets/index-FDJ9kx42.js":"d7a8a58c2001028b55b974b65cc20441c3f0ec51698ee03e619b8966c1f89ffb","assets/jsx-runtime-Wy9s6hX0.js":"bcb9f6586cd973c2fb2faa4a2d38d4b06660e2fe2806aaa0de1c39306ff0f69a","assets/model-Dre-B5rh.js":"20e71202ac320dc0f0fd89ca5704daf59569ea4e0eaefe8cb67421220e9d26ac","assets/sharing-CgSrQWjV.js":"9f2f3e20ca26977e5efa90818b9a917e430d7a3c913c886ba6311e1926499cc7","icon-192.png":"51097f46a520a099a3619c0cc30559396a4fb7540df84bd6ce9e88af0ae767a5","icon-512.png":"d3e6c36f171575a3bf0ce43776ddaef13fe526101075b8a5c90987690ef43af1","icon.svg":"3d827e315d6b27868145c495317e518f01ef808b72ae03547f9e09b522a7f64b","index.html":"ae21293dabc422fb69239778ed7727743930dee1535c565f81a31d1174fe8889","manifest.webmanifest":"5e61328e25010852e2868cda9881ee54a1aa1a3e1462d5e6a65b7f66b2741102"};
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
