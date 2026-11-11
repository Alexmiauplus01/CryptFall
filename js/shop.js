// Mercader (útiles de supervivencia) y herrero (mejoras de arma con efectos en los ataques).
// Ambos aparecen en salas propias dentro de la mazmorra; se paga con el botín que llevas encima.

// ---------------------------------------------------------------- Mercader
const SHOP_ITEMS = [
  { id: 'torch', name: 'Antorcha', desc: `Arde ${TORCH_FUEL / 60} minutos`, base: 14 },
  { id: 'potion', name: 'Poción de vida', desc: 'Cura la mitad de tu vida (H)', base: 26 },
  { id: 'map', name: 'Pergamino de mapa', desc: 'Revela el nivel en el que estás', base: 32 },
  { id: 'rune', name: 'Runa de regreso', desc: 'Te devuelve a la salida', base: 60 },
];
function shopPrice(it) { return Math.round(it.base * (1 + 0.45 * ((G.dg ? G.dg.n : 1) - 1))); }
function buyItem(id) {
  const it = SHOP_ITEMS.find(i => i.id === id); if (!it) return;
  const cost = shopPrice(it);
  if (G.loot < cost) { toast('NO TE ALCANZA EL ORO', false); Sfx.play('locked'); return; }
  G.loot -= cost; G.inv[id] = (G.inv[id] || 0) + 1;
  Sfx.play('coin'); logMsg(`Compras: ${it.name} (-${cost} de oro)`, C.gold);
}

// objetos de supervivencia que se usan desde el inventario
function drinkPotion() {
  const p = G.p;
  if (!G.inv.potion) { toast('NO TIENES POCIONES', false); return; }
  if (p.hp >= p.maxHp) { toast('YA TIENES LA VIDA AL MÁXIMO', false); return; }
  G.inv.potion--; p.hp = p.maxHp; // siempre cura entera, también con pactos
  Sfx.play('potion'); logMsg('Bebes una poción de vida', C.green);
}
function readMap() {
  if (!G.inv.map) return;
  G.inv.map--; G.lv.seen.fill(1);
  Sfx.play('shrine'); toast('EL NIVEL SE REVELA EN TU MAPA', false);
  jot('map' + G.z, `Un viejo pergamino me mostró todos los pasillos del ${levelName(G.z)}.`);
}
function useRune() {
  if (!G.inv.rune) return;
  G.inv.rune--; Sfx.play('portal'); G.flashFx = 1;
  G.zPrev = G.z;
  const s = G.dg.start;
  enterLevel(s.z, s);
  toast('LA RUNA TE DEVUELVE A LA SALIDA', true);
  G.state = 'play'; lockMouse();
}

// ---------------------------------------------------------------- Herrero
// cada efecto tiene hasta 3 niveles; se aplican a los ataques normales (arma, hechizo básico, flechas)
const FORGE = [
  { id: 'fuego', name: 'Filo ardiente', desc: (l) => `Tus golpes queman ${2 + l} s` },
  { id: 'hielo', name: 'Escarcha', desc: (l) => `Ralentizan y congelan (${10 * l}% de prob.)` },
  { id: 'rayo', name: 'Tormenta', desc: (l) => `${15 + 10 * l}% de rayo en cadena a ${1 + l} enemigos` },
  { id: 'veneno', name: 'Ponzoña', desc: (l) => `Envenenan ${3 + l} s` },
  { id: 'vampiro', name: 'Sed de sangre', desc: (l) => `Robas ${3 * l}% del daño como vida` },
  { id: 'eco', name: 'Golpe doble', desc: (l) => `${12 * l}% de repetir el golpe` },
  { id: 'estallido', name: 'Estallido', desc: (l) => `Los enemigos que matas explotan (radio ${(1.4 + 0.3 * l).toFixed(1)})` },
  { id: 'filo', name: 'Filo templado', desc: (l) => `+${20 * l}% de daño` },
  { id: 'rapidez', name: 'Equilibrio', desc: (l) => `+${12 * l}% de velocidad de ataque` },
  { id: 'critico', name: 'Filo afilado', desc: (l) => `+${8 * l}% de probabilidad de crítico` },
];
const FL = (id) => (G.forge && G.forge[id]) || 0;
function forgeCount() { return G.forge ? Object.values(G.forge).reduce((a, b) => a + b, 0) : 0; }
// la primera mejora es gratis; después cada una cuesta casi el doble que la anterior
function forgePrice() { const k = forgeCount(); return k === 0 ? 0 : Math.round(90 * Math.pow(1.9, k - 1) * (1 + 0.3 * ((G.dg ? G.dg.n : 1) - 1))); }
function rollForge() {
  const pool = FORGE.filter(f => FL(f.id) < 3), out = [];
  while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  G.forgeOpts = out;
}
function forgeBuy(i) {
  const f = G.forgeOpts && G.forgeOpts[i]; if (!f) return;
  const cost = forgePrice();
  if (G.loot < cost) { toast('NO TE ALCANZA EL ORO', false); Sfx.play('locked'); return; }
  G.loot -= cost; G.forge[f.id] = FL(f.id) + 1;
  Sfx.play('unlock'); G.flashFx = 0.4; G.shake = Math.max(G.shake, 0.2);
  logMsg(`El herrero forja ${f.name} (nv ${FL(f.id)})${cost ? ` por ${cost} de oro` : ''}`, C.orange);
  jot('forge' + forgeCount(), `El herrero templó mi arma: ${f.name}, nivel ${FL(f.id)}.`);
  recalc(); rollForge();
}
// multiplicadores de estadísticas (se llama desde applyStats)
function forgeStats(s) {
  if (!G.forge) return;
  s.dmg *= 1 + 0.2 * FL('filo'); s.rate *= 1 + 0.12 * FL('rapidez'); s.crit += 0.08 * FL('critico'); s.leech += 0.03 * FL('vampiro');
}
// color del tajo según el efecto elemental dominante
function forgeRamp() { return FL('fuego') ? 'fire' : FL('hielo') ? 'ice' : FL('rayo') ? 'volt' : FL('veneno') ? 'poison' : null; }
// efectos al golpear con un ataque normal
function forgeHit(e, dmg) {
  if (!G.forge || !forgeCount()) return;
  const dm = G.p.dmgMul || 1;
  if (!e.dead) {
    if (FL('fuego')) { e.burn = Math.max(e.burn || 0, 2 + FL('fuego')); e.burnDps = Math.max(e.burnDps || 0, 5 * FL('fuego') * dm); }
    if (FL('veneno')) { e.poison = Math.max(e.poison || 0, 3 + FL('veneno')); e.poisDps = Math.max(e.poisDps || 0, 4 * FL('veneno') * dm); }
    if (FL('hielo')) { e.slow = Math.max(e.slow, 1 + 0.5 * FL('hielo')); if (Math.random() < 0.1 * FL('hielo')) { applyFx(e, { stun: 1 }); burst(e.x, e.y, 0.5, 8, rgb(170, 220, 255), 1.6, 0.5); } }
    if (FL('eco') && Math.random() < 0.12 * FL('eco')) later(0.12, () => { if (!e.dead) damageEnemy(e, dmg, { silent: true }); });
  }
  if (FL('rayo') && Math.random() < 0.15 + 0.1 * FL('rayo')) {
    const nx = nearestEnemy(4.6, true, e.x, e.y, new Set([e]));
    if (nx) chainFrom(nx, 1 + FL('rayo'), dmg * 0.5);
  }
}
function forgeOnKill(e) {
  if (!FL('estallido') || e.def.boss) return;
  const l = FL('estallido');
  later(0.06, () => { aoe(e.x, e.y, 1.4 + 0.3 * l, (10 + 8 * l) * (G.p.dmgMul || 1), { kb: 3 }); vfxExplosion(e.x, e.y, 0.6 + 0.15 * l); });
}

// ---------------------------------------------------------------- Encuentros: acercarse al mercader o al herrero abre su menú
function updateNpcs() {
  const p = G.p;
  for (const n of G.lv.npcs || []) {
    const near = Math.hypot(n.x - p.x, n.y - p.y) < 1.35;
    if (near && !n.near) {
      if (n.type === 'merchant') openShop(); else if (n.type === 'mentor') openMentor(); else openForge();
      if (!G.met[n.type]) {
        G.met[n.type] = true;
        jot('npc' + n.type + G.dg.n, n.type === 'merchant'
          ? `Un mercader encapuchado vende sus útiles en el ${levelName(G.z)}. Dice que la oscuridad es buen negocio.`
          : n.type === 'mentor' ? `Un viejo mentor estudia sus libros en el ${levelName(G.z)}. Por un poco de oro me ayuda a elegir qué técnicas llevar.`
          : `Un herrero ha montado su yunque en el ${levelName(G.z)}. La primera mejora me la regala.`);
      }
    }
    n.near = near;
  }
}
function openShop() { G.state = 'shop'; mouse.fire = false; if (document.exitPointerLock) document.exitPointerLock(); Sfx.play('coin'); }
function openForge() { if (!G.forgeOpts || !G.forgeOpts.length) rollForge(); G.state = 'forge'; mouse.fire = false; if (document.exitPointerLock) document.exitPointerLock(); Sfx.play('unlock'); }
function closeNpc() { if (G.state !== 'shop' && G.state !== 'forge' && G.state !== 'mentor') return; G.state = 'play'; lockMouse(); }

// ---------------------------------------------------------------- Mentor
// Guarda todo lo que has aprendido en la partida (habilidades de tu clase base hasta la maestra y pasivas)
// y, por oro, te deja elegir qué 3 habilidades y qué 3 pasivas llevas activas.
function mentorPrice() { return Math.round(20 * (1 + 0.45 * ((G.dg ? G.dg.n : 1) - 1))); }
function openMentor() { G.state = 'mentor'; G.mentorSel = { kind: 'skill', i: Math.max(0, G.p.active.indexOf(null)) }; mouse.fire = false; if (document.exitPointerLock) document.exitPointerLock(); Sfx.play('shrine'); }
function mentorPay() {
  const c = mentorPrice();
  if (G.loot < c) { toast('NO TE ALCANZA EL ORO', false); Sfx.play('locked'); return false; }
  G.loot -= c; Sfx.play('coin'); return true;
}
function mentorAction(id) {
  if (G.state !== 'mentor' || typeof id !== 'string') return;
  const p = G.p, [k, v] = id.split(':');
  if (k === 'sk') { G.mentorSel = { kind: 'skill', i: +v }; Sfx.play('gem'); return; }
  if (k === 'pa') { G.mentorSel = { kind: 'pas', i: +v }; Sfx.play('gem'); return; }
  if (k === 'kn') {
    if (p.active.includes(v)) return;
    let i = G.mentorSel && G.mentorSel.kind === 'skill' ? G.mentorSel.i : p.active.indexOf(null);
    if (i < 0) i = 0;
    if (!mentorPay()) return;
    const old = p.active[i]; p.active[i] = v; p.skillCd[i] = 0; p.skillMax[i] = 1;
    logMsg(`El Mentor te enseña a usar ${SKILLS[v].name}${old ? ` en lugar de ${SKILLS[old].name}` : ''}`, C.cyan);
    G.mentorSel = { kind: 'skill', i };
    return;
  }
  if (k === 'ps') {
    if (G.pasOn.includes(v)) return;
    let i = G.pasOn.length < MAX_PAS ? G.pasOn.length : (G.mentorSel && G.mentorSel.kind === 'pas' ? G.mentorSel.i : 0);
    if (!mentorPay()) return;
    const u = UPG.find(q => q.id === v), old = G.pasOn[i] && UPG.find(q => q.id === G.pasOn[i]);
    G.pasOn[i] = v; recalc();
    if (v === 'nova') G.novaT = Math.min(G.novaT, 1);
    logMsg(`El Mentor despierta ${u.name}${old ? ` y adormece ${old.name}` : ''}`, C.orange);
    G.mentorSel = { kind: 'pas', i };
  }
}
