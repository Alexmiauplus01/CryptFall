// Service worker de HEXCRYPT (generado por tools/build-site.sh): el juego funciona sin conexión.
// Los archivos llevan la versión en la URL, así que se sirven desde la caché; la página y version.json
// se piden primero a la red (para recibir versiones nuevas) y, sin conexión, se usa la copia guardada.
const VERSION = 'dc9abe4-202611091041';
const CACHE = 'hexcrypt-' + VERSION;
const FILES = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "css/style.css?v=dc9abe4-202611091041", "js/util.js?v=dc9abe4-202611091041", "js/font.js?v=dc9abe4-202611091041", "js/art.js?v=dc9abe4-202611091041", "js/assets.js?v=dc9abe4-202611091041", "js/sprites.js?v=dc9abe4-202611091041", "js/audio.js?v=dc9abe4-202611091041", "js/world.js?v=dc9abe4-202611091041", "js/dungeon.js?v=dc9abe4-202611091041", "js/render.js?v=dc9abe4-202611091041", "js/classes.js?v=dc9abe4-202611091041", "js/skills.js?v=dc9abe4-202611091041", "js/vfx.js?v=dc9abe4-202611091041", "js/ambient.js?v=dc9abe4-202611091041", "js/ui.js?v=dc9abe4-202611091041", "js/controls.js?v=dc9abe4-202611091041", "js/game.js?v=dc9abe4-202611091041", "js/shop.js?v=dc9abe4-202611091041", "js/items.js?v=dc9abe4-202611091041", "js/elites.js?v=dc9abe4-202611091041", "js/save.js?v=dc9abe4-202611091041", "js/touch.js?v=dc9abe4-202611091041", "js/gamepad.js?v=dc9abe4-202611091041"];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => (k.startsWith('hexcrypt-') || k.startsWith('cryptfall-')) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
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
