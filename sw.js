// ══════════════════════════════════════════════════════════════
//  MOVIFIT — Service Worker v1.1
// ══════════════════════════════════════════════════════════════

var CACHE_NAME = 'movifit-v2.8';
var ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json'
];

// Install — cacheia assets
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — limpa caches antigos
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — Firebase sempre vai pela rede, resto tenta cache primeiro
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Firebase, Google APIs e Auth sempre pela rede
  if (url.indexOf('googleapis.com') > -1 ||
      url.indexOf('firebaseapp.com') > -1 ||
      url.indexOf('firebase') > -1 ||
      url.indexOf('gstatic.com') > -1 ||
      url.indexOf('google.com') > -1 ||
      url.indexOf('cdnjs.cloudflare.com') > -1 ||
      url.indexOf('fonts.googleapis.com') > -1) {
    e.respondWith(fetch(e.request).catch(function() {
      return caches.match(e.request);
    }));
    return;
  }

  // Demais: cache first, fallback rede
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      });
    }).catch(function() {
      if (e.request.destination === 'document') {
        return caches.match('./index.html');
      }
    })
  );
});
