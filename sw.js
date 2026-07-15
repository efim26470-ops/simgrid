const CACHE = 'simgrid-v2.3.1';
const CORE = [
  './','./index.html','./styles.css?v=2.3.1','./data.js?v=2.3.1','./app.js?v=2.3.1','./manifest.webmanifest?v=2.3.1',
  './icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png',
  './assets/guides/spa.webp','./assets/guides/monza.webp','./assets/guides/nurburgring.webp',
  './assets/guides/silverstone.webp','./assets/guides/suzuka.webp','./assets/guides/imola.webp',
  './assets/guides/laguna-seca.webp','./assets/guides/daytona.webp','./assets/guides/cota.webp',
  './assets/guides/zandvoort.webp','./assets/guides/mount-panorama.webp','./assets/guides/barcelona.webp'
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
    event.respondWith(fetch(event.request).then(response => {
      const clone = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, clone));
      return response;
    }).catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html'))));
  } else if (event.request.destination === 'image') {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request, {mode:'no-cors'}).then(response => {
      const clone = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, clone));
      return response;
    })));
  }
});
