// Equipo: 2 anillos, amuleto, armadura, arma y escudo. Sin mochila: lo que encuentras se equipa en el momento
// (si el hueco está ocupado, el juego pregunta y el objeto descartado se destruye).
// Rarezas: común, raro, épico (poder único) y legendario (gran mejora + efecto poderoso; los jefes tienen el suyo).
const RARITY = {
  comun: { name: 'Común', col: [200, 196, 186], k: 1 },
  raro: { name: 'Raro', col: [110, 170, 255], k: 1.8 },
  epico: { name: 'Épico', col: [200, 110, 255], k: 3 },
  legendario: { name: 'Legendario', col: [255, 170, 40], k: 4.2 },
};
const SLOTS = ['anillo1', 'anillo2', 'amuleto', 'armadura', 'arma', 'escudo'];
const SLOT_KIND = { anillo1: 'anillo', anillo2: 'anillo', amuleto: 'amuleto', armadura: 'armadura', arma: 'arma', escudo: 'escudo' };
const SLOT_LABEL = { anillo1: 'Anillo 1', anillo2: 'Anillo 2', amuleto: 'Amuleto', armadura: 'Armadura', arma: 'Arma', escudo: 'Escudo' };
// armas que pueden aparecer (las que el jugador puede usar)
const WTYPES = ['sword', 'greatsword', 'dagger', 'staff'];
const AFFIX = {
  anillo: [
    { stat: 'dmg', v: 0.05, name: 'de la ira', desc: (x) => `+${Math.round(x * 100)}% de daño` },
    { stat: 'crit', v: 0.035, name: 'del halcón', desc: (x) => `+${Math.round(x * 100)}% de crítico` },
    { stat: 'rate', v: 0.05, name: 'del viento', desc: (x) => `+${Math.round(x * 100)}% de velocidad de ataque` },
  ],
  amuleto: [
    { stat: 'hp', v: 0.08, name: 'del roble', desc: (x) => `+${Math.round(x * 100)}% de vida máxima` },
    { stat: 'regen', v: 0.35, name: 'del manantial', desc: (x) => `+${x.toFixed(1)} de vida por segundo` },
    { stat: 'xp', v: 0.08, name: 'del sabio', desc: (x) => `+${Math.round(x * 100)}% de experiencia` },
    { stat: 'light', v: 0.1, name: 'del alba', desc: (x) => `+${Math.round(x * 100)}% de alcance de la antorcha` },
  ],
  armadura: [
    { stat: 'armor', v: 0.05, name: 'de hierro', desc: (x) => `-${Math.round(x * 100)}% de daño recibido` },
    { stat: 'spd', v: 0.035, name: 'del corredor', desc: (x) => `+${Math.round(x * 100)}% de velocidad` },
    { stat: 'dash', v: 0.07, name: 'de la sombra', desc: (x) => `Esquiva ${Math.round(x * 100)}% más rápido` },
  ],
  arma: [
    { stat: 'wdmg', v: 0.07, name: 'afilada', desc: (x) => `+${Math.round(x * 100)}% de daño con esta arma` },
    { stat: 'wcrit', v: 0.04, name: 'certera', desc: (x) => `+${Math.round(x * 100)}% de crítico con esta arma` },
    { stat: 'wrate', v: 0.06, name: 'ligera', desc: (x) => `+${Math.round(x * 100)}% de velocidad con esta arma` },
  ],
  escudo: [
    { stat: 'block', v: 0.08, name: 'reforzado', desc: (x) => `Bloquea un ${Math.round(x * 100)}% más` },
    { stat: 'sarmor', v: 0.04, name: 'del bastión', desc: (x) => `-${Math.round(x * 100)}% de daño con el escudo en la mano` },
  ],
};
const EPIC = {
  anillo: { id: 'sangre', name: 'Anillo de sangre', desc: 'Robas el 3% del daño como vida' },
  amuleto: { id: 'fenix', name: 'Amuleto del fénix', desc: 'Una vez por mazmorra te revive con el 40% de vida' },
  armadura: { id: 'espinas', name: 'Armadura de espinas', desc: 'Devuelve el 30% del daño a quien te golpea' },
  arma: { id: 'elemental', name: 'Arma rúnica', desc: 'Sus golpes queman, hielan o envenenan' },
  escudo: { id: 'reflejo', name: 'Escudo de púas', desc: 'Al bloquear devuelves el 40% del golpe' },
};
// legendarios: gran mejora + efecto poderoso. Los de jefe solo los suelta ese jefe
const LEGEND = {
  nigromante: { kind: 'anillo', boss: 'lich', name: 'Anillo del nigromante', stat: 'leech', v: [0.04, 0.08], fx: [0.15, 0.3], desc: (it) => `Robas el ${Math.round(it.val * 100)}% del daño como vida · ${Math.round(it.fx * 100)}% de levantar como aliado al enemigo que matas` },
  reina: { kind: 'amuleto', boss: 'queen', name: 'Corazón de la Reina Araña', stat: 'hp', v: [0.12, 0.2], fx: [0.25, 0.4], desc: (it) => `+${Math.round(it.val * 100)}% de vida · tus golpes envenenan y el ${Math.round(it.fx * 100)}% de tus víctimas suelta una araña aliada` },
  guardian: { kind: 'armadura', boss: 'boss', name: 'Coraza del Guardián', stat: 'armor', v: [0.18, 0.26], fx: [0.8, 1.2], desc: (it) => `-${Math.round(it.val * 100)}% de daño recibido · al recibir un golpe estalla un anillo de fuego` },
  primigenio: { kind: 'anillo', boss: 'voidlord', name: 'Ojo primigenio', stat: 'crit', v: [0.1, 0.15], fx: [3, 4.5], desc: (it) => `+${Math.round(it.val * 100)}% de crítico · cada ${it.fx.toFixed(1)} s lanza orbes del vacío al enemigo más cercano` },
  solar: { kind: 'arma', wtype: 'sword', name: 'Hoja solar', stat: 'wdmg', v: [0.25, 0.35], fx: [3, 3], desc: (it) => `+${Math.round(it.val * 100)}% de daño · cada tercer golpe estalla en llamas` },
  titan: { kind: 'arma', wtype: 'greatsword', name: 'Rompemontañas', stat: 'wdmg', v: [0.25, 0.35], fx: [0.4, 0.6], desc: (it) => `+${Math.round(it.val * 100)}% de daño · cada golpe lanza una onda de choque` },
  colmillo: { kind: 'arma', wtype: 'dagger', name: 'Colmillo de sombra', stat: 'wcrit', v: [0.12, 0.18], fx: [0.05, 0.08], desc: (it) => `+${Math.round(it.val * 100)}% de crítico · al matar te ocultas y recuperas un ${Math.round(it.fx * 100)}% de vida` },
  archimago: { kind: 'arma', wtype: 'staff', name: 'Báculo del archimago', stat: 'wdmg', v: [0.2, 0.3], fx: [1, 1], desc: (it) => `+${Math.round(it.val * 100)}% de daño · +1 proyectil y atraviesan a un enemigo más` },
  egida: { kind: 'escudo', name: 'Égida', stat: 'block', v: [0.3, 0.4], fx: [1, 1], desc: (it) => `Bloquea un ${Math.round(it.val * 100)}% más · al bloquear devuelves los proyectiles` },
};
const BASE_NAME = {
  anillo: ['Anillo de cobre', 'Anillo de plata', 'Sortija'], amuleto: ['Colgante', 'Amuleto', 'Talismán'], armadura: ['Jubón', 'Cota de malla', 'Coraza'],
  sword: ['Espada corta', 'Espada larga', 'Hoja de acero'], greatsword: ['Mandoble', 'Espadón', 'Montante'], dagger: ['Puñal', 'Daga', 'Estilete'], staff: ['Bastón', 'Vara', 'Báculo'],
  escudo: ['Rodela', 'Escudo de roble', 'Pavés'],
};
const WT_NAME = { sword: 'espada', greatsword: 'espadón', dagger: 'daga', staff: 'bastón' };

// ---------------------------------------------------------------- creación
function rollRarity(src) {
  const r = Math.random();
  if (src === 'boss') return r < 0.08 ? 'legendario' : r < 0.28 ? 'epico' : r < 0.7 ? 'raro' : 'comun';
  if (src === 'ghost') return r < 0.08 ? 'epico' : r < 0.6 ? 'raro' : 'comun';
  if (src === 'vault') return r < 0.006 ? 'legendario' : r < 0.04 ? 'epico' : r < 0.3 ? 'raro' : 'comun';
  return r < 0.003 ? 'legendario' : r < 0.023 ? 'epico' : r < 0.2 ? 'raro' : 'comun';
}
// tipos de objeto posibles para la clase actual (arma solo si la clase usa espada, espadón, daga o bastón; escudo si usa armas de una mano)
function itemKinds() {
  const sl = CLASSES[G.p.cls].slots.map(s => s.w), out = ['anillo', 'amuleto', 'armadura'];
  if (sl.some(w => WTYPES.includes(w) || w === 'daggers')) out.push('arma');
  if (sl.some(w => WEAPONS[w] && WEAPONS[w].hands === 1)) out.push('escudo');
  return out;
}
function classWTypes() { return [...new Set(CLASSES[G.p.cls].slots.map(s => s.w === 'daggers' ? 'dagger' : s.w).filter(w => WTYPES.includes(w)))]; }
// multiplicador de calidad: mazmorra más profunda y enemigo más duro = mejores estadísticas
function itemPower(src) { const n = G.dg ? G.dg.n : 1; return (1 + 0.1 * (n - 1) + 0.04 * Math.abs(G.z || 0)) * ({ boss: 1.35, ghost: 1.2, vault: 1.15 }[src] || 1); }
function makeItem(src, kind, opt = {}) {
  const kinds = itemKinds();
  kind = kind && kinds.includes(kind) ? kind : pick(kinds);
  let rar = opt.rar || rollRarity(src);
  const P = itemPower(src);
  if (rar === 'legendario') {
    // jefe: su legendario propio; si no, uno de arma/escudo que pueda usar la clase
    let pool = Object.entries(LEGEND).filter(([, L]) => opt.boss ? L.boss === opt.boss : !L.boss && kinds.includes(L.kind) && (!L.wtype || classWTypes().includes(L.wtype)));
    if (opt.boss && !pool.length) pool = Object.entries(LEGEND).filter(([, L]) => !L.boss && kinds.includes(L.kind) && (!L.wtype || classWTypes().includes(L.wtype)));
    if (pool.length) {
      const [id, L] = pick(pool);
      return { kind: L.kind, wtype: L.wtype || (L.kind === 'arma' ? pick(classWTypes()) : undefined), rar, legend: id, stat: L.stat, val: Math.round(rand(L.v[0], L.v[1]) * P * 1000) / 1000, fx: Math.round(rand(L.fx[0], L.fx[1]) * 100) / 100 };
    }
    rar = 'epico';
  }
  const af = Math.floor(Math.random() * AFFIX[kind].length), A = AFFIX[kind][af], R = RARITY[rar];
  const it = { kind, rar, af, stat: A.stat, val: Math.round(A.v * R.k * P * rand(0.85, 1.15) * 1000) / 1000, base: Math.floor(Math.random() * 3) };
  if (kind === 'arma') it.wtype = pick(classWTypes());
  if (rar === 'epico') { it.special = EPIC[kind].id; if (kind === 'arma') it.elem = pick(['burn', 'slow', 'poison']); }
  return it;
}
function itemName(it) {
  if (it.legend) return LEGEND[it.legend].name;
  if (it.special) return EPIC[it.kind].name + (it.kind === 'arma' ? ` (${WT_NAME[it.wtype]})` : '');
  const bases = BASE_NAME[it.kind === 'arma' ? it.wtype : it.kind];
  return `${bases[it.base % bases.length]} ${AFFIX[it.kind][it.af].name}`;
}
function itemLines(it) {
  if (it.legend) return [LEGEND[it.legend].desc(it)];
  const out = [AFFIX[it.kind][it.af].desc(it.val)];
  if (it.special) out.push(EPIC[it.kind].desc);
  if (it.kind === 'arma' && !it.special) out.push(`Arma: ${WT_NAME[it.wtype]}`);
  return out;
}
function itemCol(it) { const c = RARITY[it.rar].col; return rgb(c[0], c[1], c[2]); }
function itemIcon(it) { return SPR[`icon_${it.kind}_${it.rar}`] || SPR[`icon_anillo_${it.rar}`]; }

// ---------------------------------------------------------------- efecto de lo equipado
// el arma solo cuenta si la llevas en la mano (o si estás transformado: las garras usan su poder); el escudo, si está alzado/empuñado
function itemActive(slot, it) {
  if (!it) return false;
  const p = G.p;
  if (slot === 'arma') { if (p.form !== 'human') return true; const w = p.weapon === 'daggers' ? 'dagger' : p.weapon; return w === it.wtype; }
  if (slot === 'escudo') return offhandOf(p) === 'shield';
  return true;
}
function eqItems() { const out = []; if (G.equip) for (const s of SLOTS) if (itemActive(s, G.equip[s])) out.push(G.equip[s]); return out; }
function eqStat(stat) {
  let s = 0;
  for (const it of eqItems()) {
    const st = it.stat === 'wdmg' ? 'dmg' : it.stat === 'wcrit' ? 'crit' : it.stat === 'wrate' ? 'rate' : it.stat === 'sarmor' ? 'armor' : it.stat;
    if (st === stat) s += it.val;
  }
  return s;
}
function eqSpecial(id) { return eqItems().some(it => it.special === id); }
function eqLegend(id) { return eqItems().find(it => it.legend === id) || null; }

// ---------------------------------------------------------------- recoger y cambiar
function takeItem(it) {
  const kind = it.kind, free = SLOTS.find(s => SLOT_KIND[s] === kind && !G.equip[s]);
  if (free) { equipItem(free, it); return true; }
  // hueco ocupado: se pausa y se pregunta
  G.swap = { item: it, slots: SLOTS.filter(s => SLOT_KIND[s] === kind) };
  G.state = 'swap'; mouse.fire = false; if (document.exitPointerLock) document.exitPointerLock();
  Sfx.play('unlock');
  return true;
}
function equipItem(slot, it) {
  G.equip[slot] = it; G.wskin = null; recalc();
  const name = itemName(it);
  toast(`EQUIPAS: ${name.toUpperCase()}`, false);
  Sfx.play(it.rar === 'legendario' || it.rar === 'epico' ? 'portal' : 'unlock');
  logMsg(`${name} · ${RARITY[it.rar].name}: ${itemLines(it).join(' · ')}`, it.rar === 'legendario' ? C.gold : it.rar === 'epico' ? C.orange : it.rar === 'raro' ? C.blue : C.ink);
  if (it.rar === 'legendario' || it.rar === 'epico') { G.flashFx = 0.6; jot('item' + (it.legend || it.special) + G.dg.n, `Encontré ${name.toLowerCase()} en el ${levelName(G.z)}. Siento su poder.`); }
}
// decisión del cuadro de cambio: slot = hueco a sustituir (el objeto viejo se destruye) o null = descartar el nuevo
function resolveSwap(slot) {
  const S = G.swap; if (!S) return;
  if (slot) { const old = G.equip[slot]; equipItem(slot, S.item); if (old) logMsg(`${itemName(old)} se hace pedazos`, C.dim); }
  else { logMsg(`Dejas ${itemName(S.item).toLowerCase()}: se hace pedazos`, C.dim); Sfx.play('door'); }
  G.swap = null; G.state = 'play'; lockMouse();
}
function dropItem(src, x, y, opt) { G.pickups.push({ type: 'item', item: makeItem(src, null, opt), x, y, t: rand(0, 6) }); }

// ---------------------------------------------------------------- efectos de combate
function equipHit(e, dmg) {
  const w = G.equip && itemActive('arma', G.equip.arma) ? G.equip.arma : null;
  if (w && w.special === 'elemental' && !e.dead) applyFx(e, w.elem === 'burn' ? { burn: 3 } : w.elem === 'slow' ? { slow: 1.5 } : { poison: 4 });
  if (eqLegend('reina') && !e.dead) applyFx(e, { poison: 4 });
  if (w && w.legend === 'solar') { G.solarN = (G.solarN || 0) + 1; if (G.solarN % 3 === 0) { aoe(e.x, e.y, 1.6, dmg * 0.8, { burn: 3, kb: 4 }); vfxExplosion(e.x, e.y, 0.8); } }
  if (w && w.legend === 'titan') { const fx = w.fx; later(0.05, () => { aoe(e.x, e.y, 1.8, dmg * fx, { kb: 9 }); vfxShock(e.x, e.y, 1.8); }); }
}
function equipOnKill(e) {
  const nec = eqLegend('nigromante'), rq = eqLegend('reina'), fang = eqLegend('colmillo');
  if (nec && !e.def.boss && Math.random() < nec.fx && G.allies.filter(a => a.type === 'undead').length < 4) spawnAlly('undead', e.x, e.y);
  if (rq && !e.def.boss && Math.random() < rq.fx) spawnAlly('spider', e.x, e.y);
  if (fang) { G.p.stealth = Math.max(G.p.stealth, 2); healP(G.p.maxHp * fang.fx); }
}
function equipOnHurt(d, sx, sy) {
  const p = G.p, g = eqLegend('guardian');
  if (g && (G.guardCd || 0) <= 0) { G.guardCd = 3.5; aoe(p.x, p.y, 2.6, (18 + d) * g.fx * (p.dmgMul || 1), { burn: 2, kb: 7 }); vRing(p.x, p.y, 0.3, 2.6, 0.3, VR.fire.slice(0, 5), 36); }
  const blocking = p.wantBlock && offhandOf(p) === 'shield';
  if (blocking && eqSpecial('reflejo') && sx !== undefined) { let best = null, bd = 2.2; for (const e of G.enemies) { const q = Math.hypot(e.x - sx, e.y - sy); if (!e.dead && q < bd) { bd = q; best = e; } } if (best) damageEnemy(best, d * 0.4, { silent: true }); }
}
function equipTick(dt) {
  G.guardCd = (G.guardCd || 0) - dt;
  const eye = eqLegend('primigenio');
  if (eye) {
    G.eyeT = (G.eyeT || eye.fx) - dt;
    if (G.eyeT <= 0) {
      G.eyeT = eye.fx;
      const t = nearestEnemy(9, true);
      if (t) { const a = Math.atan2(t.y - G.p.y, t.x - G.p.x); for (let i = -1; i <= 1; i++) fireProj({ a: a + i * 0.12, spd: 9, dmg: 14 * (G.p.dmgMul || 1), spr: 'orbPurple', size: 0.3, pierce: 1, life: 1.4 }); Sfx.play('shoot'); }
    }
  }
}
// Égida: bloqueando, los proyectiles enemigos rebotan
function equipReflect(pr) {
  const p = G.p;
  if (!(p.wantBlock && offhandOf(p) === 'shield' && eqLegend('egida'))) return false;
  pr.friendly = true; pr.vx = -pr.vx; pr.vy = -pr.vy; pr.hit = new Set(); pr.pierce = 1; pr.life = 1.5; pr.dmg *= 1.5;
  return true;
}

// ---------------------------------------------------------------- aspecto del arma equipada (sprite teñido según la rareza)
function tintSprite(spr, mul, glow) {
  const px = spr.px.slice();
  for (let i = 0; i < px.length; i++) {
    const c = px[i], a = c >>> 24; if (!a || a === 250) continue;
    const r = c & 255, g = (c >> 8) & 255, b = (c >> 16) & 255, l = (r + g + b) / 3;
    const nr = Math.min(255, r * mul[0]), ng = Math.min(255, g * mul[1]), nb = Math.min(255, b * mul[2]);
    px[i] = rgb(nr, ng, nb, glow && l > 170 ? 250 : 255);
  }
  return { w: spr.w, h: spr.h, px, flash: spr.flash, grip: spr.grip };
}
const RAR_TINT = { comun: null, raro: [[0.85, 0.97, 1.2], false], epico: [[0.95, 0.7, 1.25], false], legendario: [[1.3, 1.05, 0.55], true] };
function weaponSprite(type, base) {
  const it = G.equip && G.equip.arma, wt = type === 'daggers' ? 'dagger' : type;
  if (!it || it.wtype !== wt || !RAR_TINT[it.rar]) return base;
  G.wskin = G.wskin || {};
  const key = type + (base === SPR.daggerL ? 'L' : '') + it.rar;
  return G.wskin[key] || (G.wskin[key] = tintSprite(base, RAR_TINT[it.rar][0], RAR_TINT[it.rar][1]));
}
function shieldSprite() {
  const it = G.equip && G.equip.escudo;
  if (!it || !RAR_TINT[it.rar]) return SPR.shield;
  G.wskin = G.wskin || {};
  return G.wskin['shield' + it.rar] || (G.wskin['shield' + it.rar] = tintSprite(SPR.shield, RAR_TINT[it.rar][0], RAR_TINT[it.rar][1]));
}
