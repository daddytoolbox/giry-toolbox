// Service worker: app shell in cache, dati sempre freschi quando c'è rete
const VERSIONE = "nido-v14";
const SHELL = ["./", "index.html", "styles.css", "app.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "qr.png", "contenuti.json", "eventi.json", "acquisti.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSIONE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSIONE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  // dati e pagine: prima la rete, poi la cache
  if (url.pathname.endsWith(".json") || e.request.mode === "navigate" || url.pathname.endsWith(".js") || url.pathname.endsWith(".css")) {
    e.respondWith(
      fetch(e.request).then(r => { const copia = r.clone(); caches.open(VERSIONE).then(c => c.put(e.request, copia)); return r; })
        .catch(() => caches.match(e.request, { ignoreSearch: true }))
    );
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
