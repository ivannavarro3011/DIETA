// Mantener sincronizado con APP_VERSION de js/utils.js.
const CACHE_NAME = 'dieta-ivan-v7';
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

// Con conexión lenta, pasado este tiempo se sirve la copia guardada (la red sigue actualizándola).
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // cache: 'reload' evita que el navegador rellene la caché nueva con archivos viejos de su caché HTTP.
      .then((cache) => cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Primero la red (siempre la última versión si hay internet); sin conexión, la copia guardada.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Solo la propia app; las APIs externas (Open Food Facts, lector de códigos) van directas a la red.
  if (new URL(event.request.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    const network = fetch(event.request.url, { cache: 'no-cache' }).then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      }
      return response;
    });
    network.catch(() => {});
    const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS, null));

    try {
      const response = await Promise.race([network, timeout]);
      if (response) return response;
    } catch {
      // Sin conexión: seguimos con la copia guardada.
    }
    const cached = (await caches.match(event.request))
      || (event.request.mode === 'navigate' ? await caches.match('./index.html') : undefined);
    return cached || network;
  })());
});
