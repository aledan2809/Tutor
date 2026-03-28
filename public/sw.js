const CACHE_NAME = "tutor-cache-v3";
const API_CACHE_NAME = "tutor-api-cache-v2";
const LESSON_CACHE_NAME = "tutor-lessons-cache-v1";

const PRECACHE_URLS = ["/", "/offline"];

// API routes to cache for offline use
const CACHEABLE_API_PATTERNS = [
  /\/api\/student\/dashboard/,
  /\/api\/student\/domains/,
  /\/api\/student\/lessons/,
  /\/api\/student\/assessment\?/,
  /\/api\/student\/progress/,
  /\/api\/[^/]+\/progress/,
  /\/api\/[^/]+\/achievements/,
  /\/api\/[^/]+\/streak/,
  /\/api\/[^/]+\/xp/,
  /\/api\/[^/]+\/session\/next/,
  /\/api\/[^/]+\/exam\/history/,
];

// Patterns for lesson/question content that should be cached more aggressively
const LESSON_CONTENT_PATTERNS = [
  /\/api\/student\/lessons\/[^?]+$/,  // Individual lesson detail
  /\/api\/[^/]+\/daily-challenge/,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const currentCaches = [CACHE_NAME, API_CACHE_NAME, LESSON_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !currentCaches.includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function isCacheableApi(url) {
  return CACHEABLE_API_PATTERNS.some((pattern) => pattern.test(url));
}

function isLessonContent(url) {
  return LESSON_CONTENT_PATTERNS.some((pattern) => pattern.test(url));
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = event.request.url;

  // API requests
  if (url.includes("/api/")) {
    // Lesson content: cache-first with network update (for offline reading)
    if (isLessonContent(url)) {
      event.respondWith(
        caches.open(LESSON_CACHE_NAME).then((cache) =>
          cache.match(event.request).then((cached) => {
            const fetchPromise = fetch(event.request)
              .then((response) => {
                if (response.ok) {
                  cache.put(event.request, response.clone());
                }
                return response;
              })
              .catch(() => cached);

            return cached || fetchPromise;
          })
        )
      );
      return;
    }

    // Other cacheable APIs: network-first with cache fallback
    if (isCacheableApi(url)) {
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

    // Non-cacheable API: pass through
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

// Listen for messages from the app to pre-cache lesson content
self.addEventListener("message", (event) => {
  if (event.data?.type === "CACHE_LESSONS") {
    const urls = event.data.urls || [];
    caches.open(LESSON_CACHE_NAME).then((cache) => {
      urls.forEach((url) => {
        fetch(url)
          .then((response) => {
            if (response.ok) {
              cache.put(url, response);
            }
          })
          .catch(() => {});
      });
    });
  }
});
