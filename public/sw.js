const CACHE_NAME = "tutor-cache-v2";
const API_CACHE_NAME = "tutor-api-cache-v1";

const PRECACHE_URLS = ["/", "/offline"];

// API routes to cache for offline use
const CACHEABLE_API_PATTERNS = [
  /\/api\/student\/dashboard/,
  /\/api\/student\/domains/,
  /\/api\/student\/lessons/,
  /\/api\/student\/assessment\?/,
  /\/api\/[^/]+\/progress/,
  /\/api\/[^/]+\/achievements/,
  /\/api\/[^/]+\/streak/,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== API_CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function isCacheableApi(url) {
  return CACHEABLE_API_PATTERNS.some((pattern) => pattern.test(url));
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = event.request.url;

  // API requests: network-first with cache fallback
  if (url.includes("/api/")) {
    if (!isCacheableApi(url)) return;

    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => cached || caches.match("/offline"));

      return cached || fetchPromise;
    })
  );
});
