// sw.js - Zero-Stale Instant Update Service Worker
const CACHE_NAME = "nexus-live-v" + Date.now();

self.addEventListener("install", (event) => {
  // Naya update aate hi bina wait kiye turant active karo
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Purana saara kachra (cache) turant साफ karo
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Hamesha Mumbai CDN / Network se sabse taza file lao (No stale cache)
  event.respondWith(
    fetch(event.request, { cache: "no-store" }).catch(() => caches.match(event.request))
  );
});
