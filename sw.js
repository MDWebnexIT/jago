/* Service Worker for Jago Corporation PLC Android PWA Offline Caching */

const CACHE_NAME = 'jago-sales-v14-20260908-universalpublic';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/styles.css',
  './css/mobile.css',
  './js/storage.js',
  './js/customers.js',
  './js/items.js',
  './js/daybook.js',
  './js/conveyance.js',
  './js/reports.js',
  './js/ledger.js',
  './js/master_input.js',
  './js/invoices.js',
  './js/pwa.js',
  './js/app.js',
  './manifest.json'
];

// Install Event - Pre-cache core app assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network-First Strategy to ensure code freshness when online
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});
