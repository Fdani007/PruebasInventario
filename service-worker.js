const CACHE_NAME = 'inventario-pwa-v1';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './src/main.js',
  './src/db/database.js',
  './src/db/repositories.js',
  './src/utils/helpers.js',
  './src/utils/backup.js',
  './src/pages/homePage.js',
  './src/pages/productsPage.js',
  './src/pages/productFormPage.js',
  './src/pages/settingsPage.js',
  './icons/icon.svg',
  './icons/icon-maskable.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) return response;
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
