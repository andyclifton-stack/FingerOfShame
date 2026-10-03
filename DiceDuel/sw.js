const PREFIX=`dice-duel:${self.registration.scope}:`;
const CACHE=PREFIX+'ce76c556d08dcff1';
const FILES=["assets/ai.worker-BPtfSfnr.js","assets/web-0m2NW_B9.js","assets/web-B1pbvxcM.js","assets/web-BSWHkZX0.css","assets/web-BYQuO4OE.js","assets/web-X2Hb_ZKM.js","audio/bump-0.wav","audio/bump-1.wav","audio/bump-2.wav","audio/computer-win-0.wav","audio/move-0.wav","audio/move-1.wav","audio/move-2.wav","audio/roll-0.ogg","audio/roll-1.ogg","audio/roll-2.ogg","audio/round-win-0.wav","audio/select-0.wav","audio/select-1.wav","audio/select-2.wav","audio/win-0.wav","fonts/dm-sans-LICENSE.txt","fonts/dm-sans-latin-400-normal.woff2","fonts/dm-sans-latin-600-normal.woff2","fonts/fraunces-LICENSE.txt","fonts/fraunces-latin-400-normal.woff2","icon.svg","index.html","licenses/AUDIO.txt","licenses/KENNEY-CASINO-AUDIO.txt","licenses/capacitor-android.txt","licenses/capacitor-app.txt","licenses/capacitor-core.txt","licenses/capacitor-haptics.txt","licenses/capacitor-preferences.txt","licenses/vite.txt","manifest.webmanifest","pwa-icon-192.png","pwa-icon-512.png","unavailable.html"];
const urls=new Set(FILES.map(file=>new URL(file,self.registration.scope).href));
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(file=>new Request(new URL(file,self.registration.scope),{cache:'reload'})))));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const previous=(await caches.keys()).filter(name=>name.startsWith(PREFIX)&&name!==CACHE);
    // Keep one previous release for other open tabs; never touch another app's cache.
    await Promise.all(previous.slice(0,-1).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING') void self.skipWaiting();});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET' || url.origin!==self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  if(event.request.mode==='navigate' && ['','index.html','web.html'].includes(url.pathname.slice(new URL(self.registration.scope).pathname.length))) {
    event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(new URL('index.html',self.registration.scope)))||fetch(event.request))); return;
  }
  url.search='';
  if(urls.has(url.href)) {
    event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(url.href))||fetch(event.request)));
  } else if(url.pathname.startsWith(new URL('assets/',self.registration.scope).pathname)) {
    event.respondWith((async()=>{
      for(const name of (await caches.keys()).filter(name=>name.startsWith(PREFIX))) {
        const hit=await (await caches.open(name)).match(url.href);if(hit) return hit;
      }
      return fetch(event.request);
    })());
  }
});
