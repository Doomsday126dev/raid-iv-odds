// Build replaces these two values with a content-derived version and complete asset list.
const CACHE_NAME = "raid-iv-odds-shell-__BUILD_ID__";
const scopePath = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const withScope = (path) => `${scopePath}${path}`;
const APP_SHELL = __BUILD_FILES__.map(withScope);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("raid-iv-odds-shell-") && key !== CACHE_NAME,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (
    url.origin !== self.location.origin ||
    !url.pathname.startsWith(`${scopePath}/`)
  )
    return;
  if (event.request.mode === "navigate") {
    const cachedNavigation = async () => {
      const cache = await caches.open(CACHE_NAME);
      return (
        (await cache.match(url.pathname)) ||
        (await cache.match(withScope("/index.html")))
      );
    };
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          // HTTP failures do not reject fetch. Keep an installed shell usable
          // during a transient server outage, while preserving real 4xx responses.
          return response.status >= 500
            ? (await cachedNavigation()) || response
            : response;
        })
        .catch(cachedNavigation),
    );
    return;
  }
  // Only pre-cached build resources are served offline. Never cache error pages or
  // arbitrary query URLs, and never mutate other apps' caches on the same origin.
  event.respondWith(
    caches
      .open(CACHE_NAME)
      .then(
        async (cache) =>
          (await cache.match(event.request)) || fetch(event.request),
      ),
  );
});
