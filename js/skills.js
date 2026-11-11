// Habilidades activas, efectos de estado, aliados, trampas y zonas
// ---------------------------------------------------------------- Utilidades
function aimPos(dist) {
  const p = G.p; let d = 0;
  while (d < dist && !G.lv.solid(p.x + Math.cos(p.a) * (d + 0.25), p.y + Math.sin(p.a) * (d + 0.25))) d += 0.25;
  return { x: p.x + Math.cos(p.a) * d, y: p.y + Math.sin(p.a) * d };
}
// Las habilidades no atraviesan paredes: solo alcanzan a enemigos a menos de 10 m del jugador
// y con línea de visión desde el origen del golpe (otra habitación tras un muro queda a salvo)
const SKILL_RANGE = 10;
function canHit(e, x = G.p.x, y = G.p.y) {
  return Math.hypot(e.x - G.p.x, e.y - G.p.y) <= SKILL_RANGE + e.def.r && G.lv.los(x, y, e.x, e.y);
}
function enemiesIn(x, y, r) { return G.enemies.filter(e => !e.dead && Math.hypot(e.x - x, e.y - y) <= r + e.def.r && canHit(e, x, y)); }
function nearestEnemy(maxD, los = true, x = G.p.x, y = G.p.y, skip) {
  let best = null, bd = maxD;
  for (const e of G.enemies) {
    if (e.dead || (skip && skip.has(e))) continue;
    const d = Math.hypot(e.x - x, e.y - y);
    if (d < bd && (!los || G.lv.los(x, y, e.x, e.y))) { bd = d; best = e; }
  }
  return best;
}
function ringFx(x, y, r, col, n = 40) {
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU, s = r * 1.6;
    G.parts.push({ x, y, z: 0.25, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: 0.4, life: 0.55, col, add: true, size: 0.07 });
  }
}
function smokeFx(x, y) { burst(x, y, 0.3, 26, rgb(125, 125, 140), 2.2, 0.9, false, 0.1); }
// ---------------------------------------------------------------- Niveles de habilidad
// Cada habilidad activa sube hasta 3 niveles (cartas "Mejorar ..."). Mientras se lanza (y en sus efectos
// retardados) hay un contexto SKCTX y los ayudantes escalan según lo que haga la habilidad:
// daño, proyectiles extra, zonas más grandes/largas/frenan más, mejoras y sigilo más largos, aturdimientos
// más largos, más radio, curas, escudos e invocaciones más fuertes y más saltos en las cadenas.
const SKILL_MAX_LV = 3;
let SKCTX = null;
function skLv(id) { return (G.p.skLv && G.p.skLv[id]) || 0; }
const SKB = { dmg: 0.15, cd: 0.1, area: 0.15, time: 0.25, fx: 0.25, heal: 0.2, ally: 0.25 };
function skMul(k) { return SKCTX ? 1 + SKB[k] * SKCTX.lv : 1; }
function withSk(ctx, fn) {
  if (!ctx || !ctx.lv) return fn();
  const p = G.p, prev = SKCTX, dm = p.dmgMul, st = p.stealth, ab = p.absorb;
  const np = G.projs.length, nz = G.zones.length, na = G.allies.length;
  const boosted = dm * (1 + SKB.dmg * ctx.lv);
  SKCTX = ctx; p.dmgMul = boosted;
  let r;
  try { r = fn(); } finally {
    // si el lanzamiento recalculó las estadísticas (applyStats), ese valor ya no lleva el extra
    if (p.dmgMul === boosted) p.dmgMul = dm;
    if (p.stealth > st) p.stealth = st + (p.stealth - st) * skMul('time');
    if (p.absorb > ab) { p.absorb = ab + (p.absorb - ab) * skMul('ally'); p.absorbT *= skMul('time'); }
    for (let i = nz; i < G.zones.length; i++) { const z = G.zones[i]; z.r *= skMul('area'); z.t *= skMul('time'); if (z.fx) { z.fx = Object.assign({}, z.fx); if (z.fx.slow) z.fx.slow *= skMul('fx'); if (z.fx.stun) z.fx.stun *= skMul('fx'); } }
    for (let i = na; i < G.allies.length; i++) { const a = G.allies[i], m = skMul('ally'); a.hp *= m; a.maxHp *= m; if (a.life) a.life *= skMul('time'); }
    skExtraProjs(np);
    SKCTX = prev;
  }
  return r;
}
// +1 proyectil por nivel en cada lanzamiento: si salió uno, a los lados; si salió un abanico, se ensancha
function skExtraProjs(from) {
  const c = SKCTX; if (!c || c.extra <= 0) return;
  const made = G.projs.slice(from).filter(q => q.friendly && !q.basic);
  if (!made.length) return;
  const ang = q => Math.atan2(q.vy, q.vx);
  made.sort((a, b) => ang(a) - ang(b));
  const lo = made[0], hi = made[made.length - 1];
  const step = made.length > 1 ? Math.max(0.06, (ang(hi) - ang(lo)) / (made.length - 1)) : 0.2;
  for (let k = 0; k < c.extra; k++) {
    const side = k % 2 ? -1 : 1, src = side > 0 ? hi : lo, n = (k >> 1) + 1;
    const a = ang(src) + side * step * n;
    const spd = Math.hypot(src.vx, src.vy);
    G.projs.push(Object.assign({}, src, { vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, hit: new Set() }));
  }
  c.extra = 0;
}
function healP(n) {
  const p = G.p; n *= healMul() * skMul('heal'); if (n <= 0) return;
  p.hp = Math.min(p.maxHp, p.hp + n);
  if (n >= 4 && G.time - (G.healFxT || 0) > 0.4) { G.healFxT = G.time; vfxHeal(Math.min(14, 4 + Math.round(n / 4))); }
  if (n >= p.maxHp * 0.2 && typeof Ambient !== 'undefined') Ambient.healBurst(n >= p.maxHp * 0.5);
}
function later(t, fn) { const c = SKCTX; G.timers.push({ t, fn: c ? () => withSk(c, fn) : fn }); }

function applyFx(e, o) {
  if (!o || e.dead) return;
  if (SKCTX && (o.stun || o.slow)) { o = Object.assign({}, o); if (o.stun) o.stun *= skMul('fx'); if (o.slow) o.slow *= skMul('fx'); }
  const dm = G.p.dmgMul || 1;
  if (o.slow) e.slow = Math.max(e.slow, o.slow);
  if (o.stun) e.stun = Math.max(e.stun || 0, o.stun * (e.def.boss ? 0.3 : 1));
  if (o.burn) { e.burn = Math.max(e.burn || 0, o.burn); e.burnDps = Math.max(e.burnDps || 0, 6 * dm * (typeof setCount === 'function' && setCount('dragon') >= 2 ? 1.5 : 1)); }
  if (o.poison) { e.poison = Math.max(e.poison || 0, o.poison); e.poisDps = Math.max(e.poisDps || 0, 4 * dm * (typeof setCount === 'function' && setCount('reina') >= 2 ? 1.5 : 1)); }
  if (o.corrode) e.corrode = Math.max(e.corrode || 0, o.corrode);
}

function aoe(x, y, r, dmg, o = {}) {
  let n = 0; r *= skMul('area');
  for (const e of G.enemies) {
    if (e.dead) continue;
    const dx = e.x - x, dy = e.y - y, d = Math.hypot(dx, dy);
    if (d > r + e.def.r) continue;
    if (!canHit(e, x, y)) continue; // ni a través de muros ni a más de 10 m
    if (o.cone) {
      let da = Math.atan2(dy, dx) - o.cone.a; da = Math.atan2(Math.sin(da), Math.cos(da));
      if (Math.abs(da) > o.cone.arc / 2 && d > e.def.r + 0.4) continue;
    }
    const kb = o.kb || 0;
    damageEnemy(e, dmg, { kx: dx / (d || 1) * kb, ky: dy / (d || 1) * kb, silent: o.silent });
    applyFx(e, o);
    n++;
  }
  return n;
}

function fireProj(o) {
  const p = G.p, a = o.a !== undefined ? o.a : p.a, spd = o.spd || 13;
  G.projs.push({
    x: o.x !== undefined ? o.x : p.x + Math.cos(p.a) * 0.35 - Math.sin(p.a) * 0.12,
    y: o.y !== undefined ? o.y : p.y + Math.sin(p.a) * 0.35 + Math.cos(p.a) * 0.12,
    vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, r: o.r || 0.17, life: o.life || 1.6, friendly: true,
    dmg: o.dmg, crit: !!o.crit, pierce: o.pierce || 0, hit: new Set(), spr: o.spr, size: o.size || 0.32,
    fx: o.fx || null, explode: o.explode || null, basic: !!o.basic,
  });
}

function explodeAt(x, y, ex) {
  aoe(x, y, ex.r, ex.dmg, Object.assign({ kb: 6 }, ex.fx));
  vfxExplosion(x, y, ex.r);
  G.shake = Math.max(G.shake, 0.3); Sfx.play('nova');
}

// Efectos al impactar de proyectiles (fuego, hielo, rayo en cadena, veneno, drenaje...)
function hitFx(e, fx, pr) {
  if (!fx) return;
  applyFx(e, fx);
  const p = G.p;
  if (fx.drain) healP(pr.dmg * fx.drain);
  if (fx.heal) healP(fx.heal);
  if (fx.chain) {
    const done = new Set([e]); let cur = e, dmg = pr.dmg * 0.6;
    for (let i = 0; i < fx.chain; i++) {
      const nx = nearestEnemy(4.2, true, cur.x, cur.y, done);
      if (!nx) break;
      done.add(nx);
      const from = cur; cur = nx; const d = dmg;
      later(0.06 * (i + 1), () => {
        if (nx.dead) return;
        vfxArc(from.x, from.y, nx.x, nx.y);
        damageEnemy(nx, d, { silent: true });
      });
      dmg *= 0.8;
    }
  }
}

// ---------------------------------------------------------------- Sigilo y bonificaciones
// Devuelve el multiplicador de daño del primer golpe desde el sigilo y lo consume
function stealthBonus() {
  const p = G.p;
  if (p.stealth > 0) {
    p.stealth = 0;
    const m = classPassive(p.cls, 'backstab', 0);
    return m > 0 ? m : 1;
  }
  return 1;
}

// ---------------------------------------------------------------- Mejoras temporales
function addBuff(id, name, t, mods, col) {
  const p = G.p;
  const ex = p.buffs.find(b => b.id === id); t *= skMul('time');
  vfxPowerUp(BUFF_RAMP[id] || 'cyan');
  if (ex) { ex.t = t; ex.max = t; return; }
  p.buffs.push({ id, name, t, max: t, mods: mods || {}, col: col || C.gold });
}
function updateBuffs(dt) {
  const p = G.p;
  for (const b of p.buffs) b.t -= dt;
  p.buffs = p.buffs.filter(b => b.t > 0);
  if (p.absorbT > 0) { p.absorbT -= dt; if (p.absorbT <= 0) p.absorb = 0; }
  if (p.riposte > 0) p.riposte -= dt;
  if (p.stealth > 0) p.stealth -= dt;
}

function applyStats() {
  const p = G.p, b = p.base;
  if (!b) return;
  let dmg = b.dmg, spd = b.spd, rate = b.rate, armor = b.armor, leech = b.leech, crit = b.crit, regenPct = 0;
  for (const bf of p.buffs) {
    const m = bf.mods;
    if (m.dmg) dmg *= m.dmg; if (m.spd) spd *= m.spd; if (m.rate) rate *= m.rate; if (m.armor) armor *= m.armor;
    if (m.leech) leech += m.leech; if (m.crit) crit += m.crit; if (m.regenPct) regenPct += m.regenPct;
  }
  const fs = { dmg, rate, crit, leech }; forgeStats(fs); dmg = fs.dmg; rate = fs.rate; crit = fs.crit; leech = fs.leech;
  // objetos equipados
  dmg *= 1 + eqStat('dmg'); crit += eqStat('crit'); rate *= 1 + eqStat('rate'); armor *= Math.max(0.3, 1 - eqStat('armor') - setArmor()); crit += setCrit(); spd *= 1 + eqStat('spd'); leech += eqStat('leech'); if (eqSpecial('sangre')) leech += 0.03; if (setCount('lilith') >= 2) leech += 0.05;
  p.slashRamp = forgeRamp() || undefined;
  if (p.form === 'wolf') { spd *= 1.35; rate *= 1.25; dmg *= 1.1; }
  else if (p.form === 'bear') { spd *= 0.85; dmg *= 1.4; armor *= 0.55; }
  const rh = classPassive(p.cls, 'rageHp', 0);
  if (rh) dmg *= 1 + rh * (1 - clamp(p.hp / p.maxHp, 0, 1));
  p.dmgMul = dmg; p.spd = spd; p.rate = rate; p.armor = armor; p.leech = leech; p.crit = crit; p.regenPct = regenPct;
  const slots = CLASSES[p.cls].slots;
  if (p.slot >= slots.length) p.slot = 0;
  const slot = slots[p.slot];
  const w = p.form === 'human' ? slot.w : 'claws';
  if (w !== p.weapon) { p.weapon = w; p.swing = null; }
  p.spell = slot.spell || 'arcane';
}

// ---------------------------------------------------------------- Aliados
function spawnAlly(type, x, y, o = {}) {
  const d = ALLIES[type], p = G.p;
  let ax = x, ay = y;
  if (G.lv.blocked(ax, ay, 0.25)) { ax = p.x; ay = p.y; }
  const mul = (p.dmgMul || 1) * classPassive(p.cls, 'allyDmg', 1);
  const a = { type, def: d, x: ax, y: ay, hp: d.hp * (o.hpMul || 1) * (1 + (p.lvl - 1) * 0.02), maxHp: d.hp * (o.hpMul || 1) * (1 + (p.lvl - 1) * 0.02), dmg: d.dmg * mul, atk: 0, flash: 0, walk: rand(0, 2), life: d.life || null, vx: 0, vy: 0 };
  G.allies.push(a);
  vfxBlink(ax, ay, type === 'fiend' ? 'pink' : type === 'spider' ? 'arcane' : 'ice');
  Sfx.play('summon');
  return a;
}
function allyKill(a) {
  a.dead = true;
  burst(a.x, a.y, 0.4, 12, rgb(190, 150, 255), 2.2, 0.6);
}
function updateAllies(dt) {
  const p = G.p, lv = G.lv;
  for (const a of G.allies) {
    if (a.dead) continue;
    a.atk -= dt; a.flash -= dt; if (a.rageT > 0) a.rageT -= dt;
    if (a.life !== null) { a.life -= dt; if (a.life <= 0) { allyKill(a); continue; } }
    const d = a.def;
    let tgt = nearestEnemy(11, true, a.x, a.y);
    const dpl = Math.hypot(p.x - a.x, p.y - a.y);
    let tx, ty, spd = d.spd;
    if (tgt && dpl < 15) { tx = tgt.x; ty = tgt.y; }
    else if (dpl > 2.4) { tx = p.x; ty = p.y; spd *= dpl > 6 ? 1.4 : 1; tgt = null; }
    else { tx = a.x; ty = a.y; spd = 0; tgt = null; }
    const dx = tx - a.x, dy = ty - a.y, dist = Math.hypot(dx, dy) || 0.001;
    if (dpl > 14) { a.x = p.x + rand(-1, 1); a.y = p.y + rand(-1, 1); if (lv.blocked(a.x, a.y, 0.25)) { a.x = p.x; a.y = p.y; } } // se teletransporta si se pierde
    const ox = a.x, oy = a.y;
    if (spd > 0 && dist > 0.35) lv.move(a, dx / dist * spd * dt, dy / dist * spd * dt, 0.25);
    a.walk += Math.hypot(a.x - ox, a.y - oy);
    if (tgt && dist < d.r + tgt.def.r + 0.35 && a.atk <= 0) {
      a.atk = d.cd;
      damageEnemy(tgt, a.dmg * (a.rageT > 0 ? 1.5 : 1) * rand(0.9, 1.1), { kx: dx / dist * 2, ky: dy / dist * 2, silent: false });
      if (d.poison) applyFx(tgt, { poison: d.poison });
    }
  }
  // separación suave entre aliados
  for (let i = 0; i < G.allies.length; i++) for (let j = i + 1; j < G.allies.length; j++) {
    const A = G.allies[i], B = G.allies[j];
    const dx = B.x - A.x, dy = B.y - A.y, d2 = dx * dx + dy * dy;
    if (d2 < 0.2 && d2 > 1e-6) { const d = Math.sqrt(d2), push = (0.45 - d) * 0.25; lv.move(A, -dx / d * push, -dy / d * push, 0.25); lv.move(B, dx / d * push, dy / d * push, 0.25); }
  }
  G.allies = G.allies.filter(a => !a.dead);
}

// ---------------------------------------------------------------- Trampas, zonas y temporizadores
function updateTraps(dt) {
  for (const t of G.traps) {
    t.t -= dt;
    for (const e of G.enemies) {
      if (e.dead || t.dead) continue;
      if (Math.hypot(e.x - t.x, e.y - t.y) < 0.65 + e.def.r * 0.5) {
        t.dead = true;
        aoe(t.x, t.y, 1.4, t.dmg, { stun: 2.6, kb: 2, silent: true });
        vfxImpact(t.x, t.y, 0.1, 'steel', 1.2);
        Sfx.play('hit'); G.shake = Math.max(G.shake, 0.15);
      }
    }
    if (t.t <= 0) t.dead = true;
  }
  G.traps = G.traps.filter(t => !t.dead);
}
function updateZones(dt) {
  for (const z of G.zones) {
    z.t -= dt; z.tick -= dt;
    if (Math.random() < dt * (z.trail ? 6 : 18)) (z.kind === 'plague' ? vfxPoisonTick : z.kind === 'thorns' ? vfxThornsTick : vfxZoneTick)(z);
    if (z.tick <= 0) {
      z.tick = 0.5;
      for (const e of enemiesIn(z.x, z.y, z.r)) {
        if (z.dmg) damageEnemy(e, z.dmg, { silent: true });
        // en el suelo la ralentización es más suave: los enemigos la cruzan y siguen recibiendo daño
        if (z.fx && z.fx.slow) { e.slowZ = Math.max(e.slowZ || 0, z.fx.slow); applyFx(e, Object.assign({}, z.fx, { slow: 0 })); } else applyFx(e, z.fx);
      }
    }
  }
  G.zones = G.zones.filter(z => z.t > 0);
}
function updateTimers(dt) {
  for (const t of G.timers) t.t -= dt;
  const due = G.timers.filter(t => t.t <= 0);
  G.timers = G.timers.filter(t => t.t > 0);
  for (const t of due) t.fn();
}

// ---------------------------------------------------------------- Habilidades
function arrowFxFor(el) {
  if (el === 'fire') return { burn: 3 };
  if (el === 'ice') return { slow: 2.4 };
  if (el === 'bolt') return { chain: 2 };
  return null;
}
function arrowSprFor(el) { return el === 'fire' ? 'orbRed' : el === 'ice' ? 'orbIce' : el === 'bolt' ? 'orbGold' : 'orbArrow'; }
function fanOfArrows(n, spread, dmg, extraPierce) {
  const p = G.p, el = p.element;
  for (let i = 0; i < n; i++) {
    fireProj({ a: p.a + (i - (n - 1) / 2) * spread, spd: 15, dmg: dmg * rand(0.9, 1.1), spr: arrowSprFor(el), size: el ? 0.3 : 0.22, pierce: 1 + (extraPierce || 0), fx: arrowFxFor(el), life: 1.4 });
  }
  p.anim = 1; Sfx.play('shoot');
}
function leapTo(x, y) {
  const p = G.p;
  if (!G.lv.blocked(x, y, 0.22)) { p.x = x; p.y = y; return true; }
  return false;
}
function blinkBehind(t) {
  const p = G.p;
  const a = Math.atan2(t.y - p.y, t.x - p.x);
  let nx = t.x + Math.cos(a) * 0.95, ny = t.y + Math.sin(a) * 0.95;
  if (G.lv.blocked(nx, ny, 0.22)) { nx = t.x - Math.cos(a) * 0.95; ny = t.y - Math.sin(a) * 0.95; }
  smokeFx(p.x, p.y); vfxBlink(p.x, p.y);
  if (!G.lv.blocked(nx, ny, 0.22)) { p.x = nx; p.y = ny; p.a = Math.atan2(t.y - ny, t.x - nx); }
  vfxBlink(p.x, p.y);
}
function chainFrom(start, n, dmg) {
  if (SKCTX) n += SKCTX.lv;
  const done = new Set(); let cur = start, prev = { x: G.p.x + Math.cos(G.p.a) * 0.6, y: G.p.y + Math.sin(G.p.a) * 0.6 };
  for (let i = 0; i < n && cur; i++) {
    const tgt = cur, d = dmg, from = prev;
    done.add(tgt);
    later(0.08 * i, () => {
      if (tgt.dead) return;
      vfxArc(from.x, from.y, tgt.x, tgt.y, 'volt', 0.3);
      damageEnemy(tgt, d, { silent: i > 0 });
    });
    prev = tgt;
    dmg *= 0.85;
    cur = nearestEnemy(4.6, true, cur.x, cur.y, done);
  }
  Sfx.play('bolt'); G.shake = Math.max(G.shake, 0.12);
}

const SKILLS = {
  // ----- Ladrón
  knives: { name: 'Cuchillos', cd: 4, use(p) {
    for (let i = -1; i <= 1; i++) fireProj({ a: p.a + i * 0.15, spd: 16, dmg: 15 * p.dmgMul, spr: 'orbArrow', size: 0.22, pierce: 1, life: 1.2 });
    p.anim = 1; Sfx.play('swing');
  } },
  smoke: { name: 'Bomba de humo', cd: 12, use(p) { p.stealth = 3.5; smokeFx(p.x, p.y); Sfx.play('dash'); } },
  // ----- Luchador / Guerrero / Campeón
  warcry: { name: 'Grito de guerra', cd: 14, use(p) {
    aoe(p.x, p.y, 3.4, 14 * p.dmgMul, { kb: 9 }); vRing(p.x, p.y, 0.03, 3.4, 0.35, VR.gold.slice(0, 5), 44, { s0: 0.08 });
    addBuff('warcry', 'Grito', 8, { dmg: 1.25 }, C.orange); Sfx.play('roar'); G.shake = Math.max(G.shake, 0.35);
  } },
  shieldbash: { name: 'Golpe de escudo', cd: 8, use(p) {
    if (offhandOf(p) !== 'shield') { toast('NECESITAS UN ESCUDO EN LA MANO', false); return false; }
    const n = aoe(p.x, p.y, 2.5, 26 * p.dmgMul, { kb: 11, stun: 1.3, cone: { a: p.a, arc: 1.8 } });
    vfxImpact(p.x + Math.cos(p.a) * 1.2, p.y + Math.sin(p.a) * 1.2, 0.45, 'impact', 1.4);
    p.bash = { t: 0, dur: 0.42, hit: n > 0 }; G.shake = Math.max(G.shake, n ? 0.3 : 0.1); Sfx.play('hit'); // el escudo sale hacia delante y vuelve
    burst(p.x + Math.cos(p.a) * 1.2, p.y + Math.sin(p.a) * 1.2, 0.4, 10, rgb(255, 235, 170), 3, 0.4);
  } },
  whirlwind: { name: 'Torbellino', cd: 9, use(p) {
    p.swing = { t: 0, dur: 0.85, dir: 1, spin: true };
    for (let k = 0; k < 5; k++) later(k * 0.17, () => { aoe(G.p.x, G.p.y, 2.4, 20 * G.p.dmgMul, { kb: 5 }); vRing(G.p.x, G.p.y, 0.4, 2.3, 0.2, VR.steel.slice(0, 4), 30); Sfx.play('swing'); });
    G.shake = Math.max(G.shake, 0.3);
  } },
  rally: { name: 'Estandarte', cd: 18, use(p) {
    addBuff('rally', 'Estandarte', 10, { dmg: 1.2, armor: 0.75 }, C.gold); healP(p.maxHp * 0.1);
    ringFx(p.x, p.y, 3, rgb(255, 220, 110)); Sfx.play('level');
  } },
  rage: { name: 'Furia', cd: 22, use(p) {
    addBuff('rage', 'Furia', 10, { dmg: 1.4, spd: 1.25, leech: 0.12, rate: 1.2 }, C.red);
    ringFx(p.x, p.y, 2.6, rgb(255, 80, 50)); Sfx.play('roar'); G.shake = Math.max(G.shake, 0.4); G.flashFx = 0.3;
  } },
  leap: { name: 'Salto sísmico', cd: 9, use(p) {
    const t = aimPos(4.5); p.dashT = 0;
    if (!leapTo(t.x, t.y)) { p.x = t.x - Math.cos(p.a) * 0.4; p.y = t.y - Math.sin(p.a) * 0.4; }
    p.inv = Math.max(p.inv, 0.3);
    later(0.12, () => { const q = G.p; aoe(q.x, q.y, 3.3, 70 * q.dmgMul, { kb: 12, stun: 1.2 }); vfxShock(q.x, q.y, 3.3); G.shake = 0.7; Sfx.play('boss'); });
  } },
  // ----- Mago / Hechicero / Archimago
  fireball: { name: 'Bola de fuego', cd: 6, use(p) {
    fireProj({ spr: 'orbRed', size: 0.75, spd: 9, dmg: 20 * p.dmgMul, r: 0.3, life: 2.2, explode: { r: 2.5, dmg: 45 * p.dmgMul, fx: { burn: 3 }, col: [255, 120, 40] } });
    p.anim = 1; Sfx.play('nova');
  } },
  frostnova: { name: 'Nova de escarcha', cd: 9, use(p) {
    aoe(p.x, p.y, 3.8, 22 * p.dmgMul, { kb: 5, slow: 3.5 }); vfxIceNova(p.x, p.y, 3.8); G.novaFx = 1; Sfx.play('nova');
  } },
  chain: { name: 'Rayo en cadena', cd: 7, use(p) {
    const t = nearestEnemy(SKILL_RANGE, true); if (!t) return false;
    chainFrom(t, 6, 30 * p.dmgMul); p.anim = 1;
  } },
  meteor: { name: 'Meteoro', cd: 13, use(p) {
    const t0 = nearestEnemy(10, true), pos = t0 ? { x: t0.x, y: t0.y } : aimPos(7);
    ringFx(pos.x, pos.y, 3.3, rgb(255, 120, 40), 30);
    G.fx.push({ type: 'meteor', x: pos.x, y: pos.y, life: 0.9, max: 0.9 });
    later(0.9, () => {
      aoe(pos.x, pos.y, 3.5, 150 * G.p.dmgMul, { kb: 10, burn: 4, silent: true }); vfxExplosion(pos.x, pos.y, 3.5, true);
      G.shake = 0.8; G.flashFx = 0.4; Sfx.play('boss');
    });
    p.anim = 1;
  } },
  arcnova: { name: 'Nova arcana', cd: 8, use(p) {
    aoe(p.x, p.y, 4.8, 58 * p.dmgMul, { kb: 9, slow: 2 }); vfxEnergyNova(p.x, p.y, 4.8);
    G.novaFx = 1; G.shake = Math.max(G.shake, 0.3); Sfx.play('nova');
  } },
  enchant: { name: 'Encantar arma', cd: 18, use(p) {
    addBuff('enchant', 'Arma encantada', 12, { dmg: 1.3, rate: 1.2 }, C.cyan); ringFx(p.x, p.y, 2, rgb(120, 200, 255)); Sfx.play('level');
  } },
  energyslash: { name: 'Tajo de energía', cd: 6, use(p) {
    fireProj({ spr: 'orbPurple', size: 0.95, spd: 11, dmg: 62 * p.dmgMul, pierce: 5, life: 1.3, r: 0.45, fx: { slow: 1 } });
    p.swing = { t: 0, dur: 0.5, dir: -p.swingDir, move: 'rise', strong: true }; Sfx.play('swing'); G.shake = Math.max(G.shake, 0.15);
  } },
  arcaneArmor: { name: 'Armadura arcana', cd: 16, use(p) {
    p.absorb = 90 + p.lvl * 2; p.absorbT = 10; addBuff('aarmor', 'Armadura arcana', 10, {}, C.blue); vfxDome('cyan', 1.2); Sfx.play('level');
  } },
  // ----- Asesino / Hoja Oscura / Duelista
  shadowstep: { name: 'Paso de sombra', cd: 7, use(p) {
    const t = nearestEnemy(10, true);
    if (t) blinkBehind(t); else { const a = aimPos(4); vfxBlink(p.x, p.y); leapTo(a.x, a.y); vfxBlink(p.x, p.y); }
    p.stealth = Math.max(p.stealth, 2); p.inv = Math.max(p.inv, 0.3); Sfx.play('dash');
  } },
  vanish: { name: 'Sigilo', cd: 13, use(p) { p.stealth = 5; p.inv = Math.max(p.inv, 0.4); smokeFx(p.x, p.y); vfxBlink(p.x + Math.cos(p.a) * 0.8, p.y + Math.sin(p.a) * 0.8); Sfx.play('dash'); } },
  clones: { name: 'Clones de sombra', cd: 18, use(p) {
    spawnAlly('shadow', p.x + Math.cos(p.a + 1.2) * 1.2, p.y + Math.sin(p.a + 1.2) * 1.2);
    spawnAlly('shadow', p.x + Math.cos(p.a - 1.2) * 1.2, p.y + Math.sin(p.a - 1.2) * 1.2);
  } },
  shadowburst: { name: 'Estallido de sombras', cd: 10, use(p) {
    const cx = p.x + Math.cos(p.a) * 1.6, cy = p.y + Math.sin(p.a) * 1.6;
    vfxBlackHole(cx, cy, 3.7);
    later(0.3, () => { aoe(cx, cy, 3.9, 40 * G.p.dmgMul, { kb: 7, slow: 3 }); G.shake = Math.max(G.shake, 0.3); Sfx.play('nova'); });
    p.stealth = Math.max(p.stealth, 2);
  } },
  flurry: { name: 'Ráfaga de estocadas', cd: 10, use(p) {
    const t = nearestEnemy(9, true);
    if (t) { const a = Math.atan2(t.y - p.y, t.x - p.x); const nx = t.x - Math.cos(a) * 1.1, ny = t.y - Math.sin(a) * 1.1; smokeFx(p.x, p.y); if (!G.lv.blocked(nx, ny, 0.22)) { p.x = nx; p.y = ny; } p.a = a; }
    p.inv = Math.max(p.inv, 0.9);
    for (let k = 0; k < 9; k++) later(k * 0.085, () => {
      const q = G.p; q.swingDir = -q.swingDir; q.swing = { t: 0, dur: 0.1, dir: q.swingDir };
      aoe(q.x, q.y, 2.0, 15 * q.dmgMul, { kb: 1.5, cone: { a: q.a, arc: 2.4 }, silent: k % 2 === 1 }); Sfx.play('swing');
    });
  } },
  riposte: { name: 'Parada y réplica', cd: 8, use(p) { p.riposte = 1.6; addBuff('riposte', 'Parada', 1.6, {}, C.cyan); vfxDome('steel', 1.6); Sfx.play('blade'); } },
  // ----- Arquero / Domador / Arquero mágico
  volley: { name: 'Lluvia de flechas', cd: 8, use(p) { fanOfArrows(9, 0.11, 18 * p.dmgMul, 0); } },
  trap: { name: 'Trampa de acero', cd: 7, use(p) {
    const a = aimPos(2.2); G.traps.push({ x: a.x, y: a.y, t: 45, dmg: 60 * p.dmgMul }); Sfx.play('trap');
    if (G.traps.length > 5) G.traps.shift();
  } },
  callwolf: { name: 'Llamar lobo', cd: 6, use(p) {
    if (G.allies.filter(a => a.type === 'wolf').length >= 3) { logMsg('Ya tienes 3 lobos', C.dim); return false; }
    spawnAlly('wolf', p.x + Math.cos(p.a) * 1.2, p.y + Math.sin(p.a) * 1.2);
  } },
  callbear: { name: 'Llamar oso', cd: 15, use(p) {
    if (G.allies.some(a => a.type === 'bear')) { logMsg('Tu oso sigue vivo', C.dim); return false; }
    spawnAlly('bear', p.x + Math.cos(p.a) * 1.4, p.y + Math.sin(p.a) * 1.4);
  } },
  imbue: { name: 'Imbuir flechas', cd: 1.2, use(p) {
    const i = ELEMENTS.indexOf(p.element);
    p.element = ELEMENTS[(i + 1) % ELEMENTS.length];
    vRing(p.x, p.y, 0.4, 1.6, 0.25, VR[{ fire: 'fire', ice: 'ice', bolt: 'volt' }[p.element]].slice(0, 5), 24); Sfx.play('blade');
    logMsg(`Flechas de ${ELEMENT_NAME[p.element]}`, C.gold);
  } },
  arcvolley: { name: 'Salva arcana', cd: 7, use(p) { fanOfArrows(7, 0.1, 26 * p.dmgMul, 1); } },
  selfbuff: { name: 'Imbuirse', cd: 20, use(p) {
    addBuff('imbued', 'Imbuido', 9, { dmg: 1.3, rate: 1.25, spd: 1.1 }, C.cyan); ringFx(p.x, p.y, 1.8, rgb(120, 200, 255)); Sfx.play('level');
  } },
  // ----- Paladín / Heraldo / Hereje
  holynova: { name: 'Luz sagrada', cd: 11, use(p) {
    aoe(p.x, p.y, 4.2, 32 * p.dmgMul, { kb: 6 }); healP(p.maxHp * 0.2); vfxHolyRing(p.x, p.y, 4.2); G.flashFx = 0.25; Sfx.play('nova');
  } },
  divine: { name: 'Escudo divino', cd: 16, use(p) { p.inv = Math.max(p.inv, 2.5); addBuff('divine', 'Escudo divino', 2.5, {}, C.gold); vfxDome('holy', 2.5); Sfx.play('level'); } },
  smite: { name: 'Juicio divino', cd: 11, use(p) {
    const done = new Set(); let n = 0;
    for (let i = 0; i < 5; i++) {
      const t = nearestEnemy(SKILL_RANGE, true, p.x, p.y, done); if (!t) break;
      done.add(t); n++;
      later(i * 0.12, () => {
        if (t.dead) return;
        vfxHolyPillar(t.x, t.y);
        aoe(t.x, t.y, 1.5, 42 * G.p.dmgMul, { kb: 3, silent: i > 0 }); Sfx.play('bolt');
      });
    }
    if (!n) return false;
  } },
  aura: { name: 'Aura sagrada', cd: 20, use(p) {
    addBuff('aura', 'Aura sagrada', 8, { dmg: 1.25, regenPct: 0.03, armor: 0.85 }, C.gold); ringFx(p.x, p.y, 3, rgb(255, 235, 150)); Sfx.play('level');
  } },
  bloodpact: { name: 'Pacto de sangre', cd: 18, use(p) {
    if (p.hp < p.maxHp * 0.35) { logMsg('Estás demasiado débil para el pacto', C.dim); return false; }
    p.hp -= p.maxHp * 0.2; addBuff('pact', 'Pacto de sangre', 10, { dmg: 1.6, leech: 0.15 }, C.red);
    ringFx(p.x, p.y, 2.2, rgb(200, 30, 40)); G.hurtFx = 0.5; Sfx.play('roar');
  } },
  fiend: { name: 'Invocar demonio', cd: 24, use(p) {
    for (const a of G.allies) if (a.type === 'fiend') allyKill(a);
    spawnAlly('fiend', p.x + Math.cos(p.a) * 1.5, p.y + Math.sin(p.a) * 1.5);
  } },
  drain: { name: 'Drenar vida', cd: 9, use(p) {
    const done = new Set(); let n = 0;
    for (let i = 0; i < 3; i++) {
      const t = nearestEnemy(7.5, true, p.x, p.y, done); if (!t) break;
      done.add(t); n++;
      const dmg = 18 * p.dmgMul;
      damageEnemy(t, dmg, { silent: i > 0 }); healP(dmg * 0.45); vfxArc(t.x, t.y, p.x + Math.cos(p.a) * 0.6, p.y + Math.sin(p.a) * 0.6, 'pink', 0.35);
    }
    if (!n) return false;
    Sfx.play('bolt');
  } },
  // ----- Druida / Cambiaformas / Azote
  thorns: { name: 'Zarzas', cd: 10, use(p) {
    const a = aimPos(5);
    G.zones.push({ kind: 'thorns', x: a.x, y: a.y, r: 2.7, t: 5, tick: 0, dmg: 8 * p.dmgMul, fx: { slow: 1, poison: 3 }, col: rgb(90, 220, 90) });
    vRing(a.x, a.y, 0.03, 2.7, 0.3, VR.poison.slice(1, 5), 30); Sfx.play('summon'); p.anim = 1;
  } },
  regrowth: { name: 'Regeneración', cd: 14, use(p) { addBuff('regrow', 'Regeneración', 6, { regenPct: 0.045 }, C.green); healP(p.maxHp * 0.05); ringFx(p.x, p.y, 1.6, rgb(110, 240, 130), 24); Sfx.play('potion'); } },
  shapeshift: { name: 'Cambiar de forma', cd: 1.5, use(p) {
    const order = ['human', 'wolf', 'bear'];
    p.form = order[(order.indexOf(p.form) + 1) % 3];
    burst(p.x, p.y, 0.5, 26, p.form === 'wolf' ? rgb(180, 190, 200) : p.form === 'bear' ? rgb(150, 100, 60) : rgb(120, 230, 130), 2.6, 0.7, false, 0.08);
    Sfx.play('roar'); G.flashFx = 0.25;
    logMsg(p.form === 'human' ? 'Recuperas tu forma humana' : p.form === 'wolf' ? 'Te conviertes en LOBO: veloz y rápido' : 'Te conviertes en OSO: resistente y brutal', C.green);
  } },
  formskill: { name: 'Habilidad de forma', cd: 10, use(p) {
    if (p.form === 'wolf') { aoe(p.x, p.y, 4.2, 12 * p.dmgMul, { stun: 1.6, kb: 3 }); addBuff('howl', 'Aullido', 5, { spd: 1.3 }, C.cyan); vRing(p.x, p.y, 0.4, 4.2, 0.4, VR.ice.slice(0, 5), 44); Sfx.play('roar'); }
    else if (p.form === 'bear') { aoe(p.x, p.y, 4, 48 * p.dmgMul, { stun: 1.4, kb: 10 }); vfxShock(p.x, p.y, 4); G.shake = Math.max(G.shake, 0.45); Sfx.play('boss'); }
    else { SKILLS.regrowth.use(p); }
  } },
  plague: { name: 'Nube de plaga', cd: 12, use(p) {
    const a = aimPos(6);
    G.zones.push({ kind: 'plague', x: a.x, y: a.y, r: 3, t: 7, tick: 0, dmg: 9 * p.dmgMul, fx: { poison: 3, slow: 1, corrode: 3 }, col: rgb(170, 220, 50) });
    vRing(a.x, a.y, 0.03, 3, 0.35, VR.poison.slice(1, 6), 36); Sfx.play('summon'); p.anim = 1;
    if (typeof Ambient !== 'undefined' && G.cfg.ambient !== false) Ambient.bubbleBurst();
  } },
  swarm: { name: 'Enjambre de pesadilla', cd: 20, use(p) {
    for (let i = 0; i < 3; i++) spawnAlly('spider', p.x + Math.cos(p.a + (i - 1) * 0.8) * 1.4, p.y + Math.sin(p.a + (i - 1) * 0.8) * 1.4);
  } },
  acid: { name: 'Ácido corrosivo', cd: 9, use(p) {
    const n = aoe(p.x, p.y, 5.5, 22 * p.dmgMul, { cone: { a: p.a, arc: 1.5 }, poison: 5, corrode: 6, kb: 2 });
    vfxAcid(p.x, p.y, p.a);
    if (typeof Ambient !== 'undefined' && G.cfg.ambient !== false) Ambient.bubbleBurst();
    p.anim = 1; Sfx.play('swing');
  } },
};

// ---------------------------------------------------------------- Habilidades nuevas (más potentes cuanto más avanzada la clase)
// ayudas: embestida en línea, zona genérica y marcas
function dashStrike(dist, dmg, o = {}) {
  const p = G.p, x0 = p.x, y0 = p.y, t = aimPos(dist);
  if (!leapTo(t.x, t.y)) { p.x = t.x - Math.cos(p.a) * 0.4; p.y = t.y - Math.sin(p.a) * 0.4; }
  p.inv = Math.max(p.inv, 0.35);
  const hit = new Set();
  for (let k = 0; k <= 6; k++) {
    const x = lerp(x0, p.x, k / 6), y = lerp(y0, p.y, k / 6);
    for (const e of enemiesIn(x, y, o.r || 1.2)) if (!hit.has(e)) { hit.add(e); damageEnemy(e, dmg, { kx: Math.cos(p.a) * (o.kb || 6), ky: Math.sin(p.a) * (o.kb || 6) }); applyFx(e, o.fx); }
    burst(x, y, 0.4, 3, o.col || rgb(230, 230, 255), 1.6, 0.4);
  }
  Sfx.play('dash'); G.shake = Math.max(G.shake, 0.2);
  return hit.size;
}
function zoneAt(x, y, r, t, dmg, fx, kind, col) { G.zones.push({ kind, x, y, r, t, tick: 0, dmg, fx, col }); vRing(x, y, 0.03, r, 0.3, (kind === 'fire' ? VR.fire : kind === 'ice' ? VR.ice : kind === 'holy' ? VR.gold : VR.poison).slice(1, 5), 30); }
function enemiesNear(r) { const p = G.p; r *= skMul('area'); return G.enemies.filter(e => !e.dead && Math.hypot(e.x - p.x, e.y - p.y) <= r + e.def.r && canHit(e)); }
function buffOn(id) { return G.p.buffs.some(b => b.id === id); }
// golpes con efectos de buff (llamado desde los golpes básicos)
function buffHit(e) {
  if (e.dead) return;
  if (buffOn('venom')) applyFx(e, { poison: 4 });
  if (buffOn('spellblade')) applyFx(e, { slow: 1 });
}
Object.assign(SKILLS, {
  // ----- Ladrón (base)
  poisonblade: { name: 'Hoja envenenada', cd: 12, use(p) { addBuff('venom', 'Hoja envenenada', 8, { dmg: 1.1 }, C.green); ringFx(p.x, p.y, 1.4, rgb(120, 230, 90), 20); Sfx.play('blade'); } },
  caltrops: { name: 'Abrojos', cd: 9, use(p) { zoneAt(p.x, p.y, 2.2, 6, 6 * p.dmgMul, { slow: 1.5 }, 'thorns', rgb(200, 200, 210)); Sfx.play('trap'); } },
  // ----- Luchador (base)
  charge: { name: 'Embestida', cd: 8, use(p) { dashStrike(4.5, 32 * p.dmgMul, { kb: 9, fx: { stun: 0.8 } }); } },
  ironskin: { name: 'Piel de hierro', cd: 16, use(p) { addBuff('ironskin', 'Piel de hierro', 6, { armor: 0.6 }, C.dim); healP(p.maxHp * 0.08); vfxDome('steel', 0.8); Sfx.play('blade'); } },
  // ----- Mago (base)
  arcanebolt: { name: 'Proyectil arcano', cd: 3, use(p) { fireProj({ spr: 'orbBlue', size: 0.5, spd: 15, dmg: 32 * p.dmgMul, pierce: 2, life: 1.4, r: 0.25 }); p.anim = 1; Sfx.play('shoot'); } },
  blink: { name: 'Traslación', cd: 7, use(p) { const x0 = p.x, y0 = p.y, t = aimPos(5); vfxBlink(p.x, p.y); if (!leapTo(t.x, t.y)) { p.x = t.x; p.y = t.y; } vfxBlink(p.x, p.y); aoe(x0, y0, 2.2, 18 * p.dmgMul, { slow: 2.5 }); vfxIceNova(x0, y0, 2.2); p.inv = Math.max(p.inv, 0.3); Sfx.play('dash'); } },
  // ----- Asesino
  deathmark: { name: 'Marca de muerte', cd: 14, use(p) { const t = nearestEnemy(SKILL_RANGE, true); if (!t) return false; t.mark = 8; vfxBlink(t.x, t.y, 'void'); Sfx.play('blade'); logMsg('Marcas a tu presa: recibe +50% de daño', C.red); } },
  garrote: { name: 'Degollar', cd: 9, use(p) { const t = nearestEnemy(2.4, true); if (!t) return false; const m = p.stealth > 0 ? 2.5 : 1; p.stealth = 0; damageEnemy(t, 90 * p.dmgMul * m, { crit: m > 1 }); applyFx(t, { stun: 1 }); vfxImpact(t.x, t.y, 0.6, 'impact', 1.2); Sfx.play('hit'); } },
  // ----- Arquero
  piercing: { name: 'Disparo perforante', cd: 5, use(p) { fireProj({ spr: 'orbArrow', size: 0.4, spd: 24, dmg: 70 * p.dmgMul, pierce: 6, life: 1.4, r: 0.25, fx: { slow: 1 } }); p.anim = 1; Sfx.play('shoot'); } },
  hawkeye: { name: 'Ojo de halcón', cd: 18, use(p) { addBuff('hawk', 'Ojo de halcón', 10, { crit: 0.25, rate: 1.15 }, C.goldL); ringFx(p.x, p.y, 1.6, rgb(255, 230, 140), 24); Sfx.play('level'); } },
  // ----- Paladín
  consecrate: { name: 'Consagrar', cd: 12, use(p) { zoneAt(p.x, p.y, 3, 6, 12 * p.dmgMul, { slow: 0.5 }, 'holy', rgb(255, 230, 140)); Sfx.play('nova'); } },
  hammer: { name: 'Martillo de luz', cd: 7, use(p) { fireProj({ spr: 'orbGold', size: 0.7, spd: 12, dmg: 55 * p.dmgMul, pierce: 1, life: 1.6, r: 0.35, fx: { stun: 1 } }); p.anim = 1; Sfx.play('shoot'); } },
  // ----- Guerrero
  cleave: { name: 'Tajo brutal', cd: 6, use(p) { aoe(p.x, p.y, 2.8, 60 * p.dmgMul, { kb: 8, cone: { a: p.a, arc: 3.4 } }); p.swing = { t: 0, dur: 0.45, dir: 1, move: 'slash', strong: true }; G.shake = Math.max(G.shake, 0.3); Sfx.play('hit'); } },
  bloodlust: { name: 'Sed de batalla', cd: 18, use(p) { addBuff('bloodlust', 'Sed de batalla', 8, { dmg: 1.3, leech: 0.1 }, C.red); ringFx(p.x, p.y, 2, rgb(220, 40, 40), 28); Sfx.play('roar'); } },
  // ----- Druida
  entangle: { name: 'Raíces', cd: 10, use(p) { const n = aoe(p.x, p.y, 4, 14 * p.dmgMul, { stun: 2.5, poison: 3 }); vRing(p.x, p.y, 0.03, 4, 0.4, VR.poison.slice(1, 5), 40); Sfx.play('summon'); if (!n) return; } },
  moonbeam: { name: 'Rayo lunar', cd: 6, use(p) { const t = nearestEnemy(SKILL_RANGE, true); if (!t) return false; vfxHolyPillar(t.x, t.y); aoe(t.x, t.y, 1.6, 50 * p.dmgMul, { slow: 2 }); Sfx.play('bolt'); } },
  // ----- Hechicero
  icelance: { name: 'Lanza de hielo', cd: 4, use(p) { fireProj({ spr: 'orbIce', size: 0.55, spd: 17, dmg: 45 * p.dmgMul, pierce: 3, life: 1.4, r: 0.28, fx: { slow: 2.5 } }); p.anim = 1; Sfx.play('shoot'); } },
  firewall: { name: 'Muro de fuego', cd: 12, use(p) { for (let k = 1; k <= 3; k++) { const x = p.x + Math.cos(p.a) * (1.5 + k * 1.3), y = p.y + Math.sin(p.a) * (1.5 + k * 1.3); if (!G.lv.solid(x, y)) zoneAt(x, y, 1.4, 6, 14 * p.dmgMul, { burn: 3 }, 'fire', rgb(255, 130, 40)); } Sfx.play('nova'); } },
  // ----- Hoja Oscura
  nightblades: { name: 'Hojas nocturnas', cd: 8, use(p) { for (let k = 0; k < 10; k++) fireProj({ a: p.a + k / 10 * TAU, spr: 'orbPurple', size: 0.3, spd: 13, dmg: 34 * p.dmgMul, pierce: 2, life: 0.9, r: 0.22 }); Sfx.play('swing'); } },
  eclipse: { name: 'Eclipse', cd: 22, use(p) { for (const e of enemiesNear(8)) applyFx(e, { stun: 2.2, slow: 4 }); p.stealth = Math.max(p.stealth, 4); vfxBlackHole(p.x, p.y, 4); G.flashFx = 0.3; Sfx.play('nova'); } },
  soulreap: { name: 'Siega de almas', cd: 14, use(p) { let n = 0; for (const e of enemiesNear(5)) { damageEnemy(e, e.maxHp * (e.def.boss ? 0.04 : 0.15) + 20 * p.dmgMul, { silent: n++ > 0 }); if (e.dead) healP(p.maxHp * 0.05); } vRing(p.x, p.y, 0.4, 5, 0.4, VR.void.slice(0, 5), 44); Sfx.play('nova'); if (!n) return; } },
  // ----- Duelista
  lunge: { name: 'Estocada fulgurante', cd: 5, use(p) { dashStrike(5, 80 * p.dmgMul, { kb: 4, r: 1 }); } },
  bladedance: { name: 'Danza de acero', cd: 16, use(p) { addBuff('dance', 'Danza de acero', 6, { rate: 1.5, spd: 1.2 }, C.cyan); p.inv = Math.max(p.inv, 0.6); ringFx(p.x, p.y, 1.6, rgb(200, 230, 255), 26); Sfx.play('blade'); } },
  execute: { name: 'Golpe de gracia', cd: 12, use(p) { const t = nearestEnemy(2.6, true); if (!t) return false; if (!t.def.boss && t.hp < t.maxHp * 0.35) damageEnemy(t, t.hp + 1, { crit: true }); else damageEnemy(t, 120 * p.dmgMul, { crit: true }); vfxImpact(t.x, t.y, 0.6, 'impact', 1.5); G.shake = Math.max(G.shake, 0.3); Sfx.play('hit'); } },
  // ----- Domador
  packrage: { name: 'Furia de la manada', cd: 18, use(p) { if (!G.allies.length) return false; for (const a of G.allies) { a.hp = Math.min(a.maxHp, a.hp + a.maxHp * 0.4); a.rageT = 10; } ringFx(p.x, p.y, 3, rgb(255, 160, 80), 30); Sfx.play('roar'); } },
  beastroar: { name: 'Rugido bestial', cd: 12, use(p) { aoe(p.x, p.y, 4, 20 * p.dmgMul, { stun: 1.5, kb: 6 }); for (const a of G.allies) a.hp = Math.min(a.maxHp, a.hp + a.maxHp * 0.3); vRing(p.x, p.y, 0.4, 4, 0.4, VR.fire.slice(2, 6), 40); Sfx.play('roar'); } },
  netshot: { name: 'Red', cd: 9, use(p) { fireProj({ spr: 'orbArrow', size: 0.6, spd: 14, dmg: 20 * p.dmgMul, pierce: 0, life: 1.2, r: 0.4, explode: { r: 2, dmg: 10 * p.dmgMul, fx: { stun: 3, slow: 4 }, col: [200, 200, 180] } }); p.anim = 1; Sfx.play('shoot'); } },
  // ----- Arquero mágico
  starfall: { name: 'Lluvia estelar', cd: 14, use(p) { const t = nearestEnemy(SKILL_RANGE, true), c = t ? { x: t.x, y: t.y } : aimPos(6); for (let k = 0; k < 7; k++) later(k * 0.12, () => { const x = c.x + rand(-1.8, 1.8), y = c.y + rand(-1.8, 1.8); vfxStrike(x, y); aoe(x, y, 1.3, 30 * G.p.dmgMul, { kb: 3, silent: true }); Sfx.play('bolt'); }); } },
  runicarrow: { name: 'Flecha rúnica', cd: 6, use(p) { const el = p.element || 'fire'; fireProj({ spr: arrowSprFor(el), size: 0.5, spd: 16, dmg: 30 * p.dmgMul, life: 1.5, r: 0.3, explode: { r: 2.6, dmg: 70 * p.dmgMul, fx: arrowFxFor(el), col: el === 'ice' ? [150, 220, 255] : el === 'bolt' ? [255, 230, 120] : [255, 120, 40] } }); p.anim = 1; Sfx.play('shoot'); } },
  phasearrow: { name: 'Flecha espectral', cd: 9, use(p) { fireProj({ spr: 'orbPurple', size: 0.45, spd: 20, dmg: 55 * p.dmgMul, pierce: 99, life: 1.6, r: 0.3, fx: { slow: 2 } }); p.anim = 1; Sfx.play('shoot'); } },
  // ----- Heraldo
  judgment: { name: 'Sentencia', cd: 15, use(p) { aoe(p.x, p.y, 6, 90 * p.dmgMul, { stun: 1, kb: 8 }); vfxHolyRing(p.x, p.y, 6); G.flashFx = 0.4; G.shake = Math.max(G.shake, 0.4); Sfx.play('boss'); } },
  guardian: { name: 'Ángel guardián', cd: 28, use(p) { addBuff('angel', 'Ángel guardián', 10, { regenPct: 0.05, armor: 0.7 }, C.goldL); vfxDome('holy', 1.5); Sfx.play('level'); } },
  sanctuary: { name: 'Santuario', cd: 20, use(p) { addBuff('sanct', 'Santuario', 5, { armor: 0.3 }, C.gold); zoneAt(p.x, p.y, 2.6, 5, 10 * p.dmgMul, {}, 'holy', rgb(255, 240, 180)); vfxDome('holy', 5); Sfx.play('level'); } },
  // ----- Hereje
  hellfire: { name: 'Fuego infernal', cd: 10, use(p) { aoe(p.x, p.y, 4.5, 70 * p.dmgMul, { burn: 4, kb: 4, cone: { a: p.a, arc: 1.4 } }); vfxAcid(p.x, p.y, p.a); Sfx.play('nova'); } },
  curse: { name: 'Maldición', cd: 12, use(p) { const l = enemiesNear(6); if (!l.length) return false; for (const e of l) { e.mark = 8; e.weak = 8; } vRing(p.x, p.y, 0.4, 6, 0.4, VR.void.slice(0, 5), 44); Sfx.play('summon'); } },
  soulsiphon: { name: 'Sifón de almas', cd: 18, use(p) { const l = enemiesNear(6); if (!l.length) return false; let tot = 0; for (const e of l) { const d = 30 * p.dmgMul; damageEnemy(e, d, { silent: true }); tot += d; vfxArc(e.x, e.y, p.x, p.y, 'pink', 0.4); } healP(tot * 0.4); Sfx.play('bolt'); } },
  // ----- Campeón
  earthshatter: { name: 'Rompetierra', cd: 12, use(p) { for (let k = 1; k <= 4; k++) later(k * 0.08, () => { const q = G.p, x = q.x + Math.cos(q.a) * k * 1.4, y = q.y + Math.sin(q.a) * k * 1.4; if (G.lv.solid(x, y)) return; aoe(x, y, 1.5, 80 * q.dmgMul, { stun: 1.2, kb: 6, silent: k > 1 }); vfxShock(x, y, 1.5); }); G.shake = Math.max(G.shake, 0.5); Sfx.play('boss'); } },
  bulwark: { name: 'Baluarte', cd: 20, use(p) { addBuff('bulwark', 'Baluarte', 6, { armor: 0.45 }, C.dim); p.riposte = 1.5; vfxDome('steel', 1.5); Sfx.play('blade'); } },
  heroic: { name: 'Golpe heroico', cd: 7, use(p) { const n = aoe(p.x, p.y, 2.6, 140 * p.dmgMul, { kb: 10, cone: { a: p.a, arc: 1.2 } }); p.swing = { t: 0, dur: 0.5, dir: 1, move: 'slash', strong: true }; G.shake = Math.max(G.shake, n ? 0.45 : 0.15); Sfx.play('hit'); } },
  // ----- Berserker
  frenzy: { name: 'Frenesí', cd: 14, use(p) { addBuff('frenzy', 'Frenesí', 10, { rate: 1.35, dmg: 1.15 }, C.red); ringFx(p.x, p.y, 1.8, rgb(255, 60, 40), 24); Sfx.play('roar'); } },
  bloodstorm: { name: 'Tormenta de sangre', cd: 12, use(p) { p.swing = { t: 0, dur: 0.9, dir: 1, spin: true }; for (let k = 0; k < 6; k++) later(k * 0.15, () => { const q = G.p, n = aoe(q.x, q.y, 3, 30 * q.dmgMul, { kb: 4 }); healP(n * 4); vRing(q.x, q.y, 0.4, 3, 0.2, VR.blood ? VR.blood.slice(0, 4) : VR.fire.slice(3, 7), 30); Sfx.play('swing'); }); } },
  deathwish: { name: 'Deseo de muerte', cd: 25, use(p) { if (p.hp < p.maxHp * 0.35) { logMsg('Estás demasiado débil', C.dim); return false; } p.hp -= p.maxHp * 0.3; addBuff('deathwish', 'Deseo de muerte', 8, { dmg: 1.8 }, C.red); G.hurtFx = 0.5; Sfx.play('roar'); } },
  // ----- Cambiaformas
  feralpounce: { name: 'Abalanzarse', cd: 7, use(p) { const t = nearestEnemy(8, true); if (!t) return false; const a = Math.atan2(t.y - p.y, t.x - p.x); leapTo(t.x - Math.cos(a) * 0.9, t.y - Math.sin(a) * 0.9); p.a = a; aoe(t.x, t.y, 1.6, 70 * p.dmgMul, { stun: 1.2, kb: 5 }); vfxShock(t.x, t.y, 1.6); Sfx.play('roar'); } },
  stampede: { name: 'Estampida', cd: 16, use(p) { for (let k = -1; k <= 1; k++) { const a = spawnAlly('wolf', p.x + Math.cos(p.a + k * 0.7) * 1.3, p.y + Math.sin(p.a + k * 0.7) * 1.3); if (a) a.life = 12; } } },
  primal: { name: 'Instinto primario', cd: 20, use(p) { addBuff('primal', 'Instinto primario', 8, { spd: 1.3, dmg: 1.3, regenPct: 0.02 }, C.green); ringFx(p.x, p.y, 1.8, rgb(120, 230, 120), 24); Sfx.play('roar'); } },
  // ----- Azote
  pestilence: { name: 'Pestilencia', cd: 16, use(p) { const l = enemiesNear(8).filter(e => e.poison > 0); if (!l.length) return false; for (const e of l) { aoe(e.x, e.y, 2, 40 * p.dmgMul, { poison: 5, corrode: 4, silent: true }); vRing(e.x, e.y, 0.2, 2, 0.3, VR.poison.slice(1, 5), 20); } Sfx.play('nova'); } },
  locust: { name: 'Plaga de langostas', cd: 12, use(p) { const a = aimPos(6); zoneAt(a.x, a.y, 4.2, 6, 14 * p.dmgMul, { slow: 2, poison: 2 }, 'plague', rgb(170, 200, 60)); if (typeof Ambient !== 'undefined' && G.cfg.ambient !== false) Ambient.bubbleBurst(); Sfx.play('summon'); } },
  rot: { name: 'Podredumbre', cd: 8, use(p) { fireProj({ spr: 'orbGreen', size: 0.6, spd: 9, dmg: 40 * p.dmgMul, pierce: 2, life: 2, r: 0.32, fx: { poison: 5, corrode: 5, slow: 1 } }); p.anim = 1; Sfx.play('shoot'); } },
  // ----- Archimago
  timestop: { name: 'Detener el tiempo', cd: 30, use(p) { const l = enemiesNear(10); for (const e of l) { e.stun = Math.max(e.stun || 0, e.def.boss ? 1 : 3); e.slow = 4; } vfxDome('cyan', 1); G.flashFx = 0.5; Sfx.play('portal'); } },
  blizzard: { name: 'Ventisca', cd: 14, use(p) { const t = nearestEnemy(SKILL_RANGE, true), a = t ? { x: t.x, y: t.y } : aimPos(6); zoneAt(a.x, a.y, 4, 6, 18 * p.dmgMul, { slow: 2.5 }, 'ice', rgb(170, 220, 255)); vfxIceNova(a.x, a.y, 4); Sfx.play('nova'); } },
  singularity: { name: 'Singularidad', cd: 18, use(p) { const a = aimPos(5); vfxBlackHole(a.x, a.y, 4.5); for (const e of G.enemies) { if (e.dead || e.def.boss) continue; const d = Math.hypot(e.x - a.x, e.y - a.y); if (d < 5 && G.lv.los(a.x, a.y, e.x, e.y)) { e.kx += (a.x - e.x) / (d || 1) * 10; e.ky += (a.y - e.y) / (d || 1) * 10; } } later(0.45, () => { aoe(a.x, a.y, 3, 100 * G.p.dmgMul, { slow: 3 }); G.shake = Math.max(G.shake, 0.5); Sfx.play('boss'); }); } },
  // ----- Caballero mágico
  spellblade: { name: 'Hoja hechizada', cd: 6, use(p) { for (let k = -1; k <= 1; k++) fireProj({ a: p.a + k * 0.22, spr: 'orbPurple', size: 0.8, spd: 11, dmg: 48 * p.dmgMul, pierce: 4, life: 1.1, r: 0.4, fx: { slow: 1 } }); p.swing = { t: 0, dur: 0.45, dir: -p.swingDir, move: 'rise', strong: true }; Sfx.play('swing'); } },
  arcanecharge: { name: 'Carga arcana', cd: 9, use(p) { dashStrike(5, 40 * p.dmgMul, { kb: 5, col: rgb(150, 120, 255) }); aoe(p.x, p.y, 3, 70 * p.dmgMul, { kb: 8, slow: 2 }); vfxEnergyNova(p.x, p.y, 3); } },
  mirrorward: { name: 'Égida reflectante', cd: 18, use(p) { addBuff('mirror', 'Égida reflectante', 5, { armor: 0.7 }, C.cyan); vfxDome('cyan', 5); Sfx.play('level'); } },
});

// descripciones (las lee la tarjeta de aprender habilidad, el Mentor y el códice)
const SKILL_DESC = {
  knives: 'Lanza tres cuchillos en abanico que atraviesan a un enemigo.',
  smoke: 'Bomba de humo: te vuelves invisible 3,5 s; el siguiente golpe desde las sombras hace más daño.',
  warcry: 'Empuja a los enemigos cercanos y te da +25% de daño durante 8 s.',
  shieldbash: 'Con el escudo en la mano: el escudo sale hacia delante, daña, empuja y aturde a los enemigos de delante.',
  whirlwind: 'Giras con el arma cinco veces dañando y empujando todo a tu alrededor.',
  rally: 'Estandarte: +20% de daño, -25% de daño recibido durante 10 s y te cura un 10%.',
  rage: 'Furia: +40% de daño, +25% de velocidad, +20% de cadencia y 12% de robo de vida durante 10 s.',
  leap: 'Saltas hacia delante y al caer aplastas, empujas y aturdes en un área grande.',
  fireball: 'Bola de fuego que estalla en un área y quema.',
  frostnova: 'Onda de escarcha a tu alrededor que daña, empuja y ralentiza.',
  chain: 'Rayo que salta entre hasta seis enemigos.',
  meteor: 'Marca el suelo y un meteoro cae un instante después: gran daño en área y quemaduras.',
  arcnova: 'Gran onda arcana que daña, empuja y ralentiza en un radio enorme.',
  enchant: 'Arma encantada: +30% de daño y +20% de cadencia durante 12 s; tus golpes lanzan proyectiles mágicos.',
  energyslash: 'Tajo de energía que avanza atravesando hasta cinco enemigos y los frena.',
  arcaneArmor: 'Escudo arcano que absorbe daño durante 10 s.',
  shadowstep: 'Apareces a la espalda del enemigo más cercano y te ocultas un instante.',
  vanish: 'Sigilo total durante 5 s.',
  clones: 'Invoca dos sombras aliadas que luchan a tu lado.',
  shadowburst: 'Abre un agujero negro delante de ti que absorbe, daña y ralentiza.',
  flurry: 'Saltas sobre el enemigo más cercano y das nueve estocadas seguidas siendo casi invulnerable.',
  riposte: 'Parada: el siguiente golpe que recibas se anula y contraatacas en área.',
  volley: 'Lluvia de nueve flechas en abanico.',
  trap: 'Coloca una trampa de acero que daña y aturde al primero que la pisa.',
  callwolf: 'Llama a un lobo aliado (hasta tres).',
  callbear: 'Llama a un oso aliado muy resistente.',
  imbue: 'Cambia el elemento de tus flechas: fuego, hielo o rayo.',
  arcvolley: 'Salva arcana de siete flechas mágicas que atraviesan.',
  selfbuff: 'Imbuirse: +30% de daño, +25% de cadencia y +10% de velocidad durante 9 s.',
  holynova: 'Luz sagrada que daña y empuja a tu alrededor y te cura un 20%.',
  divine: 'Escudo divino: invulnerable durante 2,5 s.',
  smite: 'Pilares de luz caen sobre hasta cinco enemigos a la vista.',
  aura: 'Aura sagrada: +25% de daño, regeneración y -15% de daño recibido durante 8 s.',
  bloodpact: 'Sacrificas un 20% de vida a cambio de +60% de daño y 15% de robo de vida durante 10 s.',
  fiend: 'Invoca un demonio aliado.',
  drain: 'Drena la vida de hasta tres enemigos cercanos y te cura.',
  thorns: 'Campo de zarzas que daña, ralentiza y envenena.',
  regrowth: 'Regeneración durante 6 s y una pequeña curación inmediata.',
  shapeshift: 'Cambias de forma: humano, lobo (veloz) u oso (resistente y brutal).',
  formskill: 'Lobo: aullido que aturde y te acelera. Oso: pisotón que aturde. Humano: regeneración.',
  plague: 'Nube de plaga que envenena, ralentiza y corroe la armadura.',
  swarm: 'Invoca tres arañas de pesadilla aliadas.',
  acid: 'Chorro de ácido en cono que envenena y corroe.',
  poisonblade: 'Hoja envenenada: durante 8 s tus golpes envenenan y hacen un 10% más de daño.',
  caltrops: 'Siembra abrojos a tus pies: dañan y ralentizan a quien los pisa durante 6 s.',
  charge: 'Embestida: cargas 4,5 m arrollando, empujando y aturdiendo a todo lo que pillas.',
  ironskin: 'Piel de hierro: -40% de daño recibido durante 6 s y te cura un 8%.',
  arcanebolt: 'Proyectil arcano rápido y barato que atraviesa a dos enemigos.',
  blink: 'Traslación: te teletransportas 5 m hacia delante y dejas una onda helada donde estabas.',
  deathmark: 'Marca al enemigo más cercano: recibe un 50% más de daño durante 8 s.',
  garrote: 'Degüellas al enemigo pegado a ti y lo aturdes; desde el sigilo hace x2,5.',
  piercing: 'Flecha perforante que atraviesa hasta seis enemigos y los frena.',
  hawkeye: 'Ojo de halcón: +25% de crítico y +15% de cadencia durante 10 s.',
  consecrate: 'Consagra el suelo a tu alrededor: daña y frena a los enemigos 6 s.',
  hammer: 'Lanzas un martillo de luz que aturde al primero que toca.',
  cleave: 'Tajo brutal en un arco enorme por delante que empuja.',
  bloodlust: 'Sed de batalla: +30% de daño y 10% de robo de vida durante 8 s.',
  entangle: 'Raíces: atrapan (aturden) y envenenan a todo lo que hay cerca.',
  moonbeam: 'Un rayo de luna cae sobre el enemigo más cercano: daño en área y lo frena.',
  icelance: 'Lanza de hielo que atraviesa a tres enemigos y los congela casi del todo.',
  firewall: 'Levanta un muro de fuego delante de ti que quema durante 6 s.',
  nightblades: 'Diez hojas de sombra salen disparadas en círculo a tu alrededor.',
  eclipse: 'Eclipse: aturde y frena a todos los enemigos cercanos y te oculta 4 s.',
  soulreap: 'Siega de almas: quita un 15% de su vida a los enemigos cercanos (4% a jefes); cada muerte te cura.',
  lunge: 'Estocada fulgurante: atraviesas 5 m de golpe hiriendo a todo lo que cruzas.',
  bladedance: 'Danza de acero: +50% de cadencia y +20% de velocidad 6 s, y esquivas el primer instante.',
  execute: 'Golpe de gracia: remata a un enemigo con menos del 35% de vida; si no, gran golpe crítico.',
  packrage: 'Furia de la manada: tus aliados se curan un 40% y pegan un 50% más durante 10 s.',
  beastroar: 'Rugido bestial que aturde y empuja a los enemigos y cura un 30% a tus aliados.',
  netshot: 'Disparas una red que estalla y deja atrapados (aturdidos) a los enemigos.',
  starfall: 'Lluvia estelar: siete estrellas caen sobre el enemigo más cercano y alrededor.',
  runicarrow: 'Flecha rúnica que estalla con el elemento que tengan tus flechas.',
  phasearrow: 'Flecha espectral que atraviesa a todos los enemigos que encuentra.',
  judgment: 'Sentencia: gran explosión sagrada a tu alrededor que aturde y empuja.',
  guardian: 'Ángel guardián: -30% de daño recibido y gran regeneración durante 10 s.',
  sanctuary: 'Santuario: suelo sagrado que daña a los enemigos; dentro recibes un 70% menos de daño.',
  hellfire: 'Fuego infernal en cono que quema con fuerza.',
  curse: 'Maldición: los enemigos cercanos reciben +50% de daño y hacen un 30% menos durante 8 s.',
  soulsiphon: 'Sifón de almas: absorbe vida de todos los enemigos cercanos y te cura.',
  earthshatter: 'Rompetierra: una grieta avanza delante de ti aturdiendo y empujando.',
  bulwark: 'Baluarte: -55% de daño recibido 6 s y el primer golpe que te den lo devuelves.',
  heroic: 'Golpe heroico: un mandoble demoledor por delante.',
  frenzy: 'Frenesí: +35% de cadencia y +15% de daño durante 10 s.',
  bloodstorm: 'Tormenta de sangre: seis giros que dañan alrededor y te curan por cada enemigo golpeado.',
  deathwish: 'Deseo de muerte: pierdes un 30% de vida a cambio de +80% de daño durante 8 s.',
  feralpounce: 'Te abalanzas sobre el enemigo más cercano, lo aturdes y dañas en área.',
  stampede: 'Estampida: tres lobos salvajes salen a luchar durante 12 s.',
  primal: 'Instinto primario: +30% de velocidad y daño, y regeneración durante 8 s.',
  pestilence: 'Pestilencia: cada enemigo envenenado cercano estalla en una nube de veneno y ácido.',
  locust: 'Plaga de langostas: una gran nube que frena y envenena durante 6 s.',
  rot: 'Proyectil de podredumbre que envenena, corroe y frena.',
  timestop: 'Detener el tiempo: los enemigos cercanos quedan congelados 3 s (los jefes, 1 s).',
  blizzard: 'Ventisca sobre el enemigo más cercano: daña y ralentiza durante 6 s.',
  singularity: 'Singularidad: atrae a los enemigos hacia un punto y luego estalla.',
  spellblade: 'Hoja hechizada: tres tajos de energía en abanico que atraviesan.',
  arcanecharge: 'Carga arcana: te lanzas hacia delante y estallas al llegar.',
  mirrorward: 'Égida reflectante: -30% de daño recibido y devuelves el doble de lo que te hacen durante 5 s.',
};
for (const k in SKILL_DESC) if (SKILLS[k]) SKILLS[k].desc = SKILL_DESC[k];

// 3 habilidades activas (R, C, V) elegidas entre las aprendidas en la partida
function skillOf(i) { const id = G.p.active && G.p.active[i]; return id ? SKILLS[id] : null; }
function useSkill(i) {
  const p = G.p;
  if (G.state !== 'play') return;
  const sk = skillOf(i);
  if (!sk || p.skillCd[i] > 0) return;
  const id = p.active[i], lv = skLv(id), cdr = classPassive(p.cls, 'cdr', 1) * (1 - SKB.cd * lv);
  if (withSk(lv ? { id, lv, extra: lv } : null, () => sk.use(p)) === false) return;
  p.skillCd[i] = sk.cd * cdr; p.skillMax[i] = sk.cd * cdr;
}

// texto de la carta "Mejorar ...": qué gana según en qué se basa la habilidad
function skillUpgradeTags(id) {
  const src = String(SKILLS[id].use), t = [];
  if (/fireProj|fanOfArrows/.test(src)) t.push('proj');
  if (/zoneAt|G\.zones\.push/.test(src)) t.push('zone');
  if (/chainFrom/.test(src)) t.push('chain');
  if (/spawnAlly/.test(src)) t.push('ally');
  if (/absorb/.test(src)) t.push('shield');
  if (/stun|slow/.test(src) && !t.includes('zone')) t.push('cc');
  if (/aoe\(|enemiesNear/.test(src) && !t.includes('zone')) t.push('area');
  if (/addBuff|stealth/.test(src)) t.push('time');
  if (/healP/.test(src)) t.push('heal');
  if (/dmgMul/.test(src) && t.length < 2) t.push('dmg');
  return t;
}
function skillUpgradeDesc(id) {
  const en = G.cfg && G.cfg.lang === 'en';
  const T = en
    ? { proj: '+1 projectile', zone: 'bigger, longer zone that slows more', chain: '+1 jump', ally: 'stronger summons', shield: 'bigger shield', cc: 'longer stun and slow', area: 'bigger area', time: 'lasts longer', heal: 'heals more', dmg: '+15% damage', cd: '-10% cooldown' }
    : { proj: '+1 proyectil', zone: 'zona más grande, duradera y que frena más', chain: '+1 salto', ally: 'invocaciones más fuertes', shield: 'escudo mayor', cc: 'aturde y frena más tiempo', area: 'más radio', time: 'dura más', heal: 'cura más', dmg: '+15% de daño', cd: '-10% de recarga' };
  return skillUpgradeTags(id).slice(0, 2).concat('cd').map(k => T[k]).join(', ');
}
