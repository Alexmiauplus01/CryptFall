// Service worker de HEXCRYPT (generado por tools/build-site.sh): el juego funciona sin conexión.
// Los archivos llevan la versión en la URL, así que se sirven desde la caché; la página y version.json
// se piden primero a la red (para recibir versiones nuevas) y, sin conexión, se usa la copia guardada.
const VERSION = 'cd4df72-202611131328';
const CACHE = 'hexcrypt-' + VERSION;
const FILES = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png", "css/style.css?v=cd4df72-202611131328", "js/util.js?v=cd4df72-202611131328", "js/font.js?v=cd4df72-202611131328", "js/art.js?v=cd4df72-202611131328", "js/assets.js?v=cd4df72-202611131328", "js/sprites.js?v=cd4df72-202611131328", "js/audio.js?v=cd4df72-202611131328", "js/world.js?v=cd4df72-202611131328", "js/dungeon.js?v=cd4df72-202611131328", "js/render.js?v=cd4df72-202611131328", "js/classes.js?v=cd4df72-202611131328", "js/skills.js?v=cd4df72-202611131328", "js/vfx.js?v=cd4df72-202611131328", "js/ambient.js?v=cd4df72-202611131328", "js/ui.js?v=cd4df72-202611131328", "js/controls.js?v=cd4df72-202611131328", "js/enemies.js?v=cd4df72-202611131328", "js/game.js?v=cd4df72-202611131328", "js/shop.js?v=cd4df72-202611131328", "js/items.js?v=cd4df72-202611131328", "js/elites.js?v=cd4df72-202611131328", "js/save.js?v=cd4df72-202611131328", "js/touch.js?v=cd4df72-202611131328", "js/gamepad.js?v=cd4df72-202611131328"];

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
