// Efectos visuales de hechizos, adaptados de las recetas de la biblioteca de VFX de Sprite Fusion
// (https://www.spritefusion.com/pixel-art-vfx): mismas paletas, tiempos y capas, llevados a partículas
// en el mundo 3D (con altura, gravedad y luz dinámica) y a capas de pantalla para la primera persona.

// ---------------------------------------------------------------- Paletas (de claro a oscuro)
const VR = {};
const rampOf = (l) => l.map(h => hexc(h));
VR.fire = rampOf(['#ffffff', '#fff3a6', '#ffe26b', '#ffc23d', '#ff8a2a', '#f2561d', '#c9281f', '#8a1f17', '#4a1712']);
VR.smoke = rampOf(['#5b5566', '#7b6f72', '#5d5660', '#433d48', '#2b2630', '#1a171e']);
VR.volt = rampOf(['#ffffff', '#e9f8ff', '#a3dcff', '#5eb0ff', '#5b6cff', '#4733c4']);
VR.plasma = rampOf(['#ffffff', '#7ff3ff', '#1ab8e6']);
VR.ice = rampOf(['#ffffff', '#dcfbff', '#a6ecff', '#62c8f4', '#3a8bd8', '#2c58aa', '#212f6b', '#151a3d']);
VR.poison = rampOf(['#f6ffc2', '#cfff63', '#8eea3f', '#55b92f', '#318232', '#23552e', '#173320', '#0e1d14']);
VR.cyan = rampOf(['#ffffff', '#d6ffff', '#7ff3ff', '#1ab8e6', '#2b6fd2', '#25449c', '#1b2662', '#0f1538']);
VR.gold = rampOf(['#fffbe8', '#ffec92', '#ffd243', '#f4a923', '#c9761b', '#8c4716', '#512611', '#2c140b']);
VR.pink = rampOf(['#ffffff', '#ffd8f5', '#ff9ee4', '#ff5fd0', '#d43cc4', '#8a2bb0', '#4b1a7a', '#250d42']);
VR.holy = rampOf(['#ffffff', '#fffbe2', '#fff0a6', '#ffd862', '#f6aa3c', '#cf722b', '#7e3c1f']);
VR.heal = rampOf(['#ffffff', '#e6ffdc', '#acff92', '#62e26a', '#30b55b', '#20804c', '#175237']);
VR.arcane = rampOf(['#ffffff', '#f4ddff', '#d6a0ff', '#a862ff', '#773ae4', '#4c25ab', '#2b1569', '#170b3b']);
VR.steel = rampOf(['#ffffff', '#e8f1ff', '#b8c9e8', '#62c8f4', '#3a8bd8', '#2c58aa', '#212f6b']);
VR.impact = rampOf(['#ffffff', '#fff3a6', '#ffe26b', '#ff8a2a', '#f2561d', '#c9281f']);
VR.disk = rampOf(['#ffffff', '#fff2cf', '#ffd98c', '#ffb24a', '#ff8a2a', '#e2561d', '#ad2f17', '#701a17', '#3a0e16']);
VR.void = rampOf(['#f4fbff', '#dcecff', '#b37bff', '#7a5cff', '#4c25ab', '#2b1569']);
VR.blood = rampOf(['#d83030', '#a01818', '#6a0e0e', '#3a0808']);
VR.earth = rampOf(['#8a7a68', '#6a5c4c', '#4c4038', '#2e2620']);
const PROJ_RAMP = { orbBlue: 'cyan', orbRed: 'fire', orbIce: 'ice', orbGold: 'gold', orbGreen: 'poison', orbPurple: 'pink', orbArrow: 'impact' };
const BUFF_RAMP = { venom: 'poison', ironskin: 'steel', hawk: 'gold', bloodlust: 'fire', dance: 'steel', angel: 'holy', sanct: 'holy', bulwark: 'steel', frenzy: 'fire', deathwish: 'fire', primal: 'heal', mirror: 'cyan', rage: 'fire', pact: 'fire', warcry: 'gold', rally: 'holy', aura: 'holy', divine: 'holy', enchant: 'cyan', aarmor: 'cyan', imbued: 'cyan', riposte: 'steel', howl: 'ice', regrow: 'heal' };
const rgbOf = (c) => [c & 255, (c >> 8) & 255, (c >> 16) & 255];

// ---------------------------------------------------------------- Sistema de partículas del mundo
// o: x,y,z, vx,vy,vz, life, ramp, s0,s1 (tamaño en el mundo), grav, drag, add, shape ('px'|'disc'|'cross'),
//    maxPx (tamaño máximo en pantalla), alpha, curve (avance por la rampa), off (paso inicial), delay
function vp(o) {
  if (G.vfx.length > 1400) return;
  const s0 = o.s0 !== undefined ? o.s0 : 0.05;
  G.vfx.push({
    x: o.x, y: o.y, z: o.z !== undefined ? o.z : 0.4, vx: o.vx || 0, vy: o.vy || 0, vz: o.vz || 0,
    grav: o.grav || 0, drag: o.drag || 0, life: o.life, max: o.life, ramp: o.ramp || VR.cyan,
    s0, s1: o.s1 !== undefined ? o.s1 : s0, add: o.add !== false, shape: o.shape || 'px', maxPx: o.maxPx || 4,
    alpha: o.alpha !== undefined ? o.alpha : 1, curve: o.curve || 1, off: o.off || 0, delay: o.delay || 0, fade: !!o.fade,
  });
}
function vlight(x, y, c, rad, life, delay = 0) { G.vlights.push({ x, y, c, rad, life, max: life, delay }); }

function updateVfx(dt) {
  for (const p of G.vfx) {
    if (p.delay > 0) { p.delay -= dt; continue; }
    p.life -= dt;
    if (p.drag) { const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; p.vz *= k; }
    p.vz -= p.grav * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    if (p.z < 0) { p.z = 0; p.vz *= -0.3; p.vx *= 0.6; p.vy *= 0.6; }
    if (G.lv.solid(p.x, p.y)) { p.x -= p.vx * dt; p.y -= p.vy * dt; p.vx = p.vy = 0; }
  }
  G.vfx = G.vfx.filter(p => p.life > 0);
  for (const l of G.vlights) { if (l.delay > 0) l.delay -= dt; else l.life -= dt; }
  G.vlights = G.vlights.filter(l => l.life > 0);
  for (const a of G.arcs) a.life -= dt;
  G.arcs = G.arcs.filter(a => a.life > 0);
  for (const s of G.sfx) { if (s.delay > 0) { s.delay -= dt; continue; } s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += (s.grav || 0) * dt; }
  G.sfx = G.sfx.filter(s => s.life > 0);
  if (G.aura) { G.aura.t -= dt; if (G.aura.t <= 0) G.aura = null; }
  if (G.dome) { G.dome.age += dt; G.dome.ripple = Math.max(0, G.dome.ripple - dt * 3); if (G.dome.age >= G.dome.dur) G.dome = null; }
}

function vfxItems(items) {
  for (const p of G.vfx) {
    if (p.delay > 0) continue;
    const age = 1 - p.life / p.max, n = p.ramp.length;
    const step = Math.min(n - 1, Math.floor(Math.min(0.999, Math.pow(age, p.curve)) * n) + p.off);
    const s = lerp(p.s0, p.s1, age);
    items.push({ x: p.x, y: p.y, z: p.z, w: s, h: s, color: p.ramp[step], add: p.add, bright: p.add, spr: null, shape: p.shape, maxPx: p.maxPx, alpha: p.fade ? p.alpha * (1 - age) : p.alpha });
  }
  // arcos eléctricos: trayectoria quebrada que cambia cada 50 ms
  for (const a of G.arcs) {
    const seed = a.seed + ((G.time * 20) | 0);
    const dx = a.x1 - a.x0, dy = a.y1 - a.y0, d = Math.hypot(dx, dy), n = Math.max(4, Math.ceil(d / 0.07));
    const px = -dy / (d || 1), py = dx / (d || 1);
    let off = 0, zoff = 0;
    const k = a.life / a.max;
    for (let i = 0; i <= n; i++) {
      const t = i / n, env = Math.sin(t * Math.PI);
      off = clamp(off + (hash2(i, 1, seed) - 0.5) * 0.12, -0.3, 0.3) * env;
      zoff = clamp(zoff + (hash2(i, 2, seed) - 0.5) * 0.1, -0.2, 0.2) * env;
      const x = a.x0 + dx * t + px * off, y = a.y0 + dy * t + py * off, z = 0.45 + zoff;
      items.push({ x, y, z, w: 0.06, h: 0.06, color: a.ramp[2], add: true, bright: true, spr: null, shape: 'disc', maxPx: 4, alpha: k });
      items.push({ x, y, z: z + 0.015, w: 0.025, h: 0.025, color: a.ramp[0], add: true, bright: true, spr: null, maxPx: 2, alpha: 1 });
      if (hash2(i, 3, seed) < 0.06) { // ramificación
        for (let j = 1; j < 5; j++) items.push({ x: x + px * j * 0.05 * (hash2(i, 4, seed) < 0.5 ? 1 : -1), y: y + py * j * 0.05, z: z - j * 0.03, w: 0.04, h: 0.04, color: a.ramp[3], add: true, bright: true, spr: null, maxPx: 2, alpha: k });
      }
    }
  }
}
function vfxLights(out) {
  for (const l of G.vlights) {
    if (l.delay > 0) continue;
    const k = Math.pow(l.life / l.max, 2);
    out.push({ x: l.x, y: l.y, c: [l.c[0] * k, l.c[1] * k, l.c[2] * k], rad: l.rad });
  }
  for (const a of G.arcs) out.push({ x: (a.x0 + a.x1) / 2, y: (a.y0 + a.y1) / 2, c: [0.6, 0.9, 1.5], rad: 3 });
}

// anillo de partículas que se expande por el suelo o por el aire
function vRing(x, y, z, r, dur, ramp, n, o = {}) {
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + rand(-0.05, 0.05), s = r / dur;
    vp(Object.assign({ x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: dur, ramp, s0: 0.07, maxPx: 3 }, o));
  }
}

// ---------------------------------------------------------------- Efectos del mundo
// Explosión: destello, bola de fuego que se enfría a humo, chispas, brasas, anillos y onda expansiva
function vfxExplosion(x, y, r = 2.4, big = false) {
  const F = VR.fire;
  vlight(x, y, [2.4, 2.3, 2.1], r * 2.2, 0.1);
  vlight(x, y, [1.7, 1.0, 0.45], r * 2.8, 0.7);
  vp({ x, y, z: 0.45, life: 0.08, ramp: [hexc('#ffffff')], s0: r * 0.4, s1: r * 0.8, shape: 'disc', maxPx: 60 });
  for (let i = 0; i < 6; i++) vp({ x: x + rand(-0.2, 0.2), y: y + rand(-0.2, 0.2), z: rand(0.25, 0.6), life: 0.3, ramp: F, s0: 0.5 * (big ? 1.4 : 1), s1: 0.25, shape: 'disc', maxPx: 34, curve: 0.62 });
  for (let i = 0; i < (big ? 30 : 18); i++) {
    const a = rand(0, TAU), s = rand(1.2, 3.4) * r / 2.4;
    vp({ x, y, z: rand(0.2, 0.5), vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: rand(0.4, 1.6), grav: -0.4, drag: 2.2, life: rand(0.55, 1.1), ramp: F, s0: rand(0.22, 0.38), s1: 0.1, shape: 'disc', maxPx: 22, curve: 0.62, delay: rand(0, 0.12) });
  }
  for (let i = 0; i < (big ? 40 : 26); i++) {
    const a = rand(0, TAU), s = rand(4, 9);
    vp({ x, y, z: 0.4, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: rand(1, 4), grav: 7, life: rand(0.18, 0.7), ramp: VR.impact, s0: 0.04, maxPx: 3 });
  }
  for (let i = 0; i < 12; i++) vp({ x: x + rand(-0.6, 0.6), y: y + rand(-0.6, 0.6), z: rand(0.2, 0.6), vx: rand(-0.4, 0.4), vy: rand(-0.4, 0.4), vz: rand(0.2, 0.5), grav: -0.05, drag: 0.6, life: rand(1.2, 3), ramp: F.slice(2, 7), s0: 0.035, maxPx: 2 });
  for (let i = 0; i < (big ? 16 : 10); i++) vp({ x: x + rand(-0.5, 0.5), y: y + rand(-0.5, 0.5), z: rand(0.3, 0.7), vx: rand(-0.6, 0.6), vy: rand(-0.6, 0.6), vz: rand(0.2, 0.6), drag: 1.2, life: rand(1.5, 3), ramp: VR.smoke, s0: 0.35, s1: 0.8, shape: 'disc', maxPx: 34, add: false, alpha: 0.6, fade: true, delay: rand(0.06, 0.45) });
  vRing(x, y, 0.4, r, 0.22, [hexc('#ff8a2a')], 34);
  vRing(x, y, 0.45, r * 1.35, 0.34, [hexc('#ffe26b')], 40);
  vRing(x, y, 0.03, r * 1.8, 0.5, F.slice(1, 6), 48, { s0: 0.08 });
  for (let i = 0; i < 8; i++) { const a = rand(0, TAU), s = rand(2, 4); vp({ x, y, z: 0.2, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: rand(2.5, 4.5), grav: 9, life: rand(1.4, 2.6), ramp: VR.earth, s0: 0.06, maxPx: 3, add: false }); }
  for (let i = 0; i < 10; i++) { const a = rand(0, TAU), d = rand(0, r * 0.6); vp({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, z: 0.01, life: rand(1.5, 2.5), ramp: F.slice(0, 9), s0: 0.12, shape: 'disc', maxPx: 8, curve: 0.5, add: true }); }
}

// Impacto: estrella de dos fotogramas, esquirlas, anillo y chispas
function vfxImpact(x, y, z, rampName = 'impact', scale = 1) {
  const R = VR[rampName] || VR.impact;
  vp({ x, y, z, life: 0.07, ramp: [R[0], R[1]], s0: 0.22 * scale, s1: 0.3 * scale, shape: 'disc', maxPx: 14 });
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) vp({ x, y, z, vx: dx * 4, vy: dy * 4, vz: dy * 2, life: 0.08, ramp: [R[1]], s0: 0.05, maxPx: 3 });
  for (let i = 0; i < 6 * scale; i++) { const a = rand(0, TAU), s = rand(2, 5); vp({ x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: rand(0.5, 2.5), grav: 7, life: rand(0.2, 0.45), ramp: R.slice(1), s0: 0.04, maxPx: 2 }); }
  vRing(x, y, z, 0.6 * scale, 0.2, R.slice(1, 4), 12, { s0: 0.04, maxPx: 2 });
  vlight(x, y, rgbOf(R[2]).map(v => v / 255 * 1.2), 2.2 * scale, 0.15);
}

// Estela de los proyectiles
function vfxTrail(pr) {
  const R = VR[PROJ_RAMP[pr.spr] || 'cyan'];
  vp({ x: pr.x + rand(-0.05, 0.05), y: pr.y + rand(-0.05, 0.05), z: 0.46 + rand(-0.04, 0.04), vx: -pr.vx * 0.05, vy: -pr.vy * 0.05, vz: rand(-0.1, 0.2), life: rand(0.18, 0.32), ramp: R.slice(1, 6), s0: pr.size * 0.25, s1: 0.02, maxPx: 3 });
}

// Arco eléctrico entre dos puntos + chispas de plasma en el destino
function vfxArc(x0, y0, x1, y1, rampName = 'volt', life = 0.22) {
  G.arcs.push({ x0, y0, x1, y1, life, max: life, ramp: VR[rampName], seed: randi(0, 99999) });
  for (let i = 0; i < 6; i++) { const a = rand(0, TAU), s = rand(2, 4); vp({ x: x1, y: y1, z: 0.45, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: rand(0.5, 2), grav: 6, life: rand(0.2, 0.4), ramp: VR.plasma, s0: 0.035, maxPx: 2 }); }
}

// Rayo desde el cielo: destello, pie del rayo, anillo y chispas (el tronco es el sprite 'bolt')
function vfxStrike(x, y) {
  G.fx.push({ type: 'bolt', x, y, life: 0.2, v: randi(0, 2) });
  vlight(x, y, [1.8, 2.2, 3.0], 6, 0.2);
  vp({ x, y, z: 0.05, life: 0.12, ramp: [VR.volt[0], VR.volt[2], VR.volt[5]], s0: 0.5, s1: 0.2, shape: 'disc', maxPx: 26 });
  vRing(x, y, 0.03, 1.6, 0.25, [VR.volt[1], VR.volt[3]], 28);
  for (let i = 0; i < 14; i++) { const a = rand(0, TAU), s = rand(2, 6); vp({ x, y, z: 0.1, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: rand(1, 4), grav: 8, life: rand(0.25, 0.6), ramp: i % 3 ? VR.plasma : VR.impact.slice(1, 4), s0: 0.04, maxPx: 2 }); }
}

// Luz sagrada: columna dorada desde el cielo, anillos en el suelo y motas que suben
function vfxHolyPillar(x, y, scale = 1) {
  G.fx.push({ type: 'pillar', x, y, life: 0.55, max: 0.55, scale });
  vlight(x, y, [2.0, 1.8, 1.1], 5 * scale, 0.5);
  vRing(x, y, 0.03, 1.8 * scale, 0.3, [VR.holy[0], VR.holy[2]], 30);
  for (let i = 0; i < 14; i++) vp({ x: x + rand(-0.4, 0.4) * scale, y: y + rand(-0.4, 0.4) * scale, z: rand(0, 0.4), vz: rand(0.6, 1.6), drag: 0.5, life: rand(0.6, 1.2), ramp: VR.holy.slice(0, 4), s0: 0.04, maxPx: 3, shape: i % 4 ? 'px' : 'cross', delay: rand(0, 0.25) });
}
function vfxHolyRing(x, y, r) {
  vlight(x, y, [2.0, 1.8, 1.0], r * 1.8, 0.6);
  vRing(x, y, 0.03, r, 0.35, [VR.holy[0], VR.holy[2], VR.holy[3]], 56, { s0: 0.08 });
  vRing(x, y, 0.4, r * 0.8, 0.45, [VR.holy[1], VR.holy[3]], 40);
  for (let i = 0; i < 24; i++) { const a = rand(0, TAU), d = rand(0.5, r); vp({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, z: rand(0, 0.3), vz: rand(0.8, 1.8), drag: 0.6, life: rand(0.7, 1.3), ramp: VR.holy.slice(0, 4), s0: 0.04, maxPx: 3, shape: i % 3 ? 'px' : 'cross' }); }
}

// Nova de hielo: esquirlas, anillos, cristales que brotan y se rompen, y niebla
function vfxIceNova(x, y, r, rampName = 'ice') {
  if (typeof Ambient !== 'undefined' && G.p && Math.hypot(arguments[0] - G.p.x, arguments[1] - G.p.y) < 5 && G.cfg.ambient !== false) Ambient.frostBurst(); // copos de nieve en pantalla
  const I = VR[rampName];
  vlight(x, y, [1.2, 1.9, 2.4], r * 1.8, 0.6);
  for (let i = 0; i < 44; i++) { const a = i / 44 * TAU, s = r / 0.35 * rand(0.8, 1.1); vp({ x, y, z: rand(0.15, 0.6), vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.35, ramp: I.slice(0, 4), s0: 0.06, maxPx: 3 }); }
  vRing(x, y, 0.04, r, 0.3, I.slice(0, 4), 50, { s0: 0.08 });
  vRing(x, y, 0.3, r * 0.7, 0.4, I.slice(1, 5), 36);
  for (let i = 0; i < 26; i++) {
    const a = rand(0, TAU), d = r * rand(0.4, 1.0), cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d;
    if (G.lv.solid(cx, cy)) continue;
    const h = rand(0.25, 0.6);
    for (let k = 0; k < 12; k++) { // púa de hielo: punta blanca, caras claras arriba y sombra abajo
      const z = h * (1 - k / 12);
      vp({ x: cx, y: cy, z, life: 0.9, ramp: [k === 0 ? hexc('#ffffff') : I[Math.min(6, 1 + Math.floor(k / 2.4))]], s0: 0.03 + k * 0.011, maxPx: 8, add: k < 3, delay: 0.15 + d / r * 0.15 });
    }
    for (let k = 0; k < 4; k++) vp({ x: cx, y: cy, z: h * 0.6, vx: rand(-1.5, 1.5), vy: rand(-1.5, 1.5), vz: rand(0.5, 2), grav: 7, life: rand(0.3, 0.6), ramp: I.slice(0, 4), s0: 0.05, maxPx: 3, delay: 1.05 });
  }
  for (let i = 0; i < 10; i++) { const a = rand(0, TAU), d = rand(0, r); vp({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, z: rand(0.05, 0.3), vx: rand(-0.3, 0.3), vy: rand(-0.3, 0.3), vz: 0.1, life: rand(0.9, 1.5), ramp: I.slice(2, 5), s0: 0.3, s1: 0.6, shape: 'disc', maxPx: 26, add: true, alpha: 0.35, fade: true }); }
}

// Nova arcana / energía: anillos de energía y motas
function vfxEnergyNova(x, y, r) {
  vlight(x, y, [1.3, 1.0, 2.4], r * 1.8, 0.6);
  vRing(x, y, 0.04, r, 0.32, VR.cyan.slice(0, 5), 56, { s0: 0.09 });
  vRing(x, y, 0.45, r * 0.85, 0.42, VR.arcane.slice(0, 5), 44);
  for (let i = 0; i < 30; i++) { const a = rand(0, TAU), s = rand(2, 6); vp({ x, y, z: rand(0.2, 0.7), vx: Math.cos(a) * s, vy: Math.sin(a) * s, drag: 2, life: rand(0.4, 0.8), ramp: VR.cyan.slice(0, 6), s0: 0.05, maxPx: 3, shape: i % 5 ? 'px' : 'cross' }); }
}

// Teletransporte: píxeles que salen volando y se disuelven en luz (rampa arcana)
function vfxBlink(x, y, rampName = 'arcane') {
  const R = VR[rampName];
  vlight(x, y, [1.2, 0.7, 2.0], 3, 0.3);
  vp({ x, y, z: 0.45, life: 0.1, ramp: [R[0], R[1]], s0: 0.5, s1: 0.1, shape: 'disc', maxPx: 30 });
  for (let i = 0; i < 26; i++) { const a = rand(0, TAU), s = rand(1, 4); vp({ x: x + rand(-0.2, 0.2), y: y + rand(-0.2, 0.2), z: rand(0.05, 0.85), vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: rand(-0.5, 1.5), drag: 2.5, life: rand(0.35, 0.8), ramp: R.slice(0, 6), s0: 0.04, maxPx: 2 }); }
  for (let i = 0; i < 10; i++) vp({ x: x + rand(-0.25, 0.25), y: y + rand(-0.25, 0.25), z: rand(0, 0.5), vz: rand(1, 2.5), life: rand(0.3, 0.6), ramp: [R[1], R[2], R[3]], s0: 0.03, maxPx: 2 });
}

// Agujero negro: implosión hacia el centro y estallido de luz violeta
function vfxBlackHole(x, y, r) {
  for (let i = 0; i < 48; i++) {
    const a = rand(0, TAU), d = r * rand(0.7, 1.05), sp = d / 0.3;
    vp({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, z: rand(0.1, 0.8), vx: -Math.cos(a - 0.5) * sp, vy: -Math.sin(a - 0.5) * sp, life: 0.3, ramp: i % 3 ? VR.disk.slice(1, 6) : VR.void.slice(1, 4), s0: 0.05, maxPx: 3 });
  }
  vp({ x, y, z: 0.45, life: 0.32, ramp: [hexc('#020105')], s0: 0.2, s1: 0.7, shape: 'disc', maxPx: 40, add: false });
  later(0.3, () => {
    vlight(x, y, [1.4, 1.0, 2.6], r * 2, 0.7);
    vp({ x, y, z: 0.45, life: 0.12, ramp: VR.void.slice(0, 3), s0: 0.6, s1: 1.4, shape: 'disc', maxPx: 70 });
    vRing(x, y, 0.45, r, 0.35, VR.void.slice(0, 4), 64, { s0: 0.14, maxPx: 6, shape: 'disc' });
    vRing(x, y, 0.04, r * 1.2, 0.45, [VR.void[2], VR.void[3], VR.void[4]], 56, { s0: 0.12, maxPx: 5, shape: 'disc' });
    for (let i = 0; i < 30; i++) { const a = rand(0, TAU), s = rand(3, 8); vp({ x, y, z: rand(0.2, 0.7), vx: Math.cos(a) * s, vy: Math.sin(a) * s, drag: 2, life: rand(0.4, 0.8), ramp: i % 2 ? VR.void.slice(0, 5) : VR.disk.slice(0, 6), s0: 0.06, maxPx: 3 }); }
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; vp({ x, y, z: 0.45, vx: Math.cos(a) * 9, vy: Math.sin(a) * 9, life: 0.15, ramp: [hexc('#f4fbff'), hexc('#9fd8ff')], s0: 0.06, maxPx: 3 }); }
  });
}

// Nube de veneno: bocanadas de gas, esporas y burbujas que revientan
function vfxPoisonTick(z) {
  const P = VR.poison;
  for (let i = 0; i < 3; i++) {
    const a = rand(0, TAU), d = Math.sqrt(Math.random()) * z.r;
    vp({ x: z.x + Math.cos(a) * d, y: z.y + Math.sin(a) * d, z: rand(0.05, 0.45), vx: rand(-0.2, 0.2), vy: rand(-0.2, 0.2), vz: rand(0.05, 0.25), drag: 0.5, life: rand(1.2, 2.2), ramp: [P[2], P[3], P[4], P[5]], s0: 0.35, s1: 0.75, shape: 'disc', maxPx: 34, add: true, alpha: 0.32, fade: true });
  }
  { const a = rand(0, TAU), d = Math.sqrt(Math.random()) * z.r; vp({ x: z.x + Math.cos(a) * d, y: z.y + Math.sin(a) * d, z: 0.05, vz: rand(0.4, 1), life: rand(0.6, 1.1), ramp: [P[1], P[2]], s0: 0.035, maxPx: 2 }); }
  if (Math.random() < 0.6) { const a = rand(0, TAU), d = Math.sqrt(Math.random()) * z.r; vp({ x: z.x + Math.cos(a) * d, y: z.y + Math.sin(a) * d, z: 0.02, life: 0.25, ramp: [P[2], P[1]], s0: 0.07, maxPx: 5, shape: 'cross' }); }
}
function vfxThornsTick(z) {
  const P = VR.poison;
  const a = rand(0, TAU), d = Math.sqrt(Math.random()) * z.r;
  vp({ x: z.x + Math.cos(a) * d, y: z.y + Math.sin(a) * d, z: 0, vz: rand(0.6, 1.4), grav: 2, life: rand(0.4, 0.7), ramp: [P[2], P[3], P[4]], s0: 0.05, maxPx: 3, add: false });
  if (Math.random() < 0.5) vp({ x: z.x + Math.cos(a + 1) * d, y: z.y + Math.sin(a + 1) * d, z: 0.05, vz: 0.6, life: 0.6, ramp: [P[1], P[2]], s0: 0.03, maxPx: 2 });
}
// zonas de fuego, hielo o luz sagrada (muro de fuego, ventisca, consagrar, estela de llamas...)
function vfxZoneTick(z) {
  const P = z.kind === 'fire' ? VR.fire : z.kind === 'ice' ? VR.ice : z.kind === 'holy' ? VR.holy : VR.poison;
  const a = rand(0, TAU), d = Math.sqrt(Math.random()) * z.r;
  if (z.kind === 'fire') vp({ x: z.x + Math.cos(a) * d, y: z.y + Math.sin(a) * d, z: 0.02, vz: rand(0.6, 1.3), life: rand(0.35, 0.7), ramp: [P[1], P[3], P[5], P[7]], s0: 0.09, s1: 0.03, maxPx: 6, add: true });
  else if (z.kind === 'ice') vp({ x: z.x + Math.cos(a) * d, y: z.y + Math.sin(a) * d, z: rand(0.6, 1.2), vx: rand(-0.6, 0.6), vy: rand(-0.6, 0.6), vz: rand(-0.9, -0.4), life: rand(0.6, 1), ramp: [P[0], P[1], P[2]], s0: 0.04, maxPx: 3, add: true });
  else vp({ x: z.x + Math.cos(a) * d, y: z.y + Math.sin(a) * d, z: 0.03, vz: rand(0.3, 0.8), life: rand(0.5, 0.9), ramp: [P[0], P[2], P[3]], s0: 0.05, maxPx: 3, add: true });
}
// Ácido: gotas en arco que salpican el suelo
function vfxAcid(x, y, a) {
  const P = VR.poison;
  for (let i = 0; i < 34; i++) {
    const aa = a + rand(-0.7, 0.7), s = rand(3, 7);
    vp({ x, y, z: 0.4, vx: Math.cos(aa) * s, vy: Math.sin(aa) * s, vz: rand(0.5, 2.2), grav: 7, life: rand(0.5, 0.9), ramp: [P[1], P[2], P[3]], s0: 0.05, maxPx: 3, add: false });
  }
}
// Objetivo en llamas: lenguas de fuego que suben por su silueta
function vfxBurn(e) {
  const F = VR.fire, h = e.def.h;
  vp({ x: e.x + rand(-0.2, 0.2), y: e.y + rand(-0.2, 0.2), z: rand(0, h * 0.7), vz: rand(0.6, 1.3), drag: 1, life: rand(0.3, 0.55), ramp: F.slice(1, 8), s0: 0.09, s1: 0.03, shape: 'disc', maxPx: 6, curve: 0.62 });
}
function vfxPoisoned(e) {
  vp({ x: e.x + rand(-0.2, 0.2), y: e.y + rand(-0.2, 0.2), z: rand(0.1, e.def.h * 0.8), vz: rand(0.3, 0.7), life: 0.5, ramp: [VR.poison[1], VR.poison[2]], s0: 0.04, maxPx: 3, shape: Math.random() < 0.3 ? 'cross' : 'px' });
}
// Onda de choque en el suelo (salto sísmico, golpe de oso)
function vfxShock(x, y, r) {
  vRing(x, y, 0.03, r, 0.4, VR.impact.slice(1, 6), 48, { s0: 0.08 });
  for (let i = 0; i < 14; i++) { const a = rand(0, TAU), s = rand(2, 4.5); vp({ x, y, z: 0.1, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: rand(2, 4), grav: 9, life: rand(1, 1.8), ramp: VR.earth, s0: 0.07, maxPx: 3, add: false }); }
  for (let i = 0; i < 10; i++) { const a = rand(0, TAU), d = rand(0.3, r * 0.8); vp({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, z: 0.1, vx: Math.cos(a) * 1.5, vy: Math.sin(a) * 1.5, vz: 0.4, drag: 1.5, life: rand(0.8, 1.5), ramp: VR.smoke, s0: 0.3, s1: 0.6, shape: 'disc', maxPx: 24, add: false, alpha: 0.5, fade: true }); }
}

// ---------------------------------------------------------------- Efectos de pantalla (primera persona)
// Curación: cruces verdes que suben desde abajo
function vfxHeal(n = 10, rampName = 'heal') {
  const R = VR[rampName];
  for (let i = 0; i < n; i++) G.sfx.push({ x: rand(VW * 0.12, VW * 0.88), y: VH + rand(0, 40), vx: rand(-6, 6), vy: -rand(50, 110), life: rand(0.8, 1.4), max: 1.2, ramp: R.slice(0, 5), size: randi(3, 6), shape: 'cross', delay: rand(0, 0.35) });
}
// Mejora: aura en los bordes y estelas que suben por los lados
function vfxPowerUp(rampName) {
  const R = VR[rampName] || VR.cyan;
  G.aura = { t: 0.7, max: 0.7, ramp: R };
  for (let i = 0; i < 26; i++) {
    const left = i % 2 === 0, x = left ? rand(0, VW * 0.18) : rand(VW * 0.82, VW);
    G.sfx.push({ x, y: VH + rand(0, 30), vx: 0, vy: -rand(160, 280), life: rand(0.4, 0.8), max: 0.6, ramp: R.slice(0, 5), size: randi(6, 14), shape: 'streak', delay: rand(0, 0.25) });
  }
}
// Cúpula hexagonal de escudo (escudo divino, armadura arcana, parada)
function vfxDome(rampName, dur) { G.dome = { ramp: VR[rampName] || VR.ice, age: 0, dur, ripple: 0 }; }

function drawScreenVfx(R) {
  const buf = R.buf;
  const put = (x, y, c) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < VW && y < VH) buf[y * VW + x] = c; };
  // aura de mejora
  if (G.aura) { const k = G.aura.t / G.aura.max; R.tint(k * 0.55, rgbOf(G.aura.ramp[2])); }
  // cúpula de escudo: celdas hexagonales visibles hacia el borde, se forman por ángulo y se deshacen al final
  if (G.dome) {
    const d = G.dome, cx = VW / 2, cy = VH / 2, maxR = Math.hypot(cx, cy);
    const form = clamp(d.age / 0.45, 0, 1), fadeK = clamp((d.dur - d.age) / 0.5, 0, 1);
    const hw = 13, hh = 11.3;
    for (let row = -1; row < VH / hh + 1; row++) for (let col = -1; col < VW / (hw * 1.5) + 1; col++) {
      const hx = col * hw * 1.5, hy = row * hh * 2 + (col & 1 ? hh : 0);
      const rim = Math.hypot(hx - cx, hy - cy) / maxR;
      if (rim < 0.5) continue;
      const ang = (Math.atan2(hy - cy, hx - cx) + Math.PI) / TAU;
      if (ang > form * 1.05) continue;
      if (hash2(col, row, 77) > fadeK * 1.1) continue;
      const fresh = form < 1 && ang > form - 0.12;
      const c = d.ripple > 0.6 || fresh ? d.ramp[0] : d.ripple > 0.2 || rim > 0.75 ? d.ramp[1] : d.ramp[2];
      for (let k = 0; k < 6; k++) {
        const a0 = k / 6 * TAU, a1 = (k + 1) / 6 * TAU;
        R.pline(hx + Math.cos(a0) * hw, hy + Math.sin(a0) * hw, hx + Math.cos(a1) * hw, hy + Math.sin(a1) * hw, c, 1);
      }
    }
  }
  // partículas de pantalla
  for (const s of G.sfx) {
    if (s.delay > 0) continue;
    const age = 1 - s.life / s.max, c = s.ramp[Math.min(s.ramp.length - 1, Math.floor(clamp(age, 0, 0.999) * s.ramp.length))];
    if (s.shape === 'cross') {
      const h = s.size;
      for (let i = -h; i <= h; i++) { put(s.x + i, s.y, c); put(s.x, s.y + i, c); }
      put(s.x - h - 1, s.y, rgb(26, 20, 34)); put(s.x + h + 1, s.y, rgb(26, 20, 34)); put(s.x, s.y - h - 1, rgb(26, 20, 34)); put(s.x, s.y + h + 1, rgb(26, 20, 34));
    } else if (s.shape === 'streak') {
      for (let i = 0; i < s.size; i++) put(s.x, s.y + i, i < 3 ? s.ramp[0] : i < s.size * 0.4 ? s.ramp[1] : s.ramp[3]);
    }
  }
}

// Media luna de un corte (receta "slash"): borde blanco, bandas de color hacia dentro y hacia la cola
function drawSlash(R, gx, gy, angFrom, angTo, L, age, rampName = 'steel') {
  // media luna más fina: el grosor máximo es un 38% de la hoja
  const ramp = VR[rampName] || VR.steel, n = ramp.length;
  const lo = Math.min(angFrom, angTo), hi = Math.max(angFrom, angTo), span = hi - lo;
  if (span < 0.05) return;
  const rOut = L * 1.04, rInMin = L * 0.66;
  const buf = R.buf;
  const x0 = Math.max(0, Math.floor(gx - rOut)), x1 = Math.min(VW - 1, Math.ceil(gx + rOut));
  const y0 = Math.max(0, Math.floor(gy - rOut)), y1 = Math.min(VH - 1, Math.ceil(gy + rOut * 0.3));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const dx = x + 0.5 - gx, dy = y + 0.5 - gy, r = Math.hypot(dx, dy);
    if (r > rOut || r < rInMin) continue;
    const th = Math.atan2(dx, -dy); // mismo convenio que el ángulo de la hoja
    if (th < lo || th > hi) continue;
    let v = (th - lo) / span; if (angTo < angFrom) v = 1 - v; // v: 0 cola, 1 cabeza
    const rIn = rOut - (rOut - rInMin) * (0.2 + 0.8 * v);
    if (r < rIn) continue;
    const q = (rOut - r) / (rOut - rIn); // 0 borde exterior, 1 interior
    if (age > 0.55 && hash2(x, y, (age * 30) | 0) < (age - 0.55) * 2.2) continue; // se disuelve
    let c;
    if (q < 0.22 && age < 0.5) c = ramp[0];
    else c = ramp[clamp(Math.round(q * (n - 1) * 0.75 + age * 2.4 - v * 0.8 + 0.4), 0, n - 1)];
    buf[y * VW + x] = c | 0xFF000000;
  }
}

// Columna de luz sagrada (aditiva): núcleo blanco, bandas doradas, fibras y borde tramado
function buildPillar() {
  const W = 26, H = 128, px = new Uint32Array(W * H), C = VR.holy;
  const fib = [0.1, -0.35, 0.55, -0.7, 0.3, -0.1, 0.75];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const q = Math.abs(x + 0.5 - W / 2) / (W / 2 / 1.3);
    let s = q < 0.2 ? 0 : q < 0.42 ? 1 : q < 0.66 ? 2 : q < 0.88 ? 3 : 4;
    if (q > 1.3) continue;
    if (s === 4 && BAY4[(x & 3) | ((y & 3) << 2)] > (1.3 - q) / 0.42) continue;
    const xf = (x + 0.5 - W / 2) / (W / 2);
    if (fib.some(f => Math.abs(xf - f) < 0.06) && s > 0) s--;
    if ((y % 50) < 4 && s > 0) s--;
    const c = s === 0 ? hexc('#ffffff') : C[s];
    px[y * W + x] = (c & 0x00FFFFFF) | ((s === 4 ? 150 : 255) << 24);
  }
  return { w: W, h: H, px, flash: px };
}
SPR.pillar = buildPillar();
