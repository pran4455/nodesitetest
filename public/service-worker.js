const CACHE_NAME = 'policy-predictor-v1';
const STATIC_CACHE = 'static-cache-v1';
const DYNAMIC_CACHE = 'dynamic-cache-v1';

const urlsToCache = [
  '/',
  '/login.html',
  '/chatexplain.html',
  '/policies.html',
  '/policy_choice.html',
  '/recommend.html',
  '/css/login.css',
  '/css/policy_choice.css',
  '/css/policy.css',
  '/css/recommend.css',
  '/css/styles.css',
  '/js/script.js',
  '/js/server.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.json',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then((res) => {
            return caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(event.request.url, res.clone());
                return res;
              });
          })
          .catch(() => {
            return caches.match('/offline.html');
          });
      })
  );
});
