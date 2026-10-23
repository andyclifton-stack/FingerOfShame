/* Local application assets only. No project or photograph data is cached here. */
const manifest = [{"revision":"18484111fdb578e9539c36ed433d157e","url":"manifest.webmanifest"},{"revision":"644381332739643ca13433cb4938ad15","url":"index.html"},{"revision":"5163088949fbcbffd59eb3282188122f","url":"icon.svg"},{"revision":"f1f5b5999eb72c2c47d46b5579534e60","url":"icon-512.png"},{"revision":"c86af67c3134b722e78a20f1c02d06f1","url":"icon-192.png"},{"revision":"b990526c194088d59224dd1ab18dd789","url":"assets/RoomScene-BT5PLNmj.js"},{"revision":"ca4bfe25f7ff5ca203ed9132d05f3ddb","url":"assets/model-Bs3aS8gd.js"},{"revision":"32a1ce06f6b7fa17a1ca24569b1b2fe8","url":"assets/index-eGbNQyWw.js"},{"revision":"1df0c57ef33e6479a87dd99937971751","url":"assets/index-BwdY0yEo.css"},{"revision":"e5d4b7852ac8f5753b80e06a1d0a9db2","url":"assets/firebase-CcgSLcIc.js"},{"revision":"6eccf8ac7167f179ca405b0aa6930d9a","url":"assets/archive-B4C_SSPw.js"}];
const BUILD = '605a93a14731';
const integrity = {"assets/RoomScene-BT5PLNmj.js":"5c2ff71e1d42583f2ddab98eafdcfd68f949318c480ceeff3cf83855890c7519","assets/archive-B4C_SSPw.js":"0192dbcd035fb865af6babf55546605fdbf26522584dc8732a732e95d636c78f","assets/firebase-CcgSLcIc.js":"8ff1f2a41c9833b94555b2939fefde224eb49b138e6efb0cd68fc86c39670b66","assets/index-BwdY0yEo.css":"7a630f898442d045df5756478888027cfee0e32b84189556f063be58c008fc71","assets/index-eGbNQyWw.js":"bcbb143ef06c551ef11acfc66e821aed50a059f521730da2c6cc71fc0e64b166","assets/model-Bs3aS8gd.js":"9c607646d2865ce9b976995c5d3eb17543bef999f5f217fde2704158a39de4f8","icon-192.png":"51097f46a520a099a3619c0cc30559396a4fb7540df84bd6ce9e88af0ae767a5","icon-512.png":"d3e6c36f171575a3bf0ce43776ddaef13fe526101075b8a5c90987690ef43af1","icon.svg":"3d827e315d6b27868145c495317e518f01ef808b72ae03547f9e09b522a7f64b","index.html":"1db21c0b3892713c4e0ef064e814176823e5b629585f8eb923fd194b9df1eda3","manifest.webmanifest":"49ca983d4c3f52be444bb2bd825b2be983804a57bb5992f55175c62f6a53d78e"};
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
