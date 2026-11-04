// Sprites pintados con primitivas (canvas 2D) y convertidos a pixel art:
// corte de alfa, cuantización con tramado ordenado, grano, contorno y capa emisiva.
const SPR = {};
const BAY4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);

function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// draw(g, ge, w, h): g = capa normal, ge = capa emisiva (brilla en la oscuridad)
function paint(w, h, draw, opt = {}) {
  const cv = mkCanvas(w, h), ce = mkCanvas(w, h);
  const g = cv.getContext('2d'), ge = ce.getContext('2d');
  g.lineCap = ge.lineCap = 'round'; g.lineJoin = ge.lineJoin = 'round';
  draw(g, ge, w, h);
  const d = g.getImageData(0, 0, w, h).data, de = ge.getImageData(0, 0, w, h).data;
  const px = new Uint32Array(w * h), flash = new Uint32Array(w * h);
  const cut = opt.cut ?? 110, lv = opt.levels ?? 22, grain = opt.grain ?? 0.1, seed = opt.seed || 7;
  const step = 255 / lv;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, o = i * 4;
    const b = (BAY4[(x & 3) | ((y & 3) << 2)] - 0.5) * step;
    if (de[o + 3] >= 100) {
      const q = (v) => Math.round((v + b * 0.5) / step) * step;
      px[i] = rgb(q(de[o]), q(de[o + 1]), q(de[o + 2]), 250);
      flash[i] = px[i];
      continue;
    }
    const a = d[o + 3];
    if (a < cut) continue;
    const n = 1 + (hash2(x, y, seed) - 0.5) * grain * 2;
    const q = (v) => Math.round((v * n + b) / step) * step;
    let al = 255;
    if (opt.keepAlpha) { al = [96, 160, 224, 255][clamp(Math.floor(a / 255 * 4 + BAY4[(x & 3) | ((y & 3) << 2)] - 0.5), 0, 3)]; }
    const r = q(d[o]), gg = q(d[o + 1]), bb = q(d[o + 2]);
    px[i] = rgb(r, gg, bb, al);
    flash[i] = rgb(r + (255 - r) * 0.8, gg + (255 - gg) * 0.8, bb + (255 - bb) * 0.8, al);
  }
  if (opt.outline !== false) {
    const oc = opt.outlineCol || rgb(14, 9, 10);
    const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && (px[y * w + x] >>> 24) >= 160;
    const out = px.slice(), fo = flash.slice();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if ((px[i] >>> 24) === 0 && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) { out[i] = oc; fo[i] = rgb(255, 255, 255); }
    }
    return { w, h, px: out, flash: fo };
  }
  return { w, h, px, flash };
}

// ------------------------------------------------------------- ayudas de dibujo
function rad(g, x, y, r, c0, c1, c2) {
  const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r);
  gr.addColorStop(0, c0); gr.addColorStop(0.6, c1); gr.addColorStop(1, c2 || c1);
  return gr;
}
function lin(g, x0, y0, x1, y1, stops) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([t, c]) => gr.addColorStop(t, c));
  return gr;
}
function ell(g, x, y, rx, ry, fill, rot = 0) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fillStyle = fill; g.fill(); }
function poly(g, pts, fill, stroke, lw) {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 1; g.stroke(); }
}
function curve(g, pts, fill) { // forma suave por puntos (quadratic)
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    g.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
  }
  g.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); g.closePath();
  g.fillStyle = fill; g.fill();
}
function line(g, pts, w, col) {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.strokeStyle = col; g.lineWidth = w; g.stroke();
}
// hueso con sombra y brillo
function bone(g, pts, w, pal = BONE) {
  line(g, pts.map(([x, y]) => [x + 0.8, y + 0.9]), w + 0.6, pal.dark);
  line(g, pts, w, pal.mid);
  line(g, pts.map(([x, y]) => [x - w * 0.22, y - w * 0.22]), Math.max(0.8, w * 0.38), pal.light);
  for (const [x, y] of [pts[0], pts[pts.length - 1]]) ell(g, x, y, w * 0.72, w * 0.72, pal.mid);
}
// cuerno curvo que se estrecha (bezier cuadrática)
function horn(g, p0, p1, p2, r0, r1) {
  for (let i = 0; i <= 24; i++) {
    const t = i / 24, u = 1 - t;
    const x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
    const r = lerp(r0, r1, t);
    ell(g, x + 0.6, y + 0.6, r, r, '#3a3020');
    ell(g, x, y, r, r, `rgb(${lerp(236, 120, t * t) | 0},${lerp(226, 96, t * t) | 0},${lerp(200, 70, t * t) | 0})`);
    if (i % 5 === 2) ell(g, x, y, r * 0.95, r * 0.35, 'rgba(90,70,40,0.6)');
  }
}
const BONE = { light: '#f6f0dc', mid: '#d2c8ac', dark: '#5e5444' };

// Llama genérica (para capa emisiva)
function drawFlame(g, cx, by, w, h, f, seed = 1) {
  for (let layer = 0; layer < 3; layer++) {
    const k = [1, 0.68, 0.38][layer];
    const col = ['#d8401a', '#ffa020', '#fff6c0'][layer];
    const pts = [];
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const t = i / n, side = t < 0.5 ? -1 : 1, u = t < 0.5 ? t * 2 : (1 - t) * 2; // u: 0 base -> 1 punta
      const wob = Math.sin(f * 1.9 + u * 5 + seed + layer) * w * 0.18 * u;
      const ww = w * k * Math.sin((1 - u) * Math.PI * 0.5 + 0.2) * (1 - u * 0.75);
      pts.push([cx + side * ww + wob, by - u * h * k * (0.9 + 0.12 * Math.sin(f * 2.3 + layer))]);
    }
    pts.push([cx + Math.sin(f * 1.7 + layer) * w * 0.25, by - h * k * (1 + 0.1 * Math.sin(f * 3.1))]);
    curve(g, [[cx - w * k * 0.9, by], ...pts.slice(0, 5), pts[pts.length - 1], ...pts.slice(5), [cx + w * k * 0.9, by]], col);
  }
}

// ------------------------------------------------------------- enemigos
function drawSkeleton(g, ge, w, h, f) {
  const sw = f === 1 ? 1 : -1; // balanceo al caminar
  // piernas
  bone(g, [[19, 52], [18 - sw, 61], [18, 70]], 2.6);
  bone(g, [[29, 52], [30 + sw, 61], [30, 70]], 2.6);
  line(g, [[15, 70.5], [21, 70.5]], 2.2, BONE.mid); line(g, [[27, 70.5], [33, 70.5]], 2.2, BONE.mid);
  // pelvis
  curve(g, [[16, 46], [24, 44], [32, 46], [31, 51], [27, 53], [24, 50], [21, 53], [17, 51]], BONE.mid);
  ell(g, 20.5, 49, 1.6, 1.4, '#2a2420'); ell(g, 27.5, 49, 1.6, 1.4, '#2a2420');
  // columna
  for (let y = 22; y < 47; y += 2.6) { ell(g, 24.5, y + 0.6, 1.9, 1.3, BONE.dark); ell(g, 24, y, 1.8, 1.2, BONE.mid); }
  // costillas
  for (let i = 0; i < 5; i++) {
    const y = 26 + i * 3.6, rx = 9.5 - i * 0.9;
    g.beginPath(); g.ellipse(24, y - 2.5, rx, 4, 0, 0.1 * Math.PI, 0.9 * Math.PI);
    g.strokeStyle = BONE.dark; g.lineWidth = 2.6; g.stroke();
    g.beginPath(); g.ellipse(24, y - 3, rx, 4, 0, 0.12 * Math.PI, 0.88 * Math.PI);
    g.strokeStyle = BONE.mid; g.lineWidth = 1.8; g.stroke();
  }
  ell(g, 24, 30, 1.6, 7, BONE.light);
  // clavículas y brazos
  bone(g, [[14, 23], [34, 23]], 2.2);
  bone(g, [[33, 23], [39, 31 + sw], [41, 23 + sw]], 2.4);               // brazo del arma
  bone(g, [[15, 23], [10, 32], [12, 40]], 2.4);                          // brazo del escudo
  // cráneo
  ell(g, 24.6, 12.6, 8, 8.6, BONE.dark);
  ell(g, 24, 12, 8, 8.4, rad(g, 24, 12, 9, '#fbf6e6', '#d6ccb0', '#8c8270'));
  poly(g, [[18, 15], [30, 15], [29, 22], [19, 22]], '#cfc4a6');
  ell(g, 20.8, 12.4, 2.6, 3, '#1c1412'); ell(g, 27.4, 12.4, 2.6, 3, '#1c1412');
  ell(ge, 21, 12.6, 1.1, 1.1, '#ff3a1c'); ell(ge, 27.4, 12.6, 1.1, 1.1, '#ff3a1c');
  poly(g, [[24, 15], [22.6, 18], [25.4, 18]], '#2a2018');
  for (let x = 19.6; x < 29; x += 1.8) { g.fillStyle = '#3a3026'; g.fillRect(x, 19.2, 0.7, 2.6); }
  g.fillStyle = '#3a3026'; g.fillRect(19, 20.2, 10, 0.6);
  // hacha
  line(g, [[41.5, 36 + sw], [41.5, 6 + sw]], 2.4, '#5a3a20');
  line(g, [[41, 36 + sw], [41, 6 + sw]], 1, '#8a6038');
  curve(g, [[42, 6 + sw], [47, 3 + sw], [48, 11 + sw], [47, 19 + sw], [42, 15 + sw]], lin(g, 42, 0, 48, 0, [[0, '#6a6a74'], [0.7, '#c8ccd8'], [1, '#f0f2f8']]));
  line(g, [[47.4, 4 + sw], [47.6, 18 + sw]], 0.8, '#ffffff');
  // escudo redondo
  ell(g, 13, 42, 11.2, 11.6, '#2a2220');
  ell(g, 12.5, 41.5, 10.6, 11, rad(g, 12.5, 41.5, 11, '#f0a050', '#c86424', '#6a2a0c'));
  g.beginPath(); g.ellipse(12.5, 41.5, 10, 10.4, 0, 0, TAU); g.strokeStyle = '#6c6460'; g.lineWidth = 1.8; g.stroke();
  g.beginPath(); g.ellipse(12.5, 41.5, 10, 10.4, 0, Math.PI * 1.05, Math.PI * 1.55); g.strokeStyle = '#b8b4b0'; g.lineWidth = 1; g.stroke();
  poly(g, [[12.5, 33], [14, 40], [21, 41.5], [14, 43], [12.5, 50], [11, 43], [4, 41.5], [11, 40]], '#2a1e1c');
  ell(g, 12.5, 41.5, 2.2, 2.2, rad(g, 12.5, 41.5, 2.4, '#e8e4e0', '#8a8480'));
  // mano del escudo
  ell(g, 12, 41, 0, 0, BONE.mid);
}

function drawBat(g, ge, w, h, f) {
  const up = f === 0;
  const wing = (s) => {
    const tipY = up ? 3 : 30, midY = up ? 10 : 24;
    const sx = (x) => 28 + s * x;
    const pts = [[sx(4), 14], [sx(12), midY - 2], [sx(20), tipY + 2], [sx(27), tipY], [sx(25), tipY + 8], [sx(22), 20 + (up ? 0 : 6)], [sx(17), 18 + (up ? 2 : 6)], [sx(12), 21], [sx(6), 20]];
    poly(g, pts, lin(g, 28, 0, sx(26), 30, [[0, '#4a2a3a'], [1, '#2a1424']]));
    // dedos del ala
    line(g, [[sx(4), 14], [sx(12), midY - 2], [sx(27), tipY]], 1.4, '#7a5a66');
    line(g, [[sx(12), midY - 2], [sx(22), 20 + (up ? 0 : 6)]], 1, '#6a4a56');
    line(g, [[sx(12), midY - 2], [sx(17), 18 + (up ? 2 : 6)]], 1, '#6a4a56');
  };
  wing(-1); wing(1);
  ell(g, 28, 19, 6, 8, rad(g, 28, 19, 8, '#9a7060', '#6a4434', '#3a2018'));
  ell(g, 28, 11, 5, 4.6, rad(g, 28, 11, 5, '#a07868', '#6a4434', '#3a2018'));
  poly(g, [[24, 9], [23, 2], [26.5, 7.5]], '#5a3428'); poly(g, [[32, 9], [33, 2], [29.5, 7.5]], '#5a3428');
  ell(ge, 26, 10.6, 1.2, 1.1, '#ff3020'); ell(ge, 30, 10.6, 1.2, 1.1, '#ff3020');
  poly(g, [[26.4, 13.4], [27.2, 16], [27.8, 13.4]], '#f8f4f0'); poly(g, [[28.4, 13.4], [29, 16], [29.8, 13.4]], '#f8f4f0');
  line(g, [[25, 27], [24, 31]], 1, '#3a2018'); line(g, [[31, 27], [32, 31]], 1, '#3a2018');
}

function drawSlime(g, ge, w, h, f) {
  const sq = f === 1 ? 1.5 : 0;
  const top = 6 + sq * 2, wid = 21 + sq;
  const body = [[24 - wid, 38], [24 - wid + 1, 26], [24 - 13, top + 4], [24, top], [24 + 13, top + 4], [24 + wid - 1, 26], [24 + wid, 38]];
  curve(g, body, rad(g, 22, 18, 24, '#b8f090', '#4ca83a', '#1a5a20'));
  // contenido: calavera tragada y burbujas
  ell(g, 30, 27, 5, 4.6, 'rgba(30,70,30,0.55)'); ell(g, 28.4, 26.5, 1.2, 1.4, 'rgba(10,30,10,0.7)'); ell(g, 31.6, 26.5, 1.2, 1.4, 'rgba(10,30,10,0.7)');
  ell(g, 16, 30, 2, 2, 'rgba(210,255,190,0.7)'); ell(g, 12, 25, 1.2, 1.2, 'rgba(210,255,190,0.7)'); ell(g, 36, 33, 1.5, 1.5, 'rgba(210,255,190,0.6)');
  // ojos
  ell(g, 17, 18 + sq, 4, 4.4, '#f8fff0'); ell(g, 29, 17 + sq, 4, 4.4, '#f8fff0');
  ell(g, 18, 19 + sq, 1.8, 2.2, '#102010'); ell(g, 30, 18 + sq, 1.8, 2.2, '#102010');
  ell(g, 16.4, 17 + sq, 0.8, 0.8, '#ffffff'); ell(g, 28.4, 16 + sq, 0.8, 0.8, '#ffffff');
  // boca
  g.beginPath(); g.ellipse(23, 26 + sq, 6, 3, 0, 0, Math.PI); g.fillStyle = '#0c2a0c'; g.fill();
  // brillo especular
  ell(g, 14, 11 + sq * 2, 4, 2, 'rgba(255,255,255,0.85)', -0.5);
  // gotas en la base
  ell(g, 9, 38, 2.4, 1.4, '#2a7a2a'); ell(g, 38, 38, 2.8, 1.4, '#2a7a2a');
}

function drawWraith(g, ge, w, h, f) {
  const sway = f === 1 ? 1.5 : -1.5;
  // túnica
  const robe = [[24, 3], [33, 8], [36, 20], [40, 34], [43, 50], [45, 66], [39, 60], [36, 70], [31, 62], [27, 71], [23, 62], [18, 70], [14, 61], [9, 68], [5, 52], [9, 34], [12, 20], [15, 8]];
  curve(g, robe.map(([x, y]) => [x + (y / 70) * sway, y]), lin(g, 0, 0, 0, 72, [[0, 'rgba(120,140,210,0.98)'], [0.5, 'rgba(70,84,170,0.85)'], [1, 'rgba(40,40,110,0.35)']]));
  // pliegues
  for (const x of [17, 24, 31]) line(g, [[x, 22], [x + sway * 0.6, 58]], 1.4, 'rgba(30,30,80,0.6)');
  // capucha
  ell(g, 24, 14, 7.5, 9, rad(g, 24, 14, 10, '#9aaae0', '#5060a8', '#2a3070'));
  ell(g, 24, 16, 5.2, 6.4, '#06040e');
  ell(ge, 21.6, 15.4, 1.4, 1.1, '#80ffff'); ell(ge, 26.4, 15.4, 1.4, 1.1, '#80ffff');
  ell(ge, 21.6, 15.4, 0.6, 0.6, '#ffffff'); ell(ge, 26.4, 15.4, 0.6, 0.6, '#ffffff');
  // brazos y garras
  for (const s of [-1, 1]) {
    const sx = 24 + s * 13;
    curve(g, [[24 + s * 9, 24], [sx + s * 2, 30], [sx + s * 3, 38], [sx - s * 1, 38], [24 + s * 8, 30]], 'rgba(90,104,190,0.95)');
    const GB = { light: '#eef2ff', mid: '#b0b8d8', dark: '#303050' };
    bone(g, [[sx + s * 1, 37], [sx + s * 3, 42]], 1.6, GB);
    for (let k = -1; k <= 1; k++) bone(g, [[sx + s * 3 + k * 1.6, 42], [sx + s * 3 + k * 2.6, 46], [sx + s * 2 + k * 3, 49]], 0.9, GB);
  }
}

function drawImp(g, ge, w, h, f) {
  const st = f === 1 ? 1 : -1;
  // alas
  for (const s of [-1, 1]) {
    poly(g, [[24 + s * 5, 18], [24 + s * 20, 4], [24 + s * 23, 14], [24 + s * 21, 26], [24 + s * 16, 22], [24 + s * 12, 28]], lin(g, 24, 0, 24 + s * 22, 20, [[0, '#7a1c14'], [1, '#3a0a08']]));
    line(g, [[24 + s * 5, 18], [24 + s * 20, 4], [24 + s * 21, 26]], 1, '#a03828');
  }
  // cola
  line(g, [[27, 40], [36, 46], [40, 40]], 1.6, '#8a2014'); poly(g, [[40, 37], [43, 40], [39, 42]], '#8a2014');
  // piernas
  line(g, [[20, 38], [18 + st, 46], [20, 54]], 3.4, '#9a2a18'); line(g, [[28, 38], [30 - st, 46], [28, 54]], 3.4, '#9a2a18');
  poly(g, [[17, 54], [23, 54], [21, 52]], '#2a1010'); poly(g, [[26, 54], [32, 54], [28, 52]], '#2a1010');
  // torso
  curve(g, [[16, 22], [24, 18], [32, 22], [31, 34], [28, 41], [20, 41], [17, 34]], rad(g, 23, 27, 13, '#f07050', '#c03820', '#5a1208'));
  line(g, [[24, 24], [24, 38]], 0.8, '#7a1a0c'); line(g, [[20, 31], [28, 31]], 0.6, '#7a1a0c');
  // brazos
  line(g, [[17, 23], [12, 30], [14, 37]], 3, '#b03420'); line(g, [[31, 23], [36, 29], [36, 23]], 3, '#b03420');
  for (let k = 0; k < 3; k++) line(g, [[13 + k, 37], [12 + k * 1.4, 40]], 0.8, '#f0e8d0');
  // bola de fuego en la mano
  ell(ge, 36, 19, 4, 4, '#ff7a20'); ell(ge, 36, 19, 2.4, 2.4, '#ffd060'); ell(ge, 35.4, 18.4, 1, 1, '#ffffff');
  // cabeza
  ell(g, 24, 14, 7, 6.6, rad(g, 24, 14, 8, '#f07a58', '#c03c22', '#5a1408'));
  // cuernos
  curve(g, [[18, 10], [14, 4], [15, 0], [17, 5], [20, 9]], '#e8dcc0'); curve(g, [[30, 10], [34, 4], [33, 0], [31, 5], [28, 9]], '#e8dcc0');
  ell(ge, 21, 13, 1.6, 1.2, '#ffe040'); ell(ge, 27, 13, 1.6, 1.2, '#ffe040');
  ell(g, 21.2, 13.2, 0.5, 0.9, '#200808'); ell(g, 27.2, 13.2, 0.5, 0.9, '#200808');
  g.beginPath(); g.ellipse(24, 17, 4, 2, 0, 0, Math.PI); g.fillStyle = '#2a0808'; g.fill();
  poly(g, [[21.5, 17], [22.3, 19], [23, 17]], '#fff8e8'); poly(g, [[25, 17], [25.7, 19], [26.5, 17]], '#fff8e8');
}

// ---------- enemigos por tema (provisionales)
function drawZombie(g, ge, w, h, f) { // necrófago: cadáver encorvado con harapos
  const st = f === 1 ? 2 : -2;
  for (const s of [-1, 1]) line(g, [[24 + s * 5, 44], [24 + s * 6 + (s > 0 ? st : -st) * 0.5, 58], [24 + s * 6, 70]], 4.5, '#5a6a48');
  curve(g, [[13, 22], [24, 18], [36, 23], [37, 40], [33, 48], [15, 48], [11, 40]], lin(g, 0, 18, 0, 48, [[0, '#6a5a3e'], [1, '#3a3020']]));
  for (const x of [15, 21, 28, 34]) poly(g, [[x, 46], [x + 3, 46], [x + 1.5, 52]], '#3a3020');
  line(g, [[14, 24], [8, 34], [6, 42]], 4, '#6e7e58'); line(g, [[34, 24], [42, 31], [44, 40]], 4, '#6e7e58'); // brazos hacia delante
  ell(g, 26, 14, 7, 7.5, rad(g, 25, 12, 9, '#a2b080', '#6e7e58', '#34402a'));
  ell(ge, 23, 13, 1.4, 1.1, '#e0ff60'); ell(ge, 29, 13, 1.4, 1.1, '#e0ff60');
  poly(g, [[22, 18], [30, 18], [28, 21], [24, 21]], '#1a1410');
}
function drawCultist(g, ge, w, h, f) { // acólito encapuchado con orbe
  const sway = f === 1 ? 1 : -1;
  curve(g, [[24, 6], [33, 12], [36, 30], [40, 60], [40, 70], [8, 70], [8, 60], [12, 30], [15, 12]].map(([x, y]) => [x + (y / 70) * sway, y]), lin(g, 0, 0, 0, 72, [[0, '#4a2a5a'], [1, '#1e0e28']]));
  line(g, [[24, 26], [24, 68]], 1.2, '#7a3a8a');
  ell(g, 24, 15, 7.5, 8.5, rad(g, 24, 13, 10, '#6a3a7a', '#3a1a48', '#180a20'));
  ell(g, 24, 17, 5, 5.6, '#060208');
  ell(ge, 22, 16.5, 1, 0.8, '#ff60ff'); ell(ge, 26, 16.5, 1, 0.8, '#ff60ff');
  line(g, [[14, 28], [9, 36]], 3.4, '#3a1a48'); line(g, [[34, 28], [39, 34]], 3.4, '#3a1a48');
  ell(ge, 40, 31, 4.5, 4.5, '#b040ff'); ell(ge, 40, 31, 2.2, 2.2, '#f0c0ff');
}
function drawSpider(g, ge, w, h, f) { // araña: cuerpo bajo y ocho patas
  const st = f === 1 ? 2 : -2;
  for (let k = 0; k < 4; k++) for (const s of [-1, 1]) {
    const bx = 28 + s * 6, by = 20 + k * 2, kx = 28 + s * (14 + k * 2), ky = 10 + k * 3 + (k & 1 ? st : -st), fx = 28 + s * (20 + k * 2), fy = 30 + k;
    line(g, [[bx, by], [kx, ky], [fx, fy]], 2, '#2a1a14');
  }
  ell(g, 28, 20, 11, 8, rad(g, 26, 17, 12, '#6a4a32', '#3a2618', '#140c08')); // abdomen
  ell(g, 28, 24, 7, 5.5, rad(g, 28, 22, 7, '#5a3a26', '#2a1a10', '#100806'));
  for (const [x, y] of [[25, 24], [31, 24], [27, 22.5], [29, 22.5]]) ell(ge, x, y, 1, 0.9, '#ff3020');
  poly(g, [[25, 28], [26.5, 31], [27.5, 28]], '#e8e0c0'); poly(g, [[28.5, 28], [29.5, 31], [31, 28]], '#e8e0c0');
}
function drawHound(g, ge, w, h, f) { // can infernal: cuadrúpedo de fuego
  const st = f === 1 ? 3 : -3;
  for (const [x, s] of [[16, 1], [22, -1], [36, -1], [42, 1]]) line(g, [[x, 22], [x + s * st, 32], [x + s * st * 0.6, 40]], 3.4, '#4a1208');
  curve(g, [[12, 16], [30, 12], [46, 16], [46, 26], [30, 28], [12, 26]], lin(g, 0, 10, 0, 28, [[0, '#a02818'], [1, '#3a0a04']]));
  for (let k = 0; k < 5; k++) poly(ge, [[16 + k * 6, 13], [19 + k * 6, 4 + (k & 1) * 3 + st * 0.5], [22 + k * 6, 13]], k & 1 ? '#ffb030' : '#ff6a10'); // crin de llamas
  ell(g, 50, 16, 7, 6, rad(g, 50, 14, 8, '#b03020', '#701810', '#2a0604'));
  poly(g, [[53, 18], [60, 20], [54, 22]], '#2a0604');
  ell(ge, 51, 14, 1.4, 1, '#ffff60');
  poly(g, [[46, 11], [48, 4], [50, 11]], '#e8dcc0');
}
function drawEye(g, ge, w, h, f) { // ojo del vacío flotante con tentáculos
  const sw = f === 1 ? 2 : -2;
  for (let k = -2; k <= 2; k++) curve(g, [[24 + k * 4, 30], [24 + k * 5 + sw, 40], [24 + k * 4 - sw, 50], [25 + k * 4, 50], [26 + k * 5 + sw, 40], [26 + k * 4, 30]], '#3a1a5a');
  ell(g, 24, 20, 15, 14, rad(g, 20, 15, 16, '#8a5ab0', '#4a2270', '#1a0830'));
  ell(g, 24, 20, 9, 8, '#f0e8f0');
  ell(ge, 24 + sw * 0.5, 20, 5, 5.5, '#c040ff'); ell(g, 24 + sw * 0.5, 20, 2.2, 3.4, '#0a0010');
  ell(ge, 22, 17, 1.2, 1.2, '#ffffff');
}
function drawLich(g, ge, w, h, f) { // liche: túnica regia, cráneo y báculo
  const sway = f === 1 ? 1.5 : -1.5;
  curve(g, [[40, 14], [56, 22], [62, 60], [68, 92], [12, 92], [18, 60], [24, 22]].map(([x, y]) => [x + (y / 92) * sway, y]), lin(g, 0, 10, 0, 94, [[0, '#2a3a5a'], [1, '#0a0e1a']]));
  for (const x of [30, 40, 50]) line(g, [[x, 30], [x + sway, 88]], 1.4, '#c0a040');
  ell(g, 40, 16, 9, 10, rad(g, 40, 14, 11, '#f0ead8', '#b8ae90', '#5a5440'));
  ell(g, 36, 16, 2.6, 3, '#100c08'); ell(g, 44, 16, 2.6, 3, '#100c08');
  ell(ge, 36, 16, 1.2, 1.2, '#60e0ff'); ell(ge, 44, 16, 1.2, 1.2, '#60e0ff');
  poly(g, [[31, 8], [34, 0], [37, 6], [40, -1], [43, 6], [46, 0], [49, 8]], '#d0a030'); // corona
  line(g, [[66, 18], [64, 92]], 2.4, '#4a3a2a');
  ell(ge, 66, 14, 6, 6, '#40c0ff'); ell(ge, 66, 14, 3, 3, '#e0ffff');
  line(g, [[56, 30], [65, 34]], 4, '#2a3a5a');
}
function drawQueen(g, ge, w, h, f) { // reina araña: abdomen enorme
  const st = f === 1 ? 3 : -3;
  for (let k = 0; k < 4; k++) for (const s of [-1, 1]) line(g, [[44 + s * 10, 46 + k * 4], [44 + s * (28 + k * 3), 22 + k * 6 + (k & 1 ? st : -st)], [44 + s * (38 + k * 2), 64 + k * 2]], 3.6, '#1a0e0a');
  ell(g, 44, 34, 22, 18, rad(g, 40, 28, 24, '#7a2a3a', '#3a0e18', '#100406'));
  for (const [x, y] of [[36, 28], [44, 24], [52, 28], [44, 36]]) ell(g, x, y, 3, 2, '#c03050');
  ell(g, 44, 54, 13, 10, rad(g, 44, 50, 14, '#5a2a2a', '#2a0e0e', '#0a0404'));
  for (const [x, y] of [[38, 52], [50, 52], [41, 49], [47, 49], [44, 47]]) ell(ge, x, y, 1.6, 1.4, '#ff2020');
  poly(g, [[38, 60], [40, 68], [42, 60]], '#f0e8d0'); poly(g, [[46, 60], [48, 68], [50, 60]], '#f0e8d0');
}
function drawVoidLord(g, ge, w, h, f) { // ojo primigenio
  const sw = f === 1 ? 3 : -3;
  for (let k = -3; k <= 3; k++) curve(g, [[40 + k * 6, 50], [40 + k * 8 + sw, 66], [40 + k * 6 - sw, 86], [42 + k * 6, 86], [42 + k * 8 + sw, 66], [43 + k * 6, 50]], '#2a0e4a');
  ell(g, 40, 34, 28, 26, rad(g, 34, 26, 30, '#9a6ad0', '#4a1a80', '#140428'));
  ell(g, 40, 34, 18, 15, '#f4eef4');
  ell(ge, 40 + sw * 0.7, 34, 10, 11, '#e040ff'); ell(g, 40 + sw * 0.7, 34, 4, 7, '#0a0010');
  ell(ge, 35, 28, 2.4, 2.4, '#ffffff');
  for (const [x, y] of [[20, 18], [62, 20], [16, 44], [64, 46]]) { ell(g, x, y, 4, 4, '#f0e8f0'); ell(ge, x, y, 2, 2, '#c040ff'); }
}

function drawBoss(g, ge, w, h, f) {
  const st = f === 1 ? 1.5 : -1.5;
  const steel = (x0, y0, x1, y1) => lin(g, x0, y0, x1, y1, [[0, '#8a8698'], [0.45, '#4a4658'], [1, '#1c1a24']]);
  // capa
  curve(g, [[22, 22], [58, 22], [66, 60], [70, 92], [56, 86], [40, 94], [24, 86], [10, 92], [14, 60]], lin(g, 0, 20, 0, 94, [[0, '#a01c14'], [1, '#3a0606']]));
  // piernas
  for (const s of [-1, 1]) {
    const x = 40 + s * 9;
    poly(g, [[x - 6, 60], [x + 6, 60], [x + 5 + s * st, 80], [x + 7, 94], [x - 7, 94], [x - 5 + s * st, 80]], steel(x - 6, 60, x + 6, 94));
    ell(g, x + s * st * 0.5, 79, 5, 3.4, steel(x - 5, 76, x + 5, 82));
    line(g, [[x - 4, 64], [x - 4, 76]], 1, '#a8a4b8');
  }
  // torso
  poly(g, [[22, 30], [58, 30], [55, 52], [48, 62], [32, 62], [25, 52]], steel(22, 30, 58, 62));
  line(g, [[40, 32], [40, 60]], 1.2, '#14121a');
  for (const y of [38, 46, 54]) line(g, [[28 + (y - 38) * 0.2, y], [52 - (y - 38) * 0.2, y]], 0.8, '#d8b050');
  // runa en el pecho
  ell(ge, 40, 42, 3.4, 3.4, '#ff5020'); ell(ge, 40, 42, 1.6, 1.6, '#ffd080');
  // cinturón
  poly(g, [[27, 56], [53, 56], [52, 61], [28, 61]], '#3a2414'); ell(g, 40, 58.5, 3, 2.6, '#d8b050');
  // hombreras con pinchos
  for (const s of [-1, 1]) {
    const x = 40 + s * 18;
    ell(g, x, 31, 11, 8, steel(x - 10, 24, x + 10, 38));
    g.beginPath(); g.ellipse(x, 31, 11, 8, 0, Math.PI, TAU); g.strokeStyle = '#d8b050'; g.lineWidth = 1.2; g.stroke();
    for (let k = -1; k <= 1; k++) poly(g, [[x + k * 6 - 2, 25 + Math.abs(k)], [x + k * 8, 13 + Math.abs(k) * 3], [x + k * 6 + 2, 25 + Math.abs(k)]], '#c8c4d0');
  }
  // brazo y hacha
  line(g, [[60, 34], [66, 46], [64, 56]], 6, '#3a3646'); ell(g, 64, 56, 4, 4, steel(60, 52, 68, 60));
  line(g, [[64, 74], [64, 6]], 3, '#3a2214'); line(g, [[63.4, 74], [63.4, 6]], 1, '#7a5030');
  curve(g, [[65, 8], [77, 2], [79, 16], [77, 30], [65, 24]], lin(g, 65, 0, 79, 0, [[0, '#5a5a66'], [0.6, '#c8ccd8'], [1, '#ffffff']]));
  curve(g, [[63, 10], [55, 6], [54, 14], [56, 22], [63, 20]], lin(g, 54, 0, 63, 0, [[0, '#ffffff'], [0.4, '#a8acb8'], [1, '#4a4a56']]));
  line(g, [[16, 34], [12, 46], [16, 56]], 6, '#3a3646'); ell(g, 16, 57, 4, 4, steel(12, 53, 20, 61));
  // cabeza con yelmo y cuernos
  horn(g, [32, 14], [14, 14], [12, 0], 3.6, 0.6);
  horn(g, [48, 14], [66, 14], [68, 0], 3.6, 0.6);
  ell(g, 40, 18, 10, 11, steel(30, 8, 50, 30));
  poly(g, [[31, 18], [49, 18], [47, 23], [33, 23]], '#08060a');
  line(g, [[40, 9], [40, 28]], 1.2, '#d8b050');
  ell(ge, 35.5, 20.4, 2, 1.3, '#ffe030'); ell(ge, 44.5, 20.4, 2, 1.3, '#ffe030');
}

// ------------------------------------------------------------- decorado y objetos
function drawSkullTorch(g, ge, w, h, f) {
  line(g, [[10.5, 24], [10.5, 64]], 3, '#4a3020'); line(g, [[9.6, 24], [9.6, 64]], 1, '#7a5434');
  ell(g, 10, 20, 5.6, 5.2, rad(g, 10, 20, 6, '#fbf6e6', '#d0c6aa', '#7a7060'));
  poly(g, [[6, 22], [14, 22], [13, 27], [7, 27]], '#cfc4a6');
  ell(g, 7.8, 21, 1.6, 1.8, '#1c1412'); ell(g, 12.2, 21, 1.6, 1.8, '#1c1412');
  ell(ge, 7.8, 21.2, 0.8, 0.8, '#ff9020'); ell(ge, 12.2, 21.2, 0.8, 0.8, '#ff9020');
  for (let x = 7; x < 13; x += 1.6) { g.fillStyle = '#3a3026'; g.fillRect(x, 24.6, 0.6, 2); }
  drawFlame(ge, 10, 17, 4.6, 16, f, 3);
}
function drawBrazier(g, ge, w, h, f) {
  for (const x of [8, 16, 24]) line(g, [[16, 20], [x, 40]], 1.6, '#3a3640');
  g.beginPath(); g.ellipse(16, 18, 13, 6, 0, 0, Math.PI); g.fillStyle = lin(g, 3, 0, 29, 0, [[0, '#2a2830'], [0.4, '#8a8698'], [1, '#2a2830']]); g.fill();
  ell(g, 16, 18, 13, 2.6, '#2a1c14');
  ell(ge, 16, 18, 10, 2, '#c03010'); for (let i = 0; i < 6; i++) ell(ge, 9 + i * 2.6, 17.8, 1, 0.7, '#ffb040');
  drawFlame(ge, 16, 18, 8, 18, f, 5);
}
function drawCandles(g, ge, w, h, f) {
  ell(g, 12, 15, 7, 5.4, rad(g, 12, 15, 7, '#f6f0dc', '#c8bea2', '#6a6050'));
  ell(g, 9.6, 15.6, 1.8, 2, '#1c1412'); ell(g, 14.4, 15.6, 1.8, 2, '#1c1412');
  for (const [x, hh] of [[5, 8], [12, 11], [19, 7]]) {
    g.fillStyle = '#e8e0c4'; g.fillRect(x - 1.5, 20 - hh, 3, hh); g.fillStyle = '#b8ae90'; g.fillRect(x + 0.5, 20 - hh, 1, hh);
    drawFlame(ge, x, 20 - hh, 1.6, 5, f + x, x);
  }
}
function drawBarrel(g, ge, w, h) {
  curve(g, [[4, 2], [24, 2], [27, 17], [24, 33], [4, 33], [1, 17]], lin(g, 1, 0, 27, 0, [[0, '#3a2412'], [0.35, '#9a6a3a'], [0.6, '#7a4e28'], [1, '#2a180a']]));
  for (const x of [8, 14, 20]) line(g, [[x, 3], [x + (x - 14) * 0.15, 32]], 0.7, '#3a2412');
  for (const y of [7, 17, 28]) line(g, [[2.5, y], [25.5, y]], 1.6, '#4a4650');
  ell(g, 14, 3, 10, 2, '#5a3a1c');
}
function drawBones(g, ge, w, h) {
  bone(g, [[3, 11], [16, 8]], 2); bone(g, [[12, 12], [26, 11]], 2); bone(g, [[20, 9], [32, 12]], 1.8);
  ell(g, 24, 6, 5, 4.6, rad(g, 24, 6, 5, '#fbf6e6', '#d0c6aa', '#7a7060'));
  ell(g, 22, 6.4, 1.3, 1.5, '#1c1412'); ell(g, 26, 6.4, 1.3, 1.5, '#1c1412');
}
function drawGem(c0, c1, c2) {
  return (g, ge) => {
    poly(ge, [[7, 1], [13, 7], [7, 17], [1, 7]], c1);
    poly(ge, [[7, 1], [13, 7], [7, 7]], c0); poly(ge, [[1, 7], [7, 7], [7, 17]], c2);
    poly(ge, [[7, 7], [13, 7], [7, 17]], c1); line(ge, [[4, 4], [5, 3]], 1, '#ffffff');
  };
}
function drawPotion(g, ge) {
  ell(g, 8, 16, 7, 7, 'rgba(200,220,235,0.95)');
  g.fillStyle = 'rgba(200,220,235,0.95)'; g.fillRect(5.5, 4, 5, 8);
  ell(g, 8, 17, 6, 5.6, rad(g, 8, 17, 6, '#ff8080', '#d01828', '#600810'));
  g.fillStyle = '#8a5a30'; g.fillRect(5, 1, 6, 4); g.fillStyle = '#b07a48'; g.fillRect(5, 1, 2, 4);
  ell(g, 5.4, 14.6, 1.2, 2.2, '#ffffff');
}

// ------------------------------------------------------------- garras abiertas (forma de lobo / oso)
// Mano derecha vista por el dorso, dedos abiertos y garras extendidas listas para atacar
function drawOpenClaw(pal) {
  return (g, ge, w, h) => {
    // antebrazo peludo con mechones en los bordes
    poly(g, [[28, 112], [72, 112], [67, 72], [33, 70]], lin(g, 28, 0, 72, 0, [[0, pal.d], [0.45, pal.m], [1, pal.d]]));
    for (let i = 0; i < 10; i++) {
      const y = 74 + i * 4;
      poly(g, [[33 - (i % 2) * 2, y], [26 - (i % 3), y + 3], [32, y + 6]], i % 2 ? pal.m : pal.d);
      poly(g, [[67 + (i % 2) * 2, y], [74 + (i % 3), y + 3], [68, y + 6]], pal.d);
    }
    // dorso de la mano
    ell(g, 49.5, 61, 22, 17, pal.d);
    ell(g, 49, 59, 21, 16, rad(g, 49, 57, 22, pal.l, pal.m, pal.d));
    // dedos abiertos en abanico con garras curvas
    const fingers = [[32, 52, -0.62, 22], [42, 46, -0.22, 26], [54, 46, 0.18, 26], [64, 51, 0.56, 22]];
    const claw = (tx, ty, ca, len) => {
      const px = Math.cos(ca) * 3.2, py = Math.sin(ca) * 3.2;
      const ex = tx + Math.sin(ca + 0.3) * len, ey = ty - Math.cos(ca + 0.3) * len;
      poly(g, [[tx - px + 1, ty - py + 1], [ex + 1, ey + 1], [tx + px + 1, ty + py + 1]], pal.d);
      poly(g, [[tx - px, ty - py], [ex, ey], [tx + px, ty + py]], lin(g, tx, ty, ex, ey, [[0, pal.cd], [0.5, pal.cl], [1, pal.ch]]));
    };
    for (const [x, y, a, len] of fingers) {
      const mx = x + Math.sin(a) * len * 0.55, my = y - Math.cos(a) * len * 0.55;
      const tx = x + Math.sin(a * 1.2) * len, ty = y - Math.cos(a * 1.2) * len;
      line(g, [[x + 1, y + 1], [mx + 1, my + 1], [tx + 1, ty + 1]], 9.5, pal.d);
      line(g, [[x, y], [mx, my], [tx, ty]], 8, pal.m);
      line(g, [[x - 2, y], [mx - 2, my], [tx - 1.5, ty]], 2.4, pal.l);
      ell(g, mx, my, 4.2, 2.2, pal.d, a); // nudillo
      claw(tx, ty, a * 1.35, 17);
    }
    // pulgar
    line(g, [[33, 66], [24, 58], [19, 49]], 8.5, pal.d);
    line(g, [[32, 65], [23, 57], [18, 48]], 7, pal.m);
    line(g, [[30, 64], [22, 56]], 2, pal.l);
    claw(18, 47, -0.85, 13);
    // trazos de pelo
    for (let i = 0; i < 46; i++) {
      const x = 30 + hash2(i, 1, 9) * 40, y = 48 + hash2(i, 2, 9) * 62;
      line(g, [[x, y], [x + (hash2(i, 3, 9) - 0.5) * 2, y + 3]], 1, i % 3 ? pal.d : pal.l);
    }
  };
}

// ------------------------------------------------------------- efectos (aditivos)
function buildOrb(size, stops) {
  const px = new Uint32Array(size * size);
  const c = (size - 1) / 2;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const d = Math.hypot(x - c, y - c) / (size / 2);
    if (d >= 1) continue;
    let i = 0; while (i < stops.length - 2 && d > stops[i + 1][0]) i++;
    const [t0, c0] = stops[i], [t1, c1] = stops[i + 1];
    const f = clamp((d - t0) / (t1 - t0), 0, 1);
    const b = (BAY4[(x & 3) | ((y & 3) << 2)] - 0.5) * 24;
    px[y * size + x] = rgb(lerp(c0[0], c1[0], f) + b, lerp(c0[1], c1[1], f) + b, lerp(c0[2], c1[2], f) + b, lerp(c0[3], c1[3], f));
  }
  return { w: size, h: size, px, flash: px };
}
function buildBolt(seed) {
  const W = 20, H = 96, px = new Uint32Array(W * H);
  let x = W / 2;
  for (let y = 0; y < H; y++) {
    x += (hash2(y, 0, seed) - 0.5) * 4; x = clamp(x, 4, W - 5);
    for (let dx = -5; dx <= 5; dx++) {
      const xx = Math.round(x) + dx; if (xx < 0 || xx >= W) continue;
      const a = Math.abs(dx);
      const c = a === 0 ? rgb(255, 255, 255, 255) : a === 1 ? rgb(190, 235, 255, 230) : rgb(80, 150, 255, Math.max(0, 140 - a * 26));
      const o = y * W + xx; if ((px[o] >>> 24) < (c >>> 24)) px[o] = c;
    }
  }
  return { w: W, h: H, px, flash: px };
}
function buildPortal(frame) {
  const W = 40, H = 64, px = new Uint32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const nx = (x - W / 2 + 0.5) / (W / 2), ny = (y - H / 2 + 0.5) / (H / 2), r = Math.hypot(nx, ny);
    if (r >= 1) continue;
    const v = 0.5 + 0.5 * Math.sin(Math.atan2(ny, nx) * 3 + r * 9 - frame * 1.57);
    const ring = r > 0.82 ? 1.4 : 1;
    px[y * W + x] = rgb((90 + 150 * v) * ring, (60 + 120 * (1 - v)) * ring, 255, clamp(Math.pow(1 - r, 0.6) * 255 * (0.55 + 0.45 * v) * ring, 0, 255));
  }
  return { w: W, h: H, px, flash: px };
}

// Carga los PNG de Pixellab (incrustados en assets.js) y prepara variantes reflejadas
function flipSprite(s) {
  const px = new Uint32Array(s.px.length);
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) px[y * s.w + x] = s.px[y * s.w + (s.w - 1 - x)];
  return { w: s.w, h: s.h, px, flash: px };
}
// Centro del puño: media horizontal de las primeras filas opacas, algo por debajo del borde superior
function gripOf(s) {
  let y0 = -1;
  for (let y = 0; y < s.h && y0 < 0; y++) for (let x = 0; x < s.w; x++) if (s.px[y * s.w + x] >>> 24) { y0 = y; break; }
  let sx = 0, n = 0;
  for (let y = y0; y < Math.min(s.h, y0 + 30); y++) for (let x = 0; x < s.w; x++) if (s.px[y * s.w + x] >>> 24) { sx += x; n++; }
  return { x: n ? sx / n : s.w / 2, y: y0 + 12 };
}
// Agarre de una mano de perfil: centro de las primeras filas del puño, un poco por debajo de su borde
function gripSide(s) {
  let y0 = -1;
  for (let y = 0; y < s.h && y0 < 0; y++) for (let x = 0; x < s.w; x++) if (s.px[y * s.w + x] >>> 24) { y0 = y; break; }
  let sx = 0, n = 0;
  for (let y = y0; y < Math.min(s.h, y0 + 20); y++) for (let x = 0; x < s.w; x++) if (s.px[y * s.w + x] >>> 24) { sx += x; n++; }
  return { x: Math.round(n ? sx / n + 1 : s.w / 2), y: y0 + 9 };
}
let HAND_SIDE_MIRROR = true; // el antebrazo sale hacia su esquina
function loadAssets() {
  return Promise.all(Object.keys(ASSETS).map(n => new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => {
      const c = mkCanvas(im.width, im.height), g = c.getContext('2d');
      g.drawImage(im, 0, 0);
      const d = g.getImageData(0, 0, im.width, im.height).data;
      const px = new Uint32Array(im.width * im.height);
      for (let i = 0; i < px.length; i++) px[i] = d[i * 4 + 3] < 128 ? 0 : rgb(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
      SPR[n] = { w: im.width, h: im.height, px, flash: px };
      res();
    };
    im.onerror = () => rej(new Error('No se pudo cargar ' + n));
    im.src = ASSETS[n];
  }))).then(() => {
    SPR.daggerL = flipSprite(SPR.dagger);
    SPR.claws_wolfL = flipSprite(SPR.claws_wolf);
    SPR.claws_bearL = flipSprite(SPR.claws_bear);
    // aspectos de las clases principales (Pixellab): los fantasmas rencorosos los usan con un halo azulado
    for (const k of ['ladron', 'luchador', 'mago']) if (SPR['skin_' + k]) SPR['ghostskin_' + k] = [ghostly(SPR['skin_' + k], 0), ghostly(SPR['skin_' + k], 1)];
    // PNJ de Pixellab (si existen) en lugar de los provisionales dibujados por código
    for (const [k, n] of [['merchant', 'npc_merchant'], ['smith', 'npc_smith'], ['anvil', 'npc_anvil']]) if (SPR[n]) SPR[k] = k === 'anvil' ? [SPR[n]] : [SPR[n], SPR[n], SPR[n], SPR[n]];
    // manos por clase (generadas como mano derecha): punto de agarre = centro del puño
    for (const id of Object.keys(CLASSES)) {
      // mano de perfil (Sprite Fusion) si existe: la empuñadura atraviesa el puño y el pomo asoma bajo él
      // si la clase aún no tiene la suya, usa la de perfil de la clase de la que evoluciona (mejor que la antigua de frente)
      const side = SPR['hand_' + id + '_side'] || lineageOf(id).reverse().map(c => SPR['hand_' + c + '_side']).find(Boolean);
      if (side) {
        side.side = true; side.grip = side.grip || gripSide(side);
        const R = HAND_SIDE_MIRROR ? flipSprite(side) : side;
        R.side = true; R.grip = HAND_SIDE_MIRROR ? { x: side.w - 1 - side.grip.x, y: side.grip.y } : side.grip;
        const Lh = flipSprite(R); Lh.side = true; Lh.grip = { x: R.w - 1 - R.grip.x, y: R.grip.y };
        SPR['handR_' + id] = R; SPR['handL_' + id] = Lh;
        continue;
      }
      const h = SPR['hand_' + id] || SPR.hand_ladron || SPR.hand_right;
      h.grip = h.grip || gripOf(h);
      SPR['handR_' + id] = h;
      const l = flipSprite(h); l.grip = { x: h.w - 1 - h.grip.x, y: h.grip.y };
      SPR['handL_' + id] = l;
    }
    for (const k of ['wolf', 'bear']) {
      // garras pixel art dibujadas a mano (tools/draw-claws.py); agarre = muñeca
      const px = SPR['claw_' + k], c = px || SPR['clawsopen_' + k] || SPR['claws_' + k];
      c.grip = px ? { x: 29, y: 50 } : gripOf(c);
      SPR['clawsR_' + k] = c;
      const l = flipSprite(c); l.grip = { x: c.w - 1 - c.grip.x, y: c.grip.y };
      SPR['clawsL_' + k] = l;
    }
    SPR.handL = SPR.hand_right;            // sale de la esquina inferior izquierda
    SPR.handR = flipSprite(SPR.hand_right); // reflejada: sale de la inferior derecha
    SPR.torchB = flipSprite(SPR.torch);     // segundo fotograma del parpadeo
  });
}

// ------------------------------------------------------------- objetos de mazmorra (pixel art a mano, a resolución nativa)
// fn(set): set(x, y, [r,g,b], emisivo). Contorno oscuro automático de 1 px.
function pix(w, h, fn, outline = true) {
  const px = new Uint32Array(w * h);
  const set = (x, y, c, em) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < w && y < h) px[y * w + x] = rgb(c[0], c[1], c[2], em ? 250 : 255); };
  fn(set);
  const out = px.slice();
  if (outline) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (px[y * w + x]) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const X = x + dx, Y = y + dy;
      if (X >= 0 && Y >= 0 && X < w && Y < h && px[Y * w + X] && (px[Y * w + X] >>> 24) === 255) { out[y * w + x] = rgb(18, 11, 9); break; }
    }
  }
  const flash = out.map(c => c ? rgb(255, 255, 255, c >>> 24) : 0);
  return { w, h, px: out, flash };
}
const PW = { d: [72, 42, 22], w: [116, 70, 36], W: [156, 102, 54], i: [52, 50, 58], m: [104, 104, 116], M: [170, 172, 184], y: [150, 96, 24], g: [224, 172, 52], G: [255, 234, 140] };
function drawChest(open) {
  return pix(20, 16, (set) => {
    const body0 = 8;
    for (let y = body0; y < 16; y++) for (let x = 1; x < 19; x++) set(x, y, y === body0 ? PW.W : y === 12 ? PW.d : x < 3 ? PW.W : x > 16 ? PW.d : PW.w);
    if (!open) {
      for (let y = 2; y < body0; y++) {
        const inset = y === 2 ? 3 : y === 3 ? 2 : 1;
        for (let x = inset; x < 20 - inset; x++) set(x, y, y < 4 ? PW.W : y === body0 - 1 ? PW.i : x < 3 ? PW.W : PW.w);
      }
    } else {
      // tapa abierta (se ve el interior oscuro) y monedas asomando
      for (let y = 0; y < 6; y++) for (let x = 2; x < 18; x++) set(x, y, y === 0 ? PW.w : x === 2 || x === 17 ? PW.w : PW.d);
      for (let x = 1; x < 19; x++) set(x, 6, PW.i);
      for (let x = 2; x < 18; x++) set(x, 7, ((x * 7) % 5) < 2 ? PW.G : PW.g);
      for (let x = 4; x < 16; x++) if (((x * 3) % 4) === 0) set(x, 6, PW.g);
    }
    // flejes de hierro
    for (const bx of [4, 15]) for (let y = open ? 6 : 2; y < 16; y++) set(bx, y, y === (open ? 6 : 2) || y === body0 ? PW.M : PW.m);
    // cerradura
    if (!open) { for (let y = 7; y < 11; y++) for (let x = 9; x < 11; x++) set(x, y, y === 7 ? PW.G : PW.g); set(9, 9, [20, 12, 8]); }
  });
}
function drawKeySpr(col) {
  const hi = col.map(v => Math.min(255, v * 1.15 + 30)), lo = col.map(v => v * 0.55);
  return pix(7, 15, (set) => {
    for (let y = 0; y < 6; y++) for (let x = 0; x < 7; x++) { const d = Math.hypot(x - 3, y - 2.5); if (d < 3.4 && d > 1.3) set(x, y, x < 3 ? hi : col, true); }
    for (let y = 6; y < 15; y++) set(3, y, y & 1 ? col : hi, true);
    for (const [x, y] of [[4, 11], [5, 11], [4, 13], [5, 13], [5, 12]]) set(x, y, lo, true);
  });
}
function drawCoins() {
  return pix(12, 7, (set) => {
    for (let y = 0; y < 7; y++) for (let x = 0; x < 12; x++) {
      const w = 6 - Math.abs(y - 6) * 0.95 - 0.5; if (Math.abs(x - 5.5) > w + (y > 4 ? 0.5 : 0) || y < 1) continue;
      const k = hash2(x, y, 41);
      set(x, y, k > 0.78 ? PW.G : k > 0.3 ? PW.g : PW.y);
    }
  });
}
function drawAltar(frame, lit) {
  const S = { s: [60, 56, 62], t: [104, 98, 100], T: [146, 138, 132] };
  return pix(22, 22, (set) => {
    for (let y = 9; y < 22; y++) for (let x = 3; x < 19; x++) set(x, y, x < 5 ? S.T : x > 16 ? S.s : (y === 15 ? S.s : S.t));
    for (let y = 6; y < 9; y++) for (let x = 1; x < 21; x++) set(x, y, y === 6 ? S.T : y === 8 ? S.s : S.t); // losa
    // runa del frente
    const rc = lit ? [120, 205, 255] : [40, 46, 60];
    for (const [x, y] of [[10, 11], [11, 11], [9, 12], [12, 12], [10, 13], [11, 13], [10, 14], [11, 14], [9, 16], [12, 16], [10, 17], [11, 17], [10, 18], [11, 18]]) set(x, y, rc, lit);
    // velas con llama (4 fotogramas)
    for (const cx of [3, 18]) {
      for (let y = 3; y < 6; y++) set(cx, y, [226, 214, 182]);
      if (lit) { const f = (frame + cx) & 3; set(cx, 2, [255, 170, 60], true); set(cx + (f === 1 ? 1 : f === 3 ? -1 : 0), 1, [255, 235, 160], true); if (f !== 2) set(cx, 0, [255, 200, 90], true); }
    }
  });
}
function drawSpikes(up) {
  return pix(16, up ? 9 : 3, (set) => {
    const h = up ? 9 : 3;
    for (let x = 0; x < 16; x++) for (let y = h - 2; y < h; y++) set(x, y, y === h - 2 ? [70, 66, 70] : [44, 40, 46]);
    if (up) for (const sx of [2, 6, 10, 14]) for (let y = 0; y < 7; y++) { const w = y < 2 ? 0 : 1; for (let x = sx - w; x <= sx; x++) set(x, y, x === sx - w && w ? PW.M : PW.m); }
    else for (const sx of [2, 6, 10, 14]) set(sx, 1, [16, 12, 12]);
  });
}

function drawTorchItem() {
  return pix(7, 18, (set) => {
    for (let y = 6; y < 18; y++) for (let x = 2; x < 5; x++) set(x, y, x === 2 ? PW.W : x === 4 ? PW.d : PW.w);
    for (let y = 0; y < 7; y++) for (let x = 1; x < 6; x++) { if ((y === 0 && (x === 1 || x === 5))) continue; set(x, y, y === 6 ? PW.i : ((x + y) & 1) ? [92, 74, 52] : [62, 48, 34]); }
    set(2, 1, [130, 104, 70]); set(3, 3, [130, 104, 70]);
  });
}

// PNJ provisionales: mercader encapuchado con farol y mochila; herrero con mandil y martillo; yunque
function drawMerchant(frame) {
  const robe = [92, 64, 44], robeD = [58, 38, 26], robeL = [128, 92, 60], skin = [196, 150, 112], pack = [120, 82, 40];
  return pix(22, 34, (set) => {
    for (let y = 9; y < 34; y++) { const w = 4 + Math.min(6, (y - 9) * 0.35); for (let x = Math.round(11 - w); x <= Math.round(10 + w); x++) set(x, y, x < 9 ? robeL : x > 13 ? robeD : robe); }
    for (let y = 1; y < 11; y++) for (let x = 6; x < 16; x++) { const d = Math.hypot((x - 10.5) / 5, (y - 6) / 5.2); if (d < 1) set(x, y, d > 0.75 ? robeD : robe); }
    for (let y = 5; y < 10; y++) for (let x = 8; x < 13; x++) set(x, y, y < 7 ? [24, 16, 12] : skin); // cara en sombra
    set(9, 7, [255, 220, 120], true); set(12, 7, [255, 220, 120], true); // ojos que brillan
    for (let y = 12; y < 24; y++) for (let x = 15; x < 21; x++) set(x, y, x === 15 || y === 12 ? PW.d : pack); // mochila
    for (let y = 18; y < 22; y++) set(3, y, [60, 58, 64]); // asa del farol
    const fl = frame & 1 ? [255, 230, 140] : [255, 190, 80];
    for (let y = 22; y < 27; y++) for (let x = 1; x < 6; x++) set(x, y, (x === 1 || x === 5 || y === 22 || y === 26) ? [70, 66, 72] : fl, !(x === 1 || x === 5 || y === 22 || y === 26));
  });
}
function drawSmith(frame) {
  const skin = [186, 128, 92], skinD = [140, 92, 64], apron = [92, 62, 40], shirt = [70, 74, 88], hair = [60, 40, 30];
  return pix(24, 34, (set) => {
    for (let y = 2; y < 9; y++) for (let x = 8; x < 15; x++) set(x, y, y < 4 ? hair : x === 8 ? skinD : skin); // cabeza
    for (let y = 7; y < 11; y++) for (let x = 9; x < 14; x++) set(x, y, hair); // barba
    for (let y = 10; y < 26; y++) for (let x = 5; x < 18; x++) set(x, y, x < 7 || x > 15 ? shirt : y > 12 ? (x < 9 ? apron.map(v => v * 1.2) : apron) : shirt); // torso y mandil
    for (let y = 26; y < 34; y++) { for (let x = 6; x < 10; x++) set(x, y, [50, 40, 34]); for (let x = 13; x < 17; x++) set(x, y, [50, 40, 34]); }
    // brazo con martillo: arriba o abajo según el fotograma
    const up = (frame & 2) === 0;
    const hx = 19, hy = up ? 6 : 16;
    for (let y = Math.min(hy, 12); y < 14 + (up ? 0 : 4); y++) set(18, y, skin);
    for (let y = hy - 3; y < hy + 2; y++) for (let x = hx; x < hx + 5; x++) set(x, y, [96, 96, 108]);
    for (let y = hy + 2; y < hy + 6; y++) set(hx + 2, y, PW.d);
  });
}
function drawAnvil() {
  return pix(18, 10, (set) => {
    for (let x = 0; x < 18; x++) for (let y = 0; y < 3; y++) set(x, y, y === 0 ? [140, 140, 150] : [90, 90, 100]);
    for (let y = 3; y < 7; y++) for (let x = 6; x < 13; x++) set(x, y, [70, 70, 80]);
    for (let y = 7; y < 10; y++) for (let x = 3; x < 16; x++) set(x, y, [60, 60, 70]);
  });
}

function drawGhost(kind, frame) {
  const c0 = [150, 230, 255], c1 = [90, 170, 230], c2 = [50, 100, 170], eye = [255, 255, 255];
  return pix(24, 36, (set) => {
    const bob = frame ? 1 : 0;
    for (let y = 3; y < 34; y++) {
      const top = y < 12, w = top ? Math.sqrt(Math.max(0, 25 - (y - 8) * (y - 8))) : 5 + (y - 12) * 0.12;
      for (let x = Math.round(11.5 - w); x <= Math.round(11.5 + w); x++) {
        if (y > 28 && ((x + y + bob) % 4 === 0)) continue; // jirones en el borde inferior
        const k = (x - 11.5) / (w + 0.01);
        set(x, y + bob - 1, k < -0.4 ? c0 : k > 0.5 ? c2 : c1, true);
      }
    }
    set(9, 7 + bob, eye, true); set(14, 7 + bob, eye, true); set(9, 8 + bob, [20, 30, 60], true); set(14, 8 + bob, [20, 30, 60], true);
    // arma espectral
    const W = [210, 250, 255];
    if (kind === 'melee') for (let y = 6; y < 26; y++) set(20, y + bob, W, true);
    if (kind === 'dagger') for (let y = 15; y < 24; y++) { set(20, y + bob, W, true); set(2, y + bob, W, true); }
    if (kind === 'staff') { for (let y = 4; y < 34; y++) set(20, y + bob, [120, 160, 210], true); for (let y = 1; y < 5; y++) for (let x = 19; x < 22; x++) set(x, y + bob, [220, 150, 255], true); }
    if (kind === 'bow') for (let y = 8; y < 28; y++) set(20 + Math.round(Math.sin((y - 8) / 20 * Math.PI) * 2), y + bob, W, true);
  });
}

// versión fantasmal de un sprite: tonos azulados que brillan en la oscuridad y un halo tramado alrededor
function ghostly(spr, frame) {
  const P = 3, w = spr.w + P * 2, h = spr.h + P * 2, px = new Uint32Array(w * h), src = spr.px;
  const at = (x, y) => (x >= 0 && y >= 0 && x < spr.w && y < spr.h) ? src[y * spr.w + x] : 0;
  for (let y = 0; y < spr.h; y++) for (let x = 0; x < spr.w; x++) {
    const c = src[y * spr.w + x]; if (!(c >>> 24)) continue;
    const l = ((c & 255) + ((c >> 8) & 255) + ((c >> 16) & 255)) / 3;
    px[(y + P) * w + x + P] = rgb(Math.min(255, l * 0.5 + 25), Math.min(255, l * 0.78 + 45), Math.min(255, l * 0.95 + 80), 250);
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (px[y * w + x]) continue;
    let d = 9;
    for (let ey = -P; ey <= P; ey++) for (let ex = -P; ex <= P; ex++) if (at(x - P + ex, y - P + ey) >>> 24) d = Math.min(d, Math.max(Math.abs(ex), Math.abs(ey)));
    if (d > P) continue;
    if (d === 1 || (d === 2 && ((x + y + frame) & 1)) || (d === 3 && ((x + y * 2 + frame) % 4 === 0))) px[y * w + x] = rgb(d === 1 ? 150 : 90, d === 1 ? 220 : 170, 255, 250);
  }
  return { w, h, px, flash: px.map(c => c ? rgb(255, 255, 255, 250) : 0) };
}

// iconos de objetos equipables (la gema toma el color de la rareza)
function drawItemIcon(slot, gem) {
  const G0 = [150, 120, 60], G1 = [220, 180, 90], S0 = [110, 110, 120], S1 = [180, 180, 190], gl = gem.map(v => Math.min(255, v + 70));
  return pix(14, 14, (set) => {
    if (slot === 'anillo') {
      for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) { const d = Math.hypot(x - 6.5, y - 8); if (d < 5.2 && d > 3.2) set(x, y, x < 6 ? G1 : G0); }
      for (let y = 1; y < 5; y++) for (let x = 5; x < 9; x++) set(x, y, (x + y) & 1 ? gem : gl, true);
    } else if (slot === 'amuleto') {
      for (let k = 0; k < 7; k++) { set(2 + k, k, G0); set(11 - k, k, G0); }
      for (let y = 7; y < 13; y++) for (let x = 4; x < 10; x++) { const d = Math.abs(x - 6.5) + Math.abs(y - 9.5); if (d < 3.6) set(x, y, d < 1.6 ? gl : gem, true); else if (d < 4.4) set(x, y, G1); }
    } else if (slot === 'arma') {
      for (let k = 0; k < 9; k++) { set(3 + k, 10 - k, S1); set(4 + k, 10 - k, S0); }
      for (let k = -2; k <= 2; k++) set(4 + k, 9 + k, G0); set(2, 12, G1); set(3, 11, G1); set(10, 3, gem, true);
    } else if (slot === 'escudo') {
      for (let y = 1; y < 13; y++) for (let x = 2; x < 12; x++) { const w = y < 8 ? 5 : 5 - (y - 7) * 0.9; if (Math.abs(x - 6.5) > w) continue; set(x, y, x < 7 ? S1 : S0); }
      for (let y = 5; y < 8; y++) for (let x = 6; x < 8; x++) set(x, y, gem, true);
    } else {
      for (let y = 1; y < 13; y++) for (let x = 1; x < 13; x++) {
        if (y < 3 && x > 4 && x < 9) continue; // cuello
        if (y > 8 && (x < 3 || x > 10)) continue;
        set(x, y, x < 5 ? S1 : S0);
      }
      for (let y = 5; y < 8; y++) for (let x = 6; x < 8; x++) set(x, y, gem, true);
    }
  });
}

function initSprites() {
  const fr = (fn, w, h, n, o) => Array.from({ length: n }, (_, f) => paint(w, h, (g, ge) => fn(g, ge, w, h, f), Object.assign({ seed: 11 + f }, o)));
  SPR.skeleton = fr(drawSkeleton, 50, 72, 2);
  SPR.bat = fr(drawBat, 56, 34, 2);
  SPR.slime = fr(drawSlime, 48, 40, 2);
  SPR.wraith = fr(drawWraith, 48, 72, 2, { keepAlpha: true, cut: 40, outline: false });
  SPR.imp = fr(drawImp, 48, 56, 2);
  SPR.boss = fr(drawBoss, 80, 96, 2);
  SPR.zombie = fr(drawZombie, 48, 72, 2); SPR.cultist = fr(drawCultist, 48, 72, 2); SPR.spiderE = fr(drawSpider, 56, 36, 2);
  SPR.hound = fr(drawHound, 64, 44, 2); SPR.eye = fr(drawEye, 48, 52, 2);
  SPR.lich = fr(drawLich, 80, 96, 2); SPR.queen = fr(drawQueen, 88, 72, 2); SPR.voidlord = fr(drawVoidLord, 80, 90, 2);
  SPR.skulltorch = fr(drawSkullTorch, 20, 64, 4);
  SPR.brazier = fr(drawBrazier, 32, 40, 4);
  SPR.candles = fr(drawCandles, 24, 21, 4);
  SPR.barrel = [paint(28, 35, drawBarrel)];
  SPR.bones = [paint(34, 14, drawBones)];
  SPR.gemBlue = paint(14, 18, drawGem('#c8f0ff', '#4aa8f8', '#1a4ab0'));
  SPR.gemGreen = paint(14, 18, drawGem('#d8ffd8', '#40d870', '#147a38'));
  SPR.gemGold = paint(14, 18, drawGem('#fff4c0', '#f8c030', '#a05a10'));
  SPR.potion = paint(16, 24, drawPotion);
  SPR.chest = drawChest(false); SPR.chestOpen = drawChest(true);
  SPR.keys = KEYS.map(k => drawKeySpr(k.col));
  SPR.coins = drawCoins();
  SPR.torchItem = drawTorchItem();
  for (const s of ['anillo', 'amuleto', 'armadura', 'arma', 'escudo']) for (const r of ['comun', 'raro', 'epico', 'legendario']) SPR[`icon_${s}_${r}`] = drawItemIcon(s, { comun: [170, 170, 160], raro: [70, 130, 255], epico: [190, 80, 255], legendario: [255, 170, 40] }[r]);
  SPR.merchant = [0, 1, 2, 3].map(drawMerchant); SPR.smith = [0, 1, 2, 3].map(drawSmith); SPR.anvil = [drawAnvil()];
  for (const k of ['melee', 'dagger', 'staff', 'bow']) SPR['ghost_' + k] = [drawGhost(k, 0), drawGhost(k, 1)];
  SPR.potionIcon = SPR.potion;
  SPR.altar = [0, 1, 2, 3].map(f => drawAltar(f, true)); SPR.altarOff = [drawAltar(0, false)];
  SPR.spikesUp = drawSpikes(true); SPR.spikesDown = drawSpikes(false);

  SPR.orbBlue = buildOrb(24, [[0, [255, 255, 255, 255]], [0.3, [150, 220, 255, 255]], [0.65, [60, 110, 255, 170]], [1, [20, 40, 200, 0]]]);
  SPR.orbGold = buildOrb(24, [[0, [255, 255, 255, 255]], [0.3, [255, 240, 130, 255]], [0.65, [255, 170, 40, 170]], [1, [200, 80, 10, 0]]]);
  SPR.orbRed = buildOrb(24, [[0, [255, 255, 200, 255]], [0.3, [255, 190, 60, 255]], [0.65, [255, 70, 20, 180]], [1, [160, 20, 10, 0]]]);
  SPR.orbGreen = buildOrb(24, [[0, [230, 255, 230, 255]], [0.3, [120, 255, 160, 255]], [0.65, [40, 190, 120, 170]], [1, [10, 90, 70, 0]]]);
  SPR.orbPurple = buildOrb(24, [[0, [255, 230, 255, 255]], [0.3, [230, 120, 255, 255]], [0.65, [150, 50, 220, 170]], [1, [70, 10, 130, 0]]]);
  SPR.daggerFx = paint(12, 12, (g, ge) => { poly(ge, [[6, 0], [8, 6], [6, 12], [4, 6]], '#e8f4ff'); line(ge, [[6, 1], [6, 11]], 1, '#ffffff'); }, { outline: false });
  SPR.orbIce = buildOrb(24, [[0, [255, 255, 255, 255]], [0.3, [200, 245, 255, 255]], [0.65, [110, 200, 255, 170]], [1, [40, 110, 220, 0]]]);
  SPR.orbArrow = buildOrb(14, [[0, [255, 255, 235, 255]], [0.4, [255, 235, 160, 255]], [1, [200, 150, 60, 0]]]);
  // demonio invocado: el diablillo teñido de violeta
  SPR.fiend = SPR.imp.map(f => {
    const px = new Uint32Array(f.px.length);
    for (let i = 0; i < px.length; i++) { const c = f.px[i], a = c >>> 24; px[i] = a ? rgb(((c >> 16) & 255) * 0.8 + 40, (c & 255) * 0.45, ((c >> 8) & 255) * 0.35 + (c & 255) * 0.7, a) : 0; }
    return { w: f.w, h: f.h, px, flash: f.flash };
  });
  SPR.clawsopen_wolf = paint(96, 112, drawOpenClaw({ l: '#d4d8e0', m: '#8c929e', d: '#40444e', cl: '#f4f0e2', ch: '#ffffff', cd: '#9c968a' }), { grain: 0.08, levels: 26 });
  SPR.clawsopen_bear = paint(96, 112, drawOpenClaw({ l: '#c08a58', m: '#7a5030', d: '#3a2414', cl: '#3a3640', ch: '#8a8494', cd: '#141218' }), { grain: 0.08, levels: 26 });
  for (let i = 0; i < 3; i++) SPR['bolt' + i] = buildBolt(11 + i * 7);
  for (let i = 0; i < 4; i++) SPR['portal' + i] = buildPortal(i);
}
