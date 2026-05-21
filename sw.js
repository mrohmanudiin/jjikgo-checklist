// ═══════════════════════════════════════════════════════════════════════════
// JJIKGO Daily Cleanliness Checker — Service Worker
// Cache-first strategy for offline support
// ═══════════════════════════════════════════════════════════════════════════

var CACHE_NAME = 'jjikgo-checklist-v1';
var FILES_TO_CACHE = [
  '/jjikgo_checklist.html',
  '/jjikgo_checklist.css',
  '/jjikgo_checklist.js',
  '/manifest.json',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js',
  'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js'
];

// Install: cache all core files
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[SW] Caching app shell');
      return cache.addAll(FILES_TO_CACHE).catch(function(err) {
        console.log('[SW] Cache addAll failed (some CDN may be unreachable):', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== CACHE_NAME) {
          console.log('[SW] Removing old cache:', key);
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request).then(function(response) {
      // Cache successful responses for next time
      var cloned = response.clone();
      caches.open(CACHE_NAME).then(function(cache) {
        cache.put(event.request, cloned);
      });
      return response;
    }).catch(function() {
      // Network failed, serve from cache
      return caches.match(event.request).then(function(cached) {
        return cached || new Response('Offline — data tidak tersedia.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      });
    })
  );
});
