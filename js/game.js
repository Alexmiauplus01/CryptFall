// Lógica principal: jugador, enemigos, proyectiles, mejoras, oleadas, jefe
const canvas = document.getElementById('view');
const R = new Renderer();
const ui = new UI(canvas);

// ---------------------------------------------------------------- Datos
// h = altura en el mundo (1 = altura de pared); el ancho sale de la proporción del sprite
const ENEMY = {
  skeleton: { name: 'Esqueleto', hp: 24, spd: 1.75, dmg: 8, r: 0.3, h: 0.95, z: 0, spr: 'skeleton', xp: 1 },
  bat:      { name: 'Murciélago', hp: 9, spd: 3.5, dmg: 5, r: 0.22, h: 0.42, z: 0.32, spr: 'bat', xp: 1, fly: true },
  slime:    { name: 'Légamo', hp: 46, spd: 1.0, dmg: 12, r: 0.38, h: 0.62, z: 0, spr: 'slime', xp: 3 },
  wraith:   { name: 'Espectro', hp: 22, spd: 1.5, dmg: 0, r: 0.3, h: 1.0, z: 0.06, spr: 'wraith', xp: 3, ranged: { cd: 2.6, dmg: 11, spd: 4.2, proj: 'orbGreen', keep: 5.5 } },
  imp:      { name: 'Diablillo', hp: 34, spd: 2.2, dmg: 8, r: 0.3, h: 0.78, z: 0, spr: 'imp', xp: 4, ranged: { cd: 2.0, dmg: 12, spd: 6, proj: 'orbRed', keep: 3.5 } },
  ghost:    { name: 'Fantasma', hp: 200, spd: 2.1, dmg: 12, r: 0.3, h: 1.0, z: 0.05, spr: 'ghost_melee', xp: 15, elite: true },
  zombie:   { name: 'Necrófago', hp: 58, spd: 1.0, dmg: 14, r: 0.32, h: 0.95, z: 0, spr: 'zombie', xp: 3 },
  cultist:  { name: 'Acólito', hp: 30, spd: 1.6, dmg: 0, r: 0.3, h: 1.0, z: 0, spr: 'cultist', xp: 4, ranged: { cd: 2.3, dmg: 12, spd: 6, proj: 'orbPurple', keep: 5 } },
  spider:   { name: 'Araña', hp: 16, spd: 3.1, dmg: 7, r: 0.3, h: 0.52, z: 0, spr: 'spiderE', xp: 2 },
  hound:    { name: 'Can infernal', hp: 34, spd: 3.5, dmg: 11, r: 0.32, h: 0.62, z: 0, spr: 'hound', xp: 3 },
  eye:      { name: 'Ojo del vacío', hp: 40, spd: 1.2, dmg: 0, r: 0.3, h: 0.55, z: 0.35, spr: 'eye', xp: 4, fly: true, ranged: { cd: 1.9, dmg: 12, spd: 7, proj: 'orbPurple', keep: 6 } },
  lich:     { name: 'EL LICHE', hp: 470, spd: 1.3, dmg: 18, r: 0.5, h: 1.75, z: 0, spr: 'lich', xp: 60, boss: true, ai: 'lich' },
  queen:    { name: 'LA REINA ARAÑA', hp: 560, spd: 1.9, dmg: 20, r: 0.6, h: 1.3, z: 0, spr: 'queen', xp: 60, boss: true, ai: 'queen' },
  voidlord: { name: 'EL OJO PRIMIGENIO', hp: 500, spd: 1.0, dmg: 16, r: 0.6, h: 1.6, z: 0.2, spr: 'voidlord', xp: 60, boss: true, ai: 'eye' },
  boss:     { name: 'EL GUARDIÁN', hp: 520, spd: 1.5, dmg: 22, r: 0.55, h: 1.75, z: 0, spr: 'boss', xp: 60, boss: true },
};
const DECOR = {
  skulltorch: { h: 0.95, anim: true },
  brazier:    { h: 0.62, anim: true },
  candles:    { h: 0.3, anim: true },
  barrel:     { h: 0.55 },
  bones:      { h: 0.15 },
  merchant:   { h: 0.95, anim: true },
  smith:      { h: 1.0, anim: true },
  anvil:      { h: 0.34 },
  altar:      { h: 0.72, anim: true },
  bookshelf:  { h: 1.15 },
  crate:      { h: 0.5 },
  bonepile:   { h: 0.36 },
  urn:        { h: 0.55 },
  fountain:   { h: 0.62, anim: true },
  mushroom:   { h: 0.42, anim: true },
  mushroomB:  { h: 0.42, anim: true },
  ritual:     { h: 0.85, anim: true },
  icecrystal: { h: 0.8, anim: true },
};
// salas temáticas: frase que se anuncia al entrar la primera vez (el nombre está en ROOM_NAME, dungeon.js)
const ROOM_HINT = {
  biblioteca: 'Polvo, velas y saber olvidado', osario: 'Montañas de huesos... algunos se mueven',
  fuente: 'El agua aún brilla: beber de ella cura', almacen: 'Cajas y barriles de alguna expedición perdida',
  jardin: 'Hongos que brillan en la oscuridad', ritual: 'Un círculo de velas y una piedra que sangra luz',
};
const PROJ_LIGHT = {
  orbBlue: [0.35, 0.6, 1.25], orbGold: [1.2, 0.95, 0.4], orbRed: [1.3, 0.55, 0.15], orbGreen: [0.3, 1.1, 0.55], orbPurple: [0.85, 0.3, 1.2], orbIce: [0.5, 0.9, 1.2], orbArrow: [0.9, 0.8, 0.5],
};

const UPG = [
  { id: 'might',  name: 'Poder Arcano',        max: 8, desc: () => '+20% daño de hechizos' },
  { id: 'haste',  name: 'Prisa',               max: 8, desc: () => '+15% cadencia de lanzamiento' },
  { id: 'multi',  name: 'Descarga Múltiple',   max: 4, desc: () => '+1 proyectil por lanzamiento' },
  { id: 'pierce', name: 'Perforación',         max: 4, desc: () => 'Los hechizos atraviesan +1 enemigo más' },
  { id: 'speed',  name: 'Pies Ligeros',        max: 5, desc: () => '+10% velocidad de movimiento' },
  { id: 'vit',    name: 'Vitalidad',           max: 6, desc: () => '+30 vida máxima y curación' },
  { id: 'regen',  name: 'Regeneración',        max: 5, desc: () => '+0.6 vida por segundo' },
  { id: 'magnet', name: 'Imán de Almas',       max: 5, desc: () => '+50% radio de recogida' },
  { id: 'wis',    name: 'Sabiduría',           max: 5, desc: () => '+15% experiencia ganada' },
  { id: 'crit',   name: 'Golpe Crítico',       max: 6, desc: () => '+8% prob. de crítico (x2 daño)' },
  { id: 'light',  name: 'Luz Eterna',          max: 4, desc: () => '+25% alcance de tu antorcha' },
  { id: 'dash',   name: 'Paso Sombrío',        max: 4, desc: () => 'La esquiva recarga un 20% más rápido' },
  { id: 'blades', name: 'Cuchillas Orbitales', max: 6, passive: true, desc: (l) => l === 0 ? 'Cuchillas giran a tu alrededor y cortan' : '+1 cuchilla y más daño' },
  { id: 'nova',   name: 'Nova Gélida',         max: 5, passive: true, desc: (l) => l === 0 ? 'Onda helada periódica que daña y frena' : 'Más daño, radio y frecuencia' },
  { id: 'bolt',   name: 'Tormenta',            max: 5, passive: true, desc: (l) => l === 0 ? 'Rayos caen sobre enemigos cercanos' : '+1 rayo, más daño y frecuencia' },
];

// ---------------------------------------------------------------- Estado
const G = {
  state: 'title', time: 0, t: 0, totalTime: 0, floor: 1, kills: 0,
  lv: null, theme: null, p: null, upg: {},
  enemies: [], projs: [], pickups: [], parts: [], fx: [], decor: [], allies: [], traps: [], zones: [], timers: [], vfx: [], vlights: [], arcs: [], sfx: [], aura: null, dome: null,
  phase: 'survive', dur: 60, spawnT: 1, boss: null, portal: null, won: false,
  flow: new Int16Array(MW * MH), flowT: 0, seen: new Uint8Array(MW * MH),
  pending: 0, bladeAng: 0, novaT: 4, boltT: 2, novaFx: 0, shake: 0, hurtFx: 0, flashFx: 0, hitMark: 0, hadLock: false,
  log: [], toasts: [], opts: [], best: null, final: null, choice: null, evolveReady: false,
  forge: {}, forgeOpts: null, met: {}, inv: { torch: 0 }, equip: {}, bag: [],
  dg: null, z: 0, loot: 0, bank: 0, keys: [], journal: [], jpage: -1, arena: null, touchCd: 0, fade: 0,
};
const TORCH_FUEL = 240; // segundos que arde una antorcha
const keys = {};
const mouse = { fire: false };
const L = (id) => G.upg[id] || 0;

function makePlayer(cls = 'mago') {
  return { x: 0, y: 0, a: 0, hp: 100, maxHp: 100, xp: 0, lvl: 1, shootCd: 0, dashCd: 0, dashT: 0, dashDx: 0, dashDy: 0, inv: 0, bob: 0, moveAmt: 0, anim: 0, vx: 0, vy: 0,
    cls, slot: 0, weapon: 'staff', spell: 'arcane', off: 'none', torchFuel: 0, wantBlock: false, block: 0, swing: null, swingDir: 1,
    form: 'human', element: null, buffs: [], skillCd: [0, 0, 0], skillMax: [1, 1, 1], stealth: 0, riposte: 0, absorb: 0, absorbT: 0 };
}

function recalc() {
  const p = G.p, cm = classMods(p.cls);
  const oldMax = p.maxHp;
  p.base = {
    dmg: (1 + 0.2 * L('might')) * cm.dmg,
    rate: (1 + 0.15 * L('haste')) * cm.rate,
    spd: 3.6 * (1 + 0.1 * L('speed')) * cm.spd,
    armor: cm.armor, leech: cm.leech,
    crit: 0.05 + 0.08 * L('crit') + cm.crit,
  };
  p.multi = 1 + L('multi');
  p.pierce = 1 + L('pierce');
  p.maxHp = Math.round((100 + 30 * L('vit')) * cm.hp * (1 + eqStat('hp')));
  if (p.maxHp > oldMax && oldMax > 0) p.hp += p.maxHp - oldMax;
  p.regen = 0.6 * L('regen') + eqStat('regen');
  p.magnet = 2.2 * (1 + 0.5 * L('magnet'));
  p.xpMul = (1 + 0.15 * L('wis')) * (1 + eqStat('xp'));
  p.light = (1 + 0.25 * L('light')) * (1 + eqStat('light'));
  p.dashMax = 2.4 * Math.pow(0.8, L('dash')) * (1 - eqStat('dash'));
  p.hp = Math.min(p.hp, p.maxHp);
  applyStats();
}

// Aplica una clase (al elegir al inicio o al evolucionar)
function setClass(id, evolving) {
  const p = G.p;
  p.cls = id; p.slot = 0; p.form = 'human'; p.buffs = []; p.skillCd = [0, 0, 0]; p.skillMax = [1, 1, 1];
  p.stealth = 0; p.riposte = 0; p.absorb = 0; p.swing = null;
  p.element = classPassive(id, 'element', null);
  if (classPassive(id, 'arcana', false)) { for (const k of ['blades', 'nova', 'bolt']) G.upg[k] = Math.max(G.upg[k] || 0, 2); G.novaT = 1; }
  const w = WEAPONS[CLASSES[id].slots[0].w];
  if (w.hands !== 1) p.wantBlock = false;
  recalc();
  if (evolving) { p.hp = p.maxHp; G.flashFx = 1; G.shake = 0.6; Sfx.play('portal'); toast(CLASSES[id].name.toUpperCase(), true); logMsg(`Evolucionas: ${CLASSES[id].name}`, C.gold); }
}

function newRun(cls) {
  G.equip = { anillo1: null, anillo2: null, amuleto: null, armadura: null, arma: null, escudo: null }; G.swap = null; G.wskin = null;
  G.upg = {}; G.kills = 0; G.totalTime = 0; G.won = false; G.pending = 0; G.log = []; G.toasts = []; G.evolveReady = false; G.choice = null; G.allies = [];
  G.p = makePlayer(cls); setClass(cls, false);
  G.inv = { torch: 2, potion: 0, map: 0, rune: 0 }; G.forge = {}; G.forgeOpts = null; G.met = {};
  G.p.hp = G.p.maxHp;
  G.bladeAng = 0; G.novaT = 4; G.boltT = 2;
  G.state = 'play';
  G.bank = 0;
  newDungeon(1);
  logMsg(`Entras en la mazmorra como ${CLASSES[cls].name}`, C.ink);
  logMsg('Saquea lo que puedas y sal con vida', C.dim);
  saveRun();
  logMsg(G.touchMode ? 'Está oscuro: toca I y enciende una antorcha' : 'Está oscuro: pulsa I y enciende una antorcha', C.orange);
}

// ---------------------------------------------------------------- Mazmorras: niveles, escaleras, puertas, llaves
function newDungeon(n) {
  G.dg = new Dungeon(n);
  G.lv = null; G.loot = 0; G.keys = []; G.journal = []; G.jpage = -1; G.arena = null; G.boss = null; G.t = 0;
  for (const z of G.dg.zs) populateLevel(G.dg.lv(z));
  placeGhost(G.dg); G.elite = null; G.phoenixUsed = false; G.phylUsed = false; G.raiseT = undefined; G.unbreakT = 0;
  enterLevel(G.dg.start.z, G.dg.start, true);
  jot('start', `Llego a ${G.dg.name}. Dicen que sus niveles guardan riquezas olvidadas... y un Guardián. Debo salir con vida y con el botín.`);
  if (G.state !== 'title') { toast(G.dg.name.toUpperCase(), true); logMsg(`${G.dg.name}: ${G.dg.zs.length} niveles`, C.gold); }
}

// celda libre aleatoria dentro de una sala (lejos de puertas, pinchos y columnas)
function roomSpot(lv, r, used) {
  for (let k = 0; k < 60; k++) {
    const x = randi(r.x, r.x + r.w - 1), y = randi(r.y, r.y + r.h - 1), i = y * MW + x;
    if (lv.cells[i] !== 0 || lv.roomOf[i] !== lv.rooms.indexOf(r) || lv.nearSpecial(x, y)) continue;
    if (lv.spikes.some(s => s.x === x && s.y === y) || used.has(i)) continue;
    if (lv.decor.some(d => Math.floor(d.x) === x && Math.floor(d.y) === y)) continue;
    used.add(i);
    return [x + 0.5, y + 0.5];
  }
  return [r.cx + 0.5, r.cy + 0.5];
}

// contenido de cada sala: enemigos dormidos, cofres, oro, llaves y el Guardián
function populateLevel(lv) {
  const saveE = G.enemies, saveF = G.floor, saveT = G.t;
  G.enemies = lv.state.enemies; G.floor = G.dg.diff(lv.z); G.t = 0;
  const P = lv.state.pickups, gold = 9 * G.floor;
  lv.rooms.forEach((r) => {
    const used = new Set(), area = r.w * r.h;
    const chest = (g, item) => { const [x, y] = roomSpot(lv, r, used); const c = { type: 'chest', x, y, t: 0, gold: Math.round(g), item: item || null, torch: Math.random() < 0.35, eq: Math.random() < (r.type === 'camara' ? 0.35 : r.type === 'secreta' ? 0.3 : 0.12), eqSrc: r.type === 'camara' || r.type === 'guarida' ? 'vault' : 'chest' }; P.push(c); return c; };
    const foes = (n, type) => { for (let k = 0; k < n; k++) { const [x, y] = roomSpot(lv, r, used); const e = spawnEnemy(type || pickType(), x, y); e.sleep = true; } };
    let box = null;
    switch (r.type) {
      case 'entrada': break;
      case 'tesoro': box = chest(gold * rand(4, 7), Math.random() < 0.4 ? 'potion' : null); foes(randi(2, 3)); break;
      case 'camara': box = chest(gold * rand(10, 15), 'potion'); if (area > 30) chest(gold * rand(5, 8)); foes(randi(1, 3)); break;
      case 'guarida': {
        const [x, y] = [r.cx + 0.5, r.cy + 0.5]; used.add(r.cy * MW + r.cx);
        const b = spawnEnemy(THEMES[lv.theme % THEMES.length].boss, x, y); b.sleep = true; b.shoot = 2; b.ring = 6; b.summon = 5;
        box = chest(gold * rand(30, 40), 'potion'); foes(2);
        break;
      }
      case 'secreta': box = chest(gold * rand(6, 10), 'potion'); break;
      case 'trampa': box = chest(gold * rand(5, 8)); break;
      case 'santuario': case 'arena': case 'mercader': case 'herrero': case 'fuente': break;
      case 'biblioteca': // saber antiguo: experiencia en gemas y algún erudito corrupto
        for (let k = 0; k < randi(2, 4); k++) { const [x, y] = roomSpot(lv, r, used); P.push({ type: 'gem', x, y, v: 5, vx: 0, vy: 0, t: rand(0, 6) }); }
        foes(randi(1, 2), 'cultist'); if (Math.random() < 0.35) box = chest(gold * rand(3, 5));
        break;
      case 'osario': foes(randi(4, 6), 'skeleton'); { const [x, y] = roomSpot(lv, r, used); P.push({ type: 'gold', x, y, v: Math.round(gold * rand(1.5, 2.5)), t: rand(0, 6) }); } break;
      case 'almacen':
        for (let k = 0; k < randi(2, 3); k++) chest(gold * rand(1.5, 3), Math.random() < 0.25 ? 'potion' : null);
        if (Math.random() < 0.5) { const [x, y] = roomSpot(lv, r, used); P.push({ type: 'torch', x, y, t: 0 }); }
        foes(randi(1, 2), 'bat');
        break;
      case 'jardin': foes(randi(2, 4), Math.random() < 0.5 ? 'spider' : 'slime'); if (Math.random() < 0.5) { const [x, y] = roomSpot(lv, r, used); P.push({ type: 'potion', x, y, t: 0 }); } break;
      case 'ritual': foes(randi(3, 4), 'cultist'); box = chest(gold * rand(8, 12), 'potion'); box.eq = true; break;
      default:
        foes(Math.max(1, Math.min(5, Math.round(area / 16 + rand(-0.5, 1)) + (lv.z !== 0 ? 1 : 0))));
        if (Math.random() < 0.35) { const [x, y] = roomSpot(lv, r, used); P.push({ type: 'gold', x, y, v: Math.round(gold * rand(0.6, 1.4)), t: rand(0, 6) }); }
        if (Math.random() < 0.18) box = chest(gold * rand(2, 4));
        if (Math.random() < 0.14) { const [x, y] = roomSpot(lv, r, used); P.push({ type: 'torch', x, y, t: 0 }); }
    }
    if (r.key !== undefined) {
      if (box && !box.item) box.item = { key: r.key };
      else { const [x, y] = roomSpot(lv, r, used); P.push({ type: 'key', key: r.key, x, y, t: rand(0, 6) }); }
    }
  });
  G.enemies = saveE; G.floor = saveF; G.t = saveT;
}

// entrar en un nivel (al empezar o por una escalera): el estado de cada nivel se conserva al volver
function enterLevel(z, at, first) {
  const cur = G.lv, p = G.p;
  if (cur && cur.state) Object.assign(cur.state, { enemies: G.enemies, pickups: G.pickups, traps: G.traps, zones: G.zones });
  const lv = G.dg.lv(z);
  G.lv = lv; G.z = z; G.floor = G.dg.diff(z);
  if (!lv.themeObj) lv.themeObj = buildTheme(lv.theme);
  G.theme = lv.themeObj; R.setTheme(G.theme);
  if (G.state !== 'title') Sfx.playMusic(lv.theme % 4);
  G.enemies = lv.state.enemies; G.pickups = lv.state.pickups; G.traps = lv.state.traps; G.zones = lv.state.zones;
  G.projs = []; G.parts = []; G.fx = []; G.timers = []; G.vfx = []; G.vlights = []; G.arcs = []; G.sfx = []; G.aura = null; G.dome = null;
  G.decor = lv.decor; G.seen = lv.seen;
  p.x = at.x; p.y = at.y; p.a = at.a; p.vx = p.vy = 0;
  G.allies.forEach(a => { a.x = p.x + rand(-0.4, 0.4); a.y = p.y + rand(-0.4, 0.4); if (lv.blocked(a.x, a.y, 0.25)) { a.x = p.x; a.y = p.y; } });
  G.spawnT = 6; G.flowT = 0; G.touchCd = 0.6; G.fade = first ? 0 : 1;
  G.waveT = 0; G.waveN = 0; // las oleadas empiezan de cero en cada piso
  lv.flowField(p.x, p.y, G.flow);
  if (!first && G.state !== 'title') {
    toast(levelName(z).toUpperCase(), true); toast(G.theme.name.toUpperCase(), false);
    logMsg(`${levelName(z)}: ${G.theme.name}`, C.gold);
    if (!lv.visited) jot('lvl' + z, `${z < G.zPrev ? 'Bajé' : 'Subí'} al ${levelName(z)}. ${G.theme.name}: ${z < 0 ? 'el aire huele a tierra húmeda y a muerte.' : z > 0 ? 'corrientes de aire frío recorren los pasillos.' : 'la luz de la entrada aún se adivina.'}`);
  }
  lv.visited = true;
  if (!first) saveRun();
}

// diario: entradas con id (no se repiten); se tachan al resolverse
function jot(id, text) {
  if (G.journal.some(e => e.id === id)) return;
  G.journal.push({ id, text, done: false });
  G.jpage = -1;
  if (G.state === 'play' && !G.toasts.some(t => t.text.startsWith('Diario'))) toast(G.touchMode ? 'Diario actualizado' : 'Diario actualizado [J]', false);
}
function strike(id) { const e = G.journal.find(e => e.id === id); if (e && !e.done) { e.done = true; G.jpage = -1; } }

// tocar una celda especial al caminar contra ella
function touchCell(x, y) {
  const lv = G.lv, i = y * MW + x, v = lv.at(x, y);
  if (v === 0 || G.touchCd > 0) return;
  const where = `${levelName(G.z)}, ${wingOf(x, y)}`;
  if (v === W_DOOR) { lv.openCell(i); Sfx.play('door'); burst(x + 0.5, y + 0.5, 0.5, 6, rgb(120, 90, 60), 1.4, 0.6, false, 0.06); G.touchCd = 0.3; return; }
  if (v >= W_LOCK && v < W_UP) {
    const k = lv.locks.get(i), K = KEYS[k];
    if (G.keys.includes(k)) {
      for (const [j, kk] of lv.locks) if (kk === k) lv.cells[j] = 0;
      lv.openCell(i);
      Sfx.play('unlock'); G.flashFx = 0.3;
      toast(`ABRES LA ${K.lock.toUpperCase()}`, false);
      logMsg(`La ${K.name} gira en la ${K.lock}`, C.gold);
      jot('lock' + k, `En el ${where} hay una puerta con ${K.lock}. Necesito la ${K.name}.`);
      strike('lock' + k);
    } else {
      Sfx.play('locked');
      toast(`CERRADA: NECESITAS LA ${K.name.toUpperCase()}`, false);
      jot('lock' + k, `En el ${where} hay una puerta con ${K.lock}. Necesito la ${K.name}.`);
    }
    G.touchCd = 1.2; return;
  }
  if (v === W_UP || v === W_DOWN) {
    const st = lv.stairs.get(i); if (!st) return;
    Sfx.play('stairs'); G.zPrev = G.z;
    enterLevel(st.to.z, st.to);
    return;
  }
  if (v === W_EXIT) { askExit(); G.touchCd = 1; return; }
  if (v === W_BARS) { toast('LAS REJAS NO CEDEN', false); G.touchCd = 1.2; return; }
  if (lv.secret.has(i)) {
    lv.secret.delete(i); lv.openCell(i);
    Sfx.play('secret'); G.shake = Math.max(G.shake, 0.4);
    burst(x + 0.5, y + 0.5, 0.6, 18, rgb(140, 130, 120), 2, 0.9, false, 0.07);
    toast('¡UN PASADIZO SECRETO!', true);
    jot('secret' + G.z + '_' + i, `La pared sonaba hueca en el ${where}: escondía un pasadizo secreto.`);
    G.touchCd = 0.6;
  }
}

function askExit() {
  G.state = 'exitask'; mouse.fire = false;
  if (document.exitPointerLock) document.exitPointerLock();
}
function leaveDungeon() {
  const m = G.meta;
  G.bank += G.loot;
  m.gold += G.loot; m.escapes++; m.bestLoot = Math.max(m.bestLoot, G.loot); m.bestDepth = Math.max(m.bestDepth, G.dg.n);
  saveMeta(); clearSave();
  G.final = { name: G.dg.name, loot: G.loot, bank: G.bank, n: G.dg.n, lvl: G.p.lvl, kills: G.kills, time: fmtTime(G.totalTime) };
  G.state = 'escaped'; Sfx.play('portal');
}
function nextDungeon() {
  const p = G.p;
  p.hp = p.maxHp; G.flashFx = 1;
  newDungeon(G.dg.n + 1);
  G.state = 'play'; lockMouse();
  saveRun();
}
function fmtTime(t) { return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`; }

// sala en la que está el jugador; arena: se cierra hasta vaciarla
function updateRooms(dt) {
  const lv = G.lv, p = G.p, ci = Math.floor(p.y) * MW + Math.floor(p.x), ri = lv.roomOf[ci], r = ri >= 0 ? lv.rooms[ri] : null;
  if (r && r.type === 'arena' && !r.done && !G.arena && lv.cells[ci] === 0) {
    // ¿totalmente dentro? (no en el umbral)
    if (p.x > r.x + 0.8 && p.x < r.x + r.w - 0.8 && p.y > r.y + 0.8 && p.y < r.y + r.h - 0.8) {
      const seal = [];
      for (const [i, o] of lv.openings) if (o.rooms.includes(ri)) { seal.push([i, lv.cells[i]]); lv.cells[i] = W_BARS; }
      lv.lightMap = lv.computeLightMap();
      G.arena = { lv, r, ri, wave: 0, waves: 3, seal, t: 1.2 };
      Sfx.play('bars'); G.shake = Math.max(G.shake, 0.4);
      toast('¡LA ARENA SE CIERRA!', true); logMsg('Las rejas caen a tu espalda', C.red);
    }
  }
  const A = G.arena;
  if (A && A.lv === lv) {
    const alive = G.enemies.some(e => !e.dead && e.arena);
    if (!alive) {
      A.t -= dt;
      if (A.t <= 0) {
        if (A.wave < A.waves) {
          A.wave++; A.t = 1.5;
          const n = 2 + A.wave * 2 + Math.floor(G.floor / 2), used = new Set();
          for (let k = 0; k < n; k++) { const [x, y] = roomSpot(lv, A.r, used); const e = spawnEnemy(pickType(), x, y); e.arena = true; vfxBlink(x, y, 'void'); }
          toast(`OLEADA ${A.wave}/${A.waves}`, false); Sfx.play('summon');
        } else {
          for (const [i] of A.seal) lv.cells[i] = 0;
          lv.lightMap = lv.computeLightMap();
          A.r.done = true; G.arena = null;
          G.pickups.push({ type: 'chest', x: A.r.cx + 0.5, y: A.r.cy + 0.5, t: 0, gold: Math.round(9 * G.floor * rand(8, 12)), item: 'potion' });
          Sfx.play('bars'); toast('¡ARENA SUPERADA!', true);
          jot('arena' + G.z, `Las rejas de la arena del ${levelName(G.z)} se cerraron a mi espalda. Sobreviví a tres oleadas y me llevé su premio.`);
        }
      }
    }
  }
  updateNpcs();
  // pinchos: suben y bajan; hieren al pisarlos subidos
  for (const s of lv.spikes) {
    s.up = ((G.time + s.ph) % 2.2) < 0.75;
    if (s.up && Math.floor(p.x) === s.x && Math.floor(p.y) === s.y && p.inv <= 0) { hurtPlayer(8 + 3 * G.floor, s.x + 0.5, s.y + 0.5); Sfx.play('trap'); }
  }
  // altares
  for (const sh of lv.shrines) {
    if (sh.used || Math.hypot(sh.x - p.x, sh.y - p.y) > 1.2) continue;
    sh.used = true; p.hp = p.maxHp;
    addBuff('bless', 'Bendición', 60, { dmg: 1.2, spd: 1.08 }, C.cyan);
    Sfx.play('shrine'); G.flashFx = 0.6;
    toast('UN ALTAR TE BENDICE', true); logMsg('Vida al máximo y +20% de daño durante un minuto', C.cyan);
    jot('shrine' + G.z, `Recé ante un altar olvidado del ${levelName(G.z)}. Sus velas se apagaron, pero sentí su bendición.`);
  }
  // fuentes: se bebe una vez; cura y limpia el veneno
  for (const d of G.decor) {
    if (d.type !== 'fountain' || d.used || Math.hypot(d.x - p.x, d.y - p.y) > 1.15) continue;
    d.used = true; healP(p.maxHp * 0.6);
    Sfx.play('shrine'); G.flashFx = 0.4;
    toast('BEBES DE LA FUENTE', true); logMsg('Recuperas el 60% de la vida', C.cyan);
  }
  // al entrar por primera vez en una sala temática se anuncia su nombre
  const rIn = lv.roomOf[Math.floor(p.y) * MW + Math.floor(p.x)];
  if (rIn >= 0 && rIn !== G.roomIn) {
    G.roomIn = rIn; const r = lv.rooms[rIn];
    if (ROOM_HINT[r.type] && !r.named) { r.named = true; toast(ROOM_NAME[r.type].toUpperCase(), false); logMsg(ROOM_HINT[r.type], C.dim); }
  }
}

// ---------------------------------------------------------------- Utilidades de juego
function lockMouse() {
  if (G.touchMode || (window.matchMedia && matchMedia('(pointer: coarse)').matches)) return; // en móvil no hay ratón que capturar
  if (document.pointerLockElement === canvas) return;
  try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) { /* sin bloqueo de ratón */ }
}
function toast(text, big) {
  G.toasts.push({ text, big, t: 2.8 });
  while (G.toasts.length > 4) G.toasts.shift();
}
function logMsg(text, col = C.ink) {
  wrapText(String(text).toUpperCase(), 34).forEach((t, i) => G.log.push({ text: t, col, cont: i > 0 }));
  if (G.log.length > 30) G.log.shift();
}

function burst(x, y, z, n, col, spd, life, add = true, size = 0.05) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), s = rand(0.3, 1) * spd;
    G.parts.push({ x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: rand(0.5, 2.4), life: rand(0.5, 1) * life, col, add, size });
  }
}

function hurtPlayer(d, sx, sy) {
  const p = G.p;
  if (p.inv > 0 || p.dashT > 0 || G.state !== 'play') return;
  if (p.riposte > 0) { // parada: anula el golpe y contraataca
    p.riposte = 0; p.buffs = p.buffs.filter(b => b.id !== 'riposte'); p.inv = 0.5;
    aoe(p.x, p.y, 2.7, 75 * p.dmgMul, { kb: 9, stun: 1 }); vRing(p.x, p.y, 0.4, 2.7, 0.25, VR.steel.slice(0, 4), 36); vfxDome('steel', 0.5); G.dome.ripple = 1;
    burst(p.x, p.y, 0.5, 14, rgb(255, 255, 255), 3, 0.4); Sfx.play('blade'); G.shake = Math.max(G.shake, 0.3);
    return;
  }
  if (p.wantBlock && p.off === 'shield' && WEAPONS[p.weapon].hands === 1 && sx !== undefined) {
    let da = Math.atan2(sy - p.y, sx - p.x) - p.a;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    if (Math.abs(da) < 1.25) { // el escudo cubre el frente
      d *= 0.2 * Math.max(0.15, 1 - eqStat('block')); p.inv = 0.25; G.shake = Math.max(G.shake, 0.12);
      equipOnBlock(d * 5, sx, sy);
      vfxImpact(p.x + Math.cos(p.a) * 0.7, p.y + Math.sin(p.a) * 0.7, 0.45, 'impact', 1);
      Sfx.play('hit');
    }
  }
  d *= p.armor;
  if (p.absorb > 0) { // armadura arcana
    const ab = Math.min(p.absorb, d); p.absorb -= ab; d -= ab;
    vfxDome('cyan', 0.6); G.dome.ripple = 1;
    if (p.absorb <= 0) { p.absorbT = 0; p.buffs = p.buffs.filter(b => b.id !== 'aarmor'); }
  }
  if (d < 0.5) { p.inv = 0.3; return; }
  p.hp -= Math.max(1, Math.round(d)); p.inv = 0.45; G.hurtFx = 1; G.shake = Math.max(G.shake, 0.3);
  Sfx.play('hurt'); if (typeof padRumble === 'function') padRumble(0.7, 160);
  equipOnHurt(d, sx, sy);
  if (eqSpecial('espinas') && sx !== undefined) { let best = null, bd = 2.2; for (const e of G.enemies) { const q = Math.hypot(e.x - sx, e.y - sy); if (!e.dead && q < bd) { bd = q; best = e; } } if (best) damageEnemy(best, d * 0.3, { silent: true }); }
  if (p.hp <= 0) die();
}

function die() {
  if (phylactery()) return;
  if (eqSpecial('fenix') && !G.phoenixUsed) { // el amuleto del fénix te devuelve a la vida una vez por mazmorra
    const p = G.p; G.phoenixUsed = true; p.hp = p.maxHp * 0.4; p.inv = 2.5; G.flashFx = 1; G.shake = 0.5;
    Sfx.play('portal'); toast('¡EL FÉNIX TE DEVUELVE A LA VIDA!', true); vfxPowerUp('fire');
    return;
  }
  G.state = 'dead';
  Sfx.play('die'); Sfx.stopMusic();
  if (document.exitPointerLock) document.exitPointerLock();
  const m = G.meta; m.deaths++; saveMeta();
  recordGhost(); clearSave();
  G.final = { name: G.dg.name, lost: G.loot, bank: G.bank, n: G.dg.n, lvl: G.p.lvl, kills: G.kills, time: fmtTime(G.totalTime) };
  logMsg('Has caído en la oscuridad...', C.red);
}

// ---------------------------------------------------------------- Proyectiles
function playerAttack() {
  const w = WEAPONS[G.p.weapon];
  if (w.kind === 'cast') castSpell(); else if (w.kind === 'shoot') shootArrow(); else meleeAttack();
}

function castSpell() {
  const p = G.p, sp = SPELLS[p.spell] || SPELLS.arcane;
  p.shootCd = sp.cd / p.rate; p.anim = 1;
  const arch = eqLegend('archimago') ? 1 : 0, n = p.multi + arch, spread = 0.1, sb = stealthBonus();
  for (let i = 0; i < n; i++) {
    const crit = Math.random() < p.crit;
    fireProj({ basic: true, a: p.a + (i - (n - 1) / 2) * spread, spd: 13, dmg: sp.dmg * p.dmgMul * (crit ? critMul() : 1) * sb * rand(0.9, 1.1), crit, pierce: p.pierce + arch, spr: crit ? 'orbGold' : sp.proj, size: crit ? 0.42 : 0.32, fx: sp.fx });
  }
  Sfx.play('shoot');
}

function shootArrow() {
  const p = G.p, w = WEAPONS.bow, el = p.element;
  p.shootCd = w.cd / p.rate; p.anim = 1;
  const n = p.multi, sb = stealthBonus();
  for (let i = 0; i < n; i++) {
    const crit = Math.random() < p.crit;
    fireProj({ basic: true, a: p.a + (i - (n - 1) / 2) * 0.08, spd: 17, dmg: w.dmg * p.dmgMul * (crit ? critMul() : 1) * sb * rand(0.9, 1.1), crit, pierce: p.pierce + (eqLegend('almas') ? 2 : 0), spr: crit ? 'orbGold' : arrowSprFor(el), size: el || crit ? 0.3 : 0.22, fx: arrowFxFor(el), life: 1.3 });
  }
  Sfx.play('shoot');
}

function meleeAttack() {
  const p = G.p, w = WEAPONS[p.weapon], lv = G.lv;
  p.shootCd = w.cd / p.rate;
  p.swingDir = -p.swingDir;
  // animación pose a pose que dura todo el ciclo; el daño entra en el fotograma del golpe
  const fam = moveFamily(p.weapon), move = comboMove(p.weapon, p.combo = (p.combo || 0) + 1);
  p.swing = { t: 0, dur: p.shootCd, dir: p.swingDir, move };
  p.swing.hit = strikeT(fam, move) * p.swing.dur;
  p.swing.strike = meleeHit;
}

function meleeHit() {
  const p = G.p, w = WEAPONS[p.weapon], lv = G.lv;
  Sfx.play('swing');
  const sb = stealthBonus(), shadow = classPassive(p.cls, 'shadowHit', false), holy = classPassive(p.cls, 'holyHit', false);
  let hits = 0;
  for (const e of G.enemies) {
    if (e.dead) continue;
    const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
    if (d > w.range + e.def.r) continue;
    let da = Math.atan2(dy, dx) - p.a; da = Math.atan2(Math.sin(da), Math.cos(da));
    if (Math.abs(da) > w.arc / 2 && d > e.def.r + 0.45) continue;
    if (!lv.los(p.x, p.y, e.x, e.y)) continue;
    const crit = Math.random() < p.crit;
    const dd = w.dmg * p.dmgMul * (crit ? critMul() : 1) * sb * rand(0.9, 1.1);
    damageEnemy(e, dd, { kx: dx / (d || 1) * w.kb, ky: dy / (d || 1) * w.kb, crit });
    forgeHit(e, dd); equipHit(e, dd, crit);
    if (hits < 4) vfxImpact(e.x, e.y, 0.5, shadow ? 'arcane' : 'steel', 0.7);
    if (shadow) applyFx(e, { slow: 1.5 });
    if (holy) healP(p.maxHp * 0.012);
    hits++;
  }
  // desviar proyectiles enemigos
  for (const pr of G.projs) {
    if (pr.friendly || pr.dead) continue;
    const dx = pr.x - p.x, dy = pr.y - p.y, d = Math.hypot(dx, dy);
    let da = Math.atan2(dy, dx) - p.a; da = Math.atan2(Math.sin(da), Math.cos(da));
    if (d < w.range + 0.4 && Math.abs(da) < w.arc / 2) { pr.dead = true; burst(pr.x, pr.y, 0.4, 8, rgb(255, 240, 180), 2.5, 0.4); hits++; }
  }
  // arma encantada: lanza una onda de energía
  if (p.buffs.some(b => b.id === 'enchant')) fireProj({ spr: 'orbBlue', size: 0.6, spd: 12, dmg: w.dmg * 0.7 * p.dmgMul, pierce: 3, life: 1, r: 0.35, fx: { burn: 2 } });
  G.shake = Math.max(G.shake, hits ? (p.weapon === 'greatsword' ? 0.28 : 0.14) : 0.04);
  if (hits && p.swing) p.swing.freeze = p.weapon === 'greatsword' ? 0.07 : 0.04; // parón del impacto
}

function equipSlot(i) {
  const p = G.p, slots = CLASSES[p.cls].slots;
  if (i >= slots.length || i === p.slot || p.form !== 'human') return;
  p.slot = i; p.swing = null; p.anim = 0;
  const w = WEAPONS[slots[i].w];
  if (w.hands !== 1) p.wantBlock = false;
  applyStats();
  logMsg(`Empuñas: ${slots[i].spell ? 'Bastón de ' + SPELLS[slots[i].spell].name : w.name}${w.hands === 2 ? ' (dos manos)' : ''}`, C.gold);
  Sfx.play('blade');
}
// F: alzar o bajar el escudo (la antorcha se guarda sin apagarse del todo: conserva su combustible)
function toggleOffhand() {
  const p = G.p;
  if (WEAPONS[p.weapon].hands !== 1) { logMsg('Esa arma necesita ambas manos', C.dim); return; }
  if (p.off === 'shield') { p.off = p.torchFuel > 0 ? 'torch' : 'none'; p.wantBlock = false; logMsg(p.off === 'torch' ? 'Vuelves a empuñar la antorcha' : 'Guardas el escudo', C.gold); }
  else { p.off = 'shield'; logMsg('Equipas el escudo (clic der. para bloquear)', C.gold); }
}
function offhandOf(p) { return WEAPONS[p.weapon].hands === 1 ? p.off : 'none'; }

// encender (o volver a empuñar) una antorcha desde el inventario
function equipTorch() {
  const p = G.p;
  if (WEAPONS[p.weapon].hands !== 1) { toast('NECESITAS UNA MANO LIBRE', false); logMsg('Cambia a un arma de una mano para llevar antorcha', C.dim); return false; }
  if (p.off === 'torch') { p.off = 'none'; logMsg('Guardas la antorcha', C.dim); return true; }
  if (p.torchFuel <= 0) {
    if (!G.inv.torch) { toast('NO TE QUEDAN ANTORCHAS', false); return false; }
    G.inv.torch--; p.torchFuel = TORCH_FUEL;
    logMsg('Enciendes una antorcha', C.orange);
  } else logMsg('Vuelves a empuñar la antorcha', C.orange);
  p.off = 'torch'; p.wantBlock = false; Sfx.play('torch');
  return true;
}
function updateTorch(dt) {
  const p = G.p;
  if (offhandOf(p) !== 'torch') return;
  p.torchFuel -= dt;
  if (p.torchFuel <= 0) {
    p.torchFuel = 0; p.off = 'none'; Sfx.play('torchOut');
    toast('TU ANTORCHA SE APAGA', false);
    logMsg(G.inv.torch ? `Se consume la antorcha. Te quedan ${G.inv.torch} (I)` : 'Se consume tu última antorcha...', C.orange);
  }
}

function openInventory() { if (G.state !== 'play') return; G.state = 'inventory'; mouse.fire = false; if (document.exitPointerLock) document.exitPointerLock(); }
function closeInventory() { if (G.state !== 'inventory') return; G.state = 'play'; lockMouse(); }
function invAction(id) {
  if (id === 'torch') equipTorch();
  else if (id === 'shield') { const p = G.p; if (WEAPONS[p.weapon].hands !== 1) { toast('NECESITAS UNA MANO LIBRE', false); return; } toggleOffhand(); }
  else if (id === 'potion') drinkPotion();
  else if (id === 'map') { readMap(); }
  else if (id === 'rune') { closeInventory(); useRune(); }
  else if (id === 'close') closeInventory();
}

function enemyShot(x, y, a, spd, dmg, proj, size = 0.4) {
  G.projs.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, r: 0.2, life: 5, friendly: false, dmg, spr: proj, size });
}

function updateProjs(dt) {
  const lv = G.lv, p = G.p;
  for (const pr of G.projs) {
    if (Math.random() < 0.8) vfxTrail(pr);
    const steps = Math.max(1, Math.ceil(Math.hypot(pr.vx, pr.vy) * dt / 0.25));
    const sdt = dt / steps;
    for (let s = 0; s < steps && !pr.dead; s++) {
      pr.x += pr.vx * sdt; pr.y += pr.vy * sdt;
      if (lv.solid(pr.x, pr.y)) {
        pr.dead = true;
        burst(pr.x - pr.vx * sdt, pr.y - pr.vy * sdt, 0.4, 6, pr.friendly ? rgb(140, 200, 255) : rgb(255, 150, 60), 2, 0.5);
        if (pr.explode) explodeAt(pr.x - pr.vx * sdt, pr.y - pr.vy * sdt, pr.explode);
        else vfxImpact(pr.x - pr.vx * sdt, pr.y - pr.vy * sdt, 0.45, PROJ_RAMP[pr.spr] === 'fire' ? 'impact' : PROJ_RAMP[pr.spr] || 'impact', 0.8);
        break;
      }
      if (pr.friendly) {
        for (const e of G.enemies) {
          if (e.dead || pr.hit.has(e)) continue;
          const dx = e.x - pr.x, dy = e.y - pr.y, rr = e.def.r + pr.r;
          if (dx * dx + dy * dy < rr * rr) {
            pr.hit.add(e);
            damageEnemy(e, pr.dmg, { kx: pr.vx * 0.12, ky: pr.vy * 0.12, crit: pr.crit });
            hitFx(e, pr.fx, pr);
            if (pr.basic) { forgeHit(e, pr.dmg); equipHit(e, pr.dmg, pr.crit); }
            if (!pr.explode) vfxImpact(pr.x, pr.y, 0.45, PROJ_RAMP[pr.spr] === 'fire' ? 'impact' : PROJ_RAMP[pr.spr] || 'impact', 0.6);
            if (pr.explode) { explodeAt(pr.x, pr.y, pr.explode); pr.dead = true; break; }
            if (pr.pierce-- <= 0) { pr.dead = true; break; }
          }
        }
      } else {
        const dx = p.x - pr.x, dy = p.y - pr.y, rr = 0.25 + pr.r;
        if (dx * dx + dy * dy < rr * rr && equipReflect(pr)) { vfxImpact(pr.x, pr.y, 0.45, 'steel', 0.8); Sfx.play('blade'); }
        else if (dx * dx + dy * dy < rr * rr) { hurtPlayer(Math.round(pr.dmg), pr.x - pr.vx * 0.1, pr.y - pr.vy * 0.1); pr.dead = true; vfxImpact(pr.x, pr.y, 0.45, PROJ_RAMP[pr.spr] || 'impact', 0.8); }
      }
    }
    pr.life -= dt;
    if (pr.life <= 0) pr.dead = true;
  }
  G.projs = G.projs.filter(pr => !pr.dead);
}

// ---------------------------------------------------------------- Enemigos
function pickType() {
  const t = G.t, f = G.floor;
  const pool = [['skeleton', 8], ['bat', 5]];
  if (t > 14 || f > 1) pool.push(['slime', 2 + f * 0.6]);
  if (t > 28 || f > 1) pool.push(['wraith', 1 + f * 0.8]);
  if (t > 42 || f > 2) pool.push(['imp', 1 + f * 0.6]);
  // fauna propia de cada temática: [tipo, peso, +peso por piso, aparece tras N s (o desde el piso 2)]
  const th = THEMES[(G.lv ? G.lv.theme : 0) % THEMES.length];
  for (const [type, w, perF = 0, minT = 0] of th.fauna) if (!minT || t > minT || f > 1) pool.push([type, w + perF * f]);
  let tot = 0; for (const [, w] of pool) tot += w;
  let r = Math.random() * tot;
  for (const [n, w] of pool) { if ((r -= w) <= 0) return n; }
  return 'skeleton';
}

// cada mazmorra nueva es más dura por sí misma, además de la profundidad y el tiempo
const DG_HP = 0.25, DG_DMG = 0.06;
function spawnEnemy(type, x, y) {
  const d = ENEMY[type], diff = (G.floor - 1) + Math.min(3, G.t / 120), dk = G.dg ? G.dg.n - 1 : 0;
  let hp = d.hp * (1 + 0.4 * diff) * (1 + DG_HP * dk);
  if (d.boss) hp = d.hp * (1 + 0.75 * (G.floor - 1)) * (1 + DG_HP * dk);
  const e = {
    type, def: d, x, y, hp, maxHp: hp,
    spd: d.spd * Math.min(1.45, 1 + 0.04 * diff) * rand(0.92, 1.08),
    dmgM: 1 + 0.14 * diff + DG_DMG * dk, atk: rand(0, 0.6), flash: 0, slow: 0, shoot: rand(0.8, 2), los: false, losT: 0,
    wob: rand(0, TAU), bladeCd: 0, kx: 0, ky: 0, ring: 6, walk: rand(0, 2),
  };
  G.enemies.push(e);
  return e;
}

function findSpawn(minD, maxD, needHidden) {
  const lv = G.lv, p = G.p;
  for (let i = 0; i < 40; i++) {
    const c = pick(lv.floorCells), x = c[0] + 0.5, y = c[1] + 0.5, ri = lv.roomOf[c[1] * MW + c[0]];
    if (ri >= 0 && ['secreta', 'mercader', 'herrero', 'santuario', 'entrada'].includes(lv.rooms[ri].type)) continue;
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
  const n = type === 'bat' ? randi(2, 3) : (Math.random() < Math.min(0.5, t / 400) ? 2 : 1);
  const pos = findSpawn(10, 26, true);
  if (!pos) return;
  for (let i = 0; i < n; i++) spawnEnemy(type, pos[0] + rand(-0.4, 0.4), pos[1] + rand(-0.4, 0.4));
}

// Oleadas: cada 2 minutos en el mismo piso llega una horda desde un punto al azar, cada vez mayor y más dura.
// El contador vuelve a 0 al cambiar de piso o de mazmorra.
const WAVE_EVERY = 120, WAVE_WARN = 10;
function updateWaves(dt) {
  if (G.arena || (G.boss && !G.boss.dead && !G.boss.sleep)) return; // no interrumpe la pelea con el jefe
  const before = G.waveT || 0; G.waveT = before + dt;
  if (before < WAVE_EVERY - WAVE_WARN && G.waveT >= WAVE_EVERY - WAVE_WARN) {
    toast('SE OYEN PASOS QUE SE ACERCAN...', false); logMsg('Algo se acerca desde las sombras...', C.orange); Sfx.play('roar');
  }
  if (G.waveT < WAVE_EVERY) return;
  const pos = findSpawn(9, 30, true) || findSpawn(7, 40, false);
  if (!pos) { G.waveT = WAVE_EVERY - 3; return; }
  G.waveT = 0; G.waveN = (G.waveN || 0) + 1;
  const k = G.waveN, n = Math.min(26, 3 + 3 * k + (G.dg ? G.dg.n : 1)), hpMul = 1 + 0.3 * k;
  const types = [pickType(), pickType(), pickType()];
  for (let i = 0; i < n; i++) {
    const e = spawnEnemy(types[i % 3], pos[0] + rand(-0.6, 0.6), pos[1] + rand(-0.6, 0.6));
    if (G.lv.blocked(e.x, e.y, 0.25)) { e.x = pos[0]; e.y = pos[1]; }
    e.hp *= hpMul; e.maxHp *= hpMul; e.sleep = false; e.wave = k;
  }
  toast(`¡OLEADA ${k}!`, true); logMsg(`Oleada ${k}: ${n} enemigos salen de las sombras`, C.red);
  Sfx.play('boss'); G.shake = Math.max(G.shake, 0.4);
}

function wakeEnemy(e) {
  e.sleep = false;
  if (e.ghost && G.elite !== e) { G.elite = e; toast(`¡${e.def.name.toUpperCase()} DESPIERTA!`, true); logMsg(`Un fantasma rencoroso de nivel ${e.ghost.lvlNow} te reconoce...`, C.cyan); Sfx.play('roar'); G.shake = Math.max(G.shake, 0.4); }
  if (e.def.boss && !G.boss) {
    G.boss = e;
    toast(`¡${e.def.name} DESPIERTA!`, true); logMsg('Un rugido sacude la mazmorra...', C.red);
    Sfx.play('boss'); G.shake = 0.6;
  }
}

function damageEnemy(e, dmg, o = {}) {
  if (e.dead) return;
  if (e.corrode > 0) dmg *= 1.4;
  e.hp -= dmg; e.flash = 0.1;
  if (e.sleep) wakeEnemy(e);
  const p = G.p;
  if (p.leech > 0) p.hp = Math.min(p.maxHp, p.hp + dmg * p.leech);
  const kb = e.def.boss ? 0.1 : 1;
  e.kx += (o.kx || 0) * kb; e.ky += (o.ky || 0) * kb;
  burst(e.x, e.y, 0.4, o.silent ? 2 : (o.crit ? 8 : 4), o.crit ? rgb(255, 220, 90) : rgb(255, 255, 255), 1.8, 0.4);
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
  forgeOnKill(e); equipOnKill(e);
  if (e.ghost) {
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
    G.pickups.push({ type: 'potion', x: e.x - 0.6, y: e.y, t: 0 });
    onBossDead(e);
    return;
  }
  dropGem(e.x, e.y, d.xp * (1 + 0.5 * (G.floor - 1)));
  if (Math.random() < 0.05) G.pickups.push({ type: 'potion', x: e.x, y: e.y, t: 0 });
}

function onBossDead(e) {
  G.boss = null;
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
    e.flash -= dt; e.slow -= dt; e.atk -= dt; e.bladeCd -= dt; e.wob += dt * 6;
    e.losT -= dt;
    if (e.burn > 0) { e.burn -= dt; dot(e, (e.burnDps || 6) * dt); if (Math.random() < dt * 16) vfxBurn(e); }
    if (e.poison > 0) { e.poison -= dt; dot(e, (e.poisDps || 4) * dt); if (Math.random() < dt * 6) vfxPoisoned(e); }
    if (e.corrode > 0) e.corrode -= dt;
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
    let ax = tx - e.x, ay = ty - e.y;
    const al = Math.hypot(ax, ay) || 0.001; ax /= al; ay /= al;
    let spd = e.spd * (e.slow > 0 ? 0.4 : 1);
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
    const ox = e.x, oy = e.y;
    lv.move(e, ax * spd * dt + e.kx * dt, ay * spd * dt + e.ky * dt, Math.min(d.r, 0.3));
    e.walk += Math.hypot(e.x - ox, e.y - oy);
    e.kx *= Math.max(0, 1 - dt * 7); e.ky *= Math.max(0, 1 - dt * 7);

    // ataque cuerpo a cuerpo
    if (d.dmg > 0 && !stunned && e.atk <= 0) {
      if (ally && ad < d.r + ally.def.r + 0.45) {
        ally.hp -= d.dmg * e.dmgM; ally.flash = 0.1; e.atk = 0.9;
        if (ally.hp <= 0) allyKill(ally);
      } else if (dist < d.r + 0.5 && !hidden) {
        hurtPlayer(Math.round(d.dmg * e.dmgM), e.x, e.y); e.atk = d.boss ? 1.1 : 0.9;
      }
    }
    // ataque a distancia
    if (d.ranged && !stunned && !hidden) {
      e.shoot -= dt;
      if (e.shoot <= 0 && e.los && dist < 14) {
        e.shoot = d.ranged.cd * rand(0.85, 1.2);
        enemyShot(e.x, e.y, Math.atan2(dy, dx), d.ranged.spd, d.ranged.dmg * e.dmgM, d.ranged.proj);
        Sfx.play('enemyShoot');
      }
    }
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
  e.shoot -= dt; e.ring -= dt; e.summon -= dt;
  const base = Math.atan2(dy, dx);
  if (ai === 'lich') { // abanicos arcanos e invoca esqueletos
    if (e.shoot <= 0 && e.los) { e.shoot = rage ? 1.3 : 2; const n = rage ? 5 : 3; for (let i = 0; i < n; i++) enemyShot(e.x, e.y, base + (i - (n - 1) / 2) * 0.22, 6, 13 * e.dmgM, 'orbBlue', 0.45); Sfx.play('enemyShoot'); }
    if (e.summon <= 0) { e.summon = rage ? 7 : 10; bossSummon(e, 'skeleton', rage ? 4 : 3); }
  } else if (ai === 'queen') { // crías y escupitajos
    if (e.shoot <= 0 && e.los) { e.shoot = rage ? 1.6 : 2.4; for (let i = 0; i < 4; i++) enemyShot(e.x, e.y, base + rand(-0.3, 0.3), rand(4.5, 6.5), 10 * e.dmgM, 'orbGreen', 0.4); Sfx.play('enemyShoot'); }
    if (e.summon <= 0) { e.summon = rage ? 5.5 : 8; bossSummon(e, 'spider', rage ? 5 : 3); }
  } else if (ai === 'eye') { // espirales de orbes
    if (e.ring <= 0) { e.ring = 0.18; e.spin = (e.spin || 0) + (rage ? 0.5 : 0.38); const arms = rage ? 4 : 3; for (let k = 0; k < arms; k++) enemyShot(e.x, e.y, e.spin + k / arms * TAU, 3.4, 9 * e.dmgM, 'orbPurple', 0.38); }
    if (e.shoot <= 0 && e.los) { e.shoot = 3; for (let i = 0; i < 3; i++) enemyShot(e.x, e.y, base + (i - 1) * 0.1, 8, 14 * e.dmgM, 'orbPurple', 0.5); Sfx.play('enemyShoot'); }
  }
}

// ---------------------------------------------------------------- Habilidades pasivas
function updatePassives(dt) {
  const p = G.p;
  const nb = L('blades');
  if (nb > 0) {
    G.bladeAng += dt * (3 + 0.4 * nb);
    const dmg = 7 * (1 + 0.3 * (nb - 1)) * p.dmgMul;
    for (let i = 0; i < nb; i++) {
      const a = G.bladeAng + i / nb * TAU, bx = p.x + Math.cos(a) * 1.3, by = p.y + Math.sin(a) * 1.3;
      for (const e of G.enemies) {
        if (e.dead || e.bladeCd > 0 || !G.lv.los(p.x, p.y, e.x, e.y)) continue;
        const dx = e.x - bx, dy = e.y - by, rr = e.def.r + 0.3;
        if (dx * dx + dy * dy < rr * rr) {
          e.bladeCd = 0.35; Sfx.play('blade');
          damageEnemy(e, dmg, { kx: Math.cos(a + 1.57) * 2, ky: Math.sin(a + 1.57) * 2 });
        }
      }
    }
  }
  const ln = L('nova');
  if (ln > 0) {
    G.novaT -= dt;
    if (G.novaT <= 0) {
      G.novaT = Math.max(2.5, 7 - 0.9 * ln);
      const rad = 3.2 + 0.5 * ln, dmg = (14 + 10 * ln) * p.dmgMul;
      for (const e of G.enemies) {
        const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
        if (e.dead || d > rad || !canHit(e)) continue;
        e.slow = 2.5;
        damageEnemy(e, dmg, { kx: dx / (d || 1) * 9, ky: dy / (d || 1) * 9 });
      }
      vfxIceNova(p.x, p.y, rad);
      G.novaFx = 1; Sfx.play('nova');
    }
  }
  const lb = L('bolt');
  if (lb > 0) {
    G.boltT -= dt;
    if (G.boltT <= 0) {
      G.boltT = Math.max(0.9, 3.2 - 0.45 * lb);
      const targets = G.enemies.filter(e => !e.dead && canHit(e)).sort(() => Math.random() - 0.5).slice(0, lb + 1);
      if (targets.length) {
        for (const e of targets) {
          vfxStrike(e.x, e.y);
          damageEnemy(e, (20 + 8 * lb) * p.dmgMul, {});
        }
        Sfx.play('bolt'); G.shake = Math.max(G.shake, 0.12);
      }
    }
  }
}

// ---------------------------------------------------------------- Recogidos y partículas
function xpNeed(l) { return Math.round(4 + 2.4 * l + 0.16 * l * l); }

function addXp(v) {
  const p = G.p;
  p.xp += v * p.xpMul;
  while (p.xp >= xpNeed(p.lvl)) { p.xp -= xpNeed(p.lvl); p.lvl++; G.pending++; }
  const nx = CLASSES[p.cls].next;
  if (nx && p.lvl >= nx) G.evolveReady = true;
  if (G.pending > 0 && G.state === 'play') openLevelUp();
}

function updatePickups(dt) {
  const p = G.p;
  for (const k of G.pickups) {
    k.t += dt;
    const dx = p.x - k.x, dy = p.y - k.y, d = Math.hypot(dx, dy) || 0.001;
    if (k.type === 'gem') {
      if (d < p.magnet || k.mag) {
        k.mag = true;
        const s = 7 + (p.magnet - d) * 2;
        k.x += dx / d * s * dt; k.y += dy / d * s * dt;
      } else { // pequeño impulso inicial
        k.x += (k.vx || 0) * dt; k.y += (k.vy || 0) * dt;
        k.vx *= 0.92; k.vy *= 0.92;
        if (G.lv.solid(k.x, k.y)) { k.x -= (k.vx || 0) * dt; k.y -= (k.vy || 0) * dt; k.vx = k.vy = 0; }
      }
      if (d < 0.5) { k.dead = true; Sfx.play('gem'); addXp(k.v); }
    } else if (k.type === 'potion') {
      if (d < p.magnet * 0.5 + 0.4) { k.x += dx / d * 5 * dt; k.y += dy / d * 5 * dt; }
      if (d < 0.55) {
        k.dead = true; p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.3);
        Sfx.play('potion'); logMsg('Bebes una poción: +vida', C.green);
      }
    } else if (k.type === 'gold') {
      if (d < p.magnet * 0.6 || k.mag) { k.mag = true; k.x += dx / d * 6 * dt; k.y += dy / d * 6 * dt; }
      if (d < 0.5) { k.dead = true; G.loot += k.v; Sfx.play('coin'); logMsg(`+${k.v} de oro`, C.gold); }
    } else if (k.type === 'item') {
      if (k.declined) { if (d > 1.2) k.declined = false; } // lo dejaste: vuelve a preguntar si te alejas y regresas
      else if (d < 0.7) { k.dead = true; takeItem(k.item); }
    } else if (k.type === 'torch') {
      if (d < 0.7) { k.dead = true; G.inv.torch++; Sfx.play('gem'); toast('+1 ANTORCHA', false); logMsg(`Recoges una antorcha (${G.inv.torch})`, C.orange); }
    } else if (k.type === 'key') {
      if (d < 0.7) {
        k.dead = true; takeKey(k.key);
      }
    } else if (k.type === 'chest') {
      if (!k.open && d < 0.95) openChest(k);
    }
  }
  G.pickups = G.pickups.filter(k => !k.dead);
}

function takeKey(k) {
  if (G.keys.includes(k)) return;
  G.keys.push(k);
  Sfx.play('unlock'); G.flashFx = 0.4;
  toast(KEYS[k].name.toUpperCase(), true);
  logMsg(`Consigues la ${KEYS[k].name}`, C.gold);
  const p = G.p;
  jot('key' + k, `Encontré la ${KEYS[k].name} en el ${levelName(G.z)}, ${wingOf(Math.floor(p.x), Math.floor(p.y))}.`);
}
function openChest(c) {
  c.open = true; Sfx.play('chest');
  let left = c.gold;
  const n = Math.min(6, Math.max(2, Math.round(c.gold / 40)));
  for (let i = 0; i < n; i++) {
    const v = i === n - 1 ? left : Math.round(c.gold / n); left -= v;
    const a = rand(0, TAU), r = rand(0.35, 0.7);
    let x = c.x + Math.cos(a) * r, y = c.y + Math.sin(a) * r;
    if (G.lv.solid(x, y)) { x = c.x; y = c.y; }
    G.pickups.push({ type: 'gold', x, y, v, t: rand(0, 6) });
  }
  if (c.item === 'potion') G.pickups.push({ type: 'potion', x: c.x, y: c.y + 0.3, t: 0 });
  if (c.torch) G.pickups.push({ type: 'torch', x: c.x - 0.3, y: c.y + 0.2, t: 0 });
  if (c.eq) dropItem(c.eqSrc || 'chest', c.x + 0.3, c.y + 0.2);
  else if (c.item && c.item.key !== undefined) takeKey(c.item.key);
  burst(c.x, c.y, 0.3, 14, rgb(255, 220, 110), 2, 0.7, true, 0.05);
  logMsg(`Abres un cofre: ${c.gold} de oro`, C.gold);
}

function updateParts(dt) {
  for (const q of G.parts) {
    q.life -= dt;
    q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.vz -= 5 * dt;
    if (q.z < 0) { q.z = 0; q.vz *= -0.3; q.vx *= 0.6; q.vy *= 0.6; }
    if (G.lv.solid(q.x, q.y)) { q.x -= q.vx * dt; q.y -= q.vy * dt; q.vx = q.vy = 0; }
  }
  G.parts = G.parts.filter(q => q.life > 0);
  for (const f of G.fx) f.life -= dt;
  G.fx = G.fx.filter(f => f.life > 0);
  if (G.parts.length > 400) G.parts.splice(0, G.parts.length - 400);
}

// ---------------------------------------------------------------- Mejoras
function openLevelUp() {
  G.state = 'levelup';
  if (document.exitPointerLock) document.exitPointerLock();
  mouse.fire = false;
  const pool = UPG.filter(u => L(u.id) < u.max);
  const opts = [];
  while (opts.length < 3 && pool.length) opts.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  G.opts = opts;
  if (!opts.length) { G.p.hp = G.p.maxHp; G.pending = 0; closeLevelUp(); return; }
  Sfx.play('level');
}

function chooseUpgrade(i) {
  if (G.state !== 'levelup') return;
  const u = G.opts[i]; if (!u) return;
  G.upg[u.id] = L(u.id) + 1;
  if (u.id === 'vit') G.p.hp += 30;
  if (u.id === 'nova') G.novaT = Math.min(G.novaT, 1);
  recalc();
  G.pending--;
  logMsg(`Aprendes ${u.name} (nv ${L(u.id)})`, u.passive ? C.orange : C.gold);
  if (G.pending > 0) openLevelUp(); else closeLevelUp();
}

function closeLevelUp() {
  if (G.evolveReady) { openEvolve(); return; }
  G.state = 'play';
  lockMouse();
}

// ---------------------------------------------------------------- Selección y evolución de clase
function classCard(id) {
  const c = CLASSES[id];
  return {
    name: c.name, tag: c.tag, tier: c.tier, desc: c.desc,
    skills: c.skills.map((s, i) => `${SKILL_LABEL[i]} ${SKILLS[s].name}`),
    weapons: c.slots.map(s => s.spell ? 'Bastón de ' + SPELLS[s.spell].name : WEAPONS[s.w].name),
    next: c.to ? c.to.map(t => CLASSES[t].name) : null, lvl: c.next,
  };
}
function openClassSelect() {
  G.state = 'classselect'; mouse.fire = false;
  if (document.exitPointerLock) document.exitPointerLock();
  G.choice = { title: 'ELIGE TU CAMINO', sub: 'Evolucionarás en los niveles 20 y 40', items: BASE_CLASSES.map(classCard), pick: (i) => { newRun(BASE_CLASSES[i]); lockMouse(); } };
}
function openEvolve() {
  const p = G.p, c = CLASSES[p.cls];
  G.evolveReady = false;
  if (!c.to) { G.state = 'play'; lockMouse(); return; }
  G.state = 'evolve'; mouse.fire = false;
  if (document.exitPointerLock) document.exitPointerLock();
  Sfx.play('portal');
  G.choice = { title: '¡EVOLUCIÓN!', sub: `${c.name} alcanza el nivel ${p.lvl}: elige tu destino`, items: c.to.map(classCard), pick: (i) => { setClass(c.to[i], true); G.state = 'play'; G.choice = null; lockMouse(); } };
}
function pickChoice(i) {
  if (!G.choice || i < 0 || i >= G.choice.items.length) return;
  const f = G.choice.pick; f(i);
}

// ---------------------------------------------------------------- Jugador
function updatePlayer(dt) {
  const p = G.p, lv = G.lv;
  const turn = ((keys.ArrowRight || keys.KeyE) ? 1 : 0) - ((keys.ArrowLeft || keys.KeyQ) ? 1 : 0);
  p.a += turn * 2.5 * dt;
  let [f, s] = moveInput();
  const len = Math.hypot(f, s); if (len > 1) { f /= len; s /= len; }
  const dX = Math.cos(p.a), dY = Math.sin(p.a), rX = -dY, rY = dX;
  const mx = dX * f + rX * s, my = dY * f + rY * s;
  p.moveAmt = len > 0 ? 1 : 0;
  const k = Math.min(1, dt * 14);
  const spd = p.spd * (p.wantBlock && p.off === 'shield' && WEAPONS[p.weapon].hands === 1 ? 0.55 : 1);
  p.vx += (mx * spd - p.vx) * k; p.vy += (my * spd - p.vy) * k;
  if (p.dashT > 0) {
    p.dashT -= dt;
    lv.move(p, p.dashDx * 11 * dt, p.dashDy * 11 * dt, 0.22);
  } else {
    lv.move(p, p.vx * dt, p.vy * dt, 0.22);
  }
  if (len > 0) { const ob = p.bob; p.bob += dt * 9 * (p.spd / 3.6); if (Math.floor(ob / Math.PI) !== Math.floor(p.bob / Math.PI)) Sfx.play('step'); }
  if (offhandOf(p) === 'torch' && Math.random() < dt * 2.5) Sfx.play('crackle');
  p.inv -= dt; p.dashCd -= dt; p.shootCd -= dt; p.anim = Math.max(0, p.anim - dt * 5);
  for (let i = 0; i < 3; i++) p.skillCd[i] -= dt;
  const rg = p.regen + p.regenPct * p.maxHp;
  if (rg > 0) p.hp = Math.min(p.maxHp, p.hp + rg * dt);
  const blocking = p.wantBlock && p.off === 'shield' && WEAPONS[p.weapon].hands === 1;
  p.block += ((blocking ? 1 : 0) - p.block) * Math.min(1, dt * 14);
  // caminar contra una pared especial (puerta, escalera, salida, muro secreto)
  const mvL = Math.hypot(mx, my);
  if (mvL > 0.1) {
    const ux = mx / mvL, uy = my / mvL;
    const tx = Math.floor(p.x + ux * 0.42), ty = Math.floor(p.y + uy * 0.42);
    if (lv.at(tx, ty) !== 0) touchCell(tx, ty);
    if (G.state !== 'play' || G.lv !== lv) return;
  }
  if (p.bash) { p.bash.t += dt; if (p.bash.t >= p.bash.dur) p.bash = null; }
  if (p.swing) {
    const s = p.swing;
    if (s.freeze > 0) s.freeze -= dt; else s.t += dt;
    if (s.strike && s.t >= s.hit) { const f = s.strike; s.strike = null; f(); }
    if (p.swing === s && s.t >= s.dur) p.swing = null;
  }
  const autoFire = autoAttack(dt, turn, blocking);
  if ((mouse.fire || keys.Space || autoFire) && p.shootCd <= 0 && !blocking) {
    playerAttack();
  }
}

// Ataque automático (opción): con un enemigo a menos de 5 m la cámara gira hacia el más cercano que se vea
// y ataca cuando está a su alcance (cuerpo a cuerpo: al alcance del arma; a distancia: dentro de los 5 m).
// El jugador manda siempre: mientras ataca o mueve la cámara, el modo automático espera; al soltar, vuelve.
const AUTO_R = 5, AUTO_TURN = 5.5, AUTO_IDLE = 0.6;
function autoAttack(dt, turn, blocking) {
  const p = G.p; G.autoT = null;
  if (!G.cfg.autoAtk || blocking || p.wantBlock) return false;
  if (mouse.fire || keys.Space || turn || G.time - (G.manualLook ?? -9) < AUTO_IDLE) return false;
  const t = nearestEnemy(AUTO_R, true); if (!t) return false;
  G.autoT = t;
  const want = Math.atan2(t.y - p.y, t.x - p.x), d = ((want - p.a + Math.PI) % TAU + TAU) % TAU - Math.PI;
  p.a += clamp(d, -AUTO_TURN * dt, AUTO_TURN * dt);
  const w = WEAPONS[p.weapon], dist = Math.hypot(t.x - p.x, t.y - p.y);
  const reach = w.kind === 'melee' ? w.range + (t.def.r || 0.3) : AUTO_R;
  return Math.abs(d) < 0.3 && dist <= reach;
}

// avance (f) y lateral (s) entre -1 y 1: teclado o joystick táctil
function moveInput() {
  let f = ((keys.KeyW || keys.ArrowUp) ? 1 : 0) - ((keys.KeyS || keys.ArrowDown) ? 1 : 0);
  let s = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
  if (G.stick) { f += G.stick.f; s += G.stick.s; }
  if (G.padMove) { f += G.padMove.f; s += G.padMove.s; }
  return [clamp(f, -1, 1), clamp(s, -1, 1)];
}

function tryDash() {
  const p = G.p;
  if (G.state !== 'play' || p.dashCd > 0) return;
  let [f, s] = moveInput();
  if (!f && !s) f = 1;
  const dX = Math.cos(p.a), dY = Math.sin(p.a), rX = -dY, rY = dX;
  let mx = dX * f + rX * s, my = dY * f + rY * s; const l = Math.hypot(mx, my) || 1;
  p.dashDx = mx / l; p.dashDy = my / l; p.dashT = 0.2; p.dashCd = p.dashMax; p.inv = Math.max(p.inv, 0.3);
  equipOnDash();
  const ds = classPassive(p.cls, 'dashStealth', 0);
  if (ds) { p.stealth = Math.max(p.stealth, ds); smokeFx(p.x, p.y); }
  Sfx.play('dash');
}

// ---------------------------------------------------------------- Bucle de actualización
function update(dt) {
  const p = G.p;
  G.t += dt; G.totalTime += dt;
  updateBuffs(dt); applyStats();
  updateTorch(dt); equipTick(dt);
  updatePlayer(dt);
  if (G.state !== 'play') return; // una escalera o la salida pueden cambiar de estado
  updateRooms(dt);
  updateSpawner(dt); updateWaves(dt);
  updateEnemies(dt);
  updateProjs(dt);
  updatePassives(dt);
  updateAllies(dt); updateTraps(dt); updateZones(dt); updateTimers(dt);
  updatePickups(dt);
  updateParts(dt);
  updateVfx(dt);
  G.shake = Math.max(0, G.shake - dt * 1.6);
  G.hurtFx = Math.max(0, G.hurtFx - dt * 2.2);
  G.flashFx = Math.max(0, G.flashFx - dt * 2);
  G.novaFx = Math.max(0, G.novaFx - dt * 2.5);
  G.hitMark = Math.max(0, G.hitMark - dt);
  G.touchCd -= dt; G.fade = Math.max(0, G.fade - dt * 2.5);
  if (G.time - (G.savedAt || 0) > 20) saveRun();
  // mapa explorado
  const cx = p.x | 0, cy = p.y | 0;
  for (let y = cy - 6; y <= cy + 6; y++) for (let x = cx - 6; x <= cx + 6; x++) {
    if (x >= 0 && y >= 0 && x < MW && y < MH && (x - cx) * (x - cx) + (y - cy) * (y - cy) <= 40) G.seen[y * MW + x] = 1;
  }
  // al entrar en una sala se descubre entera
  for (const r of G.lv.rooms) {
    if (r.seen || cx < r.x || cy < r.y || cx >= r.x + r.w || cy >= r.y + r.h) continue;
    r.seen = true;
    for (let y = r.y - 1; y <= r.y + r.h; y++) for (let x = r.x - 1; x <= r.x + r.w; x++) G.seen[y * MW + x] = 1;
  }
}

// ---------------------------------------------------------------- Dibujado
function buildItems() {
  const items = [];
  const tm = G.time;
  for (const d of G.decor) {
    const def = DECOR[d.type], fr = SPR[d.type];
    const s = d.used ? (SPR[d.type + 'Off'] || SPR.altarOff)[0] : def.anim ? fr[((tm * 9 + d.ph * 3) | 0) & 3] : fr[0];
    items.push({ x: d.x, y: d.y, spr: s, h: def.h, w: def.h * s.w / s.h, z: 0 });
  }
  for (const e of G.enemies) {
    const d = e.def, fr = SPR[d.spr];
    const f = d.fly ? ((tm * 8 + e.wob) | 0) & 1 : ((e.walk * 1.6) | 0) & 1;
    const s = fr[f];
    items.push({ x: e.x, y: e.y, spr: s, flash: e.flash > 0, h: d.h, w: d.h * s.w / s.h, z: d.z + (d.fly ? Math.sin(e.wob * 0.7) * 0.07 : 0) });
  }
  for (const k of G.pickups) {
    if (k.type === 'gem') { const s = k.v >= 5 ? SPR.gemGold : k.v >= 3 ? SPR.gemGreen : SPR.gemBlue; items.push({ x: k.x, y: k.y, spr: s, h: 0.22, w: 0.22 * s.w / s.h, z: 0.05 + Math.sin(k.t * 4) * 0.03 }); }
    else if (k.type === 'potion') items.push({ x: k.x, y: k.y, spr: SPR.potion, h: 0.3, w: 0.2, z: 0.02 + Math.sin(k.t * 3) * 0.02 });
    else if (k.type === 'chest') { const s = k.open ? SPR.chestOpen : SPR.chest; items.push({ x: k.x, y: k.y, spr: s, h: 0.42, w: 0.42 * s.w / s.h, z: 0 }); }
    else if (k.type === 'item') { const s = itemIcon(k.item); items.push({ x: k.x, y: k.y, spr: s, h: 0.24, w: 0.24, z: 0.18 + Math.sin(k.t * 3) * 0.04, bright: true }); }
    else if (k.type === 'torch') items.push({ x: k.x, y: k.y, spr: SPR.torchItem, h: 0.36, w: 0.36 * SPR.torchItem.w / SPR.torchItem.h, z: 0 });
    else if (k.type === 'gold') items.push({ x: k.x, y: k.y, spr: SPR.coins, h: 0.13, w: 0.13 * SPR.coins.w / SPR.coins.h, z: 0.01 });
    else if (k.type === 'key') { const s = SPR.keys[k.key]; items.push({ x: k.x, y: k.y, spr: s, h: 0.3, w: 0.3 * s.w / s.h, z: 0.25 + Math.sin(k.t * 3) * 0.05, bright: true }); }
  }
  for (const a of G.allies) {
    const d = a.def, s = SPR[d.spr] || SPR.skeleton[0], spr = Array.isArray(s) ? s[((a.walk * 1.6) | 0) & 1] : s;
    items.push({ x: a.x, y: a.y, spr, flash: a.flash > 0, h: d.h, w: d.h * spr.w / spr.h, z: 0 });
  }
  const pp = G.p;
  for (const s of G.lv.spikes) {
    if (Math.abs(s.x + 0.5 - pp.x) + Math.abs(s.y + 0.5 - pp.y) > 14) continue;
    const sp = s.up ? SPR.spikesUp : SPR.spikesDown;
    items.push({ x: s.x + 0.5, y: s.y + 0.5, spr: sp, h: s.up ? 0.24 : 0.07, w: 0.42, z: 0 });
  }
  for (const t of G.traps) items.push({ x: t.x, y: t.y, spr: SPR.trap, h: 0.2, w: 0.2 * SPR.trap.w / SPR.trap.h, z: 0 });
  for (const f of G.fx) if (f.type === 'meteor') items.push({ x: f.x, y: f.y, spr: SPR.orbRed, w: 1.3, h: 1.3, z: (f.life / f.max) * 4.5, bright: true, add: true });
  for (const pr of G.projs) items.push({ x: pr.x, y: pr.y, spr: SPR[pr.spr], w: pr.size, h: pr.size, z: 0.48 - pr.size / 2, bright: true, add: true });
  for (const q of G.parts) items.push({ x: q.x, y: q.y, z: q.z, w: q.size, h: q.size, color: q.col, add: q.add, bright: q.add, spr: null });
  vfxItems(items);
  for (const f of G.fx) if (f.type === 'pillar') items.push({ x: f.x, y: f.y, spr: SPR.pillar, w: 0.7 * f.scale, h: 5, z: 0, bright: true, add: true, k: Math.min(1, f.life / f.max * 1.6) });
  for (const f of G.fx) if (f.type === 'bolt') items.push({ x: f.x, y: f.y, spr: SPR['bolt' + f.v], w: 0.5, h: 3.2, z: 0, bright: true, add: true });
  const nb = L('blades');
  for (let i = 0; i < nb; i++) {
    const a = G.bladeAng + i / nb * TAU;
    items.push({ x: G.p.x + Math.cos(a) * 1.3, y: G.p.y + Math.sin(a) * 1.3, spr: SPR.daggerFx, w: 0.3, h: 0.3, z: 0.3, bright: true, add: true });
  }
  return items;
}

function dynLights() {
  const out = [], p = G.p;
  for (const pr of G.projs) out.push({ x: pr.x, y: pr.y, c: PROJ_LIGHT[pr.spr] || PROJ_LIGHT.orbBlue, rad: pr.friendly ? 2.6 : 2.4 });
  for (const f of G.fx) if (f.type === 'bolt') out.push({ x: f.x, y: f.y, c: [1.4, 1.7, 2.2], rad: 6 });
  for (const k of G.pickups) if (k.type === 'item') { const c = RARITY[k.item.rar].col; out.push({ x: k.x, y: k.y, c: c.map(v => v / 255 * 0.6), rad: 2.2 }); }
  for (const k of G.pickups) if (k.type === 'key') out.push({ x: k.x, y: k.y, c: KEYS[k.key].col.map(v => v / 255 * 0.7), rad: 2.5 });
  vfxLights(out);
  for (const z of G.zones) out.push({ x: z.x, y: z.y, c: [0.25, 0.45, 0.12], rad: z.r + 1 });
  for (const f of G.fx) if (f.type === 'meteor') out.push({ x: f.x, y: f.y, c: [1.2, 0.5, 0.1], rad: 5 });
  for (const a of G.allies) if (a.type === 'fiend' || a.type === 'shadow') out.push({ x: a.x, y: a.y, c: [0.5, 0.15, 0.8], rad: 2 });
  for (const e of G.enemies) {
    if (e.type === 'imp') out.push({ x: e.x, y: e.y, c: [0.7, 0.3, 0.05], rad: 2 });
    else if (e.type === 'wraith') out.push({ x: e.x, y: e.y, c: [0.15, 0.35, 0.5], rad: 2.2 });
    else if (e.def.boss) out.push({ x: e.x, y: e.y, c: [0.9, 0.25, 0.1], rad: 3.5 });
    else if (e.type === 'hound') out.push({ x: e.x, y: e.y, c: [0.8, 0.35, 0.05], rad: 2 });
    else if (e.type === 'eye' || e.type === 'cultist') out.push({ x: e.x, y: e.y, c: [0.45, 0.15, 0.6], rad: 1.8 });
    else if (e.ghost) out.push({ x: e.x, y: e.y, c: [0.25, 0.55, 0.9], rad: 3 });
  }
  if (p.anim > 0.05) out.push({ x: p.x + Math.cos(p.a) * 0.6, y: p.y + Math.sin(p.a) * 0.6, c: PROJ_LIGHT.orbBlue.map(v => v * p.anim), rad: 3.5 });
  if (G.novaFx > 0) out.push({ x: p.x, y: p.y, c: [0.6 * G.novaFx, 1.2 * G.novaFx, 1.7 * G.novaFx], rad: 7 });
  return out;
}

function render() {
  const p = G.p;
  if (!G.lv) return;
  const sh = G.cfg && G.cfg.noShake ? 0 : G.shake * 3;
  const hasTorch = offhandOf(p) === 'torch', vis = classPassive(p.cls, 'vision', 0.4);
  // sin antorcha solo ves la penumbra cercana (más o menos según la visión nocturna de la clase)
  const cam = { x: p.x, y: p.y, a: p.a + (sh > 0.05 ? rand(-sh, sh) * 0.01 : 0), light: (p.light || 1) * (hasTorch ? 1 : 0.75 + 0.35 * vis), torch: hasTorch ? 1.05 : 0.08 + vis * 0.3, lit: hasTorch };
  R.render(cam, G.lv, buildItems(), G.time, dynLights());
  // luz que recibe el jugador (estática + dinámica, ya preparada por el render) para oscurecer sus manos
  const sl = R.sampleLight(p.x, p.y, [0, 0, 0]);
  p.handLight = clamp((sl[0] + sl[1] + sl[2]) / 3 * 1.3 + (hasTorch ? 0.9 : cam.torch * 0.8) + 0.06, 0.16, 1);
  const scene = G.state !== 'title' && G.state !== 'options' && !(G.state === 'controls' && G.ctlBack !== 'paused');
  if (scene) R.drawHands(Object.assign({}, p, { off: offhandOf(p), handLight: p.handLight, enchanted: p.buffs.some(b => b.id === 'enchant') }), G.time, p.weapon === 'staff' ? SPELLS[p.spell].col : G.theme.glow);
  if (scene) drawScreenVfx(R);
  const lowHp = G.state === 'play' && p.hp < p.maxHp * 0.3 ? 0.35 + 0.2 * Math.sin(G.time * 6) : 0;
  R.tint(G.cfg && G.cfg.noFlash ? Math.min(0.3, Math.max(G.hurtFx * 0.5, lowHp * 0.6)) : Math.max(G.hurtFx * 0.8, lowHp), [190, 10, 10]);
  if (!(G.cfg && G.cfg.noFlash)) R.flash(G.flashFx * 0.45, [120, 200, 255]);
  R.fadeBlack(G.fade);
  if (p.stealth > 0) R.tint(Math.min(0.32, p.stealth * 0.5), [50, 30, 110]);

  ui.begin(R.buf);
  if (G.state === 'title') { if (G.hasSave === undefined) G.hasSave = hasSave(); ui.title(G); }
  else if (G.state === 'options') ui.options(G);
  else if (G.state === 'controls' && G.ctlBack !== 'paused') ui.controls(G);
  else if (G.state === 'classselect') ui.choice(G);
  else if (G.state === 'evolve') ui.choice(G);
  else {
    ui.hud(G);
    if (G.state === 'paused') ui.pause(G);
    else if (G.state === 'levelup') ui.levelUp(G);
    else if (G.state === 'dead') ui.dead(G);
    else if (G.state === 'journal') ui.journal(G);
    else if (G.state === 'inventory') ui.inventory(G);
    else if (G.state === 'shop') ui.shop(G);
    else if (G.state === 'swap') ui.swap(G);
    else if (G.state === 'map') ui.mapScreen(G);
    else if (G.state === 'controls') ui.controls(G);
    else if (G.state === 'forge') ui.forge(G);
    else if (G.state === 'exitask') ui.exitAsk(G);
    else if (G.state === 'escaped') ui.escaped(G);
  }
  if (G.touchMode) drawTouchUI(ui);
  ui.end();
  canvas.style.cursor = document.pointerLockElement === canvas ? 'none' : (ui.hot.some(h => ui.hit(h.x, h.y, h.w, h.h)) ? 'pointer' : 'default');
}

// ---------------------------------------------------------------- Entrada y bucle
document.addEventListener('keydown', (ev) => {
  if (ev.code === 'Tab' || ev.code === 'Space' || ev.code.startsWith('Arrow')) ev.preventDefault();
  // reasignando un control: la siguiente tecla queda asignada (Escape cancela)
  if (G.rebind && G.rebind.dev === 'key') { if (ev.code !== 'Escape') rebind('key', G.rebind.id, ev.code); G.rebind = null; Sfx.play('gem'); return; }
  if (G.state === 'controls' && ev.code === 'Escape') { G.state = G.ctlBack || 'title'; return; }
  const code = ev.isTrusted === false ? ev.code : translateKey(ev.code);
  if (!code) return;
  const e = { code, preventDefault: () => ev.preventDefault() };
  keys[e.code] = true;
  const dig = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[e.code];
  if (G.state === 'levelup') { if (dig !== undefined) chooseUpgrade(dig); return; }
  if (G.state === 'journal') {
    if (e.code === 'KeyJ' || e.code === 'Escape') closeJournal();
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') G.jpage = Math.max(0, G.jpage - 1);
    if (e.code === 'KeyD' || e.code === 'ArrowRight') G.jpage = Math.min((G.jspreads || 1) - 1, G.jpage + 1);
    return;
  }
  if (G.state === 'inventory') { if (e.code === 'KeyI' || e.code === 'Escape') closeInventory(); if (e.code === 'KeyT' || dig === 0) equipTorch(); return; }
  if (G.state === 'swap') { const n = G.swap ? G.swap.slots.length : 0, d2 = { Digit4: 3, Numpad4: 3 }[e.code]; const i = dig !== undefined ? dig : d2; if (i !== undefined) { if (i < n) resolveSwap(G.swap.slots[i]); else if (i === n) resolveSwap(null); } return; }
  if (G.state === 'map') { if (e.code === 'KeyM' || e.code === 'Escape') closeMap(); if (e.code === 'KeyA' || e.code === 'ArrowLeft') mapStep(1); if (e.code === 'KeyD' || e.code === 'ArrowRight') mapStep(-1); return; }
  if (G.state === 'shop') { if (dig !== undefined) buyItem(SHOP_ITEMS[dig].id); else if (e.code === 'Digit4' || e.code === 'Numpad4') buyItem(SHOP_ITEMS[3].id); if (e.code === 'Escape' || e.code === 'KeyI') closeNpc(); return; }
  if (G.state === 'forge') { if (dig !== undefined) forgeBuy(dig); if (e.code === 'Escape' || e.code === 'KeyI') closeNpc(); return; }
  if (G.state === 'exitask') { if (dig === 0) leaveDungeon(); else if (dig === 1 || e.code === 'Escape') stayInDungeon(); return; }
  if (G.state === 'escaped') { if (dig === 0) nextDungeon(); else if (dig === 1) retire(); return; }
  if (G.state === 'classselect' || G.state === 'evolve') { if (dig !== undefined) pickChoice(dig); return; }
  if (G.state === 'play') {
    if (dig !== undefined) equipSlot(dig);
    if (e.code === 'KeyF') toggleOffhand();
    if (e.code === 'KeyJ') { openJournal(); return; }
    if (e.code === 'KeyI') { openInventory(); return; }
    if (e.code === 'KeyH') drinkPotion();
    if (e.code === 'KeyM') { openMap(); return; }
    const si = SKILL_KEYS.indexOf(e.code);
    if (si >= 0) useSkill(si);
  }
  if (e.code === 'KeyN') { G.cfg.muted = !G.cfg.muted; applyCfg(); saveCfg(); logMsg(G.cfg.muted ? 'Sonido apagado' : 'Sonido activado', C.dim); }
  if (G.state === 'play') {
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') tryDash();
    if (e.code === 'KeyP') pauseGame();
  } else if (G.state === 'paused' && e.code === 'KeyP') resumeGame();
  else if (G.state === 'title' && e.code === 'Enter' && hasSave()) loadRun();
  else if ((G.state === 'title' || G.state === 'dead') && e.code === 'Enter') startRun();
  else if (G.state === 'title' && e.code === 'KeyO') G.state = 'options';
  else if (G.state === 'options' && (e.code === 'KeyO' || e.code === 'Escape')) G.state = 'title';
});
document.addEventListener('keyup', (ev) => { const c = ev.isTrusted === false ? ev.code : translateKey(ev.code); if (c) keys[c] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouse.fire = false; if (G.p) G.p.wantBlock = false; if (G.state === 'play') pauseGame(); });

function toCanvas(e) {
  const r = canvas.getBoundingClientRect();
  return { x: Math.floor((e.clientX - r.left) / r.width * SW), y: Math.floor((e.clientY - r.top) / r.height * SH) };
}
canvas.addEventListener('mousemove', (e) => {
  if (document.pointerLockElement === canvas) { if (G.state === 'play') { G.p.a += e.movementX * 0.0024 * G.cfg.sens; if (Math.abs(e.movementX) > 1) G.manualLook = G.time; } return; }
  const m = toCanvas(e); ui.mouse.x = m.x; ui.mouse.y = m.y;
});
canvas.addEventListener('mousedown', (e) => { const m = toCanvas(e); handleClick(m.x, m.y, e.button); });
// un clic (o un toque en pantallas táctiles) en coordenadas del lienzo
function handleClick(x, y, button = 0) {
  ui.mouse.x = x; ui.mouse.y = y;
  const e = { button };
  switch (G.state) {
    case 'title': { const h = ui.hot.find(h => ui.hit(h.x, h.y, h.w, h.h)); if (h && h.id === 'options') G.state = 'options'; else if (h && h.id === 'continue') loadRun(); else if (h && h.id === 'new') startRun(); else if (e.button === 0 && !hasSave()) startRun(); break; }
    case 'controls': {
      const h = ui.hot.find(h => ui.hit(h.x, h.y, h.w, h.h));
      if (!h) { G.state = G.ctlBack || 'title'; G.rebind = null; break; }
      if (h.id === 'reset') resetBindings();
      else if (h.id === 'back') { G.state = G.ctlBack || 'title'; G.rebind = null; }
      else { const [dev, id] = h.id.split(':'); G.rebind = { dev, id }; }
      break;
    }
    case 'options': { const h = ui.hot.find(h => ui.hit(h.x, h.y, h.w, h.h)); if (h) optAction(h.id); else G.state = 'title'; break; }
    case 'dead': if (e.button === 0) startRun(); break;
    case 'classselect': case 'evolve': { const h = ui.hot.find(h => ui.hit(h.x, h.y, h.w, h.h)); if (h) pickChoice(h.id); break; }
    case 'paused': {
      const h = ui.hot.find(h => ui.hit(h.x, h.y, h.w, h.h));
      if (h) optAction(h.id); else resumeGame();
      break;
    }
    case 'journal': {
      const m = ui.mouse;
      if (m.x < VW * 0.3) G.jpage = Math.max(0, G.jpage - 1); else if (m.x > VW * 0.7) G.jpage = Math.min((G.jspreads || 1) - 1, G.jpage + 1); else closeJournal();
      break;
    }
    case 'inventory': { const h = ui.hot.find(h => ui.hit(h.x, h.y, h.w, h.h)); if (h) invAction(h.id); else closeInventory(); break; }
    case 'map': { const m = ui.mouse; if (m.x < VW * 0.25) mapStep(1); else if (m.x > VW * 0.75) mapStep(-1); else closeMap(); break; }
    case 'swap': { const h = ui.hot.find(h => ui.hit(h.x, h.y, h.w, h.h)); if (h) resolveSwap(h.id === 'discard' ? null : h.id); break; }
    case 'shop': { const h = ui.hot.find(h => ui.hit(h.x, h.y, h.w, h.h)); if (h) { if (h.id === 'close') closeNpc(); else buyItem(h.id); } else closeNpc(); break; }
    case 'forge': { const h = ui.hot.find(h => ui.hit(h.x, h.y, h.w, h.h)); if (h) { if (h.id === 'close') closeNpc(); else forgeBuy(h.id); } else closeNpc(); break; }
    case 'exitask': { const h = ui.hot.find(h => ui.hit(h.x, h.y, h.w, h.h)); if (h) { if (h.id === 0) leaveDungeon(); else stayInDungeon(); } break; }
    case 'escaped': { const h = ui.hot.find(h => ui.hit(h.x, h.y, h.w, h.h)); if (h) { if (h.id === 0) nextDungeon(); else retire(); } break; }
    case 'levelup': { const h = ui.hot.find(h => ui.hit(h.x, h.y, h.w, h.h)); if (h) chooseUpgrade(h.id); break; }
    case 'play':
      lockMouse();
      if (e.button === 0) mouse.fire = true;
      if (e.button === 2) { if (G.p.off === 'shield' && WEAPONS[G.p.weapon].hands === 1) G.p.wantBlock = true; else tryDash(); }
      break;
  }
}
document.addEventListener('mouseup', (e) => { if (e.button === 0) mouse.fire = false; if (e.button === 2 && G.p) G.p.wantBlock = false; });
canvas.addEventListener('wheel', (e) => {
  if (G.state !== 'play') return;
  e.preventDefault();
  const n = CLASSES[G.p.cls].slots.length;
  equipSlot((G.p.slot + (e.deltaY > 0 ? 1 : n - 1)) % n);
}, { passive: false });
document.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('pagehide', () => saveRun());
document.addEventListener('visibilitychange', () => { if (document.hidden) { saveRun(); for (const k in keys) keys[k] = false; mouse.fire = false; if (G.state === 'play') pauseGame(); } });
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === canvas) { G.hadLock = true; if (G.state === 'paused') resumeGame(); }
  else if (G.state === 'play' && G.hadLock) pauseGame();
});

function openMap() { if (G.state !== 'play') return; G.state = 'map'; G.mapZ = G.z; mouse.fire = false; if (document.exitPointerLock) document.exitPointerLock(); }
function closeMap() { if (G.state !== 'map') return; G.state = 'play'; lockMouse(); }
// cambiar el nivel mostrado entre los ya visitados (dir 1 = hacia arriba)
function mapStep(dir) {
  const vis = G.dg.zs.filter(z => G.dg.lv(z).visited); // ordenados de arriba a abajo
  const i = vis.indexOf(G.mapZ), j = clamp(i - dir, 0, vis.length - 1);
  G.mapZ = vis[j];
}
function openJournal() { if (G.state !== 'play') return; G.state = 'journal'; G.jpage = -1; mouse.fire = false; if (document.exitPointerLock) document.exitPointerLock(); Sfx.play('door'); }
function closeJournal() { if (G.state !== 'journal') return; G.state = 'play'; lockMouse(); }
function stayInDungeon() {
  const p = G.p;
  G.state = 'play'; G.touchCd = 1.5;
  // un paso atrás para no volver a tocar la salida
  p.x -= Math.cos(p.a) * 0.3; p.y -= Math.sin(p.a) * 0.3; if (G.lv.blocked(p.x, p.y, 0.22)) { p.x += Math.cos(p.a) * 0.3; p.y += Math.sin(p.a) * 0.3; }
  lockMouse();
}
function retire() { Sfx.playMusic('title'); G.state = 'title'; G.final = null; clearSave(); }

// ---------------------------------------------------------------- Guardado en el navegador (progreso y opciones)
function loadJSON(k, def) { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return Object.assign(def, v || {}); } catch (e) { return def; } }
function saveJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* almacenamiento no disponible */ } }
function saveMeta() { saveJSON('cryptfall_meta', G.meta); }
function saveCfg() { saveJSON('cryptfall_opts', G.cfg); }
function applyCfg() {
  Sfx.setVolume(G.cfg.muted ? 0 : G.cfg.vol); Sfx.setMusic(G.cfg.music !== false);
  R.fast = !!G.cfg.fast;
  if (typeof applyBindings === 'function') applyBindings();
  document.body.classList.toggle('crt', !!G.cfg.crt);
}
function optAction(id) {
  const o = G.cfg;
  if (id === 'sens-') o.sens = Math.max(0.3, Math.round((o.sens - 0.1) * 10) / 10);
  if (id === 'sens+') o.sens = Math.min(3, Math.round((o.sens + 0.1) * 10) / 10);
  if (id === 'vol-') o.vol = Math.max(0, Math.round((o.vol - 0.1) * 10) / 10);
  if (id === 'vol+') o.vol = Math.min(1, Math.round((o.vol + 0.1) * 10) / 10);
  if (id === 'mute') o.muted = !o.muted;
  if (id === 'fps') o.fps = o.fps === 60 ? 30 : 60;
  if (id === 'crt') o.crt = !o.crt;
  if (id === 'autoatk') o.autoAtk = !o.autoAtk;
  if (id === 'music') o.music = !o.music;
  if (id === 'quality') o.fast = !o.fast;
  if (id === 'shake') o.noShake = !o.noShake;
  if (id === 'flash') o.noFlash = !o.noFlash;
  if (id === 'rumble') o.noRumble = !o.noRumble;
  if (id === 'bigtouch') o.bigTouch = !o.bigTouch;
  if (id === 'lang') { o.lang = o.lang === 'en' ? 'es' : 'en'; setLang(o.lang); }
  if (id === 'controls') { G.ctlBack = G.state; G.state = 'controls'; G.rebind = null; }
  applyCfg(); saveCfg(); Sfx.play('gem');
}

function pauseGame() { if (G.state !== 'play') return; G.state = 'paused'; mouse.fire = false; if (document.exitPointerLock) document.exitPointerLock(); }
function resumeGame() { if (G.state !== 'paused') return; G.state = 'play'; lockMouse(); }

function startRun() {
  Sfx.init(); Sfx.playMusic('title');
  openClassSelect();
}

// Bucle con límite de fotogramas (60 o 30, a elegir en opciones): se salta los refrescos que sobran
let last = performance.now(), lastDraw = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const step = 1000 / (G.cfg ? G.cfg.fps : 60);
  if (now - lastDraw < step - 1.5) return;
  lastDraw += step; if (now - lastDraw > step) lastDraw = now; // mantiene la cadencia sin acumular retraso
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  G.time += dt;
  for (const t of G.toasts) t.t -= dt;
  G.toasts = G.toasts.filter(t => t.t > 0);
  if (typeof pollPad === 'function') pollPad(dt);
  if (G.state === 'play') update(dt);
  else if (G.state === 'title' || G.state === 'options') G.p.a += dt * 0.2;
  render();
}

// ---------------------------------------------------------------- Inicio
// arranque diferido: deja pintar el aviso de carga antes de generar texturas y mazmorra
function boot() {
  G.meta = loadJSON('cryptfall_meta', { gold: 0, escapes: 0, deaths: 0, bestLoot: 0, bestDepth: 0 });
  G.cfg = loadJSON('cryptfall_opts', { sens: 1, vol: 0.8, muted: false, fps: 60, crt: false, music: true });
  if (G.cfg.fps !== 30) G.cfg.fps = 60;
  if (!G.cfg.lang) G.cfg.lang = /^es\b/i.test(navigator.language || 'es') ? 'es' : 'en';
  setLang(G.cfg.lang);
  applyCfg();
  initSprites();
  G.p = makePlayer('mago'); setClass('mago', false);
  newDungeon(1);
  loadAssets().then(() => {
    const ld = document.getElementById('loading'); if (ld) ld.remove();
    requestAnimationFrame(frame);
  }).catch((e) => {
    const ld = document.getElementById('loading'); if (ld) ld.textContent = 'No se pudo cargar el juego: ' + e.message;
    throw e;
  });
}
requestAnimationFrame(() => setTimeout(boot, 30));

// Juego sin conexión: el service worker solo existe en la web publicada (no al abrir el archivo en local)
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && document.querySelector('meta[name=version]') && document.querySelector('meta[name=version]').content !== 'dev') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

// Web publicada: si el navegador sirvió una página antigua de su caché, se recarga con la última versión.
// version.json se pide siempre fresco; la recarga usa ?v=<versión> para saltarse la caché de la página.
(function checkVersion() {
  const meta = document.querySelector('meta[name=version]');
  if (!meta || meta.content === 'dev' || location.protocol === 'file:') return;
  fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(j => {
    if (!j || !j.v || j.v === meta.content) return;
    if (new URLSearchParams(location.search).get('v') === j.v) return; // ya se intentó: no entrar en bucle
    location.replace(location.pathname + '?v=' + encodeURIComponent(j.v));
  }).catch(() => {});
})();
