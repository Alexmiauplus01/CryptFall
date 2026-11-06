// Equipo: 2 anillos, amuleto, armadura, arma y escudo. Sin mochila: lo que encuentras se equipa en el momento
// (si el hueco está ocupado, el juego pregunta y el objeto descartado se queda en el suelo hasta que sales).
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
const WTYPES = ['sword', 'greatsword', 'dagger', 'staff', 'bow'];
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
// Legendarios. Cada jefe tiene un SET de 5 piezas (anillo, amuleto, armadura, arma y escudo) con bonificaciones
// al llevar 2, 4 y 5 piezas; además hay legendarios sueltos de arma y escudo (cofres y fantasmas).
const SETS = {
  nigromante: { boss: 'lich', name: 'Ajuar del Nigromante', bonus: { 2: 'Tus no muertos tienen +50% de vida y daño', 4: 'Hasta 6 no muertos y +20% de probabilidad de levantarlos', 5: 'Cada 20 s se levantan dos siervos a tu lado' } },
  reina: { boss: 'queen', name: 'Seda de la Reina', bonus: { 2: 'Tu veneno hace +50% de daño', 4: '+20% de probabilidad de que tus víctimas suelten arañas', 5: 'Cada víctima suelta una araña aliada' } },
  guardian: { boss: 'boss', name: 'Bastión del Guardián', bonus: { 2: '-15% de daño recibido', 4: 'El anillo de fuego se recarga el doble de rápido', 5: 'Al bajar del 30% de vida eres invulnerable 3 s (cada 60 s)' } },
  lilith: { boss: 'lilith', name: 'Seducción de Lilith', bonus: { 2: '+5% de robo de vida', 4: 'Tus sombras aliadas duran el doble', 5: 'Cada enemigo que matas te cura el 3%' } },
  rlyeh: { boss: 'cthulhu', name: 'Legado de R\'lyeh', bonus: { 2: '+15% de vida', 4: 'Los tentáculos salen el doble de a menudo', 5: 'Cada 30 s un tentáculo gigante barre a los enemigos cercanos' } },
  dragon: { boss: 'dragon', name: 'Furia del Dragón Rojo', bonus: { 2: 'Tus quemaduras hacen +50% de daño', 4: 'El aliento de fuego llega más lejos', 5: 'Cada 25 s un rugido de dragón desata una nova de fuego' } },
  vacio: { boss: 'voidlord', name: 'Visión del Vacío', bonus: { 2: '+10% de crítico', 4: 'Orbes del vacío el doble de rápido (aunque no lleves el anillo)', 5: 'Los críticos hacen el triple de daño' } },
};
const P = (n) => Math.round(n * 100);
const LEGEND = {
  // ---- Ajuar del Nigromante (el Liche)
  nigromante: { set: 'nigromante', kind: 'anillo', name: 'Anillo del nigromante', stat: 'leech', v: [0.04, 0.08], fx: [0.15, 0.3], desc: (it) => `Robas el ${P(it.val)}% del daño como vida · ${P(it.fx)}% de levantar como aliado al enemigo que matas` },
  filacteria: { set: 'nigromante', kind: 'amuleto', name: 'Filacteria', stat: 'hp', v: [0.1, 0.18], fx: [0.4, 0.6], desc: (it) => `+${P(it.val)}% de vida · una vez por mazmorra vuelves a la vida con el ${P(it.fx)}% y dos siervos` },
  mortaja: { set: 'nigromante', kind: 'armadura', name: 'Mortaja del liche', stat: 'armor', v: [0.12, 0.18], fx: [2.2, 3], desc: (it) => `-${P(it.val)}% de daño recibido · ralentiza a los enemigos a ${it.fx.toFixed(1)} de distancia` },
  nig_arma: { set: 'nigromante', kind: 'arma', name: { sword: 'Hoja del nigromante', greatsword: 'Segadora del nigromante', dagger: 'Daga ritual', staff: 'Báculo del nigromante', bow: 'Arco de hueso' }, stat: 'wdmg', v: [0.2, 0.3], fx: [0.03, 0.06], desc: (it) => `+${P(it.val)}% de daño · cada golpe te cura el ${P(it.fx)}% del daño` },
  nig_escudo: { set: 'nigromante', kind: 'escudo', name: 'Escudo de huesos', stat: 'block', v: [0.25, 0.35], fx: [0.03, 0.05], desc: (it) => `Bloquea un ${P(it.val)}% más · cada bloqueo te cura el ${P(it.fx)}% de la vida` },
  // ---- Seda de la Reina (la Reina Araña)
  reina: { set: 'reina', kind: 'amuleto', name: 'Corazón de la Reina Araña', stat: 'hp', v: [0.12, 0.2], fx: [0.25, 0.4], desc: (it) => `+${P(it.val)}% de vida · tus golpes envenenan y el ${P(it.fx)}% de tus víctimas suelta una araña aliada` },
  viuda: { set: 'reina', kind: 'anillo', name: 'Anillo de la viuda', stat: 'dmg', v: [0.1, 0.16], fx: [0.4, 0.6], desc: (it) => `+${P(it.val)}% de daño · +${P(it.fx)}% de daño a enemigos envenenados` },
  caparazon: { set: 'reina', kind: 'armadura', name: 'Caparazón quitinoso', stat: 'armor', v: [0.14, 0.2], fx: [0.2, 0.3], desc: (it) => `-${P(it.val)}% de daño recibido · quien te golpea queda envenenado y recibe el ${P(it.fx)}%` },
  reina_arma: { set: 'reina', kind: 'arma', name: { sword: 'Aguijón de la Reina', greatsword: 'Pata de la Reina', dagger: 'Colmillo de la Reina', staff: 'Cetro de la Reina', bow: 'Arco de seda' }, stat: 'wdmg', v: [0.2, 0.3], fx: [0.1, 0.15], desc: (it) => `+${P(it.val)}% de daño · veneno potente y ${P(it.fx)}% de que nazca una araña al golpear` },
  reina_escudo: { set: 'reina', kind: 'escudo', name: 'Escudo de telaraña', stat: 'block', v: [0.25, 0.35], fx: [2, 3], desc: (it) => `Bloquea un ${P(it.val)}% más · al bloquear, el atacante queda atrapado ${it.fx.toFixed(0)} s` },
  // ---- Bastión del Guardián (el Guardián)
  guardian: { set: 'guardian', kind: 'armadura', name: 'Coraza del Guardián', stat: 'armor', v: [0.18, 0.26], fx: [0.8, 1.2], desc: (it) => `-${P(it.val)}% de daño recibido · al recibir un golpe estalla un anillo de fuego` },
  brasas: { set: 'guardian', kind: 'anillo', name: 'Anillo de brasas', stat: 'dmg', v: [0.1, 0.16], fx: [3, 4], desc: (it) => `+${P(it.val)}% de daño · tus golpes queman ${it.fx.toFixed(0)} s` },
  igneo: { set: 'guardian', kind: 'amuleto', name: 'Corazón ígneo', stat: 'regen', v: [1, 1.8], fx: [0.02, 0.04], desc: (it) => `+${it.val.toFixed(1)} de vida por segundo · cada enemigo que matas te cura el ${P(it.fx)}%` },
  guardian_arma: { set: 'guardian', kind: 'arma', name: { sword: 'Filo del Guardián', greatsword: 'Espadón del Guardián', dagger: 'Daga ígnea', staff: 'Báculo de brasas', bow: 'Arco de brasas' }, stat: 'wdmg', v: [0.25, 0.35], fx: [3, 3], desc: (it) => `+${P(it.val)}% de daño · cada tercer golpe estalla en llamas` },
  guardian_escudo: { set: 'guardian', kind: 'escudo', name: 'Égida ígnea', stat: 'block', v: [0.3, 0.4], fx: [1, 1], desc: (it) => `Bloquea un ${P(it.val)}% más · al bloquear estalla un anillo de fuego` },
  // ---- Visión del Vacío (el Ojo Primigenio)
  primigenio: { set: 'vacio', kind: 'anillo', name: 'Ojo primigenio', stat: 'crit', v: [0.1, 0.15], fx: [3, 4.5], desc: (it) => `+${P(it.val)}% de crítico · cada ${it.fx.toFixed(1)} s lanza orbes del vacío al enemigo más cercano` },
  lagrima: { set: 'vacio', kind: 'amuleto', name: 'Lágrima del vacío', stat: 'crit', v: [0.06, 0.1], fx: [0.5, 0.8], desc: (it) => `+${P(it.val)}% de crítico · los críticos hacen un ${P(it.fx)}% más de daño` },
  manto: { set: 'vacio', kind: 'armadura', name: 'Manto del vacío', stat: 'dash', v: [0.2, 0.3], fx: [1, 1.5], desc: (it) => `Esquiva ${P(it.val)}% más rápido · al esquivar dejas un estallido del vacío` },
  vacio_arma: { set: 'vacio', kind: 'arma', name: { sword: 'Hoja del vacío', greatsword: 'Espadón del vacío', dagger: 'Daga del vacío', staff: 'Báculo del vacío', bow: 'Arco del vacío' }, stat: 'wcrit', v: [0.1, 0.15], fx: [0.6, 0.9], desc: (it) => `+${P(it.val)}% de crítico · cada crítico dispara un orbe del vacío` },
  vacio_escudo: { set: 'vacio', kind: 'escudo', name: 'Espejo del vacío', stat: 'block', v: [0.25, 0.35], fx: [1, 1], desc: (it) => `Bloquea un ${P(it.val)}% más · al bloquear devuelves los proyectiles` },
  // ---- sueltos (cofres y fantasmas)
  solar: { kind: 'arma', wtype: 'sword', name: 'Hoja solar', stat: 'wdmg', v: [0.25, 0.35], fx: [3, 3], desc: (it) => `+${P(it.val)}% de daño · cada tercer golpe estalla en llamas` },
  titan: { kind: 'arma', wtype: 'greatsword', name: 'Rompemontañas', stat: 'wdmg', v: [0.25, 0.35], fx: [0.4, 0.6], desc: (it) => `+${P(it.val)}% de daño · cada golpe lanza una onda de choque` },
  colmillo: { kind: 'arma', wtype: 'dagger', name: 'Colmillo de sombra', stat: 'wcrit', v: [0.12, 0.18], fx: [0.05, 0.08], desc: (it) => `+${P(it.val)}% de crítico · al matar te ocultas y recuperas un ${P(it.fx)}% de vida` },
  archimago: { kind: 'arma', wtype: 'staff', name: 'Báculo del archimago', stat: 'wdmg', v: [0.2, 0.3], fx: [1, 1], desc: (it) => `+${P(it.val)}% de daño · +1 proyectil y atraviesan a un enemigo más` },
  almas: { kind: 'arma', wtype: 'bow', name: 'Arco de las almas', stat: 'wdmg', v: [0.25, 0.35], fx: [2, 2], desc: (it) => `+${P(it.val)}% de daño · tus flechas atraviesan a ${it.fx.toFixed(0)} enemigos más` },
  // ---- Seducción de Lilith
  lil_anillo: { set: 'lilith', kind: 'anillo', name: 'Anillo de Lilith', stat: 'leech', v: [0.04, 0.07], fx: [0.15, 0.25], desc: (it) => `Robas el ${P(it.val)}% del daño como vida · ${P(it.fx)}% de que tus víctimas se alcen como sombras aliadas` },
  lil_amuleto: { set: 'lilith', kind: 'amuleto', name: 'Corazón de Lilith', stat: 'hp', v: [0.1, 0.18], fx: [0.15, 0.25], desc: (it) => `+${P(it.val)}% de vida · por debajo del 40% de vida tus golpes te curan el ${P(it.fx)}% del daño` },
  lil_armadura: { set: 'lilith', kind: 'armadura', name: 'Alas de Lilith', stat: 'dash', v: [0.2, 0.3], fx: [1.2, 1.8], desc: (it) => `Esquiva ${P(it.val)}% más rápido · al esquivar te vuelves invisible ${it.fx.toFixed(1)} s` },
  lil_arma: { set: 'lilith', kind: 'arma', name: { sword: 'Hoja de Lilith', greatsword: 'Espadón de Lilith', dagger: 'Aguijón de Lilith', staff: 'Cetro de Lilith', bow: 'Arco de Lilith' }, stat: 'wdmg', v: [0.2, 0.3], fx: [2, 3], desc: (it) => `+${P(it.val)}% de daño · tus golpes debilitan: el enemigo hace -30% de daño ${it.fx.toFixed(0)} s` },
  lil_escudo: { set: 'lilith', kind: 'escudo', name: 'Égida de Lilith', stat: 'block', v: [0.25, 0.35], fx: [2, 3], desc: (it) => `Bloquea un ${P(it.val)}% más · al bloquear hechizas al atacante ${it.fx.toFixed(0)} s` },
  // ---- Legado de R'lyeh (Cthulhu)
  cth_anillo: { set: 'rlyeh', kind: 'anillo', name: 'Ojo de R\'lyeh', stat: 'crit', v: [0.08, 0.12], fx: [0.12, 0.2], desc: (it) => `+${P(it.val)}% de crítico · ${P(it.fx)}% de que un tentáculo golpee y frene a tu objetivo` },
  cth_amuleto: { set: 'rlyeh', kind: 'amuleto', name: 'Ídolo durmiente', stat: 'hp', v: [0.12, 0.2], fx: [0.25, 0.4], desc: (it) => `+${P(it.val)}% de vida · ${P(it.fx)}% de que quien te golpea enloquezca y quede aturdido` },
  cth_armadura: { set: 'rlyeh', kind: 'armadura', name: 'Escamas abisales', stat: 'armor', v: [0.14, 0.2], fx: [1, 1], desc: (it) => `-${P(it.val)}% de daño recibido · inmune a la escarcha y al veneno` },
  cth_arma: { set: 'rlyeh', kind: 'arma', name: { sword: 'Hoja de R\'lyeh', greatsword: 'Rompeabismos', dagger: 'Colmillo abisal', staff: 'Báculo del Durmiente', bow: 'Arco de coral' }, stat: 'wdmg', v: [0.22, 0.32], fx: [4, 4], desc: (it) => `+${P(it.val)}% de daño · cada cuarto golpe brota un tentáculo que aplasta y frena` },
  cth_escudo: { set: 'rlyeh', kind: 'escudo', name: 'Concha del abismo', stat: 'block', v: [0.25, 0.35], fx: [2, 2.5], desc: (it) => `Bloquea un ${P(it.val)}% más · al bloquear sueltas tinta que frena a los enemigos ${it.fx.toFixed(1)} s` },
  // ---- Furia del Dragón Rojo
  dra_anillo: { set: 'dragon', kind: 'anillo', name: 'Garra de dragón', stat: 'dmg', v: [0.12, 0.18], fx: [4, 5], desc: (it) => `+${P(it.val)}% de daño · tus golpes queman ${it.fx.toFixed(0)} s` },
  dra_amuleto: { set: 'dragon', kind: 'amuleto', name: 'Corazón de dragón', stat: 'hp', v: [0.12, 0.2], fx: [0.5, 0.8], desc: (it) => `+${P(it.val)}% de vida · los enemigos que matas estallan en llamas` },
  dra_armadura: { set: 'dragon', kind: 'armadura', name: 'Escamas de dragón', stat: 'armor', v: [0.16, 0.24], fx: [0.3, 0.5], desc: (it) => `-${P(it.val)}% de daño recibido · quien te golpea arde y recibe el ${P(it.fx)}%` },
  dra_arma: { set: 'dragon', kind: 'arma', name: { sword: 'Colmillo de dragón', greatsword: 'Matadragones', dagger: 'Diente de dragón', staff: 'Báculo del dragón', bow: 'Arco de escamas' }, stat: 'wdmg', v: [0.25, 0.35], fx: [3, 3], desc: (it) => `+${P(it.val)}% de daño · cada tercer golpe lanzas un aliento de fuego` },
  dra_escudo: { set: 'dragon', kind: 'escudo', name: 'Escudo de escamas', stat: 'block', v: [0.3, 0.4], fx: [1, 1], desc: (it) => `Bloquea un ${P(it.val)}% más · al bloquear lanzas un aliento de fuego` },
  egida: { kind: 'escudo', name: 'Égida', stat: 'block', v: [0.3, 0.4], fx: [1, 1], desc: (it) => `Bloquea un ${P(it.val)}% más · al bloquear devuelves los proyectiles` },
};
for (const id in LEGEND) if (LEGEND[id].set) LEGEND[id].boss = SETS[LEGEND[id].set].boss;
const BASE_NAME = {
  anillo: ['Anillo de cobre', 'Anillo de plata', 'Sortija'], amuleto: ['Colgante', 'Amuleto', 'Talismán'], armadura: ['Jubón', 'Cota de malla', 'Coraza'],
  sword: ['Espada corta', 'Espada larga', 'Hoja de acero'], greatsword: ['Mandoble', 'Espadón', 'Montante'], dagger: ['Puñal', 'Daga', 'Estilete'], staff: ['Bastón', 'Vara', 'Báculo'],
  bow: ['Arco corto', 'Arco largo', 'Arco compuesto'], escudo: ['Rodela', 'Escudo de roble', 'Pavés'],
};
const WT_NAME = { sword: 'espada', greatsword: 'espadón', dagger: 'daga', staff: 'bastón', bow: 'arco' };

// ---------------------------------------------------------------- creación
function rollRarity(src) {
  const r = Math.random();
  if (src === 'boss') return r < 0.12 ? 'legendario' : r < 0.32 ? 'epico' : r < 0.72 ? 'raro' : 'comun';
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
    // jefe: una pieza de su set que la clase pueda usar; si no, un legendario suelto
    const usable = ([, L]) => kinds.includes(L.kind) && (!L.wtype || classWTypes().includes(L.wtype));
    let pool = Object.entries(LEGEND).filter(e => (opt.boss ? e[1].boss === opt.boss : !e[1].set) && usable(e));
    if (!pool.length) pool = Object.entries(LEGEND).filter(e => !e[1].set && usable(e));
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
// concordancia en castellano: "Arco afilado", "Espada afilada", "Rodela reforzada"
const FEM_BASE = /^(Espada|Hoja|Daga|Vara|Rodela|Cota|Coraza|Sortija)/;
function agree(base, adj) {
  const fem = FEM_BASE.test(base);
  if (fem && /^(reforzado)$/.test(adj)) return adj.slice(0, -1) + 'a';
  if (!fem && /^(afilada|certera|ligera)$/.test(adj)) return adj.slice(0, -1) + 'o';
  return adj;
}
function itemName(it) {
  if (it.legend) { const n = LEGEND[it.legend].name; return typeof n === 'string' ? n : n[it.wtype] || Object.values(n)[0]; }
  if (it.special) return EPIC[it.kind].name + (it.kind === 'arma' ? ` (${WT_NAME[it.wtype]})` : '');
  const bases = BASE_NAME[it.kind === 'arma' ? it.wtype : it.kind], base = bases[it.base % bases.length];
  return `${base} ${agree(base, AFFIX[it.kind][it.af].name)}`;
}
function itemLines(it) {
  if (it.legend) { const L = LEGEND[it.legend], out = [L.desc(it)]; if (L.set) out.push(`Set ${SETS[L.set].name} (${setCount(L.set)}/5)`); return out; }
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
// piezas activas de un set
function setCount(set) { return eqItems().filter(it => it.legend && LEGEND[it.legend].set === set).length; }
function critMul() { const l = eqLegend('lagrima'); return Math.max(setCount('vacio') >= 5 ? 3 : 2, 2 + (l ? l.fx : 0)); }
function setArmor() { return setCount('guardian') >= 2 ? 0.15 : 0; }
function setCrit() { return setCount('vacio') >= 2 ? 0.1 : 0; }

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
// decisión del cuadro de cambio: slot = hueco a sustituir o null = quedarte con lo que llevas
function resolveSwap(slot) {
  const S = G.swap; if (!S) return;
  // lo que no te quedas (el viejo o el nuevo) se queda en el suelo; al salir de la mazmorra se pierde
  const left = slot ? G.equip[slot] : S.item;
  if (slot) equipItem(slot, S.item);
  if (left) { G.pickups.push({ type: 'item', item: left, x: G.p.x, y: G.p.y, t: 0, declined: true }); logMsg(`Dejas ${itemName(left).toLowerCase()} en el suelo`, C.dim); }
  G.swap = null; G.state = 'play'; lockMouse();
}
function dropItem(src, x, y, opt) { G.pickups.push({ type: 'item', item: makeItem(src, null, opt), x, y, t: rand(0, 6) }); }

// ---------------------------------------------------------------- efectos de combate
function raiseUndead(x, y) {
  const lim = setCount('nigromante') >= 4 ? 6 : 4;
  if (G.allies.filter(a => a.type === 'undead' && !a.dead).length >= lim) return;
  const a = spawnAlly('undead', x, y);
  if (setCount('nigromante') >= 2) { a.hp *= 1.5; a.maxHp *= 1.5; a.dmg *= 1.5; }
}
// efectos comunes de los sets nuevos
function tentacle(x, y, dmg) { aoe(x, y, 1.6, dmg, { slow: 2, kb: 3 }); vfxShock(x, y, 1.6); Sfx.play('hit'); }
function fireBreath(mul) {
  const p = G.p, r = setCount('dragon') >= 4 ? 4.6 : 3.2;
  aoe(p.x, p.y, r, (16 + 8 * (G.dg ? G.dg.n : 1)) * mul * (p.dmgMul || 1), { burn: 3, kb: 3, cone: { a: p.a, arc: 1.2 } });
  for (let k = 0; k < 14; k++) { const a = p.a + rand(-0.5, 0.5), d = rand(0.6, r); burst(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, 0.5, 3, rgb(255, 150, 50), 1.5, 0.4); }
  Sfx.play('nova');
}
function equipHit(e, dmg, crit) {
  const w = G.equip && itemActive('arma', G.equip.arma) ? G.equip.arma : null, wl = w && w.legend;
  if (w && w.special === 'elemental' && !e.dead) applyFx(e, w.elem === 'burn' ? { burn: 3 } : w.elem === 'slow' ? { slow: 1.5 } : { poison: 4 });
  if ((eqLegend('reina') || wl === 'reina_arma') && !e.dead) applyFx(e, { poison: wl === 'reina_arma' ? 6 : 4 });
  if (wl === 'reina_arma' && Math.random() < w.fx && G.allies.filter(a => a.type === 'spider').length < 8) spawnAlly('spider', e.x, e.y);
  const br = eqLegend('brasas'); if (br && !e.dead) applyFx(e, { burn: br.fx });
  const vd = eqLegend('viuda'); if (vd && e.poison > 0 && !e.dead) damageEnemy(e, dmg * vd.fx, { silent: true });
  if (wl === 'nig_arma') healP(dmg * w.fx);
  if (wl === 'solar' || wl === 'guardian_arma') { G.solarN = (G.solarN || 0) + 1; if (G.solarN % 3 === 0) { aoe(e.x, e.y, 1.6, dmg * 0.8, { burn: 3, kb: 4 }); vfxExplosion(e.x, e.y, 0.8); } }
  if (wl === 'titan') { const fx = w.fx; later(0.05, () => { aoe(e.x, e.y, 1.8, dmg * fx, { kb: 9 }); vfxShock(e.x, e.y, 1.8); }); }
  // Lilith
  const lh = eqLegend('lil_amuleto'); if (lh && G.p.hp < G.p.maxHp * 0.4) healP(dmg * lh.fx);
  if (wl === 'lil_arma' && !e.dead) e.weak = Math.max(e.weak || 0, w.fx);
  // R'lyeh
  const ce = eqLegend('cth_anillo'); if (ce && !e.dead && Math.random() < ce.fx * (setCount('rlyeh') >= 4 ? 2 : 1)) tentacle(e.x, e.y, dmg * 0.8);
  if (wl === 'cth_arma') { G.cthN = (G.cthN || 0) + 1; if (G.cthN % (setCount('rlyeh') >= 4 ? 2 : 4) === 0) tentacle(e.x, e.y, dmg * 1.2); }
  // Dragón
  const dc = eqLegend('dra_anillo'); if (dc && !e.dead) applyFx(e, { burn: dc.fx });
  if (wl === 'dra_arma') { G.draN = (G.draN || 0) + 1; if (G.draN % 3 === 0) fireBreath(0.9); }
  if (wl === 'vacio_arma' && crit) { const a = Math.atan2(e.y - G.p.y, e.x - G.p.x); fireProj({ a, spd: 10, dmg: dmg * w.fx, spr: 'orbPurple', size: 0.3, pierce: 2, life: 1.2 }); }
}
function equipOnKill(e) {
  const la = eqLegend('lil_anillo'); if (la && !e.def.boss && Math.random() < la.fx) { const s = spawnAlly('shadow', e.x, e.y); if (s && setCount('lilith') >= 4 && s.life) s.life *= 2; }
  if (setCount('lilith') >= 5) healP(G.p.maxHp * 0.03);
  const dh = eqLegend('dra_amuleto'); if (dh) { aoe(e.x, e.y, 1.6, (12 + 6 * (G.dg ? G.dg.n : 1)) * dh.fx * (G.p.dmgMul || 1), { burn: 3 }); vfxExplosion(e.x, e.y, 0.9); }
  const nec = eqLegend('nigromante'), rq = eqLegend('reina'), fang = eqLegend('colmillo'), ig = eqLegend('igneo');
  if (!e.def.boss) {
    const raise = (nec ? nec.fx : 0) + (nec && setCount('nigromante') >= 4 ? 0.2 : 0);
    if (raise && Math.random() < raise) raiseUndead(e.x, e.y);
    const sp = setCount('reina') >= 5 ? 1 : (rq ? rq.fx : 0) + (setCount('reina') >= 4 ? 0.2 : 0);
    if (sp && Math.random() < sp && G.allies.filter(a => a.type === 'spider' && !a.dead).length < 8) spawnAlly('spider', e.x, e.y);
  }
  if (fang) { G.p.stealth = Math.max(G.p.stealth, 2); healP(G.p.maxHp * fang.fx); }
  if (ig) healP(G.p.maxHp * ig.fx);
}
function fireRing(k) {
  const p = G.p;
  if ((G.guardCd || 0) > 0) return;
  G.guardCd = setCount('guardian') >= 4 ? 1.75 : 3.5;
  aoe(p.x, p.y, 2.6, (18 + 10 * (G.dg ? G.dg.n : 1)) * k * (p.dmgMul || 1), { burn: 2, kb: 7 }); vRing(p.x, p.y, 0.3, 2.6, 0.3, VR.fire.slice(0, 5), 36); Sfx.play('nova');
}
function nearestTo(x, y, r) { let best = null, bd = r; for (const e of G.enemies) { const q = Math.hypot(e.x - x, e.y - y); if (!e.dead && q < bd) { bd = q; best = e; } } return best; }
function equipOnHurt(d, sx, sy) {
  const ci = eqLegend('cth_amuleto'); if (ci && sx !== undefined && Math.random() < ci.fx) { const a = nearestTo(sx, sy, 2.4); if (a) applyFx(a, { stun: 1.6, slow: 2 }); }
  const ds = eqLegend('dra_armadura'); if (ds && sx !== undefined) { const a = nearestTo(sx, sy, 2.2); if (a) { applyFx(a, { burn: 3 }); damageEnemy(a, d * ds.fx, { silent: true }); } }
  const p = G.p, g = eqLegend('guardian');
  if (g) fireRing(g.fx);
  const cap = eqLegend('caparazon');
  if (cap && sx !== undefined) { const a = nearestTo(sx, sy, 2.2); if (a) { applyFx(a, { poison: 5 }); damageEnemy(a, d * cap.fx, { silent: true }); } }
  // Bastión completo: por debajo del 30% de vida, invulnerable 3 s cada 60 s
  if (setCount('guardian') >= 5 && p.hp - d < p.maxHp * 0.3 && (G.unbreakT || 0) <= 0) { G.unbreakT = 60; p.inv = 3; toast('¡INQUEBRANTABLE!', true); vfxDome('gold', 1); Sfx.play('level'); }
}
// al bloquear con el escudo un golpe frontal
function equipOnBlock(d, sx, sy) {
  const ls = eqLegend('lil_escudo'); if (ls && sx !== undefined) { const a = nearestTo(sx, sy, 2.4); if (a) applyFx(a, { stun: ls.fx }); }
  const cs = eqLegend('cth_escudo'); if (cs) { for (const e of G.enemies) if (!e.dead && Math.hypot(e.x - G.p.x, e.y - G.p.y) < 3) applyFx(e, { slow: cs.fx }); vRing(G.p.x, G.p.y, 0.1, 3, 0.4, VR.smoke.slice(0, 4), 28); }
  if (eqLegend('dra_escudo')) fireBreath(1);
  const p = G.p;
  if (eqSpecial('reflejo') && sx !== undefined) { const a = nearestTo(sx, sy, 2.2); if (a) damageEnemy(a, d * 0.4, { silent: true }); }
  const bone = eqLegend('nig_escudo'); if (bone) healP(p.maxHp * bone.fx);
  const web = eqLegend('reina_escudo'); if (web && sx !== undefined) { const a = nearestTo(sx, sy, 2.4); if (a) applyFx(a, { slow: web.fx, stun: 0.6 }); }
  if (eqLegend('guardian_escudo')) fireRing(1);
}
function equipOnDash() {
  const lw = eqLegend('lil_armadura'); if (lw) G.p.stealth = Math.max(G.p.stealth || 0, lw.fx);
  const m = eqLegend('manto');
  if (m) { aoe(G.p.x, G.p.y, 2, (14 + 6 * (G.dg ? G.dg.n : 1)) * m.fx * (G.p.dmgMul || 1), { kb: 5 }); vfxBlink(G.p.x, G.p.y, 'void'); }
}
function equipTick(dt) {
  if (eqLegend('cth_armadura')) { G.p.chill = 0; G.p.poisT = 0; }
  if (setCount('rlyeh') >= 5) { G.krakT = (G.krakT ?? 30) - dt; if (G.krakT <= 0) { G.krakT = 30; for (const e of G.enemies) if (!e.dead && canHit(e) && Math.hypot(e.x - G.p.x, e.y - G.p.y) < 5) tentacle(e.x, e.y, (30 + 10 * (G.dg ? G.dg.n : 1)) * (G.p.dmgMul || 1)); toast('¡EL DURMIENTE DESPIERTA!', false); } }
  if (setCount('dragon') >= 5) { G.roarT = (G.roarT ?? 25) - dt; if (G.roarT <= 0) { G.roarT = 25; const p = G.p; aoe(p.x, p.y, 4.5, (40 + 12 * (G.dg ? G.dg.n : 1)) * (p.dmgMul || 1), { burn: 4, kb: 8 }); vRing(p.x, p.y, 0.3, 4.5, 0.4, VR.fire.slice(0, 6), 44); G.shake = Math.max(G.shake, 0.5); Sfx.play('roar'); toast('¡RUGIDO DEL DRAGÓN!', false); } }
  G.guardCd = (G.guardCd || 0) - dt; G.unbreakT = (G.unbreakT || 0) - dt;
  const p = G.p;
  // orbes del vacío (anillo o set de 4)
  const eye = eqLegend('primigenio'), v4 = setCount('vacio') >= 4;
  if (eye || v4) {
    const per = (eye ? eye.fx : 3.5) / (v4 ? 2 : 1);
    G.eyeT = Math.min(G.eyeT === undefined ? per : G.eyeT, per) - dt;
    if (G.eyeT <= 0) {
      G.eyeT = per;
      const t = nearestEnemy(9, true);
      if (t) { const a = Math.atan2(t.y - p.y, t.x - p.x); for (let i = -1; i <= 1; i++) fireProj({ a: a + i * 0.12, spd: 9, dmg: 14 * (p.dmgMul || 1), spr: 'orbPurple', size: 0.3, pierce: 1, life: 1.4 }); Sfx.play('shoot'); }
    }
  }
  // mortaja: aura que ralentiza
  const mo = eqLegend('mortaja');
  if (mo) { G.auraT = (G.auraT || 0) - dt; if (G.auraT <= 0) { G.auraT = 0.3; for (const e of G.enemies) if (!e.dead && Math.hypot(e.x - p.x, e.y - p.y) < mo.fx) e.slow = Math.max(e.slow, 0.5); } }
  // Ajuar completo: dos siervos cada 20 s
  if (setCount('nigromante') >= 5) { G.raiseT = (G.raiseT === undefined ? 20 : G.raiseT) - dt; if (G.raiseT <= 0) { G.raiseT = 20; raiseUndead(p.x + 0.8, p.y); raiseUndead(p.x - 0.8, p.y); } }
}
// Égida y Espejo del vacío: bloqueando, los proyectiles enemigos rebotan
function equipReflect(pr) {
  const p = G.p;
  if (!(p.wantBlock && offhandOf(p) === 'shield' && (eqLegend('egida') || eqLegend('vacio_escudo')))) return false;
  pr.friendly = true; pr.vx = -pr.vx; pr.vy = -pr.vy; pr.hit = new Set(); pr.pierce = 1; pr.life = 1.5; pr.dmg *= 1.5;
  return true;
}
// Filacteria: vuelve a la vida una vez por mazmorra
function phylactery() {
  const f = eqLegend('filacteria'); if (!f || G.phylUsed) return false;
  const p = G.p; G.phylUsed = true; p.hp = p.maxHp * f.fx; p.inv = 2.5; G.flashFx = 1;
  raiseUndead(p.x + 0.8, p.y); raiseUndead(p.x - 0.8, p.y);
  Sfx.play('portal'); toast('¡LA FILACTERIA TE DEVUELVE A LA VIDA!', true);
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
function weaponSprite(type, base, tag = '') {
  const it = G.equip && G.equip.arma, wt = type === 'daggers' ? 'dagger' : type;
  if (!it || it.wtype !== wt || !RAR_TINT[it.rar]) return base;
  G.wskin = G.wskin || {};
  const key = type + tag + (base === SPR.daggerL ? 'L' : '') + it.rar;
  return G.wskin[key] || (G.wskin[key] = tintSprite(base, RAR_TINT[it.rar][0], RAR_TINT[it.rar][1]));
}
function shieldSprite() {
  const it = G.equip && G.equip.escudo;
  if (!it || !RAR_TINT[it.rar]) return SPR.shield;
  G.wskin = G.wskin || {};
  return G.wskin['shield' + it.rar] || (G.wskin['shield' + it.rar] = tintSprite(SPR.shield, RAR_TINT[it.rar][0], RAR_TINT[it.rar][1]));
}
