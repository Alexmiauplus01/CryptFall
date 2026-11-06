// Niveles de mazmorra (estilo Daggerfall): salas de varias formas unidas por pasillos sinuosos (A* con coste
// ruidoso), callejones sin salida, puertas, puertas con llave, muros secretos, escaleras y la salida.
// La mazmorra completa (varios niveles, llaves y contenido) se monta en dungeon.js.
const MW = 64, MH = 64;
const LS = 4, LG = MW * LS; // resolución del mapa de luz (subceldas por celda)

const LIGHT_FIRE = [0.95, 0.55, 0.24];
// luz de los decorados que brillan: [color, radio]
const DECOR_LIGHT = {
  fountain: [[0.35, 0.65, 1.1], 3.6], mushroom: [[0.3, 1.0, 0.6], 2.8], mushroomB: [[0.3, 0.7, 1.2], 2.8],
  ritual: [[1.2, 0.25, 0.18], 4.2], icecrystal: [[0.5, 0.85, 1.25], 3.2],
};

// celdas especiales (son pared a efectos de colisión y de rayos)
const W_DOOR = 9, W_LOCK = 10, W_UP = 13, W_DOWN = 14, W_EXIT = 15, W_BARS = 16;
const KEYS = [
  { id: 'hierro', name: 'Llave de hierro', lock: 'cerradura de hierro', col: [196, 206, 220] },
  { id: 'hueso', name: 'Llave de hueso', lock: 'cerradura de hueso', col: [244, 226, 172] },
  { id: 'runica', name: 'Llave rúnica', lock: 'cerradura rúnica', col: [110, 205, 255] },
];
const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

class Level {
  constructor(z, theme) {
    this.z = z; this.theme = theme;
    this.cells = new Uint8Array(MW * MH).fill(1); // 0 suelo, >0 id de textura de pared
    this.floorTex = new Uint8Array(MW * MH);
    this.roomOf = new Int16Array(MW * MH).fill(-1);
    this.rooms = [];
    this.floorCells = [];
    this.decor = [];
    this.lights = [];
    this.openings = new Map(); // celda del hueco de una sala → { rooms: [índices] }
    this.locks = new Map();    // celda → índice de llave
    this.secret = new Set();   // muros que se abren al tocarlos
    this.stairs = new Map();   // celda → { dz, to: enlace }
    this.exit = -1;
    this.spikes = [];
    this.shrines = [];
    this.npcs = [];
    this.seen = new Uint8Array(MW * MH);
    this.state = { enemies: [], pickups: [], traps: [], zones: [] };
  }

  at(x, y) { return (x < 0 || y < 0 || x >= MW || y >= MH) ? 1 : this.cells[y * MW + x]; }
  solid(x, y) { return this.at(Math.floor(x), Math.floor(y)) !== 0; }
  carve(x, y) { if (x > 0 && y > 0 && x < MW - 1 && y < MH - 1) this.cells[y * MW + x] = 0; }

  // forma de la sala: rectángulo, cruz (sin esquinas) o redonda
  inRoom(r, x, y) {
    if (x < r.x || y < r.y || x >= r.x + r.w || y >= r.y + r.h) return false;
    if (r.shape === 'cross') {
      const q = r.q, lx = x - r.x, ly = y - r.y;
      return !((lx < q || lx >= r.w - q) && (ly < q || ly >= r.h - q));
    }
    if (r.shape === 'round') {
      const dx = (x + 0.5 - (r.x + r.w / 2)) / (r.w / 2), dy = (y + 0.5 - (r.y + r.h / 2)) / (r.h / 2);
      return dx * dx + dy * dy <= 1.08;
    }
    return true;
  }

  // ---------------------------------------------------------------- trazado
  layout(nRooms, seed) {
    for (let tryN = 0; tryN < 30; tryN++) {
      this.cells.fill(1); this.roomOf.fill(-1); this.rooms = []; this.openings.clear();
      if (this.tryLayout(nRooms, seed + tryN * 101)) return true;
    }
    return false;
  }

  tryLayout(nRooms, seed) {
    const rooms = this.rooms;
    // salas: alguna grande (salón), el resto medianas y pequeñas
    for (let i = 0; i < 400 && rooms.length < nRooms; i++) {
      const big = rooms.length < 2 && Math.random() < 0.7;
      const w = big ? randi(9, 13) : randi(4, 9), h = big ? randi(9, 13) : randi(4, 9);
      const x = randi(3, MW - w - 3), y = randi(3, MH - h - 3);
      if (rooms.some(r => x < r.x + r.w + 3 && x + w + 3 > r.x && y < r.y + r.h + 3 && y + h + 3 > r.y)) continue;
      const shape = w >= 7 && h >= 7 && Math.random() < 0.3 ? 'cross' : w >= 6 && h >= 6 && Math.abs(w - h) <= 2 && Math.random() < 0.22 ? 'round' : 'rect';
      rooms.push({ x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1), shape, q: Math.max(2, Math.floor(Math.min(w, h) / 3)), floor: pick([0, 0, 2, 2, 1]), doors: [], type: 'normal' });
    }
    if (rooms.length < Math.max(5, nRooms - 3)) return false;
    rooms.forEach((r, ri) => { for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (this.inRoom(r, x, y)) { this.carve(x, y); this.roomOf[y * MW + x] = ri; } });
    this.buildMask();
    // árbol de expansión mínima (Prim) + algunos bucles
    const n = rooms.length, inT = [0], edges = [];
    const dist = (a, b) => Math.hypot(rooms[a].cx - rooms[b].cx, rooms[a].cy - rooms[b].cy);
    while (inT.length < n) {
      let best = null, bd = 1e9;
      for (const a of inT) for (let b = 0; b < n; b++) if (!inT.includes(b)) { const d = dist(a, b); if (d < bd) { bd = d; best = [a, b]; } }
      inT.push(best[1]); edges.push(best);
    }
    for (let k = 0; k < Math.ceil(n * 0.25); k++) {
      const a = randi(0, n - 1), b = randi(0, n - 1);
      if (a !== b && dist(a, b) < 26 && !edges.some(e => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a))) edges.push([a, b]);
    }
    this.noise = new Float32Array(MW * MH);
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) this.noise[y * MW + x] = vnoise(x / 4.5, y / 4.5, seed, 64) * 2.2 + hash2(x, y, seed) * 0.9;
    for (const [a, b] of edges) if (!this.connect(a, b)) return false;
    // callejones sin salida
    for (let k = 0; k < randi(3, 6); k++) this.deadEnd();
    // conexión total
    const seen = this.flood(rooms[0].cx, rooms[0].cy);
    return rooms.every(r => seen[r.cy * MW + r.cx]);
  }

  // máscara: celdas que un pasillo no puede pisar (salas y su anillo, y el borde del mapa)
  buildMask() {
    this.mask = new Uint8Array(MW * MH);
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (x < 2 || y < 2 || x >= MW - 2 || y >= MH - 2) this.mask[y * MW + x] = 1;
    for (const r of this.rooms) for (let y = r.y - 1; y <= r.y + r.h; y++) for (let x = r.x - 1; x <= r.x + r.w; x++) this.mask[y * MW + x] = 1;
  }

  // hueco en la pared de la sala r que mira hacia (tx, ty)
  doorFor(ri, tx, ty) {
    const r = this.rooms[ri], dx = tx - r.cx, dy = ty - r.cy;
    const side = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'E' : 'W') : (dy > 0 ? 'S' : 'N');
    const reuse = r.doors.find(d => d.side === side);
    if (reuse && Math.random() < 0.55) return reuse;
    for (let k = 0; k < 12; k++) {
      let x, y, ix, iy;
      const mid = k > 8; // al final, el centro del lado (siempre dentro de cruces y círculos)
      if (side === 'E' || side === 'W') {
        y = mid ? r.cy : randi(r.y + (r.h >> 2), r.y + r.h - 1 - (r.h >> 2));
        x = side === 'E' ? r.x + r.w : r.x - 1; ix = side === 'E' ? x - 1 : x + 1; iy = y;
        // en salas con forma, el hueco va pegado a la celda de la sala más cercana
        while (!this.inRoom(r, ix, iy) && ix > r.x && ix < r.x + r.w - 1) { ix += side === 'E' ? -1 : 1; x += side === 'E' ? -1 : 1; }
      } else {
        x = mid ? r.cx : randi(r.x + (r.w >> 2), r.x + r.w - 1 - (r.w >> 2));
        y = side === 'S' ? r.y + r.h : r.y - 1; iy = side === 'S' ? y - 1 : y + 1; ix = x;
        while (!this.inRoom(r, ix, iy) && iy > r.y && iy < r.y + r.h - 1) { iy += side === 'S' ? -1 : 1; y += side === 'S' ? -1 : 1; }
      }
      if (!this.inRoom(r, ix, iy)) continue;
      if (r.doors.some(d => Math.abs(d.x - x) + Math.abs(d.y - y) < 3)) continue;
      // casilla de salida del pasillo (fuera de la sala y su anillo)
      const ox = x + (side === 'E' ? 1 : side === 'W' ? -1 : 0), oy = y + (side === 'S' ? 1 : side === 'N' ? -1 : 0);
      const d = { x, y, side, ox, oy, room: ri };
      r.doors.push(d);
      return d;
    }
    return null;
  }

  connect(a, b) {
    const A = this.rooms[a], B = this.rooms[b];
    const da = this.doorFor(a, B.cx, B.cy), db = this.doorFor(b, A.cx, A.cy);
    if (!da || !db) return false;
    const path = this.astar(da.ox, da.oy, db.ox, db.oy);
    if (!path) return false;
    for (const i of path) this.cells[i] = 0;
    for (const d of [da, db]) {
      const i = d.y * MW + d.x;
      this.cells[i] = 0;
      const o = this.openings.get(i) || { rooms: [] };
      if (!o.rooms.includes(d.room)) o.rooms.push(d.room);
      this.openings.set(i, o);
    }
    return true;
  }

  // A* en 4 direcciones; coste ruidoso para que los pasillos serpenteen y reaprovechen los ya excavados
  astar(sx, sy, tx, ty) {
    const N = MW * MH, g = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    const s = sy * MW + sx, t = ty * MW + tx;
    if (this.mask[s] || this.mask[t]) return null;
    const heap = [];
    const push = (i, f) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
    g[s] = 0; push(s, 0);
    while (heap.length) {
      const [, c] = pop();
      if (closed[c]) continue;
      if (c === t) break;
      closed[c] = 1;
      const cx = c % MW, cy = (c / MW) | 0;
      for (const [dx, dy] of DIRS4) {
        const X = cx + dx, Y = cy + dy, n = Y * MW + X;
        if (X < 0 || Y < 0 || X >= MW || Y >= MH || closed[n] || (this.mask[n] && n !== t)) continue;
        // pasillo ya excavado: barato (se forman cruces); roca: coste con ruido
        let cost = this.cells[n] === 0 ? 0.45 : 1 + this.noise[n];
        if (from[c] >= 0 && (from[c] - c) !== (c - n)) cost += 0.35; // giro
        const ng = g[c] + cost;
        if (ng < g[n]) { g[n] = ng; from[n] = c; push(n, ng + (Math.abs(X - tx) + Math.abs(Y - ty)) * 0.9); }
      }
    }
    if (from[t] < 0 && s !== t) return null;
    const out = [];
    for (let c = t; c >= 0; c = from[c]) { out.push(c); if (c === s) break; }
    return out;
  }

  deadEnd() {
    const corr = [];
    for (let i = 0; i < MW * MH; i++) if (this.cells[i] === 0 && !this.mask[i]) corr.push(i);
    if (!corr.length) return;
    let c = pick(corr), [dx, dy] = pick(DIRS4);
    const len = randi(3, 9);
    for (let k = 0; k < len; k++) {
      const x = (c % MW) + dx, y = ((c / MW) | 0) + dy, n = y * MW + x;
      if (this.mask[n]) break;
      // no abrir junto a otro pasillo (evita huecos raros)
      let side = 0;
      for (const [ex, ey] of DIRS4) if (!(ex === -dx && ey === -dy) && this.at(x + ex, y + ey) === 0) side++;
      if (side) break;
      this.cells[n] = 0; c = n;
      if (Math.random() < 0.25) [dx, dy] = Math.random() < 0.5 ? [dy, dx] : [-dy, -dx];
    }
  }

  // sala secreta pequeña unida por un pasillo que termina en un muro falso
  addSecretRoom() {
    for (let k = 0; k < 200; k++) {
      const w = randi(4, 5), h = randi(4, 5), x = randi(3, MW - w - 3), y = randi(3, MH - h - 3);
      let ok = true;
      for (let j = y - 3; j < y + h + 3 && ok; j++) for (let i = x - 3; i < x + w + 3; i++) if (this.at(i, j) === 0) { ok = false; break; }
      if (!ok) continue;
      const ri = this.rooms.length;
      const r = { x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1), shape: 'rect', q: 2, floor: 2, doors: [], type: 'secreta' };
      this.rooms.push(r);
      // sala más cercana a la que unirla
      let best = 0, bd = 1e9;
      for (let i = 0; i < ri; i++) { const d = Math.hypot(this.rooms[i].cx - r.cx, this.rooms[i].cy - r.cy); if (d < bd && this.rooms[i].type !== 'secreta') { bd = d; best = i; } }
      if (bd > 22) { this.rooms.pop(); continue; }
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { this.carve(i, j); this.roomOf[j * MW + i] = ri; }
      this.buildMask();
      const before = this.cells.slice(), openBefore = new Map(this.openings);
      if (!this.connect(ri, best)) {
        this.cells.set(before); this.openings = openBefore; this.rooms.pop();
        for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { this.cells[j * MW + i] = 1; this.roomOf[j * MW + i] = -1; }
        this.buildMask(); continue;
      }
      const d = r.doors[0], i = d.y * MW + d.x;
      this.secret.add(i); this.openings.delete(i); this.cells[i] = 1;
      return r;
    }
    return null;
  }

  flood(sx, sy, pass) {
    const seen = new Uint8Array(MW * MH), q = [sy * MW + sx];
    seen[q[0]] = 1;
    while (q.length) {
      const c = q.pop(), cx = c % MW, cy = (c / MW) | 0;
      for (const [dx, dy] of DIRS4) {
        const n = (cy + dy) * MW + cx + dx;
        if (seen[n] || cx + dx < 0 || cy + dy < 0 || cx + dx >= MW || cy + dy >= MH) continue;
        if (this.cells[n] !== 0 && !(pass && pass(n))) continue;
        seen[n] = 1; q.push(n);
      }
    }
    return seen;
  }

  // ---------------------------------------------------------------- texturas de pared y suelo
  paint(seed) {
    this.floorCells = [];
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const i = y * MW + x;
      if (this.cells[i] === 0) {
        const r = this.roomOf[i];
        this.floorTex[i] = r >= 0 ? this.rooms[r].floor : (vnoise(x / 4, y / 4, seed + 3, 64) > 0.55 ? 3 : 1);
      } else {
        const n = vnoise(x / 5, y / 5, seed, 64), hh = hash2(x, y, seed + 1);
        this.cells[i] = hh < 0.02 ? 3 : hh < 0.05 ? 8 : n > 0.6 ? 2 : 1;
      }
    }
    for (const i of this.secret) { const x = i % MW, y = (i / MW) | 0; this.floorTex[i] = 1; if (this.cells[i] === 3) this.cells[i] = 1; }
    // rejas en paredes de pasillo
    for (let i = 0; i < MW * MH; i++) {
      if (this.cells[i] !== 0 || this.roomOf[i] >= 0) continue;
      for (const [dx, dy] of DIRS4) {
        const j = i + dy * MW + dx;
        if (this.cells[j] === 1 && !this.secret.has(j) && Math.random() < 0.04) this.cells[j] = 7;
      }
    }
  }

  // ¿celda de pared corriente (sin nada especial)?
  plainWall(i) { const v = this.cells[i]; return v >= 1 && v <= 8 && v !== 4 && v !== 5 && !this.secret.has(i); }

  // coloca un elemento de pared (escalera, salida) en el perímetro de la sala; devuelve la llegada
  placeOnWall(ri, id) {
    const r = this.rooms[ri], cand = [];
    for (let y = r.y - 1; y <= r.y + r.h; y++) for (let x = r.x - 1; x <= r.x + r.w; x++) {
      const i = y * MW + x;
      if (!this.plainWall(i)) continue;
      for (const [dx, dy] of DIRS4) {
        const ix = x + dx, iy = y + dy, ii = iy * MW + ix;
        if (this.roomOf[ii] !== ri || this.cells[ii] !== 0) continue;
        if (this.at(x - dx, y - dy) === 0) continue; // detrás tiene que haber roca
        // lejos de huecos y de otros elementos
        let near = false;
        for (let ey = -1; ey <= 1; ey++) for (let ex = -1; ex <= 1; ex++) {
          const n = (y + ey) * MW + x + ex;
          if (this.openings.has(n) || this.cells[n] >= W_DOOR || this.secret.has(n)) near = true;
        }
        // las dos celdas a los lados del elemento también son pared (no queda en una esquina abierta)
        const s1 = this.at(x + dy, y + dx), s2 = this.at(x - dy, y - dx);
        if (!near && s1 !== 0 && s2 !== 0) cand.push({ i, x, y, ax: ix, ay: iy, a: Math.atan2(dy, dx) });
      }
    }
    if (!cand.length) return null;
    const c = pick(cand);
    this.cells[c.i] = id;
    return c;
  }

  // ---------------------------------------------------------------- decorado y luces
  decorate(theme) {
    const rooms = this.rooms;
    for (let i = 0; i < rooms.length; i++) {
      const r = rooms[i];
      if (r.shape === 'rect' && r.w >= 7 && r.h >= 7 && Math.random() < 0.55 && !['santuario', 'arena', 'trampa', 'guarida'].includes(r.type)) {
        for (const [px, py] of [[r.x + 2, r.y + 2], [r.x + r.w - 3, r.y + 2], [r.x + 2, r.y + r.h - 3], [r.x + r.w - 3, r.y + r.h - 3]]) {
          const pi = py * MW + px;
          // no tapar llegadas de escalera ni el paso desde un hueco
          let bad = false;
          for (const [dx, dy] of DIRS4) { const n = (py + dy) * MW + px + dx; if (this.cells[n] >= W_DOOR || this.openings.has(n)) bad = true; }
          if (!bad) this.cells[pi] = 4;
        }
        r.pillars = true;
      }
    }
    rooms.forEach((r, ri) => {
      const sides = [];
      for (let x = r.x - 1; x <= r.x + r.w; x++) for (let y = r.y - 1; y <= r.y + r.h; y++) {
        const i = y * MW + x;
        if (this.cells[i] === 0) continue;
        for (const [dx, dy] of DIRS4) if (this.roomOf[(y + dy) * MW + x + dx] === ri && this.at(x + dx, y + dy) === 0) { sides.push([x, y, dx, dy]); break; }
      }
      let cool = randi(0, 3);
      const torchP = r.type === 'secreta' ? 0.12 : r.type === 'guarida' ? 0.7 : r.type === 'entrada' ? 0.5 : 0.3;
      for (const [x, y, dx, dy] of sides) {
        const i = y * MW + x;
        if (!this.plainWall(i)) continue;
        cool--;
        if (cool <= 0 && Math.random() < torchP) {
          this.cells[i] = 5; cool = randi(5, 8);
          this.lights.push({ x: x + 0.5 + dx * 0.62, y: y + 0.5 + dy * 0.62, c: LIGHT_FIRE, rad: 4.6 });
        } else if (Math.random() < 0.06) this.cells[i] = 6;
      }
      if (['santuario', 'arena', 'trampa', 'biblioteca', 'osario', 'fuente', 'almacen', 'jardin', 'ritual'].includes(r.type)) return; // las salas especiales se amueblan aparte
      const free = (x, y) => this.at(x, y) === 0 && !this.nearSpecial(x, y);
      const corners = [[r.x, r.y], [r.x + r.w - 1, r.y], [r.x, r.y + r.h - 1], [r.x + r.w - 1, r.y + r.h - 1]];
      for (const [cx, cy] of corners) {
        const roll = Math.random();
        if (!free(cx, cy) || this.roomOf[cy * MW + cx] !== ri) continue;
        if (this.themeCorner(theme, cx, cy)) continue;
        if (roll < 0.16) this.addDecor('skulltorch', cx + 0.5, cy + 0.5, true);
        else if (roll < 0.45) this.addDecor('barrel', cx + 0.5, cy + 0.5);
        else if (roll < 0.6) this.addDecor('candles', cx + 0.5, cy + 0.5, true);
        else if (roll < 0.75) this.addDecor('bones', cx + rand(0.3, 0.7), cy + rand(0.3, 0.7));
      }
      if (!r.pillars && r.w >= 6 && r.h >= 6 && r.type === 'normal' && Math.random() < 0.4) this.addDecor('brazier', r.cx + 0.5, r.cy + 0.5, true);
      for (let k = 0; k < 2; k++) if (Math.random() < 0.4) {
        const x = randi(r.x, r.x + r.w - 1), y = randi(r.y, r.y + r.h - 1);
        if (free(x, y) && this.roomOf[y * MW + x] === ri) this.addDecor('bones', x + rand(0.2, 0.8), y + rand(0.2, 0.8));
      }
    });
    // runas emiten luz suave; la salida deja entrar la luz del día; las escaleras, un poco de penumbra
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const v = this.cells[y * MW + x];
      if (v !== 3 && v !== W_EXIT && v < W_LOCK) continue;
      for (const [dx, dy] of DIRS4) if (this.at(x + dx, y + dy) === 0) {
        const g = theme.glow;
        const c = v === W_EXIT ? [1.1, 1.05, 0.9] : v === 3 ? [g[0] / 255 * 0.8, g[1] / 255 * 0.8, g[2] / 255 * 0.8]
          : v >= W_LOCK && v < W_UP ? KEYS[v - W_LOCK].col.map(q => q / 255 * 0.5) : [0.35, 0.3, 0.25];
        this.lights.push({ x: x + 0.5 + dx * 0.62, y: y + 0.5 + dy * 0.62, c, rad: v === W_EXIT ? 7 : 3.5 });
      }
    }
  }
  nearSpecial(x, y) {
    for (let ey = -1; ey <= 1; ey++) for (let ex = -1; ex <= 1; ex++) { const n = (y + ey) * MW + x + ex; if (this.cells[n] >= W_DOOR || this.openings.has(n) || this.secret.has(n)) return true; }
    return false;
  }

  // decorado típico de la temática en las esquinas (cristales de hielo, urnas, cajas...)
  themeCorner(theme, cx, cy) {
    if (!theme.corner || Math.random() > 0.45) return false;
    this.addDecor(theme.corner, cx + 0.5, cy + 0.5, !!DECOR_LIGHT[theme.corner]);
    return true;
  }
  addDecor(type, x, y, light) {
    const d = { type, x, y, ph: Math.random() * 4 };
    this.decor.push(d);
    if (light) {
      const L = DECOR_LIGHT[type];
      this.lights.push(L ? { x, y, c: L[0], rad: L[1] } : { x, y, c: type === 'candles' ? [0.6, 0.4, 0.18] : type === 'altar' ? [0.55, 0.75, 1.1] : LIGHT_FIRE, rad: type === 'candles' ? 2.6 : type === 'brazier' ? 5 : type === 'altar' ? 4 : 3.8 });
    }
    return d;
  }

  finalize() {
    this.floorCells = [];
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (this.cells[y * MW + x] === 0) this.floorCells.push([x, y]);
    this.lightMap = this.computeLightMap();
    delete this.mask; delete this.noise;
  }

  // abrir una celda (puerta, muro secreto): pasa a ser suelo y se recalcula la luz
  openCell(i) {
    this.cells[i] = 0;
    if (!this.floorTex[i]) this.floorTex[i] = 1;
    this.floorCells.push([i % MW, (i / MW) | 0]);
    this.lightMap = this.computeLightMap();
  }

  computeLightMap() {
    const L = new Float32Array(LG * LG * 3);
    for (const l of this.lights) {
      const r = l.rad;
      const gx0 = Math.max(0, Math.floor((l.x - r) * LS)), gx1 = Math.min(LG - 1, Math.ceil((l.x + r) * LS));
      const gy0 = Math.max(0, Math.floor((l.y - r) * LS)), gy1 = Math.min(LG - 1, Math.ceil((l.y + r) * LS));
      for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
        const wx = (gx + 0.5) / LS, wy = (gy + 0.5) / LS;
        if (this.solid(wx, wy)) continue;
        const d = Math.hypot(wx - l.x, wy - l.y);
        if (d >= r) continue;
        if (!this.los(l.x, l.y, wx, wy)) continue;
        const f = (1 - d / r) ** 2;
        const o = (gy * LG + gx) * 3;
        L[o] += l.c[0] * f; L[o + 1] += l.c[1] * f; L[o + 2] += l.c[2] * f;
      }
    }
    // dilatar hacia las celdas sólidas para iluminar las caras de las paredes
    for (let pass = 0; pass < 2; pass++) {
      const src = L.slice();
      for (let gy = 1; gy < LG - 1; gy++) for (let gx = 1; gx < LG - 1; gx++) {
        if (!this.solid((gx + 0.5) / LS, (gy + 0.5) / LS)) continue;
        const o = (gy * LG + gx) * 3;
        for (const [dx, dy] of DIRS4) {
          const q = ((gy + dy) * LG + gx + dx) * 3;
          if (src[q] + src[q + 1] > L[o] + L[o + 1]) { L[o] = src[q]; L[o + 1] = src[q + 1]; L[o + 2] = src[q + 2]; }
        }
      }
    }
    return L;
  }

  // BFS desde (sx,sy): distancia en celdas (4 vecinos), -1 si inalcanzable
  flowField(sx, sy, out) {
    out.fill(-1);
    const q = this._q || (this._q = new Int32Array(MW * MH));
    let h = 0, t = 0;
    sx |= 0; sy |= 0;
    if (this.at(sx, sy) !== 0) return;
    out[sy * MW + sx] = 0; q[t++] = sy * MW + sx;
    while (h < t) {
      const c = q[h++], cx = c % MW, cy = (c / MW) | 0, d = out[c] + 1;
      if (cx > 0 && out[c - 1] < 0 && this.cells[c - 1] === 0) { out[c - 1] = d; q[t++] = c - 1; }
      if (cx < MW - 1 && out[c + 1] < 0 && this.cells[c + 1] === 0) { out[c + 1] = d; q[t++] = c + 1; }
      if (cy > 0 && out[c - MW] < 0 && this.cells[c - MW] === 0) { out[c - MW] = d; q[t++] = c - MW; }
      if (cy < MH - 1 && out[c + MW] < 0 && this.cells[c + MW] === 0) { out[c + MW] = d; q[t++] = c + MW; }
    }
  }

  blocked(x, y, r) {
    return this.solid(x - r, y - r) || this.solid(x + r, y - r) || this.solid(x - r, y + r) || this.solid(x + r, y + r);
  }
  move(e, dx, dy, r) {
    if (!this.blocked(e.x + dx, e.y, r)) e.x += dx;
    if (!this.blocked(e.x, e.y + dy, r)) e.y += dy;
  }
  los(x0, y0, x1, y1) {
    const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy);
    const n = Math.ceil(d / 0.25);
    for (let i = 1; i < n; i++) {
      const t = i / n;
      if (this.solid(x0 + dx * t, y0 + dy * t)) return false;
    }
    return true;
  }
}
