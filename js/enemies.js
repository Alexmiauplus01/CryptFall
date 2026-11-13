// Enemigos: tabla de datos, aparición y oleadas, dificultad (se miden contigo), IA, daño, muerte y jefes.
// Se carga justo antes de game.js; todo lo de aquí son datos y funciones que se usan ya en partida.

const PLAYER_R = 0.3; // radio con el que los enemigos se plantan delante del jugador

// ---------------------------------------------------------------- Datos
// h = altura en el mundo (1 = altura de pared); el ancho sale de la proporción del sprite
const ENEMY = {
  skeleton: { name: 'Esqueleto', hp: 24, spd: 1.75, dmg: 8, r: 0.3, h: 0.8, z: 0, spr: 'skeleton', xp: 1 },
  bat:      { name: 'Murciélago', hp: 9, spd: 3.5, dmg: 5, r: 0.22, h: 0.42, z: 0.32, spr: 'bat', xp: 1, fly: true },
  slime:    { name: 'Slime', hp: 46, spd: 1.0, dmg: 12, r: 0.38, h: 0.5, z: 0, spr: 'slime', xp: 3 },
  wraith:   { name: 'Espectro', hp: 22, spd: 1.5, dmg: 0, r: 0.3, h: 0.85, z: 0.06, spr: 'wraith', xp: 3, ranged: { cd: 2.6, dmg: 11, spd: 4.2, proj: 'orbGreen', keep: 5.5 } },
  imp:      { name: 'Diablillo', hp: 34, spd: 2.2, dmg: 8, r: 0.3, h: 0.6, z: 0, spr: 'imp', xp: 4, ranged: { cd: 2.0, dmg: 12, spd: 6, proj: 'orbRed', keep: 3.5 } },
  ghost:    { name: 'Fantasma', hp: 200, spd: 2.1, dmg: 12, r: 0.3, h: 0.88, z: 0.05, spr: 'ghost_melee', xp: 15, elite: true },
  zombie:   { name: 'Necrófago', hp: 58, spd: 1.0, dmg: 14, r: 0.32, h: 0.8, z: 0, spr: 'zombie', xp: 3 },
  cultist:  { name: 'Acólito', hp: 30, spd: 1.6, dmg: 0, r: 0.3, h: 0.82, z: 0, spr: 'cultist', xp: 4, ranged: { cd: 2.3, dmg: 12, spd: 6, proj: 'orbPurple', keep: 5 } },
  spider:   { name: 'Araña', hp: 16, spd: 3.1, dmg: 7, r: 0.3, h: 0.52, z: 0, spr: 'spiderE', xp: 2 },
  wolfE:    { name: 'Lobo hambriento', hp: 28, spd: 3.7, dmg: 9, r: 0.3, h: 0.55, z: 0, spr: 'wolfE', xp: 2, pack: [2, 3] },
  bearE:    { name: 'Oso de las cavernas', hp: 140, spd: 1.5, dmg: 21, r: 0.5, h: 1.0, z: 0, spr: 'bearE', xp: 8, charge: { cd: 7, mul: 2.5, dur: 0.9, min: 2.5, max: 7 } },
  shaman:   { name: 'Chamán', hp: 34, spd: 1.5, dmg: 0, r: 0.28, h: 0.66, z: 0, spr: 'shaman', xp: 5, ranged: { cd: 3, dmg: 7, spd: 5.5, proj: 'orbGreen', keep: 7.5 }, support: { cd: 4, r: 6.5, heal: 0.2, ward: 3 } },
  // secretos: solo en El Prado Maldito
  cowwarrior: { name: 'Vaca guerrera', hp: 70, spd: 2.5, dmg: 15, r: 0.34, h: 1.0, z: 0, spr: 'cowwarrior', xp: 6, pack: [2, 4] },
  cowmage:  { name: 'Vaca maga', hp: 42, spd: 1.6, dmg: 0, r: 0.32, h: 0.95, z: 0, spr: 'cowmage', xp: 6, ranged: { cd: 2.4, dmg: 12, spd: 6, proj: 'orbGreen', keep: 6, spread: 3 } },
  hound:    { name: 'Can infernal', hp: 34, spd: 3.5, dmg: 11, r: 0.32, h: 0.55, z: 0, spr: 'hound', xp: 3 },
  eye:      { name: 'Ojo del vacío', hp: 40, spd: 1.2, dmg: 0, r: 0.3, h: 0.55, z: 0.35, spr: 'eye', xp: 4, fly: true, ranged: { cd: 1.9, dmg: 12, spd: 7, proj: 'orbPurple', keep: 6 } },
  // temáticas nuevas: Cuevas Heladas, Cloacas, Templo Hundido
  yeti:        { name: 'Yeti', hp: 120, spd: 1.35, dmg: 19, r: 0.5, h: 1.55, z: 0, spr: 'yeti', xp: 7, charge: { cd: 6, mul: 2.8, dur: 1.0, min: 2.5, max: 8 } },
  icewisp:     { name: 'Fuego fatuo helado', hp: 26, spd: 2.0, dmg: 0, r: 0.28, h: 0.62, z: 0.35, spr: 'icewisp', xp: 3, fly: true, ranged: { cd: 2.2, dmg: 9, spd: 6.5, proj: 'orbIce', keep: 5, chill: 2 } },
  rat:         { name: 'Rata mutante', hp: 15, spd: 3.4, dmg: 5, r: 0.26, h: 0.42, z: 0, spr: 'rat', xp: 1, pack: [3, 4], bite: { poison: 3, dps: 2.5 } },
  deepwarrior: { name: 'Guerrero abisal', hp: 72, spd: 1.9, dmg: 15, r: 0.32, h: 1.0, z: 0, spr: 'deepwarrior', xp: 5 },
  deepmage:    { name: 'Hechicero abisal', hp: 40, spd: 1.5, dmg: 0, r: 0.3, h: 1.0, z: 0, spr: 'deepmage', xp: 5, ranged: { cd: 2.6, dmg: 10, spd: 6, proj: 'orbPurple', keep: 6, spread: 3 } },
  // vampiros, nigromantes, furias, espectros malignos, goblins, orcos y gusanos
  vampspawn:   { name: 'Engendro vampírico', hp: 40, spd: 2.8, dmg: 9, r: 0.3, h: 0.8, z: 0, spr: 'vampspawn', xp: 4, drain: 1.2 },
  vampire:     { name: 'Vampiro noble', hp: 95, spd: 2.0, dmg: 15, r: 0.3, h: 0.88, z: 0, spr: 'vampire', xp: 9, drain: 1, blink: { cd: 5 } },
  vampbat:     { name: 'Murciélago vampiro', hp: 12, spd: 3.6, dmg: 5, r: 0.22, h: 0.42, z: 0.32, spr: 'vampbat', xp: 2, fly: true, drain: 2, pack: [2, 3] },
  necromancer: { name: 'Nigromante', hp: 55, spd: 1.3, dmg: 0, r: 0.3, h: 0.85, z: 0, spr: 'necromancer', xp: 7, ranged: { cd: 2.6, dmg: 11, spd: 5.5, proj: 'orbGreen', keep: 6 }, summon: { cd: 9, type: 'skeleton', n: 2, max: 4 } },
  fury:        { name: 'Furia', hp: 45, spd: 3.0, dmg: 12, r: 0.3, h: 0.85, z: 0.25, spr: 'fury', xp: 6, fly: true, charge: { cd: 4, mul: 2.2, dur: 0.8, min: 2, max: 7 } },
  malevolent:  { name: 'Espectro maligno', hp: 40, spd: 1.6, dmg: 0, r: 0.3, h: 0.85, z: 0.06, spr: 'malevolent', xp: 6, ranged: { cd: 2.2, dmg: 13, spd: 5, proj: 'orbRed', keep: 5 }, phase: { on: 1.6, off: 3 } },
  goblin:      { name: 'Goblin', hp: 18, spd: 3.0, dmg: 6, r: 0.26, h: 0.55, z: 0, spr: 'goblin', xp: 1, pack: [3, 4] },
  goblinarcher:{ name: 'Goblin arquero', hp: 16, spd: 2.4, dmg: 0, r: 0.26, h: 0.55, z: 0, spr: 'goblinarcher', xp: 2, ranged: { cd: 2.0, dmg: 8, spd: 9, proj: 'orbArrow', keep: 6 } },
  harpy:       { name: 'Arpía', hp: 34, spd: 3.1, dmg: 10, r: 0.3, h: 0.85, z: 0.3, spr: 'harpy', xp: 5, fly: true, charge: { cd: 3.5, mul: 2.4, dur: 0.7, min: 2, max: 8 }, hitrun: 1.6 },
  orc:         { name: 'Orco', hp: 95, spd: 1.6, dmg: 17, r: 0.38, h: 1.0, z: 0, spr: 'orc', xp: 7 },
  worm:        { name: 'Gusano gigante', hp: 260, spd: 0, dmg: 14, r: 0.5, h: 1.0, z: 0, spr: 'worm', xp: 15, block: true, worm: { cd: 3.2, open: 1.9, dps: 4 } },
  lich:     { name: 'EL LICHE', hp: 470, spd: 1.3, dmg: 18, r: 0.5, h: 1.75, z: 0, spr: 'lich', xp: 60, boss: true, ai: 'lich' },
  queen:    { name: 'LA REINA ARAÑA', hp: 560, spd: 1.9, dmg: 20, r: 0.6, h: 1.3, z: 0, spr: 'queen', xp: 60, boss: true, ai: 'queen' },
  voidlord: { name: 'EL OJO PRIMIGENIO', hp: 500, spd: 1.0, dmg: 16, r: 0.6, h: 1.6, z: 0.2, spr: 'voidlord', xp: 60, boss: true, ai: 'eye' },
  lilith:   { name: 'LILITH', hp: 520, spd: 2.0, dmg: 18, r: 0.45, h: 1.5, z: 0.05, spr: 'lilith', xp: 60, boss: true, ai: 'lilith', drain: 1 },
  cthulhu:  { name: 'CTHULHU', hp: 650, spd: 0.9, dmg: 24, r: 0.7, h: 1.8, z: 0, spr: 'cthulhu', xp: 60, boss: true, ai: 'cthulhu' },
  dragon:   { name: 'EL DRAGÓN ROJO', hp: 600, spd: 1.5, dmg: 22, r: 0.7, h: 1.9, z: 0, spr: 'dragon', xp: 60, boss: true, ai: 'dragon', charge: { cd: 8, mul: 2.4, dur: 0.9, min: 3, max: 9 } },
  cowking:  { name: 'EL REY VACA', hp: 760, spd: 1.6, dmg: 26, r: 0.6, h: 2.0, z: 0, spr: 'cowking', xp: 90, boss: true, charge: { cd: 7, mul: 2.4, dur: 0.9, min: 3, max: 9 } },
  boss:     { name: 'EL GUARDIÁN', hp: 520, spd: 1.5, dmg: 22, r: 0.55, h: 1.75, z: 0, spr: 'boss', xp: 60, boss: true },
};

// ---------------------------------------------------------------- Aparición, oleadas y dificultad
function pickType() {
  const t = G.t, f = G.floor;
  const pool = [['skeleton', 8], ['bat', 5]];
  if (t > 14 || f > 1) pool.push(['slime', 2 + f * 0.6]);
  if (t > 28 || f > 1) pool.push(['wraith', 1 + f * 0.8]);
  if (t > 42 || f > 2) pool.push(['imp', 1 + f * 0.6]);
  // fauna propia de cada temática: [tipo, peso, +peso por piso, aparece tras N s (o desde el piso 2)]
  const th = THEMES[(G.popTheme ?? (G.lv ? G.lv.theme : 0)) % THEMES.length];
  if (th.secret) pool.length = 0; // en el prado solo hay vacas
  for (const [type, w, perF = 0, minT = 0] of th.fauna) if (!minT || t > minT || f > 1) pool.push([type, w + perF * f]);
  let tot = 0; for (const [, w] of pool) tot += w;
  let r = Math.random() * tot;
  for (const [n, w] of pool) { if ((r -= w) <= 0) return n; }
  return 'skeleton';
}

// Enemigos a tu medida: al entrar en cada mazmorra se toman tus estadísticas (daño, cadencia, críticos, vida, armadura)
// y se comparan con las de tu clase recién empezada. Los enemigos crecen en la misma proporción y siempre un 25% más:
// su vida sigue a tu daño y su daño sigue a tu aguante. Nunca baja de una mazmorra a la siguiente.
const DG_EDGE = 1.25;
function playerPower(p) {
  const off = p.dmgMul * p.rate * (1 + p.crit) * (1 + 0.5 * ((p.multi || 1) - 1)) * (1 + (p.leech || 0));
  const def = p.maxHp / Math.max(0.2, p.armor) * (1 + (p.regen || 0) / 10);
  return { off, def };
}
function classBasePower(cls) {
  const cm = classMods(lineageOf(cls)[0]);
  return { off: cm.dmg * cm.rate * (1.05 + cm.crit) * (1 + cm.leech), def: 100 * cm.hp / Math.max(0.2, cm.armor) };
}
// cada minuto se vuelven a medir tus estadísticas y los enemigos (también los que ya están vivos) se ajustan
function rescaleEnemies(dt) {
  G.scaleT = (G.scaleT ?? 60) - dt;
  if (G.scaleT > 0) return;
  G.scaleT = 60;
  const old = G.dgScale || { hp: DG_EDGE, dmg: DG_EDGE };
  scaleToPlayer();
  const nw = G.dgScale, rh = nw.hp / old.hp, rd = nw.dmg / old.dmg;
  if (rh <= 1.001 && rd <= 1.001) return;
  for (const e of G.enemies) if (!e.dead && e.type !== 'ghost') { e.hp *= rh; e.maxHp *= rh; e.dmgM *= rd; }
  if (rh > 1.05) logMsg('Los enemigos se hacen más fuertes', C.red);
}
function scaleToPlayer() {
  const p = G.p; if (!p || !p.base) return;
  const buffs = p.buffs; p.buffs = []; applyStats(); // sin mejoras temporales (Furia, Piel de hierro...)
  const now = playerPower(p); p.buffs = buffs; applyStats();
  const b = classBasePower(p.cls), prev = G.dgScale || { hp: 0, dmg: 0 };
  const n = G.dg ? G.dg.n : 1; // cada mazmorra superada: +10% de vida (se suma al 25%)
  // vida: solo tu daño contra UN enemigo (daño, cadencia y críticos; los proyectiles extra, la perforación y las
  // pasivas reparten por el grupo y no cuentan), algo amortiguado, con un mínimo suave según tu nivel
  const cm = classMods(lineageOf(p.cls)[0]);
  const st = (p.dmgMul * p.rate * (1 + p.crit)) / (cm.dmg * cm.rate * (1.05 + cm.crit));
  const off = Math.pow(Math.max(1, st), 0.85);
  const lvH = 1 + 0.04 * (p.lvl - 1), lvD = 1 + 0.01 * (p.lvl - 1);
  G.dgScale = { hp: Math.max(prev.hp, (DG_EDGE + 0.1 * (n - 1)) * Math.max(1, off, lvH)), dmg: Math.max(prev.dmg, DG_EDGE * Math.max(1, now.def / b.def, lvD)) };
}
function spawnEnemy(type, x, y) {
  const d = ENEMY[type], diff = (G.floor - 1) + Math.min(3, G.t / 120), sc = type === 'ghost' ? { hp: 1, dmg: 1 } : (G.dgScale || { hp: DG_EDGE, dmg: DG_EDGE });
  let hp = d.hp * (1 + 0.4 * diff) * sc.hp;
  if (d.boss) hp = d.hp * (1 + 0.75 * (G.floor - 1)) * sc.hp;
  const e = {
    type, def: d, x, y, hp, maxHp: hp,
    spd: d.spd * Math.min(1.45, 1 + 0.04 * diff) * rand(0.92, 1.08),
    dmgM: (1 + 0.14 * diff) * sc.dmg, atk: rand(0, 0.6), flash: 0, slow: 0, shoot: rand(0.8, 2), los: false, losT: 0,
    wob: rand(0, TAU), bladeCd: 0, kx: 0, ky: 0, ring: 6, walk: rand(0, 2),
  };
  if (G.nightmare && type !== 'ghost') { e.hp *= 1.5; e.maxHp *= 1.5; e.dmgM *= 1.25; }
  if (G.pact === 'prisa') e.spd *= 1.2;
  if (d.dmg > 0 && !d.ranged && !d.boss && Math.random() < 0.65) e.flank = (Math.random() < 0.5 ? -1 : 1) * rand(0.7, 1.3); // se abre hacia un flanco
  maybeElite(e);
  G.enemies.push(e);
  return e;
}

function findSpawn(minD, maxD, needHidden) {
  const lv = G.lv, p = G.p;
  for (let i = 0; i < 40; i++) {
    const c = pick(lv.floorCells), x = c[0] + 0.5, y = c[1] + 0.5, ri = lv.roomOf[c[1] * MW + c[0]];
    if (ri >= 0 && ['secreta', 'mercader', 'herrero', 'mentor', 'santuario', 'entrada'].includes(lv.rooms[ri].type)) continue;
    const d = Math.hypot(x - p.x, y - p.y);
    if (d < minD || d > maxD) continue;
    if (needHidden && lv.los(p.x, p.y, x, y)) continue;
    return [x, y];
  }
  return null;
}

// monstruos errantes: cuanto más tiempo pasas en la mazmorra, más aparecen
function updateSpawner(dt) {
  G.spawnT -= dt;
  if (G.spawnT > 0 || G.arena) return;
  const t = G.t, f = G.floor;
  G.spawnT = Math.max(2.2, 9 - t * 0.012 - f * 0.45);
  const awake = G.enemies.filter(e => !e.dead && !e.sleep).length;
  if (awake >= Math.min(30, 4 + f * 2 + t * 0.03)) return;
  const type = pickType();
  const pk = ENEMY[type].pack, n = pk ? randi(pk[0], pk[1]) : type === 'bat' ? randi(2, 3) : (Math.random() < Math.min(0.5, t / 400) ? 2 : 1);
  const pos = findSpawn(10, 26, true);
  if (!pos) return;
  for (let i = 0; i < n; i++) spawnEnemy(type, pos[0] + rand(-0.4, 0.4), pos[1] + rand(-0.4, 0.4));
}

// Oleadas: cada 2 minutos llega una horda desde un punto al azar del piso en el que estés, cada vez mayor y más dura.
// Al cambiar de piso solo vuelve a empezar la cuenta atrás; el número de oleada solo vuelve a 0 en otra mazmorra.
const WAVE_WARN = 10;
function updateWaves(dt) {
  if (G.arena || (G.boss && !G.boss.dead && !G.boss.sleep)) return; // no interrumpe la pelea con el jefe
  const before = G.waveT || 0; G.waveT = before + dt;
  const EVERY = waveEvery();
  if (before < EVERY - WAVE_WARN && G.waveT >= EVERY - WAVE_WARN) {
    toast('SE OYEN PASOS QUE SE ACERCAN...', false); logMsg('Algo se acerca desde las sombras...', C.orange); Sfx.play('roar');
  }
  if (G.waveT < EVERY) return;
  const pos = findSpawn(9, 30, true) || findSpawn(7, 40, false);
  if (!pos) { G.waveT = EVERY - 3; return; }
  G.waveT = 0; G.waveN = (G.waveN || 0) + 1;
  const k = G.waveN, n = Math.min(26, 3 + 3 * k + (G.dg ? G.dg.n : 1)), hpMul = 1 + 0.3 * k;
  const types = [pickType(), pickType(), pickType()];
  for (let i = 0; i < n; i++) {
    const e = spawnEnemy(types[i % 3], pos[0] + rand(-0.6, 0.6), pos[1] + rand(-0.6, 0.6));
    if (G.lv.blocked(e.x, e.y, 0.25)) { e.x = pos[0]; e.y = pos[1]; }
    e.hp *= hpMul; e.maxHp *= hpMul; e.sleep = false; e.wave = k;
  }
  toast(`¡OLEADA ${k}!`, true); logMsg(`Oleada ${k}: ${n} enemigos salen de las sombras`, C.red);
  if (k % 5 === 0) { const dp = spawnDoppel(pos[0], pos[1]); wakeEnemy(dp); } // cada 5 oleadas viene tu doble
  Sfx.play('boss'); G.shake = Math.max(G.shake, 0.4);
}

// ---------------------------------------------------------------- IA especial de algunos enemigos y sus disparos
// habilidades de los enemigos nuevos
function specialAI(e, d, dt, dx, dy, dist) {
  const p = G.p, lv = G.lv;
  if (d.blink) { // vampiro noble: desaparece y reaparece a tu lado
    e.blinkCd = (e.blinkCd ?? rand(1.5, d.blink.cd)) - dt;
    if (e.blinkCd <= 0 && e.los && dist > 3) {
      for (let k = 0; k < 8; k++) {
        const a = rand(0, TAU), nx = p.x + Math.cos(a) * 1.5, ny = p.y + Math.sin(a) * 1.5;
        if (lv.blocked(nx, ny, 0.3) || !lv.los(p.x, p.y, nx, ny)) continue;
        vfxBlink(e.x, e.y, 'void'); e.x = nx; e.y = ny; vfxBlink(nx, ny, 'void'); e.atk = 0.35; Sfx.play('dash');
        break;
      }
      e.blinkCd = d.blink.cd;
    }
  }
  if (d.summon && e.los) { // nigromante: levanta esqueletos a su lado
    e.sumCd = (e.sumCd ?? 3) - dt;
    if (e.sumCd <= 0) {
      e.sumCd = d.summon.cd;
      const mine = G.enemies.filter(q => q.master === e && !q.dead).length;
      for (let k = 0; k < Math.min(d.summon.n, d.summon.max - mine); k++) {
        const a = rand(0, TAU), nx = e.x + Math.cos(a) * 0.9, ny = e.y + Math.sin(a) * 0.9;
        if (lv.blocked(nx, ny, 0.3)) continue;
        const s = spawnEnemy(d.summon.type, nx, ny); s.sleep = false; s.master = e; s.hp *= 0.6; s.maxHp *= 0.6;
        burst(nx, ny, 0.2, 10, rgb(120, 255, 140), 2, 0.6);
      }
      Sfx.play('summon');
    }
  }
  if (d.phase) { // espectro maligno: a ratos se vuelve intangible
    const T = d.phase.on + d.phase.off; e.phT = ((e.phT ?? rand(0, T)) + dt) % T;
    e.phased = e.phT < d.phase.on;
  }
  if (d.doppel && e.los) { // doppelgänger: usa habilidades como las tuyas
    e.skCd = (e.skCd ?? rand(2, 4)) - dt;
    if (e.skCd <= 0) {
      e.skCd = rand(5, 7);
      if (d.branch === 'luchador' && dist < 3.2) { // grito / golpe de choque
        vRing(e.x, e.y, 0.05, 3, 0.35, VR.steel.slice(0, 5), 36); G.shake = Math.max(G.shake, 0.3); Sfx.play('roar');
        hurtPlayer(Math.round((d.dmg || 12) * 1.4), e.x, e.y); p.chill = Math.max(p.chill || 0, 1);
      } else if (d.branch === 'ladron') { // aparece a tu espalda
        const nx = p.x - Math.cos(p.a) * 1.3, ny = p.y - Math.sin(p.a) * 1.3;
        if (!lv.blocked(nx, ny, 0.3)) { vfxBlink(e.x, e.y, 'void'); e.x = nx; e.y = ny; vfxBlink(nx, ny, 'void'); e.atk = 0.2; Sfx.play('dash'); }
      } else { // ráfaga de su hechizo
        const a0 = Math.atan2(dy, dx), pr = d.ranged ? d.ranged : { dmg: 10, proj: 'orbPurple' };
        for (let k = -2; k <= 2; k++) enemyShot(e.x, e.y, a0 + k * 0.16, 7, pr.dmg * 1.1, pr.proj, 0.5);
        Sfx.play('enemyShoot');
      }
    }
    // tus mejoras pasivas también las tiene él
    if (L('nova') > 0) { e.novaCd = (e.novaCd ?? 4) - dt; if (e.novaCd <= 0) { e.novaCd = Math.max(3, 7 - L('nova')); vfxIceNova(e.x, e.y, 3.2); if (dist < 3.2) { hurtPlayer(Math.round(8 + 4 * L('nova')), e.x, e.y); p.chill = Math.max(p.chill || 0, 1.5); } } }
    if (L('bolt') > 0) { e.boltCd = (e.boltCd ?? 3) - dt; if (e.boltCd <= 0) { e.boltCd = Math.max(2, 4.5 - 0.4 * L('bolt')); const tx = p.x, ty = p.y; vRing(tx, ty, 0.02, 0.9, 0.6, VR.volt.slice(0, 4), 18); later(0.6, () => { vfxStrike(tx, ty); Sfx.play('bolt'); if (Math.hypot(G.p.x - tx, G.p.y - ty) < 0.9) hurtPlayer(Math.round(10 + 5 * L('bolt')), tx, ty); }); } }
  }
  if (d.worm) { // gusano gigante: escupe veneno y abre la boca, su punto débil
    e.openT = (e.openT || 0) - dt; e.wormCd = (e.wormCd ?? 1.5) - dt;
    if (e.wormCd <= 0 && e.los && dist < 12) {
      e.wormCd = d.worm.cd; e.openT = d.worm.open;
      const a = Math.atan2(dy, dx);
      for (const da of [-0.12, 0, 0.12]) enemyShot(e.x, e.y, a + da, 6.5, 9 * e.dmgM, 'orbGreen', 0.5, 0, d.worm.dps * e.dmgM);
      Sfx.play('enemyShoot');
    }
  }
}

function enemyShot(x, y, a, spd, dmg, proj, size = 0.4, chill = 0, poison = 0) {
  G.projs.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, r: 0.2, life: 5, friendly: false, dmg, spr: proj, size, chill, poison });
}

// ---------------------------------------------------------------- Despertar, daño, muerte, IA y jefes
function wakeEnemy(e) {
  e.sleep = false;
  if (e.ghost && G.elite !== e) { G.elite = e; toast(e.ghost.doppel ? '¡TU DOPPELGANGER!' : `¡${e.def.name.toUpperCase()} DESPIERTA!`, true); logMsg(e.ghost.doppel ? 'Una copia exacta de ti sale de las sombras...' : `Un fantasma rencoroso de nivel ${e.ghost.lvlNow} te reconoce...`, e.ghost.doppel ? C.red : C.cyan); Sfx.play('roar'); G.shake = Math.max(G.shake, 0.4); }
  if (e.def.boss && !G.boss) {
    G.boss = e;
    toast(`¡${e.def.name} DESPIERTA!`, true); logMsg('Un rugido sacude la mazmorra...', C.red);
    Sfx.play('boss'); G.shake = 0.6;
  }
}

function damageEnemy(e, dmg, o = {}) {
  if (e.dead) return;
  if (e.phased) { if (Math.random() < 0.3) burst(e.x, e.y, 0.5, 2, rgb(255, 120, 140), 1, 0.3); return; } // intangible
  if (e.armorMul) dmg *= e.armorMul;
  if (e.def.worm) { dmg *= e.openT > 0 ? 1.6 : 0.2; if (e.openT <= 0 && Math.random() < 0.4) Sfx.play('blade'); } // la boca abierta es su punto débil
  if (e.corrode > 0) dmg *= 1.4;
  if (e.mark > 0) dmg *= 1.5; // marca de muerte o maldición
  if (e.ward > 0) dmg *= 0.5; // protegido por un chamán
  e.hp -= dmg; e.flash = 0.1;
  if (e.sleep) wakeEnemy(e);
  const p = G.p;
  if (p.leech > 0) p.hp = Math.min(p.maxHp, p.hp + dmg * p.leech * (e.def.boss ? 0.5 : 1) * healMul()); // contra jefes, la mitad
  const kb = e.def.worm ? 0 : e.def.boss ? 0.1 : 1;
  e.kx += (o.kx || 0) * kb; e.ky += (o.ky || 0) * kb;
  burst(e.x, e.y, 0.4, o.silent ? 2 : (o.crit ? 8 : 4), o.crit ? rgb(255, 220, 90) : rgb(255, 255, 255), 1.8, 0.4);
  if (!o.silent) bloodHit(e, o.crit);
  G.hitMark = 0.12;
  if (!o.silent || e.hp <= 0) Sfx.play(e.hp <= 0 ? 'kill' : 'hit');
  if (e.hp <= 0) killEnemy(e);
}
// daño continuo (veneno, fuego): sin retroceso ni sonido
function dot(e, amt) {
  if (e.dead) return;
  e.hp -= amt * (e.corrode > 0 ? 1.4 : 1);
  if (Math.random() < 0.05) burst(e.x, e.y, 0.5, 1, e.burn > 0 ? rgb(255, 150, 50) : rgb(120, 220, 70), 0.8, 0.5);
  if (e.hp <= 0) { Sfx.play('kill'); killEnemy(e); }
}

function dropGem(x, y, v) {
  G.pickups.push({ type: 'gem', x, y, v, vx: rand(-1, 1), vy: rand(-1, 1), t: rand(0, 6) });
}

function killEnemy(e) {
  e.dead = true; G.kills++;
  forgeOnKill(e); equipOnKill(e); eliteKilled(e);
  if (e.ghost && e.ghost.doppel) { // doppelgänger: botín de jefe
    if (G.elite === e) G.elite = null;
    toast('TU DOBLE SE DESVANECE', true); G.flashFx = 0.8; Sfx.play('portal');
    dropItem('boss', e.x, e.y + 0.3);
    jot('doppel' + G.dg.n + '_' + G.kills, `Me enfrenté a mi propio doble en el ${levelName(G.z)}. Luchaba como yo... pero vencí.`);
  } else if (e.ghost) {
    onGhostKilled(e);
    // 50%: recuperas uno de los legendarios que llevaba el caído; si no, un objeto normal de fantasma
    const L = e.ghost.legends || [];
    if (L.length && Math.random() < 0.5) { const it = JSON.parse(JSON.stringify(pick(L))); G.pickups.push({ type: 'item', item: it, x: e.x, y: e.y + 0.3, t: 0 }); toast('¡UN LEGENDARIO DEL CAÍDO!', true); }
    else if (Math.random() < 0.6) dropItem('ghost', e.x, e.y + 0.3);
  }
  const d = e.def, col = d.spr === 'slime' ? rgb(120, 220, 90) : d.spr === 'imp' || d.boss ? rgb(255, 90, 40) : rgb(220, 210, 180);
  burst(e.x, e.y, 0.3, d.boss ? 40 : 10, col, 2.5, 0.8, false, 0.06);
  if (d.boss) {
    for (let i = 0; i < 14; i++) dropGem(e.x + rand(-1, 1), e.y + rand(-1, 1), 5 * (1 + 0.5 * (G.floor - 1)));
    G.pickups.push({ type: 'gold', x: e.x, y: e.y, v: 40 * G.floor, t: 0 });
    G.pickups.push({ type: 'potion', x: e.x + 0.6, y: e.y, t: 0 });
    onBossDead(e);
    return;
  }
  dropGem(e.x, e.y, d.xp * (1 + 0.5 * (G.floor - 1)));
  if (Math.random() < (potionsFull() ? 0.006 : 0.0375)) G.pickups.push({ type: 'potion', x: e.x, y: e.y, t: 0 });
}

function onBossDead(e) {
  G.boss = null;
  if (G.z !== SECRET_Z) { G.guardianDown = true; G.pickups.push({ type: 'soul', x: e.x, y: e.y - 0.6, t: 0 }); } // portal secreto y Alma de Guardián
  else { G.cowDown = true; dropItem('boss', e.x - 0.4, e.y, {}); G.pickups.push({ type: 'gold', x: e.x, y: e.y + 0.5, v: 120 * G.floor, t: 0 }); jot('cow' + G.dg.n, 'Encontré un prado bajo la mazmorra, lleno de vacas armadas. Derroté a su rey. Nadie me va a creer.'); }
  dropItem('boss', e.x + 0.4, e.y, { boss: e.type });
  G.flashFx = 1; G.shake = 0.7;
  Sfx.play('portal');
  toast(`¡${e.def.name} HA CAÍDO!`, true); logMsg('Su tesoro es tuyo. Ahora, a la salida', C.cyan);
  jot('boss', `${e.def.name.charAt(0) + e.def.name.slice(1).toLowerCase()}, guardián de ${G.dg.name}, ha caído. Solo queda volver a la salida con vida.`);
}

function updateEnemies(dt) {
  const p = G.p, lv = G.lv;
  G.flowT -= dt;
  if (G.flowT <= 0) { G.flowT = 0.25; lv.flowField(p.x, p.y, G.flow); }
  const en = G.enemies;
  for (const e of en) {
    if (e.dead) continue;
    const d = e.def;
    e.flash -= dt; e.slow -= dt; if (e.slowZ > 0) e.slowZ -= dt; e.atk -= dt; e.bladeCd -= dt; e.wob += dt * 6; if (e.mark > 0) e.mark -= dt; if (e.ward > 0) e.ward -= dt;
    e.losT -= dt;
    if (e.burn > 0) { e.burn -= dt; dot(e, (e.burnDps || 6) * dt); if (Math.random() < dt * 16) vfxBurn(e); }
    if (e.poison > 0) { e.poison -= dt; dot(e, (e.poisDps || 4) * dt); if (Math.random() < dt * 6) vfxPoisoned(e); }
    if (e.corrode > 0) e.corrode -= dt;
    if (e.weak > 0) e.weak -= dt;
    if (e.dead) continue;
    const stunned = e.stun > 0; if (stunned) e.stun -= dt;
    const dx = p.x - e.x, dy = p.y - e.y, dist = Math.hypot(dx, dy) || 0.001;
    if (e.losT <= 0) { e.los = dist < 26 && lv.los(e.x, e.y, p.x, p.y); e.losT = 0.12 + Math.random() * 0.1; }
    const hidden = p.stealth > 0 && dist > 3.2; // el jugador está oculto
    if (hidden) e.los = false;
    if (e.sleep) { if ((e.los && dist < (d.boss ? 8 : 6.5)) || (dist < 2.2 && !hidden)) wakeEnemy(e); else continue; }
    // aliado cercano más próximo que el jugador: lo atacan a él
    let ally = null, ad = Math.min(dist, 5);
    for (const a of G.allies) { const q = Math.hypot(a.x - e.x, a.y - e.y); if (q < ad) { ad = q; ally = a; } }

    let tx = p.x, ty = p.y;
    if (ally && lv.los(e.x, e.y, ally.x, ally.y)) { tx = ally.x; ty = ally.y; }
    else if (!e.los && dist > 1.2) {
      const cx = e.x | 0, cy = e.y | 0, here = G.flow[cy * MW + cx];
      let bestD = here < 0 ? 1e9 : here, nx = -1, ny = -1;
      if (here >= 0) {
        for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const X = cx + ox, Y = cy + oy;
          if (X < 0 || Y < 0 || X >= MW || Y >= MH) continue;
          const v = G.flow[Y * MW + X];
          if (v >= 0 && v < bestD) { bestD = v; nx = X; ny = Y; }
        }
      }
      if (nx >= 0) { tx = nx + 0.5; ty = ny + 0.5; }
    }
    if (!ally && e.los) { const f = flankTarget(e, d, dist); if (f) { tx = f.x; ty = f.y; } }
    let ax = tx - e.x, ay = ty - e.y;
    const al = Math.hypot(ax, ay) || 0.001; ax /= al; ay /= al;
    let spd = e.spd * (e.slow > 0 ? 0.4 : e.slowZ > 0 ? 0.7 : 1); // las zonas de suelo frenan menos: se cruzan
    if (e.slamT > 0) spd = 0; // preparando un golpe anunciado
    if (d.charge) { // embestida: cada pocos segundos, si te ve a media distancia, carga a toda velocidad
      e.chargeCd = (e.chargeCd ?? rand(1, d.charge.cd)) - dt; e.chargeT = (e.chargeT || 0) - dt;
      if (e.chargeCd <= 0 && e.los && dist > d.charge.min && dist < d.charge.max && !stunned) { e.chargeCd = d.charge.cd; e.chargeT = d.charge.dur; Sfx.play('roar'); }
      if (e.chargeT > 0) spd *= d.charge.mul;
    }
    if (e.fleeT > 0) { e.fleeT -= dt; ax = -dx / dist; ay = -dy / dist; spd *= 1.1; }
    if (stunned) spd = 0;
    if (hidden && !ally) { ax = Math.cos(e.wob * 0.2 + e.walk); ay = Math.sin(e.wob * 0.2 + e.walk); spd *= 0.3; }
    if (d.ranged && e.los && !ally) {
      if (dist < d.ranged.keep) { ax = -dx / dist; ay = -dy / dist; spd *= 0.8; }
      else if (dist < d.ranged.keep + 1.5) spd = 0;
    }
    if (d.fly) { // aleteo errático
      const w = Math.sin(e.wob) * 0.7;
      const nax = ax - ay * w, nay = ay + ax * w; ax = nax; ay = nay;
    }
    // los de cuerpo a cuerpo se plantan delante del jugador en vez de meterse en él
    const stop = d.r + PLAYER_R;
    if (!ally && !e.fleeT && dist < stop + 0.08 && ax * dx + ay * dy > 0) spd = 0;
    const ox = e.x, oy = e.y;
    lv.move(e, ax * spd * dt + e.kx * dt, ay * spd * dt + e.ky * dt, Math.min(d.r, 0.3));
    { const qx = e.x - p.x, qy = e.y - p.y, q = Math.hypot(qx, qy);
      if (q < stop) { const k = q > 1e-4 ? (stop - q) / q : 0; if (k) lv.move(e, qx * k, qy * k, Math.min(d.r, 0.3)); else lv.move(e, -Math.cos(p.a) * stop, -Math.sin(p.a) * stop, Math.min(d.r, 0.3)); } }
    e.walk += Math.hypot(e.x - ox, e.y - oy);
    e.kx *= Math.max(0, 1 - dt * 7); e.ky *= Math.max(0, 1 - dt * 7);

    // ataque cuerpo a cuerpo
    if (d.dmg > 0 && !stunned && e.atk <= 0 && !(e.slamT > 0)) {
      if (ally && ad < d.r + ally.def.r + 0.45) {
        ally.hp -= d.dmg * e.dmgM; ally.flash = 0.1; e.atk = 0.9;
        if (ally.hp <= 0) allyKill(ally);
      } else if (dist < d.r + 0.5 && !hidden) {
        const hp0 = p.hp;
        hurtPlayer(Math.round(d.dmg * e.dmgM * (e.crit && Math.random() < e.crit ? 2 : 1)), e.x, e.y); e.atk = d.atkCd || (d.boss ? 1.1 : 0.9);
        if (d.bite && p.hp < hp0) { p.poisT = Math.max(p.poisT || 0, d.bite.poison); p.poisDps = d.bite.dps * e.dmgM; }
        if (d.hitrun) e.fleeT = d.hitrun; // arpía: tras el zarpazo se aleja
        if (d.drain && p.hp < hp0) { e.hp = Math.min(e.maxHp, e.hp + (hp0 - p.hp) * d.drain); burst(e.x, e.y, 0.6, 5, rgb(220, 30, 40), 1.5, 0.4); }
      }
    }
    // ataque a distancia
    if (d.ranged && !stunned && !hidden) {
      e.shoot -= dt;
      if (e.shoot <= 0 && e.los && dist < 14) {
        e.shoot = d.ranged.cd * rand(0.85, 1.2);
        const n = d.ranged.spread || 1, a0 = Math.atan2(dy, dx);
        for (let k = 0; k < n; k++) enemyShot(e.x, e.y, a0 + (k - (n - 1) / 2) * 0.22, d.ranged.spd, d.ranged.dmg * e.dmgM, d.ranged.proj, 0.4, d.ranged.chill || 0);
        Sfx.play('enemyShoot');
      }
    }
    if (!stunned) specialAI(e, d, dt, dx, dy, dist);
    if (!stunned) { slamAI(e, d, dt, dist); supportAI(e, d, dt); }
    if (d.boss && !stunned) bossAI(e, dt, dx, dy, dist);
  }
  // separación entre enemigos
  for (let i = 0; i < en.length; i++) {
    const a = en[i]; if (a.dead) continue;
    for (let j = i + 1; j < en.length; j++) {
      const b = en[j]; if (b.dead) continue;
      const dx = b.x - a.x, dy = b.y - a.y, rr = (a.def.r + b.def.r) * 0.9;
      const d2 = dx * dx + dy * dy;
      if (d2 < rr * rr && d2 > 1e-6) {
        const d = Math.sqrt(d2), push = (rr - d) * 0.5;
        const nx = dx / d * push, ny = dy / d * push;
        lv.move(a, -nx, -ny, Math.min(a.def.r, 0.3)); lv.move(b, nx, ny, Math.min(b.def.r, 0.3));
      }
    }
  }
  G.enemies = en.filter(e => !e.dead);
}

function bossAI(e, dt, dx, dy, dist) {
  const rage = e.hp < e.maxHp * 0.5, ai = e.def.ai;
  if (ai) return bossAI2(e, dt, dx, dy, rage, ai);
  e.shoot -= dt; e.ring -= dt;
  if (e.shoot <= 0 && e.los) {
    e.shoot = rage ? 1.5 : 2.3;
    const n = rage ? 7 : 5, base = Math.atan2(dy, dx);
    for (let i = 0; i < n; i++) enemyShot(e.x, e.y, base + (i - (n - 1) / 2) * 0.17, 5.2, 13 * e.dmgM, 'orbRed', 0.5);
    Sfx.play('enemyShoot');
  }
  if (e.ring <= 0) {
    e.ring = rage ? 5 : 7.5;
    const n = rage ? 20 : 14, off = rand(0, TAU);
    for (let i = 0; i < n; i++) enemyShot(e.x, e.y, off + i / n * TAU, 3.6, 11 * e.dmgM, 'orbPurple', 0.45);
    Sfx.play('boss'); G.shake = Math.max(G.shake, 0.25);
  }
  if (rage) e.spd = ENEMY.boss.spd * 1.5;
}
// invocar esbirros alrededor del jefe
function bossSummon(e, type, n) {
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + rand(0, 0.5), x = e.x + Math.cos(a) * 1.4, y = e.y + Math.sin(a) * 1.4;
    if (G.lv.blocked(x, y, 0.25)) continue;
    spawnEnemy(type, x, y); vfxBlink(x, y, 'void');
  }
  Sfx.play('summon');
}
function bossAI2(e, dt, dx, dy, rage, ai) {
  e.shoot -= dt; e.ring = (e.ring ?? 6) - dt; e.summon = (e.summon ?? 5) - dt;
  const base = Math.atan2(dy, dx);
  if (ai === 'lich') { // abanicos arcanos e invoca esqueletos
    if (e.shoot <= 0 && e.los) { e.shoot = rage ? 1.3 : 2; const n = rage ? 5 : 3; for (let i = 0; i < n; i++) enemyShot(e.x, e.y, base + (i - (n - 1) / 2) * 0.22, 6, 13 * e.dmgM, 'orbBlue', 0.45); Sfx.play('enemyShoot'); }
    if (e.summon <= 0) { e.summon = rage ? 7 : 10; bossSummon(e, 'skeleton', rage ? 4 : 3); }
  } else if (ai === 'queen') { // crías y escupitajos
    if (e.shoot <= 0 && e.los) { e.shoot = rage ? 1.6 : 2.4; for (let i = 0; i < 4; i++) enemyShot(e.x, e.y, base + rand(-0.3, 0.3), rand(4.5, 6.5), 10 * e.dmgM, 'orbGreen', 0.4); Sfx.play('enemyShoot'); }
    if (e.summon <= 0) { e.summon = rage ? 5.5 : 8; bossSummon(e, 'spider', rage ? 5 : 3); }
  } else if (ai === 'lilith') { // aparece a tu lado, abanicos de sangre e invoca furias y murciélagos
    const p = G.p;
    e.blinkCd = (e.blinkCd ?? 4) - dt;
    if (e.blinkCd <= 0 && e.los) {
      e.blinkCd = rage ? 4 : 6.5;
      for (let k = 0; k < 10; k++) { const a = rand(0, TAU), nx = p.x + Math.cos(a) * 2.6, ny = p.y + Math.sin(a) * 2.6; if (G.lv.blocked(nx, ny, 0.4) || !G.lv.los(p.x, p.y, nx, ny)) continue; vfxBlink(e.x, e.y, 'void'); e.x = nx; e.y = ny; vfxBlink(nx, ny, 'void'); Sfx.play('dash'); break; }
    }
    if (e.shoot <= 0 && e.los) { e.shoot = rage ? 1.4 : 2.2; const n = rage ? 7 : 5; for (let i = 0; i < n; i++) enemyShot(e.x, e.y, base + (i - (n - 1) / 2) * 0.2, 6, 12 * e.dmgM, 'orbRed', 0.45); Sfx.play('enemyShoot'); }
    if (e.summon <= 0) { e.summon = rage ? 8 : 11; if (Math.random() < 0.5) bossSummon(e, 'fury', rage ? 3 : 2); else bossSummon(e, 'vampbat', rage ? 5 : 3); }
  } else if (ai === 'cthulhu') { // golpes de tentáculo donde estás, tinta que ralentiza y siervos abisales
    const p = G.p;
    if (e.ring <= 0) {
      e.ring = rage ? 2.3 : 3.4;
      const spots = [[p.x, p.y]]; if (rage) for (let k = 0; k < 2; k++) spots.push([p.x + rand(-2, 2), p.y + rand(-2, 2)]);
      for (const [tx, ty] of spots) {
        vRing(tx, ty, 0.02, 1.1, 0.85, VR.void ? VR.void.slice(0, 4) : VR.steel.slice(0, 4), 24); // aviso
        later(0.85, () => { vfxShock(tx, ty, 1.2); G.shake = Math.max(G.shake, 0.35); Sfx.play('hit'); if (Math.hypot(G.p.x - tx, G.p.y - ty) < 1.15) hurtPlayer(Math.round(20 * e.dmgM), tx, ty); });
      }
    }
    if (e.shoot <= 0 && e.los) { e.shoot = rage ? 2.6 : 3.8; for (let i = -1; i <= 1; i++) enemyShot(e.x, e.y, base + i * 0.25, 5, 10 * e.dmgM, 'orbPurple', 0.6, 2.2); Sfx.play('enemyShoot'); }
    if (e.summon <= 0) { e.summon = rage ? 9 : 13; bossSummon(e, 'deepwarrior', rage ? 3 : 2); }
  } else if (ai === 'dragon') { // aliento de fuego en cono y bolas de fuego
    e.breath = (e.breath ?? 3) - dt;
    if (e.breath <= 0 && e.los && !(e.breathT > 0)) { e.breathT = 1.4; e.breath = rage ? 4.5 : 6.5; Sfx.play('boss'); }
    if (e.breathT > 0) { e.breathT -= dt; if (Math.random() < dt * 22) enemyShot(e.x, e.y, base + rand(-0.38, 0.38), rand(6.5, 8.5), 7 * e.dmgM, 'orbRed', 0.55); }
    if (e.shoot <= 0 && e.los && !(e.breathT > 0)) { e.shoot = rage ? 1.8 : 2.8; for (let i = -1; i <= 1; i += 2) enemyShot(e.x, e.y, base + i * 0.12, 7, 16 * e.dmgM, 'orbRed', 0.75); Sfx.play('enemyShoot'); }
  } else if (ai === 'eye') { // espirales de orbes
    if (e.ring <= 0) { e.ring = 0.18; e.spin = (e.spin || 0) + (rage ? 0.5 : 0.38); const arms = rage ? 4 : 3; for (let k = 0; k < arms; k++) enemyShot(e.x, e.y, e.spin + k / arms * TAU, 3.4, 9 * e.dmgM, 'orbPurple', 0.38); }
    if (e.shoot <= 0 && e.los) { e.shoot = 3; for (let i = 0; i < 3; i++) enemyShot(e.x, e.y, base + (i - 1) * 0.1, 8, 14 * e.dmgM, 'orbPurple', 0.5); Sfx.play('enemyShoot'); }
  }
}
