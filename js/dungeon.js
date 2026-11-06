// Mazmorra completa: varios niveles (por encima y por debajo de la entrada) unidos por escaleras,
// tipos de sala, cámaras cerradas con llave y la guarida del Guardián. Las llaves se colocan siempre
// en zonas alcanzables con las llaves anteriores, así que la mazmorra tiene solución por construcción.
const DG_PRE = ['Las Catacumbas', 'La Cripta', 'La Fortaleza Hundida', 'El Osario', 'Las Bóvedas', 'El Santuario Profanado', 'La Torre Enterrada', 'Las Galerías'];
const DG_SUF = ['de Ulmar', 'de Vel Kharn', 'del Rey Ciego', 'de Morhaven', 'de Ashgrave', 'de la Orden Gris', 'de Duskmere', 'de los Mil Huesos', 'de Karak Dum'];
const ROOM_NAME = { mercader: 'puesto del mercader', herrero: 'fragua del herrero', normal: '', tesoro: 'sala del tesoro', santuario: 'santuario', arena: 'arena', trampa: 'sala de trampas', secreta: 'cámara secreta', camara: 'cámara sellada', guarida: 'guarida del Guardián', entrada: 'entrada',
  biblioteca: 'biblioteca olvidada', osario: 'osario', fuente: 'fuente antigua', almacen: 'almacén', jardin: 'jardín de hongos', ritual: 'círculo ritual' };

function levelName(z) { return z === 0 ? 'Nivel 0' : z > 0 ? `Nivel +${z}` : `Nivel ${z}`; }
// orientación de una celda dentro del nivel, para el diario ("ala norte")
function wingOf(x, y) {
  const dx = x - MW / 2, dy = y - MH / 2;
  if (Math.hypot(dx, dy) < 9) return 'centro';
  const a = Math.atan2(dy, dx), k = Math.round(a / (Math.PI / 4)) & 7;
  return ['ala este', 'ala sureste', 'ala sur', 'ala suroeste', 'ala oeste', 'ala noroeste', 'ala norte', 'ala noreste'][k];
}

class Dungeon {
  constructor(n) {
    this.n = n; // número de mazmorra de la partida: dificultad base
    this.name = `${pick(DG_PRE)} ${pick(DG_SUF)}`;
    const total = Math.min(5, 2 + Math.ceil(n / 2) + (Math.random() < 0.5 ? 1 : 0));
    const up = Math.random() < 0.6 ? randi(0, Math.min(2, total - 2)) : 0;
    this.zs = []; for (let z = up; z > up - total; z--) this.zs.push(z);
    this.levels = {};
    this.links = [];
    for (let tries = 0; tries < 8; tries++) if (this.build()) return;
    throw new Error('No se pudo generar la mazmorra');
  }
  lv(z) { return this.levels[z]; }
  diff(z) { return this.n + Math.abs(z); }

  build() {
    this.levels = {}; this.links = [];
    // 1. trazado de cada nivel (tema según profundidad)
    for (const z of this.zs) {
      const th = ((this.n - 1) + Math.abs(z) + (z > 0 ? 2 : 0)) % THEMES.length;
      const lv = new Level(z, th);
      const nRooms = 9 + Math.min(5, this.n + Math.abs(z));
      if (!lv.layout(nRooms, this.n * 977 + z * 131 + randi(0, 9999))) return false;
      if (Math.random() < 0.75) lv.addSecretRoom();
      lv.paint(this.n * 31 + z * 7);
      this.levels[z] = lv;
    }
    // 2. entrada (salida al exterior) en el nivel 0
    const L0 = this.levels[0];
    const ent = L0.placeOnWall(0, W_EXIT) || L0.placeOnWall(1, W_EXIT);
    if (!ent) return false;
    L0.exit = ent.i; L0.rooms[ent === null ? 1 : L0.roomOf[ent.ay * MW + ent.ax]].type = 'entrada';
    this.start = { z: 0, x: ent.ax + 0.5, y: ent.ay + 0.5, a: ent.a };
    // 3. escaleras entre niveles contiguos (1 o 2 tramos)
    for (let k = 0; k < this.zs.length - 1; k++) {
      const zu = this.zs[k], zd = this.zs[k + 1], U = this.levels[zu], D = this.levels[zd];
      const pairs = Math.random() < 0.45 ? 2 : 1;
      let made = 0;
      for (let t = 0; t < 20 && made < pairs; t++) {
        const ru = this.stairRoom(U), rd = this.stairRoom(D);
        if (ru < 0 || rd < 0) continue;
        const a = U.placeOnWall(ru, W_DOWN); if (!a) continue;
        const b = D.placeOnWall(rd, W_UP); if (!b) { U.cells[a.i] = 1; continue; }
        U.rooms[ru].stair = true; D.rooms[rd].stair = true;
        const la = { z: zu, i: a.i, x: a.ax + 0.5, y: a.ay + 0.5, a: a.a }, lb = { z: zd, i: b.i, x: b.ax + 0.5, y: b.ay + 0.5, a: b.a };
        U.stairs.set(a.i, { dz: -1, to: lb }); D.stairs.set(b.i, { dz: 1, to: la });
        this.links.push([la, lb]); made++;
      }
      if (!made) return false;
    }
    // 4. tipos de sala
    for (const z of this.zs) this.assignTypes(this.levels[z]);
    // 5. cámaras cerradas con llave: la última es la guarida del Guardián, en el nivel más lejano
    const K = Math.min(KEYS.length, 1 + Math.floor((this.zs.length + 1) / 2));
    const far = this.zs.reduce((b, z) => Math.abs(z) > Math.abs(b) || (Math.abs(z) === Math.abs(b) && z < b) ? z : b, 0);
    this.lockRooms = [];
    const cand = [];
    for (const z of this.zs) this.levels[z].rooms.forEach((r, ri) => { if (['normal', 'tesoro'].includes(r.type) && !r.stair && r.doors.length) cand.push({ z, ri, r }); });
    const lairPool = cand.filter(c => c.z === far).sort((a, b) => b.r.w * b.r.h - a.r.w * a.r.h);
    if (!lairPool.length) return false;
    const lair = lairPool[0];
    for (let k = 0; k < K - 1; k++) {
      const pool = cand.filter(c => c !== lair && !this.lockRooms.includes(c));
      if (!pool.length) break;
      this.lockRooms.push(pick(pool));
    }
    this.lockRooms.push(lair);
    this.lockRooms.forEach((c, k) => {
      c.r.type = k === this.lockRooms.length - 1 ? 'guarida' : 'camara';
      c.r.lock = k;
      const lv = this.levels[c.z];
      for (const [i, o] of lv.openings) if (o.rooms.includes(c.ri)) { lv.locks.set(i, k); lv.cells[i] = W_LOCK + k; }
    });
    // 5b. un mercader y un herrero por mazmorra (en niveles distintos si se puede), en salas tranquilas
    const calm = [];
    for (const z of this.zs) this.levels[z].rooms.forEach(r => { if (r.type === 'normal' && r.doors.length && r.w * r.h >= 20) calm.push({ z, r }); });
    const m = calm.length ? pick(calm) : null;
    if (m) m.r.type = 'mercader';
    const others = calm.filter(c => c !== m && (!m || c.z !== m.z));
    const h = others.length ? pick(others) : calm.find(c => c !== m);
    if (h) h.r.type = 'herrero';
    // 6. puertas de madera en otros huecos de sala
    for (const z of this.zs) {
      const lv = this.levels[z];
      for (const [i, o] of lv.openings) {
        if (lv.locks.has(i)) continue;
        const arena = o.rooms.some(ri => lv.rooms[ri].type === 'arena');
        if (!arena && Math.random() < 0.45) lv.cells[i] = W_DOOR;
      }
    }
    // 7. llaves: la k se coloca en una sala alcanzable con las llaves 0..k-1
    this.keySpots = [];
    for (let k = 0; k < this.lockRooms.length; k++) {
      const reach = this.reach(k);
      const rooms = [];
      for (const z of this.zs) this.levels[z].rooms.forEach((r, ri) => {
        if (r.type === 'entrada' || r.type === 'arena' || r.lock === k) return;
        if (r.lock !== undefined && r.lock >= k) return;
        const c = r.cy * MW + r.cx;
        if (reach[z] && reach[z].d[c] >= 0) rooms.push({ z, ri, r, d: reach[z].d[c] + Math.abs(z) * 40 });
      });
      if (!rooms.length) return false;
      rooms.sort((a, b) => b.d - a.d);
      const spot = pick(rooms.slice(0, Math.max(1, Math.ceil(rooms.length * 0.5))));
      spot.r.key = k; this.keySpots.push(spot);
    }
    // 8. comprobación final: con todas las llaves se llega a todas las salas (salvo las secretas, que se descubren)
    const all = this.reach(this.lockRooms.length, true);
    for (const z of this.zs) for (const r of this.levels[z].rooms) if (!(all[z] && all[z].d[r.cy * MW + r.cx] >= 0)) return false;
    // 9. decorado, altares, pinchos y luces
    for (const z of this.zs) {
      const lv = this.levels[z];
      for (const r of lv.rooms) this.furnish(lv, r);
      lv.decorate(THEMES[lv.theme]);
      lv.finalize();
    }
    return true;
  }

  // sala para una escalera: ni la entrada ni las secretas; mejor salas normales
  stairRoom(lv) {
    const ok = lv.rooms.map((r, i) => i).filter(i => lv.rooms[i].type === 'normal' && !lv.rooms[i].stair);
    return ok.length ? pick(ok) : -1;
  }

  assignTypes(lv) {
    const free = lv.rooms.map((r, i) => i).filter(i => lv.rooms[i].type === 'normal' && !lv.rooms[i].stair);
    const take = (f) => { const c = free.filter(i => f(lv.rooms[i])); if (!c.length) return null; const i = pick(c); free.splice(free.indexOf(i), 1); return lv.rooms[i]; };
    const t1 = take(() => true); if (t1) t1.type = 'tesoro';
    if (Math.random() < 0.6) { const r = take(r => r.w * r.h >= 30); if (r) r.type = 'santuario'; }
    if (Math.random() < 0.65) { const r = take(r => r.w >= 7 && r.h >= 7 && r.shape !== 'round'); if (r) r.type = 'arena'; }
    if (Math.random() < 0.55) { const r = take(r => r.w * r.h >= 24); if (r) r.type = 'trampa'; }
    if (Math.random() < 0.4) { const r = take(() => true); if (r) r.type = 'tesoro'; }
    // salas temáticas: cada una con su decorado y su contenido
    const big = (r) => r.w >= 5 && r.h >= 5 && r.shape !== 'round';
    if (Math.random() < 0.4) { const r = take(r => big(r) && r.w * r.h >= 25); if (r) r.type = 'biblioteca'; }
    if (Math.random() < 0.4) { const r = take(r => r.w * r.h >= 20); if (r) r.type = 'osario'; }
    if (Math.random() < 0.35) { const r = take(r => r.w * r.h >= 16); if (r) r.type = 'fuente'; }
    if (Math.random() < 0.45) { const r = take(r => r.w * r.h >= 16); if (r) r.type = 'almacen'; }
    if (Math.random() < 0.35) { const r = take(r => r.w * r.h >= 20); if (r) r.type = 'jardin'; }
    if (Math.random() < 0.3) { const r = take(r => r.w >= 6 && r.h >= 6); if (r) r.type = 'ritual'; }
  }

  // BFS por todos los niveles: celdas alcanzables con las llaves 0..k-1 (y muros secretos si secrets)
  reach(k, secrets) {
    const out = {};
    for (const z of this.zs) out[z] = { d: new Int32Array(MW * MH).fill(-1) };
    const q = [[this.start.z, Math.floor(this.start.y) * MW + Math.floor(this.start.x)]];
    out[this.start.z].d[q[0][1]] = 0;
    for (let h = 0; h < q.length; h++) {
      const [z, c] = q[h], lv = this.levels[z], d = out[z].d[c] + 1, cx = c % MW, cy = (c / MW) | 0;
      for (const [dx, dy] of DIRS4) {
        const X = cx + dx, Y = cy + dy, n = Y * MW + X;
        if (X < 0 || Y < 0 || X >= MW || Y >= MH || out[z].d[n] >= 0) continue;
        const v = lv.cells[n];
        const st = lv.stairs.get(n);
        if (st) { const t = st.to, tc = Math.floor(t.y) * MW + Math.floor(t.x); if (out[t.z].d[tc] < 0) { out[t.z].d[tc] = d; q.push([t.z, tc]); } continue; }
        const pass = v === 0 || v === W_DOOR || (secrets && lv.secret.has(n)) || (lv.locks.has(n) && lv.locks.get(n) < k);
        if (!pass) continue;
        out[z].d[n] = d; q.push([z, n]);
      }
    }
    return out;
  }

  // contenido fijo de la sala que necesita luz o celdas (altar, pinchos); el resto lo coloca el juego
  furnish(lv, r) {
    if (r.type === 'mercader') {
      const n = lv.addDecor('merchant', r.cx + 0.5, r.cy + 0.5, false); n.npc = 'merchant';
      lv.lights.push({ x: r.cx + 0.5, y: r.cy + 0.5, c: [1.0, 0.75, 0.35], rad: 4.2 });
      lv.npcs.push({ type: 'merchant', x: r.cx + 0.5, y: r.cy + 0.5 });
    }
    if (r.type === 'herrero') {
      lv.addDecor('smith', r.cx + 0.5, r.cy + 0.5, false);
      lv.addDecor('anvil', r.cx + 0.5 + (r.w > 5 ? 1 : 0.6), r.cy + 0.5, false);
      lv.addDecor('brazier', r.cx + 0.5 - (r.w > 5 ? 1.2 : 0.8), r.cy + 0.5, true);
      lv.npcs.push({ type: 'smith', x: r.cx + 0.5, y: r.cy + 0.5 });
    }
    if (r.type === 'santuario') { r.shrine = lv.addDecor('altar', r.cx + 0.5, r.cy + 0.5, true); r.shrine.used = false; lv.shrines.push(r.shrine); }
    // ---- salas temáticas
    const ri = lv.rooms.indexOf(r);
    const ok = (x, y) => lv.inRoom(r, x, y) && lv.at(x, y) === 0 && lv.roomOf[y * MW + x] === ri && !lv.nearSpecial(x, y) && !lv.decor.some(d => Math.floor(d.x) === x && Math.floor(d.y) === y);
    const cells = []; for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (ok(x, y)) cells.push([x, y]);
    const wallSide = cells.filter(([x, y]) => DIRS4.some(([dx, dy]) => lv.at(x + dx, y + dy) !== 0 && lv.at(x + dx, y + dy) < W_DOOR));
    const scatter = (type, n, light, from = cells, jitter = 0.25) => { const pool = from.filter(c => ok(c[0], c[1])); for (let k = 0; k < n && pool.length; k++) { const [x, y] = pool.splice(randi(0, pool.length - 1), 1)[0]; lv.addDecor(type, x + 0.5 + rand(-jitter, jitter), y + 0.5 + rand(-jitter, jitter), light); } };
    if (r.type === 'biblioteca') { // estanterías contra las paredes y velas en el centro
      wallSide.filter(([x, y]) => (x + y) % 2 === 0).slice(0, 10).forEach(([x, y]) => { if (ok(x, y)) lv.addDecor('bookshelf', x + 0.5, y + 0.5, false); });
      if (ok(r.cx, r.cy)) lv.addDecor('candles', r.cx + 0.5, r.cy + 0.5, true);
    }
    if (r.type === 'osario') { scatter('bonepile', randi(3, 5), false, cells, 0.3); scatter('bones', randi(2, 4), false); scatter('skulltorch', 2, true, wallSide, 0); }
    if (r.type === 'fuente') {
      if (ok(r.cx, r.cy)) { const f = lv.addDecor('fountain', r.cx + 0.5, r.cy + 0.5, true); f.used = false; }
      scatter('candles', 2, true, wallSide, 0);
    }
    if (r.type === 'almacen') { scatter('barrel', randi(3, 5), false, wallSide, 0.15); scatter('crate', randi(3, 5), false, wallSide, 0.15); }
    if (r.type === 'jardin') { scatter('mushroom', randi(3, 5), true, cells, 0.35); scatter('mushroomB', randi(2, 3), true, cells, 0.35); }
    if (r.type === 'ritual') {
      if (ok(r.cx, r.cy)) lv.addDecor('ritual', r.cx + 0.5, r.cy + 0.5, true);
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU, x = Math.floor(r.cx + 0.5 + Math.cos(a) * 2.2), y = Math.floor(r.cy + 0.5 + Math.sin(a) * 2.2); if (ok(x, y)) lv.addDecor('candles', x + 0.5, y + 0.5, true); }
    }
    if (r.type === 'trampa') {
      for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) {
        if (!lv.inRoom(r, x, y) || lv.nearSpecial(x, y)) continue;
        if (((x + y) & 1) === 0 && Math.random() < 0.75) lv.spikes.push({ x, y, ph: ((x * 3 + y * 5) % 4) * 0.55 });
      }
    }
  }
}
