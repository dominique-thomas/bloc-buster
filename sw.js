const CACHE = "blocbuster-v1";
const ASSETS = [
  "/bloc-buster/",

  "/bloc-buster/index.html",
  "/bloc-buster/game.html",
  "/bloc-buster/gameover.html",

  "/bloc-buster/images/Bloc_Buster_Arcade_Overlay.png",
  "/bloc-buster/images/controls.png",

  "/bloc-buster/css/styles.css",

  "/bloc-buster/js/index.js",
  "/bloc-buster/js/game.js",
  "/bloc-buster/js/gameover.js",

  "/bloc-buster/icons/icon-16.png",
  "/bloc-buster/icons/icon-32.png",
  "/bloc-buster/icons/icon-180.png",  
  "/bloc-buster/icons/icon-192.png",  
  "/bloc-buster/icons/icon-512.png",  

  "/bloc-buster/sfx/clear.wav",
  "/bloc-buster/sfx/clear_2.wav",
  "/bloc-buster/sfx/gameOver.wav",
  "/bloc-buster/sfx/levelUp.wav",
  "/bloc-buster/sfx/theme.wav",

  "/bloc-buster/manifest.json"
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
