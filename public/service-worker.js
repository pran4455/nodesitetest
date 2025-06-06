const CACHE_NAME = 'policy-predictor-v1';
const STATIC_CACHE = 'static-cache-v1';
const DYNAMIC_CACHE = 'dynamic-cache-v1';

const urlsToCache = [
  './',
  './login.html',
  './chatexplain.html',
  './policies.html',
  './policy_choice.html',
  './recommend.html',
  './offline.html',
  './css/login.css',
  './css/policy_choice.css',
  './css/policy.css',
  './css/recommend.css',
  './css/styles.css',
  './css/install-prompt.css',
  './js/script.js',
  './js/server.js',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Ensure new service worker activates immediately
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE))
          .map(cacheName => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim()) // Take control of all pages immediately
  );
});

// Fetch event - handle offline functionality
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Return cached version
        }

        return fetch(event.request)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response as it can only be consumed once
            const responseToCache = response.clone();

            // Add to dynamic cache
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // If fetch fails, return the offline page for navigate requests
            if (event.request.mode === 'navigate') {
              return caches.match('./offline.html');
            }
          });
      })
  );
});
