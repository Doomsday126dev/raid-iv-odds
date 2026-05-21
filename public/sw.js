const CACHE_NAME = "raid-iv-odds-shell-v8";
const scopePath = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const withScope = (path) => `${scopePath}${path}`;
const APP_SHELL = [
  withScope("/"),
  withScope("/index.html"),
  withScope("/manifest.json"),
  withScope("/manifest.webmanifest"),
  withScope("/register-sw.js"),
  withScope("/assets/icon.svg"),
  withScope("/assets/icon-192.png"),
  withScope("/assets/icon-512.png"),
  withScope("/assets/apple-touch-icon.png"),
  withScope("/privacy.html"),
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match(withScope("/index.html")))),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch((error) => {
        if (event.request.mode === "navigate") return caches.match(withScope("/index.html"));
        throw error;
      });
    }),
  );
});
