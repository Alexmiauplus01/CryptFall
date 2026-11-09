// Service worker de CRYPTFALL (generado por tools/build-site.sh): el juego funciona sin conexión.
// Los archivos llevan la versión en la URL, así que se sirven desde la caché; la página y version.json
// se piden primero a la red (para recibir versiones nuevas) y, sin conexión, se usa la copia guardada.
const VERSION = '6ff0a74-202611090740';
const CACHE = 'cryptfall-' + VERSION;
const FILES = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "css/style.css?v=6ff0a74-202611090740", "js/util.js?v=6ff0a74-202611090740", "js/font.js?v=6ff0a74-202611090740", "js/art.js?v=6ff0a74-202611090740", "js/assets.js?v=6ff0a74-202611090740", "js/sprites.js?v=6ff0a74-202611090740", "js/audio.js?v=6ff0a74-202611090740", "js/world.js?v=6ff0a74-202611090740", "js/dungeon.js?v=6ff0a74-202611090740", "js/render.js?v=6ff0a74-202611090740", "js/classes.js?v=6ff0a74-202611090740", "js/skills.js?v=6ff0a74-202611090740", "js/vfx.js?v=6ff0a74-202611090740", "js/ambient.js?v=6ff0a74-202611090740", "js/ui.js?v=6ff0a74-202611090740", "js/controls.js?v=6ff0a74-202611090740", "js/game.js?v=6ff0a74-202611090740", "js/shop.js?v=6ff0a74-202611090740", "js/items.js?v=6ff0a74-202611090740", "js/elites.js?v=6ff0a74-202611090740", "js/save.js?v=6ff0a74-202611090740", "js/touch.js?v=6ff0a74-202611090740", "js/gamepad.js?v=6ff0a74-202611090740"];

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
