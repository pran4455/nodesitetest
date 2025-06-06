const CACHE_NAME = 'v1';
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
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
