const CACHE_VERSION = 'skms-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;

const STATIC_ASSETS = [
    '/build/assets/',
];

const API_CACHE_PATTERNS = [
    /^\/api\/projects(\/|$)/,
    /^\/api\/library(\/|$)/,
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return cache.addAll([
                '/',
                '/offline.html',
            ]).catch(() => {
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

function isApiGetRequest(url, method) {
    if (method !== 'GET') return false;
    return API_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

function isStaticAsset(url) {
    return url.pathname.startsWith('/build/assets/');
}

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    const method = request.method;

    if (url.origin !== self.location.origin) {
        return;
    }

    if (method !== 'GET') {
        return;
    }

    if (isApiGetRequest(url, method)) {
        event.respondWith(
            caches.open(API_CACHE).then((cache) => {
                return cache.match(request).then((cachedResponse) => {
                    const fetchPromise = fetch(request).then((networkResponse) => {
                        if (networkResponse.ok) {
                            cache.put(request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => {
                        return cachedResponse;
                    });
                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }

    if (isStaticAsset(url)) {
        event.respondWith(
            caches.open(STATIC_CACHE).then((cache) => {
                return cache.match(request).then((cachedResponse) => {
                    const fetchPromise = fetch(request).then((networkResponse) => {
                        if (networkResponse.ok) {
                            cache.put(request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => {
                        return cachedResponse;
                    });
                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }
});
