/* Service Worker: オフラインでもアプリのように起動できるようにキャッシュする */
const CACHE = "fantasy-life-v14";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./audio.js",
  "./backgrounds.js",
  "./sprites.js",
  "./game.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
];

// インストール時にアプリ一式をキャッシュ
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

// 古いキャッシュを掃除
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// キャッシュ優先（オフライン対応）。無ければネットから取得しキャッシュへ。
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
