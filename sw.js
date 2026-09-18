// Service Worker для PWA ZOMBIESHOOT
const CACHE_NAME = 'zombieshoot-v12';
const URLS_TO_CACHE = [
  '/browser-shooter/',
  '/browser-shooter/index.html',
  '/browser-shooter/style.css',
  '/browser-shooter/game.js',
  '/browser-shooter/skull.png',
  '/browser-shooter/manifest.json'
];

// Установка — кешируем всё
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(URLS_TO_CACHE).catch(err => console.log('Cache error:', err)))
  );
  self.skipWaiting();
});

// Активация — чистим старые версии кеша
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — отдаём из кеша, если нет — из сети
self.addEventListener('fetch', (event) => {
  // Пропускаем non-GET запросы
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;

      return fetch(event.request).then((networkResponse) => {
        // Кешируем новые запросы к тому же домену
        if (networkResponse && networkResponse.status === 200 &&
            networkResponse.type === 'basic' &&
            event.request.url.startsWith(self.location.origin)) {
          const respClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
        }
        return networkResponse;
      }).catch(() => {
        // Если сети нет и запрос — страница, отдаём главную
        if (event.request.mode === 'navigate') {
          return caches.match('/browser-shooter/');
        }
      });
    })
  );
});
