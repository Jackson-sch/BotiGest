// BotiGest Service Worker - Offline Resilience & Fast POS Caching
const CACHE_NAME = 'botigest-cache-v1';

const STATIC_PRECACHE = [
  '/',
  '/pos',
  '/offline',
  '/icons/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
];

// Instalar y precachear recursos esenciales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_PRECACHE))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('[PWA] Fallo en precacheo inicial:', err))
  );
});

// Limpiar cachés antiguas al activar
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Estrategia de Fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Solo interceptar peticiones GET de protocolo http/https
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  const url = new URL(request.url);

  // No interceptar llamadas API internas o de autenticación para no congelar datos dinámicos
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 1. Peticiones de Navegación (Páginas HTML): Network-first con fallback a caché y página offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Si la respuesta es válida, clonar a caché
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          // Si falla la red, intentar desde caché
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si tampoco está en caché, servir la página offline
          const offlineFallback = await caches.match('/offline');
          if (offlineFallback) {
            return offlineFallback;
          }
          return new Response('Sin conexión', { status: 503, statusText: 'Offline' });
        })
    );
    return;
  }

  // 2. Recursos estáticos (_next/static, fonts, imágenes, iconos): Stale-while-revalidate
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
});

// Escuchar mensaje para forzar activación inmediata
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
