// Habilidades activas, efectos de estado, aliados, trampas y zonas
// ---------------------------------------------------------------- Utilidades
function aimPos(dist) {
  const p = G.p; let d = 0;
  while (d < dist && !G.lv.solid(p.x + Math.cos(p.a) * (d + 0.25), p.y + Math.sin(p.a) * (d + 0.25))) d += 0.25;
  return { x: p.x + Math.cos(p.a) * d, y: p.y + Math.sin(p.a) * d };
}
function enemiesIn(x, y, r) { return G.enemies.filter(e => !e.dead && Math.hypot(e.x - x, e.y - y) <= r + e.def.r); }
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
function lineFx(x0, y0, x1, y1, col, n = 14) {
  for (let i = 0; i < n; i++) { const t = i / n; G.parts.push({ x: lerp(x0, x1, t), y: lerp(y0, y1, t), z: 0.4, vx: 0, vy: 0, vz: 0.3, life: 0.3, col, add: true, size: 0.06 }); }
}
function healP(n) {
  const p = G.p; if (n <= 0) return;
  p.hp = Math.min(p.maxHp, p.hp + n);
  if (n >= 4 && G.time - (G.healFxT || 0) > 0.4) { G.healFxT = G.time; vfxHeal(Math.min(14, 4 + Math.round(n / 4))); }
}
function later(t, fn) { G.timers.push({ t, fn }); }

function applyFx(e, o) {
  if (!o || e.dead) return;
  const dm = G.p.dmgMul || 1;
  if (o.slow) e.slow = Math.max(e.slow, o.slow);
  if (o.stun) e.stun = Math.max(e.stun || 0, o.stun * (e.def.boss ? 0.3 : 1));
  if (o.burn) { e.burn = Math.max(e.burn || 0, o.burn); e.burnDps = Math.max(e.burnDps || 0, 6 * dm); }
  if (o.poison) { e.poison = Math.max(e.poison || 0, o.poison); e.poisDps = Math.max(e.poisDps || 0, 4 * dm * (typeof setCount === 'function' && setCount('reina') >= 2 ? 1.5 : 1)); }
  if (o.corrode) e.corrode = Math.max(e.corrode || 0, o.corrode);
}

function aoe(x, y, r, dmg, o = {}) {
  let n = 0;
  for (const e of G.enemies) {
    if (e.dead) continue;
    const dx = e.x - x, dy = e.y - y, d = Math.hypot(dx, dy);
    if (d > r + e.def.r) continue;
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
  const ex = p.buffs.find(b => b.id === id);
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
  dmg *= 1 + eqStat('dmg'); crit += eqStat('crit'); rate *= 1 + eqStat('rate'); armor *= Math.max(0.3, 1 - eqStat('armor') - setArmor()); crit += setCrit(); spd *= 1 + eqStat('spd'); leech += eqStat('leech'); if (eqSpecial('sangre')) leech += 0.03;
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
    a.atk -= dt; a.flash -= dt;
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
      damageEnemy(tgt, a.dmg * rand(0.9, 1.1), { kx: dx / dist * 2, ky: dy / dist * 2, silent: false });
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
    if (Math.random() < dt * 18) (z.kind === 'plague' ? vfxPoisonTick : vfxThornsTick)(z);
    if (z.tick <= 0) {
      z.tick = 0.5;
      for (const e of enemiesIn(z.x, z.y, z.r)) {
        if (z.dmg) damageEnemy(e, z.dmg, { silent: true });
        applyFx(e, z.fx);
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
    const t = nearestEnemy(11, true); if (!t) return false;
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
      const t = nearestEnemy(11, false, p.x, p.y, done); if (!t) break;
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
  } },
  swarm: { name: 'Enjambre de pesadilla', cd: 20, use(p) {
    for (let i = 0; i < 3; i++) spawnAlly('spider', p.x + Math.cos(p.a + (i - 1) * 0.8) * 1.4, p.y + Math.sin(p.a + (i - 1) * 0.8) * 1.4);
  } },
  acid: { name: 'Ácido corrosivo', cd: 9, use(p) {
    const n = aoe(p.x, p.y, 5.5, 22 * p.dmgMul, { cone: { a: p.a, arc: 1.5 }, poison: 5, corrode: 6, kb: 2 });
    vfxAcid(p.x, p.y, p.a);
    p.anim = 1; Sfx.play('swing');
  } },
};

function skillOf(i) { const id = CLASSES[G.p.cls].skills[i]; return id ? SKILLS[id] : null; }
function useSkill(i) {
  const p = G.p;
  if (G.state !== 'play') return;
  const sk = skillOf(i);
  if (!sk || p.skillCd[i] > 0) return;
  const cdr = classPassive(p.cls, 'cdr', 1);
  if (sk.use(p) === false) return;
  p.skillCd[i] = sk.cd * cdr; p.skillMax[i] = sk.cd * cdr;
}
