// Raycaster con iluminación de color: paredes, suelo/techo, sprites, manos en primera persona
const VW = 480, VH = 270, HALF = VH >> 1;
const PLANE_LEN = VW / (2 * VH); // píxeles cuadrados (FOV ~96º)
const LV = 10;                   // niveles de luz por unidad (bandas retro con tramado)
const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
const TORCH_COL = [1.0, 0.84, 0.64];
const AMBIENT_K = 0.3;   // ambiente muy bajo: la luz viene de antorchas, braseros y hechizos
const SCENE_LIGHT_K = 1.15; // las luces del escenario destacan más sobre la oscuridad
const HS = 2; // escala de manos y armas en primera persona
const HAND_TILT = 0.55; // inclinación de la muñeca respecto al arma

// ---------- Animación de ataque pose a pose (como en los dungeon crawlers pixel art):
// anticipación (el arma se echa atrás) → golpe en 1-2 fotogramas con estela fina → impacto sostenido
// → la hoja sale por el borde inferior → vuelve subiendo con un pequeño rebote.
// Cada pose: t = fracción del ciclo, x/y = desplazamiento del puño, a = giro de la hoja respecto al reposo,
// s = escala, e = curva hacia esa pose; sm = ese tramo deja estela, st = estocada, cl = zarpazo.
const EASE = {
  lin: u => u,
  out: u => 1 - (1 - u) * (1 - u),
  in: u => u * u,
  io: u => u * u * (3 - 2 * u),
  back: u => { const c = 1.6, v = u - 1; return 1 + (c + 1) * v * v * v + c * v * v; },
};
const P0 = { t: 0, x: 0, y: 0, a: 0, w: 0 }, P1 = { t: 1, x: 0, y: 0, a: 0, e: 'back', w: 0 };
// Golpes amplios: el arma se va fuera de pantalla para cargar, cruza la pantalla en diagonal (~60°), sale por el
// otro lado, espera un instante fuera y vuelve subiendo desde abajo. ln = línea de corte [x0, y0, x1, y1] (fracciones).
// El arco se hace en un plano inclinado 60° respecto a la pantalla: en mitad del golpe la hoja apunta hacia el fondo
// (se acorta y se aleja) en vez de barrer plana por delante de la cámara. w = cuánto pesa ese plano en la pose.
const hold = (q, t) => Object.assign({}, q, { t, e: 'lin', ln: 0, sm: 0, cl: 0, st: 0 });
const under = (t, x, y, a) => ({ t, x, y, a, e: 'lin', w: 0 }); // salto (fuera de pantalla) a debajo del borde
const UP = .5, DN = -2.64, CHU = .17, CHD = -2.97; // hoja hacia atrás / hacia delante del corte a 60° y del vertical
function mv(...k) { return k; }
const MOVES = {
  sw: { // espada de una mano
    slash: mv(P0, { t: .18, x: 4, y: -260, a: UP, e: 'out' }, { t: .3, x: -206, y: 104, a: DN, e: 'lin', ln: [.645, .03, .355, .93] }, hold({ x: -206, y: 104, a: DN }, .4), under(.41, -40, 330, -.4), P1),
    rise: mv(P0, { t: .18, x: -186, y: 120, a: DN, e: 'in' }, { t: .3, x: 24, y: -330, a: UP, e: 'lin', ln: [.33, .93, .62, .04] }, hold({ x: 24, y: -330, a: UP }, .4), under(.41, 40, 330, .3), P1),
    chop: mv(P0, { t: .2, x: -46, y: -280, a: CHU, e: 'out' }, { t: .32, x: -106, y: 124, a: CHD, e: 'lin', ln: [.54, .03, .47, .95] }, hold({ x: -106, y: 124, a: CHD }, .42), under(.43, -60, 330, -.3), P1),
  },
  gs: { // espadón: más peso y recorrido
    slash: mv(P0, { t: .24, x: 30, y: -330, a: UP, e: 'out' }, { t: .36, x: -230, y: 150, a: DN, e: 'lin', ln: [.66, .02, .34, .95] }, hold({ x: -230, y: 150, a: DN }, .48), under(.49, -40, 420, -.4), P1),
    rise: mv(P0, { t: .24, x: -200, y: 130, a: DN, e: 'in' }, { t: .36, x: 60, y: -440, a: UP, e: 'lin', ln: [.32, .95, .64, .03] }, hold({ x: 60, y: -440, a: UP }, .48), under(.49, 40, 420, .3), P1),
    chop: mv(P0, { t: .26, x: 0, y: -400, a: CHU, e: 'out' }, { t: .38, x: -60, y: 180, a: CHD, e: 'lin', ln: [.55, .02, .47, .97] }, hold({ x: -60, y: 180, a: CHD }, .5), under(.51, -40, 420, -.3), P1),
  },
  dg: { // daga: tajos rápidos en diagonal y estocada hacia el centro
    slash: mv(P0, { t: .18, x: -10, y: -200, a: UP, e: 'out' }, { t: .3, x: -170, y: 90, a: DN, e: 'lin', ln: [.62, .1, .38, .86] }, hold({ x: -170, y: 90, a: DN }, .42), under(.43, -40, 240, -.4), P1),
    rise: mv(P0, { t: .18, x: -160, y: 100, a: DN, e: 'in' }, { t: .3, x: 40, y: -260, a: UP, e: 'lin', ln: [.38, .86, .6, .12] }, hold({ x: 40, y: -260, a: UP }, .42), under(.43, 30, 240, .3), P1),
    chop: mv(P0, { t: .2, x: 20, y: 40, a: .15, s: 1.06, e: 'out' }, { t: .3, x: -80, y: -50, a: -.25, s: .72, st: 1, e: 'lin' }, { t: .46, x: -82, y: -52, a: -.26, s: .72, e: 'out' }, { t: 1, x: 0, y: 0, a: 0, e: 'io' }),
  },
  cl: { // garras: zarpazo diagonal a 60° que cruza y sale por abajo
    swipe: mv(P0, { t: .2, x: 40, y: -170, a: .5, e: 'out' }, { t: .32, x: -220, y: 220, a: -1.0, cl: 1, e: 'lin' }, hold({ x: -220, y: 220, a: -1.0 }, .44), under(.45, -60, 300, -.4), P1),
  },
};
// dirección del corte en pantalla (unitaria, en píxeles) para el plano inclinado
for (const f in MOVES) for (const key in MOVES[f]) {
  const k = MOVES[f][key], l = (k.find(q => q.ln) || {}).ln;
  if (l) { const dx = (l[2] - l[0]) * VW, dy = (l[3] - l[1]) * VH, d = Math.hypot(dx, dy); k.c = [dx / d, dy / d]; }
}
const PLANE_K = 0.42, PLANE_D = 0.9; // plano a ~60°: escorzo algo exagerado para que se lea en pixel art
// pose del arma con el plano inclinado aplicado: posición del puño, ángulo y escala en pantalla, y escorzo de la hoja (sv)
function bladeAt(k, u, x0, y0, rest, mir = 1) {
  const q = poseAt(k, u);
  let an = rest + q.a * mir, sv = 1, f = 1;
  if (k.c && q.w > 0.001) {
    const cx = k.c[0] * mir, cy = k.c[1], px = -cy, py = cx;
    const vx = Math.sin(an), vy = -Math.cos(an), vc = vx * cx + vy * cy, vp = vx * px + vy * py;
    const kk = 1 - q.w * (1 - PLANE_K), nx = vc * cx + kk * vp * px, ny = vc * cy + kk * vp * py;
    sv = Math.max(0.14, Math.hypot(nx, ny));
    const a2 = Math.atan2(nx, -ny);
    an += Math.atan2(Math.sin(a2 - an), Math.cos(a2 - an)); // sin saltos de 2π
    f = 1 / (1 + 0.45 * q.w * PLANE_D * Math.abs(vp)); // la punta que se aleja se ve más pequeña
  }
  return { gx: x0 + q.x * mir, gy: y0 + q.y, ang: an, sv, s: q.s * f };
}
const COMBO = { sw: ['slash', 'rise', 'chop'], gs: ['slash', 'chop', 'rise'], dg: ['slash', 'rise', 'chop'], dual: ['slash', 'slash', 'chop', 'chop'], cl: ['swipe'] };
function moveFamily(w) { return w === 'greatsword' ? 'gs' : w === 'dagger' || w === 'daggers' ? 'dg' : w === 'claws' ? 'cl' : 'sw'; }
function comboMove(w, n) { const c = COMBO[w === 'daggers' ? 'dual' : moveFamily(w)]; return c[n % c.length]; }
// momento del golpe (mitad del tramo rápido): ahí se aplica el daño
function strikeT(fam, key) {
  const k = (MOVES[fam] || MOVES.sw)[key] || MOVES.sw.slash, i = k.findIndex(q => q.ln || q.sm || q.st || q.cl);
  return i > 0 ? (k[i - 1].t + k[i].t) / 2 : 0;
}
function poseAt(k, u) {
  let i = 1;
  while (i < k.length - 1 && u > k[i].t) i++;
  const A = k[i - 1], B = k[i], v = clamp((u - A.t) / ((B.t - A.t) || 1), 0, 1), e = EASE[B.e || 'io'](v);
  const wa = A.w ?? 1, wb = B.w ?? 1;
  return { x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e), a: lerp(A.a, B.a, e), s: lerp(A.s || 1, B.s || 1, e), w: lerp(wa, wb, e) };
}

class Renderer {
  constructor() {
    this.buf = new Uint32Array(VW * VH);
    this.zbuf = new Float32Array(VW);
    this.L = new Float32Array(LG * LG * 3);
    this.theme = null;
    // tablas por fila
    this.rowDist = new Float32Array(VH);
    for (let y = HALF; y < VH; y++) this.rowDist[y] = HALF / (y - HALF + 0.5);
    // máscara de bordes para viñetas
    this.edge = new Float32Array(VW * VH);
    for (let y = 0; y < VH; y++) for (let x = 0; x < VW; x++) {
      const dx = (x - VW / 2) / (VW / 2), dy = (y - VH / 2) / (VH / 2);
      this.edge[y * VW + x] = clamp((Math.hypot(dx * 0.85, dy) - 0.55) / 0.6, 0, 1);
    }
  }

  setTheme(t) { this.theme = t; }

  // luz bilineal en (x,y)
  sampleLight(x, y, out) {
    const L = this.L;
    let gx = x * LS - 0.5, gy = y * LS - 0.5;
    const ix = clamp(Math.floor(gx), 0, LG - 2), iy = clamp(Math.floor(gy), 0, LG - 2);
    const fx = clamp(gx - ix, 0, 1), fy = clamp(gy - iy, 0, 1);
    const o00 = (iy * LG + ix) * 3, o10 = o00 + 3, o01 = o00 + LG * 3, o11 = o01 + 3;
    for (let c = 0; c < 3; c++) {
      out[c] = (L[o00 + c] * (1 - fx) + L[o10 + c] * fx) * (1 - fy) + (L[o01 + c] * (1 - fx) + L[o11 + c] * fx) * fy;
    }
    return out;
  }

  prepareLights(lv, dyn, flick) {
    const L = this.L, S = lv.lightMap;
    const k = flick * SCENE_LIGHT_K;
    for (let i = 0; i < L.length; i++) { const v = S[i] * k; L[i] = v > 1 ? 1 + (v - 1) * 0.25 : v; }
    for (const d of dyn) {
      const r = d.rad;
      const gx0 = Math.max(0, Math.floor((d.x - r) * LS)), gx1 = Math.min(LG - 1, Math.ceil((d.x + r) * LS));
      const gy0 = Math.max(0, Math.floor((d.y - r) * LS)), gy1 = Math.min(LG - 1, Math.ceil((d.y + r) * LS));
      for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
        const dd = Math.hypot((gx + 0.5) / LS - d.x, (gy + 0.5) / LS - d.y);
        if (dd >= r) continue;
        const f = (1 - dd / r) ** 2, o = (gy * LG + gx) * 3;
        L[o] = Math.min(1.8, L[o] + d.c[0] * f); L[o + 1] = Math.min(1.8, L[o + 1] + d.c[1] * f); L[o + 2] = Math.min(1.8, L[o + 2] + d.c[2] * f);
      }
    }
  }

  render(cam, lv, items, time, dyn) {
    const buf = this.buf, zbuf = this.zbuf, th = this.theme, L = this.L;
    const px = cam.x, py = cam.y;
    const dirX = Math.cos(cam.a), dirY = Math.sin(cam.a);
    const plX = -dirY * PLANE_LEN, plY = dirX * PLANE_LEN;
    const flick = 1 + 0.06 * Math.sin(time * 11.3) + 0.04 * Math.sin(time * 27.1 + 1) + 0.03 * Math.sin(time * 5.1);
    this.prepareLights(lv, dyn, 0.92 + 0.08 * flick);
    // antorcha en la mano: luz cálida de alcance medio; sin ella, apenas una penumbra a tu alrededor
    const tk = (cam.lit ? 0.15 : 0.45) / (cam.light * cam.light), TI = (cam.torch === undefined ? 1 : cam.torch) * (cam.lit ? flick : 1);
    const TR = TORCH_COL[0] * TI, TG = TORCH_COL[1] * TI, TB = TORCH_COL[2] * TI;
    const AR = th.ambient[0] * AMBIENT_K, AG = th.ambient[1] * AMBIENT_K, AB = th.ambient[2] * AMBIENT_K;
    const FR = th.fog[0], FG = th.fog[1], FB = th.fog[2];
    const fogD = 26;
    const cells = lv.cells, walls = th.walls, floors = th.floors, ceil = th.ceil, ftex = lv.floorTex;
    const rowDist = this.rowDist;
    const lt = [0, 0, 0];
    const wallFrame = ((time * 9) | 0) & 3;

    const xstep = this.fast ? 2 : 1; // calidad rápida: una columna de cada dos (se duplica)
    for (let x = 0; x < VW; x += xstep) {
      const camX = 2 * x / VW - 1;
      const rdx = dirX + plX * camX, rdy = dirY + plY * camX;
      const rl = Math.hypot(rdx, rdy);
      // ---------- DDA
      let mx = Math.floor(px), my = Math.floor(py);
      const ddx = Math.abs(1 / rdx), ddy = Math.abs(1 / rdy);
      let stepX, stepY, sdx, sdy;
      if (rdx < 0) { stepX = -1; sdx = (px - mx) * ddx; } else { stepX = 1; sdx = (mx + 1 - px) * ddx; }
      if (rdy < 0) { stepY = -1; sdy = (py - my) * ddy; } else { stepY = 1; sdy = (my + 1 - py) * ddy; }
      let side = 0, hit = 0;
      for (let n = 0; n < 96; n++) {
        if (sdx < sdy) { sdx += ddx; mx += stepX; side = 0; } else { sdy += ddy; my += stepY; side = 1; }
        if (mx < 0 || my < 0 || mx >= MW || my >= MH) { hit = 1; break; }
        hit = cells[my * MW + mx];
        if (hit) break;
      }
      const perp = Math.max(0.02, side === 0 ? sdx - ddx : sdy - ddy);
      zbuf[x] = perp;
      let wallX = side === 0 ? py + perp * rdy : px + perp * rdx;
      wallX -= Math.floor(wallX);
      let tx = (wallX * TS) | 0;
      if ((side === 0 && rdx > 0) || (side === 1 && rdy < 0)) tx = TS - 1 - tx;
      const lineH = VH / perp, top = HALF - lineH / 2;
      let ds = Math.floor(top), de = Math.floor(top + lineH);
      const texStep = TS / lineH;
      let texPos;
      if (ds < 0) { texPos = -top * texStep; ds = 0; } else texPos = (ds - top) * texStep;
      if (de >= VH) de = VH - 1;
      let tex = walls[hit] || walls[1];
      if (tex.length === 4 && !(tex instanceof Uint32Array)) tex = tex[(wallFrame + mx + my) & 3];
      // luz de la pared
      this.sampleLight(px + rdx * (perp - 0.03), py + rdy * (perp - 0.03), lt);
      const dw = perp * rl, tw = 1 / (1 + dw * dw * tk);
      const sideK = side ? 0.8 : 1;
      let wr = (lt[0] + AR + TR * tw) * sideK, wg = (lt[1] + AG + TG * tw) * sideK, wb = (lt[2] + AB + TB * tw) * sideK;
      const fk = clamp(1 - dw / fogD, 0, 1), kq = fk / LV;
      const fr = FR * (1 - fk), fg = FG * (1 - fk), fb = FB * (1 - fk);
      wr *= LV; wg *= LV; wb *= LV;
      for (let y = ds; y <= de; y++) {
        const c = tex[((texPos | 0) & 63) * TS + tx];
        texPos += texStep;
        const o = y * VW + x;
        if ((c >>> 24) !== 255) { buf[o] = c | 0xFF000000; continue; } // emisivo
        const b = BAY[(x & 3) | ((y & 3) << 2)];
        let R = (c & 255) * ((wr + b) | 0) * kq + fr; if (R > 255) R = 255;
        let G = ((c >> 8) & 255) * ((wg + b) | 0) * kq + fg; if (G > 255) G = 255;
        let B = ((c >> 16) & 255) * ((wb + b) | 0) * kq + fb; if (B > 255) B = 255;
        buf[o] = (0xFF000000 | (B << 16) | (G << 8) | R) >>> 0;
      }
      // ---------- suelo y techo (solo por debajo/encima de la pared)
      for (let y = Math.max(de + 1, HALF); y < VH; y++) {
        const rd = rowDist[y];
        const wx = px + rdx * rd, wy = py + rdy * rd;
        const cx = wx | 0, cy = wy | 0;
        if (cx < 0 || cy < 0 || cx >= MW || cy >= MH) continue;
        const ti = ((((wy - cy) * TS) | 0) << 6) | (((wx - cx) * TS) | 0);
        const d = rd * rl, tt = 1 / (1 + d * d * tk);
        const fkk = clamp(1 - d / fogD, 0, 1), kk = fkk / LV;
        const yc = VH - 1 - y;
        const b1 = BAY[(x & 3) | ((y & 3) << 2)], b2 = BAY[(x & 3) | ((yc & 3) << 2)];
        // luz con muestreo vecino tramado
        let gx = (wx * LS - 0.5 + b1) | 0, gy = (wy * LS - 0.5 + b2) | 0;
        if (gx < 0) gx = 0; else if (gx >= LG) gx = LG - 1;
        if (gy < 0) gy = 0; else if (gy >= LG) gy = LG - 1;
        const lo = (gy * LG + gx) * 3;
        const lr = (L[lo] + AR + TR * tt) * LV, lg = (L[lo + 1] + AG + TG * tt) * LV, lb = (L[lo + 2] + AB + TB * tt) * LV;
        const ffr = FR * (1 - fkk), ffg = FG * (1 - fkk), ffb = FB * (1 - fkk);
        let c = floors[ftex[cy * MW + cx]][ti];
        let R = (c & 255) * ((lr + b1) | 0) * kk + ffr; if (R > 255) R = 255;
        let G = ((c >> 8) & 255) * ((lg + b1) | 0) * kk + ffg; if (G > 255) G = 255;
        let B = ((c >> 16) & 255) * ((lb + b1) | 0) * kk + ffb; if (B > 255) B = 255;
        buf[y * VW + x] = (0xFF000000 | (B << 16) | (G << 8) | R) >>> 0;
        c = ceil[ti];
        const k2 = kk * 0.85;
        R = (c & 255) * ((lr + b2) | 0) * k2 + ffr; if (R > 255) R = 255;
        G = ((c >> 8) & 255) * ((lg + b2) | 0) * k2 + ffg; if (G > 255) G = 255;
        B = ((c >> 16) & 255) * ((lb + b2) | 0) * k2 + ffb; if (B > 255) B = 255;
        buf[yc * VW + x] = (0xFF000000 | (B << 16) | (G << 8) | R) >>> 0;
      }
      if (xstep === 2 && x + 1 < VW) { zbuf[x + 1] = zbuf[x]; for (let y = 0; y < VH; y++) buf[y * VW + x + 1] = buf[y * VW + x]; }
    }

    // ---------- sprites
    const invDet = 1 / (plX * dirY - dirX * plY);
    const list = [];
    for (const it of items) {
      const dx = it.x - px, dy = it.y - py;
      const ty = invDet * (-plY * dx + plX * dy);
      if (ty < 0.12 || ty > 40) continue;
      it._ty = ty; it._tx = invDet * (dirY * dx - dirX * dy);
      list.push(it);
    }
    list.sort((a, b) => b._ty - a._ty);
    const sl = [0, 0, 0];
    for (const it of list) {
      const d = Math.hypot(it.x - px, it.y - py);
      if (it.bright) { sl[0] = sl[1] = sl[2] = 1; }
      else {
        this.sampleLight(it.x, it.y, sl);
        const tt = 1 / (1 + d * d * tk);
        sl[0] += AR + TR * tt; sl[1] += AG + TG * tt; sl[2] += AB + TB * tt;
      }
      const fk = it.bright ? 1 : clamp(1 - d / fogD, 0, 1);
      this.drawSprite(it, sl, fk);
    }
  }

  drawSprite(it, sl, fk) {
    const buf = this.buf, zbuf = this.zbuf, th = this.theme;
    const ty = it._ty, sc = VH / ty;
    let sh = sc * it.h, sw = sc * it.w;
    if (!it.spr) { if (ty < 0.5) return; const mp = it.maxPx || 4; sh = Math.min(sh, mp); sw = Math.min(sw, mp); } // las partículas no crecen sin límite al acercarse
    const scrX = (VW / 2) * (1 + it._tx / ty);
    const bottom = HALF + sc * (0.5 - it.z), top = bottom - sh, left = scrX - sw / 2;
    const xa = Math.max(0, Math.floor(left)), xb = Math.min(VW - 1, Math.floor(left + sw));
    if (xb < xa) return;
    const ya = Math.max(0, Math.floor(top)), yb = Math.min(VH - 1, Math.ceil(bottom) - 1);
    if (yb < ya) return;
    const kq = fk / LV, lr = sl[0] * LV, lg = sl[1] * LV, lb = sl[2] * LV;
    const fr = th.fog[0] * (1 - fk), fg = th.fog[1] * (1 - fk), fb = th.fog[2] * (1 - fk);
    const add = !!it.add;
    const addK = Math.min(1, (sl[0] + sl[1] + sl[2]) / 3);

    if (!it.spr) { // partícula: píxel, disco o cruz, opaca, aditiva o translúcida
      const c = it.color, al = it.alpha === undefined ? 1 : it.alpha, shp = it.shape;
      const pcx = left + sw / 2, pcy = top + sh / 2, rr = (sw / 2) * (sw / 2) + 0.3;
      for (let X = xa; X <= xb; X++) {
        if (ty >= zbuf[X]) continue;
        for (let Y = ya; Y <= yb; Y++) {
          const ddx = X + 0.5 - pcx, ddy = Y + 0.5 - pcy;
          if (shp === 'disc' && ddx * ddx + ddy * ddy > rr) continue;
          if (shp === 'cross' && Math.abs(ddx) > 0.6 && Math.abs(ddy) > 0.6) continue;
          if (al < 1 && !add && BAY[(X & 3) | ((Y & 3) << 2)] > al) continue; // transparencia tramada
          const o = Y * VW + X;
          if (add) buf[o] = addPix(buf[o], c, 255 * al);
          else buf[o] = shadePix(c, lr, lg, lb, BAY[(X & 3) | ((Y & 3) << 2)], kq, fr, fg, fb);
        }
      }
      return;
    }
    const spr = it.spr, tp = it.flash ? spr.flash : spr.px, tw = spr.w, th2 = spr.h;
    const ix = tw / sw, iy = th2 / sh;
    const flip = it.flip;
    for (let X = xa; X <= xb; X++) {
      if (ty >= zbuf[X]) continue;
      let tX = ((X + 0.5 - left) * ix) | 0; if (tX >= tw) tX = tw - 1; if (tX < 0) tX = 0;
      if (flip) tX = tw - 1 - tX;
      for (let Y = ya; Y <= yb; Y++) {
        let tY = ((Y + 0.5 - top) * iy) | 0; if (tY >= th2) tY = th2 - 1; if (tY < 0) tY = 0;
        const c = tp[tY * tw + tX], a = c >>> 24;
        if (a === 0) continue;
        const o = Y * VW + X;
        if (add) buf[o] = addPix(buf[o], c, a * (it.bright ? 1 : addK) * (it.k === undefined ? 1 : it.k));
        else if (a === 250) buf[o] = c | 0xFF000000;
        else if (a === 255) buf[o] = shadePix(c, lr, lg, lb, BAY[(X & 3) | ((Y & 3) << 2)], kq, fr, fg, fb);
        else buf[o] = blendPix(buf[o], shadePix(c, lr, lg, lb, BAY[(X & 3) | ((Y & 3) << 2)], kq, fr, fg, fb), a);
      }
    }
  }

  // ---------- capa de pantalla (manos, efectos)
  blit(spr, x0, y0, opt = {}) {
    const buf = this.buf, tp = spr.px, k = opt.mul || 1;
    x0 = Math.round(x0); y0 = Math.round(y0);
    for (let y = 0; y < spr.h; y++) {
      const Y = y0 + y; if (Y < 0 || Y >= VH) continue;
      for (let x = 0; x < spr.w; x++) {
        const X = x0 + x; if (X < 0 || X >= VW) continue;
        const c = tp[y * spr.w + x], a = c >>> 24;
        if (!a) continue;
        const o = Y * VW + X;
        if (opt.add) buf[o] = addPix(buf[o], c, a * k);
        else if (a === 250 || k === 1) buf[o] = c | 0xFF000000;
        else buf[o] = rgb((c & 255) * k, ((c >> 8) & 255) * k, ((c >> 16) & 255) * k);
      }
    }
  }
  pdisc(cx, cy, r, c) {
    cx = Math.round(cx); cy = Math.round(cy);
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      const X = cx + i, Y = cy + j;
      if (i * i + j * j <= r * r + r * 0.6 && X >= 0 && Y >= 0 && X < VW && Y < VH) this.buf[Y * VW + X] = c;
    }
  }
  glow(cx, cy, r, col, str) {
    cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r);
    const buf = this.buf;
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      const d = Math.hypot(i, j) / r; if (d >= 1) continue;
      const x = cx + i, y = cy + j; if (x < 0 || y < 0 || x >= VW || y >= VH) continue;
      const f = Math.pow(1 - d, 1.8) * str, o = y * VW + x, c = buf[o];
      buf[o] = rgb((c & 255) + col[0] * f, ((c >> 8) & 255) + col[1] * f, ((c >> 16) & 255) + col[2] * f);
    }
  }

  // Sprite rotado alrededor de un punto de agarre (ax,ay) colocado en pantalla en (x,y)
  blitRot(spr, ax, ay, x, y, ang, mul = 1, add = false, sc = 1, sv = 1) { // sv: escorzo a lo largo del eje vertical del sprite
    const buf = this.buf, tp = spr.px, c = Math.cos(ang), s = Math.sin(ang);
    const pts = [[0, 0], [spr.w, 0], [0, spr.h], [spr.w, spr.h]].map(([u, v]) => [x + ((u - ax) * c - (v - ay) * sv * s) * sc, y + ((u - ax) * s + (v - ay) * sv * c) * sc]);
    const x0 = Math.max(0, Math.floor(Math.min(...pts.map(q => q[0])))), x1 = Math.min(VW - 1, Math.ceil(Math.max(...pts.map(q => q[0]))));
    const y0 = Math.max(0, Math.floor(Math.min(...pts.map(q => q[1])))), y1 = Math.min(VH - 1, Math.ceil(Math.max(...pts.map(q => q[1]))));
    const isc = 1 / sc;
    for (let Y = y0; Y <= y1; Y++) for (let X = x0; X <= x1; X++) {
      const dx = (X + 0.5 - x) * isc, dy = (Y + 0.5 - y) * isc;
      const u = Math.floor(ax + dx * c + dy * s), v = Math.floor(ay + (-dx * s + dy * c) / sv);
      if (u < 0 || v < 0 || u >= spr.w || v >= spr.h) continue;
      const col = tp[v * spr.w + u];
      if (!(col >>> 24)) continue;
      const o = Y * VW + X;
      if (add) buf[o] = addPix(buf[o], col, 255 * mul);
      else if ((col >>> 24) === 250) buf[o] = col | 0xFF000000;
      else buf[o] = rgb((col & 255) * mul, ((col >> 8) & 255) * mul, ((col >> 16) & 255) * mul);
    }
  }
  pline(x0, y0, x1, y1, c, w = 1) {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)) + 1, h = (w - 1) / 2;
    for (let i = 0; i <= n; i++) {
      const x = Math.round(lerp(x0, x1, i / n)), y = Math.round(lerp(y0, y1, i / n));
      for (let oy = -Math.floor(h); oy <= Math.ceil(h); oy++) for (let ox = -Math.floor(h); ox <= Math.ceil(h); ox++) {
        const X = x + ox, Y = y + oy;
        if (X >= 0 && Y >= 0 && X < VW && Y < VH) this.buf[Y * VW + X] = c;
      }
    }
  }
  tri(ax, ay, bx, by, cx, cy, col, fade, seed) {
    const d = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    if (Math.abs(d) < 1e-6) return;
    const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx))), x1 = Math.min(VW - 1, Math.ceil(Math.max(ax, bx, cx)));
    const y0 = Math.max(0, Math.floor(Math.min(ay, by, cy))), y1 = Math.min(VH - 1, Math.ceil(Math.max(ay, by, cy)));
    const buf = this.buf;
    for (let Y = y0; Y <= y1; Y++) for (let X = x0; X <= x1; X++) {
      const px = X + 0.5, py = Y + 0.5;
      const w0 = ((bx - px) * (cy - py) - (by - py) * (cx - px)) / d, w1 = ((cx - px) * (ay - py) - (cy - py) * (ax - px)) / d;
      if (w0 < 0 || w1 < 0 || w0 + w1 > 1) continue;
      if (fade > 0 && hash2(X, Y, seed) < fade) continue;
      buf[Y * VW + X] = col | 0xFF000000;
    }
  }
  // Estela del golpe: cinta fina que sigue la trayectoria real de la punta (blanca fuera, se estrecha hacia la cola)
  smear(k, u, x0, y0, rest, L, rampName, mir = 1) {
    const i = k.findIndex(q => q.ln || q.sm || q.cl);
    if (i < 1) return;
    const tA = k[i - 1].t, tB = k[i].t, fadeT = 0.14;
    if (u <= tA || u > tB + fadeT) return;
    const f = u > tB ? (u - tB) / fadeT : 0;
    const head = Math.min(u, tB), tail = tA + (tB - tA) * f * 0.85;
    if (head - tail < 0.004) return;
    const R = VR[rampName] || VR.steel, N = 22, bands = [[0.96, 1.02, 0, 0], [0.9, 0.96, 1, 0.3], [0.83, 0.9, 3, 0.65]];
    let prev = null;
    for (let n = 0; n <= N; n++) {
      const t = lerp(tail, head, n / N), q = bladeAt(k, t, x0, y0, rest, mir);
      const gx = q.gx, gy = q.gy, an = q.ang, sx = Math.sin(an), cy = -Math.cos(an), ll = L * q.s * q.sv;
      const cur = bands.map(b => [gx + sx * ll * b[0], gy + cy * ll * b[0], gx + sx * ll * b[1], gy + cy * ll * b[1]]);
      if (prev) {
        const w = n / N; // 0 cola, 1 cabeza
        bands.forEach((b, j) => {
          if (w < b[3]) return;
          const [a0x, a0y, a1x, a1y] = prev[j], [b0x, b0y, b1x, b1y] = cur[j], col = R[Math.min(R.length - 1, b[2] + (w < 0.35 ? 1 : 0))];
          const seed = (u * 60) | 0, fd = f + (1 - w) * 0.25;
          this.tri(a0x, a0y, a1x, a1y, b1x, b1y, col, fd, seed);
          this.tri(a0x, a0y, b1x, b1y, b0x, b0y, col, fd, seed);
        });
      }
      prev = cur;
    }
  }
  // Corte de un solo trazo (como los arañazos de las garras): crece durante el golpe y se recoge hacia su final
  slashLine(k, u, mir, rampName) {
    const i = k.findIndex(q => q.ln);
    if (i < 1) return;
    const tA = k[i - 1].t, tB = k[i].t, fadeT = 0.16;
    if (u <= tA || u > tB + fadeT) return;
    const grow = clamp((u - tA) / (tB - tA), 0, 1), fade = u > tB ? (u - tB) / fadeT : 0;
    let [ax, ay, bx, by] = k[i].ln;
    if (mir < 0) { ax = 1 - ax; bx = 1 - bx; }
    ax *= VW; bx *= VW; ay *= VH; by *= VH;
    const R = VR[rampName] || VR.steel, len = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / len, uy = (by - ay) / len;
    const t0 = fade * len * 0.85, t1 = len * grow;
    for (let pass = 0; pass < 2; pass++) for (let t = t0; t < t1; t++) {
      const w = Math.sin(Math.PI * t / len); // fino en las puntas, grueso en el centro
      if (fade > 0 && hash2(t | 0, pass, 3) < fade * 0.6) continue;
      const x = ax + ux * t, y = ay + uy * t, headK = t > t1 - 7 && grow < 1;
      if (pass === 0) this.pline(x, y, x, y, R[headK ? 1 : 3], Math.round(2 + 3 * w));
      else this.pline(x, y, x, y, R[0], Math.max(1, Math.round(0.6 + 2 * w)));
    }
  }
  // La mano sigue al brazo: el antebrazo apunta siempre hacia el hombro (fuera de pantalla, abajo)
  // y la muñeca acompaña sólo un poco el giro de la hoja
  armHand(p, side, x, y, wAng, rest, rx, ry, lm) {
    if (y < VH * 0.5) return; // con el puño arriba solo se ve el arma (si no, el antebrazo colgaría desde el borde superior)
    const sx = side > 0 ? VW * 0.9 : VW * 0.1, sy = VH + 110;
    const arm = (X, Y) => Math.atan2(-(sx - X), sy - Y);
    this.hand(p, side, x, y, rest + (arm(x, y) - arm(rx, ry)) + 0.12 * (wAng - rest), lm);
  }
  // Mano de la clase colocada con el centro del puño en (x,y)
  // ang = ángulo del arma; la mano se inclina además HAND_TILT para que la muñeca salga en diagonal
  // hacia su esquina y la empuñadura asome por debajo del puño (el arma va siempre por detrás)
  hand(p, side, x, y, ang, lm) {
    const h = SPR[(side > 0 ? 'handR_' : 'handL_') + p.cls] || SPR.handR_ladron;
    this.blitRot(h, h.grip.x, h.grip.y, x, y, h.side ? ang : ang - side * HAND_TILT, lm, false, HS);
  }

  // Manos y arma en primera persona (escala x2, arma casi vertical a la derecha como en Oblivion/Daggerfall)
  drawHands(p, time, glowCol) {
    const mv = Math.min(1, p.moveAmt || 0);
    const bx = Math.sin(p.bob) * 7 * mv, by = Math.abs(Math.cos(p.bob)) * 6 * mv + Math.sin(time * 1.7) * 1.2;
    const a = p.anim, rc = a * a;
    const flick = 0.92 + 0.08 * Math.sin(time * 13) + 0.04 * Math.sin(time * 31);
    const lm = (0.86 + 0.14 * flick) * (p.handLight === undefined ? 1 : p.handLight);
    const W = p.weapon, hk = WEAPONS[W].hands;
    let sw = 0, swDir = 1, spin = false;
    if (p.swing) { sw = clamp(p.swing.t / p.swing.dur, 0, 1); swDir = p.swing.dir; spin = !!p.swing.spin; }
    const swE = 1 - (1 - sw) * (1 - sw), swArc = Math.sin(sw * Math.PI);
    // puntos de agarre en reposo (centro del puño)
    const sideUp = (SPR['handR_' + p.cls] || {}).side ? 40 : 0; // las manos de perfil se ven enteras: subir el agarre
    const RGx = Math.round(VW * 0.70 + bx), RGy = Math.round(VH - 60 - sideUp + by);
    const LGx = Math.round(VW * 0.25 - bx * 0.7), LGy = Math.round(VH - 60 - sideUp + by * 0.8);
    const S2 = HS;

    // ---------- forma animal: garras abiertas, sin armas ni antorcha
    if (W === 'claws') {
      const k = p.form === 'bear' ? 'bear' : 'wolf';
      for (const side of [1, -1]) {
        const s = SPR[(side > 0 ? 'clawsR_' : 'clawsL_') + k];
        const active = p.swing && swDir === side;
        const x0 = (side > 0 ? VW * 0.76 : VW * 0.24) + bx * side * 0.6, y0 = VH - 40 + by + Math.sin(time * 3 + side) * 2;
        let ang = side * -0.08 + Math.sin(time * 2.2 + side) * 0.04, x = x0, y = y0; // zarpas alzadas, algo giradas hacia el centro
        if (active) {
          const mv = MOVES.cl.swipe, q = poseAt(mv, sw);
          ang = side * -0.08 + q.a * side; x = x0 + q.x * side; y = y0 + q.y;
          // tres arañazos que cruzan la pantalla al soltar el zarpazo
          const m0 = clamp((sw - 0.22) / 0.1, 0, 1), fade = clamp((sw - 0.4) / 0.2, 0, 1);
          if (m0 > 0 && fade < 1) {
            const R = VR.steel, cx = VW / 2, cy = VH * 0.45, len = 160 * m0;
            for (let m = -1; m <= 1; m++) for (let t = 0; t < len; t++) {
              const fx = cx + side * (52 - t * 0.55) + m * 13, fy = cy - 92 + t * 0.95 + m * 3;
              const c = t > len - 6 ? R[0] : t > len * 0.6 ? R[1] : R[3];
              if (hash2(t, m, 5) >= fade) this.pline(fx, fy, fx + 1, fy, c, t > len * 0.3 ? 2 : 1);
            }
          }
        }
        this.blitRot(s, s.grip.x, s.grip.y, x, y, ang, lm, false, S2);
      }
      return;
    }

    // ---------- mano izquierda: antorcha o escudo (solo con armas de una mano)
    if (hk === 1 && p.off === 'torch') {
      const ang = 0.08;
      const fl = ((time * 11) | 0) & 1; // parpadeo: alterna el sprite con su reflejo
      this.blitRot(fl ? SPR.torchB : SPR.torch, fl ? 32 : 31, 100, LGx, LGy, ang, lm, false, S2);
      this.glow(LGx + Math.sin(ang) * 150, LGy - Math.cos(ang) * 150, 70, [255, 150, 60], 0.36 * flick);
      this.hand(p, -1, LGx, LGy, ang, lm);
    } else if (hk === 1 && p.off === 'shield') {
      const k = p.block;
      const sx = lerp(VW * 0.17, VW * 0.40, k), sy = lerp(VH - 40, VH - 118, k);
      this.hand(p, -1, sx + 10, sy + 70, 0.1, lm);
      this.blitRot(SPR.shield, 64, 64, sx - bx * 0.5, sy + by * 0.5, lerp(0.15, -0.02, k), lm, false, S2);
    }

    // ---------- bastones (sprite y brillo según el hechizo)
    if (W === 'staff') {
      const sp = p.spell, spr = sp === 'nature' ? SPR.staff_nature : (sp === 'plague' || sp === 'dark') ? SPR.staff_dark : SPR.staff;
      const kick = rc * 22, ang = 0.04 - rc * 0.18;
      const gx = RGx - rc * 14, gy = RGy - kick;
      this.blitRot(spr, 32, 100, gx, gy, ang, lm, false, S2);
      this.hand(p, 1, gx, gy, ang, lm);
      const ox = gx + Math.sin(ang) * 160, oy = gy - Math.cos(ang) * 160;
      this.glow(ox, oy, 36 + a * 26, glowCol, 0.5 * (0.7 + 0.3 * Math.sin(time * 5) + a));
      return;
    }
    // ---------- arco: en la mano izquierda, la derecha tensa la cuerda
    if (W === 'bow') {
      // solo el arco: cuerda tensada con la flecha montada; al soltar, la cuerda vuelve y el arco retrocede
      const gx = VW * 0.38 + bx * 0.5 + rc * 6, gy = VH - 92 + by * 0.6 + rc * 16, ba = -0.32 - rc * 0.1;
      this.blitRot(SPR.bow, 34, 86, gx, gy, ba, lm, false, S2);
      const tip = (v) => [gx + (-(v - 86) * Math.sin(ba)) * S2, gy + ((v - 86) * Math.cos(ba)) * S2];
      const [tx0, ty0] = tip(6), [tx1, ty1] = tip(168);
      const mx = lerp(tx0, tx1, 0.5), my = lerp(ty0, ty1, 0.5);
      const drawn = a < 0.15 ? 1 : Math.max(0, 1 - a * 1.6); // 1 = cuerda tensada
      const nx = mx + 70 * drawn + 6, ny = my + 48 * drawn;
      const sc = rgb(225, 215, 185);
      this.pline(tx0, ty0, nx, ny, sc, 1); this.pline(nx, ny, tx1, ty1, sc, 1);
      if (drawn > 0.9) { // flecha montada apuntando a la mirilla
        const cdx = VW * 0.5 - nx, cdy = VH * 0.5 - ny, cl = Math.hypot(cdx, cdy) || 1, ux = cdx / cl, uy = cdy / cl;
        const ex = nx + ux * 118, ey = ny + uy * 118;
        this.pline(nx, ny, ex, ey, rgb(110, 74, 40), 3); this.pline(nx, ny, ex, ey, rgb(180, 132, 84), 1);
        for (let k = 0; k < 9; k++) this.pline(ex + ux * k - uy * (9 - k) * 0.5, ey + uy * k + ux * (9 - k) * 0.5, ex + ux * k + uy * (9 - k) * 0.5, ey + uy * k - ux * (9 - k) * 0.5, rgb(205, 210, 220), 1);
        for (let k = 0; k < 3; k++) this.pline(nx + ux * (6 + k * 4) - uy * 5, ny + uy * (6 + k * 4) + ux * 5, nx + ux * (6 + k * 4) + uy * 5, ny + uy * (6 + k * 4) - ux * 5, rgb(190, 40, 30), 1);
        if (p.element) this.glow(ex, ey, 18, glowCol, 0.35 + 0.15 * Math.sin(time * 8));
      }
      if (a > 0.4) this.glow(mx - 10, my - 6, 26, p.element ? glowCol : [255, 235, 160], 0.6 * a);
      return;
    }
    // ---------- dagas gemelas: una en cada mano
    if (W === 'daggers') {
      for (const side of [1, -1]) {
        const active = p.swing && swDir === side;
        const rest = side * 0.1, x0 = side > 0 ? RGx : LGx, y0 = side > 0 ? RGy : LGy;
        let ang = rest, x = x0, y = y0, s = 1, sv = 1;
        if (active) {
          // la izquierda hace el mismo movimiento en espejo
          const mv = MOVES.dg[p.swing.move || 'slash'] || MOVES.dg.slash, q = bladeAt(mv, sw, x0, y0, rest, side);
          if (p.swing.strong) this.smear(mv, sw, x0, y0, rest, 82 * S2, p.slashRamp || 'steel', side);
          this.slashLine(mv, sw, side, p.slashRamp || 'steel');
          ang = q.ang; x = q.gx; y = q.gy; s = q.s; sv = q.sv;
        }
        this.blitRot(side > 0 ? SPR.dagger : SPR.daggerL, side > 0 ? 23 : 24, 80, x, y, ang, lm, false, S2 * s, sv);
        this.armHand(p, side, x, y, ang, rest, x0, y0, lm);
      }
      return;
    }
    // ---------- armas blancas: espada, espadón y daga
    const big = W === 'greatsword', dag = W === 'dagger';
    const spr = big ? SPR.greatsword : dag ? SPR.dagger : SPR.sword;
    const grip = big ? [39, 190] : dag ? [23, 80] : [31, 122]; // justo bajo la guarda: la guarda apoya en el puño y el pomo asoma debajo
    const rest = big ? -0.08 : 0.04, fam = big ? 'gs' : dag ? 'dg' : 'sw', L = (big ? 190 : dag ? 82 : 125) * S2;
    const x0 = big ? VW * 0.60 : RGx, y0 = big ? VH - 22 - sideUp + by : RGy;
    let ang = rest, gx = x0, gy = y0, sc = 1, sv = 1, hide = 0;
    if (p.swing && spin) { // torbellino: las manos se esconden abajo y solo gira el arma
      const k = Math.min(1, sw * 6, (1 - sw) * 6);
      ang = 0.8 - swE * TAU * 1.5; gx = x0 - 60 * k; gy = y0 + 70 * k; hide = 40;
    } else if (p.swing) {
      const mv = MOVES[fam][p.swing.move || (swDir > 0 ? 'slash' : 'rise')] || MOVES[fam].slash, q = bladeAt(mv, sw, x0, y0, rest);
      const ramp = p.enchanted ? 'cyan' : p.slashRamp || 'steel';
      if (p.swing.strong) this.smear(mv, sw, x0, y0, rest, L, ramp); // estela solo en golpes fuertes
      this.slashLine(mv, sw, 1, ramp);
      ang = q.ang; gx = q.gx; gy = q.gy; sc = q.s; sv = q.sv;
      const st = mv.find(o => o.st); // destello en la punta de la estocada
      if (st && sw > st.t - 0.06 && sw < st.t + 0.12) this.glow(gx + Math.sin(ang) * L * sc, gy - Math.cos(ang) * L * sc, 22, [230, 240, 255], 0.5);
    }
    this.blitRot(spr, grip[0], grip[1], gx, gy, ang, lm, false, S2 * sc, sv);
    if (p.enchanted) {
      const len = (big ? 180 : dag ? 70 : 120) * S2 * sc * sv;
      for (let k = 0.3; k <= 1; k += 0.2) this.glow(gx + Math.sin(ang) * len * k, gy - Math.cos(ang) * len * k, 18, [100, 190, 255], 0.32 + 0.1 * Math.sin(time * 9 + k * 5));
    }
    if (spin) { // las manos quedan quietas abajo mientras gira la hoja
      if (big) this.hand(p, -1, x0 + Math.sin(rest) * 44, y0 - Math.cos(rest) * 44 + hide, rest, lm);
      this.hand(p, 1, x0, y0 + hide, rest, lm);
      return;
    }
    if (big) { // la mano izquierda agarra más arriba de la empuñadura
      const up = 22 * S2 * sc * sv, lx = gx + Math.sin(ang) * up, ly = gy - Math.cos(ang) * up;
      this.armHand(p, -1, lx, ly, ang, rest, x0 + Math.sin(rest) * up, y0 - Math.cos(rest) * up, lm);
    }
    this.armHand(p, 1, gx, gy, ang, rest, x0, y0, lm);
  }

  // viñeta de color (daño / destello)
  tint(amount, col) {
    if (amount <= 0.01) return;
    const buf = this.buf, e = this.edge;
    for (let i = 0; i < buf.length; i++) {
      const k = Math.min(1, e[i] * amount * 1.6 + amount * 0.12);
      if (k <= 0.01) continue;
      const c = buf[i];
      buf[i] = rgb(lerp(c & 255, col[0], k), lerp((c >> 8) & 255, col[1], k), lerp((c >> 16) & 255, col[2], k));
    }
  }
  // fundido a negro (cambio de nivel)
  fadeBlack(k) {
    if (k <= 0.01) return;
    const buf = this.buf, m = 1 - Math.min(1, k);
    for (let i = 0; i < buf.length; i++) { const c = buf[i]; buf[i] = rgb((c & 255) * m, ((c >> 8) & 255) * m, ((c >> 16) & 255) * m); }
  }
  flash(amount, col) {
    if (amount <= 0.01) return;
    const buf = this.buf;
    for (let i = 0; i < buf.length; i++) { const c = buf[i]; buf[i] = rgb((c & 255) + col[0] * amount, ((c >> 8) & 255) + col[1] * amount, ((c >> 16) & 255) + col[2] * amount); }
  }
}

function shadePix(c, lr, lg, lb, b, kq, fr, fg, fb) {
  let R = (c & 255) * ((lr + b) | 0) * kq + fr; if (R > 255) R = 255;
  let G = ((c >> 8) & 255) * ((lg + b) | 0) * kq + fg; if (G > 255) G = 255;
  let B = ((c >> 16) & 255) * ((lb + b) | 0) * kq + fb; if (B > 255) B = 255;
  return (0xFF000000 | (B << 16) | (G << 8) | R) >>> 0;
}
function addPix(d, c, a) {
  const k = a / 255;
  return (0xFF000000 | Math.min(255, ((d >> 16) & 255) + ((c >> 16) & 255) * k) << 16 | Math.min(255, ((d >> 8) & 255) + ((c >> 8) & 255) * k) << 8 | Math.min(255, (d & 255) + (c & 255) * k)) >>> 0;
}
function blendPix(d, c, a) {
  const k = a / 255, ik = 1 - k;
  return (0xFF000000 | (((c >> 16) & 255) * k + ((d >> 16) & 255) * ik) << 16 | (((c >> 8) & 255) * k + ((d >> 8) & 255) * ik) << 8 | ((c & 255) * k + (d & 255) * ik)) >>> 0;
}
