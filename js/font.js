// Fuente bitmap 5x7 (mayúsculas, dígitos, signos y acentos en español)
const FONT = {
  A: [14, 17, 17, 31, 17, 17, 17], B: [30, 17, 17, 30, 17, 17, 30], C: [14, 17, 16, 16, 16, 17, 14],
  D: [30, 17, 17, 17, 17, 17, 30], E: [31, 16, 16, 30, 16, 16, 31], F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 15], H: [17, 17, 17, 31, 17, 17, 17], I: [14, 4, 4, 4, 4, 4, 14],
  J: [7, 2, 2, 2, 2, 18, 12], K: [17, 18, 20, 24, 20, 18, 17], L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17], N: [17, 17, 25, 21, 19, 17, 17], O: [14, 17, 17, 17, 17, 17, 14],
  P: [30, 17, 17, 30, 16, 16, 16], Q: [14, 17, 17, 17, 21, 18, 13], R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4], U: [17, 17, 17, 17, 17, 17, 14],
  V: [17, 17, 17, 17, 17, 10, 4], W: [17, 17, 17, 21, 21, 21, 10], X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 17, 10, 4, 4, 4], Z: [31, 1, 2, 4, 8, 16, 31],
  0: [14, 17, 19, 21, 25, 17, 14], 1: [4, 12, 4, 4, 4, 4, 14], 2: [14, 17, 1, 2, 4, 8, 31],
  3: [31, 2, 4, 2, 1, 17, 14], 4: [2, 6, 10, 18, 31, 2, 2], 5: [31, 16, 30, 1, 1, 17, 14],
  6: [6, 8, 16, 30, 17, 17, 14], 7: [31, 1, 2, 4, 8, 8, 8], 8: [14, 17, 17, 14, 17, 17, 14],
  9: [14, 17, 17, 15, 1, 2, 12],
  ' ': [0, 0, 0, 0, 0, 0, 0], '.': [0, 0, 0, 0, 0, 12, 12], ',': [0, 0, 0, 0, 12, 4, 8],
  '!': [4, 4, 4, 4, 4, 0, 4], '¡': [4, 0, 4, 4, 4, 4, 4], '?': [14, 17, 1, 2, 4, 0, 4],
  '¿': [4, 0, 4, 8, 16, 17, 14], ':': [0, 12, 12, 0, 12, 12, 0], '-': [0, 0, 0, 14, 0, 0, 0],
  '+': [0, 4, 4, 31, 4, 4, 0], '/': [1, 1, 2, 4, 8, 16, 16], '%': [24, 25, 2, 4, 8, 19, 3],
  '(': [2, 4, 8, 8, 8, 4, 2], ')': [8, 4, 2, 2, 2, 4, 8], '[': [14, 8, 8, 8, 8, 8, 14],
  ']': [14, 2, 2, 2, 2, 2, 14], "'": [4, 4, 8, 0, 0, 0, 0], '>': [8, 4, 2, 1, 2, 4, 8],
  '<': [2, 4, 8, 16, 8, 4, 2], '=': [0, 0, 31, 0, 31, 0, 0], '*': [0, 21, 14, 31, 14, 21, 0],
  '·': [0, 0, 0, 4, 0, 0, 0], '#': [10, 10, 31, 10, 31, 10, 10],
  '@': [14, 31, 21, 31, 14, 10, 0], // calavera
  '$': [0, 10, 31, 31, 14, 4, 0],   // corazón
  '&': [4, 14, 31, 14, 4, 0, 0],    // gema
};
const FONT_ACC = { 'Á': ['A', 'a'], 'É': ['E', 'a'], 'Í': ['I', 'a'], 'Ó': ['O', 'a'], 'Ú': ['U', 'a'], 'Ñ': ['N', 't'], 'Ü': ['U', 'd'] };
const ACC_PX = { a: [[3, -2], [2, -1]], t: [[1, -2], [2, -2], [0, -1], [3, -1], [4, -2]], d: [[1, -2], [3, -2]] };

function textWidth(s, sc = 1) { return s.length ? s.length * 6 * sc - sc : 0; }

function drawGlyphs(buf, BW, BH, x, y, s, col, sc, grad) {
  for (let i = 0; i < s.length; i++) {
    let ch = s[i], acc = null;
    if (FONT_ACC[ch]) { acc = FONT_ACC[ch][1]; ch = FONT_ACC[ch][0]; }
    const gl = FONT[ch] || FONT['?'];
    const ox = x + i * 6 * sc;
    const put = (cx, cy, c) => {
      for (let yy = 0; yy < sc; yy++) for (let xx = 0; xx < sc; xx++) {
        const X = ox + cx * sc + xx, Y = y + cy * sc + yy;
        if (X >= 0 && Y >= 0 && X < BW && Y < BH) buf[Y * BW + X] = c;
      }
    };
    for (let r = 0; r < 7; r++) {
      const row = gl[r];
      if (!row) continue;
      const c = grad ? grad[r] : col;
      for (let cx = 0; cx < 5; cx++) if ((row >> (4 - cx)) & 1) put(cx, r, c);
    }
    if (acc) for (const [ax, ay] of ACC_PX[acc]) put(ax, ay, grad ? grad[0] : col);
  }
}

// opt: {scale, align:'left'|'center'|'right', shadow:bool|'outline', shadowCol, grad:[7 colores]}
function drawText(buf, BW, BH, x, y, text, col, opt = {}) {
  if (typeof tr === 'function') text = tr(text);
  const sc = opt.scale || 1, s = String(text).toUpperCase();
  const w = textWidth(s, sc);
  if (opt.align === 'center') x -= (w / 2) | 0; else if (opt.align === 'right') x -= w;
  const sh = opt.shadowCol || 0xFF000000;
  if (opt.shadow === 'outline') {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) drawGlyphs(buf, BW, BH, x + dx * sc, y + dy * sc, s, sh, sc, null);
    drawGlyphs(buf, BW, BH, x + sc, y + sc * 2, s, sh, sc, null);
  } else if (opt.shadow !== false) drawGlyphs(buf, BW, BH, x + sc, y + sc, s, sh, sc, null);
  drawGlyphs(buf, BW, BH, x, y, s, col, sc, opt.grad || null);
  return w;
}

function wrapText(text, maxChars) {
  if (typeof tr === 'function') text = tr(text);
  const words = String(text).split(' '), lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + (cur ? ' ' : '') + w).length > maxChars) { if (cur) lines.push(cur); cur = w; }
    else cur += (cur ? ' ' : '') + w;
  }
  if (cur) lines.push(cur);
  return lines;
}
