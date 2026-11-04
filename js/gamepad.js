// Soporte de mandos (API Gamepad, mapeo estándar: Xbox, PlayStation y la mayoría de genéricos)
//  Partida: stick izq. moverse · stick der. girar · RT atacar · LT bloquear (o esquivar sin escudo)
//           A esquivar · X/Y/B habilidades R/C/V · LB escudo · RB arma siguiente
//           cruceta: ↑ poción · ↓ mapa · ← diario · → inventario · Start pausa
//  Menús:   stick izq. / cruceta mueven el cursor entre opciones · A elige · B vuelve
const PAD = { prev: [], focus: -1, rep: 0, active: false, look: 0 };
const BTN = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, BACK: 8, START: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };
const DEAD = 0.2;

function padState() {
  const list = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const g of list) if (g && g.connected && g.mapping === 'standard') return g;
  for (const g of list) if (g && g.connected) return g;
  return null;
}
function axis(v) { const a = Math.abs(v); return a < DEAD ? 0 : Math.sign(v) * ((a - DEAD) / (1 - DEAD)); }
// tecla sintética para reutilizar el manejo del teclado (Escape, A/D en diario y mapa...)
function padKey(code) { document.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true })); }

// cursor de menú: salta al elemento pulsable más cercano en la dirección pedida
function padMoveFocus(dx, dy) {
  const hot = ui.hot; if (!hot.length) return;
  const c = (h) => [h.x + h.w / 2, h.y + h.h / 2];
  if (PAD.focus < 0 || PAD.focus >= hot.length) { PAD.focus = 0; return padAim(); }
  const [fx, fy] = c(hot[PAD.focus]);
  let best = -1, bd = 1e9;
  hot.forEach((h, i) => {
    if (i === PAD.focus) return;
    const [x, y] = c(h), vx = x - fx, vy = y - fy;
    const along = vx * dx + vy * dy; if (along <= 2) return;
    const d = along + Math.abs(vx * dy - vy * dx) * 2.5;
    if (d < bd) { bd = d; best = i; }
  });
  if (best >= 0) PAD.focus = best;
  padAim();
}
function padAim() { const h = ui.hot[PAD.focus]; if (h) { ui.mouse.x = Math.floor(h.x + h.w / 2); ui.mouse.y = Math.floor(h.y + h.h / 2); } }

function pollPad(dt) {
  const g = padState();
  if (!g) { if (PAD.active) { PAD.active = false; G.padMove = null; } return; }
  const b = g.buttons.map(x => x.pressed || x.value > 0.5), was = PAD.prev;
  const down = (i) => b[i] && !was[i], held = (i) => !!b[i];
  PAD.prev = b;
  const lx = axis(g.axes[0] || 0), ly = axis(g.axes[1] || 0), rx = axis(g.axes[2] || 0);
  const any = b.some(Boolean) || lx || ly || rx;
  if (any && !PAD.active) { PAD.active = true; G.padMode = true; Sfx.init(); applyBindings(); }
  if (!PAD.active) return;
  const p = G.p;
  // reasignando un botón: el siguiente que se pulse queda asignado
  if (G.rebind && G.rebind.dev === 'pad') { const i = b.findIndex((v, k) => v && !was[k]); if (i >= 0) { rebind('pad', G.rebind.id, i); G.rebind = null; Sfx.play('gem'); } return; }
  const P = bindPad();
  if (G.state === 'play') {
    PAD.focus = -1;
    G.padMove = (lx || ly) ? { f: -ly, s: lx } : null;
    // giro con curva de respuesta (preciso al apuntar, rápido al empujar a fondo)
    if (rx) { p.a += Math.sign(rx) * Math.pow(Math.abs(rx), 1.6) * 3.4 * (G.cfg ? G.cfg.sens : 1) * dt; G.manualLook = G.time; }
    if (down(P.attack)) mouse.fire = true; else if (!held(P.attack) && was[P.attack]) mouse.fire = false;
    const shieldOk = p.off === 'shield' && WEAPONS[p.weapon].hands === 1;
    if (held(P.block) && shieldOk) p.wantBlock = true; else if (!held(P.block) && was[P.block] && shieldOk) p.wantBlock = false;
    if (down(P.block) && !shieldOk) tryDash();
    if (down(P.dash)) tryDash();
    if (down(P.skill1)) useSkill(0);
    if (down(P.skill2)) useSkill(1);
    if (down(P.skill3)) useSkill(2);
    if (down(P.shield)) toggleOffhand();
    if (down(P.weapon)) { const n = CLASSES[p.cls].slots.length; if (n > 1) equipSlot((p.slot + 1) % n); }
    if (down(P.potion)) drinkPotion();
    if (down(P.map) || down(BTN.BACK)) openMap();
    if (down(P.journal)) openJournal();
    if (down(P.inventory)) openInventory();
    if (down(P.pause)) pauseGame();
    return;
  }
  // ---------- menús
  G.padMove = null; if (was[BTN.RT] && !held(BTN.RT)) mouse.fire = false;
  PAD.rep -= dt;
  let dx = 0, dy = 0;
  if (held(BTN.LEFT) || lx < -0.5) dx = -1; else if (held(BTN.RIGHT) || lx > 0.5) dx = 1;
  if (held(BTN.UP) || ly < -0.5) dy = -1; else if (held(BTN.DOWN) || ly > 0.5) dy = 1;
  const fresh = down(BTN.LEFT) || down(BTN.RIGHT) || down(BTN.UP) || down(BTN.DOWN);
  if ((dx || dy) && (fresh || PAD.rep <= 0)) {
    PAD.rep = fresh ? 0.35 : 0.16;
    // en el diario y el mapa, izquierda/derecha pasan página o nivel
    if ((G.state === 'journal' || G.state === 'map') && dx) padKey(dx < 0 ? 'KeyA' : 'KeyD');
    else padMoveFocus(dx, dy);
  }
  if (!dx && !dy) PAD.rep = 0;
  if (PAD.focus >= 0) padAim();
  if (down(BTN.A)) {
    const h = ui.hot[PAD.focus];
    if (h) handleClick(Math.floor(h.x + h.w / 2), Math.floor(h.y + h.h / 2), 0);
    else if (G.state === 'journal') padKey('KeyJ');
    else if (G.state === 'map') padKey('KeyM');
    else if (ui.hot.length && G.state !== 'dead' && !(G.state === 'title' && !G.hasSave)) { PAD.focus = 0; padAim(); return; } // primero, poner el cursor
    else handleClick(-50, -50, 0); // fuera de cualquier botón: empezar, renacer...
    PAD.focus = -1;
  }
  if (down(BTN.B) || (down(BTN.START) && G.state === 'paused')) {
    if (G.state === 'paused') resumeGame();
    else if (G.state === 'options') G.state = 'title';
    else if (G.state === 'controls') { G.state = G.ctlBack || 'title'; G.rebind = null; }
    else if (['journal', 'map', 'inventory', 'shop', 'forge', 'exitask'].includes(G.state)) padKey('Escape');
    PAD.focus = -1;
  }
}

// vibración al recibir daño (donde el mando lo admita)
function padRumble(strength, ms) {
  const g = padState(); if (!g || !PAD.active || (G.cfg && G.cfg.noRumble)) return;
  const v = g.vibrationActuator;
  try { if (v && v.playEffect) v.playEffect('dual-rumble', { duration: ms, strongMagnitude: strength, weakMagnitude: strength * 0.6 }); } catch (e) { /* sin vibración */ }
}
window.addEventListener('gamepadconnected', (e) => { if (G.state === 'play' || G.state === 'title') logMsg(`Mando conectado: ${e.gamepad.id.split('(')[0].trim().slice(0, 28)}`, C.dim); });
