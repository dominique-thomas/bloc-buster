// sw.js
const CACHE = "blocbuster-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/game.html",
  "/gameover.html",
  "/images/Bloc_Buster_Arcade_Overlay.png",
  "/css/styles.css",
  "/js/index.js",
  "/js/game.js",
  "/js/gameover.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-180.png",  
  "/manifest.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  // Network-first for game pages, cache-first for static assets
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).catch(() => caches.match("/index.html"))
    );
  } else {
    e.respondWith(
      caches.match(req).then(res => res || fetch(req))
    );
  }
});
