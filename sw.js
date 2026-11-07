// Service worker de CRYPTFALL (generado por tools/build-site.sh): el juego funciona sin conexión.
// Los archivos llevan la versión en la URL, así que se sirven desde la caché; la página y version.json
// se piden primero a la red (para recibir versiones nuevas) y, sin conexión, se usa la copia guardada.
const VERSION = 'dd7fe4f-202611072228';
const CACHE = 'cryptfall-' + VERSION;
const FILES = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "css/style.css?v=dd7fe4f-202611072228", "js/util.js?v=dd7fe4f-202611072228", "js/font.js?v=dd7fe4f-202611072228", "js/art.js?v=dd7fe4f-202611072228", "js/assets.js?v=dd7fe4f-202611072228", "js/sprites.js?v=dd7fe4f-202611072228", "js/audio.js?v=dd7fe4f-202611072228", "js/world.js?v=dd7fe4f-202611072228", "js/dungeon.js?v=dd7fe4f-202611072228", "js/render.js?v=dd7fe4f-202611072228", "js/classes.js?v=dd7fe4f-202611072228", "js/skills.js?v=dd7fe4f-202611072228", "js/vfx.js?v=dd7fe4f-202611072228", "js/ambient.js?v=dd7fe4f-202611072228", "js/ui.js?v=dd7fe4f-202611072228", "js/controls.js?v=dd7fe4f-202611072228", "js/game.js?v=dd7fe4f-202611072228", "js/shop.js?v=dd7fe4f-202611072228", "js/items.js?v=dd7fe4f-202611072228", "js/elites.js?v=dd7fe4f-202611072228", "js/save.js?v=dd7fe4f-202611072228", "js/touch.js?v=dd7fe4f-202611072228", "js/gamepad.js?v=dd7fe4f-202611072228"];

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
