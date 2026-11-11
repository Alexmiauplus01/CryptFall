// Idiomas: español (original) e inglés. Dos capas:
//  1) datos del juego (clases, habilidades, armas, enemigos, objetos...): se sustituyen sus nombres al cambiar de idioma
//  2) textos de pantalla: se traducen justo antes de dibujarse (drawText / wrapText) con un diccionario y patrones
const LANGS = ['es', 'en'];
let LANG = 'es';

// ---------------------------------------------------------------- 1) datos
const EN_DATA = {
  classes: {
    ladron: ['Thief', 'Fast, fragile and deadly', 'Swift dagger and high crits. Throws knives and hides behind a smoke bomb. Attacking from stealth deals double damage.'],
    luchador: ['Fighter', 'Endures and hits hard', 'Lots of health and armor. Sword and shield or a two-handed greatsword. War cry and shield bash.'],
    mago: ['Mage', 'Devastating spells', 'Ranged arcane bolts, fireball and frost nova. Fragile if they reach you.'],
    asesino: ['Assassin', 'Deadly shadow', 'Master of stealth: appears behind its victims and strikes from the shadows deal triple damage.'],
    arquero: ['Archer', 'Range and traps', 'Long-range bow, rain of arrows and steel traps. Prefers distance to close combat.'],
    paladin: ['Paladin', 'Holy guardian', 'Blessed armor, sword and shield. Its holy light heals and its divine shield makes it invulnerable for a moment.'],
    guerrero: ['Warrior', 'Weapon master', 'Brute force with sword or greatsword. Steel whirlwind and war cry to clear the field.'],
    druida: ['Druid', 'Voice of nature', 'Nature magic: poisonous thorns, entangling brambles and regeneration.'],
    hechicero: ['Sorcerer', 'Arcane power', 'Commands fire and ice at will and chains lightning between its enemies.'],
    hoja_oscura: ['Dark Blade', 'Shadow ninja', 'A ninja who channels shadow magic: shadow clones, dark bursts, and every dodge hides it. Sees in the dark.'],
    duelista: ['Duelist', 'Two blades as fast as lightning', 'Leaves stealth behind: wields two weapons at dizzying speed. Flurry of thrusts and parry with riposte.'],
    domador: ['Beastmaster', 'Pack and traps', 'Tames beasts that fight at its side: wolves and a bear. Completes its arsenal with steel traps and a bow.'],
    arquero_magico: ['Arcane Archer', 'Elemental arrows', 'Imbues its arrows with fire, ice or lightning and empowers itself with magic.'],
    heraldo: ['Herald', 'Bearer of the power of the gods', 'Channels divine power: smites with holy lightning, its blows heal and its aura blesses everything around it.'],
    hereje: ['Heretic', 'Black magic and dark gods', 'Forsakes its oaths for black magic: blood pact, summoned demons and life drain.'],
    campeon: ['Champion', 'Heavy armor and a thousand weapons', 'Masters sword, greatsword and dagger under heavy armor. Stunning shield bash and an inspiring banner.'],
    berserker: ['Berserker', 'Devastating two-handed blows', 'The less health, the more damage. Unleashed fury and seismic leaps with its giant greatsword.'],
    cambiaformas: ['Shapeshifter', 'Wolf, bear and druid', 'Not just nature magic: it transforms at will into a swift wolf or a colossal bear.'],
    azote: ['Scourge', 'Plagues, acids and nightmares', 'Dark druid: plague clouds, corroding acid and swarms of nightmare arachnids.'],
    archimago: ['Archmage', 'Masters all magic', 'The most powerful mage: fire, ice and lightning at hand, meteors, arcane nova and all three passive magics from the start.'],
    caballero_magico: ['Spellblade', 'Enchanted steel', 'A mage in heavy armor: enchants its weapon with speed and power, casts energy slashes and wraps itself in arcane shields.'],
  },
  skills: { knives: 'Knives', smoke: 'Smoke bomb', warcry: 'War cry', shieldbash: 'Shield bash', whirlwind: 'Whirlwind', rally: 'Banner', rage: 'Fury', leap: 'Seismic leap', fireball: 'Fireball', frostnova: 'Frost nova', chain: 'Chain lightning', meteor: 'Meteor', arcnova: 'Arcane nova', enchant: 'Enchant weapon', energyslash: 'Energy slash', arcaneArmor: 'Arcane armor', shadowstep: 'Shadow step', vanish: 'Stealth', clones: 'Shadow clones', shadowburst: 'Shadow burst', flurry: 'Flurry of thrusts', riposte: 'Parry and riposte', volley: 'Rain of arrows', trap: 'Steel trap', callwolf: 'Call wolf', callbear: 'Call bear', imbue: 'Imbue arrows', arcvolley: 'Arcane volley', selfbuff: 'Self-imbue', holynova: 'Holy light', divine: 'Divine shield', smite: 'Divine judgment', aura: 'Holy aura', bloodpact: 'Blood pact', fiend: 'Summon demon', drain: 'Drain life', thorns: 'Brambles', regrowth: 'Regrowth', shapeshift: 'Change form', formskill: 'Form ability', plague: 'Plague cloud', swarm: 'Nightmare swarm', acid: 'Corrosive acid', poisonblade: "Venom blade", caltrops: "Caltrops", charge: "Charge", ironskin: "Iron skin", arcanebolt: "Arcane bolt", blink: "Blink", deathmark: "Death mark", garrote: "Throat slit", piercing: "Piercing shot", hawkeye: "Hawk eye", consecrate: "Consecrate", hammer: "Hammer of light", cleave: "Brutal cleave", bloodlust: "Bloodlust", entangle: "Roots", moonbeam: "Moonbeam", icelance: "Ice lance", firewall: "Wall of fire", nightblades: "Night blades", eclipse: "Eclipse", soulreap: "Soul reap", lunge: "Lightning lunge", bladedance: "Steel dance", execute: "Coup de grace", packrage: "Pack fury", beastroar: "Beast roar", netshot: "Net", starfall: "Starfall", runicarrow: "Runic arrow", phasearrow: "Spectral arrow", judgment: "Sentence", guardian: "Guardian angel", sanctuary: "Sanctuary", hellfire: "Hellfire", curse: "Curse", soulsiphon: "Soul siphon", earthshatter: "Earthshatter", bulwark: "Bulwark", heroic: "Heroic strike", frenzy: "Frenzy", bloodstorm: "Blood storm", deathwish: "Death wish", feralpounce: "Pounce", stampede: "Stampede", primal: "Primal instinct", pestilence: "Pestilence", locust: "Locust plague", rot: "Rot", timestop: "Stop time", blizzard: "Blizzard", singularity: "Singularity", spellblade: "Spellblade", arcanecharge: "Arcane charge", mirrorward: "Mirror aegis" },
  skillDesc: {
    knives: "Throws three knives in a fan that pierce one enemy.",
    smoke: "Smoke bomb: you turn invisible for 3.5 s; your next hit from the shadows deals more damage.",
    warcry: "Pushes back nearby enemies and gives you +25% damage for 8 s.",
    shieldbash: "With a shield in hand: your shield thrusts forward, damaging, knocking back and stunning the enemies in front.",
    whirlwind: "You spin your weapon five times, damaging and pushing everything around you.",
    rally: "Banner: +20% damage, -25% damage taken for 10 s and heals you 10%.",
    rage: "Fury: +40% damage, +25% speed, +20% attack speed and 12% life steal for 10 s.",
    leap: "You leap forward and slam down, knocking back and stunning in a large area.",
    fireball: "A fireball that explodes in an area and burns.",
    frostnova: "A frost wave around you that damages, pushes and slows.",
    chain: "Lightning that jumps between up to six enemies.",
    meteor: "Marks the ground and a meteor falls a moment later: huge area damage and burns.",
    arcnova: "A huge arcane wave that damages, pushes and slows in a wide radius.",
    enchant: "Enchanted weapon: +30% damage and +20% attack speed for 12 s; your blows launch magic projectiles.",
    energyslash: "An energy slash that travels forward, piercing up to five enemies and slowing them.",
    arcaneArmor: "An arcane shield that absorbs damage for 10 s.",
    shadowstep: "You appear behind the nearest enemy and hide for a moment.",
    vanish: "Total stealth for 5 s.",
    clones: "Summons two allied shadows that fight at your side.",
    shadowburst: "Opens a black hole in front of you that pulls, damages and slows.",
    flurry: "You leap onto the nearest enemy and strike nine times while almost invulnerable.",
    riposte: "Parry: the next blow you take is cancelled and you counterattack in an area.",
    volley: "A rain of nine arrows in a fan.",
    trap: "Places a steel trap that damages and stuns the first enemy to step on it.",
    callwolf: "Calls an allied wolf (up to three).",
    callbear: "Calls a very tough allied bear.",
    imbue: "Changes the element of your arrows: fire, ice or lightning.",
    arcvolley: "An arcane volley of seven piercing magic arrows.",
    selfbuff: "Self-imbue: +30% damage, +25% attack speed and +10% speed for 9 s.",
    holynova: "Holy light that damages and pushes around you and heals you 20%.",
    divine: "Divine shield: invulnerable for 2.5 s.",
    smite: "Pillars of light fall on up to five enemies in sight.",
    aura: "Holy aura: +25% damage, regeneration and -15% damage taken for 8 s.",
    bloodpact: "You sacrifice 20% of your health for +60% damage and 15% life steal for 10 s.",
    fiend: "Summons an allied demon.",
    drain: "Drains the life of up to three nearby enemies and heals you.",
    thorns: "A field of brambles that damages, slows and poisons.",
    regrowth: "Regeneration for 6 s and a small instant heal.",
    shapeshift: "You change form: human, wolf (swift) or bear (tough and brutal).",
    formskill: "Wolf: a howl that stuns and speeds you up. Bear: a stomp that stuns. Human: regeneration.",
    plague: "A plague cloud that poisons, slows and corrodes armor.",
    swarm: "Summons three allied nightmare spiders.",
    acid: "A cone of acid that poisons and corrodes.",
    poisonblade: "Venom blade: for 8 s your blows poison and deal 10% more damage.",
    caltrops: "Scatters caltrops at your feet: they damage and slow whoever steps on them for 6 s.",
    charge: "Charge: you rush 4.5 m, trampling, knocking back and stunning everything you catch.",
    ironskin: "Iron skin: -40% damage taken for 6 s and heals you 8%.",
    arcanebolt: "A fast, cheap arcane bolt that pierces two enemies.",
    blink: "Blink: you teleport 5 m forward and leave a frost wave where you stood.",
    deathmark: "Marks the nearest enemy: it takes 50% more damage for 8 s.",
    garrote: "Slits the throat of the enemy next to you and stuns it; from stealth it deals x2.5.",
    piercing: "A piercing arrow that goes through up to six enemies and slows them.",
    hawkeye: "Hawk eye: +25% crit and +15% attack speed for 10 s.",
    consecrate: "Consecrates the ground around you: damages and slows enemies for 6 s.",
    hammer: "Throws a hammer of light that stuns the first enemy it hits.",
    cleave: "A brutal cleave in a huge arc in front of you that knocks back.",
    bloodlust: "Bloodlust: +30% damage and 10% life steal for 8 s.",
    entangle: "Roots: they trap (stun) and poison everything nearby.",
    moonbeam: "A moonbeam falls on the nearest enemy: area damage and slows it.",
    icelance: "An ice lance that pierces three enemies and nearly freezes them.",
    firewall: "Raises a wall of fire in front of you that burns for 6 s.",
    nightblades: "Ten shadow blades fly out in a circle around you.",
    eclipse: "Eclipse: stuns and slows all nearby enemies and hides you for 4 s.",
    soulreap: "Soul reap: takes 15% of nearby enemies' health (4% from bosses); each kill heals you.",
    lunge: "Lightning lunge: you pierce through 5 m at once, wounding everything you cross.",
    bladedance: "Steel dance: +50% attack speed and +20% speed for 6 s, and you dodge the first moment.",
    execute: "Coup de grace: finishes off an enemy below 35% health; otherwise a big critical hit.",
    packrage: "Pack fury: your allies heal 40% and hit 50% harder for 10 s.",
    beastroar: "A beast roar that stuns and pushes enemies and heals your allies 30%.",
    netshot: "Fires a net that bursts and leaves enemies trapped (stunned).",
    starfall: "Starfall: seven stars fall on and around the nearest enemy.",
    runicarrow: "A runic arrow that explodes with your arrows' current element.",
    phasearrow: "A spectral arrow that passes through every enemy it meets.",
    judgment: "Sentence: a great holy explosion around you that stuns and knocks back.",
    guardian: "Guardian angel: -30% damage taken and strong regeneration for 10 s.",
    sanctuary: "Sanctuary: holy ground that damages enemies; inside it you take 70% less damage.",
    hellfire: "A cone of hellfire that burns fiercely.",
    curse: "Curse: nearby enemies take +50% damage and deal 30% less for 8 s.",
    soulsiphon: "Soul siphon: drains life from every nearby enemy and heals you.",
    earthshatter: "Earthshatter: a crack runs ahead of you, stunning and knocking back.",
    bulwark: "Bulwark: -55% damage taken for 6 s and you return the first blow you receive.",
    heroic: "Heroic strike: a crushing blow in front of you.",
    frenzy: "Frenzy: +35% attack speed and +15% damage for 10 s.",
    bloodstorm: "Blood storm: six spins that damage around you and heal you for each enemy hit.",
    deathwish: "Death wish: you lose 30% of your health for +80% damage for 8 s.",
    feralpounce: "You pounce on the nearest enemy, stun it and damage the area.",
    stampede: "Stampede: three wild wolves come out to fight for 12 s.",
    primal: "Primal instinct: +30% speed and damage, and regeneration for 8 s.",
    pestilence: "Pestilence: every poisoned enemy nearby bursts into a cloud of poison and acid.",
    locust: "Locust plague: a large cloud that slows and poisons for 6 s.",
    rot: "A projectile of rot that poisons, corrodes and slows.",
    timestop: "Stop time: nearby enemies are frozen for 3 s (bosses, 1 s).",
    blizzard: "A blizzard over the nearest enemy: damages and slows for 6 s.",
    singularity: "Singularity: pulls enemies towards a point and then explodes.",
    spellblade: "Spellblade: three energy slashes in a fan that pierce.",
    arcanecharge: "Arcane charge: you rush forward and explode when you arrive.",
    mirrorward: "Mirror aegis: -30% damage taken and you return double the damage you receive for 5 s.",
  },
  spells: { arcane: 'Arcane', fire: 'Fire', ice: 'Ice', bolt: 'Lightning', nature: 'Nature', plague: 'Plague', dark: 'Shadow', holy: 'Light' },
  weapons: { staff: 'Staff', sword: 'Sword', greatsword: 'Greatsword', dagger: 'Dagger', daggers: 'Twin daggers', bow: 'Bow', claws: 'Claws' },
  allies: { wolf: 'Wolf', bear: 'Bear', spider: 'Spider', shadow: 'Shadow', fiend: 'Demon' },
  enemies: { skeleton: 'Skeleton', bat: 'Bat', slime: 'Slime', wraith: 'Wraith', imp: 'Imp', ghost: 'Ghost', zombie: 'Ghoul', cultist: 'Acolyte', spider: 'Spider', shaman: 'Shaman', cowwarrior: 'Warrior cow', cowmage: 'Mage cow', cowking: 'THE COW KING', wolfE: 'Hungry wolf', bearE: 'Cave bear', hound: 'Hellhound', eye: 'Void eye', yeti: 'Yeti', icewisp: 'Frost wisp', rat: 'Mutant rat', deepwarrior: 'Deep warrior', deepmage: 'Deep sorcerer', vampspawn: 'Vampire spawn', vampire: 'Vampire noble', vampbat: 'Vampire bat', necromancer: 'Necromancer', fury: 'Fury', malevolent: 'Malevolent specter', goblin: 'Goblin', goblinarcher: 'Goblin archer', orc: 'Orc', harpy: 'Harpy', worm: 'Giant worm', lilith: 'LILITH', cthulhu: 'CTHULHU', dragon: 'THE RED DRAGON', lich: 'THE LICH', queen: 'THE SPIDER QUEEN', voidlord: 'THE PRIMORDIAL EYE', boss: 'THE GUARDIAN' },
  upg: {
    might: ['Arcane Power', '+20% damage (attacks, skills and summons)'], haste: ['Haste', '+15% casting speed'], multi: ['Multishot', '+1 projectile per cast'],
    pierce: ['Piercing', 'Spells pierce +1 more enemy'], speed: ['Light Feet', '+10% movement speed'], vit: ['Vitality', '+30 max health and healing'],
    regen: ['Regeneration', '+0.6 health per second'], magnet: ['Soul Magnet', '+50% pickup radius'], wis: ['Wisdom', '+15% experience gained'],
    crit: ['Critical Strike', '+8% crit chance (x2 damage)'], light: ['Eternal Light', '+25% torch range'], dash: ['Shadow Step', (l) => l === 0 ? 'Store 2 dodges to chain them' : l === 2 ? 'Store 3 dodges (the maximum)' : 'Dodge recharges 20% faster'],
    blades: ['Orbiting Blades', ['Blades spin around you and cut', '+1 blade and more damage']], nova: ['Frost Nova', ['Periodic icy wave that damages and slows', 'More damage, radius and frequency']],
    bolt: ['Storm', ['Lightning strikes nearby enemies', '+1 bolt, more damage and frequency']],
    wisp: ['Mage Light', (l) => l === 0 ? 'A sphere of light floats ahead of you and lights the way' : l < 2 ? 'More light; at level 3 it scorches whatever it touches' : 'More light and it scorches harder'],
    spirit: ['Guardian Spirit', ['Every 12 s a shield surrounds you and absorbs damage', 'Stronger shield, more often']],
    thornaura: ['Thorn Aura', ['Hurts enemies next to you and returns part of the damage', 'More damage and more damage returned']],
    flametrail: ['Flame Trail', ['Moving leaves a trail of fire that burns', 'Longer flames that burn more']],
    familiar: ['Arcane Familiar', ['A familiar floats at your side and shoots enemies', 'Shoots more often and harder']],
  },
  themes: ['The Crypt', 'The Catacombs', 'Infernal Pit', 'The Void', 'The Frozen Caves', 'The Sewers', 'The Sunken Temple', 'The Cursed Meadow'],
  elements: { fire: 'FIRE', ice: 'ICE', bolt: 'LIGHTNING' },
  keys: [['Iron key', 'iron lock'], ['Bone key', 'bone lock'], ['Runic key', 'runic lock']],
  forge: {
    fuego: ['Burning edge', (l) => `Your blows burn for ${2 + l} s`], hielo: ['Frost', (l) => `They slow and freeze (${10 * l}% chance)`],
    rayo: ['Storm', (l) => `${15 + 10 * l}% chain lightning to ${1 + l} enemies`], veneno: ['Venom', (l) => `They poison for ${3 + l} s`],
    vampiro: ['Bloodthirst', (l) => `You steal ${3 * l}% of damage as health`], eco: ['Double strike', (l) => `${12 * l}% chance to repeat the hit`],
    estallido: ['Burst', (l) => `Enemies you kill explode (radius ${(1.4 + 0.3 * l).toFixed(1)})`], filo: ['Tempered edge', (l) => `+${20 * l}% damage`],
    rapidez: ['Balance', (l) => `+${12 * l}% attack speed`], critico: ['Honed edge', (l) => `+${8 * l}% critical chance`],
  },
  shop: { torch: ['Torch', `Burns for 4 minutes`], potion: ['Health potion', 'Heals half your health (H)'], map: ['Map scroll', 'Reveals the level you are on'], rune: ['Return rune', 'Takes you back to the exit'] },
  rarity: { comun: 'Common', raro: 'Rare', epico: 'Epic', legendario: 'Legendary' },
  affix: {
    anillo: [['of wrath', (x) => `+${Math.round(x * 100)}% damage`], ['of the hawk', (x) => `+${Math.round(x * 100)}% crit chance`], ['of the wind', (x) => `+${Math.round(x * 100)}% attack speed`]],
    amuleto: [['of the oak', (x) => `+${Math.round(x * 100)}% max health`], ['of the spring', (x) => `+${x.toFixed(1)} health per second`], ['of the sage', (x) => `+${Math.round(x * 100)}% experience`], ['of dawn', (x) => `+${Math.round(x * 100)}% torch range`]],
    armadura: [['of iron', (x) => `-${Math.round(x * 100)}% damage taken`], ['of the runner', (x) => `+${Math.round(x * 100)}% speed`], ['of the shadow', (x) => `Dodge ${Math.round(x * 100)}% faster`]],
    arma: [['honed', (x) => `+${Math.round(x * 100)}% damage with this weapon`], ['true', (x) => `+${Math.round(x * 100)}% crit with this weapon`], ['light', (x) => `+${Math.round(x * 100)}% speed with this weapon`]],
    escudo: [['reinforced', (x) => `Blocks ${Math.round(x * 100)}% more`], ['of the bastion', (x) => `-${Math.round(x * 100)}% damage with the shield in hand`]],
  },
  epic: { anillo: ['Ring of blood', 'You steal 3% of damage as health'], amuleto: ['Phoenix amulet', 'Once per dungeon it revives you with 40% health'], armadura: ['Armor of thorns', 'Returns 30% of damage to whoever hits you'], arma: ['Runic weapon', 'Its blows burn, chill or poison'], escudo: ['Spiked shield', 'When blocking you return 40% of the blow'] },
  legend: {
    nigromante: ['Necromancer ring', (it) => `You steal ${Math.round(it.val * 100)}% of damage as health · ${Math.round(it.fx * 100)}% chance to raise the enemy you kill as an ally`],
    filacteria: ['Phylactery', (it) => `+${Math.round(it.val * 100)}% health · once per dungeon you return to life with ${Math.round(it.fx * 100)}% and two servants`],
    mortaja: ['Lich shroud', (it) => `-${Math.round(it.val * 100)}% damage taken · slows enemies within ${it.fx.toFixed(1)}`],
    nig_arma: [{ sword: 'Necromancer blade', greatsword: 'Necromancer reaper', dagger: 'Ritual dagger', staff: 'Necromancer staff', bow: 'Bone bow' }, (it) => `+${Math.round(it.val * 100)}% damage · every hit heals you for ${Math.round(it.fx * 100)}% of the damage`],
    nig_escudo: ['Bone shield', (it) => `Blocks ${Math.round(it.val * 100)}% more · every block heals ${Math.round(it.fx * 100)}% of your health`],
    reina: ['Heart of the Spider Queen', (it) => `+${Math.round(it.val * 100)}% health · your blows poison and ${Math.round(it.fx * 100)}% of your victims leave an allied spider`],
    viuda: ['Widow ring', (it) => `+${Math.round(it.val * 100)}% damage · +${Math.round(it.fx * 100)}% damage to poisoned enemies`],
    caparazon: ['Chitin carapace', (it) => `-${Math.round(it.val * 100)}% damage taken · whoever hits you is poisoned and takes ${Math.round(it.fx * 100)}%`],
    reina_arma: [{ sword: 'Queen sting', greatsword: 'Queen leg', dagger: 'Queen fang', staff: 'Queen scepter', bow: 'Silk bow' }, (it) => `+${Math.round(it.val * 100)}% damage · strong poison and ${Math.round(it.fx * 100)}% chance to hatch a spider on hit`],
    reina_escudo: ['Web shield', (it) => `Blocks ${Math.round(it.val * 100)}% more · blocking traps the attacker for ${it.fx.toFixed(0)} s`],
    guardian: ['Guardian plate', (it) => `-${Math.round(it.val * 100)}% damage taken · a ring of fire bursts when you are hit`],
    brasas: ['Ember ring', (it) => `+${Math.round(it.val * 100)}% damage · your blows burn for ${it.fx.toFixed(0)} s`],
    igneo: ['Igneous heart', (it) => `+${it.val.toFixed(1)} health per second · every kill heals you ${Math.round(it.fx * 100)}%`],
    guardian_arma: [{ sword: 'Guardian edge', greatsword: 'Guardian greatsword', dagger: 'Igneous dagger', staff: 'Ember staff', bow: 'Ember bow' }, (it) => `+${Math.round(it.val * 100)}% damage · every third hit bursts into flames`],
    guardian_escudo: ['Igneous aegis', (it) => `Blocks ${Math.round(it.val * 100)}% more · blocking bursts a ring of fire`],
    primigenio: ['Primordial eye', (it) => `+${Math.round(it.val * 100)}% crit · every ${it.fx.toFixed(1)} s it fires void orbs at the nearest enemy`],
    lagrima: ['Void tear', (it) => `+${Math.round(it.val * 100)}% crit · crits deal ${Math.round(it.fx * 100)}% more damage`],
    manto: ['Void mantle', (it) => `Dodge ${Math.round(it.val * 100)}% faster · dodging leaves a void blast`],
    vacio_arma: [{ sword: 'Void blade', greatsword: 'Void greatsword', dagger: 'Void dagger', staff: 'Void staff', bow: 'Void bow' }, (it) => `+${Math.round(it.val * 100)}% crit · every crit fires a void orb`],
    vacio_escudo: ['Void mirror', (it) => `Blocks ${Math.round(it.val * 100)}% more · blocking reflects projectiles`],
    solar: ['Solar blade', (it) => `+${Math.round(it.val * 100)}% damage · every third hit bursts into flames`],
    titan: ['Mountainbreaker', (it) => `+${Math.round(it.val * 100)}% damage · every hit sends out a shockwave`],
    colmillo: ['Shadow fang', (it) => `+${Math.round(it.val * 100)}% crit · killing hides you and restores ${Math.round(it.fx * 100)}% health`],
    archimago: ['Archmage staff', (it) => `+${Math.round(it.val * 100)}% damage · +1 projectile that pierces one more enemy`],
    almas: ['Bow of souls', (it) => `+${Math.round(it.val * 100)}% damage · your arrows pierce ${it.fx.toFixed(0)} more enemies`],
    lil_anillo: ['Ring of Lilith', (it) => `You steal ${Math.round(it.val * 100)}% of damage as health · ${Math.round(it.fx * 100)}% chance your victims rise as allied shadows`],
    lil_amuleto: ['Heart of Lilith', (it) => `+${Math.round(it.val * 100)}% health · below 40% health your hits heal ${Math.round(it.fx * 100)}% of the damage`],
    lil_armadura: ['Wings of Lilith', (it) => `Dodge ${Math.round(it.val * 100)}% faster · dodging makes you invisible for ${it.fx.toFixed(1)} s`],
    lil_arma: [{ sword: 'Blade of Lilith', greatsword: 'Greatsword of Lilith', dagger: 'Sting of Lilith', staff: 'Scepter of Lilith', bow: 'Bow of Lilith' }, (it) => `+${Math.round(it.val * 100)}% damage · your hits weaken: the enemy deals -30% damage for ${it.fx.toFixed(0)} s`],
    lil_escudo: ['Aegis of Lilith', (it) => `Blocks ${Math.round(it.val * 100)}% more · blocking bewitches the attacker for ${it.fx.toFixed(0)} s`],
    cth_anillo: ["Eye of R'lyeh", (it) => `+${Math.round(it.val * 100)}% crit · ${Math.round(it.fx * 100)}% chance a tentacle smashes and slows your target`],
    cth_amuleto: ['Sleeping idol', (it) => `+${Math.round(it.val * 100)}% health · ${Math.round(it.fx * 100)}% chance whoever hits you goes mad and is stunned`],
    cth_armadura: ['Abyssal scales', (it) => `-${Math.round(it.val * 100)}% damage taken · immune to frost and poison`],
    cth_arma: [{ sword: "Blade of R'lyeh", greatsword: 'Abyssbreaker', dagger: 'Abyssal fang', staff: "Sleeper's staff", bow: 'Coral bow' }, (it) => `+${Math.round(it.val * 100)}% damage · every fourth hit a tentacle bursts out, smashing and slowing`],
    cth_escudo: ['Shell of the abyss', (it) => `Blocks ${Math.round(it.val * 100)}% more · blocking releases ink that slows enemies for ${it.fx.toFixed(1)} s`],
    dra_anillo: ['Dragon claw', (it) => `+${Math.round(it.val * 100)}% damage · your hits burn for ${it.fx.toFixed(0)} s`],
    dra_amuleto: ['Dragon heart', (it) => `+${Math.round(it.val * 100)}% health · enemies you kill burst into flames`],
    dra_armadura: ['Dragon scales', (it) => `-${Math.round(it.val * 100)}% damage taken · whoever hits you burns and takes ${Math.round(it.fx * 100)}%`],
    dra_arma: [{ sword: 'Dragon fang', greatsword: 'Dragonslayer', dagger: 'Dragon tooth', staff: 'Dragon staff', bow: 'Scale bow' }, (it) => `+${Math.round(it.val * 100)}% damage · every third hit you breathe fire`],
    dra_escudo: ['Scale shield', (it) => `Blocks ${Math.round(it.val * 100)}% more · blocking breathes fire`],
    egida: ['Aegis', (it) => `Blocks ${Math.round(it.val * 100)}% more · blocking reflects projectiles`],
  },
  sets: {
    nigromante: ['Necromancer Regalia', { 2: 'Your undead have +50% health and damage', 4: 'Up to 6 undead and +20% chance to raise them', 5: 'Every 20 s two servants rise at your side' }],
    reina: ['Silk of the Queen', { 2: 'Your poison deals +50% damage', 4: '+20% chance for your victims to leave spiders', 5: 'Every victim leaves an allied spider' }],
    guardian: ['Guardian Bulwark', { 2: '-15% damage taken', 4: 'The ring of fire recharges twice as fast', 5: 'Dropping below 30% health makes you invulnerable for 3 s (every 60 s)' }],
    lilith: ['Seduction of Lilith', { 2: '+5% life steal', 4: 'Your allied shadows last twice as long', 5: 'Every enemy you kill heals you 3%' }],
    rlyeh: ["Legacy of R'lyeh", { 2: '+15% health', 4: 'Tentacles appear twice as often', 5: 'Every 30 s a giant tentacle sweeps nearby enemies' }],
    dragon: ['Fury of the Red Dragon', { 2: 'Your burns deal +50% damage', 4: 'Your fire breath reaches farther', 5: 'Every 25 s a dragon roar unleashes a fire nova' }],
    vacio: ['Sight of the Void', { 2: '+10% crit', 4: 'Void orbs twice as fast (even without the ring)', 5: 'Crits deal triple damage' }],
  },
  slotLabel: { anillo1: 'Ring 1', anillo2: 'Ring 2', amuleto: 'Amulet', armadura: 'Armor', arma: 'Weapon', escudo: 'Shield' },
  wtName: { sword: 'sword', greatsword: 'greatsword', dagger: 'dagger', staff: 'staff', bow: 'bow' },
  baseName: { anillo: ['Copper ring', 'Silver ring', 'Signet'], amuleto: ['Pendant', 'Amulet', 'Talisman'], armadura: ['Doublet', 'Chainmail', 'Breastplate'], sword: ['Short sword', 'Longsword', 'Steel blade'], greatsword: ['Claymore', 'Greatsword', 'Zweihander'], dagger: ['Dirk', 'Dagger', 'Stiletto'], staff: ['Staff', 'Rod', 'Crozier'], bow: ['Short bow', 'Longbow', 'Composite bow'], escudo: ['Buckler', 'Oak shield', 'Pavise'] },
  slots: { anillo: 'Ring', amuleto: 'Amulet', armadura: 'Armor', arma: 'Weapon', escudo: 'Shield' },
  actions: { up: 'Move forward', down: 'Move back', left: 'Strafe left', right: 'Strafe right', turnL: 'Turn left', turnR: 'Turn right', attack: 'Attack', block: 'Block', dash: 'Dodge', skill1: 'Skill 1', skill2: 'Skill 2', skill3: 'Skill 3', shield: 'Shield', weapon: 'Switch weapon', potion: 'Drink potion', map: 'Map', journal: 'Journal', inventory: 'Inventory', pause: 'Pause' },
  dgPre: ['The Catacombs', 'The Crypt', 'The Sunken Fortress', 'The Ossuary', 'The Vaults', 'The Desecrated Sanctum', 'The Buried Tower', 'The Galleries'],
  dgSuf: ['of Ulmar', 'of Vel Kharn', 'of the Blind King', 'of Morhaven', 'of Ashgrave', 'of the Grey Order', 'of Duskmere', 'of the Thousand Bones', 'of Karak Dum'],
};

let ES_DATA = null; // copia de los textos originales para volver al español
function snapshotData() {
  const s = { classes: {}, skills: {}, spells: {}, weapons: {}, allies: {}, enemies: {}, upg: {}, forge: {}, shop: {}, affix: {}, epic: {}, keys: KEYS.map(k => [k.name, k.lock]) };
  for (const k in CLASSES) s.classes[k] = [CLASSES[k].name, CLASSES[k].tag, CLASSES[k].desc];
  for (const k in SKILLS) s.skills[k] = SKILLS[k].name;
  s.skillDesc = {}; for (const k in SKILLS) s.skillDesc[k] = SKILLS[k].desc || '';
  for (const k in SPELLS) s.spells[k] = SPELLS[k].name;
  for (const k in WEAPONS) s.weapons[k] = WEAPONS[k].name;
  for (const k in ALLIES) s.allies[k] = ALLIES[k].name;
  for (const k in ENEMY) s.enemies[k] = ENEMY[k].name;
  for (const u of UPG) s.upg[u.id] = [u.name, u.desc];
  s.themes = THEMES.map(t => t.name); s.elements = Object.assign({}, ELEMENT_NAME);
  for (const f of FORGE) s.forge[f.id] = [f.name, f.desc];
  for (const it of SHOP_ITEMS) s.shop[it.id] = [it.name, it.desc];
  s.rarity = Object.fromEntries(Object.entries(RARITY).map(([k, v]) => [k, v.name]));
  for (const sl in AFFIX) s.affix[sl] = AFFIX[sl].map(a => [a.name, a.desc]);
  for (const sl in EPIC) s.epic[sl] = [EPIC[sl].name, EPIC[sl].desc];
  s.baseName = JSON.parse(JSON.stringify(BASE_NAME)); s.actions = Object.assign({}, ACTION_NAME);
  s.dgPre = DG_PRE.slice(); s.dgSuf = DG_SUF.slice();
  s.slots = { anillo: 'Anillo', amuleto: 'Amuleto', armadura: 'Armadura', arma: 'Arma', escudo: 'Escudo' };
  s.legend = Object.fromEntries(Object.entries(LEGEND).map(([k, L]) => [k, [L.name, L.desc]]));
  s.sets = Object.fromEntries(Object.entries(SETS).map(([k, S]) => [k, [S.name, Object.assign({}, S.bonus)]]));
  s.slotLabel = Object.assign({}, SLOT_LABEL); s.wtName = Object.assign({}, WT_NAME);
  ES_DATA = s;
}
function applyData(D) {
  for (const k in D.classes) if (CLASSES[k]) [CLASSES[k].name, CLASSES[k].tag, CLASSES[k].desc] = D.classes[k];
  for (const k in D.skills) if (SKILLS[k]) SKILLS[k].name = D.skills[k];
  for (const k in D.skillDesc || {}) if (SKILLS[k]) SKILLS[k].desc = D.skillDesc[k];
  for (const k in D.spells) if (SPELLS[k]) SPELLS[k].name = D.spells[k];
  for (const k in D.weapons) if (WEAPONS[k]) WEAPONS[k].name = D.weapons[k];
  for (const k in D.allies) if (ALLIES[k]) ALLIES[k].name = D.allies[k];
  for (const k in D.enemies) if (ENEMY[k]) ENEMY[k].name = D.enemies[k];
  for (const u of UPG) if (D.upg[u.id]) {
    const [n, d] = D.upg[u.id]; u.name = n;
    u.desc = typeof d === 'function' ? d : Array.isArray(d) ? ((a) => (l) => l === 0 ? a[0] : a[1])(d) : ((t) => () => t)(d);
  }
  THEMES.forEach((t, i) => { t.name = D.themes[i]; });
  Object.assign(ELEMENT_NAME, D.elements);
  KEYS.forEach((k, i) => { [k.name, k.lock] = D.keys[i]; });
  for (const f of FORGE) if (D.forge[f.id]) [f.name, f.desc] = D.forge[f.id];
  for (const it of SHOP_ITEMS) if (D.shop[it.id]) [it.name, it.desc] = D.shop[it.id];
  for (const k in D.rarity) RARITY[k].name = D.rarity[k];
  for (const sl in D.affix) D.affix[sl].forEach((a, i) => { AFFIX[sl][i].name = a[0]; AFFIX[sl][i].desc = a[1]; });
  for (const sl in D.epic) [EPIC[sl].name, EPIC[sl].desc] = D.epic[sl];
  for (const sl in D.baseName) BASE_NAME[sl] = D.baseName[sl].slice();
  Object.assign(ACTION_NAME, D.actions);
  DG_PRE.splice(0, DG_PRE.length, ...D.dgPre); DG_SUF.splice(0, DG_SUF.length, ...D.dgSuf);
  SLOT_NAME = D.slots;
  for (const k in D.legend) if (LEGEND[k]) [LEGEND[k].name, LEGEND[k].desc] = D.legend[k];
  for (const k in D.sets) if (SETS[k]) { SETS[k].name = D.sets[k][0]; SETS[k].bonus = Object.assign({}, D.sets[k][1]); }
  Object.assign(SLOT_LABEL, D.slotLabel); Object.assign(WT_NAME, D.wtName);
  // temas ya construidos y fantasmas de la partida en curso
  if (G.dg) for (const z of G.dg.zs) { const lv = G.dg.lv(z); if (lv.themeObj) lv.themeObj.name = THEMES[lv.theme % THEMES.length].name; }
}
let SLOT_NAME = { anillo: 'Anillo', amuleto: 'Amuleto', armadura: 'Armadura' };

// ---------------------------------------------------------------- 2) textos de pantalla (en mayúsculas, como se dibujan)
const EN_UI = {
  'ENTRA. SAQUEA. SAL CON VIDA.': 'ENTER. LOOT. GET OUT ALIVE.', 'MOVERSE': 'MOVE', 'GIRAR': 'TURN', 'ATACAR': 'ATTACK', 'HABILIDADES DE CLASE': 'CLASS SKILLS',
  'CAMBIAR DE ARMA': 'SWITCH WEAPON', 'ALZAR / BAJAR ESCUDO': 'RAISE / LOWER SHIELD', 'CLIC DER.': 'RIGHT CLICK', 'BLOQUEAR (ESCUDO)': 'BLOCK (SHIELD)', 'ESQUIVAR': 'DODGE',
  'INVENTARIO · DIARIO · MAPA': 'INVENTORY · JOURNAL · MAP', 'PAUSA · SONIDO': 'PAUSE · SOUND', 'RATÓN / Q E': 'MOUSE / Q E', 'CLIC / ESPACIO': 'CLICK / SPACE', '1 2 3 / RUEDA': '1 2 3 / WHEEL',
  'STICK IZQ. · DER.': 'LEFT · RIGHT STICK', 'MOVERSE · GIRAR': 'MOVE · TURN', 'ATACAR · BLOQUEAR': 'ATTACK · BLOCK', 'HABILIDADES R C V': 'SKILLS R C V', 'ESCUDO · CAMBIAR ARMA': 'SHIELD · SWITCH WEAPON',
  'CRUCETA ARRIBA': 'D-PAD UP', 'BEBER POCIÓN': 'DRINK POTION', 'CRUCETA ABAJO': 'D-PAD DOWN', 'MAPA': 'MAP', 'CRUCETA IZQ. · DER.': 'D-PAD LEFT · RIGHT', 'DIARIO · INVENTARIO': 'JOURNAL · INVENTORY',
  'START': 'START', 'PAUSA': 'PAUSE', 'MENÚS': 'MENUS', 'CRUCETA + A / B': 'D-PAD + A / B', 'DEDO IZQUIERDO': 'LEFT FINGER', 'JOYSTICK: MOVERSE': 'JOYSTICK: MOVE', 'DESLIZAR A LA DER.': 'SWIPE ON THE RIGHT',
  'MANTENER PULSADO': 'HOLD', 'HABILIDADES': 'SKILLS', 'PAUSA · DIARIO · INVENTARIO': 'PAUSE · JOURNAL · INVENTORY', 'BLOQUEAR CON ESCUDO': 'BLOCK WITH SHIELD', 'PAREDES': 'WALLS',
  'CAMINA CONTRA ELLAS': 'WALK INTO THEM', 'EN LOS MENÚS': 'IN MENUS', 'TOCA PARA ELEGIR': 'TAP TO CHOOSE', 'CONTINUAR': 'CONTINUE', 'NUEVA PARTIDA': 'NEW GAME',
  'PULSA A PARA ENTRAR': 'PRESS A TO ENTER', 'TOCA PARA ENTRAR': 'TAP TO ENTER', 'HAZ CLIC PARA ENTRAR': 'CLICK TO ENTER', 'OPCIONES (O)': 'OPTIONS (O)', '* BIENVENIDO, VIAJERO.': '* WELCOME, TRAVELER.',
  '* LA CRIPTA TE ESPERA BAJO TUS PIES.': '* THE CRYPT AWAITS BENEATH YOUR FEET.', 'MEJORAS': 'UPGRADES', 'SIN MEJORAS AÚN': 'NO UPGRADES YET', 'TOCA FUERA PARA CONTINUAR': 'TAP OUTSIDE TO CONTINUE',
  'HAZ CLIC FUERA O PULSA P PARA CONTINUAR': 'CLICK OUTSIDE OR PRESS P TO CONTINUE', 'OPCIONES': 'OPTIONS', 'SENSIBILIDAD': 'SENSITIVITY', 'VOLUMEN': 'VOLUME', 'SONIDO': 'SOUND', 'MÚSICA': 'MUSIC',
  'IDIOMA': 'LANGUAGE', 'FOTOGRAMAS': 'FRAME RATE', 'CALIDAD': 'QUALITY', 'ALTA': 'HIGH', 'RÁPIDA': 'FAST', 'FILTRO CRT': 'CRT FILTER', 'SACUDIDAS': 'SCREEN SHAKE', 'DESTELLOS': 'FLASHES',
  'VIBRACIÓN DEL MANDO': 'CONTROLLER RUMBLE', 'BOTONES TÁCTILES': 'TOUCH BUTTONS', 'GRANDES': 'LARGE', 'NORMALES': 'NORMAL', 'CONTROLES': 'CONTROLS', 'SÍ': 'YES', 'NO': 'NO',
  'ACCIÓN': 'ACTION', 'TECLADO': 'KEYBOARD', 'MANDO': 'CONTROLLER', 'PULSA UNA TECLA': 'PRESS A KEY', 'PULSA UN BOTÓN': 'PRESS A BUTTON', 'RESTABLECER': 'RESET', 'VOLVER': 'BACK',
  'MOVERSE CON LAS FLECHAS Y LOS STICKS SIEMPRE FUNCIONA · ESC CANCELA': 'ARROW KEYS AND STICKS ALWAYS MOVE · ESC CANCELS', 'HAZ CLIC FUERA O PULSA O PARA VOLVER': 'CLICK OUTSIDE OR PRESS O TO GO BACK',
  'INVENTARIO': 'INVENTORY', 'EMPUÑAR': 'WIELD', 'GUARDAR': 'STOW', 'ENCENDER': 'LIGHT', 'ARMA DE UNA MANO': 'ONE-HANDED WEAPON', 'BEBER: VIDA ENTERA': 'DRINK: FULL HEALTH',
  'LEER: REVELA EL NIVEL': 'READ: REVEALS THE LEVEL', 'USAR: VOLVER A LA SALIDA': 'USE: RETURN TO THE EXIT', 'ESCUDO': 'SHIELD', 'BAJAR': 'LOWER', 'ALZAR': 'RAISE', 'NINGUNA': 'NONE',
  'EQUIPO': 'EQUIPMENT', 'ELIGE UN OBJETO PARA EQUIPARLO': 'CHOOSE AN ITEM TO EQUIP IT', 'CLIC: EQUIPAR / QUITAR · X: TIRAR': 'CLICK: EQUIP / REMOVE · X: DROP', 'TOCA FUERA PARA CERRAR': 'TAP OUTSIDE TO CLOSE',
  'B PARA CERRAR': 'B TO CLOSE', 'I PARA CERRAR · H BEBER POCIÓN': 'I TO CLOSE · H DRINK POTION', 'EL MERCADER': 'THE MERCHANT', '"LA OSCURIDAD ES BUEN NEGOCIO, VIAJERO."': '"DARKNESS IS GOOD FOR BUSINESS, TRAVELER."',
  'TOCA FUERA PARA SALIR': 'TAP OUTSIDE TO LEAVE', 'ESC PARA SALIR': 'ESC TO LEAVE', 'EL HERRERO': 'THE BLACKSMITH', '"LA PRIMERA TE LA REGALO. LAS DEMÁS SE PAGAN."': '"THE FIRST ONE IS ON ME. THE REST YOU PAY FOR."',
  'TU ARMA YA NO ADMITE MÁS MEJORAS': 'YOUR WEAPON CANNOT BE UPGRADED ANY FURTHER', 'TU ARMA AÚN NO TIENE MEJORAS': 'YOUR WEAPON HAS NO UPGRADES YET', 'GRATIS': 'FREE',
  'SALIDA': 'EXIT', 'ESCALERA ARRIBA': 'STAIRS UP', 'ESCALERA ABAJO': 'STAIRS DOWN', 'PUERTA': 'DOOR', 'CERRADURA': 'LOCK', 'COFRE': 'CHEST', 'LLAVE': 'KEY', 'ALTAR': 'ALTAR',
  'M MERCADER': 'M MERCHANT', 'H HERRERO': 'B BLACKSMITH', 'NIVELES:': 'LEVELS:', 'TOCA LOS LADOS: OTRO NIVEL': 'TAP THE SIDES: OTHER LEVEL', 'A / D: OTRO NIVEL': 'A / D: OTHER LEVEL',
  'TOCA EL CENTRO: CERRAR': 'TAP THE CENTER: CLOSE', 'M: CERRAR': 'M: CLOSE', 'ELIGE UNA MEJORA': 'CHOOSE AN UPGRADE', 'HABILIDAD': 'SKILL', 'BASE': 'BASE', 'AVANZADA': 'ADVANCED', 'SUBCLASE': 'SUBCLASS',
  'HAS CAÍDO': 'YOU HAVE FALLEN', 'BOTÍN PERDIDO': 'LOOT LOST', 'ORO A SALVO': 'GOLD SAFE', 'NIVEL': 'LEVEL', 'ABATIDOS': 'KILLS', 'TIEMPO': 'TIME', 'TOCA PARA RENACER': 'TAP TO RISE AGAIN',
  'HAZ CLIC PARA RENACER': 'CLICK TO RISE AGAIN', 'LA SALIDA': 'THE EXIT', 'LA LUZ DEL DÍA ENTRA ENTRE LOS BARROTES': 'DAYLIGHT SHINES THROUGH THE BARS', 'BOTÍN': 'LOOT', 'LLAVES': 'KEYS',
  'GUARDIÁN': 'GUARDIAN', 'DERROTADO': 'DEFEATED', 'VIVO': 'ALIVE', 'SALIR CON EL BOTÍN': 'LEAVE WITH THE LOOT', 'SEGUIR EXPLORANDO': 'KEEP EXPLORING', 'HAS ESCAPADO': 'YOU ESCAPED',
  'ORO DE LA PARTIDA': 'RUN GOLD', 'SIGUIENTE MAZMORRA (MÁS DIFÍCIL)': 'NEXT DUNGEON (HARDER)', 'RETIRARSE CON EL ORO': 'RETIRE WITH THE GOLD', 'DIARIO': 'JOURNAL',
  'TOCA EL CENTRO PARA CERRAR · LOS LADOS PASAN PÁGINA': 'TAP THE CENTER TO CLOSE · THE SIDES TURN PAGES', 'J PARA CERRAR': 'J TO CLOSE', 'SIN ANTORCHA (I)': 'NO TORCH (I)',
  'AMBAS MANOS': 'BOTH HANDS', 'DOS ARMAS': 'TWO WEAPONS', 'ARCO A DOS MANOS': 'TWO-HANDED BOW', 'ZARPAS': 'CLAWS', 'FORMA DE LOBO': 'WOLF FORM', 'FORMA DE OSO': 'BEAR FORM', 'MOVER': 'MOVE',
  'ELIGE TU CAMINO': 'CHOOSE YOUR PATH', 'EVOLUCIONARÁS EN LOS NIVELES 20 Y 40': 'YOU WILL EVOLVE AT LEVELS 20 AND 40', '¡EVOLUCIÓN!': 'EVOLUTION!', 'DIARIO ACTUALIZADO [J]': 'JOURNAL UPDATED [J]',
  'DIARIO ACTUALIZADO': 'JOURNAL UPDATED', 'LAS REJAS NO CEDEN': 'THE BARS WILL NOT BUDGE', '¡UN PASADIZO SECRETO!': 'A SECRET PASSAGE!', '¡LA ARENA SE CIERRA!': 'THE ARENA SEALS SHUT!',
  '¡ARENA SUPERADA!': 'ARENA CLEARED!', 'UN ALTAR TE BENDICE': 'AN ALTAR BLESSES YOU', '¡EL FÉNIX TE DEVUELVE A LA VIDA!': 'THE PHOENIX BRINGS YOU BACK TO LIFE!', 'NECESITAS UNA MANO LIBRE': 'YOU NEED A FREE HAND',
  'NO TE QUEDAN ANTORCHAS': 'YOU HAVE NO TORCHES LEFT', 'TU ANTORCHA SE APAGA': 'YOUR TORCH GOES OUT', '+1 ANTORCHA': '+1 TORCH', 'NO TE ALCANZA EL ORO': 'NOT ENOUGH GOLD', 'NO TIENES POCIONES': 'YOU HAVE NO POTIONS',
  'YA TIENES LA VIDA AL MÁXIMO': 'YOUR HEALTH IS ALREADY FULL', 'EL NIVEL SE REVELA EN TU MAPA': 'THE LEVEL IS REVEALED ON YOUR MAP', 'LA RUNA TE DEVUELVE A LA SALIDA': 'THE RUNE TAKES YOU BACK TO THE EXIT',
  'LA MOCHILA ESTÁ LLENA': 'YOUR BACKPACK IS FULL', 'CONTINÚAS LA PARTIDA': 'GAME RESUMED', 'EL FANTASMA DESCANSA AL FIN': 'THE GHOST RESTS AT LAST', '¡EL GUARDIÁN HA CAÍDO!': 'THE GUARDIAN HAS FALLEN!',
  'GIRA EL MÓVIL': 'TURN YOUR PHONE', 'CARGANDO LA MAZMORRA…': 'LOADING THE DUNGEON…', 'VACÍA': 'EMPTY', 'DOS MANOS': 'TWO HANDS', 'SALIR DE PANTALLA COMPLETA': 'EXIT FULLSCREEN', 'PANTALLA COMPLETA': 'FULLSCREEN',
  'VIDA': 'HEALTH', 'EFECTOS DE AMBIENTE': 'AMBIENT EFFECTS', 'TU DOBLE SE DESVANECE': 'YOUR DOUBLE FADES AWAY', '¡TU DOPPELGANGER!': 'YOUR DOPPELGANGER!', 'UNA COPIA EXACTA DE TI SALE DE LAS SOMBRAS...': 'AN EXACT COPY OF YOU STEPS OUT OF THE SHADOWS...', '¡EL DURMIENTE DESPIERTA!': 'THE SLEEPER AWAKENS!', '¡RUGIDO DEL DRAGÓN!': 'DRAGON ROAR!', 'BIBLIOTECA OLVIDADA': 'FORGOTTEN LIBRARY', 'OSARIO': 'OSSUARY', 'FUENTE ANTIGUA': 'ANCIENT FOUNTAIN', 'ALMACÉN': 'STOREROOM', 'JARDÍN DE HONGOS': 'FUNGUS GARDEN', 'CÍRCULO RITUAL': 'RITUAL CIRCLE', 'BEBES DE LA FUENTE': 'YOU DRINK FROM THE FOUNTAIN', 'RECUPERAS EL 60% DE LA VIDA': 'YOU RECOVER 60% OF YOUR HEALTH', 'POLVO, VELAS Y SABER OLVIDADO': 'DUST, CANDLES AND FORGOTTEN LORE', 'MONTAÑAS DE HUESOS... ALGUNOS SE MUEVEN': 'MOUNDS OF BONES... SOME OF THEM MOVE', 'EL AGUA AÚN BRILLA: BEBER DE ELLA CURA': 'THE WATER STILL GLOWS: DRINKING IT HEALS', 'CAJAS Y BARRILES DE ALGUNA EXPEDICIÓN PERDIDA': 'CRATES AND BARRELS FROM SOME LOST EXPEDITION', 'HONGOS QUE BRILLAN EN LA OSCURIDAD': 'MUSHROOMS THAT GLOW IN THE DARK', 'UN CÍRCULO DE VELAS Y UNA PIEDRA QUE SANGRA LUZ': 'A CIRCLE OF CANDLES AND A STONE THAT BLEEDS LIGHT', 'SE OYEN PASOS QUE SE ACERCAN...': 'FOOTSTEPS ARE COMING CLOSER...', 'ALGO SE ACERCA DESDE LAS SOMBRAS...': 'SOMETHING APPROACHES FROM THE SHADOWS...', 'ATAQUE AUTOMÁTICO': 'AUTO ATTACK', '¡INQUEBRANTABLE!': 'UNBREAKABLE!', '¡LA FILACTERIA TE DEVUELVE A LA VIDA!': 'THE PHYLACTERY BRINGS YOU BACK TO LIFE!', '¿CAMBIAR DE EQUIPO?': 'SWAP EQUIPMENT?', 'HAS ENCONTRADO': 'YOU FOUND', 'EQUIPAR EL NUEVO': 'EQUIP THE NEW ONE', 'QUEDARME CON LO QUE LLEVO': 'KEEP WHAT I HAVE',
  'LO QUE NO TE QUEDES SE QUEDA EN EL SUELO': 'WHAT YOU DO NOT KEEP STAYS ON THE FLOOR', 'LO QUE ENCUENTRAS SE EQUIPA AL MOMENTO': 'WHAT YOU FIND IS EQUIPPED ON THE SPOT', 'SOLO CON EL ESCUDO EN LA MANO': 'ONLY WITH THE SHIELD IN HAND',
  '¡UN LEGENDARIO DEL CAÍDO!': 'A LEGENDARY FROM THE FALLEN!', 'LEGENDARIO': 'LEGENDARY', 'ESPACIO': 'SPACE', 'CRUZ ARRIBA': 'D-PAD UP', 'CRUZ ABAJO': 'D-PAD DOWN', 'CRUZ IZQ.': 'D-PAD LEFT', 'CRUZ DER.': 'D-PAD RIGHT', 'FLECHA ARRIBA': 'UP ARROW', 'FLECHA ABAJO': 'DOWN ARROW',
  'FLECHA IZQ.': 'LEFT ARROW', 'FLECHA DER.': 'RIGHT ARROW', 'SHIFT DER.': 'RIGHT SHIFT', 'CTRL DER.': 'RIGHT CTRL', 'BLOQ MAYÚS': 'CAPS LOCK', 'INTRO': 'ENTER', 'RETROCESO': 'BACKSPACE',
  'LA OSCURIDAD ES BUEN NEGOCIO, VIAJERO.': 'DARKNESS IS GOOD FOR BUSINESS, TRAVELER.', 'LA PRIMERA TE LA REGALO. LAS DEMÁS SE PAGAN.': 'THE FIRST ONE IS ON ME. THE REST YOU PAY FOR.',
  'SAQUEA LO QUE PUEDAS Y SAL CON VIDA': 'LOOT WHAT YOU CAN AND GET OUT ALIVE', 'ESTÁ OSCURO: TOCA I Y ENCIENDE UNA ANTORCHA': "IT'S DARK: TAP I AND LIGHT A TORCH", 'ESTÁ OSCURO: PULSA I Y ENCIENDE UNA ANTORCHA': "IT'S DARK: PRESS I AND LIGHT A TORCH",
  'LAS REJAS CAEN A TU ESPALDA': 'THE BARS FALL BEHIND YOU', 'VIDA AL MÁXIMO Y +20% DE DAÑO DURANTE UN MINUTO': 'FULL HEALTH AND +20% DAMAGE FOR ONE MINUTE', 'HAS CAÍDO EN LA OSCURIDAD...': 'YOU HAVE FALLEN INTO THE DARKNESS...',
  'VUELVES A EMPUÑAR LA ANTORCHA': 'YOU WIELD THE TORCH AGAIN', 'GUARDAS EL ESCUDO': 'YOU STOW THE SHIELD', 'EQUIPAS EL ESCUDO (CLIC DER. PARA BLOQUEAR)': 'YOU EQUIP THE SHIELD (RIGHT CLICK TO BLOCK)',
  'CAMBIA A UN ARMA DE UNA MANO PARA LLEVAR ANTORCHA': 'SWITCH TO A ONE-HANDED WEAPON TO CARRY A TORCH', 'GUARDAS LA ANTORCHA': 'YOU STOW THE TORCH', 'ENCIENDES UNA ANTORCHA': 'YOU LIGHT A TORCH',
  'SE CONSUME TU ÚLTIMA ANTORCHA...': 'YOUR LAST TORCH BURNS OUT...', 'UN RUGIDO SACUDE LA MAZMORRA...': 'A ROAR SHAKES THE DUNGEON...', 'SU TESORO ES TUYO. AHORA, A LA SALIDA': 'ITS TREASURE IS YOURS. NOW, TO THE EXIT',
  'BEBES UNA POCIÓN: +VIDA': 'YOU DRINK A POTION: +HEALTH', 'BEBES UNA POCIÓN DE VIDA': 'YOU DRINK A HEALTH POTION', 'SONIDO APAGADO': 'SOUND OFF', 'SONIDO ACTIVADO': 'SOUND ON', 'ESA ARMA NECESITA AMBAS MANOS': 'THAT WEAPON NEEDS BOTH HANDS',
  'RECUPERAS TU FORMA HUMANA': 'YOU REGAIN YOUR HUMAN FORM', 'TE CONVIERTES EN LOBO: VELOZ Y RÁPIDO': 'YOU BECOME A WOLF: SWIFT AND FAST', 'TE CONVIERTES EN OSO: RESISTENTE Y BRUTAL': 'YOU BECOME A BEAR: TOUGH AND BRUTAL',
  'YA TIENES 3 LOBOS': 'YOU ALREADY HAVE 3 WOLVES', 'TU OSO SIGUE VIVO': 'YOUR BEAR IS STILL ALIVE', 'ESTÁS DEMASIADO DÉBIL PARA EL PACTO': 'YOU ARE TOO WEAK FOR THE PACT', 'INSTALAR COMO APP': 'INSTALL AS APP', '¿SEGURO?': 'SURE?', '+1 POCIÓN': '+1 POTION', 'MEJORA': 'UPGRADE', '¡BEBES UNA POCIÓN A TIEMPO!': 'YOU DRINK A POTION JUST IN TIME!', 'NECESITAS UN ESCUDO EN LA MANO': 'YOU NEED A SHIELD IN HAND', "¡UN PORTAL SE ABRE!": "A PORTAL OPENS!", "HUELE A HIERBA... Y A ALGO MÁS": "IT SMELLS OF GRASS... AND SOMETHING ELSE", "NIVEL SECRETO": "SECRET LEVEL", "UN PACTO OSCURO": "A DARK PACT", "ACEPTA UNA MALDICIÓN PARA ESTA MAZMORRA A CAMBIO DE MÁS ORO Y MEJOR BOTÍN": "ACCEPT A CURSE FOR THIS DUNGEON FOR MORE GOLD AND BETTER LOOT", "SIN PACTO": "NO PACT", "ENTRAS SIN MALDICIONES": "YOU ENTER WITHOUT CURSES", "ENEMIGOS FRENÉTICOS": "FRENZIED ENEMIES", "A CIEGAS": "BLIND", "MECHA CORTA": "SHORT WICK", "SANGRE FRÍA": "COLD BLOOD", "LA HORDA": "THE HORDE", "CAMPEONES": "CHAMPIONS", "CRISTAL": "GLASS", "LOS ENEMIGOS SON UN 20% MÁS RÁPIDOS": "ENEMIES ARE 20% FASTER", "SIN MINIMAPA NI MAPA": "NO MINIMAP OR MAP", "LAS ANTORCHAS DURAN LA MITAD": "TORCHES LAST HALF AS LONG", "CURAS Y REGENERACIÓN A LA MITAD": "HEALING AND REGENERATION HALVED", "UNA OLEADA CADA 80 SEGUNDOS": "A WAVE EVERY 80 SECONDS", "EL TRIPLE DE ENEMIGOS ÉLITE": "THREE TIMES AS MANY ELITE ENEMIES", "RECIBES UN 20% MÁS DE DAÑO": "YOU TAKE 20% MORE DAMAGE", "MODO PESADILLA (DOBLE ORO)": "NIGHTMARE MODE (DOUBLE GOLD)", "MODO PESADILLA": "NIGHTMARE MODE", "LA FUENTE ESTÁ SECA": "THE FOUNTAIN IS DRY", "EL PACTO TE CIEGA: SIN MAPA": "THE PACT BLINDS YOU: NO MAP", "YA BEBISTE DE UNA FUENTE EN ESTA MAZMORRA": "YOU ALREADY DRANK FROM A FOUNTAIN IN THIS DUNGEON", "PESADILLA: ENEMIGOS MÁS DUROS, EL DOBLE DE ORO Y BOTÍN SIN OBJETOS COMUNES": "NIGHTMARE: TOUGHER ENEMIES, DOUBLE GOLD AND NO COMMON ITEMS", "NUEVA HABILIDAD": "NEW SKILL", "NUEVA PASIVA": "NEW PASSIVE", "PASIVA": "PASSIVE", "GUARDADA": "STORED", "NUEVA": "NEW", "GUARDAR PARA EL MENTOR": "KEEP FOR THE MENTOR", "NO LA USAS POR AHORA: PODRÁS ACTIVARLA CON EL MENTOR": "YOU WILL NOT USE IT FOR NOW; THE MENTOR CAN ACTIVATE IT", "SUSTITUIR": "REPLACE", "LO QUE SUSTITUYAS NO SE PIERDE: EL MENTOR LO GUARDA": "NOTHING YOU REPLACE IS LOST: THE MENTOR KEEPS IT", "SOLO PUEDES LLEVAR 3 ACTIVAS: ¿CUÁL SUSTITUYE?": "YOU CAN ONLY CARRY 3 ACTIVE: WHICH ONE DOES IT REPLACE?", "SOLO PUEDES LLEVAR 3 PASIVAS: ¿CUÁL SUSTITUYE?": "YOU CAN ONLY CARRY 3 PASSIVES: WHICH ONE DOES IT REPLACE?", "EL MENTOR": "THE MENTOR", "HABILIDADES ACTIVAS": "ACTIVE SKILLS", "PASIVAS ACTIVAS": "ACTIVE PASSIVES", "GUARDADAS (ELIGE UNA)": "STORED (PICK ONE)", "GUARDADAS": "STORED", "NINGUNA GUARDADA": "NONE STORED", "ELIGE UN HUECO ACTIVO Y LUEGO LO QUE QUIERES PONER EN ÉL": "PICK AN ACTIVE SLOT, THEN WHAT YOU WANT TO PUT IN IT", "- VACÍO -": "- EMPTY -", "MT MENTOR": "MT MENTOR", "ESTUDIO DEL MENTOR": "THE MENTOR'S STUDY", "LIBROS, VELAS Y UN ANCIANO QUE LO SABE TODO": "BOOKS, CANDLES AND AN OLD MAN WHO KNOWS EVERYTHING", "MARCAS A TU PRESA: RECIBE +50% DE DAÑO": "YOU MARK YOUR PREY: IT TAKES +50% DAMAGE", "ESTÁS DEMASIADO DÉBIL": "YOU ARE TOO WEAK", 'SE ABRE UN PORTAL HACIA LAS PROFUNDIDADES': 'A PORTAL TO THE DEPTHS OPENS',
};
// patrones para textos con números o nombres dentro (los grupos se traducen también)
const EN_RX = [
  [/^RECICLARLO \(\+(\d+) DE ORO\)$/, 'RECYCLE IT (+$1 GOLD)'], [/^RECICLAS (.+): \+(\d+) DE ORO$/, (m, a, n) => `YOU RECYCLE ${tr(a)}: +${n} GOLD`],
  [/^MEJORAR (.+)$/, (m, a) => `UPGRADE ${tr(a)}`], [/^(.+) SUBE A NIVEL (\d+)$/, (m, a, n) => `${tr(a)} RISES TO LEVEL ${n}`],
  [/^HICE UNOS PASOS EXTRAÑOS Y SE ABRIÓ UN PORTAL\. AL OTRO LADO, UN PRADO BAJO TIERRA\.\.\. Y VACAS\. VACAS CON ARMAS\.$/, 'I MADE SOME STRANGE MOVES AND A PORTAL OPENED. ON THE OTHER SIDE, A MEADOW UNDERGROUND... AND COWS. COWS WITH WEAPONS.'],
  [/^ENCONTRÉ UN PRADO BAJO LA MAZMORRA, LLENO DE VACAS ARMADAS\. DERROTÉ A SU REY\. NADIE ME VA A CREER\.$/, 'I FOUND A MEADOW UNDER THE DUNGEON, FULL OF ARMED COWS. I DEFEATED THEIR KING. NOBODY WILL BELIEVE ME.'],
  [/^PACTO: (.+) \(\+(\d+)% DE ORO Y BOTÍN\)$/, (m, a, n) => `PACT: ${tr(a)} (+${n}% GOLD AND LOOT)`], [/^PACTO: (.+)$/, (m, a) => `PACT: ${tr(a)}`], [/^\+(\d+)% ORO Y BOTÍN$/, '+$1% GOLD AND LOOT'],
  [/^(.+) (VELOZ|VAMPÍRICO|EXPLOSIVO|REFLECTANTE|INVOCADOR)$/, (m, a, b) => `${({ VELOZ: 'SWIFT', 'VAMPÍRICO': 'VAMPIRIC', EXPLOSIVO: 'EXPLOSIVE', REFLECTANTE: 'REFLECTING', INVOCADOR: 'SUMMONER' })[b]} ${tr(a)}`],
  [/^LOS ENEMIGOS SE MIDEN CONTIGO: VIDA X([\d.]+) · DAÑO X([\d.]+)$/, 'ENEMIES MEASURE UP TO YOU: HEALTH X$1 · DAMAGE X$2'],
  [/^CADA CAMBIO: (\d+) ORO · TIENES (\d+)$/, 'EACH CHANGE: $1 GOLD · YOU HAVE $2'], 
  [/^NIVEL ([+-]?\d+)$/, 'LEVEL $1'], [/^NV (\d+) (.+)$/, 'LV $1 $2'], [/^NV (\d+)\/3$/, 'LV $1/3'], [/^NV (\d+)$/, 'LV $1'], [/^BOTÍN (\d+)$/, 'LOOT $1'], [/^BOTÍN: (\d+) ORO$/, 'LOOT: $1 GOLD'],
  [/^BASTÓN DE (.+)$/, '$1 STAFF'], [/^ARCO DE (.+)$/, '$1 BOW'], [/^ANTORCHA (\d+:\d+)$/, 'TORCH $1'], [/^ANTORCHAS X(\d+)(.*)$/, 'TORCHES X$1$2'], [/^POCIONES X(\d+)$/, 'POTIONS X$1'],
  [/^PERGAMINOS X(\d+)$/, 'SCROLLS X$1'], [/^RUNAS X(\d+)$/, 'RUNES X$1'], [/^LLAVES (\d+)\/(\d+)$/, 'KEYS $1/$2'], [/^LLAVES: (.+)$/, 'KEYS: $1'], [/^A SALVO: (\d+)$/, 'SAFE: $1'], [/^MOCHILA (\d+)\/8$/, 'BACKPACK $1/8'],
  [/^MANO IZQ\.: (.+)$/, 'LEFT HAND: $1'], [/^(.+) · (\d+) MIN$/, '$1 · $2 MIN'], [/^(.+): VACÍO$/, '$1: EMPTY'], [/^TU ORO: (\d+)$/, 'YOUR GOLD: $1'], [/^(.+) · TIENES (\d+)$/, '$1 · YOU HAVE $2'],
  [/^ESTA TE COSTARÁ (\d+) DE ORO · TIENES (\d+)$/, 'THIS ONE WILL COST YOU $1 GOLD · YOU HAVE $2'], [/^BOTÓN (\d+)$/, 'BUTTON $1'], [/^NUM (\d)$/, 'NUM $1'], [/^TU ARMA: (.+)$/, 'YOUR WEAPON: $1'], [/^(\d+) ORO$/, '$1 GOLD'], [/^MAPA · (.+)$/, 'MAP · $1'],
  [/^ORO A SALVO (\d+) · FUGAS (\d+) · MAYOR BOTÍN (\d+)$/, 'GOLD SAFE $1 · ESCAPES $2 · BEST LOOT $3'], [/^¡NIVEL (\d+)!$/, 'LEVEL $1!'], [/^ARMAS: (.+)$/, 'WEAPONS: $1'], [/^NV (\d+): (.+)$/, 'LV $1: $2'],
  [/^\[(\d)\] (.+)$/, '[$1] $2'], [/^(.+) ALCANZA EL NIVEL (\d+): ELIGE TU DESTINO$/, '$1 REACHES LEVEL $2: CHOOSE YOUR DESTINY'], [/^OLEADA (\d+)\/(\d+)$/, 'WAVE $1/$2'], [/^ABRES LA (.+)$/, 'YOU OPEN THE $1'],
  [/^CERRADA: NECESITAS LA (.+)$/, 'LOCKED: YOU NEED THE $1'], [/^¡(.+) DESPIERTA!$/, '$1 AWAKENS!'], [/^¡(.+) HA CAÍDO!$/, '$1 HAS FALLEN!'], [/^EQUIPAS: (.+)$/, 'EQUIPPED: $1'], [/^(.+) \(MOCHILA\)$/, '$1 (BACKPACK)'],
  [/^FANTASMA DE (.+?)( · NV \d+)?$/, (m, a, b) => `GHOST OF ${tr(a)}${b ? b.replace('NV', 'LV') : ''}`],
  [/^\+(\d+) DE ORO$/, '+$1 GOLD'], [/^RECOGES UNA ANTORCHA \((\d+)\)$/, 'YOU PICK UP A TORCH ($1)'], [/^RECOGES UNA POCIÓN \((\d+)\)$/, 'YOU PICK UP A POTION ($1)'],  [/^UNA POCIÓN TE SALVA DE LA MUERTE \(QUEDAN (\d+)\)$/, 'A POTION SAVES YOU FROM DEATH ($1 LEFT)'], [/^CONSIGUES LA (.+)$/, 'YOU GET THE $1'], [/^ABRES UN COFRE: (\d+) DE ORO$/, 'YOU OPEN A CHEST: $1 GOLD'],
  [/^COMPRAS: (.+) \(-(\d+) DE ORO\)$/, 'BOUGHT: $1 (-$2 GOLD)'], [/^EL HERRERO FORJA (.+) \(NV (\d+)\)(?: POR (\d+) DE ORO)?$/, (m, a, l, c) => `THE BLACKSMITH FORGES ${tr(a)} (LV ${l})${c ? ` FOR ${c} GOLD` : ''}`],
  [/^SE CONSUME LA ANTORCHA\. TE QUEDAN (\d+) \(I\)$/, 'THE TORCH BURNS OUT. YOU HAVE $1 LEFT (I)'], [/^EVOLUCIONAS: (.+)$/, 'YOU EVOLVE: $1'], [/^ENTRAS EN LA MAZMORRA COMO (.+)$/, 'YOU ENTER THE DUNGEON AS $1'],
  [/^EMPUÑAS: (.+?)( \(DOS MANOS\))?$/, (m, a, b) => `YOU WIELD: ${tr(a)}${b ? ' (TWO HANDS)' : ''}`], [/^FLECHAS DE (.+)$/, '$1 ARROWS'], [/^LA (.+) GIRA EN LA (.+)$/, 'THE $1 TURNS IN THE $2'],
  [/^UN FANTASMA RENCOROSO DE NIVEL (\d+) TE RECONOCE\.\.\.$/, 'A VENGEFUL GHOST OF LEVEL $1 RECOGNIZES YOU...'], [/^(.+): (\d+) NIVELES$/, '$1: $2 LEVELS'], [/^MANDO CONECTADO: (.+)$/, 'CONTROLLER CONNECTED: $1'],
  [/^(.+) · (COMÚN|RARO|ÉPICO|LEGENDARIO)$/, '$1 · $2'], [/^(.+) · (COMÚN|RARO|ÉPICO|LEGENDARIO): (.+)$/, '$1 · $2: $3'],
  [/^LLEVAS \((.+)\)$/, 'EQUIPPED ($1)'], [/^DOPPELGANGER \((.+)\)$/, 'DOPPELGANGER ($1)'], [/^¡OLEADA (\d+)!$/, 'WAVE $1!'], [/^OLEADA (\d+): (\d+) ENEMIGOS SALEN DE LAS SOMBRAS$/, 'WAVE $1: $2 ENEMIES EMERGE FROM THE SHADOWS'], [/^SET (.+) \((\d)\/5\)$/, 'SET $1 ($2/5)'], [/^(.+) \((\d)\/5\)$/, '$1 ($2/5)'], [/^DEJAS (.+) EN EL SUELO$/, 'YOU LEAVE $1 ON THE FLOOR'], [/^CAMBIAR POR EL (.+)$/, 'REPLACE $1'], [/^NO LA LLEVAS EN LA MANO \((.+)\)$/, (m, a) => `NOT IN YOUR HAND (${tr(a)})`],
  [/^(.+) SE HACE PEDAZOS$/, '$1 SHATTERS'], [/^DEJAS (.+): SE HACE PEDAZOS$/, 'YOU LEAVE $1: IT SHATTERS'], [/^ARMA: (.+)$/, 'WEAPON: $1'], [/^(.+): VACÍO$/, '$1: EMPTY'],
  [/^\+(\d+)% DE DAÑO$/, '+$1% DAMAGE'], [/^\+(\d+)% DE CRÍTICO$/, '+$1% CRIT CHANCE'], [/^\+(\d+)% DE VELOCIDAD DE ATAQUE$/, '+$1% ATTACK SPEED'], [/^\+(\d+)% DE VIDA MÁXIMA$/, '+$1% MAX HEALTH'],
  [/^\+([\d.]+) DE VIDA POR SEGUNDO$/, '+$1 HEALTH PER SECOND'], [/^\+(\d+)% DE EXPERIENCIA$/, '+$1% EXPERIENCE'], [/^\+(\d+)% DE ALCANCE DE LA ANTORCHA$/, '+$1% TORCH RANGE'], [/^-(\d+)% DE DAÑO RECIBIDO$/, '-$1% DAMAGE TAKEN'],
  [/^\+(\d+)% DE VELOCIDAD$/, '+$1% SPEED'], [/^ESQUIVA (\d+)% MÁS RÁPIDO$/, 'DODGE $1% FASTER'],
  [/^APRENDES (.+) \(([RCV])\)$/, 'YOU LEARN $1 ($2)'], [/^APRENDES (.+) \(NV (\d+)\)$/, 'YOU LEARN $1 (LV $2)'],
  [/^(.+) SUSTITUYE A (.+)$/, '$1 REPLACES $2'], [/^GUARDAS (.+): EL MENTOR TE AYUDARÁ A USARLA$/, 'YOU KEEP $1: THE MENTOR WILL HELP YOU USE IT'],
  [/^EL MENTOR TE ENSEÑA A USAR (.+?)(?: EN LUGAR DE (.+))?$/, (m, a, b) => `THE MENTOR TEACHES YOU TO USE ${tr(a)}${b ? ` INSTEAD OF ${tr(b)}` : ''}`],
  [/^EL MENTOR DESPIERTA (.+?)(?: Y ADORMECE (.+))?$/, (m, a, b) => `THE MENTOR AWAKENS ${tr(a)}${b ? ` AND LULLS ${tr(b)}` : ''}`],
  [/^UN VIEJO MENTOR ESTUDIA SUS LIBROS EN EL (.+)\. POR UN POCO DE ORO ME AYUDA A ELEGIR QUÉ TÉCNICAS LLEVAR\.$/, (m, l) => `AN OLD MENTOR STUDIES HIS BOOKS ON ${tr(l)}. FOR A LITTLE GOLD HE HELPS ME CHOOSE WHICH TECHNIQUES TO CARRY.`],
  // diario (frases completas)
  [/^LLEGO A (.+)\. DICEN QUE SUS NIVELES GUARDAN RIQUEZAS OLVIDADAS\.\.\. Y UN GUARDIÁN\. DEBO SALIR CON VIDA Y CON EL BOTÍN\.$/, (m, a) => `I REACH ${tr(a)}. THEY SAY ITS LEVELS HOLD FORGOTTEN RICHES... AND A GUARDIAN. I MUST GET OUT ALIVE, WITH THE LOOT.`],
  [/^(BAJÉ|SUBÍ) AL (.+?)\. (.+?): (.+)$/, (m, v, l, t, rest) => `I WENT ${v === 'BAJÉ' ? 'DOWN' : 'UP'} TO ${tr(l)}. ${tr(t)}: ${({ 'EL AIRE HUELE A TIERRA HÚMEDA Y A MUERTE.': 'THE AIR SMELLS OF DAMP EARTH AND DEATH.', 'CORRIENTES DE AIRE FRÍO RECORREN LOS PASILLOS.': 'COLD DRAFTS RUN THROUGH THE HALLS.', 'LA LUZ DE LA ENTRADA AÚN SE ADIVINA.': 'THE LIGHT OF THE ENTRANCE CAN STILL BE SEEN.' })[rest] || rest}`],
  [/^EN EL (.+), (.+) HAY UNA PUERTA CON (.+)\. NECESITO LA (.+)\.$/, (m, l, w, k, n) => `ON ${tr(l)}, ${tr(w)}, THERE IS A DOOR WITH A ${tr(k)}. I NEED THE ${tr(n)}.`],
  [/^LA PARED SONABA HUECA EN EL (.+), (.+): ESCONDÍA UN PASADIZO SECRETO\.$/, (m, l, w) => `THE WALL SOUNDED HOLLOW ON ${tr(l)}, ${tr(w)}: IT HID A SECRET PASSAGE.`],
  [/^LAS REJAS DE LA ARENA DEL (.+) SE CERRARON A MI ESPALDA\. SOBREVIVÍ A TRES OLEADAS Y ME LLEVÉ SU PREMIO\.$/, (m, l) => `THE ARENA BARS ON ${tr(l)} CLOSED BEHIND ME. I SURVIVED THREE WAVES AND TOOK ITS PRIZE.`],
  [/^RECÉ ANTE UN ALTAR OLVIDADO DEL (.+)\. SUS VELAS SE APAGARON, PERO SENTÍ SU BENDICIÓN\.$/, (m, l) => `I PRAYED BEFORE A FORGOTTEN ALTAR ON ${tr(l)}. ITS CANDLES WENT OUT, BUT I FELT ITS BLESSING.`],
  [/^ENCONTRÉ LA (.+) EN EL (.+), (.+)\.$/, (m, k, l, w) => `I FOUND THE ${tr(k)} ON ${tr(l)}, ${tr(w)}.`],
  [/^(.+), GUARDIÁN DE (.+), HA CAÍDO\. SOLO QUEDA VOLVER A LA SALIDA CON VIDA\.$/, (m, a, d) => `${tr(a)}, GUARDIAN OF ${tr(d)}, HAS FALLEN. ALL THAT REMAINS IS TO REACH THE EXIT ALIVE.`],
  [/^UN VIEJO PERGAMINO ME MOSTRÓ TODOS LOS PASILLOS DEL (.+)\.$/, (m, l) => `AN OLD SCROLL SHOWED ME EVERY HALL OF ${tr(l)}.`],
  [/^UN MERCADER ENCAPUCHADO VENDE SUS ÚTILES EN EL (.+)\. DICE QUE LA OSCURIDAD ES BUEN NEGOCIO\.$/, (m, l) => `A HOODED MERCHANT SELLS HIS WARES ON ${tr(l)}. HE SAYS DARKNESS IS GOOD FOR BUSINESS.`],
  [/^UN HERRERO HA MONTADO SU YUNQUE EN EL (.+)\. LA PRIMERA MEJORA ME LA REGALA\.$/, (m, l) => `A BLACKSMITH HAS SET UP HIS ANVIL ON ${tr(l)}. THE FIRST UPGRADE IS FREE.`],
  [/^EL HERRERO TEMPLÓ MI ARMA: (.+), NIVEL (\d+)\.$/, (m, a, l) => `THE BLACKSMITH TEMPERED MY WEAPON: ${tr(a)}, LEVEL ${l}.`],
  [/^ENCONTRÉ (.+) EN EL (.+)\. SIENTO SU PODER\.$/, (m, a, l) => `I FOUND ${tr(a)} ON ${tr(l)}. I FEEL ITS POWER.`],
  [/^EL FANTASMA RENCOROSO DE UN (.+) \(NIVEL (\d+)\) GUARDABA UN TESORO(?:; CAYÓ EN (.+))?\. YA DESCANSA\.$/, (m, c, l, w) => `THE VENGEFUL GHOST OF A ${tr(c)} (LEVEL ${l}) GUARDED A TREASURE${w ? `; IT FELL IN ${tr(w)}` : ''}. IT RESTS NOW.`],
  [/^HABILIDADES · (.+)$/, (m, a) => `SKILLS · ${tr(a)}`], [/^ALMAS (\d+)$/, 'SOULS $1'],
  [/^\?\?\? \(DESBLOQUEO CON ALMA DE GUARDIÁN\)$/, '??? (UNLOCK WITH A GUARDIAN SOUL)'], [/^\?\?\? \((\d+) ALMAS DE GUARDIÁN\)$/, '??? ($1 GUARDIAN SOULS)'],
  [/^EVOLUCIÓN: NV (\d+) \+ 1 ALMA$/, 'EVOLUTION: LV $1 + 1 SOUL'], [/^EVOLUCIÓN: NV (\d+) \+ (\d+) ALMAS$/, 'EVOLUTION: LV $1 + $2 SOULS'],
  [/^¡ALMA DE GUARDIÁN!$/, 'GUARDIAN SOUL!'], [/^ABSORBES UN ALMA DE GUARDIÁN \((\d+)\)$/, 'YOU ABSORB A GUARDIAN SOUL ($1)'],
  [/^ABSORBÍ EL ALMA DEL GUARDIÁN\. SIENTO QUE PUEDO LLEGAR MÁS LEJOS \(ALMAS: (\d+)\)\.$/, 'I ABSORBED THE GUARDIAN\'S SOUL. I FEEL I CAN GO FURTHER (SOULS: $1).'],
  [/^(.+) (II|III|IV)$/, (m, a, b) => `${tr(a)} ${b}`],
];
// fragmentos sueltos (nombres compuestos que no están en ningún diccionario)
const EN_FRAG = [[/\bNIVEL ([+-]?\d+)/g, 'LEVEL $1'], [/\bALA NORESTE\b/g, 'NORTHEAST WING'], [/\bALA NOROESTE\b/g, 'NORTHWEST WING'], [/\bALA SURESTE\b/g, 'SOUTHEAST WING'], [/\bALA SUROESTE\b/g, 'SOUTHWEST WING'],
  [/\bALA NORTE\b/g, 'NORTH WING'], [/\bALA SUR\b/g, 'SOUTH WING'], [/\bALA ESTE\b/g, 'EAST WING'], [/\bALA OESTE\b/g, 'WEST WING'], [/\bCENTRO\b/g, 'CENTER']];

let NAME_MAP = null; // nombres de datos en español (mayúsculas) → inglés
function buildNameMap() {
  const m = {}, E = EN_DATA, S = ES_DATA, put = (es, en) => { if (es && en) m[String(es).toUpperCase()] = String(en).toUpperCase(); };
  for (const k in S.classes) put(S.classes[k][0], E.classes[k] && E.classes[k][0]);
  for (const k in S.skills) put(S.skills[k], E.skills[k]);
  for (const k in S.spells) put(S.spells[k], E.spells[k]);
  for (const k in S.weapons) put(S.weapons[k], E.weapons[k]);
  for (const k in S.enemies) put(S.enemies[k], E.enemies[k]);
  for (const k in S.upg) put(S.upg[k][0], E.upg[k] && E.upg[k][0]);
  S.themes.forEach((t, i) => put(t, E.themes[i]));
  S.keys.forEach((k, i) => { put(k[0], E.keys[i][0]); put(k[1], E.keys[i][1]); });
  for (const k in S.forge) put(S.forge[k][0], E.forge[k][0]);
  for (const k in S.shop) put(S.shop[k][0], E.shop[k][0]);
  for (const k in S.rarity) put(S.rarity[k], E.rarity[k]);
  for (const sl in S.epic) put(S.epic[sl][0], E.epic[sl][0]);
  for (const sl in S.slots) put(S.slots[sl], E.slots[sl]);
  for (const k in S.legend) { const a = S.legend[k][0], b = E.legend[k] && E.legend[k][0]; if (typeof a === 'string') put(a, b); else if (a && b) for (const w in a) put(a[w], b[w]); }
  for (const k in S.sets) put(S.sets[k][0], E.sets[k] && E.sets[k][0]);
  for (const k in S.slotLabel) put(S.slotLabel[k], E.slotLabel[k]);
  for (const k in S.elements) put(S.elements[k], E.elements[k]);
  NAME_MAP = m;
  // nombres de mazmorra y de objetos (prefijo + sufijo) como patrones
  const esc = (s) => s.toUpperCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  DG_RX = new RegExp(`^(${S.dgPre.map(esc).join('|')}) (${S.dgSuf.map(esc).join('|')})$`);
  const bases = [], afx = [];
  for (const sl in S.baseName) S.baseName[sl].forEach((b, i) => bases.push([b.toUpperCase(), E.baseName[sl][i].toUpperCase()]));
  for (const sl in S.affix) S.affix[sl].forEach((a, i) => afx.push([a[0].toUpperCase(), E.affix[sl][i][0].toUpperCase()]));
  for (const [es, en] of afx.slice()) { const g = /A$/.test(es) ? es.slice(0, -1) + 'O' : /O$/.test(es) ? es.slice(0, -1) + 'A' : null; if (g && !es.includes(' ')) afx.push([g, en]); }
  ITEM_RX = new RegExp(`^(${bases.map(b => esc(b[0])).join('|')}) (${afx.map(a => esc(a[0])).join('|')})$`);
  ITEM_MAP = Object.fromEntries(bases.concat(afx));
}
let DG_RX = null, ITEM_RX = null, ITEM_MAP = null;

// traducir un texto (cualquier mayúscula/minúscula); devuelve en mayúsculas si hay traducción
const TR_CACHE = new Map();
function tr(s) {
  if (LANG === 'es' || s === undefined || s === null) return s;
  s = String(s);
  const hit = TR_CACHE.get(s); if (hit !== undefined) return hit;
  const out = tr0(s);
  if (TR_CACHE.size > 4000) TR_CACHE.clear();
  TR_CACHE.set(s, out);
  return out;
}
function tr0(s) {
  const U = s.toUpperCase();
  if (EN_UI[U]) return EN_UI[U];
  if (NAME_MAP && NAME_MAP[U]) return NAME_MAP[U];
  if (DG_RX) { const m = U.match(DG_RX); if (m) { const i = ES_DATA.dgPre.findIndex(p => p.toUpperCase() === m[1]), j = ES_DATA.dgSuf.findIndex(p => p.toUpperCase() === m[2]); return `${EN_DATA.dgPre[i]} ${EN_DATA.dgSuf[j]}`.toUpperCase(); } }
  if (ITEM_RX) { const m = U.match(ITEM_RX); if (m) return `${ITEM_MAP[m[1]]} ${ITEM_MAP[m[2]]}`; }
  for (const [rx, rep] of EN_RX) {
    if (!rx.test(U)) continue;
    if (typeof rep === 'function') return U.replace(rx, rep);
    return U.replace(rx, (...a) => rep.replace(/\$(\d)/g, (_, n) => tr(a[+n]) || ''));
  }
  let out = U, changed = false;
  for (const [rx, rep] of EN_FRAG) { const o = out.replace(rx, rep); if (o !== out) { out = o; changed = true; } }
  return changed ? out : s;
}

function setLang(l) {
  if (!ES_DATA) { snapshotData(); buildNameMap(); }
  LANG = LANGS.includes(l) ? l : 'es'; TR_CACHE.clear();
  applyData(LANG === 'en' ? EN_DATA : ES_DATA);
  document.documentElement.lang = LANG;
  const ro = document.getElementById('rotate'); if (ro) ro.innerHTML = LANG === 'en' ? 'TURN YOUR PHONE<br>TO PLAY IN LANDSCAPE' : 'GIRA EL MÓVIL<br>PARA JUGAR EN HORIZONTAL';
  if (typeof applyBindings === 'function') applyBindings();
}
