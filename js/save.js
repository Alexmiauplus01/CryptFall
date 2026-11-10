// Guardado de partida en el navegador (localStorage) y fantasmas rencorosos de personajes caídos.
const SAVE_KEY = 'cryptfall_save', GHOST_KEY = 'cryptfall_ghosts', SAVE_VER = 1;

// ---------------------------------------------------------------- utilidades de serialización
function b64(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
function unb64(str, Type) { const s = atob(str), u8 = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i); return Type === Uint8Array ? u8 : new Type(u8.buffer); }

function packLevel(lv, live) {
  const cells = lv.cells.slice();
  // una arena a medias se guarda abierta (se repetirá al volver a entrar)
  if (G.arena && G.arena.lv === lv) for (const [i, v] of G.arena.seal) cells[i] = v === W_BARS ? 0 : v;
  const st = live ? { enemies: G.enemies, pickups: G.pickups } : lv.state;
  return {
    z: lv.z, theme: lv.theme, cells: b64(cells), floorTex: b64(lv.floorTex), roomOf: b64(new Uint8Array(lv.roomOf.buffer.slice(0))), seen: b64(lv.seen),
    rooms: lv.rooms.map(r => Object.assign({}, r, { shrine: undefined, done: r.done && !(G.arena && G.arena.r === r) })),
    openings: [...lv.openings], locks: [...lv.locks], secret: [...lv.secret], stairs: [...lv.stairs], exit: lv.exit,
    spikes: lv.spikes, decor: lv.decor, lights: lv.lights, npcs: lv.npcs.map(n => ({ type: n.type, x: n.x, y: n.y })), visited: !!lv.visited,
    enemies: st.enemies.filter(e => !e.dead && !e.arena).map(e => ({ type: e.type, x: e.x, y: e.y, hp: e.hp, maxHp: e.maxHp, spd: e.spd, dmgM: e.dmgM, sleep: !!e.sleep, ghost: e.ghost || null, elite: e.elite || null, big: e.big || null, flank: e.flank || 0 })),
    pickups: st.pickups.filter(k => !k.dead),
  };
}
function unpackLevel(o) {
  const lv = new Level(o.z, o.theme);
  lv.cells = unb64(o.cells, Uint8Array); lv.floorTex = unb64(o.floorTex, Uint8Array); lv.roomOf = unb64(o.roomOf, Int16Array); lv.seen = unb64(o.seen, Uint8Array);
  lv.rooms = o.rooms; lv.openings = new Map(o.openings); lv.locks = new Map(o.locks); lv.secret = new Set(o.secret); lv.stairs = new Map(o.stairs); lv.exit = o.exit;
  lv.spikes = o.spikes; lv.decor = o.decor; lv.lights = o.lights; lv.npcs = o.npcs; lv.visited = o.visited;
  lv.shrines = lv.decor.filter(d => d.type === 'altar');
  lv.finalize();
  // enemigos: se recrean con su definición y se les devuelve su estado
  const save = G.enemies; G.enemies = lv.state.enemies;
  for (const s of o.enemies) {
    G.noElite = true;
    const e = s.ghost ? (s.ghost.doppel ? spawnDoppel(s.x, s.y) : spawnGhost(s.ghost, s.x, s.y)) : spawnEnemy(s.type, s.x, s.y);
    G.noElite = false;
    Object.assign(e, { hp: s.hp, maxHp: s.maxHp, spd: s.spd, dmgM: s.dmgM, sleep: s.sleep, elite: s.elite || undefined, big: s.big || undefined, flank: s.flank || 0, sumT: 3 });
  }
  G.enemies = save;
  lv.state.pickups = o.pickups;
  return lv;
}

// ---------------------------------------------------------------- guardar / continuar
function saveRun() {
  if (G.z === SECRET_Z) return; // en la mazmorra secreta no se guarda: al continuar vuelves al último punto
  if (!G.dg || !G.p || !['play', 'paused', 'inventory', 'journal', 'shop', 'forge', 'mentor', 'levelup', 'evolve', 'exitask'].includes(G.state)) return;
  const p = G.p;
  const data = {
    v: SAVE_VER, time: Date.now(),
    player: { cls: p.cls, lvl: p.lvl, xp: p.xp, hp: p.hp, slot: p.slot, off: p.off, torchFuel: p.torchFuel, form: p.form, x: p.x, y: p.y, a: p.a, known: p.known, active: p.active },
    pasOn: G.pasOn,
    upg: G.upg, forge: G.forge, inv: G.inv, equip: G.equip, phoenixUsed: !!G.phoenixUsed, phylUsed: !!G.phylUsed, keys: G.keys, loot: G.loot, bank: G.bank, kills: G.kills, totalTime: G.totalTime, t: G.t,
    journal: G.journal, met: G.met, dgScale: G.dgScale, pact: G.pact || null, nightmare: !!G.nightmare, fountUsed: !!G.fountUsed, waveT: G.waveT || 0, waveN: G.waveN || 0, pending: G.pending, evolveReady: G.evolveReady, bossSeen: !!(G.boss && !G.boss.dead),
    dg: { n: G.dg.n, name: G.dg.name, zs: G.dg.zs, start: G.dg.start, lockRooms: G.dg.lockRooms.map(c => ({ z: c.z, ri: c.ri })) },
    z: G.z, levels: G.dg.zs.map(z => packLevel(G.dg.lv(z), G.dg.lv(z) === G.lv)),
  };
  G.savedAt = G.time;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); G.hasSave = true; } catch (e) { /* sin espacio o almacenamiento bloqueado */ }
}
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
function clearSave() { G.hasSave = false; try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* nada */ } }
function loadRun() {
  let d;
  try { d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { d = null; }
  if (!d || d.v !== SAVE_VER) { clearSave(); return false; }
  Sfx.init();
  const eq = d.equip || {};
  G.equip = { anillo1: eq.anillo1 || null, anillo2: eq.anillo2 || null, amuleto: eq.amuleto || null, armadura: eq.armadura || null, arma: eq.arma || null, escudo: eq.escudo || null };
  for (const s in G.equip) if (G.equip[s] && !G.equip[s].kind) G.equip[s] = null; // objetos del formato anterior
  G.swap = null; G.wskin = null; G.phoenixUsed = !!d.phoenixUsed; G.phylUsed = !!d.phylUsed;
  G.upg = d.upg || {}; G.pasOn = d.pasOn || Object.keys(G.upg).filter(k => PASSIVE_IDS.has(k)).slice(0, MAX_PAS); G.learn = null; G.forge = d.forge || {}; G.forgeOpts = null; G.inv = d.inv; G.keys = d.keys; G.loot = d.loot; G.bank = d.bank;
  G.kills = d.kills; G.totalTime = d.totalTime; G.journal = d.journal; G.jpage = -1; G.met = d.met || {}; G.pending = 0; G.evolveReady = false;
  G.log = []; G.toasts = []; G.allies = []; G.choice = null; G.won = false; G.arena = null; G.boss = null;
  const s = d.player;
  G.p = makePlayer(s.cls); setClass(s.cls, false);
  Object.assign(G.p, { lvl: s.lvl, xp: s.xp, slot: s.slot, off: s.off, torchFuel: s.torchFuel, form: s.form || 'human' });
  if (Array.isArray(s.known)) { G.p.known = s.known.filter(k => SKILLS[k]); G.p.active = [0, 1, 2].map(i => (s.active && SKILLS[s.active[i]]) ? s.active[i] : null); }
  else { const sk = CLASSES[s.cls].skills; G.p.known = sk.slice(0, 3); G.p.active = [sk[0], sk[1] || null, sk[2] || null]; } // partidas de antes
  recalc(); G.p.hp = Math.min(G.p.maxHp, s.hp);
  // la mazmorra tal como estaba
  const dg = Object.create(Dungeon.prototype);
  Object.assign(dg, { n: d.dg.n, name: d.dg.name, zs: d.dg.zs, start: d.dg.start, levels: {} });
  G.dg = dg; G.floor = dg.diff(d.z);
  for (const o of d.levels) dg.levels[o.z] = unpackLevel(o);
  dg.lockRooms = d.dg.lockRooms.map(c => ({ z: c.z, ri: c.ri, r: dg.levels[c.z].rooms[c.ri] }));
  G.pact = d.pact || null; G.nightmare = !!d.nightmare; G.fountUsed = !!d.fountUsed;
  G.lv = null; G.t = d.t || 0; G.dgScale = d.dgScale || { hp: DG_EDGE * (1 + 0.25 * (d.dg.n - 1)), dmg: DG_EDGE * (1 + 0.06 * (d.dg.n - 1)) };
  G.state = 'play';
  enterLevel(d.z, { x: s.x, y: s.y, a: s.a }, true);
  G.waveT = d.waveT || 0; G.waveN = d.waveN || 0;
  // si el Guardián estaba despierto, lo vuelve a estar
  if (d.bossSeen) for (const z of dg.zs) for (const e of dg.lv(z).state.enemies.concat(G.enemies)) if (e.def.boss && !e.sleep) G.boss = e;
  toast('CONTINÚAS LA PARTIDA', true); logMsg(`${dg.name}: ${levelName(d.z)}`, C.gold);
  lockMouse();
  return true;
}

// ---------------------------------------------------------------- fantasmas rencorosos
// Al morir, el personaje queda registrado; en mazmorras posteriores puede aparecer su fantasma (élite) guardando un tesoro.
function recordGhost() {
  const p = G.p; let list = [];
  try { list = JSON.parse(localStorage.getItem(GHOST_KEY) || '[]'); } catch (e) { list = []; }
  const legends = Object.values(G.equip || {}).filter(it => it && it.rar === 'legendario');
  list.push({ cls: p.cls, lvl: p.lvl, weapon: p.weapon, lost: G.loot, where: G.dg.name, date: Date.now(), legends });
  while (list.length > 12) list.shift();
  try { localStorage.setItem(GHOST_KEY, JSON.stringify(list)); } catch (e) { /* nada */ }
}
function ghostList() { try { return JSON.parse(localStorage.getItem(GHOST_KEY) || '[]'); } catch (e) { return []; } }

// crea el enemigo fantasma a partir del registro, con un nivel parecido al del jugador actual
function spawnGhost(g, x, y) {
  const c = CLASSES[g.cls] || CLASSES.luchador, cm = classMods(g.cls), w = WEAPONS[g.weapon] || WEAPONS.sword;
  const lvl = g.lvlNow || g.lvl, n = G.dg ? G.dg.n : 1;
  const base = lineageOf(g.cls)[0], skin = SPR['ghostskin_' + g.cls] ? 'ghostskin_' + g.cls : SPR['ghostskin_' + base] ? 'ghostskin_' + base : null;
  const sprK = skin || (w.kind === 'cast' ? 'ghost_staff' : w.kind === 'shoot' ? 'ghost_bow' : (g.weapon === 'dagger' || g.weapon === 'daggers') ? 'ghost_dagger' : 'ghost_melee');
  const def = Object.assign({}, ENEMY.ghost, {
    name: `Fantasma de ${c.name}`, spr: sprK,
    hp: 150 * cm.hp * (1 + 0.15 * (lvl - 1)) * (1 + 0.3 * (n - 1)),
    spd: 2.1 * Math.min(1.35, cm.spd), dmg: w.kind === 'melee' ? Math.round(13 * cm.dmg * (1 + 0.06 * (lvl - 1))) : 0,
    ranged: w.kind !== 'melee' ? { cd: w.kind === 'cast' ? 1.4 : 1.1, dmg: Math.round(11 * cm.dmg * (1 + 0.06 * (lvl - 1))), spd: w.kind === 'cast' ? 8 : 12, proj: w.kind === 'cast' ? 'orbPurple' : 'orbArrow', keep: 4.5 } : null,
    xp: 12 + lvl,
  });
  const e = spawnEnemy('ghost', x, y);
  e.def = def; e.hp = e.maxHp = def.hp; e.spd = def.spd; e.dmgM = 1;
  e.ghost = { cls: g.cls, lvl, weapon: g.weapon, lost: g.lost, where: g.where, lvlNow: lvl, legends: g.legends || [] };
  return e;
}

// Doppelgänger: copia exacta del jugador actual (aura roja). Mismas estadísticas, arma, habilidades de su rama,
// mejoras pasivas y equipo (armadura, críticos, robo de vida). Usa el aspecto de la clase del jugador.
function spawnDoppel(x, y) {
  const p = G.p, cls = p.cls, base = lineageOf(cls)[0], w = WEAPONS[p.weapon] || WEAPONS.sword;
  const sprK = SPR['doppel_' + cls] ? 'doppel_' + cls : SPR['doppel_' + base] ? 'doppel_' + base : (w.kind === 'cast' ? 'ghost_staff' : w.kind === 'shoot' ? 'ghost_bow' : 'ghost_melee');
  const hit = (w.kind === 'cast' ? SPELLS[p.spell || 'arcane'].dmg : (w.dmg || 20)) * (p.dmgMul || 1);
  const cd = (w.kind === 'cast' ? SPELLS[p.spell || 'arcane'].cd : (w.cd || 0.6)) / (p.rate || 1);
  const def = Object.assign({}, ENEMY.ghost, {
    name: `Doppelgänger (${CLASSES[cls].name})`, spr: sprK, doppel: true,
    hp: p.maxHp * 2.5, spd: (p.spd || 3) * 0.8,
    dmg: w.kind === 'melee' ? Math.max(8, Math.round(hit * 0.3)) : 0, atkCd: Math.max(0.5, cd * 1.3),
    ranged: w.kind !== 'melee' ? { cd: Math.max(0.6, cd * 1.6), dmg: Math.max(7, Math.round(hit * 0.3)), spd: w.kind === 'cast' ? 8 : 12, proj: w.kind === 'cast' ? SPELLS[p.spell || 'arcane'].proj : 'orbArrow', keep: 4.5 } : null,
    xp: 20 + p.lvl * 2, drain: (p.leech || 0) * 3, branch: base,
  });
  const e = spawnEnemy('ghost', x, y);
  e.def = def; e.hp = e.maxHp = def.hp; e.spd = def.spd; e.dmgM = 1; e.sleep = false;
  e.armorMul = p.armor || 1; e.crit = p.crit || 0;
  e.ghost = { doppel: true, cls, lvl: p.lvl, lvlNow: p.lvl, legends: [] };
  vfxBlink(x, y, 'void'); Sfx.play('roar');
  return e;
}

// en cada mazmorra nueva, si hay caídos, uno de ellos guarda la sala del tesoro más valiosa
function placeGhost(dg) {
  const list = ghostList(); if (!list.length || Math.random() < 0.25) return;
  const g = Object.assign({}, pick(list));
  g.lvlNow = Math.max(1, (G.p ? G.p.lvl : 1) + randi(-1, 2)); // siempre de un nivel parecido al tuyo
  const cand = [];
  for (const z of dg.zs) dg.lv(z).rooms.forEach(r => { if (r.type === 'tesoro' || r.type === 'camara') cand.push({ z, r }); });
  if (!cand.length) return;
  const { z, r } = pick(cand), lv = dg.lv(z);
  const save = G.enemies; G.enemies = lv.state.enemies;
  const e = spawnGhost(g, r.cx + 0.5, r.cy + 0.5); e.sleep = true;
  G.enemies = save;
  // tesoro importante: un cofre con parte del botín que perdió
  lv.state.pickups.push({ type: 'chest', x: r.cx + 0.5, y: r.cy + 1.4 > r.y + r.h - 0.5 ? r.cy + 0.5 : r.cy + 1.4, t: 0, gold: Math.round(Math.max(60, (g.lost || 0) * 0.5) * (1 + 0.2 * (dg.n - 1))), item: 'potion', torch: true });
  r.ghost = true;
}
function onGhostKilled(e) {
  const g = e.ghost; if (!g) return;
  toast('EL FANTASMA DESCANSA AL FIN', true); G.flashFx = 0.8; Sfx.play('portal');
  jot('ghost' + G.dg.n, `El fantasma rencoroso de un ${CLASSES[g.cls].name.toLowerCase()} (nivel ${g.lvl}) guardaba un tesoro${g.where ? `; cayó en ${g.where}` : ''}. Ya descansa.`);
  if (G.elite === e) G.elite = null;
}
