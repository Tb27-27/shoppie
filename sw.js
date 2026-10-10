const CACHE_NAME = 'shoppie-cache-v1';
const DYNAMIC_CACHE_NAME = 'shoppie-dynamic-v1';

// Static assets to cache immediately on install
const STATIC_URLS = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/stylesheet.css',
  './assets/js/app.js',
  './assets/js/store.js',
  './assets/js/api.js',
  './assets/js/catalog.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name !== DYNAMIC_CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Cache-first strategy for static assets, Network-first for API/images, 
// then cache the API images dynamically
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // If the request is for an Open Food Facts image or API
  if (requestUrl.hostname.includes('openfoodfacts.org')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          return caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(event.request.url, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
  } else {
    // For static app files, try cache first, then network
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
