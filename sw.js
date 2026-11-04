// ================= SW.JS: NEXUS TURBO SPEED CACHE & OFFICIAL PWA ENGINE =================
const CACHE_NAME = 'nexus-turbo-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/home.js',
  '/chat.js',
  '/post.js',
  '/profile.js',
  '/settings.js',
  '/dm.js',
  '/power.js',
  '/superchat.js',
  '/advance.js',
  '/pro.js',
  '/ultra.js',
  '/emojis.js',
  '/about.js',
  '/core.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Network-First with Instant Cache Fallback for 0.01s Load
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
