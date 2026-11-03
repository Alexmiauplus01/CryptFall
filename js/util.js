// Utilidades generales
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const mod = (a, n) => ((a % n) + n) % n;

// Color empaquetado ABGR (little endian) para Uint32Array de ImageData
function rgb(r, g, b, a = 255) {
  return (((a & 255) << 24) | ((clamp(b, 0, 255) & 255) << 16) | ((clamp(g, 0, 255) & 255) << 8) | (clamp(r, 0, 255) & 255)) >>> 0;
}
function hexc(s, a = 255) {
  return rgb(parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16), a);
}

// Hash determinista -> [0,1)
function hash2(x, y, s) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// Ruido de valor tileable con periodo `per`
function vnoise(x, y, s, per) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = x - x0, fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash2(mod(x0, per), mod(y0, per), s);
  const b = hash2(mod(x0 + 1, per), mod(y0, per), s);
  const c = hash2(mod(x0, per), mod(y0 + 1, per), s);
  const d = hash2(mod(x0 + 1, per), mod(y0 + 1, per), s);
  return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
}
function fbm(x, y, s, per) {
  let v = 0, amp = 0.5, tot = 0, f = per;
  for (let o = 0; o < 4; o++) {
    v += amp * vnoise(x * f, y * f, s + o * 17, f);
    tot += amp; amp *= 0.5; f *= 2;
  }
  return v / tot;
}
