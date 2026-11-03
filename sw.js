// Service worker de CRYPTFALL (generado por tools/build-site.sh): el juego funciona sin conexión.
// Los archivos llevan la versión en la URL, así que se sirven desde la caché; la página y version.json
// se piden primero a la red (para recibir versiones nuevas) y, sin conexión, se usa la copia guardada.
const VERSION = 'd255c28-202611031847';
const CACHE = 'cryptfall-' + VERSION;
const FILES = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "css/style.css?v=d255c28-202611031847", "js/util.js?v=d255c28-202611031847", "js/font.js?v=d255c28-202611031847", "js/art.js?v=d255c28-202611031847", "js/assets.js?v=d255c28-202611031847", "js/sprites.js?v=d255c28-202611031847", "js/audio.js?v=d255c28-202611031847", "js/world.js?v=d255c28-202611031847", "js/dungeon.js?v=d255c28-202611031847", "js/render.js?v=d255c28-202611031847", "js/classes.js?v=d255c28-202611031847", "js/skills.js?v=d255c28-202611031847", "js/vfx.js?v=d255c28-202611031847", "js/ui.js?v=d255c28-202611031847", "js/controls.js?v=d255c28-202611031847", "js/game.js?v=d255c28-202611031847", "js/shop.js?v=d255c28-202611031847", "js/items.js?v=d255c28-202611031847", "js/save.js?v=d255c28-202611031847", "js/touch.js?v=d255c28-202611031847", "js/gamepad.js?v=d255c28-202611031847"];

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
