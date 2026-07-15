const CACHE = 'simgrid-v2.2.1';
const CORE = [
  './','./index.html','./styles.css?v=2.2.1','./data.js?v=2.2.1','./app.js?v=2.2.1','./manifest.webmanifest?v=2.2.1',
  './icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png',
  './assets/guides/spa.jpg','./assets/guides/monza.jpg','./assets/guides/silverstone.jpg','./assets/guides/suzuka.jpg',
  './assets/guides/cover-spa.jpg',
  './assets/guides/cover-monza.jpg',
  './assets/guides/cover-silverstone.jpg',
  './assets/guides/cover-suzuka.jpg',
  './assets/guides/cover-mountpanorama.jpg',
  './assets/guides/cover-zandvoort.jpg',
  './assets/guides/cover-imola.jpg',
  './assets/guides/cover-laguna.jpg',
  './assets/guides/cover-nurburgring.jpg',
  './assets/guides/cover-cota.jpg',
  './assets/guides/cover-interlagos.jpg',
  './assets/guides/cover-lemans.jpg',
  './assets/guides/cover-daytona.jpg',
  './assets/guides/cover-brands.jpg',
  './assets/guides/generated-bahrain.svg',
  './assets/guides/generated-barcelona.svg',
  './assets/guides/generated-brands.svg',
  './assets/guides/generated-cota.svg',
  './assets/guides/generated-daytona.svg',
  './assets/guides/generated-donington.svg',
  './assets/guides/generated-drift.svg',
  './assets/guides/generated-hungaroring.svg',
  './assets/guides/generated-imola.svg',
  './assets/guides/generated-interlagos.svg',
  './assets/guides/generated-jeddah.svg',
  './assets/guides/generated-laguna.svg',
  './assets/guides/generated-lemans.svg',
  './assets/guides/generated-misano.svg',
  './assets/guides/generated-monza.svg',
  './assets/guides/generated-mountpanorama.svg',
  './assets/guides/generated-nurburgring.svg',
  './assets/guides/generated-paulricard.svg',
  './assets/guides/generated-redbullring.svg',
  './assets/guides/generated-roadatlanta.svg',
  './assets/guides/generated-sebring.svg',
  './assets/guides/generated-silverstone.svg',
  './assets/guides/generated-spa.svg',
  './assets/guides/generated-suzuka.svg',
  './assets/guides/generated-watkins.svg',
  './assets/guides/generated-zandvoort.svg'
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
