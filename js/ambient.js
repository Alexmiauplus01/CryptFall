// Efectos de ambiente y de combate en pixel art, adaptados de la biblioteca de efectos de Sprite Fusion
// (pixel-art-vfx, licencia MIT, https://www.spritefusion.com/pixel-art-vfx): paletas, tiempos y tramado de sus recetas.
// Ambiente (solo lo que tiene sentido en una mazmorra cerrada), en pantalla y desplazándose al girar la cámara:
//   La Cripta: niebla baja · Catacumbas: esporas luminosas del musgo · Foso Infernal: nada (las ascuas salen del fuego)
//   El Vacío: destellos mágicos · Cuevas Heladas: vaho helado · Cloacas: miasma verde · Templo Hundido: motas de polvo dorado
// Las ascuas salen de verdad de antorchas y braseros cercanos (partículas en el mundo, cualquier temática).
// La nieve y las burbujas se usan en habilidades: escarcha (novas de hielo y cuando te ralentiza el frío) y veneno.
const AMB_BY_THEME = ['fog', 'spores', null, 'sparkle', 'frostmist', 'miasma', 'dust'];
const FOG_T = [0.3, 0.52, 0.74];
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
const hexRGB = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const AP = {
  fire: ['#fff3a6', '#ffe26b', '#ff8a2a', '#f2561d', '#c9281f'].map(hexRGB), ash: ['#5a5160', '#3a3442'].map(hexRGB),
  snow: ['#ffffff', '#e3edff', '#9fb1e6', '#6c7cb8'].map(hexRGB),
  fog: ['#4b5075', '#6c739a', '#979dbb', '#b4b8cf'].map(hexRGB), frost: ['#5a7290', '#86a6c4', '#bcd6ec', '#e6f3ff'].map(hexRGB),
  tox: ['#e6ffcf', '#a8e86a', '#62b83e', '#2f7a2a', '#4f9a36'].map(hexRGB), spore: ['#e6fff4', '#8ef0c8', '#3aa889'].map(hexRGB), miasma: ['#26401f', '#3d6a2c', '#6a9f45', '#9cc56a'].map(hexRGB),
  fly: ['#faffbe', '#c8ff5a', '#6f8f2a'].map(hexRGB),
  cool: ['#ffffff', '#dcfbff', '#a6ecff', '#62c8f4', '#3a8bd8'].map(hexRGB), warm: ['#ffffff', '#fffbe2', '#fff0a6', '#ffd862', '#f6aa3c'].map(hexRGB),
  bub: ['#ffffff', '#c6f3ff', '#68bfe6', '#2f7fb6', '#4b9fce'].map(hexRGB),
  heal: ['#ffffff', '#e6ffdc', '#acff92', '#62e26a', '#30b55b', '#1a1422'].map(hexRGB),
  blood: ['#ff8a7a', '#f2384a', '#c71e33', '#931327', '#5e0c1b'].map(hexRGB),
  ichor: ['#d8ff9a', '#9be05a', '#5fa83a', '#3b7428', '#22461a'].map(hexRGB),
};

const Ambient = {
  kind: null, parts: [], fx: [], t: 0, lastA: null, noise: null,
  reset(kind) { this.kind = kind; this.parts = []; this.lastA = null; this.fogDirty = true; for (let i = 0; i < 240; i++) this.update(1 / 60, null, true); },
  // ---------------------------------------------------------------- simulación
  update(dt, p, warm) {
    const kind = G.lv ? AMB_BY_THEME[G.lv.theme % AMB_BY_THEME.length] : null;
    if (!warm && kind !== this.kind) return this.reset(kind);
    this.t += dt;
    // giro de cámara: las partículas se desplazan como si estuvieran en el mundo
    let shift = 0;
    if (p && !warm) {
      if (this.lastA !== null) { let da = p.a - this.lastA; da = Math.atan2(Math.sin(da), Math.cos(da)); shift = -da * VW / (2 * Math.atan(PLANE_LEN)); }
      this.lastA = p.a;
    }
    const k = (G.cfg && G.cfg.fast) ? 0.5 : 1, R = Math.random;
    const add = (o) => this.parts.push(o);
    if (this.kind === 'spores') {
      while (this.parts.filter(q => q.k === 'spore').length < 12 * k) add({ k: 'spore', x: R() * VW, y: VH * rand(0.2, 0.85), vx: 0, vy: 0, seed: R() * 10, life: 1e9, t: rand(0, 6) });
    } else if (this.kind === 'sparkle') {
      if (R() < dt * 9 * k) add({ k: 'star', x: R() * VW, y: R() * VH * 0.85, life: rand(0.6, 1.3), t: 0, big: R() < 0.25 });
    } else if (this.kind === 'dust') {
      while (this.parts.filter(q => q.k === 'dust').length < 22 * k) add({ k: 'dust', x: R() * VW, y: VH * rand(0.1, 0.9), vy: -rand(1, 4), sw: rand(0, 6), amp: 5, life: rand(6, 12), t: 0 });
    }
    // estados del jugador: escarcha (copos por arriba) y veneno (burbujas verdes por abajo)
    if (p && p.chill > 0 && R() < dt * 30) add({ k: 'flake', d: R() < 0.6 ? 0 : 1, x: R() * VW, y: -4, vy: rand(30, 55), sw: rand(0, 6), amp: 8, life: 6, t: 0, c: R() < 0.5 ? 2 : 3 });
    if (p && p.poisT > 0 && R() < dt * 14) { const side = R() < 0.5 ? rand(0, VW * 0.28) : rand(VW * 0.72, VW); add({ k: 'bub', tox: true, x: side, y: VH + 4, r: R() < 0.6 ? 1 : 2, vy: -rand(25, 45), sw: rand(0, 6), life: 4, t: 0, pop: VH * rand(0.45, 0.8) }); }
    for (const q of this.parts) {
      q.t += dt; q.x += shift * (q.k === 'flake' ? [0.6, 0.85, 1.1][q.d] : 1);
      if (q.k === 'fly' || q.k === 'spore') { // vagan en bucles con la luz que late
        const a = 0.63 * q.seed + q.t * (0.7 + 0.9 * (q.seed % 1));
        q.vx += (16 * Math.cos(a) - q.vx) * Math.min(1, dt * 1.5); q.vy += (11 * Math.sin(1.3 * a) - 2 - q.vy) * Math.min(1, dt * 1.5);
        q.x += q.vx * dt; q.y += q.vy * dt;
        if (q.x < -10) q.x += VW + 20; if (q.x > VW + 10) q.x -= VW + 20; if (q.y < VH * 0.15) q.vy += 4; if (q.y > VH * 0.85) q.vy -= 4;
      } else if (q.vy !== undefined) {
        q.y += q.vy * dt; q.x += Math.sin(this.t * 1.3 + q.sw) * (q.amp || 6) * dt + (q.vx0 || 0) * dt; if (q.vx0) q.vx0 *= 0.94;
        if (q.k === 'flake' && q.y > VH + 4) q.dead = true;
        if (q.k === 'bub' && q.y < q.pop) { q.dead = true; if (R() < 0.6) this.fx.push({ k: 'pop', x: q.x, y: q.y, t: 0, life: 0.2, tox: q.tox }); }
      }
      if (q.t > q.life || q.x < -60 || q.x > VW + 60) q.dead = true;
    }
    this.parts = this.parts.filter(q => !q.dead);
    for (const f of this.fx) { f.t += dt; f.x += shift; if (f.vy !== undefined) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += (f.g || 0) * dt; } if (f.t > f.life) f.dead = true; }
    this.fx = this.fx.filter(f => !f.dead);
  },
  // ---------------------------------------------------------------- dibujo
  draw(R) {
    // cada píxel del efecto es un bloque de 2x2 (la misma rejilla que manos y armas); los desplazamientos van en píxeles del efecto
    const buf = R.buf, put = (x, y, c, ox = 0, oy = 0) => {
      x = ((x | 0) & ~1) + ox * 2; y = ((y | 0) & ~1) + oy * 2; if (x < 0 || y < 0 || x >= VW - 1 || y >= VH - 1) return;
      const v = rgb(c[0], c[1], c[2]), o = y * VW + x; buf[o] = buf[o + 1] = buf[o + VW] = buf[o + VW + 1] = v;
    };
    if (this.kind === 'fog' || this.kind === 'miasma' || this.kind === 'frostmist') this.drawFog(buf, this.kind === 'fog' ? AP.fog : this.kind === 'miasma' ? AP.miasma : AP.frost, this.kind === 'frostmist' ? 0.7 : 1);
    for (const q of this.parts) {
      const f = q.t / q.life, fade = Math.min(1, q.t / (q.life / 8), (q.life - q.t) / (q.life / 3));
      const dith = (x, y) => fade > BAYER4[((y | 0) & 3) * 4 + ((x | 0) & 3)];
      if (q.k === 'spark') {
        const c = f > 0.8 ? AP.fire[4] : f > 0.5 ? AP.fire[2] : (Math.sin(22 * this.t + 3 * q.s) > -0.2 ? AP.fire[1] : AP.fire[2]);
        if (dith(q.x, q.y)) put(q.x, q.y, c);
      } else if (q.k === 'cinder') {
        if (!dith(q.x, q.y)) continue;
        put(q.x, q.y, AP.fire[q.big ? 0 : 1]);
        if (q.big) { put(q.x, q.y, AP.fire[2], 1, 0); put(q.x, q.y, AP.fire[3], 0, 1); put(q.x, q.y, AP.fire[3], 1, 1); }
        R.glow(q.x, q.y, q.big ? 6 : 4, [255, 120, 50], 0.25 * fade);
      } else if (q.k === 'ash') { if (dith(q.x, q.y)) put(q.x, q.y, AP.ash[(q.t * 3 | 0) & 1]);
      } else if (q.k === 'flake') {
        const S = AP.snow;
        if (q.d === 0) put(q.x, q.y, S[q.c]);
        else if (q.d === 1) { put(q.x, q.y, S[0]); put(q.x, q.y, S[1], 1, 0); put(q.x, q.y, S[1], 0, 1); put(q.x, q.y, S[2], 1, 1); }
        else { put(q.x, q.y, S[0]); for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) put(q.x, q.y, S[1], dx, dy); put(q.x, q.y, S[2], -2, 0); put(q.x, q.y, S[2], 2, 0); }
      } else if (q.k === 'spore') { // esporas del musgo: puntitos verdeazulados que laten
        const lit = Math.sin(q.t * 1.6 + q.seed * 3) > 0.2;
        put(q.x, q.y, lit ? AP.spore[1] : AP.spore[2]);
        if (lit) R.glow(q.x, q.y, 6, [90, 240, 190], 0.18);
      } else if (q.k === 'dust') { // motas de polvo dorado que flotan y brillan al cruzar la luz
        if (!dith(q.x, q.y)) continue;
        put(q.x, q.y, Math.sin(q.t * 3 + q.sw * 5) > 0.6 ? AP.warm[2] : AP.warm[4]);
      } else if (q.k === 'fly') {
        const lit = Math.sin(q.t * 2.2 + q.seed * 3) > -0.1;
        put(q.x, q.y, lit ? AP.fly[0] : AP.fly[2]);
        if (lit) { put(q.x, q.y, AP.fly[1], 1, 0); R.glow(q.x, q.y, 9, [200, 255, 90], 0.35); }
      } else if (q.k === 'star') {
        const g = Math.sin(f * Math.PI), arm = Math.round(g * (q.big ? 3 : 2)), C = AP.cool;
        put(q.x, q.y, C[0]);
        for (let i = 1; i <= arm; i++) { const c = i === 1 ? C[2] : C[3]; put(q.x, q.y, c, i, 0); put(q.x, q.y, c, -i, 0); put(q.x, q.y, c, 0, i); put(q.x, q.y, c, 0, -i); }
        if (q.big) R.glow(q.x, q.y, 6, [120, 200, 255], 0.3 * g);
      } else if (q.k === 'bub') {
        const B = q.tox ? AP.tox : AP.bub, r = q.r;
        if (r === 1) { put(q.x, q.y, B[1]); put(q.x, q.y, B[3], 1, 1); continue; }
        for (let a = 0; a < 16; a++) { const an = a / 16 * TAU; put(q.x, q.y, an > 2.4 && an < 4.4 ? B[1] : an < 1.4 ? B[3] : B[2], Math.round(Math.cos(an) * r), Math.round(Math.sin(an) * r)); }
        put(q.x, q.y, B[0], -r + 1, -r + 1);
      }
    }
    for (const f of this.fx) {
      const k = f.t / f.life;
      if (f.k === 'pop') { const r = Math.round(1 + k * 2), B = f.tox ? AP.tox : AP.bub; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(f.x, f.y, k < 0.5 ? B[0] : B[1], dx * r, dy * r); }
      else if (f.k === 'cross') { // curación: cruces que suben desde abajo
        const c = f.big ? 2 : 1, C = AP.heal, x = f.x, y = f.y;
        if (k > 0.85 && ((f.t * 30) | 0) & 1) continue;
        for (let i = -c; i <= c; i++) { put(x, y, i === -c ? C[1] : C[2], i, 0); put(x, y, i === -c ? C[1] : C[2], 0, i); }
        put(x, y, C[0]);
      } else if (f.k === 'mote') put(f.x, f.y, k < 0.5 ? f.c[0] : f.c[1]);
    }
  },
  // niebla: bandas de ruido estiradas, tramadas en tres tonos con cresta iluminada (receta "fog")
  drawFog(buf, P, dens = 1) {
    if (!this.noise) this.noise = bakeNoise(256, 128, 7);
    const N = this.noise, top = Math.floor(VH * 0.46) & ~1, H = VH - top, BW = VW >> 1, BH = H >> 1;
    // el campo de niebla se calcula a bloques de 2x2 y un fotograma de cada dos (se mueve despacio)
    this.fogFrame = (this.fogFrame || 0) + 1;
    if (!this.fogTone || this.fogTone.length !== BW * BH) this.fogTone = new Int8Array(BW * BH);
    if (this.fogFrame & 1 || this.fogDirty !== false) {
      this.fogDirty = false;
      const t = this.t, drift = t * 6 + (this.lastA || 0) * VW / (2 * Math.atan(PLANE_LEN)), T = this.fogTone;
      const field = (x, y) => { x = ((x % 256) + 256) % 256; y = ((y % 128) + 128) % 128; const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, x1 = (x0 + 1) & 255, y1 = (y0 + 1) & 127;
        return (N[y0 * 256 + x0] * (1 - fx) + N[y0 * 256 + x1] * fx) * (1 - fy) + (N[y1 * 256 + x0] * (1 - fx) + N[y1 * 256 + x1] * fx) * fy; };
      for (let by = 0; by < BH; by++) {
        const y = top + by * 2, prof = Math.min(1, ((y - top) / H) / 0.55) ** 1.2;
        let w = 0;
        for (let bx = 0; bx < BW; bx++) {
          const x = bx * 2;
          if ((bx & 3) === 0) w = field(0.175 * x + 5.4 * t, 0.6 * y - 3 * t) - 0.5;
          const n = field(x * 0.15 + drift * 0.5 + 30 * w, y * 1.2 + 12 * w + Math.sin(t * 0.4) * 3);
          const f = 0.72 * prof + 0.95 * (Math.max(0, Math.min(1, 2.6 * (n - 0.5) + 0.5)) - 0.5);
          let tone = f > 0.74 ? 2 : f > 0.52 ? 1 : f > 0.3 ? 0 : -1;
          if (tone >= 0 && f - FOG_T[tone] < 0.07 && BAYER4[(by & 3) * 4 + (bx & 3)] > (f - FOG_T[tone]) / 0.07) tone--;
          T[by * BW + bx] = tone;
        }
      }
    }
    // mezcla con la escena (aritmética entera)
    const alpha = ((G.cfg && G.cfg.fast) ? 0.38 : 0.52) * dens, T = this.fogTone;
    const tonesA = [0, 1, 2].map(k => { const a = alpha * [0.6, 0.8, 1][k]; return [Math.round(a * 256), P[k][0] * a, P[k][1] * a, P[k][2] * a]; });
    for (let by = 0; by < BH; by++) for (let bx = 0; bx < BW; bx++) {
      const tone = T[by * BW + bx]; if (tone < 0) continue;
      const [a8, r0, g0, b0] = tonesA[tone], ia = 256 - a8;
      for (let dy = 0; dy < 2; dy++) {
        const o0 = (top + by * 2 + dy) * VW + bx * 2;
        for (let dx = 0; dx < 2; dx++) { const o = o0 + dx, bb = buf[o]; buf[o] = 0xFF000000 | ((((bb >> 16) & 255) * ia >> 8) + b0 << 16) | ((((bb >> 8) & 255) * ia >> 8) + g0 << 8) | (((bb & 255) * ia >> 8) + r0); }
      }
    }
  },
  // ---------------------------------------------------------------- ráfagas de combate
  healBurst(big) { // curación: cruces verdes que suben por los lados de la vista (receta "heal")
    for (let i = 0; i < (big ? 16 : 8); i++) {
      const side = i & 1 ? 1 : -1, x = VW / 2 + side * rand(VW * 0.18, VW * 0.46);
      this.fx.push({ k: 'cross', x, y: VH * rand(0.6, 1), vx: 0, vy: -rand(30, 55), t: -rand(0, 0.3), life: rand(0.8, 1.2), big: Math.random() < 0.4 });
    }
  },
  frostBurst() { // novas de hielo: copos que salen del centro y caen (receta "snow")
    for (let i = 0; i < 46; i++) { const a = rand(0, TAU), s = rand(40, 160); this.parts.push({ k: 'flake', d: Math.random() < 0.5 ? 0 : Math.random() < 0.7 ? 1 : 2, x: VW / 2 + Math.cos(a) * 20, y: VH * 0.55 + Math.sin(a) * 12, vx0: Math.cos(a) * s, vy: Math.sin(a) * s * 0.5 + 20, sw: rand(0, 6), amp: 6, life: rand(0.8, 1.4), t: 0, c: 2 }); }
  },
  bubbleBurst() { // nubes de plaga y ácido: burbujas verdes que suben (receta "bubbles")
    for (let i = 0; i < 22; i++) this.parts.push({ k: 'bub', tox: true, x: VW / 2 + rand(-VW * 0.35, VW * 0.35), y: VH + rand(0, 30), r: Math.random() < 0.5 ? 1 : 2, vy: -rand(40, 80), sw: rand(0, 6), life: 3, t: 0, pop: VH * rand(0.3, 0.7) });
  },
  sparkleBurst(cx = VW / 2, cy = VH / 2) { // destello dorado (receta "sparkle", rampa cálida)
    for (let i = 0; i < 28; i++) { const a = rand(0, TAU), s = rand(30, 110); this.fx.push({ k: 'mote', x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 40, t: 0, life: rand(0.5, 1), c: [AP.warm[1], AP.warm[3]] }); }
  },
};

// ascuas reales: suben de las antorchas de pared y los braseros cercanos (receta "embers": chispas que se enfrían)
function fireEmbers(dt) {
  if (!G.lv || !G.p) return;
  const p = G.p, k = (G.cfg && G.cfg.fast) ? 0.5 : 1;
  for (const l of G.lv.lights) {
    if (!l.c || l.c[0] !== 0.95 || l.c[1] !== 0.55) continue; // solo fuego (antorchas y braseros)
    const d = Math.hypot(l.x - p.x, l.y - p.y); if (d > 9) continue;
    const big = l.rad >= 5; // brasero
    if (Math.random() > dt * (big ? 9 : 4) * k) continue;
    vp({ x: l.x + rand(-0.12, 0.12), y: l.y + rand(-0.12, 0.12), z: big ? 0.62 : 0.72, vx: rand(-0.15, 0.15), vy: rand(-0.15, 0.15), vz: rand(0.35, 0.8),
      drag: 0.4, life: rand(0.9, 1.8), ramp: VR.fire.slice(1, 7), s0: 0.03, s1: 0.015, maxPx: 2 });
  }
}

// ruido de valor en 4 octavas, que se repite en ambos ejes
function bakeNoise(w, h, seed) {
  const out = new Float32Array(w * h);
  for (const [cells, amp] of [[4, 0.5], [8, 0.25], [16, 0.125], [32, 0.0625]]) {
    const cw = w / cells, ch = h / (cells / 2);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const gx = x / cw, gy = y / ch, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
      const s = (t) => t * t * (3 - 2 * t), cx = cells, cy = cells / 2;
      const v = (i, j) => hash2(((i % cx) + cx) % cx, ((j % cy) + cy) % cy, seed + cells);
      const a = v(x0, y0) * (1 - s(fx)) + v(x0 + 1, y0) * s(fx), b = v(x0, y0 + 1) * (1 - s(fx)) + v(x0 + 1, y0 + 1) * s(fx);
      out[y * w + x] += (a * (1 - s(fy)) + b * s(fy)) * amp;
    }
  }
  for (let i = 0; i < out.length; i++) out[i] /= 0.9375;
  return out;
}

// sangre e icor al golpear (receta "blood"): gotas en el mundo con la rampa de color de cada criatura
const BLOODLESS = new Set(['skeleton', 'wraith', 'malevolent', 'icewisp', 'ghost', 'lich', 'voidlord', 'eye', 'boss']);
function bloodHit(e, crit) {
  if (BLOODLESS.has(e.type) || (e.ghost)) return;
  const ramp = ['slime', 'rat', 'spider', 'queen', 'worm', 'deepwarrior', 'deepmage', 'cthulhu'].includes(e.type) ? AP.ichor : AP.blood;
  const n = crit ? 9 : 5;
  for (let i = 0; i < n; i++) {
    const c = ramp[1 + (i % 3)];
    burst(e.x, e.y, (e.def.h || 1) * rand(0.35, 0.7), 1, rgb(c[0], c[1], c[2]), rand(1.5, 3), rand(0.35, 0.6));
  }
}
