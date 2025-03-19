const CACHE_NAME = 'snake-game-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './game.js',
    './api.js',
    './country.js',
    './service-worker.js',
    './manifest.json',
    './icons/android/android-launchericon-512-512.png',
    './icons/android/android-launchericon-192-192.png',
    './icons/android/android-launchericon-144-144.png',
    './icons/android/android-launchericon-96-96.png',
    './icons/android/android-launchericon-72-72.png',
    './icons/android/android-launchericon-48-48.png',
    './audio/crash.mp3',
    './audio/eat.mp3',
    './audio/gameOver.mp3',
    './audio/levelup.mp3',
    './audio/powerup.mp3'
];

// Instalación del service worker
self.addEventListener('install', (event) => {
    console.log('Service worker instalado');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache abierto');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch(error => {
                console.error('Error durante la instalación del cache:', error);
            })
    );
});

// Activación del service worker
self.addEventListener('activate', (event) => {
    console.log('Service worker activado');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Interceptar solicitudes de red
self.addEventListener('fetch', (event) => {
    console.log('Fetch interceptado para:', event.request.url);
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Devolver respuesta del cache si existe
                if (cachedResponse) {
                    console.log('Recurso encontrado en cache:', event.request.url);
                    return cachedResponse;
                }
                
                // De lo contrario, buscar en la red
                console.log('Recurso no encontrado en cache, buscando en red:', event.request.url);
                return fetch(event.request)
                    .then(response => {
                        // Verificar si la respuesta es válida
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            console.log('No se almacena en cache, respuesta no válida o de terceros');
                            return response;
                        }
                        
                        // Clonar la respuesta porque se consumirá dos veces
                        const responseToCache = response.clone();
                        
                        // Almacenar en cache
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                console.log('Almacenando nuevo recurso en cache:', event.request.url);
                                cache.put(event.request, responseToCache);
                            });
                            
                        return response;
                    })
                    .catch(error => {
                        console.error('Error en fetch:', error);
                        // Podemos ofrecer una página de fallback para solicitudes de documentos
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                        
                        // De lo contrario, propagar el error
                        throw error;
                    });
            })
    );
});