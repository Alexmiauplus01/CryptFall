// Service worker de CRYPTFALL (generado por tools/build-site.sh): el juego funciona sin conexión.
// Los archivos llevan la versión en la URL, así que se sirven desde la caché; la página y version.json
// se piden primero a la red (para recibir versiones nuevas) y, sin conexión, se usa la copia guardada.
const VERSION = 'a5173a1-202611040952';
const CACHE = 'cryptfall-' + VERSION;
const FILES = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "css/style.css?v=a5173a1-202611040952", "js/util.js?v=a5173a1-202611040952", "js/font.js?v=a5173a1-202611040952", "js/art.js?v=a5173a1-202611040952", "js/assets.js?v=a5173a1-202611040952", "js/sprites.js?v=a5173a1-202611040952", "js/audio.js?v=a5173a1-202611040952", "js/world.js?v=a5173a1-202611040952", "js/dungeon.js?v=a5173a1-202611040952", "js/render.js?v=a5173a1-202611040952", "js/classes.js?v=a5173a1-202611040952", "js/skills.js?v=a5173a1-202611040952", "js/vfx.js?v=a5173a1-202611040952", "js/ui.js?v=a5173a1-202611040952", "js/controls.js?v=a5173a1-202611040952", "js/game.js?v=a5173a1-202611040952", "js/shop.js?v=a5173a1-202611040952", "js/items.js?v=a5173a1-202611040952", "js/save.js?v=a5173a1-202611040952", "js/touch.js?v=a5173a1-202611040952", "js/gamepad.js?v=a5173a1-202611040952"];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('cryptfall-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const url = new URL(req.url), page = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html'), live = url.pathname.endsWith('version.json');
  if (page || live) { // primero la red; sin conexión, lo guardado
    e.respondWith(fetch(req).then(r => { if (page && r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put('./', cp)); } return r; })
      .catch(() => caches.match(page ? './' : req, { ignoreSearch: live })));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; })));
});
