const CACHE_NAME = "tutor-cache-v4";
const API_CACHE_NAME = "tutor-api-cache-v3";
const LESSON_CACHE_NAME = "tutor-lessons-cache-v2";
const SYNC_QUEUE_NAME = "tutor-sync-queue";

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

// ─── Offline sync queue for POST/PUT requests ───
const DB_NAME = "tutor-offline-db";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("sync-queue")) {
        db.createObjectStore("sync-queue", { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function queueRequest(url, method, body, headers) {
  const db = await openDB();
  const tx = db.transaction("sync-queue", "readwrite");
  tx.objectStore("sync-queue").add({
    url,
    method,
    body,
    headers: Object.fromEntries(headers.entries()),
    timestamp: Date.now(),
  });
  return new Promise((resolve) => { tx.oncomplete = resolve; });
}

async function replayQueue() {
  const db = await openDB();
  const tx = db.transaction("sync-queue", "readonly");
  const store = tx.objectStore("sync-queue");
  const items = await new Promise((resolve) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
  });

  for (const item of items) {
    try {
      await fetch(item.url, {
        method: item.method,
        body: item.body,
        headers: item.headers,
      });
      // Remove from queue on success
      const deleteTx = db.transaction("sync-queue", "readwrite");
      deleteTx.objectStore("sync-queue").delete(item.id);
    } catch {
      // Still offline, stop trying
      break;
    }
  }
}

self.addEventListener("fetch", (event) => {
  // Queue failed POST/PUT for offline sync
  if (event.request.method === "POST" || event.request.method === "PUT") {
    const url = event.request.url;
    // Only queue quiz/session submissions
    if (url.includes("/api/") && (url.includes("/session/") || url.includes("/exam/"))) {
      event.respondWith(
        fetch(event.request.clone()).catch(async () => {
          const body = await event.request.text();
          await queueRequest(url, event.request.method, body, event.request.headers);
          return new Response(JSON.stringify({ queued: true, offline: true }), {
            status: 202,
            headers: { "Content-Type": "application/json" },
          });
        })
      );
      return;
    }
  }

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

// Listen for messages from the app
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

  if (event.data?.type === "REPLAY_QUEUE") {
    replayQueue();
  }
});

// Replay queued requests when back online
self.addEventListener("online", () => {
  replayQueue();
});
