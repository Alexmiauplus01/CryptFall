// Controles táctiles para móvil (en horizontal):
//  · mitad izquierda: joystick que aparece donde pones el dedo (moverse y caminar de lado)
//  · mitad derecha: desliza para girar la cámara
//  · botones: ATACAR (toque o mantener; arrastrando el dedo también gira la cámara), ESQUIVAR, habilidades R/C/V con su recarga, ESCUDO (si lo llevas)
//  · arriba: pausa, diario, inventario y cambiar de arma
//  · en los menús, tocar es hacer clic
const TOUCH = { roles: new Map(), full: false };
const STICK_R = 26, LOOK_K = 0.015;

// botones visibles en partida (coordenadas del lienzo 480x270)
function touchButtons() {
  const p = G.p, cl = CLASSES[p.cls], out = [];
  out.push({ id: 'attack', x: VW - 46, y: VH - 52, r: 25, label: 'ATACAR', hold: true });
  out.push({ id: 'dash', x: VW - 104, y: VH - 24, r: 15, label: '>>' });
  cl.skills.forEach((sk, i) => {
    const pos = [[VW - 100, VH - 68], [VW - 84, VH - 107], [VW - 44, VH - 120]][i];
    out.push({ id: 'skill' + i, i, x: pos[0], y: pos[1], r: 14, label: SKILL_LABEL[i] });
  });
  if (offhandOf(p) === 'shield') out.push({ id: 'block', x: VW - 144, y: VH - 22, r: 14, label: 'ESC', hold: true });
  const top = [['pause', 'II'], ['journal', 'J'], ['inventory', 'I']];
  if (cl.slots.length > 1) top.push(['weapon', '<>']);
  if (G.inv && G.inv.potion) top.push(['potion', '+' + G.inv.potion]);
  top.forEach(([id, label], k) => out.push({ id, rect: true, x: VW - 96 - k * 22, y: 6, w: 19, h: 15, label }));
  return out;
}
function hitButton(b, c) {
  if (b.rect) return c.x >= b.x - 2 && c.y >= b.y - 2 && c.x < b.x + b.w + 2 && c.y < b.y + b.h + 2;
  return Math.hypot(c.x - b.x, c.y - b.y) <= b.r + 5;
}
function pressButton(b) {
  const p = G.p;
  switch (b.id) {
    case 'attack': { // un toque ataca una vez al momento; si se mantiene, sigue atacando
      mouse.fire = true;
      const blocking = p.wantBlock && p.off === 'shield' && WEAPONS[p.weapon].hands === 1;
      if (p.shootCd <= 0 && !blocking) playerAttack();
      break;
    }
    case 'dash': tryDash(); break;
    case 'block': p.wantBlock = true; break;
    case 'pause': pauseGame(); break;
    case 'journal': openJournal(); break;
    case 'inventory': openInventory(); break;
    case 'potion': drinkPotion(); break;
    case 'weapon': { const n = CLASSES[p.cls].slots.length; equipSlot((p.slot + 1) % n); break; }
    default: if (b.i !== undefined) useSkill(b.i);
  }
}
function releaseButton(b) {
  if (b.id === 'attack') mouse.fire = false;
  if (b.id === 'block' && G.p) G.p.wantBlock = false;
}
function releaseAllTouches() {
  for (const r of TOUCH.roles.values()) if (r.kind === 'btn') releaseButton(r.b);
  TOUCH.roles.clear(); G.stick = null;
}

function touchPoint(t) {
  const r = canvas.getBoundingClientRect();
  return { x: (t.clientX - r.left) / r.width * VW, y: (t.clientY - r.top) / r.height * VH };
}
// pantalla completa y horizontal al primer toque (donde el navegador lo permite)
function goFullscreen() {
  if (TOUCH.full) return;
  TOUCH.full = true;
  const el = document.documentElement, req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!req) return;
  try {
    const pr = req.call(el, { navigationUI: 'hide' });
    const lock = () => { try { const o = screen.orientation; if (o && o.lock) o.lock('landscape').catch(() => {}); } catch (e) { /* sin bloqueo */ } };
    if (pr && pr.then) pr.then(lock).catch(() => {}); else lock();
  } catch (e) { /* sin pantalla completa */ }
}

// botón de pantalla completa: entra y sale a voluntad (oculto donde el navegador no lo permite)
(function fullscreenButton() {
  const btn = document.getElementById('fs'); if (!btn) return;
  const el = document.documentElement, req = el.requestFullscreen || el.webkitRequestFullscreen, exit = document.exitFullscreen || document.webkitExitFullscreen;
  if (!req) { btn.hidden = true; return; }
  const isFull = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  const ENTER = 'M1 1h5v2H3v3H1zM10 1h5v5h-2V3h-3zM1 10h2v3h3v2H1zM13 10h2v5h-5v-2h3z', LEAVE = 'M4 1h2v5H1V4h3zM10 1h2v3h3v2h-5zM1 10h5v5H4v-3H1zM10 10h5v2h-3v3h-2z';
  const sync = () => { document.getElementById('fs-ico').setAttribute('d', isFull() ? LEAVE : ENTER); btn.title = isFull() ? 'Salir de pantalla completa' : 'Pantalla completa'; };
  const toggle = (e) => {
    e.preventDefault(); e.stopPropagation();
    TOUCH.full = true; // ya no hace falta el intento automático del primer toque
    if (isFull()) { try { exit.call(document); } catch (err) { /* nada */ } return; }
    try {
      const pr = req.call(el, { navigationUI: 'hide' });
      const lock = () => { try { const o = screen.orientation; if (G.touchMode && o && o.lock) o.lock('landscape').catch(() => {}); } catch (err) { /* nada */ } };
      if (pr && pr.then) pr.then(lock).catch(() => {}); else lock();
    } catch (err) { /* sin pantalla completa */ }
  };
  btn.addEventListener('click', toggle);
  btn.addEventListener('touchend', toggle, { passive: false });
  btn.addEventListener('mousedown', (e) => e.stopPropagation());
  document.addEventListener('fullscreenchange', sync); document.addEventListener('webkitfullscreenchange', sync);
  sync();
})();

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  G.touchMode = true;
  for (const t of e.changedTouches) {
    const c = touchPoint(t);
    if (G.state !== 'play') { handleClick(Math.floor(c.x), Math.floor(c.y), 0); continue; }
    const b = touchButtons().find(b => hitButton(b, c));
    // tocar el minimapa abre el mapa completo
    if (!b && c.x >= BOX_MAP.x && c.y >= BOX_MAP.y && c.x < BOX_MAP.x + BOX_MAP.w && c.y < BOX_MAP.y + BOX_MAP.h) { openMap(); continue; }
    if (b) { TOUCH.roles.set(t.identifier, { kind: 'btn', b, lx: c.x }); pressButton(b); continue; }
    if (c.x < VW * 0.45 && !G.stick) {
      TOUCH.roles.set(t.identifier, { kind: 'stick' });
      G.stick = { f: 0, s: 0, bx: c.x, by: c.y, x: c.x, y: c.y };
    } else TOUCH.roles.set(t.identifier, { kind: 'look', lx: c.x });
  }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    const r = TOUCH.roles.get(t.identifier); if (!r) continue;
    const c = touchPoint(t);
    if (r.kind === 'stick' && G.stick) {
      const st = G.stick;
      let dx = c.x - st.bx, dy = c.y - st.by;
      const len = Math.hypot(dx, dy);
      if (len > STICK_R) { // la base sigue al dedo si se aleja demasiado
        st.bx += dx * (1 - STICK_R / len); st.by += dy * (1 - STICK_R / len);
        dx = c.x - st.bx; dy = c.y - st.by;
      }
      st.x = c.x; st.y = c.y;
      const dead = 0.18; // zona muerta
      st.s = Math.abs(dx / STICK_R) < dead ? 0 : dx / STICK_R;
      st.f = Math.abs(dy / STICK_R) < dead ? 0 : -dy / STICK_R;
    } else if ((r.kind === 'look' || (r.kind === 'btn' && r.b.id === 'attack')) && G.state === 'play') {
      // el botón de atacar también gira la cámara al arrastrar el dedo (atacar y apuntar a la vez)
      G.p.a += (c.x - r.lx) * LOOK_K * (G.cfg ? G.cfg.sens : 1);
      r.lx = c.x;
    }
  }
}, { passive: false });

function touchEnd(e) {
  e.preventDefault();
  goFullscreen();
  for (const t of e.changedTouches) {
    const r = TOUCH.roles.get(t.identifier); if (!r) continue;
    if (r.kind === 'btn') releaseButton(r.b);
    if (r.kind === 'stick') G.stick = null;
    TOUCH.roles.delete(t.identifier);
  }
}
canvas.addEventListener('touchend', touchEnd, { passive: false });
canvas.addEventListener('touchcancel', touchEnd, { passive: false });

// si sale el aviso de girar el móvil o cambia la partida de estado, se sueltan los controles
window.addEventListener('resize', () => {
  if (G.touchMode && innerHeight > innerWidth && G.state === 'play') { releaseAllTouches(); pauseGame(); }
});
G.touchMode = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
// algunos navegadores envían eventos de puntero antes que los táctiles: también activan el modo táctil
canvas.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') G.touchMode = true; });

// ---------------------------------------------------------------- dibujo (encima del HUD)
function tBlend(u, x, y, col, a) {
  x |= 0; y |= 0; if (x < 0 || y < 0 || x >= VW || y >= VH) return;
  const o = y * VW + x, c = u.buf[o];
  u.buf[o] = rgb(lerp(c & 255, col[0], a), lerp((c >> 8) & 255, col[1], a), lerp((c >> 16) & 255, col[2], a));
}
function tCircle(u, cx, cy, r, fill, fa, ring, ra, prog) {
  for (let y = -r - 1; y <= r + 1; y++) for (let x = -r - 1; x <= r + 1; x++) {
    const d = Math.hypot(x, y);
    if (d <= r - 1.5) tBlend(u, cx + x, cy + y, fill, fa);
    else if (d <= r + 0.5) {
      // anillo; con prog (0..1) solo se dibuja esa fracción (recarga), empezando arriba
      let on = true;
      if (prog !== undefined && prog < 1) { const a = (Math.atan2(x, -y) + TAU) % TAU; on = a <= prog * TAU; }
      tBlend(u, cx + x, cy + y, ring, on ? ra : ra * 0.25);
    }
  }
}
function drawTouchUI(u) {
  if (G.state !== 'play') return;
  const p = G.p, gold = [232, 184, 80], dark = [10, 6, 4];
  // joystick
  const st = G.stick;
  if (st) {
    tCircle(u, st.bx, st.by, STICK_R, dark, 0.35, gold, 0.6);
    const dx = st.x - st.bx, dy = st.y - st.by, l = Math.hypot(dx, dy), k = l > STICK_R ? STICK_R / l : 1;
    tCircle(u, st.bx + dx * k, st.by + dy * k, 10, gold, 0.55, [255, 236, 170], 0.9);
  } else {
    tCircle(u, 58, VH - 60, STICK_R, dark, 0.18, gold, 0.25);
    u.text(58, VH - 63, 'MOVER', rgb(200, 170, 110), { align: 'center', shadow: false });
  }
  // botones
  const held = new Set([...TOUCH.roles.values()].filter(r => r.kind === 'btn').map(r => r.b.id));
  for (const b of touchButtons()) {
    const on = held.has(b.id) || (b.id === 'attack' && mouse.fire);
    if (b.rect) {
      for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
        const edge = x === 0 || y === 0 || x === b.w - 1 || y === b.h - 1;
        tBlend(u, b.x + x, b.y + y, edge ? gold : dark, edge ? 0.6 : (on ? 0.7 : 0.45));
      }
      u.text(Math.round(b.x + b.w / 2) + 1, b.y + 4, b.label, C.goldL, { align: 'center', shadow: false });
      continue;
    }
    let prog, ready = true;
    if (b.i !== undefined) { const cd = Math.max(0, p.skillCd[b.i]); ready = cd <= 0; prog = ready ? 1 : 1 - cd / p.skillMax[b.i]; }
    if (b.id === 'dash' && p.dashCd > 0) { ready = false; prog = 1 - p.dashCd / p.dashMax; }
    tCircle(u, b.x, b.y, b.r, on ? [90, 60, 20] : dark, on ? 0.6 : 0.4, ready ? gold : [150, 120, 80], ready ? 0.85 : 0.6, prog);
    if (b.id === 'attack') { u.text(Math.round(b.x) - b.r + 4, Math.round(b.y) - 3, '<', C.dim, { shadow: false }); u.text(Math.round(b.x) + b.r - 8, Math.round(b.y) - 3, '>', C.dim, { shadow: false }); }
    u.text(Math.round(b.x) + 1, Math.round(b.y) - 3, b.label, ready ? C.goldL : C.dim, { align: 'center', shadow: false });
  }
}
