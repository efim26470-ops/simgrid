const CACHE = 'simgrid-v1.2.0';
const CORE = [
  './','./index.html','./styles.css','./data.js','./app.js','./manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin === location.origin) {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const clone = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, clone));
      return response;
    }).catch(() => caches.match('./index.html'))));
  } else if (event.request.destination === 'image') {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request, {mode:'no-cors'}).then(response => {
      const clone = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, clone));
      return response;
    })));
  }
});
