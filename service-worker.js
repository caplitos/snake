const CACHE_NAME = 'snake-game-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/game.js',
  '/api.js',
  '/country.js',
  '/manifest.json',
  '/icons/android/android-launchericon-48-48.png',
  '/icons/android/android-launchericon-72-72.png',
  '/icons/android/android-launchericon-96-96.png',
  '/icons/android/android-launchericon-144-144.png',
  '/icons/android/android-launchericon-192-192.png',
  '/icons/android/android-launchericon-512-512.png'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estrategia de caché mejorada: Stale-while-revalidate
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // Actualizar la caché solo para solicitudes exitosas
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Si la red falla, intentamos servir desde caché
          return cachedResponse;
        });

        // Devolver la respuesta en caché mientras se actualiza en segundo plano
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// Precarga de recursos cuando hay conexión
self.addEventListener('sync', event => {
  if (event.tag === 'precache-resources') {
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(urlsToCache);
      })
    );
  }
});