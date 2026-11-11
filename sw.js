// Service worker de HEXCRYPT (generado por tools/build-site.sh): el juego funciona sin conexión.
// Los archivos llevan la versión en la URL, así que se sirven desde la caché; la página y version.json
// se piden primero a la red (para recibir versiones nuevas) y, sin conexión, se usa la copia guardada.
const VERSION = '050795d-202611111256';
const CACHE = 'hexcrypt-' + VERSION;
const FILES = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png", "css/style.css?v=050795d-202611111256", "js/util.js?v=050795d-202611111256", "js/font.js?v=050795d-202611111256", "js/art.js?v=050795d-202611111256", "js/assets.js?v=050795d-202611111256", "js/sprites.js?v=050795d-202611111256", "js/audio.js?v=050795d-202611111256", "js/world.js?v=050795d-202611111256", "js/dungeon.js?v=050795d-202611111256", "js/render.js?v=050795d-202611111256", "js/classes.js?v=050795d-202611111256", "js/skills.js?v=050795d-202611111256", "js/vfx.js?v=050795d-202611111256", "js/ambient.js?v=050795d-202611111256", "js/ui.js?v=050795d-202611111256", "js/controls.js?v=050795d-202611111256", "js/game.js?v=050795d-202611111256", "js/shop.js?v=050795d-202611111256", "js/items.js?v=050795d-202611111256", "js/elites.js?v=050795d-202611111256", "js/save.js?v=050795d-202611111256", "js/touch.js?v=050795d-202611111256", "js/gamepad.js?v=050795d-202611111256"];

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
