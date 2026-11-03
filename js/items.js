// Objetos equipables modestos: anillo, amuleto y armadura, con rarezas común / raro / épico.
// Los épicos son muy raros en cofres y algo más frecuentes en los jefes; tienen un poder único.
const RARITY = {
  comun: { name: 'Común', col: [200, 196, 186], k: 1 },
  raro: { name: 'Raro', col: [110, 170, 255], k: 1.8 },
  epico: { name: 'Épico', col: [200, 110, 255], k: 3 },
};
// cada afijo: estadística y valor base (se multiplica por la rareza)
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
};
const EPIC = {
  anillo: { id: 'sangre', name: 'Anillo de sangre', desc: 'Robas el 3% del daño como vida' },
  amuleto: { id: 'fenix', name: 'Amuleto del fénix', desc: 'Una vez por mazmorra te revive con el 40% de vida' },
  armadura: { id: 'espinas', name: 'Armadura de espinas', desc: 'Devuelve el 30% del daño a quien te golpea' },
};
const BASE_NAME = { anillo: ['Anillo de cobre', 'Anillo de plata', 'Sortija'], amuleto: ['Colgante', 'Amuleto', 'Talismán'], armadura: ['Jubón', 'Cota de malla', 'Coraza'] };
const SLOTS = ['anillo', 'amuleto', 'armadura'];

function rollRarity(src) {
  const r = Math.random();
  if (src === 'boss') return r < 0.2 ? 'epico' : r < 0.65 ? 'raro' : 'comun';
  if (src === 'ghost') return r < 0.08 ? 'epico' : r < 0.6 ? 'raro' : 'comun';
  return r < 0.02 ? 'epico' : r < 0.2 ? 'raro' : 'comun';
}
function makeItem(src, slot) {
  slot = slot || pick(SLOTS);
  const rar = rollRarity(src), R = RARITY[rar], n = G.dg ? G.dg.n : 1;
  const af = pick(AFFIX[slot]), val = af.v * R.k * (1 + 0.08 * (n - 1)) * rand(0.85, 1.15);
  const it = { slot, rar, stat: af.stat, val: Math.round(val * 1000) / 1000 };
  if (rar === 'epico') { it.special = EPIC[slot].id; it.name = EPIC[slot].name; }
  else it.name = `${pick(BASE_NAME[slot])} ${af.name}`;
  return it;
}
function itemLines(it) {
  const af = AFFIX[it.slot].find(a => a.stat === it.stat), out = [af.desc(it.val)];
  if (it.special) out.push(EPIC[it.slot].desc);
  return out;
}
function itemCol(it) { const c = RARITY[it.rar].col; return rgb(c[0], c[1], c[2]); }
// suma de una estadística de todo lo equipado
function eqStat(stat) { let s = 0; for (const k of SLOTS) { const it = G.equip && G.equip[k]; if (it && it.stat === stat) s += it.val; } return s; }
function eqSpecial(id) { return SLOTS.some(k => G.equip && G.equip[k] && G.equip[k].special === id); }

// recoger un objeto: si el hueco está libre se equipa; si no, a la mochila (8 huecos)
function takeItem(it) {
  if (!G.equip[it.slot]) { G.equip[it.slot] = it; recalc(); toast(`EQUIPAS: ${it.name.toUpperCase()}`, false); }
  else if (G.bag.length < 8) { G.bag.push(it); toast(`${it.name.toUpperCase()} (MOCHILA)`, false); }
  else { toast('LA MOCHILA ESTÁ LLENA', false); return false; }
  Sfx.play(it.rar === 'epico' ? 'portal' : 'unlock');
  logMsg(`${it.name} · ${RARITY[it.rar].name}: ${itemLines(it).join(' · ')}`, it.rar === 'epico' ? C.orange : it.rar === 'raro' ? C.blue : C.ink);
  if (it.rar === 'epico') { G.flashFx = 0.6; jot('epic' + it.special + G.dg.n, `Encontré ${it.name.toLowerCase()} en el ${levelName(G.z)}. Siento su poder.`); }
  return true;
}
function equipFromBag(i) {
  const it = G.bag[i]; if (!it) return;
  const old = G.equip[it.slot];
  G.equip[it.slot] = it; G.bag.splice(i, 1);
  if (old) G.bag.push(old);
  recalc(); Sfx.play('unlock');
}
function dropFromBag(i) { if (G.bag[i]) { G.bag.splice(i, 1); Sfx.play('door'); } }
function unequip(slot) { const it = G.equip[slot]; if (!it) return; if (G.bag.length >= 8) { toast('LA MOCHILA ESTÁ LLENA', false); return; } G.bag.push(it); G.equip[slot] = null; recalc(); }
function dropItem(src, x, y, slot) { G.pickups.push({ type: 'item', item: makeItem(src, slot), x, y, t: rand(0, 6) }); }
