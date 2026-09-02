'use strict';

function cacheScopeId() {
  const scope = self.registration && self.registration.scope ? self.registration.scope : new URL('./', self.location.origin + '/').href;
  const path = new URL(scope, self.location.origin).pathname || '/';
  return encodeURIComponent(path);
}
const CACHE_SCOPE_ID = cacheScopeId();
const CACHE_PREFIX = `code-dump-tool-pwa-${CACHE_SCOPE_ID}-`;
const CACHE_NAME = `${CACHE_PREFIX}20260823-v1-1-capacitor-01`;
const PRECACHE = [
  './index.html',
  './offline.html',
  './app.css',
  './app.js',
  './core.js',
  './platform.js',
  './archive-core.js',
  './archive-worker.js',
  './manifest.webmanifest',
  './vendor/jszip.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function scoped(path) {
  return new URL(path, self.registration.scope).href;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        if (fresh && fresh.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, fresh.clone()).catch(() => {});
        }
        return fresh;
      } catch (_) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(request)) || (await cache.match(scoped('./index.html'))) || (await cache.match(scoped('./offline.html')));
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) {
      event.waitUntil(fetch(request).then(async fresh => {
        if (fresh && fresh.ok) cache.put(request, fresh.clone());
      }).catch(() => {}));
      return cached;
    }
    try {
      const fresh = await fetch(request);
      if (fresh && fresh.ok) cache.put(request, fresh.clone());
      return fresh;
    } catch (_) {
      return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  })());
});
