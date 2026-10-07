const CACHE_NAME = 'dieta-ivan-v6';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/main.js',
  './js/db.js',
  './js/store.js',
  './js/seed-foods.js',
  './js/seed-recipes.js',
  './js/meal-category.js',
  './js/menu-planner.js',
  './js/nutrition.js',
  './js/views/profile-form.js',
  './js/food-lookup.js',
  './js/barcode-scanner.js',
  './js/shifts.js',
  './js/utils.js',
  './js/views/day.js',
  './js/views/week.js',
  './js/views/weight.js',
  './js/views/foods.js',
  './js/views/settings.js',
  './icons/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Solo cacheamos la propia app; las APIs externas (Open Food Facts, lector de códigos) van siempre a la red.
  if (new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
