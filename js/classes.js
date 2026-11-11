// Árbol de clases: 3 base (nv 1) -> 6 avanzadas (nv 20) -> 12 subclases (nv 40)
// Cada clase define su kit: armas (slots 1-3), habilidades activas (R, C, V), modificadores y pasivas.

// ---------------------------------------------------------------- Hechizos del bastón
// proj: sprite del proyectil; fx: efecto al impactar (burn, slow, poison, corrode, chain, drain, heal)
const SPELLS = {
  arcane: { name: 'Arcano',     proj: 'orbBlue',   dmg: 18, cd: 0.40, col: [90, 160, 255] },
  fire:   { name: 'Fuego',      proj: 'orbRed',    dmg: 17, cd: 0.42, col: [255, 120, 40],  fx: { burn: 3 } },
  ice:    { name: 'Hielo',      proj: 'orbIce',    dmg: 15, cd: 0.40, col: [160, 230, 255], fx: { slow: 2.4 } },
  bolt:   { name: 'Rayo',       proj: 'orbGold',   dmg: 15, cd: 0.38, col: [255, 230, 120], fx: { chain: 2 } },
  nature: { name: 'Naturaleza', proj: 'orbGreen',  dmg: 15, cd: 0.40, col: [110, 230, 120], fx: { poison: 4 } },
  plague: { name: 'Plaga',      proj: 'orbGreen',  dmg: 14, cd: 0.36, col: [170, 220, 60],  fx: { poison: 5, corrode: 4 } },
  dark:   { name: 'Sombra',     proj: 'orbPurple', dmg: 19, cd: 0.42, col: [190, 90, 255],  fx: { drain: 0.22 } },
  holy:   { name: 'Luz',        proj: 'orbGold',   dmg: 18, cd: 0.40, col: [255, 235, 150], fx: { heal: 1.5 } },
};
const ELEMENTS = ['fire', 'ice', 'bolt'];
const ELEMENT_NAME = { fire: 'FUEGO', ice: 'HIELO', bolt: 'RAYO' };

// ---------------------------------------------------------------- Armas
// hands: 1 = una mano (permite antorcha/escudo), 2 = dos manos, 'dual' = una en cada mano, 'bow', 'claws'
const WEAPONS = {
  staff:      { name: 'Bastón',  kind: 'cast',  hands: 1 },
  sword:      { name: 'Espada',  kind: 'melee', hands: 1, dmg: 30, range: 1.75, arc: 2.0, cd: 0.50, dur: 0.28, kb: 6 },
  greatsword: { name: 'Espadón', kind: 'melee', hands: 2, dmg: 72, range: 2.5,  arc: 2.8, cd: 1.00, dur: 0.50, kb: 11 },
  dagger:     { name: 'Daga',    kind: 'melee', hands: 1, dmg: 16, range: 1.4,  arc: 1.6, cd: 0.26, dur: 0.16, kb: 2 },
  daggers:    { name: 'Dagas gemelas', kind: 'melee', hands: 'dual', dmg: 14, range: 1.45, arc: 1.8, cd: 0.17, dur: 0.12, kb: 1.5 },
  bow:        { name: 'Arco',    kind: 'shoot', hands: 'bow', cd: 0.5, dmg: 24 },
  claws:      { name: 'Garras',  kind: 'melee', hands: 'claws', dmg: 22, range: 1.55, arc: 2.0, cd: 0.30, dur: 0.18, kb: 4 },
};

// Ritmo de ataque base: un 25% más lento que el original (deja margen a Prisa, equipo y buffs de velocidad).
// El daño por golpe sube en la misma proporción, así que el daño por segundo no cambia.
const ATK_SLOW = 4 / 3;
for (const t of [WEAPONS, SPELLS]) for (const k in t) if (t[k].cd) { t[k].cd = Math.round(t[k].cd * ATK_SLOW * 1000) / 1000; t[k].dmg = Math.round(t[k].dmg * ATK_SLOW * 10) / 10; }

// ---------------------------------------------------------------- Aliados invocables
const ALLIES = {
  wolf:   { name: 'Lobo',     hp: 70,  dmg: 13, spd: 4.4, r: 0.3,  h: 0.6,  cd: 0.6, spr: 'wolf' },
  bear:   { name: 'Oso',      hp: 260, dmg: 30, spd: 2.7, r: 0.45, h: 1.05, cd: 1.0, spr: 'bear' },
  spider: { name: 'Araña',    hp: 40,  dmg: 11, spd: 3.8, r: 0.28, h: 0.55, cd: 0.55, spr: 'spider', life: 16, poison: 3 },
  shadow: { name: 'Sombra',   hp: 55,  dmg: 17, spd: 4.0, r: 0.28, h: 0.95, cd: 0.45, spr: 'shadow', life: 12 },
  undead: { name: 'Siervo no muerto', hp: 60, dmg: 14, spd: 2.8, r: 0.3, h: 0.95, cd: 0.7, spr: 'skeleton', life: 30 },
  fiend:  { name: 'Demonio',  hp: 110, dmg: 24, spd: 3.3, r: 0.32, h: 0.9,  cd: 0.8, spr: 'fiend', life: 22 },
};

// ---------------------------------------------------------------- Clases
// mods: hp, dmg, spd, rate, armor (multiplican; armor<1 = menos daño recibido), crit, leech (suman)
// pas: pasivas (backstab, dashStealth, rageHp, allyDmg, element, cdr, arcana, vision...)
const CLASSES = {
  // ------------------------------------------------ nivel 1
  ladron: {
    tier: 1, name: 'Ladrón', tag: 'Rápido, frágil y letal',
    desc: 'Daga veloz y críticos altos. Lanza cuchillos y se esconde tras una bomba de humo. Atacar desde el sigilo hace el doble de daño.',
    slots: [{ w: 'dagger' }], skills: ['knives', 'smoke', 'poisonblade', 'caltrops'],
    mods: { hp: 0.85, spd: 1.15, rate: 1.1, crit: 0.12 }, pas: { backstab: 2, vision: 0.55 },
    next: 20, to: ['asesino', 'arquero'],
  },
  luchador: {
    tier: 1, name: 'Luchador', tag: 'Aguanta y golpea fuerte',
    desc: 'Mucha vida y armadura. Espada con escudo o espadón a dos manos. Grito de guerra y golpe de escudo.',
    slots: [{ w: 'sword' }, { w: 'greatsword' }], skills: ['warcry', 'shieldbash', 'charge', 'ironskin'],
    mods: { hp: 1.3, dmg: 1.1, armor: 0.9 }, pas: {},
    next: 20, to: ['paladin', 'guerrero'],
  },
  mago: {
    tier: 1, name: 'Mago', tag: 'Hechizos devastadores',
    desc: 'Proyectiles arcanos a distancia, bola de fuego y nova de escarcha. Frágil si te alcanzan.',
    slots: [{ w: 'staff', spell: 'arcane' }], skills: ['fireball', 'frostnova', 'arcanebolt', 'blink'],
    mods: { hp: 0.8, dmg: 1.1 }, pas: {},
    next: 20, to: ['druida', 'hechicero'],
  },

  // ------------------------------------------------ nivel 20: avanzadas
  asesino: {
    tier: 2, from: 'ladron', name: 'Asesino', tag: 'Sombra mortal',
    desc: 'Maestro del sigilo: aparece a la espalda de sus víctimas y los golpes desde las sombras causan el triple de daño.',
    slots: [{ w: 'dagger' }], skills: ['shadowstep', 'knives', 'vanish', 'deathmark', 'garrote'],
    mods: { spd: 1.08, dmg: 1.15, crit: 0.1 }, pas: { backstab: 3, vision: 0.65 },
    next: 40, to: ['hoja_oscura', 'duelista'],
  },
  arquero: {
    tier: 2, from: 'ladron', name: 'Arquero', tag: 'Distancia y trampas',
    desc: 'Arco de largo alcance, lluvia de flechas y trampas de acero. Prefiere la distancia al cuerpo a cuerpo.',
    slots: [{ w: 'bow' }], skills: ['piercing', 'caltrops', 'trap', 'hawkeye', 'volley'],
    mods: { dmg: 1.15, crit: 0.08 }, pas: { vision: 0.65 },
    next: 40, to: ['domador', 'arquero_magico'],
  },
  paladin: {
    tier: 2, from: 'luchador', name: 'Paladín', tag: 'Guardián sagrado',
    desc: 'Armadura bendita, espada y escudo. Su luz sagrada cura y su escudo divino lo vuelve invulnerable un instante.',
    slots: [{ w: 'sword' }], skills: ['holynova', 'shieldbash', 'consecrate', 'hammer', 'divine'],
    mods: { hp: 1.25, armor: 0.85, dmg: 1.1 }, pas: {},
    next: 40, to: ['heraldo', 'hereje'],
  },
  guerrero: {
    tier: 2, from: 'luchador', name: 'Guerrero', tag: 'Maestro de armas',
    desc: 'Fuerza bruta con espada o espadón. Torbellino de acero y grito de guerra para despejar el campo.',
    slots: [{ w: 'sword' }, { w: 'greatsword' }], skills: ['cleave', 'warcry', 'charge', 'bloodlust', 'whirlwind'],
    mods: { hp: 1.2, dmg: 1.25 }, pas: {},
    next: 40, to: ['campeon', 'berserker'],
  },
  druida: {
    tier: 2, from: 'mago', name: 'Druida', tag: 'Voz de la naturaleza',
    desc: 'Magia natural: espinas venenosas, zarzas que atrapan y regeneración.',
    slots: [{ w: 'staff', spell: 'nature' }], skills: ['thorns', 'frostnova', 'regrowth', 'moonbeam', 'entangle'],
    mods: { hp: 1.2, dmg: 1.1 }, pas: {},
    next: 40, to: ['cambiaformas', 'azote'],
  },
  hechicero: {
    tier: 2, from: 'mago', name: 'Hechicero', tag: 'Poder arcano',
    desc: 'Domina fuego e hielo a voluntad y encadena rayos entre sus enemigos.',
    slots: [{ w: 'staff', spell: 'fire' }, { w: 'staff', spell: 'ice' }], skills: ['icelance', 'fireball', 'frostnova', 'firewall', 'chain'],
    mods: { dmg: 1.2, rate: 1.1 }, pas: {},
    next: 40, to: ['archimago', 'caballero_magico'],
  },

  // ------------------------------------------------ nivel 40: subclases finales
  hoja_oscura: {
    tier: 3, from: 'asesino', name: 'Hoja Oscura', tag: 'Ninja de las sombras',
    desc: 'Ninja que canaliza magia de sombras: clones de sombra, estallidos oscuros y cada esquiva lo oculta. Ve en la oscuridad.',
    slots: [{ w: 'dagger' }], skills: ['nightblades', 'shadowstep', 'clones', 'shadowburst', 'soulreap', 'eclipse'],
    mods: { spd: 1.15, dmg: 1.2 }, pas: { backstab: 3, dashStealth: 1.6, vision: 0.9, shadowHit: true },
  },
  duelista: {
    tier: 3, from: 'asesino', name: 'Duelista', tag: 'Dos hojas a la velocidad del rayo',
    desc: 'Abandona el sigilo: blande dos armas a una velocidad vertiginosa. Ráfaga de estocadas y parada con réplica.',
    slots: [{ w: 'daggers' }], skills: ['lunge', 'shadowstep', 'riposte', 'bladedance', 'execute', 'flurry'],
    mods: { rate: 1.35, dmg: 1.2, spd: 1.12, crit: 0.1 }, pas: { backstab: 0, vision: 0.55 },
  },
  domador: {
    tier: 3, from: 'arquero', name: 'Domador de bestias', tag: 'Manada y trampas',
    desc: 'Doma bestias que luchan a su lado: lobos y un oso. Completa su arsenal con trampas de acero y arco.',
    slots: [{ w: 'bow' }], skills: ['callwolf', 'trap', 'netshot', 'packrage', 'beastroar', 'callbear'],
    mods: { hp: 1.15, dmg: 1.1 }, pas: { allyDmg: 1.3, vision: 0.7 },
  },
  arquero_magico: {
    tier: 3, from: 'arquero', name: 'Arquero mágico', tag: 'Flechas elementales',
    desc: 'Imbuye sus flechas con fuego, hielo o rayo y se potencia a sí mismo con magia.',
    slots: [{ w: 'bow' }], skills: ['imbue', 'phasearrow', 'selfbuff', 'runicarrow', 'arcvolley', 'starfall'],
    mods: { dmg: 1.25, rate: 1.15 }, pas: { element: 'fire', vision: 0.85 },
  },
  heraldo: {
    tier: 3, from: 'paladin', name: 'Heraldo', tag: 'Portador del poder de los dioses',
    desc: 'Canaliza el poder divino: castiga con rayos sagrados, sus golpes curan y su aura bendice todo a su alrededor.',
    slots: [{ w: 'sword' }, { w: 'staff', spell: 'holy' }], skills: ['smite', 'divine', 'aura', 'guardian', 'sanctuary', 'judgment'],
    mods: { hp: 1.2, dmg: 1.25, armor: 0.85 }, pas: { vision: 1.0, holyHit: true },
  },
  hereje: {
    tier: 3, from: 'paladin', name: 'Hereje', tag: 'Magia negra y dioses oscuros',
    desc: 'Abandona sus juramentos por la magia negra: pacto de sangre, demonios invocados y drenaje de vida.',
    slots: [{ w: 'sword' }, { w: 'staff', spell: 'dark' }], skills: ['bloodpact', 'drain', 'fiend', 'curse', 'soulsiphon', 'hellfire'],
    mods: { dmg: 1.3, hp: 1.1, leech: 0.06 }, pas: {},
  },
  campeon: {
    tier: 3, from: 'guerrero', name: 'Campeón', tag: 'Armadura pesada y mil armas',
    desc: 'Domina espada, espadón y daga bajo armadura pesada. Golpe de escudo aturdidor y estandarte que inspira.',
    slots: [{ w: 'sword' }, { w: 'greatsword' }, { w: 'dagger' }], skills: ['heroic', 'warcry', 'shieldbash', 'rally', 'bulwark', 'earthshatter'],
    mods: { hp: 1.45, armor: 0.62, dmg: 1.25 }, pas: {},
  },
  berserker: {
    tier: 3, from: 'guerrero', name: 'Berserker', tag: 'Golpes devastadores a dos manos',
    desc: 'Cuanta menos vida, más daño. Furia desatada y saltos sísmicos con su espadón gigante.',
    slots: [{ w: 'greatsword' }], skills: ['rage', 'whirlwind', 'leap', 'frenzy', 'deathwish', 'bloodstorm'],
    mods: { hp: 1.4, dmg: 1.3, spd: 1.1 }, pas: { rageHp: 0.9, vision: 0.55 },
  },
  cambiaformas: {
    tier: 3, from: 'druida', name: 'Cambiaformas', tag: 'Lobo, oso y druida',
    desc: 'No solo usa magia natural: se transforma a voluntad en lobo veloz o en oso colosal.',
    slots: [{ w: 'staff', spell: 'nature' }], skills: ['shapeshift', 'formskill', 'thorns', 'feralpounce', 'primal', 'stampede'],
    mods: { hp: 1.25, dmg: 1.15 }, pas: { vision: 0.85 },
  },
  azote: {
    tier: 3, from: 'druida', name: 'Azote', tag: 'Plagas, ácidos y pesadillas',
    desc: 'Druida oscuro: nubes de plaga, ácido que corroe y enjambres de arácnidos de pesadilla.',
    slots: [{ w: 'staff', spell: 'plague' }], skills: ['plague', 'rot', 'acid', 'swarm', 'locust', 'pestilence'],
    mods: { dmg: 1.3 }, pas: {},
  },
  archimago: {
    tier: 3, from: 'hechicero', name: 'Archimago', tag: 'Domina toda la magia',
    desc: 'El mago más poderoso: fuego, hielo y rayo a su alcance, meteoros, nova arcana y las tres magias pasivas desde el principio.',
    slots: [{ w: 'staff', spell: 'fire' }, { w: 'staff', spell: 'ice' }, { w: 'staff', spell: 'bolt' }], skills: ['arcnova', 'chain', 'blizzard', 'singularity', 'timestop', 'meteor'],
    mods: { dmg: 1.4, rate: 1.2 }, pas: { cdr: 0.7, arcana: true },
  },
  caballero_magico: {
    tier: 3, from: 'hechicero', name: 'Caballero mágico', tag: 'Acero encantado',
    desc: 'Mago con armadura pesada: encanta su arma con rapidez y poder, lanza tajos de energía y se envuelve en escudos arcanos.',
    slots: [{ w: 'sword' }, { w: 'greatsword' }], skills: ['energyslash', 'arcaneArmor', 'enchant', 'arcanecharge', 'mirrorward', 'spellblade'],
    mods: { hp: 1.4, armor: 0.7, dmg: 1.25 }, pas: {},
  },
};
const BASE_CLASSES = ['ladron', 'luchador', 'mago'];
const SKILL_KEYS = ['KeyR', 'KeyC', 'KeyV'];
const SKILL_LABEL = ['R', 'C', 'V'];

function lineageOf(id) {
  const out = [];
  for (let c = id; c; c = CLASSES[c].from) out.unshift(c);
  return out;
}
// Combina los modificadores de toda la línea de evolución
function classMods(id) {
  const m = { hp: 1, dmg: 1, spd: 1, rate: 1, armor: 1, crit: 0, leech: 0 };
  for (const c of lineageOf(id)) {
    const k = CLASSES[c].mods || {};
    for (const key of ['hp', 'dmg', 'spd', 'rate', 'armor']) if (k[key]) m[key] *= k[key];
    for (const key of ['crit', 'leech']) if (k[key]) m[key] += k[key];
  }
  return m;
}
function classPassive(id, key, def) {
  const l = lineageOf(id);
  for (let i = l.length - 1; i >= 0; i--) {
    const v = (CLASSES[l[i]].pas || {})[key];
    if (v !== undefined) return v;
  }
  return def;
}
