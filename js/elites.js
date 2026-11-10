// Más dificultad: enemigos élite con rasgos, ataques que se anuncian en el suelo, chamanes que apoyan a los demás,
// grupos que te rodean, pactos opcionales al entrar en una mazmorra y modo pesadilla.

// ---------------------------------------------------------------- Élites
// De vez en cuando un enemigo normal sale con un rasgo: más grande, con aura y nombre, x3 de vida y mejor botín.
const ELITE_AFFIX = {
  rapido:    { name: 'veloz',       col: [120, 220, 255], desc: 'Mucho más rápido' },
  vampiro:   { name: 'vampírico',   col: [230, 40, 60],   desc: 'Se regenera sin parar' },
  explosivo: { name: 'explosivo',   col: [255, 140, 40],  desc: 'Estalla al morir: aléjate' },
  reflejo:   { name: 'reflectante', col: [210, 210, 255], desc: 'Devuelve parte de tus proyectiles' },
  invocador: { name: 'invocador',   col: [170, 90, 255],  desc: 'Llama a esqueletos' },
};
const NO_ELITE = new Set(['worm', 'ghost', 'shaman']);
function eliteChance() {
  const n = G.dg ? G.dg.n : 1;
  return Math.min(0.3, (0.04 + 0.01 * (n - 1)) * (G.pact === 'elites' ? 3 : 1) * (G.nightmare ? 1.6 : 1));
}
function maybeElite(e) {
  if (G.noElite || e.def.boss || NO_ELITE.has(e.type) || Math.random() >= eliteChance()) return;
  makeElite(e, pick(Object.keys(ELITE_AFFIX)));
}
function makeElite(e, aff) {
  e.elite = aff; e.hp *= 3; e.maxHp *= 3; e.dmgM *= 1.25; e.big = 1.2;
  if (aff === 'rapido') e.spd *= 1.5;
  e.sumT = 3;
}
function eliteName(e) { return `${e.def.name} ${ELITE_AFFIX[e.elite].name}`; }
function updateElites(dt) {
  const p = G.p;
  for (const e of G.enemies) {
    if (!e.elite || e.dead || e.sleep) continue;
    const A = ELITE_AFFIX[e.elite];
    if (Math.random() < dt * 5) burst(e.x + rand(-0.3, 0.3), e.y + rand(-0.3, 0.3), rand(0.1, 0.9), 1, rgb(A.col[0], A.col[1], A.col[2]), 0.5, 0.6);
    if (e.elite === 'vampiro') e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.025 * dt);
    if (e.elite === 'invocador') {
      e.sumT -= dt;
      if (e.sumT <= 0) {
        e.sumT = 8;
        const mine = G.enemies.filter(q => !q.dead && q.master === e).length;
        if (mine < 4) {
          G.noElite = true;
          for (let k = 0; k < 2; k++) { const s = spawnEnemy('skeleton', e.x + rand(-0.8, 0.8), e.y + rand(-0.8, 0.8)); if (G.lv.blocked(s.x, s.y, 0.25)) { s.x = e.x; s.y = e.y; } s.sleep = false; s.master = e; }
          G.noElite = false;
          vRing(e.x, e.y, 0.05, 1.5, 0.4, VR.arcane.slice(1, 5), 24); Sfx.play('summon');
        }
      }
    }
    // la barra de la élite aparece al tenerla cerca y a la vista
    if (!G.elite || G.elite.dead || !G.enemies.includes(G.elite)) { if (e.los && Math.hypot(e.x - p.x, e.y - p.y) < 9) G.elite = e; }
  }
}
// al morir: botín mejor y, si era explosiva, estalla tras avisar en el suelo
function eliteKilled(e) {
  if (!e.elite) return;
  if (G.elite === e) G.elite = null;
  G.pickups.push({ type: 'gold', x: e.x, y: e.y, v: Math.round(12 * G.floor * lootMul()), t: 0 });
  if (Math.random() < 0.7) dropItem('ghost', e.x + 0.3, e.y + 0.2);
  for (let k = 0; k < 3; k++) dropGem(e.x + rand(-0.5, 0.5), e.y + rand(-0.5, 0.5), e.def.xp * 2);
  if (e.elite === 'explosivo') {
    const x = e.x, y = e.y, dmg = Math.max(12, (e.def.dmg || 10) * 1.6) * e.dmgM;
    addTele(x, y, 2.2, 0.8, () => {
      vfxExplosion(x, y, 2.2); G.shake = Math.max(G.shake, 0.4); Sfx.play('nova');
      if (Math.hypot(G.p.x - x, G.p.y - y) < 2.2) hurtPlayer(Math.round(dmg), x, y);
    });
  }
}
// proyectiles: la élite reflectante devuelve el 40%
function eliteReflect(e, pr) {
  if (e.elite !== 'reflejo' || Math.random() > 0.4) return false;
  pr.friendly = false; pr.vx = -pr.vx; pr.vy = -pr.vy; pr.dmg = 9 * e.dmgM; pr.hit = new Set(); pr.life = 1.2;
  vfxImpact(pr.x, pr.y, 0.45, 'steel', 0.8); Sfx.play('blade');
  return true;
}

// ---------------------------------------------------------------- Ataques anunciados
// Los grandes (orco, yeti, oso, guerrero abisal, Guardián) marcan el suelo donde estás y golpean un instante después.
const SLAM = { orc: 1, yeti: 1, bearE: 1, deepwarrior: 1, boss: 1, cowking: 1 };
function addTele(x, y, r, t, fn) { (G.teles || (G.teles = [])).push({ x, y, r, t, max: t, fn }); }
function updateTeles(dt) {
  if (!G.teles || !G.teles.length) return;
  for (const s of G.teles) {
    s.t -= dt;
    const k = 1 - Math.max(0, s.t) / s.max, R = VR.fire;
    // borde del círculo y un relleno que crece hasta el impacto
    for (let i = 0; i < 14; i++) { const a = rand(0, TAU); vp({ x: s.x + Math.cos(a) * s.r, y: s.y + Math.sin(a) * s.r, z: 0.03, life: 0.12, ramp: [R[4], R[6]], s0: 0.1, maxPx: 5, add: true }); }
    for (let i = 0; i < 8; i++) { const a = rand(0, TAU), q = Math.sqrt(Math.random()) * s.r * k; vp({ x: s.x + Math.cos(a) * q, y: s.y + Math.sin(a) * q, z: 0.03, life: 0.1, ramp: [R[3], R[5]], s0: 0.07, maxPx: 4, add: true }); }
    if (s.t <= 0 && !s.done) { s.done = true; s.fn(); }
  }
  G.teles = G.teles.filter(s => !s.done);
}
// ¿el jugador está dentro de un golpe anunciado? (la pantalla destella en rojo para que salga)
function inTele() { const p = G.p; return !!(G.teles && G.teles.some(s => Math.hypot(p.x - s.x, p.y - s.y) < s.r)); }
function slamAI(e, d, dt, dist) {
  if (!SLAM[e.type]) return;
  const p = G.p;
  e.slamCd = (e.slamCd ?? rand(2, 5)) - dt;
  if (e.slamT > 0) { e.slamT -= dt; return; }
  if (e.slamCd <= 0 && e.los && dist < 2.8 && !(e.stun > 0)) {
    e.slamCd = d.boss ? 4 : rand(4.5, 6.5); e.slamT = 0.85;
    const x = p.x, y = p.y, r = d.boss ? 2.4 : 1.9, dmg = d.dmg * e.dmgM * 2.2;
    addTele(x, y, r, 0.85, () => {
      if (e.dead) return;
      vfxShock(x, y, r); G.shake = Math.max(G.shake, 0.45); Sfx.play('boss');
      if (Math.hypot(G.p.x - x, G.p.y - y) < r) hurtPlayer(Math.round(dmg), e.x, e.y);
    });
    Sfx.play('roar');
  }
}

// ---------------------------------------------------------------- Chamanes
// Se quedan atrás, curan a los suyos y los protegen (reciben la mitad de daño unos segundos): ve a por ellos primero.
function supportAI(e, d, dt) {
  if (!d.support) return;
  e.supT = (e.supT ?? rand(1, 3)) - dt;
  if (e.supT > 0) return;
  e.supT = d.support.cd;
  const near = G.enemies.filter(q => q !== e && !q.dead && !q.sleep && Math.hypot(q.x - e.x, q.y - e.y) < d.support.r && G.lv.los(e.x, e.y, q.x, q.y));
  if (!near.length) return;
  near.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
  for (const q of near.slice(0, 4)) {
    q.hp = Math.min(q.maxHp, q.hp + q.maxHp * d.support.heal); q.ward = d.support.ward;
    vfxArc(e.x, e.y, q.x, q.y, 'heal', 0.35);
    burst(q.x, q.y, 0.6, 5, rgb(140, 255, 150), 1.2, 0.5);
  }
  Sfx.play('potion');
}

// ---------------------------------------------------------------- Grupos que rodean
// Parte de los enemigos cuerpo a cuerpo no van en línea recta: se abren hacia tus flancos y cierran desde los lados.
function flankTarget(e, d, dist) {
  if (!e.flank || d.ranged || d.fly || d.boss || dist < 1.8 || dist > 8 || !e.los) return null;
  const p = G.p, a = Math.atan2(e.y - p.y, e.x - p.x) + e.flank, r = dist * 0.6;
  const x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r;
  return G.lv.blocked(x, y, 0.3) || !G.lv.los(e.x, e.y, x, y) ? null : { x, y };
}

// ---------------------------------------------------------------- Pactos
// Al entrar en una mazmorra nueva puedes aceptar una maldición a cambio de más oro y mejor botín.
const PACTS = {
  prisa:    { name: 'Enemigos frenéticos', desc: 'Los enemigos son un 20% más rápidos', bonus: 0.3 },
  ciego:    { name: 'A ciegas', desc: 'Sin minimapa ni mapa', bonus: 0.25 },
  antorcha: { name: 'Mecha corta', desc: 'Las antorchas duran la mitad', bonus: 0.25 },
  sangre:   { name: 'Sangre fría', desc: 'Curas, pociones y regeneración a la mitad', bonus: 0.35 },
  horda:    { name: 'La horda', desc: 'Una oleada cada 80 segundos', bonus: 0.35 },
  elites:   { name: 'Campeones', desc: 'El triple de enemigos élite', bonus: 0.3 },
  cristal:  { name: 'Cristal', desc: 'Recibes un 20% más de daño', bonus: 0.4 },
};
function lootMul() { return (1 + (G.pact && PACTS[G.pact] ? PACTS[G.pact].bonus : 0)) * (G.nightmare ? 2 : 1); }
function healMul() { return G.pact === 'sangre' ? 0.5 : 1; }
function waveEvery() { return G.pact === 'horda' ? 80 : 120; }
// rareza: con pacto o pesadilla, a veces se vuelve a tirar y se queda la mejor
const RAR_ORDER = ['comun', 'raro', 'epico', 'legendario'];
function luckyRarity(src, rar) {
  let best = rar;
  const extra = (lootMul() - 1) + (G.nightmare ? 0.5 : 0);
  if (extra > 0 && Math.random() < extra) { const r2 = rollRarity(src); if (RAR_ORDER.indexOf(r2) > RAR_ORDER.indexOf(best)) best = r2; }
  if (G.nightmare && best === 'comun') best = 'raro'; // en pesadilla no cae nada común
  return best;
}
function openPacts(after) {
  const ids = Object.keys(PACTS).sort(() => Math.random() - 0.5).slice(0, 3);
  G.pactOpts = ids; G.pactAfter = after; G.state = 'pact'; mouse.fire = false;
  if (document.exitPointerLock) document.exitPointerLock();
  Sfx.play('shrine');
}
function choosePact(i) {
  if (G.state !== 'pact' || !G.pactOpts) return;
  if (i < 0 || i > G.pactOpts.length) return;
  G.pact = i < G.pactOpts.length ? G.pactOpts[i] : null;
  const f = G.pactAfter; G.pactOpts = null; G.pactAfter = null;
  f();
  if (G.pact) { const P = PACTS[G.pact]; toast(`PACTO: ${P.name.toUpperCase()}`, true); logMsg(`Pacto: ${P.desc} (+${Math.round(P.bonus * 100)}% de oro y botín)`, C.red); Sfx.play('roar'); }
}
