// Controles reasignables (teclado y mando). El juego trabaja siempre con las teclas "de fábrica":
// la tecla física que pulsa el jugador se traduce a la de fábrica de la acción que tiene asignada.
const ACTIONS = [
  { id: 'up', key: 'KeyW', pad: null }, { id: 'down', key: 'KeyS', pad: null },
  { id: 'left', key: 'KeyA', pad: null }, { id: 'right', key: 'KeyD', pad: null },
  { id: 'turnL', key: 'KeyQ', pad: null }, { id: 'turnR', key: 'KeyE', pad: null },
  { id: 'attack', key: 'Space', pad: 7 }, { id: 'block', key: null, pad: 6 }, { id: 'dash', key: 'ShiftLeft', pad: 0 },
  { id: 'skill1', key: 'KeyR', pad: 2 }, { id: 'skill2', key: 'KeyC', pad: 3 }, { id: 'skill3', key: 'KeyV', pad: 1 },
  { id: 'shield', key: 'KeyF', pad: 4 }, { id: 'weapon', key: null, pad: 5 }, { id: 'potion', key: 'KeyH', pad: 12 },
  { id: 'map', key: 'KeyM', pad: 13 }, { id: 'journal', key: 'KeyJ', pad: 14 }, { id: 'inventory', key: 'KeyI', pad: 15 },
  { id: 'pause', key: 'KeyP', pad: 9 },
];
const ACTION_NAME = { up: 'Avanzar', down: 'Retroceder', left: 'Paso a la izq.', right: 'Paso a la der.', turnL: 'Girar a la izq.', turnR: 'Girar a la der.', attack: 'Atacar', block: 'Bloquear', dash: 'Esquivar', skill1: 'Habilidad 1', skill2: 'Habilidad 2', skill3: 'Habilidad 3', shield: 'Escudo', weapon: 'Cambiar arma', potion: 'Beber poción', map: 'Mapa', journal: 'Diario', inventory: 'Inventario', pause: 'Pausa' };
const PAD_NAME = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'SELECT', 'START', 'L3', 'R3', 'CRUZ ARRIBA', 'CRUZ ABAJO', 'CRUZ IZQ.', 'CRUZ DER.', 'HOME'];
const DEFAULT_KEY = Object.fromEntries(ACTIONS.map(a => [a.id, a.key]));
const DEFAULT_PAD = Object.fromEntries(ACTIONS.map(a => [a.id, a.pad]));

function keyLabel(code) {
  if (!code) return '-';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'NUM ' + code.slice(6);
  const m = { Space: 'ESPACIO', ShiftLeft: 'SHIFT', ShiftRight: 'SHIFT DER.', ControlLeft: 'CTRL', ControlRight: 'CTRL DER.', AltLeft: 'ALT', Tab: 'TAB', Enter: 'INTRO', ArrowUp: 'FLECHA ARRIBA', ArrowDown: 'FLECHA ABAJO', ArrowLeft: 'FLECHA IZQ.', ArrowRight: 'FLECHA DER.', Backspace: 'RETROCESO', CapsLock: 'BLOQ MAYÚS', Backquote: 'º', Minus: '-', Equal: '=', Comma: ',', Period: '.', Slash: '-' };
  return m[code] || code.toUpperCase();
}
function padLabel(i) { return i === null || i === undefined ? '-' : (PAD_NAME[i] || 'BOTÓN ' + i); }
function bindKeys() { return Object.assign({}, DEFAULT_KEY, (G.cfg && G.cfg.keys) || {}); }
function bindPad() { return Object.assign({}, DEFAULT_PAD, (G.cfg && G.cfg.pad) || {}); }
function padBtn(id) { return bindPad()[id]; }

// tecla física → tecla de fábrica (null = tecla de fábrica cuya acción se movió a otra: se ignora)
function translateKey(code) {
  const kb = bindKeys();
  for (const id in kb) if (kb[id] === code) return DEFAULT_KEY[id] || code;
  if (Object.values(DEFAULT_KEY).includes(code)) return null;
  return code;
}
// asignar; si otra acción ya la usaba, se intercambian
function rebind(dev, id, val) {
  const cfg = G.cfg, tbl = dev === 'key' ? (cfg.keys = bindKeys()) : (cfg.pad = bindPad());
  const other = Object.keys(tbl).find(k => k !== id && tbl[k] === val);
  if (other) tbl[other] = tbl[id];
  tbl[id] = val;
  applyBindings(); saveCfg();
}
function resetBindings() { G.cfg.keys = {}; G.cfg.pad = {}; applyBindings(); saveCfg(); }
// etiquetas de habilidades en el HUD según lo asignado
function applyBindings() {
  const kb = bindKeys(), pb = bindPad();
  ['skill1', 'skill2', 'skill3'].forEach((id, i) => { SKILL_LABEL[i] = G.padMode ? padLabel(pb[id]) : keyLabel(kb[id]); });
}
