// Texturas procedurales 64x64 estilo Daggerfall / Hexen
// Alfa < 255 en un texel = emisivo (no le afecta la luz)
const TS = 64;

const THEMES = [
  {
    name: 'La Cripta', fog: [6, 5, 9], ambient: [0.05, 0.045, 0.06], glow: [110, 190, 255],
    stones: [[124, 118, 112], [104, 100, 102], [138, 128, 114], [92, 88, 94], [116, 104, 92], [130, 124, 124]],
    mortar: [38, 34, 36], moss: [72, 104, 60], mossAmt: 0.22, banner: [150, 28, 30], accent: [120, 20, 16],
    floor: [[98, 94, 96], [86, 82, 84], [110, 104, 98]], tiles: [[96, 70, 64], [70, 62, 74]],
    wood: [[92, 60, 36], [64, 40, 24]], ceil: 'wood', wallStyle: 'stone', altStyle: 'brick',
    boss: 'lich', fauna: [['zombie', 6], ['cultist', 2, 1, 20], ['vampspawn', 3], ['vampire', 1, 0.5, 30], ['necromancer', 1.5, 0.5, 25], ['malevolent', 1.5]],
  },
  {
    name: 'Las Catacumbas', fog: [3, 8, 5], ambient: [0.04, 0.06, 0.045], glow: [140, 255, 120],
    stones: [[92, 106, 78], [78, 94, 74], [112, 114, 86], [70, 82, 70], [100, 98, 72], [86, 100, 92]],
    mortar: [26, 32, 22], moss: [64, 132, 48], mossAmt: 0.55, banner: [40, 100, 46], accent: [110, 24, 18],
    floor: [[82, 86, 70], [70, 76, 62], [94, 94, 76]], tiles: [[72, 84, 64], [56, 64, 58]],
    wood: [[76, 58, 34], [52, 38, 22]], ceil: 'stone', wallStyle: 'brick', altStyle: 'stone',
    boss: 'queen', fauna: [['spider', 8], ['slime', 3], ['zombie', 3], ['goblin', 4], ['goblinarcher', 2, 0.5], ['harpy', 1.5]],
  },
  {
    name: 'Foso Infernal', fog: [16, 4, 2], ambient: [0.07, 0.035, 0.03], glow: [255, 150, 50],
    stones: [[124, 72, 60], [104, 58, 50], [140, 88, 68], [88, 50, 44], [116, 66, 48]],
    mortar: [28, 10, 8], moss: [255, 120, 30], mossAmt: 0.0, banner: [30, 22, 24], accent: [150, 20, 12], lava: true,
    floor: [[96, 58, 50], [80, 46, 40], [108, 66, 52]], tiles: [[110, 40, 32], [52, 30, 30]],
    wood: [[70, 36, 24], [44, 22, 16]], ceil: 'stone', wallStyle: 'stone', altStyle: 'brick',
    boss: 'boss', fauna: [['hound', 6], ['imp', 3, 1], ['fury', 4], ['orc', 3, 0.5]],
  },
  {
    name: 'El Vacío', fog: [8, 4, 14], ambient: [0.05, 0.04, 0.08], glow: [225, 120, 255],
    stones: [[98, 88, 122], [82, 74, 106], [112, 102, 132], [72, 64, 94], [104, 96, 110]],
    mortar: [28, 22, 42], moss: [170, 90, 230], mossAmt: 0.18, banner: [92, 40, 140], accent: [90, 30, 120], crystal: true,
    floor: [[80, 72, 98], [68, 60, 86], [92, 84, 108]], tiles: [[90, 60, 120], [50, 44, 70]],
    wood: [[66, 48, 60], [44, 30, 42]], ceil: 'wood', wallStyle: 'brick', altStyle: 'stone',
    boss: 'voidlord', fauna: [['eye', 5, 1], ['wraith', 3], ['malevolent', 4], ['vampbat', 2]],
  },
  {
    name: 'Las Cuevas Heladas', fog: [8, 12, 18], ambient: [0.06, 0.07, 0.095], glow: [150, 220, 255],
    stones: [[150, 166, 182], [126, 142, 160], [168, 182, 196], [110, 124, 142], [140, 156, 170]],
    mortar: [40, 48, 60], moss: [225, 240, 255], mossAmt: 0.38, banner: [40, 70, 120], accent: [60, 120, 170],
    floor: [[120, 134, 150], [104, 118, 134], [136, 150, 164]], tiles: [[150, 180, 200], [96, 110, 130]],
    wood: [[90, 80, 76], [60, 52, 50]], ceil: 'stone', wallStyle: 'stone', altStyle: 'brick', corner: 'icecrystal',
    boss: 'lich', fauna: [['yeti', 5, 0.5], ['icewisp', 6], ['harpy', 4], ['wraith', 3], ['skeleton', 3], ['orc', 1.5]],
  },
  {
    name: 'Las Cloacas', fog: [6, 8, 3], ambient: [0.045, 0.055, 0.035], glow: [190, 230, 90],
    stones: [[104, 96, 74], [90, 84, 64], [118, 108, 82], [80, 76, 58], [96, 100, 72]],
    mortar: [24, 28, 16], moss: [90, 140, 40], mossAmt: 0.6, banner: [60, 80, 30], accent: [100, 90, 30],
    floor: [[70, 74, 56], [60, 64, 48], [82, 84, 62]], tiles: [[64, 80, 52], [50, 58, 42]],
    wood: [[70, 54, 32], [48, 36, 22]], ceil: 'stone', wallStyle: 'brick', altStyle: 'brick', corner: 'crate',
    boss: 'queen', fauna: [['rat', 8], ['slime', 5], ['zombie', 3], ['spider', 2], ['goblin', 3], ['vampbat', 2]],
  },
  {
    name: 'El Templo Hundido', fog: [12, 9, 4], ambient: [0.06, 0.05, 0.035], glow: [255, 210, 110],
    stones: [[176, 150, 108], [160, 134, 94], [190, 166, 122], [146, 122, 86], [170, 146, 112]],
    mortar: [60, 46, 30], moss: [80, 120, 90], mossAmt: 0.15, banner: [30, 60, 130], accent: [190, 140, 40],
    floor: [[150, 128, 94], [134, 114, 82], [164, 142, 104]], tiles: [[170, 130, 60], [90, 70, 50]],
    wood: [[110, 74, 40], [78, 50, 26]], ceil: 'stone', wallStyle: 'stone', altStyle: 'brick', corner: 'urn',
    boss: 'boss', fauna: [['deepwarrior', 7, 0.5], ['deepmage', 4, 0.6, 15], ['harpy', 3], ['cultist', 2], ['skeleton', 3], ['necromancer', 1, 0.4, 30]],
  },
];

// ------------------------------------------------------------- utilidades
function texNew() { return { r: new Float32Array(TS * TS), g: new Float32Array(TS * TS), b: new Float32Array(TS * TS), e: new Uint8Array(TS * TS) }; }
function texPut(t, i, r, g, b) { t.r[i] = r; t.g[i] = g; t.b[i] = b; }
function texPack(t) {
  const out = new Uint32Array(TS * TS);
  for (let i = 0; i < TS * TS; i++) out[i] = rgb(t.r[i], t.g[i], t.b[i], t.e[i] ? 250 : 255);
  return out;
}
function texClone(t) { return { r: t.r.slice(), g: t.g.slice(), b: t.b.slice(), e: t.e.slice() }; }
const wrapD = (d) => { d = Math.abs(d); return d > TS / 2 ? TS - d : d; };

// Mapa de alturas a partir de celdas: devuelve {id, h} para cada píxel
function voronoiCells(seed, n, ky) {
  const pts = [];
  for (let i = 0; i < n; i++) pts.push([hash2(i, 1, seed) * TS, hash2(i, 2, seed) * TS]);
  const id = new Int16Array(TS * TS), edge = new Float32Array(TS * TS);
  // radio de cada piedra (mitad de la distancia a su vecina) para redondear esquinas
  const rr = pts.map((p, i) => {
    let m = 1e9;
    pts.forEach((q, j) => { if (j !== i) { const dx = wrapD(p[0] - q[0]), dy = wrapD(p[1] - q[1]) * ky; m = Math.min(m, Math.hypot(dx, dy)); } });
    return m * 0.86;
  });
  for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
    let d1 = 1e9, d2 = 1e9, i1 = 0;
    for (let i = 0; i < n; i++) {
      const dx = wrapD(x + 0.5 - pts[i][0]), dy = wrapD(y + 0.5 - pts[i][1]) * ky;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < d1) { d2 = d1; d1 = d; i1 = i; } else if (d < d2) d2 = d;
    }
    id[y * TS + x] = i1; edge[y * TS + x] = Math.min((d2 - d1) * 0.5, (rr[i1] - d1) * 0.9 + 1.6);
  }
  return { id, edge };
}

// Ladrillos de longitud irregular (tileable)
function brickCells(seed, rowH) {
  const id = new Int16Array(TS * TS), edge = new Float32Array(TS * TS);
  const rows = TS / rowH;
  let next = 0;
  for (let r = 0; r < rows; r++) {
    const cuts = [0]; let x = 0;
    const off = Math.floor(hash2(r, 9, seed) * 16);
    while (x < TS) { x += 10 + Math.floor(hash2(r, cuts.length, seed) * 12); if (x > TS - 8) x = TS; cuts.push(x); }
    for (let y = r * rowH; y < (r + 1) * rowH; y++) for (let px = 0; px < TS; px++) {
      const xx = (px + off) % TS;
      let k = 0; while (cuts[k + 1] <= xx) k++;
      const ex = Math.min(xx - cuts[k], cuts[k + 1] - 1 - xx), ey = Math.min(y - r * rowH, (r + 1) * rowH - 1 - y);
      id[y * TS + px] = next + k; edge[y * TS + px] = Math.min(ex, ey) + 0.5;
    }
    next += cuts.length;
  }
  return { id, edge };
}

// Sillares grandes (para pilares)
function blockCells(seed) {
  const id = new Int16Array(TS * TS), edge = new Float32Array(TS * TS);
  for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
    const row = y >> 4, off = (row & 1) ? 16 : 0, xx = (x + off) & 63;
    const lx = xx & 31, ly = y & 15;
    id[y * TS + x] = row * 4 + (xx >> 5);
    edge[y * TS + x] = Math.min(lx, 31 - lx, ly, 15 - ly) + 0.5;
  }
  return { id, edge };
}

// Material de piedra con biselado e iluminación desde arriba-izquierda
function stoneMaterial(cells, seed, pal, mortar, o = {}) {
  const t = texNew();
  const mw = o.mortarW ?? 1.1, bev = o.bevel ?? 3.2, grain = o.grain ?? 0.22;
  const h = new Float32Array(TS * TS);
  for (let i = 0; i < TS * TS; i++) {
    const x = i & 63, y = i >> 6;
    const chip = (fbm(x / TS, y / TS, seed + 77, 8) - 0.5) * 1.6;
    h[i] = clamp((cells.edge[i] - mw + chip) / bev, 0, 1);
  }
  for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
    const i = y * TS + x, hv = h[i];
    const n = fbm(x / TS, y / TS, seed + 5, 8), sp = (hash2(x, y, seed + 9) - 0.5);
    if (hv <= 0) {
      const k = 0.65 + 0.6 * n + sp * 0.3;
      texPut(t, i, mortar[0] * k, mortar[1] * k, mortar[2] * k);
      continue;
    }
    const cid = cells.id[i];
    const base = pal[Math.floor(hash2(cid, 3, seed) * pal.length)];
    const tone = 0.82 + 0.3 * hash2(cid, 4, seed);
    const hl = h[((y - 1) & 63) * TS + ((x - 1) & 63)], hr = h[((y + 1) & 63) * TS + ((x + 1) & 63)];
    let shade = 1 + (hv - hr) * 0.55 - (hl - hv) * 0.5; // luz arriba-izquierda
    shade *= 0.9 + 0.1 * hv;
    const k = tone * shade * (1 + (n - 0.5) * grain * 2 + sp * grain);
    texPut(t, i, base[0] * k, base[1] * k, base[2] * k);
  }
  return t;
}

// ------------------------------------------------------------- capas superpuestas
function grime(t, seed) {
  for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
    const i = y * TS + x;
    let k = 1;
    if (y > 50) k -= (y - 50) / 14 * 0.32 * (0.7 + 0.6 * fbm(x / TS, 0.3, seed, 8));
    if (y < 6) k -= (6 - y) / 6 * 0.18;
    t.r[i] *= k; t.g[i] *= k; t.b[i] *= k;
  }
}

function moss(t, th, seed, amt) {
  if (amt <= 0) return;
  for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
    const i = y * TS + x;
    const m = fbm(x / TS, y / TS, seed + 31, 4) + Math.max(0, (y - 40) / 64) * 0.4 + Math.max(0, (14 - y) / 64) * 0.3;
    const thr = 1 - amt;
    if (m > thr) {
      const f = clamp((m - thr) * 5, 0, 1);
      if (hash2(x, y, seed + 3) < f * 0.95) {
        const leaf = hash2(x >> 1, y >> 1, seed + 8);
        const k = leaf > 0.75 ? 1.45 : leaf > 0.35 ? 1 : 0.6;
        texPut(t, i, th.moss[0] * k, th.moss[1] * k, th.moss[2] * k);
        if (th.crystal && leaf > 0.9) t.e[i] = 1;
      }
    }
  }
}

function blood(t, th, seed, n) {
  for (let s = 0; s < n; s++) {
    const cx = hash2(s, 1, seed) * TS, cy = 8 + hash2(s, 2, seed) * 40, r = 2 + hash2(s, 3, seed) * 5;
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
      const d = Math.hypot(wrapD(x - cx), y - cy);
      const drip = Math.abs(x - cx) < 1 + hash2(x, s, seed) && y > cy && y < cy + r * 3 * hash2(Math.floor(x), s, seed + 4);
      if (d < r * (0.6 + 0.6 * vnoise(x / 3, y / 3, seed + s, 64)) || drip || (d < r * 2 && hash2(x, y, seed + s) < 0.12)) {
        const i = y * TS + x, k = 0.7 + 0.5 * hash2(x, y, seed + 5);
        texPut(t, i, th.accent[0] * k, th.accent[1] * k, th.accent[2] * k);
      }
    }
  }
}

function lavaVeins(t, th, seed) {
  for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
    const v = Math.abs(fbm(x / TS, y / TS, seed + 50, 4) - 0.5);
    if (v < 0.018) {
      const i = y * TS + x, k = 1 - v / 0.018;
      texPut(t, i, 255, 120 + 100 * k, 30 + 40 * k); t.e[i] = 1;
    }
  }
}

// ------------------------------------------------------------- paredes
function baseWall(th, seed, style) {
  const cells = style === 'brick' ? brickCells(seed, 8) : voronoiCells(seed, 34, 1.3);
  const t = stoneMaterial(cells, seed, th.stones, th.mortar, style === 'brick' ? { bevel: 2.4, mortarW: 0.9 } : { bevel: 3.4, mortarW: 0.45 });
  grime(t, seed);
  return t;
}

function flame(t, cx, cy, frame, scale = 1, seed = 1) {
  for (let y = -16; y <= 2; y++) for (let x = -6; x <= 6; x++) {
    const X = Math.round(cx + x), Y = Math.round(cy + y * scale);
    if (X < 0 || Y < 0 || X >= TS || Y >= TS) continue;
    const ny = -y / 16; // 0 base .. 1 punta
    const wob = Math.sin(ny * 6 + frame * 2.1) * 1.4 * ny;
    const w = (1 - ny) * 4.5 * (0.8 + 0.25 * Math.sin(frame * 1.7 + ny * 3));
    const dx = Math.abs(x - wob);
    if (dx > w || hash2(x + frame * 7, y, seed) < ny * 0.25) continue;
    const core = 1 - dx / (w + 0.01);
    let r = 255, g = 120 + 135 * core * (1 - ny * 0.5), b = 30 + 180 * Math.max(0, core - 0.6) * (1 - ny);
    if (core < 0.3) { g *= 0.7; b = 10; }
    const i = Y * TS + X; texPut(t, i, r, g, b); t.e[i] = 1;
  }
}

function wallTorch(base, th, frame) {
  const t = texClone(base);
  // halo cálido sobre la pared
  for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
    const d = Math.hypot(x - 32, (y - 22) * 1.2);
    if (d < 26) { const k = (1 - d / 26) ** 2 * 0.9, i = y * TS + x; t.r[i] += 90 * k; t.g[i] += 45 * k; t.b[i] += 10 * k; }
  }
  // soporte de hierro
  for (let y = 34; y < 46; y++) for (let x = 27; x < 37; x++) {
    const i = y * TS + x, edge = x === 27 || x === 36 || y === 34 || y === 45;
    if (y > 40 || x === 27 || x === 36 || (y === 34)) texPut(t, i, edge ? 30 : 64, edge ? 30 : 62, edge ? 34 : 70);
  }
  for (let y = 40; y < 48; y++) { const i = y * TS + 32; texPut(t, i, 40, 38, 44); }
  // mango de madera
  for (let y = 22; y < 42; y++) for (let x = 30; x < 35; x++) {
    const i = y * TS + x, k = x === 30 ? 1.3 : x === 34 ? 0.6 : 1;
    texPut(t, i, 96 * k, 60 * k, 34 * k);
  }
  // trapo envuelto
  for (let y = 18; y < 24; y++) for (let x = 29; x < 36; x++) { const i = y * TS + x, k = (y & 1) ? 0.7 : 1; texPut(t, i, 70 * k, 50 * k, 36 * k); }
  flame(t, 32, 19, frame, 1, 3);
  return texPack(t);
}

function wallBanner(base, th, seed) {
  const t = texClone(base);
  const c = th.banner;
  for (let y = 6; y < 58; y++) for (let x = 18; x < 46; x++) {
    const rel = (x - 18) / 27;
    // borde inferior en punta
    const tip = 50 + (1 - Math.abs(rel - 0.5) * 2) * 7;
    if (y > tip) continue;
    const i = y * TS + x;
    const fold = 0.78 + 0.32 * Math.sin(rel * Math.PI * 3.2 + 0.4) + (hash2(x, y, seed) - 0.5) * 0.08;
    let r = c[0] * fold, g = c[1] * fold, b = c[2] * fold;
    if (x < 20 || x > 43) { r = 200 * fold; g = 160 * fold; b = 60 * fold; } // ribete dorado
    if (y > tip - 2) { r = 210; g = 170; b = 70; }
    // emblema: calavera estilizada
    const ex = x - 32, ey = y - 26;
    const sk = (ex * ex) / 30 + (ey * ey) / 36 < 1 && ey < 4;
    const jaw = Math.abs(ex) < 4 && ey >= 4 && ey < 8;
    if (sk || jaw) {
      const eye = (Math.abs(ex + 2.5) < 1.5 || Math.abs(ex - 2.5) < 1.5) && ey > -2 && ey < 2;
      const tooth = jaw && ey > 5 && (x & 1);
      if (!eye && !tooth) { r = 226 * fold; g = 196 * fold; b = 120 * fold; } else { r *= 0.4; g *= 0.4; b *= 0.4; }
    }
    texPut(t, i, r, g, b);
    // sombra proyectada a la derecha
    const si = y * TS + Math.min(63, x + 2);
    if (x >= 44) { t.r[si] *= 0.5; t.g[si] *= 0.5; t.b[si] *= 0.5; }
  }
  // barra
  for (let x = 14; x < 50; x++) for (let y = 4; y < 7; y++) {
    const i = y * TS + x, gold = x < 17 || x > 46;
    const k = y === 4 ? 1.3 : y === 6 ? 0.6 : 1;
    texPut(t, i, (gold ? 210 : 80) * k, (gold ? 160 : 52) * k, (gold ? 60 : 30) * k);
  }
  return texPack(t);
}

function wallGrate(base, th, seed) {
  const t = texClone(base);
  const cx = 32, top = 22, bot = 58, hw = 13;
  for (let y = 6; y < bot + 3; y++) for (let x = cx - hw - 4; x <= cx + hw + 4; x++) {
    const i = y * TS + x;
    const inArch = (yy, w) => (yy >= top ? Math.abs(x - cx) <= w : Math.hypot(x - cx, (yy - top) * 1.0) <= w);
    if (y <= bot && inArch(y, hw)) {
      // interior oscuro
      const depth = 0.12 + 0.1 * (y / TS) + (hash2(x, y, seed) * 0.05);
      texPut(t, i, th.mortar[0] * depth * 1.5, th.mortar[1] * depth * 1.5, th.mortar[2] * depth * 1.5 + 4);
      // barrotes
      const bar = ((x - cx + 64) % 7 === 0) || y === top + 10 || y === top + 24;
      if (bar) { const hl = ((x - cx + 64) % 7 === 0) ? 1 : 0.8; texPut(t, i, 74 * hl, 72 * hl, 80 * hl); }
      if (((x - cx + 64) % 7 === 1) && !(y === top + 10 || y === top + 24)) texPut(t, i, 30, 28, 34);
    } else if (inArch(y, hw + 4) && y <= bot + 2) {
      // dovelas del arco
      const ang = Math.atan2(y - top, x - cx);
      const seg = y < top ? Math.floor((ang + Math.PI) * 4) : Math.floor(y / 6);
      const k = 0.95 + 0.25 * hash2(seg, 7, seed);
      const edge = (inArch(y, hw + 1) || !inArch(y, hw + 3)) ? 0.65 : 1;
      const c = th.stones[0];
      texPut(t, i, c[0] * k * edge * 1.1, c[1] * k * edge * 1.1, c[2] * k * edge * 1.1);
    }
  }
  return texPack(t);
}

function wallRune(base, th) {
  const t = texClone(base);
  const g = th.glow;
  for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
    const dx = x - 31.5, dy = y - 30.5, d = Math.hypot(dx, dy), ad = Math.abs(dx), bd = Math.abs(dy);
    let v = 0;
    if (Math.abs(d - 13) < 1.2) v = 1;
    else if (ad + bd < 9.5 && ad + bd > 7.5) v = 0.9;
    else if ((ad < 1 && bd < 18 && bd > 9) || (bd < 1 && ad < 18 && ad > 9)) v = 0.85;
    else if (d < 2.2) v = 1;
    const i = y * TS + x;
    if (v) { texPut(t, i, g[0] * v + 40, g[1] * v + 40, g[2] * v + 40); t.e[i] = 1; }
    else if (d < 18) { const k = (1 - d / 18) * 0.35; t.r[i] += g[0] * k; t.g[i] += g[1] * k; t.b[i] += g[2] * k; }
  }
  return texPack(t);
}

// ------------------------------------------------------------- puertas, escaleras y salida
// Hueco en arco dentro del muro: fill(x, y, i, u, v) pinta el interior (u, v en 0..1 dentro del hueco)
function archOpening(base, th, seed, hw, top, bot, fill) {
  const t = texClone(base), cx = 31.5;
  const inArch = (x, y, w) => (y >= top ? Math.abs(x - cx) <= w : Math.hypot(x - cx, y - top) <= w);
  for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
    const i = y * TS + x;
    if (y <= bot && inArch(x, y, hw)) fill(t, x, y, i, (x - (cx - hw)) / (2 * hw), (y - (top - hw)) / (bot - (top - hw)));
    else if (y <= bot && inArch(x, y, hw + 4)) { // dovelas
      const ang = Math.atan2(y - top, x - cx);
      const seg = y < top ? Math.floor((ang + Math.PI) * 4) : Math.floor(y / 6);
      const k = 0.95 + 0.25 * hash2(seg, 7, seed);
      const edge = (inArch(x, y, hw + 1) || !inArch(x, y, hw + 3)) ? 0.62 : 1;
      const c = th.stones[0];
      texPut(t, i, c[0] * k * edge * 1.1, c[1] * k * edge * 1.1, c[2] * k * edge * 1.1);
    }
  }
  return t;
}
// Puerta de tablones con herrajes. lock = color de la cerradura (puertas con llave) o null
function wallDoor(base, th, seed, lock) {
  const [lw, dw] = th.wood;
  const t = archOpening(base, th, seed, 15, 20, 63, (t, x, y, i, u, v) => {
    const plank = Math.floor(u * 5), px = (u * 5) % 1;
    const grainN = vnoise(x / 1.2, y / 9, seed + plank, 64), sp = hash2(x, y, seed) - 0.5;
    let k = 0.62 + grainN * 0.35 + (plank & 1) * 0.08 + sp * 0.08;
    if (px < 0.12) k *= 0.45; else if (px > 0.88) k *= 0.8;
    let c = [lw[0] * 0.5 + dw[0] * 0.5, lw[1] * 0.5 + dw[1] * 0.5, lw[2] * 0.5 + dw[2] * 0.5];
    // bandas de hierro con remaches
    const band = (y >= 27 && y <= 30) || (y >= 50 && y <= 53);
    if (band) { c = [70, 68, 74]; k = y === 27 || y === 50 ? 1.25 : y === 30 || y === 53 ? 0.55 : 0.9; if (((x + 1) % 6) === 0 && (y === 28 || y === 51)) k = 1.7; }
    texPut(t, i, c[0] * k, c[1] * k, c[2] * k);
  });
  if (lock) { // placa de cerradura con gema del color de la llave (emisiva)
    for (let y = 34; y < 48; y++) for (let x = 25; x < 39; x++) {
      const i = y * TS + x, e = x === 25 || x === 38 || y === 34 || y === 47;
      texPut(t, i, e ? 40 : 96, e ? 38 : 92, e ? 44 : 102);
    }
    for (let y = 38; y < 46; y++) for (let x = 30; x < 34; x++) { const i = y * TS + x; if (y < 41 || (x > 30 && x < 33)) texPut(t, i, 10, 8, 10); }
    for (let y = 24; y < 33; y++) for (let x = 27; x < 37; x++) {
      const d = Math.abs(x - 31.5) + Math.abs(y - 28);
      if (d > 4.6) continue;
      const i = y * TS + x, k = d < 1.6 ? 1.35 : d < 3.2 ? 1 : 0.7;
      texPut(t, i, Math.min(255, lock[0] * k), Math.min(255, lock[1] * k), Math.min(255, lock[2] * k)); t.e[i] = 1;
    }
  } else { // aldaba
    for (let y = 36; y < 46; y++) for (let x = 38; x < 48; x++) {
      const d = Math.hypot(x - 42.5, y - 41); const i = y * TS + x;
      if (Math.abs(d - 3.6) < 0.9) texPut(t, i, 120, 112, 98);
    }
  }
  return texPack(t);
}
// Escaleras: hacia arriba los peldaños suben hacia la penumbra; hacia abajo se hunden en la oscuridad
function wallStairs(base, th, seed, up) {
  const st = th.stones[2];
  const t = archOpening(base, th, seed, 14, 18, 63, (t, x, y, i, u, v) => {
    let k;
    if (up) {
      const step = Math.floor((63 - y) / 6), ly = (63 - y) % 6;
      const lit = Math.max(0.12, 1 - step * 0.11);
      k = (ly === 5 ? 1.25 : ly >= 3 ? 0.95 : 0.6) * lit;
      if (step > 7) k = 0.06;
    } else {
      if (y < 40) k = 0.03 + (y / 40) * 0.05;
      else { const step = Math.floor((y - 40) / 5), ly = (y - 40) % 5; k = (ly === 0 ? 1.1 : 0.7) * (0.2 + step * 0.17); }
    }
    k *= 0.9 + (hash2(x, y, seed) - 0.5) * 0.2;
    const side = u < 0.08 || u > 0.92 ? 0.55 : 1;
    texPut(t, i, st[0] * k * side, st[1] * k * side, st[2] * k * side);
  });
  // flecha tallada en la clave del arco
  for (let j = 0; j < 4; j++) for (let x = 31 - j; x <= 32 + j; x++) {
    const y = up ? 2 + j : 5 - j, i = y * TS + x;
    texPut(t, i, 210, 190, 140);
  }
  return texPack(t);
}
// Salida: rastrillo de hierro con la luz del día detrás (emisiva)
function wallExit(base, th, seed) {
  const t = archOpening(base, th, seed, 15, 20, 63, (t, x, y, i, u, v) => {
    const sky = [lerp(196, 120, v), lerp(200, 160, v), lerp(184, 205, v)];
    let c = sky;
    if (v > 0.72) { const g = 0.5 + hash2(x, y, seed) * 0.25; c = [86 * g, 124 * g, 64 * g]; } // hierba al fondo
    const bar = ((x + 2) % 7 === 0) || y === 30 || y === 46;
    if (bar) { const hl = ((x + 2) % 7 === 0) ? 1 : 0.8; texPut(t, i, 52 * hl, 48 * hl, 46 * hl); return; }
    texPut(t, i, c[0], c[1], c[2]); t.e[i] = 1;
  });
  return texPack(t);
}

// ------------------------------------------------------------- suelos y techos
function floorFlag(th, seed) {
  const t = stoneMaterial(voronoiCells(seed, 7, 1), seed, th.floor, mul3(th.floor[1], 0.55), { bevel: 5, mortarW: 0.6, grain: 0.3 });
  // grietas
  for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
    if (Math.abs(vnoise(x / 7, y / 7, seed + 40, 64 / 7 | 0) - 0.5) < 0.015) { const i = y * TS + x; t.r[i] *= 0.45; t.g[i] *= 0.45; t.b[i] *= 0.45; }
  }
  return texPack(t);
}
function floorCobble(th, seed) {
  return texPack(stoneMaterial(voronoiCells(seed, 26, 1), seed, th.floor, mul3(th.floor[1], 0.45), { bevel: 2.6, mortarW: 0.9, grain: 0.3 }));
}
function floorTiles(th, seed) {
  const t = texNew();
  for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
    const i = y * TS + x;
    const lx = x & 31, ly = y & 31, tile = ((x >> 5) + (y >> 5)) & 1;
    const n = fbm(x / TS, y / TS, seed, 8), sp = hash2(x, y, seed) - 0.5;
    const c = th.tiles[tile];
    let k = 0.85 + n * 0.35 + sp * 0.15;
    const e = Math.min(lx, 31 - lx, ly, 31 - ly);
    if (e < 1) k *= 0.35; else if (e < 2) k *= lx < 2 || ly < 2 ? 1.3 : 0.7;
    // rombo interior
    const dd = Math.abs(lx - 15.5) + Math.abs(ly - 15.5);
    if (Math.abs(dd - 9) < 0.8) k *= 1.35;
    texPut(t, i, c[0] * k, c[1] * k, c[2] * k);
  }
  return texPack(t);
}
function floorDirt(th, seed) {
  const t = texNew();
  for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
    const i = y * TS + x, n = fbm(x / TS, y / TS, seed, 8), sp = hash2(x, y, seed);
    const c = th.floor[2]; let k = 0.55 + n * 0.5 + (sp - 0.5) * 0.25;
    if (sp > 0.965) k = 1.2; // guijarros
    texPut(t, i, c[0] * k * 0.95, c[1] * k * 0.88, c[2] * k * 0.78);
  }
  return texPack(t);
}
function ceilWood(th, seed) {
  const t = texNew();
  const [lw, dw] = th.wood;
  for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
    const i = y * TS + x;
    const beamX = (x & 31) < 6, beamY = (y & 31) < 5;
    const grainN = vnoise(x / 1.5, y / 12, seed, 64), sp = hash2(x, y, seed) - 0.5;
    let c, k;
    if (beamX || beamY) {
      c = lw; k = 0.75 + grainN * 0.4 + sp * 0.1;
      const e = beamX ? (x & 31) : (y & 31), m = beamX ? 5 : 4;
      if (e === 0) k *= 1.35; else if (e === m) k *= 0.5;
      if (beamX && beamY) k *= 1.1;
    } else {
      c = dw; const plank = (x >> 3) & 3; k = 0.6 + grainN * 0.35 + plank * 0.06 + sp * 0.1;
      if ((x & 7) === 0) k *= 0.45;
    }
    texPut(t, i, c[0] * k, c[1] * k, c[2] * k);
  }
  return texPack(t);
}
function ceilStone(th, seed) {
  const t = stoneMaterial(voronoiCells(seed, 12, 1), seed, th.stones.map(c => mul3(c, 0.55)), mul3(th.mortar, 0.7), { bevel: 4 });
  return texPack(t);
}
function mul3(c, k) { return [c[0] * k, c[1] * k, c[2] * k]; }

// walls[id]: 1 principal, 2 alternativa+musgo, 3 runa, 4 sillares, 5 antorcha (animada), 6 estandarte, 7 reja, 8 sangre,
//            9 puerta, 10-12 puertas con llave, 13/14 escaleras arriba/abajo, 15 salida, 16 rejas de arena
// floors[id]: 0 losas, 1 adoquín, 2 baldosas, 3 tierra
function buildTheme(idx) {
  const th = THEMES[idx % THEMES.length];
  const s = 100 + idx * 77;
  const base = baseWall(th, s, th.wallStyle);
  const alt = baseWall(th, s + 1, th.altStyle);
  moss(alt, th, s + 1, Math.min(0.42, th.mossAmt + 0.12));
  if (th.lava) lavaVeins(alt, th, s + 1);
  const main = texClone(base); moss(main, th, s, th.mossAmt * 0.5);
  const blocks = stoneMaterial(blockCells(s + 3), s + 3, th.stones, th.mortar, { bevel: 3 }); grime(blocks, s + 3);
  const bl = texClone(base); blood(bl, th, s + 4, 4);
  const torch = [0, 1, 2, 3].map(f => wallTorch(base, th, f));
  return {
    name: th.name, fog: th.fog, glow: th.glow, ambient: th.ambient, th,
    walls: [null, texPack(main), texPack(alt), wallRune(base, th), texPack(blocks), torch, wallBanner(base, th, s + 5), wallGrate(base, th, s + 6), texPack(bl),
      // 9 puerta, 10-12 puertas con llave (hierro, hueso, rúnica), 13 escalera arriba, 14 escalera abajo, 15 salida, 16 rejas de arena
      wallDoor(base, th, s + 12, null), ...KEYS.map((k, i) => wallDoor(base, th, s + 13 + i, k.col)),
      wallStairs(base, th, s + 16, true), wallStairs(base, th, s + 17, false), wallExit(base, th, s + 18), wallGrate(base, th, s + 19)],
    floors: [floorFlag(th, s + 7), floorCobble(th, s + 8), floorTiles(th, s + 9), floorDirt(th, s + 10)],
    ceil: th.ceil === 'wood' ? ceilWood(th, s + 11) : ceilStone(th, s + 11),
  };
}
