// Interfaz pixel art: marco ornamental con greca, panel inferior, HUD y menús
const SW = VW, SH = VH, VX = 0, VY = 0;
const BOX_MAP = { x: SW - 70, y: 6, w: 64, h: 64 };
const BOX_LOG = { x: (SW - 216) >> 1, y: SH - 40, w: 216, h: 34 };
const BOX_STAT = { x: 6, y: 6, w: 132, h: 34 };

const C = {
  gold: rgb(232, 184, 80), goldL: rgb(255, 230, 150), goldD: rgb(120, 78, 26), bronze: rgb(70, 44, 20),
  bg: rgb(36, 22, 12), dark: rgb(12, 7, 4), ink: rgb(232, 220, 196), dim: rgb(150, 136, 112),
  red: rgb(220, 60, 40), blue: rgb(90, 160, 255), cyan: rgb(120, 220, 255), green: rgb(120, 220, 110), orange: rgb(255, 150, 60),
};
const GOLD_GRAD = [rgb(255, 240, 170), rgb(255, 220, 120), rgb(240, 190, 80), rgb(220, 160, 60), rgb(190, 120, 40), rgb(160, 96, 30), rgb(120, 70, 20)];
const RED_GRAD = [rgb(255, 170, 140), rgb(255, 120, 90), rgb(230, 70, 50), rgb(200, 40, 30), rgb(170, 30, 20), rgb(130, 20, 14), rgb(90, 12, 8)];

class UI {
  constructor(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.img = this.ctx.createImageData(SW, SH);
    this.buf = new Uint32Array(this.img.data.buffer);
    this.mouse = { x: -1, y: -1 };
    this.hot = [];
  }

  // ---------- primitivas
  px(x, y, c) { if (x >= 0 && y >= 0 && x < SW && y < SH) this.buf[y * SW + x] = c; }
  rect(x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.px(i, j, c); }
  darken(x, y, w, h, k) {
    for (let j = Math.max(0, y); j < Math.min(SH, y + h); j++) for (let i = Math.max(0, x); i < Math.min(SW, x + w); i++) {
      const o = j * SW + i, c = this.buf[o];
      this.buf[o] = rgb((c & 255) * k, ((c >> 8) & 255) * k, ((c >> 16) & 255) * k);
    }
  }
  text(x, y, s, col, opt) { return drawText(this.buf, SW, SH, x, y, s, col, opt); }

  // Fondo oscuro translúcido (sin marco). hot = resalta con un filete fino
  panel(x, y, w, h, hot) {
    this.darken(x, y, w, h, hot ? 0.5 : 0.3);
    if (hot) { this.rect(x, y, w, 1, C.goldL); this.rect(x, y + h - 1, w, 1, C.goldL); this.rect(x, y, 1, h, C.goldL); this.rect(x + w - 1, y, 1, h, C.goldL); }
  }

  // ---------- composición por fotograma
  begin(view) {
    this.buf.set(view);
    this.hot = [];
  }
  end() { this.ctx.putImageData(this.img, 0, 0); }

  hit(x, y, w, h) { const m = this.mouse; return m.x >= x && m.y >= y && m.x < x + w && m.y < y + h; }

  hud(G) {
    const p = G.p, cx = VX + VW / 2;
    // ataque automático apuntando: aviso discreto bajo el centro
    if (G.autoT) this.text(cx, VY + VH / 2 + 10, 'AUTO', C.gold, { align: 'center', shadow: 'outline' });
    // cabecera
    this.text(cx - 6, VY + 5, levelName(G.z).toUpperCase(), C.ink, { align: 'right' });
    this.text(cx + 6, VY + 5, `BOTÍN ${G.loot}`, C.gold, { grad: GOLD_GRAD });
    if (!G.touchMode) this.text(cx, VY + 15, G.dg.name.toUpperCase(), C.dim, { align: 'center' });
    // llaves conseguidas
    G.keys.forEach((k, i) => { const kc = KEYS[k].col, x = cx - G.keys.length * 5 + i * 10, y = VY + 25; this.rect(x, y, 7, 3, rgb(kc[0], kc[1], kc[2])); this.rect(x + 2, y + 3, 1, 4, rgb(kc[0], kc[1], kc[2])); this.rect(x + 3, y + 5, 2, 1, rgb(kc[0], kc[1], kc[2])); });
    const elite = G.elite && !G.elite.dead && !G.elite.sleep && G.enemies.includes(G.elite) ? G.elite : null;
    if (elite && !(G.boss && !G.boss.dead && !G.boss.sleep && G.enemies.includes(G.boss))) {
      const w = 160, x = cx - w / 2, y = VY + 27;
      const eTxt = elite.ghost ? `${elite.def.name.toUpperCase()} · NV ${elite.ghost.lvlNow}` : eliteName(elite).toUpperCase(), eCol = elite.elite ? rgb(...ELITE_AFFIX[elite.elite].col) : C.cyan;
      this.text(cx, y, eTxt, eCol, { align: 'center' });
      this.rect(x, y + 9, w, 6, C.dark);
      const fw = Math.round((w - 4) * Math.max(0, elite.hp / elite.maxHp));
      for (let j = 0; j < 2; j++) this.rect(x + 2, y + 11 + j, fw, 1, [rgb(170, 240, 255), rgb(70, 160, 220)][j]);
    }
    if (G.boss && !G.boss.dead && !G.boss.sleep && G.enemies.includes(G.boss)) {
      const w = 180, x = cx - w / 2, y = VY + 27;
      this.text(cx, y, G.boss.def.name, C.red, { align: 'center', grad: RED_GRAD });
      this.rect(x, y + 9, w, 7, C.dark);
      const fw = Math.round((w - 4) * Math.max(0, G.boss.hp / G.boss.maxHp));
      for (let j = 0; j < 3; j++) this.rect(x + 2, y + 11 + j, fw, 1, [rgb(255, 110, 80), rgb(210, 40, 24), rgb(120, 16, 10)][j]);
    }
    // mirilla
    const mx = Math.round(cx), my = Math.round(VY + VH / 2);
    const cc = G.hitMark > 0 ? C.red : rgb(255, 236, 200);
    for (const [dx, dy] of [[-3, 0], [-2, 0], [2, 0], [3, 0], [0, -3], [0, -2], [0, 2], [0, 3]]) { this.px(mx + dx + 1, my + dy + 1, C.dark); }
    for (const [dx, dy] of [[-3, 0], [-2, 0], [2, 0], [3, 0], [0, -3], [0, -2], [0, 2], [0, 3]]) this.px(mx + dx, my + dy, cc);
    // avisos grandes
    let ty = VY + 58;
    if (G.state === 'play') for (const t of G.toasts) {
      if (t.big && textWidth(t.text, 2) <= VW - 24) { this.text(cx, ty, t.text, C.gold, { align: 'center', scale: 2, grad: GOLD_GRAD, shadow: 'outline' }); ty += 20; }
      else if (t.big) { this.text(cx, ty, t.text, C.goldL, { align: 'center', grad: GOLD_GRAD, shadow: 'outline' }); ty += 12; }
      else { this.text(cx, ty, t.text, C.ink, { align: 'center', shadow: 'outline' }); ty += 11; }
    }
    this.darken(BOX_MAP.x, BOX_MAP.y, BOX_MAP.w, BOX_MAP.h, 0.45);
    this.darken(BOX_LOG.x, BOX_LOG.y, BOX_LOG.w, BOX_LOG.h, 0.5);
    this.darken(BOX_STAT.x, BOX_STAT.y, BOX_STAT.w, BOX_STAT.h, 0.5);
    if (G.pact !== 'ciego') this.minimap(G);
    this.log(G); this.stats(G); this.skills(G);
    const pl = 'P' + G.z, pw = textWidth(pl) + 6, px0 = BOX_MAP.x - pw - 2, py0 = BOX_MAP.y + BOX_MAP.h - 13;
    this.darken(px0, py0, pw, 13, 0.45); this.text(px0 + 3, py0 + 3, pl, C.goldL, { shadow: false });
  }

  minimap(G) {
    const b = BOX_MAP, lv = G.lv, p = G.p;
    const cw = 2, nx = b.w / cw, ny = b.h / cw;
    const ox = Math.floor(p.x) - (nx >> 1), oy = Math.floor(p.y) - (ny >> 1);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const x = ox + i, y = oy + j;
      if (x < 0 || y < 0 || x >= MW || y >= MH || !G.seen[y * MW + x]) continue;
      const v = lv.cells[y * MW + x];
      let c;
      if (v === 0) c = (x + y) & 1 ? rgb(84, 74, 62) : rgb(76, 66, 56);
      else if (v === W_DOOR) c = rgb(190, 120, 50);
      else if (v >= W_LOCK && v < W_UP) { const k = KEYS[v - W_LOCK].col; c = rgb(k[0], k[1], k[2]); }
      else if (v === W_UP) c = rgb(130, 255, 255);
      else if (v === W_DOWN) c = rgb(210, 110, 255);
      else if (v === W_EXIT) c = rgb(110, 255, 110);
      else if (v === W_BARS) c = rgb(220, 60, 40);
      else if (lv.at(x - 1, y) === 0 || lv.at(x + 1, y) === 0 || lv.at(x, y - 1) === 0 || lv.at(x, y + 1) === 0) c = rgb(150, 110, 60); // las antorchas de pared no se marcan
      else continue;
      this.rect(b.x + i * cw, b.y + j * cw, cw, cw, c);
    }
    const dot = (wx, wy, c, s = 2) => {
      const i = Math.floor((wx - ox) * cw), j = Math.floor((wy - oy) * cw);
      if (i >= 0 && j >= 0 && i < b.w - s + 1 && j < b.h - s + 1) this.rect(b.x + i, b.y + j, s, s, c);
    };
    for (const e of G.enemies) if (Math.hypot(e.x - p.x, e.y - p.y) < 10 || e.def.boss) dot(e.x, e.y, e.def.boss && ((G.time * 4) | 0) & 1 ? rgb(255, 230, 60) : C.red, e.def.boss ? 3 : 2);
    for (const k of G.pickups) if (G.seen[Math.floor(k.y) * MW + Math.floor(k.x)] && (k.type === 'key' || (k.type === 'chest' && !k.open))) dot(k.x - 0.5, k.y - 0.5, k.type === 'key' ? C.cyan : C.gold, 2);
    for (const sh of lv.shrines) if (!sh.used && G.seen[Math.floor(sh.y) * MW + Math.floor(sh.x)]) dot(sh.x - 0.5, sh.y - 0.5, C.blue, 2);
    // jugador: flecha
    const pcx = b.x + (p.x - ox) * cw, pcy = b.y + (p.y - oy) * cw;
    for (let t = 0; t < 5; t++) this.px(Math.round(pcx + Math.cos(p.a) * t), Math.round(pcy + Math.sin(p.a) * t), t < 2 ? rgb(255, 255, 255) : C.goldL);
    this.rect(Math.round(pcx) - 1, Math.round(pcy) - 1, 2, 2, rgb(255, 255, 255));
  }

  log(G) {
    const b = BOX_LOG, n = Math.min(4, G.log.length);
    for (let i = 0; i < n; i++) {
      const m = G.log[G.log.length - n + i];
      const old = n - 1 - i;
      const col = old === 0 ? m.col : old === 1 ? lerpCol(m.col, rgb(8, 5, 4), 0.2) : lerpCol(m.col, rgb(8, 5, 4), 0.45);
      this.text(b.x + 4, b.y + 2 + i * 8, (m.cont ? '  ' : '* ') + m.text, col, { shadow: false });
    }
  }

  stats(G) {
    const b = BOX_STAT, p = G.p, x = b.x + 3, w = b.w - 6;
    this.text(x, b.y + 2, 'VIDA', C.ink, { shadow: false });
    this.text(b.x + b.w - 3, b.y + 2, `${Math.ceil(Math.max(0, p.hp))}`, p.hp < p.maxHp * 0.3 ? C.red : C.ink, { align: 'right', shadow: false });
    const hp = Math.round(w * clamp(p.hp / p.maxHp, 0, 1));
    this.rect(x, b.y + 10, w, 5, rgb(40, 8, 6));
    for (let j = 0; j < 5; j++) this.rect(x, b.y + 10 + j, hp, 1, [rgb(255, 140, 110), rgb(240, 70, 46), rgb(200, 36, 24), rgb(160, 24, 16), rgb(110, 14, 10)][j]);
    for (let i = 8; i < w; i += 9) this.rect(x + i, b.y + 10, 1, 5, rgb(20, 4, 2));
    this.text(x, b.y + 17, `NV ${p.lvl} ${CLASSES[p.cls].name.toUpperCase()}`, C.gold, { shadow: false });
    const xp = Math.round(w * clamp(p.xp / xpNeed(p.lvl), 0, 1));
    this.rect(x, b.y + 26, w, 3, rgb(10, 16, 40));
    for (let j = 0; j < 3; j++) this.rect(x, b.y + 26 + j, xp, 1, [rgb(150, 210, 255), rgb(70, 140, 250), rgb(30, 70, 170)][j]);
    const dsh = Math.round(w * (p.dashCd > 0 ? 1 - p.dashCd / p.dashMax : 1));
    this.rect(x, b.y + 31, w, 2, rgb(16, 30, 34));
    this.rect(x, b.y + 31, dsh, 2, p.dashCd > 0 ? rgb(60, 120, 140) : C.cyan);
    // arma equipada
    const W = WEAPONS[p.weapon], hk = W.hands, slots = CLASSES[p.cls].slots;
    let wn = W.name.toUpperCase(), on;
    if (p.weapon === 'staff') wn = 'BASTÓN DE ' + SPELLS[p.spell].name.toUpperCase();
    if (p.form !== 'human') wn = p.form === 'wolf' ? 'FORMA DE LOBO' : 'FORMA DE OSO';
    if (p.weapon === 'bow' && p.element) wn = 'ARCO DE ' + ELEMENT_NAME[p.element];
    if (hk === 1) on = p.off === 'shield' ? 'ESCUDO' : p.off === 'torch' ? `ANTORCHA ${fmtTime(p.torchFuel)}` : `SIN ANTORCHA (I)`; else on = hk === 2 ? 'AMBAS MANOS' : hk === 'dual' ? 'DOS ARMAS' : hk === 'bow' ? 'ARCO A DOS MANOS' : 'ZARPAS';
    this.darken(b.x, b.y + b.h + 3, b.w, 24, 0.5);
    this.text(b.x + 3, b.y + b.h + 6, wn, C.goldL, { shadow: false });
    this.text(b.x + b.w - 3, b.y + b.h + 6, `@${G.kills}`, C.dim, { align: 'right', shadow: false });
    this.text(b.x + 3, b.y + b.h + 16, on, hk === 1 ? (p.off === 'shield' ? C.cyan : p.off === 'torch' ? (p.torchFuel < 30 && ((G.time * 3) | 0) & 1 ? C.red : C.orange) : C.dim) : C.dim, { shadow: false });
    if (slots.length > 1) this.text(b.x + b.w - 3, b.y + b.h + 16, `1-${slots.length}`, C.dim, { align: 'right', shadow: false });
  }

  // ---------- pantallas
  title(G) {
    this.darken(VX, VY, VW, VH, 0.55);
    const cx = VX + VW / 2;
    this.text(cx, 30, 'HEXCRYPT', C.gold, { align: 'center', scale: 5, grad: GOLD_GRAD, shadow: 'outline' });
    this.text(cx, 76, 'ENTRA. SAQUEA. SAL CON VIDA.', C.dim, { align: 'center' });
    const px = cx - 120, py = 80;
    this.panel(px, py, 240, 127);
    const rows = G.padMode ? [['STICK IZQ. · DER.', 'MOVERSE · GIRAR'], ['RT · LT', 'ATACAR · BLOQUEAR'], ['A', 'ESQUIVAR'], ['X  Y  B', 'HABILIDADES R C V'], ['LB · RB', 'ESCUDO · CAMBIAR ARMA'], ['CRUCETA ARRIBA', 'BEBER POCIÓN'], ['CRUCETA ABAJO', 'MAPA'], ['CRUCETA IZQ. · DER.', 'DIARIO · INVENTARIO'], ['START', 'PAUSA'], ['MENÚS', 'CRUCETA + A / B']] : G.touchMode ? [['DEDO IZQUIERDO', 'JOYSTICK: MOVERSE'], ['DESLIZAR A LA DER.', 'GIRAR'], ['ATACAR', 'MANTENER PULSADO'], ['R  C  V', 'HABILIDADES'], ['>>', 'ESQUIVAR'], ['II  J  I', 'PAUSA · DIARIO · INVENTARIO'], ['<>', 'CAMBIAR DE ARMA'], ['ESC', 'BLOQUEAR CON ESCUDO'], ['PAREDES', 'CAMINA CONTRA ELLAS'], ['EN LOS MENÚS', 'TOCA PARA ELEGIR']] : [['WASD', 'MOVERSE'], ['RATÓN / Q E', 'GIRAR'], ['CLIC / ESPACIO', 'ATACAR'], ['R  C  V', 'HABILIDADES DE CLASE'], ['1 2 3 / RUEDA', 'CAMBIAR DE ARMA'], ['F', 'ALZAR / BAJAR ESCUDO'], ['CLIC DER.', 'BLOQUEAR (ESCUDO)'], ['SHIFT', 'ESQUIVAR'], ['I · J · M', 'INVENTARIO · DIARIO · MAPA'], ['P  ·  N', 'PAUSA · SONIDO']];
    rows.forEach(([k, v], i) => { this.text(px + 10, py + 9 + i * 11, k, C.gold); this.text(px + 230, py + 9 + i * 11, v, C.ink, { align: 'right' }); });
    if (G.hasSave) { // continuar la partida guardada o empezar otra
      [['continue', 'CONTINUAR'], ['new', 'NUEVA PARTIDA']].forEach(([id, t], i) => {
        const bw = 104, bx = cx - bw - 4 + i * (bw + 8), by = 208, hot = this.hit(bx, by, bw, 16);
        this.hot.push({ x: bx, y: by, w: bw, h: 16, id });
        this.panel(bx, by, bw, 16, hot || (i === 0 && ((G.time * 2) | 0) & 1)); this.text(bx + bw / 2, by + 5, t, hot ? C.goldL : C.gold, { align: 'center' });
      });
    } else if (((G.time * 2) | 0) & 1) this.text(cx, 214, G.padMode ? 'PULSA A PARA ENTRAR' : G.touchMode ? 'TOCA PARA ENTRAR' : 'HAZ CLIC PARA ENTRAR', C.goldL, { align: 'center', shadow: 'outline' });
    const ox = VW - 86, oy = VH - 22, oh = this.hit(ox, oy, 80, 16);
    this.hot.push({ x: ox, y: oy, w: 80, h: 16, id: 'options' });
    this.panel(ox, oy, 80, 16, oh); this.text(ox + 40, oy + 5, 'OPCIONES (O)', oh ? C.goldL : C.gold, { align: 'center' });
    this.text(BOX_LOG.x + 4, BOX_LOG.y + 2, '* BIENVENIDO, VIAJERO.', C.ink, { shadow: false });
    this.text(BOX_LOG.x + 4, BOX_LOG.y + 10, '* LA CRIPTA TE ESPERA BAJO TUS PIES.', C.dim, { shadow: false });
    const m = G.meta;
    const ver = document.querySelector('meta[name=version]');
    if (ver) this.text(30, VH - 9, 'V ' + ver.content.toUpperCase(), rgb(90, 76, 60), { shadow: false });
    if (m && (m.escapes || m.deaths)) this.text(cx, 224, `ORO A SALVO ${m.gold} · FUGAS ${m.escapes} · MAYOR BOTÍN ${m.bestLoot}`, C.dim, { align: 'center' });
  }

  pause(G) {
    this.darken(VX, VY, VW, VH, 0.45);
    const cx = VX + VW / 2;
    this.text(cx, 22, 'PAUSA', C.gold, { align: 'center', scale: 3, grad: GOLD_GRAD, shadow: 'outline' });
    const ups = UPG.filter(u => L(u.id) > 0);
    const h = 20 + Math.max(1, ups.length) * 10;
    this.panel(cx - 200, 50, 196, h);
    this.text(cx - 105, 60, 'MEJORAS', C.dim, { align: 'center' });
    if (!ups.length) this.text(cx - 105, 74, 'SIN MEJORAS AÚN', C.dim, { align: 'center' });
    ups.forEach((u, i) => { this.text(cx - 192, 74 + i * 10, u.name, u.passive ? C.orange : C.ink); this.text(cx - 18, 74 + i * 10, `NV ${L(u.id)}`, C.gold, { align: 'right' }); });
    const oh = this.optionsPanel(G, cx + 6, 50);
    this.text(cx, 50 + Math.max(h, oh) + 8, G.touchMode ? 'TOCA FUERA PARA CONTINUAR' : 'HAZ CLIC FUERA O PULSA P PARA CONTINUAR', C.goldL, { align: 'center', shadow: 'outline' });
  }

  // Opciones (se guardan en el navegador): sensibilidad, volumen, sonido, límite de FPS y filtro CRT
  optionsPanel(G, x, y) {
    const o = G.cfg, w = 196, rh = 12;
    const rows = [
      ['arrows', 'SENSIBILIDAD', o.sens.toFixed(1), 'sens'],
      ['toggle', 'ATAQUE AUTOMÁTICO', o.autoAtk ? 'SÍ' : 'NO', 'autoatk'],
      ['arrows', 'VOLUMEN', `${Math.round(o.vol * 100)}%`, 'vol'],
      ['toggle', 'SONIDO', o.muted ? 'NO' : 'SÍ', 'mute'],
      ['toggle', 'MÚSICA', o.music === false ? 'NO' : 'SÍ', 'music'],
      ['toggle', 'FOTOGRAMAS', `${o.fps} FPS`, 'fps'],
      ['toggle', 'CALIDAD', o.fast ? 'RÁPIDA' : 'ALTA', 'quality'],
      ['toggle', 'FILTRO CRT', o.crt ? 'SÍ' : 'NO', 'crt'],
      ['toggle', 'EFECTOS DE AMBIENTE', o.ambient === false ? 'NO' : 'SÍ', 'ambient'],
      ['toggle', 'SACUDIDAS', o.noShake ? 'NO' : 'SÍ', 'shake'],
      ['toggle', 'DESTELLOS', o.noFlash ? 'NO' : 'SÍ', 'flash'],
      ['toggle', 'VIBRACIÓN DEL MANDO', o.noRumble ? 'NO' : 'SÍ', 'rumble'],
      ['toggle', 'BOTONES TÁCTILES', o.bigTouch ? 'GRANDES' : 'NORMALES', 'bigtouch'],
      ['toggle', 'CONTROLES', '>', 'controls'],
    ];
    if (G.installEvt) rows.push(['toggle', 'INSTALAR COMO APP', '>', 'install']); // solo si el navegador lo ofrece
    if (typeof LANGS !== 'undefined') rows.splice(4, 0, ['toggle', 'IDIOMA', o.lang === 'en' ? 'ENGLISH' : 'ESPAÑOL', 'lang']);
    this.panel(x, y, w, rows.length * rh + 20);
    this.text(x + w / 2, y + 4, 'OPCIONES', C.dim, { align: 'center' });
    rows.forEach(([kind, label, val, id], i) => {
      const yy = y + 18 + i * rh;
      this.text(x + 8, yy, label, C.ink);
      if (kind === 'arrows') {
        for (const [hid, bx, t] of [[id + '-', x + w - 70, '<'], [id + '+', x + w - 18, '>']]) {
          const hot = this.hit(bx - 3, yy - 3, 13, rh); this.hot.push({ x: bx - 3, y: yy - 3, w: 13, h: rh, id: hid });
          this.text(bx, yy, t, hot ? C.goldL : C.gold);
        }
        this.text(x + w - 39, yy, val, C.goldL, { align: 'center' });
      } else {
        const hot = this.hit(x + 4, yy - 2, w - 8, rh); this.hot.push({ x: x + 4, y: yy - 2, w: w - 8, h: rh, id });
        this.text(x + w - 39, yy, val, hot ? C.goldL : C.gold, { align: 'center' });
      }
    });
    return rows.length * rh + 20;
  }
  // Reasignar controles: columna de teclado y columna de mando; al elegir una casilla se espera la tecla o el botón
  controls(G) {
    this.darken(VX, VY, VW, VH, 0.55);
    const cx = VX + VW / 2, x = cx - 170, w = 340, y = 26, rh = 11, kb = bindKeys(), pb = bindPad();
    this.text(cx, 6, 'CONTROLES', C.gold, { align: 'center', scale: 2, grad: GOLD_GRAD, shadow: 'outline' });
    this.panel(x, y, w, ACTIONS.length * rh + 18);
    this.text(x + 8, y + 4, 'ACCIÓN', C.dim); this.text(x + 200, y + 4, 'TECLADO', C.dim, { align: 'center' }); this.text(x + 290, y + 4, 'MANDO', C.dim, { align: 'center' });
    ACTIONS.forEach((a, i) => {
      const yy = y + 16 + i * rh;
      this.text(x + 8, yy, ACTION_NAME[a.id].toUpperCase(), C.ink, { shadow: false });
      for (const [dev, cxx, val, ok] of [['key', x + 200, keyLabel(kb[a.id]), a.key !== null], ['pad', x + 290, padLabel(pb[a.id]), a.pad !== null]]) {
        const waiting = G.rebind && G.rebind.dev === dev && G.rebind.id === a.id;
        if (!ok) { this.text(cxx, yy, '-', C.dim, { align: 'center', shadow: false }); continue; }
        const bx = cxx - 42, hot = this.hit(bx, yy - 2, 84, rh);
        this.hot.push({ x: bx, y: yy - 2, w: 84, h: rh, id: dev + ':' + a.id });
        if (hot || waiting) this.darken(bx, yy - 2, 84, rh, 0.5);
        this.text(cxx, yy, waiting ? (((G.time * 3) | 0) & 1 ? (dev === 'key' ? 'PULSA UNA TECLA' : 'PULSA UN BOTÓN') : '') : val, waiting ? C.cyan : hot ? C.goldL : C.gold, { align: 'center', shadow: false });
      }
    });
    const by = y + ACTIONS.length * rh + 24;
    [['reset', 'RESTABLECER'], ['back', 'VOLVER']].forEach(([id, t], i) => {
      const bw = 100, bx = cx - bw - 4 + i * (bw + 8), hot = this.hit(bx, by, bw, 14);
      this.hot.push({ x: bx, y: by, w: bw, h: 14, id });
      this.panel(bx, by, bw, 14, hot); this.text(bx + bw / 2, by + 4, t, hot ? C.goldL : C.gold, { align: 'center' });
    });
    this.text(cx, by + 20, 'MOVERSE CON LAS FLECHAS Y LOS STICKS SIEMPRE FUNCIONA · ESC CANCELA', C.dim, { align: 'center', shadow: false });
  }
  options(G) {
    this.darken(VX, VY, VW, VH, 0.5);
    const cx = VX + VW / 2;
    this.text(cx, 14, 'OPCIONES', C.gold, { align: 'center', scale: 3, grad: GOLD_GRAD, shadow: 'outline' });
    this.optionsPanel(G, cx - 98, 52);
    this.text(cx, 254, 'HAZ CLIC FUERA O PULSA O PARA VOLVER', C.goldL, { align: 'center', shadow: 'outline' });
  }

  // Inventario: consumibles a la izquierda; equipo (anillo, amuleto, armadura) y mochila a la derecha
  inventory(G) {
    this.darken(VX, VY, VW, VH, 0.5);
    const p = G.p, cx = VX + VW / 2, inv = G.inv;
    this.text(cx, 6, 'INVENTARIO', C.gold, { align: 'center', scale: 2, grad: GOLD_GRAD, shadow: 'outline' });
    // ---- consumibles
    const lx = 8, lw = 222, y0 = 26;
    this.panel(lx, y0, lw, 216);
    const one = WEAPONS[p.weapon].hands === 1, off = offhandOf(p);
    this.text(lx + 6, y0 + 5, `MANO IZQ.: ${off === 'torch' ? `ANTORCHA ${fmtTime(p.torchFuel)}` : off === 'shield' ? 'ESCUDO' : one ? 'VACÍA' : 'DOS MANOS'}`, off === 'torch' ? C.orange : C.ink);
    const rows = [];
    const tLabel = off === 'torch' ? 'GUARDAR' : p.torchFuel > 0 ? 'EMPUÑAR' : 'ENCENDER';
    rows.push({ id: 'torch', spr: SPR.torchItem, label: `ANTORCHAS x${inv.torch}${p.torchFuel > 0 && off !== 'torch' ? ' (+1)' : ''}`, sub: one ? `${tLabel} · ${TORCH_FUEL / 60} MIN` : 'ARMA DE UNA MANO', on: one && (inv.torch > 0 || p.torchFuel > 0) });
    if (inv.potion) rows.push({ id: 'potion', spr: SPR.potion, label: `POCIONES x${inv.potion}`, sub: 'BEBER: MITAD DE LA VIDA', on: true });
    if (inv.map) rows.push({ id: 'map', label: `PERGAMINOS x${inv.map}`, sub: 'LEER: REVELA EL NIVEL', on: true });
    if (inv.rune) rows.push({ id: 'rune', label: `RUNAS x${inv.rune}`, sub: 'USAR: VOLVER A LA SALIDA', on: true });
    rows.push({ id: 'shield', label: 'ESCUDO', sub: one ? (off === 'shield' ? 'BAJAR' : 'ALZAR') : 'ARMA DE UNA MANO', on: one });
    rows.push({ id: null, spr: G.keys.length ? SPR.keys[G.keys[0]] : null, label: `LLAVES ${G.keys.length}/${G.dg.lockRooms.length}`, sub: G.keys.length ? G.keys.map(k => KEYS[k].name.split(' ').pop()).join(', ').toUpperCase() : 'NINGUNA', on: true });
    rows.push({ id: null, spr: SPR.coins, label: `BOTÍN ${G.loot}`, sub: `A SALVO: ${G.bank}`, on: true });
    const rh = Math.min(26, Math.floor(194 / rows.length));
    rows.forEach((r, i) => {
      const sx = lx + 5, sy = y0 + 18 + i * rh, sw = lw - 10, sh = rh - 3, hot = r.id && r.on && this.hit(sx, sy, sw, sh);
      if (r.id) this.hot.push({ x: sx, y: sy, w: sw, h: sh, id: r.id });
      this.panel(sx, sy, sw, sh, hot);
      if (r.spr) this.blit(r.spr, sx + 11, sy + (sh >> 1), sh - 6);
      this.text(sx + 24, sy + 3, r.label, r.on ? C.goldL : C.dim);
      if (sh > 16) this.text(sx + 24, sy + 12, r.sub.slice(0, 31), C.dim, { shadow: false });
    });
    // ---- equipo (sin mochila: lo que no llevas puesto no existe)
    const rx = 238, rw = 234;
    this.panel(rx, y0, rw, 216);
    this.text(rx + 6, y0 + 5, 'EQUIPO', C.dim);
    let tip = null;
    SLOTS.forEach((s, i) => {
      const it = G.equip[s], on = itemActive(s, it), sx = rx + 5, sy = y0 + 16 + i * 28, sw = rw - 10, sh = 26, hot = it && this.hit(sx, sy, sw, sh);
      if (it) this.hot.push({ x: sx, y: sy, w: sw, h: sh, id: 'info' });
      this.panel(sx, sy, sw, sh, hot);
      this.rect(sx + 3, sy + 3, 20, 20, rgb(24, 16, 10));
      if (it) { this.blit(itemIcon(it), sx + 13, sy + 13, 16); if (hot) tip = it; }
      this.text(sx + 28, sy + 4, it ? itemName(it).toUpperCase().slice(0, 33) : `${SLOT_LABEL[s].toUpperCase()}: VACÍO`, it ? (on ? itemCol(it) : C.dim) : C.dim);
      const sub = !it ? '-' : !on ? (s === 'arma' ? `NO LA LLEVAS EN LA MANO (${WT_NAME[it.wtype].toUpperCase()})` : 'SOLO CON EL ESCUDO EN LA MANO') : itemLines(it)[0].toUpperCase();
      this.text(sx + 28, sy + 14, String(tr(sub)).slice(0, 33), C.dim, { shadow: false });
    });
    if (tip && tip.legend && LEGEND[tip.legend].set) this.setPanel(LEGEND[tip.legend].set, 8, 150, 222);
    if (tip) {
      const ls = itemLines(tip).join(' · ').toUpperCase();
      this.text(rx + 6, y0 + 186, `${itemName(tip).toUpperCase().slice(0, 25)} · ${RARITY[tip.rar].name.toUpperCase()}`, itemCol(tip), { shadow: false });
      wrapText(ls, 37).slice(0, 2).forEach((l, k) => this.text(rx + 6, y0 + 196 + k * 9, l, C.ink, { shadow: false }));
    } else this.text(rx + 6, y0 + 196, 'LO QUE ENCUENTRAS SE EQUIPA AL MOMENTO', C.dim, { shadow: false });
    this.text(cx, VH - 10, G.touchMode ? 'TOCA FUERA PARA CERRAR' : G.padMode ? 'B PARA CERRAR' : 'I PARA CERRAR · H BEBER POCIÓN', C.goldL, { align: 'center', shadow: 'outline' });
  }
  // bonificaciones de un set (2, 4 y 5 piezas); las conseguidas, resaltadas
  setPanel(set, x, y, w) {
    const S = SETS[set], n = setCount(set);
    this.panel(x, y, w, 92); this.darken(x, y, w, 92, 0.6);
    this.text(x + 6, y + 5, `${S.name.toUpperCase()} (${n}/5)`, C.gold, { shadow: false });
    let yy = y + 17;
    for (const k of [2, 4, 5]) {
      const on = n >= k;
      wrapText(`${k}: ${S.bonus[k]}`.toUpperCase(), Math.floor((w - 12) / 6)).slice(0, 3).forEach(l => { this.text(x + 6, yy, l, on ? C.goldL : C.dim, { shadow: false }); yy += 8; });
      yy += 3;
    }
  }
  // Cambio de objeto: el encontrado frente a los que llevas en ese hueco; el que no se queda se deja en el suelo
  swap(G) {
    const S = G.swap; if (!S) return;
    this.darken(VX, VY, VW, VH, 0.35);
    const cx = VX + VW / 2, it = S.item;
    this.text(cx, 8, '¿CAMBIAR DE EQUIPO?', C.gold, { align: 'center', scale: 2, grad: GOLD_GRAD, shadow: 'outline' });
    const card = (x, y, w, title, o, tcol) => {
      this.panel(x, y, w, 70);
      this.text(x + 6, y + 5, title, tcol || C.dim);
      this.rect(x + 6, y + 16, 22, 22, rgb(24, 16, 10)); this.blit(itemIcon(o), x + 17, y + 27, 18);
      wrapText(itemName(o).toUpperCase(), Math.floor((w - 40) / 6)).slice(0, 2).forEach((l, k) => this.text(x + 34, y + 16 + k * 9, l, itemCol(o)));
      this.text(x + 34, y + 35, RARITY[o.rar].name.toUpperCase(), itemCol(o), { shadow: false });
      wrapText(itemLines(o).join(' · ').toUpperCase(), Math.floor((w - 12) / 6)).slice(0, 3).forEach((l, k) => this.text(x + 6, y + 46 + k * 8, l, C.ink, { shadow: false }));
    };
    card(cx - 230, 36, 220, 'HAS ENCONTRADO', it, C.goldL);
    if (it.legend && LEGEND[it.legend].set) this.setPanel(LEGEND[it.legend].set, cx - 230, 110, 220);
    S.slots.forEach((s, i) => { const o = G.equip[s]; if (o) card(cx + 10, 36 + i * 76, 220, `LLEVAS (${SLOT_LABEL[s].toUpperCase()})`, o); });
    const opts = S.slots.map((s, i) => [s, S.slots.length > 1 ? `CAMBIAR POR EL ${SLOT_LABEL[s].toUpperCase()}` : 'EQUIPAR EL NUEVO']).concat([['discard', 'QUEDARME CON LO QUE LLEVO']]);
    const by = 36 + Math.max(1, S.slots.length) * 76 + 8;
    opts.forEach(([id, t], i) => {
      const w = 260, x = cx - w / 2, yy = by + i * 20, hot = this.hit(x, yy, w, 16);
      this.hot.push({ x, y: yy, w, h: 16, id });
      this.panel(x, yy, w, 16, hot);
      this.text(x + 6, yy + 5, `[${i + 1}]`, C.dim);
      this.text(cx + 10, yy + 5, t, hot ? C.goldL : C.gold, { align: 'center' });
    });
    this.text(cx, by + opts.length * 20 + 4, 'LO QUE NO TE QUEDES SE QUEDA EN EL SUELO', C.red, { align: 'center', shadow: false });
  }
  // Mercader: lista de útiles con precio (se paga con el botín que llevas encima)
  shop(G) {
    this.darken(VX, VY, VW, VH, 0.5);
    const cx = VX + VW / 2, x = cx - 150, w = 300, y = 46;
    this.text(cx, 12, 'EL MERCADER', C.gold, { align: 'center', scale: 2, grad: GOLD_GRAD, shadow: 'outline' });
    this.text(cx, 32, 'LA OSCURIDAD ES BUEN NEGOCIO, VIAJERO.', C.dim, { align: 'center' });
    this.panel(x, y, w, 170);
    this.text(x + w - 8, y + 6, `TU ORO: ${G.loot}`, C.gold, { align: 'right' });
    SHOP_ITEMS.forEach((it, i) => {
      const sx = x + 8, sy = y + 18 + i * 34, sw = w - 16, sh = 30, cost = shopPrice(it), ok = G.loot >= cost, hot = this.hit(sx, sy, sw, sh);
      this.hot.push({ x: sx, y: sy, w: sw, h: sh, id: it.id });
      this.panel(sx, sy, sw, sh, hot && ok);
      const spr = it.id === 'torch' ? SPR.torchItem : it.id === 'potion' ? SPR.potion : null;
      if (spr) this.blit(spr, sx + 14, sy + 15, 22);
      this.text(sx + 30, sy + 5, `[${i + 1}] ${it.name.toUpperCase()}`, ok ? C.goldL : C.dim);
      this.text(sx + 30, sy + 17, String(tr(`${it.desc.toUpperCase()} · TIENES ${G.inv[it.id] || 0}`)).slice(0, 34), C.dim, { shadow: false });
      this.text(sx + sw - 8, sy + 11, `${cost} ORO`, ok ? C.gold : C.red, { align: 'right' });
    });
    this.text(cx, y + 158, G.touchMode ? 'TOCA FUERA PARA SALIR' : 'ESC PARA SALIR', C.goldL, { align: 'center', shadow: 'outline' });
  }
  // Herrero: tres mejoras a elegir; la primera es gratis y cada una cuesta más que la anterior
  forge(G) {
    this.darken(VX, VY, VW, VH, 0.5);
    const cx = VX + VW / 2, cost = forgePrice(), ok = G.loot >= cost;
    this.text(cx, 12, 'EL HERRERO', C.gold, { align: 'center', scale: 2, grad: GOLD_GRAD, shadow: 'outline' });
    this.text(cx, 32, cost === 0 ? 'LA PRIMERA TE LA REGALO. LAS DEMÁS SE PAGAN.' : `ESTA TE COSTARÁ ${cost} DE ORO · TIENES ${G.loot}`, cost === 0 ? C.green : ok ? C.dim : C.red, { align: 'center' });
    const opts = G.forgeOpts || [], cw = 136, gap = 10, n = opts.length, x0 = Math.round(cx - (n * cw + (n - 1) * gap) / 2), y = 48, ch = 130;
    if (!n) this.text(cx, 110, 'TU ARMA YA NO ADMITE MÁS MEJORAS', C.dim, { align: 'center' });
    opts.forEach((f, i) => {
      const x = x0 + i * (cw + gap), hot = this.hit(x, y, cw, ch), l = FL(f.id) + 1;
      this.hot.push({ x, y, w: cw, h: ch, id: i });
      this.panel(x, y, cw, ch, hot && ok);
      this.text(x + 6, y + 6, `[${i + 1}]`, C.dim);
      this.text(x + cw - 6, y + 6, `NV ${l}/3`, C.orange, { align: 'right' });
      wrapText(f.name.toUpperCase(), 20).forEach((t, k) => this.text(x + cw / 2, y + 22 + k * 10, t, ok ? C.gold : C.dim, { align: 'center', grad: ok ? GOLD_GRAD : null }));
      wrapText(f.desc(l).toUpperCase(), 21).forEach((t, k) => this.text(x + cw / 2, y + 48 + k * 9, t, C.ink, { align: 'center', shadow: false }));
      this.text(x + cw / 2, y + ch - 14, cost ? `${cost} ORO` : 'GRATIS', cost === 0 ? C.green : ok ? C.gold : C.red, { align: 'center' });
    });
    const fx = Object.keys(G.forge || {}).filter(k => G.forge[k]);
    this.text(cx, y + ch + 10, fx.length ? ('TU ARMA: ' + fx.map(k => `${FORGE.find(f => f.id === k).name} ${G.forge[k]}`).join(' · ')).toUpperCase().slice(0, 76) : 'TU ARMA AÚN NO TIENE MEJORAS', C.dim, { align: 'center' });
    this.text(cx, y + ch + 30, G.touchMode ? 'TOCA FUERA PARA SALIR' : 'ESC PARA SALIR', C.goldL, { align: 'center', shadow: 'outline' });
  }
  // Mapa completo de un nivel (lo explorado), ampliado para que quepa; A/D cambian entre niveles visitados
  mapScreen(G) {
    this.darken(VX, VY, VW, VH, 0.2);
    const z = G.mapZ, lv = G.dg.lv(z), seen = lv.seen, p = G.p, cur = z === G.z;
    // fondo de pergamino oscuro
    for (let y = 0; y < VH; y++) for (let x = 0; x < VW; x++) { const k = 0.28 + (hash2(x >> 1, y >> 1, 5) - 0.5) * 0.04; this.buf[y * SW + x] = rgb(70 * k + 10, 54 * k + 8, 40 * k + 6); }
    let x0 = MW, y0 = MH, x1 = 0, y1 = 0;
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (seen[y * MW + x]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    if (x1 < x0) { x0 = 0; y0 = 0; x1 = MW - 1; y1 = MH - 1; }
    x0 -= 1; y0 -= 1; x1 += 1; y1 += 1;
    const aw = 330, ah = 226, cs = clamp(Math.min(Math.floor(aw / (x1 - x0 + 1)), Math.floor(ah / (y1 - y0 + 1))), 2, 7);
    const ox = 12 + Math.floor((aw - (x1 - x0 + 1) * cs) / 2) - x0 * cs, oy = 32 + Math.floor((ah - (y1 - y0 + 1) * cs) / 2) - y0 * cs;
    const cell = (x, y, c, inset = 0) => this.rect(ox + x * cs + inset, oy + y * cs + inset, cs - inset * 2, cs - inset * 2, c);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (x < 0 || y < 0 || x >= MW || y >= MH || !seen[y * MW + x]) continue;
      const i = y * MW + x, v = lv.cells[i];
      if (v === 0) cell(x, y, lv.roomOf[i] >= 0 ? ((x + y) & 1 ? rgb(150, 124, 92) : rgb(142, 116, 86)) : rgb(110, 90, 68));
      else if (v === W_DOOR) cell(x, y, rgb(200, 128, 52));
      else if (v >= W_LOCK && v < W_UP) { const k = KEYS[v - W_LOCK].col; cell(x, y, rgb(k[0], k[1], k[2])); }
      else if (v === W_UP) cell(x, y, rgb(130, 255, 255));
      else if (v === W_DOWN) cell(x, y, rgb(210, 110, 255));
      else if (v === W_EXIT) cell(x, y, rgb(110, 255, 110));
      else if (v === W_BARS) cell(x, y, rgb(220, 60, 40));
      else if (lv.at(x - 1, y) === 0 || lv.at(x + 1, y) === 0 || lv.at(x, y - 1) === 0 || lv.at(x, y + 1) === 0) cell(x, y, rgb(52, 38, 28)); // las antorchas de pared no se marcan
    }
    const mark = (wx, wy, c, s) => { const sx = Math.round(ox + wx * cs - s / 2), sy = Math.round(oy + wy * cs - s / 2); this.rect(sx - 1, sy - 1, s + 2, s + 2, C.dark); this.rect(sx, sy, s, s, c); };
    const isSeen = (x, y) => seen[Math.floor(y) * MW + Math.floor(x)];
    const pk = cur ? G.pickups : lv.state.pickups;
    for (const k of pk) if (isSeen(k.x, k.y)) { if (k.type === 'chest' && !k.open) mark(k.x, k.y, C.gold, Math.max(3, cs - 1)); else if (k.type === 'key') mark(k.x, k.y, C.cyan, Math.max(3, cs - 1)); }
    for (const sh of lv.shrines) if (!sh.used && isSeen(sh.x, sh.y)) mark(sh.x, sh.y, C.blue, Math.max(3, cs - 1));
    for (const n of lv.npcs) if (isSeen(n.x, n.y)) { const nc = n.type === 'merchant' ? C.green : n.type === 'mentor' ? rgb(255, 120, 200) : C.orange; mark(n.x, n.y, nc, Math.max(4, cs)); this.text(Math.round(ox + n.x * cs) + 4, Math.round(oy + n.y * cs) - 3, n.type === 'merchant' ? 'M' : n.type === 'mentor' ? 'MT' : 'H', nc); }
    if (cur) { // jugador: punto y flecha
      const pcx = ox + p.x * cs, pcy = oy + p.y * cs;
      for (let t = 0; t < 7; t++) this.px(Math.round(pcx + Math.cos(p.a) * t), Math.round(pcy + Math.sin(p.a) * t), t < 3 ? rgb(255, 255, 255) : C.goldL);
      this.rect(Math.round(pcx) - 2, Math.round(pcy) - 2, 4, 4, rgb(255, 255, 255));
    }
    // cabecera y leyenda
    this.text(12, 8, `MAPA · ${levelName(z).toUpperCase()}`, C.gold, { scale: 2, grad: GOLD_GRAD, shadow: 'outline' });
    const lx = VW - 128;
    this.text(lx, 10, G.dg.name.toUpperCase().slice(0, 21), C.dim, { shadow: false });
    const leg = [[rgb(110, 255, 110), 'SALIDA'], [rgb(130, 255, 255), 'ESCALERA ARRIBA'], [rgb(210, 110, 255), 'ESCALERA ABAJO'], [rgb(200, 128, 52), 'PUERTA'], [rgb(244, 226, 172), 'CERRADURA'], [C.gold, 'COFRE'], [C.cyan, 'LLAVE'], [C.blue, 'ALTAR'], [C.green, 'M MERCADER'], [C.orange, 'H HERRERO'], [rgb(255, 120, 200), 'MT MENTOR']];
    leg.forEach(([c, t], i) => { this.rect(lx, 30 + i * 12, 6, 6, c); this.text(lx + 10, 30 + i * 12, t, C.ink, { shadow: false }); });
    const vis = G.dg.zs.filter(q => G.dg.lv(q).visited);
    this.text(lx, 30 + leg.length * 12 + 8, 'NIVELES:', C.dim, { shadow: false });
    vis.forEach((q, i) => this.text(lx + 50 + i * 20, 30 + leg.length * 12 + 8, 'P' + q, q === z ? C.goldL : q === G.z ? C.gold : C.dim, { shadow: false }));
    this.text(lx, VH - 30, G.touchMode ? 'TOCA LOS LADOS: OTRO NIVEL' : 'A / D: OTRO NIVEL', C.dim, { shadow: false });
    this.text(lx, VH - 18, G.touchMode ? 'TOCA EL CENTRO: CERRAR' : 'M: CERRAR', C.goldL, { shadow: false });
  }
  // sprite escalado para iconos (vecino más próximo, encajado en caja de lado s)
  blit(spr, cx, cy, s) {
    const k = s / Math.max(spr.w, spr.h), w = Math.round(spr.w * k), h = Math.round(spr.h * k);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const c = spr.px[Math.floor(j / k) * spr.w + Math.floor(i / k)];
      if (c >>> 24) this.px(cx - (w >> 1) + i, cy - (h >> 1) + j, c | 0xFF000000);
    }
  }

  // Habilidades activas (R, C, V) y mejoras temporales
  skills(G) {
    const p = G.p, y0 = BOX_STAT.y + BOX_STAT.h + 30, x = BOX_STAT.x, w = BOX_STAT.w;
    this.darken(x, y0, w, p.active.length * 12 + 4, 0.5);
    p.active.forEach((id, i) => {
      const sk = id && SKILLS[id], y = y0 + 3 + i * 12, cd = Math.max(0, p.skillCd[i]), rdy = cd <= 0;
      this.text(x + 3, y, SKILL_LABEL[i], sk && rdy ? C.goldL : C.dim, { shadow: false });
      this.text(x + 15, y, sk ? sk.name.toUpperCase().slice(0, Math.floor((w - 18) / 6)) : '-', sk && rdy ? C.ink : C.dim, { shadow: false });
      if (!sk) return;
      if (!rdy) { const fw = Math.round((w - 6) * (1 - cd / p.skillMax[i])); this.rect(x + 3, y + 8, w - 6, 1, rgb(40, 30, 20)); this.rect(x + 3, y + 8, fw, 1, C.gold); }
      else this.rect(x + 3, y + 8, w - 6, 1, rgb(70, 52, 20));
    });
    // estados activos bajo el minimapa
    let by = BOX_MAP.y + BOX_MAP.h + 6, n = 0;
    const list = p.buffs.slice();
    if (p.stealth > 0) list.push({ name: 'Sigilo', t: p.stealth, col: C.cyan });
    if (p.absorb > 0) list.push({ name: `Escudo ${Math.ceil(p.absorb)}`, t: p.absorbT, col: C.blue });
    for (const b of list) {
      if (n++ > 5) break;
      const label = b.name.toUpperCase();
      this.darken(BOX_MAP.x + BOX_MAP.w - textWidth(label) - 28, by - 1, textWidth(label) + 28, 10, 0.5);
      this.text(BOX_MAP.x + BOX_MAP.w - 2, by, `${label} ${Math.ceil(b.t)}`, b.col || C.gold, { align: 'right', shadow: false });
      by += 11;
    }
  }

  // Elección de clase / evolución: tarjetas grandes
  choice(G) {
    const ch = G.choice; if (!ch) return;
    this.darken(VX, VY, VW, VH, 0.35);
    const cx = VX + VW / 2, n = ch.items.length;
    this.text(cx, 12, ch.title, C.gold, { align: 'center', scale: 3, grad: GOLD_GRAD, shadow: 'outline' });
    this.text(cx, 40, ch.sub.toUpperCase(), C.dim, { align: 'center' });
    const cw = n === 3 ? 148 : 190, chh = 196, gap = 8;
    const x0 = Math.round(cx - (n * cw + (n - 1) * gap) / 2), y = 56;
    ch.items.forEach((it, i) => {
      const x = x0 + i * (cw + gap), hot = this.hit(x, y, cw, chh);
      this.hot.push({ x, y, w: cw, h: chh, id: i });
      this.panel(x, y, cw, chh, hot);
      const lim = Math.floor((cw - 12) / 6);
      this.text(x + 6, y + 6, `[${i + 1}]`, C.dim);
      this.text(x + cw - 6, y + 6, it.tier === 1 ? 'BASE' : it.tier === 2 ? 'AVANZADA' : 'SUBCLASE', it.tier === 3 ? C.orange : it.tier === 2 ? C.cyan : C.dim, { align: 'right' });
      let yy = y + 20;
      wrapText(it.name.toUpperCase(), lim).forEach(l => { this.text(x + cw / 2, yy, l, C.gold, { align: 'center', grad: GOLD_GRAD }); yy += 10; });
      wrapText(it.tag.toUpperCase(), lim).forEach(l => { this.text(x + cw / 2, yy, l, C.goldL, { align: 'center', shadow: false }); yy += 9; });
      yy += 4;
      wrapText(it.desc.toUpperCase(), lim).forEach(l => { this.text(x + 6, yy, l, C.ink, { shadow: false }); yy += 9; });
      yy += 4;
      it.skills.forEach(s => { this.text(x + 6, yy, s.toUpperCase().slice(0, lim), C.cyan, { shadow: false }); yy += 9; });
      yy += 3;
      wrapText(('ARMAS: ' + it.weapons.join(', ')).toUpperCase(), lim).forEach(l => { this.text(x + 6, yy, l, C.dim, { shadow: false }); yy += 9; });
      if (it.next) {
        const nl = wrapText(`NV ${it.lvl}: ${it.next.join(' / ')}`.toUpperCase(), lim);
        nl.forEach((l, k) => this.text(x + cw / 2, y + chh - 6 - (nl.length - k) * 9, l, C.orange, { align: 'center', shadow: false }));
      }
    });
  }

  levelUp(G) {
    this.darken(VX, VY, VW, VH, 0.4);
    const cx = VX + VW / 2;
    this.text(cx, 24, `¡NIVEL ${G.p.lvl - G.pending + 1}!`, C.gold, { align: 'center', scale: 3, grad: GOLD_GRAD, shadow: 'outline' });
    this.text(cx, 52, 'ELIGE UNA MEJORA', C.dim, { align: 'center' });
    const cw = 136, ch = 112, gap = 10, n = G.opts.length;
    const x0 = Math.round(cx - (n * cw + (n - 1) * gap) / 2);
    G.opts.forEach((u, i) => {
      const x = x0 + i * (cw + gap), y = 66;
      const hot = this.hit(x, y, cw, ch);
      this.hot.push({ x, y, w: cw, h: ch, id: i });
      this.panel(x, y, cw, ch, hot);
      this.text(x + 8, y + 8, `[${i + 1}]`, C.dim);
      if (u.skill) this.text(x + cw - 8, y + 8, 'HABILIDAD', C.cyan, { align: 'right' });
      else if (u.passive) this.text(x + cw - 8, y + 8, 'PASIVA', C.orange, { align: 'right' });
      const lvl = u.skill ? 0 : LR(u.id), col = u.skill ? C.cyan : u.passive ? C.orange : C.gold;
      wrapText(u.name, 20).forEach((ln, k) => this.text(x + cw / 2, y + 22 + k * 10, ln, col, { align: 'center' }));
      wrapText(u.desc(lvl), 21).forEach((ln, k) => this.text(x + cw / 2, y + 48 + k * 9, ln, C.ink, { align: 'center' }));
      if (u.skill) { this.text(x + cw / 2, y + ch - 14, 'NUEVA', C.cyan, { align: 'center' }); return; }
      if (u.passive && lvl > 0 && !G.pasOn.includes(u.id)) this.text(x + cw / 2, y + ch - 24, 'GUARDADA', C.dim, { align: 'center', shadow: false });
      // marcadores de nivel
      const pw = u.max * 7 - 2, pxs = Math.round(x + cw / 2 - pw / 2);
      for (let k = 0; k < u.max; k++) {
        const c = k < lvl ? C.gold : k === lvl ? (((G.time * 4) | 0) & 1 ? C.goldL : C.goldD) : rgb(40, 28, 18);
        this.rect(pxs + k * 7, y + ch - 14, 5, 5, C.dark); this.rect(pxs + k * 7 + 1, y + ch - 13, 3, 3, c);
      }
    });
  }

  // Aprender una habilidad o pasiva sin hueco: ¿cuál sustituye? (o se guarda para el Mentor)
  learn(G) {
    const l = G.learn; if (!l) return;
    this.darken(VX, VY, VW, VH, 0.75);
    const cx = VX + VW / 2, sk = l.kind === 'skill', it = sk ? SKILLS[l.id] : UPG.find(u => u.id === l.id);
    this.text(cx, 14, sk ? 'NUEVA HABILIDAD' : 'NUEVA PASIVA', sk ? C.cyan : C.orange, { align: 'center', scale: 2, shadow: 'outline' });
    this.text(cx, 34, it.name.toUpperCase(), C.goldL, { align: 'center' });
    wrapText((sk ? it.desc : it.desc(0)).toUpperCase(), 70).forEach((t, k) => this.text(cx, 46 + k * 9, t, C.ink, { align: 'center', shadow: false }));
    this.text(cx, 72, sk ? `SOLO PUEDES LLEVAR ${SKILL_LABEL.length} ACTIVAS: ¿CUÁL SUSTITUYE?` : `SOLO PUEDES LLEVAR ${MAX_PAS} PASIVAS: ¿CUÁL SUSTITUYE?`, C.dim, { align: 'center' });
    const cur = sk ? G.p.active.map(id => id && SKILLS[id]) : G.pasOn.map(id => UPG.find(u => u.id === id));
    const cards = cur.map((c, i) => ({ head: sk ? SKILL_LABEL[i] : 'PASIVA', name: c ? c.name : '-', desc: c ? (sk ? c.desc : c.desc(LR(c.id) - 1)) : '', col: sk ? C.cyan : C.orange }));
    cards.push({ head: '', name: 'GUARDAR PARA EL MENTOR', desc: 'No la usas por ahora: podrás activarla con el Mentor', col: C.dim, keep: true });
    const cw = 104, ch = 120, gap = 8, x0 = Math.round(cx - (cards.length * cw + (cards.length - 1) * gap) / 2), y = 86;
    cards.forEach((c, i) => {
      const x = x0 + i * (cw + gap), hot = this.hit(x, y, cw, ch), id = c.keep ? 3 : i;
      this.hot.push({ x, y, w: cw, h: ch, id });
      this.panel(x, y, cw, ch, hot);
      this.text(x + 6, y + 6, `[${id + 1}]`, C.dim);
      if (c.head) this.text(x + cw - 6, y + 6, c.head, c.col, { align: 'right' });
      wrapText(String(tr(c.name.toUpperCase())), 16).forEach((t, k) => this.text(x + cw / 2, y + 22 + k * 10, t, c.keep ? C.goldL : C.gold, { align: 'center' }));
      wrapText(String(tr(c.desc.toUpperCase())), 16).slice(0, 8).forEach((t, k) => this.text(x + cw / 2, y + 46 + k * 9, t, C.ink, { align: 'center', shadow: false }));
      if (!c.keep) this.text(x + cw / 2, y + ch - 12, 'SUSTITUIR', C.red, { align: 'center', shadow: false });
    });
    this.text(cx, y + ch + 12, 'LO QUE SUSTITUYAS NO SE PIERDE: EL MENTOR LO GUARDA', C.dim, { align: 'center', shadow: false });
  }

  // El Mentor: reorganiza por oro las habilidades y pasivas activas entre todas las aprendidas en la partida
  mentor(G) {
    this.darken(VX, VY, VW, VH, 0.75);
    const p = G.p, cx = VX + VW / 2, cost = mentorPrice(), ok = G.loot >= cost, sel = G.mentorSel || { kind: 'skill', i: 0 };
    this.text(cx, 8, 'EL MENTOR', C.gold, { align: 'center', scale: 2, grad: GOLD_GRAD, shadow: 'outline' });
    this.text(cx, 28, `CADA CAMBIO: ${cost} ORO · TIENES ${G.loot}`, ok ? C.dim : C.red, { align: 'center' });
    let tip = null;
    const row = (x, y, w, label, name, col, id, on, desc) => {
      const hot = this.hit(x, y, w, 11);
      this.hot.push({ x, y, w, h: 11, id });
      if (on) this.rect(x, y, w, 11, rgb(70, 46, 18)); else if (hot) this.rect(x, y, w, 11, rgb(46, 30, 14));
      if (label) this.text(x + 3, y + 2, label, on ? C.goldL : C.dim, { shadow: false });
      this.text(x + (label ? 16 : 4), y + 2, name.toUpperCase().slice(0, Math.floor((w - (label ? 18 : 6)) / 6)), col, { shadow: false });
      if (hot) tip = desc;
    };
    // habilidades
    const lx = VX + 14, lw = 214, top = 42;
    this.panel(lx - 6, top, lw + 12, 186);
    this.text(lx, top + 6, 'HABILIDADES ACTIVAS', C.cyan);
    p.active.forEach((id, i) => row(lx, top + 18 + i * 12, lw, SKILL_LABEL[i], id ? SKILLS[id].name : '- vacío -', id ? C.ink : C.dim, 'sk:' + i, sel.kind === 'skill' && sel.i === i, id ? SKILLS[id].desc : ''));
    const stored = p.known.filter(id => !p.active.includes(id));
    this.text(lx, top + 60, stored.length ? 'GUARDADAS (ELIGE UNA)' : 'NINGUNA GUARDADA', C.dim, { shadow: false });
    stored.forEach((id, k) => row(lx + (k % 2) * (lw / 2 + 2), top + 72 + Math.floor(k / 2) * 12, lw / 2 - 2, '', SKILLS[id].name, ok ? C.goldL : C.dim, 'kn:' + id, false, SKILLS[id].desc));
    // pasivas
    const rx = VX + VW / 2 + 18, rw = VW / 2 - 32;
    this.panel(rx - 6, top, rw + 12, 186);
    this.text(rx, top + 6, 'PASIVAS ACTIVAS', C.orange);
    for (let i = 0; i < MAX_PAS; i++) { const id = G.pasOn[i], u = id && UPG.find(q => q.id === id); row(rx, top + 18 + i * 12, rw, String(i + 1), u ? `${u.name} ${LR(id)}` : '- vacío -', u ? C.ink : C.dim, 'pa:' + i, sel.kind === 'pas' && sel.i === i, u ? u.desc(LR(id) - 1) : ''); }
    const pst = UPG.filter(u => u.passive && LR(u.id) > 0 && !G.pasOn.includes(u.id));
    this.text(rx, top + 60, pst.length ? 'GUARDADAS' : 'NINGUNA GUARDADA', C.dim, { shadow: false });
    pst.forEach((u, k) => row(rx, top + 72 + k * 12, rw, '', `${u.name} ${LR(u.id)}`, ok ? C.goldL : C.dim, 'ps:' + u.id, false, u.desc(LR(u.id) - 1)));
    if (tip) wrapText(tip.toUpperCase(), 74).slice(0, 2).forEach((t, k) => this.text(cx, top + 192 + k * 9, t, C.ink, { align: 'center', shadow: false }));
    else this.text(cx, top + 192, 'ELIGE UN HUECO ACTIVO Y LUEGO LO QUE QUIERES PONER EN ÉL', C.dim, { align: 'center', shadow: false });
    this.text(cx, VY + VH - 12, G.touchMode ? 'TOCA FUERA PARA SALIR' : 'ESC PARA SALIR', C.goldL, { align: 'center', shadow: 'outline' });
  }

  // Pactos: al entrar en una mazmorra nueva, una maldición opcional a cambio de más oro y botín
  pact(G) {
    this.darken(VX, VY, VW, VH, 0.75);
    const cx = VX + VW / 2, ids = G.pactOpts || [];
    this.text(cx, 16, 'UN PACTO OSCURO', C.red, { align: 'center', scale: 2, grad: RED_GRAD, shadow: 'outline' });
    this.text(cx, 38, 'ACEPTA UNA MALDICIÓN PARA ESTA MAZMORRA A CAMBIO DE MÁS ORO Y MEJOR BOTÍN', C.dim, { align: 'center' });
    const cards = ids.map(id => ({ name: PACTS[id].name, desc: PACTS[id].desc, bonus: `+${Math.round(PACTS[id].bonus * 100)}% ORO Y BOTÍN` }));
    cards.push({ name: 'Sin pacto', desc: 'Entras sin maldiciones', bonus: '', none: true });
    const cw = 104, ch = 120, gap = 8, x0 = Math.round(cx - (cards.length * cw + (cards.length - 1) * gap) / 2), y = 60;
    cards.forEach((c, i) => {
      const x = x0 + i * (cw + gap), hot = this.hit(x, y, cw, ch);
      this.hot.push({ x, y, w: cw, h: ch, id: i });
      this.panel(x, y, cw, ch, hot);
      this.text(x + 6, y + 6, `[${i + 1}]`, C.dim);
      wrapText(String(tr(c.name.toUpperCase())), 16).forEach((t, k) => this.text(x + cw / 2, y + 22 + k * 10, t, c.none ? C.goldL : C.red, { align: 'center' }));
      wrapText(String(tr(c.desc.toUpperCase())), 16).forEach((t, k) => this.text(x + cw / 2, y + 48 + k * 9, t, C.ink, { align: 'center', shadow: false }));
      if (c.bonus) wrapText(String(tr(c.bonus)), 16).forEach((t, k) => this.text(x + cw / 2, y + ch - 22 + k * 9, t, C.gold, { align: 'center', shadow: false }));
    });
    if (G.pactNight) this.text(cx, y + ch + 12, 'MODO PESADILLA', C.red, { align: 'center' });
  }

  // Presentación: el gato del estudio abre y cierra la boca (cerrada, media, abierta) y debajo el autor
  splash(G) {
    const t = G.splashT || 0, cx = VX + VW / 2, s = 3;
    const ph = (t % 1.2) / 1.2, o = ph < 0.25 ? 0 : ph < 0.33 ? 1 : ph < 0.75 ? 2 : ph < 0.83 ? 1 : 0;
    const spr = SPR['studio_cat_' + o] || SPR.studio_cat_0;
    if (spr) {
      const w = spr.w * s, x0 = Math.round(cx - w / 2), y0 = 40;
      for (let y = 0; y < spr.h * s; y++) for (let x = 0; x < w; x++) { const v = spr.px[Math.floor(y / s) * spr.w + Math.floor(x / s)]; if (v >>> 24) this.px(x0 + x, y0 + y, v | 0xFF000000); }
    }
    this.text(cx, 202, 'GAME MADE BY', C.dim, { align: 'center', shadow: false });
    this.text(cx, 216, 'ALEXMIAUPLUS01', C.gold, { align: 'center', scale: 2, grad: GOLD_GRAD, shadow: 'outline' });
    const a = Math.min(1, t / 0.5, (SPLASH_TIME - t) / 0.5); // aparece y se funde a negro
    if (a < 1) this.darken(VX, VY, VW, VH, 1 - Math.max(0, a));
  }

  dead(G) {
    this.darken(VX, VY, VW, VH, 0.35);
    this.flashTint(VX, VY, VW, VH);
    const cx = VX + VW / 2, s = G.final;
    this.text(cx, 28, 'HAS CAÍDO', C.red, { align: 'center', scale: 4, grad: RED_GRAD, shadow: 'outline' });
    this.text(cx, 64, s.name.toUpperCase(), C.dim, { align: 'center' });
    this.statRows(cx, 78, [['BOTÍN PERDIDO', s.lost], ['ORO A SALVO', s.bank], ['NIVEL', s.lvl], ['ABATIDOS', s.kills], ['TIEMPO', s.time]]);
    if (((G.time * 2) | 0) & 1) this.text(cx, 176, G.touchMode ? 'TOCA PARA RENACER' : 'HAZ CLIC PARA RENACER', C.goldL, { align: 'center', shadow: 'outline' });
  }
  statRows(cx, y, rows) {
    this.panel(cx - 100, y, 200, rows.length * 12 + 10);
    rows.forEach(([k, v], i) => { this.text(cx - 90, y + 6 + i * 12, k, C.ink); this.text(cx + 90, y + 6 + i * 12, String(v), C.gold, { align: 'right' }); });
  }
  // botones grandes numerados; id = índice
  buttons(cx, y, labels) {
    labels.forEach((t, i) => {
      const w = 220, x = cx - w / 2, yy = y + i * 22, hot = this.hit(x, yy, w, 18);
      this.hot.push({ x, y: yy, w, h: 18, id: i });
      this.panel(x, yy, w, 18, hot);
      this.text(x + 8, yy + 6, `[${i + 1}]`, C.dim);
      this.text(cx + 8, yy + 6, t, hot ? C.goldL : C.gold, { align: 'center' });
    });
  }
  exitAsk(G) {
    this.darken(VX, VY, VW, VH, 0.5);
    const cx = VX + VW / 2;
    this.text(cx, 34, 'LA SALIDA', C.gold, { align: 'center', scale: 3, grad: GOLD_GRAD, shadow: 'outline' });
    this.text(cx, 66, 'LA LUZ DEL DÍA ENTRA ENTRE LOS BARROTES', C.dim, { align: 'center' });
    this.statRows(cx, 80, [['BOTÍN', G.loot], ['LLAVES', `${G.keys.length}/${G.dg.lockRooms.length}`], ['GUARDIÁN', G.journal.some(e => e.id === 'boss') ? 'DERROTADO' : 'VIVO']]);
    this.buttons(cx, 136, ['SALIR CON EL BOTÍN', 'SEGUIR EXPLORANDO']);
  }
  escaped(G) {
    this.darken(VX, VY, VW, VH, 0.4);
    const cx = VX + VW / 2, s = G.final;
    this.text(cx, 20, 'HAS ESCAPADO', C.gold, { align: 'center', scale: 3, grad: GOLD_GRAD, shadow: 'outline' });
    this.text(cx, 50, s.name.toUpperCase(), C.dim, { align: 'center' });
    this.statRows(cx, 62, [['BOTÍN', s.loot], ['ORO DE LA PARTIDA', s.bank], ['NIVEL', s.lvl], ['ABATIDOS', s.kills], ['TIEMPO', s.time]]);
    this.buttons(cx, 142, ['SIGUIENTE MAZMORRA (MÁS DIFÍCIL)', 'MODO PESADILLA (DOBLE ORO)', 'RETIRARSE CON EL ORO']);
  }

  // Diario: libro antiguo abierto, dos páginas de pergamino; lo resuelto aparece tachado
  journal(G) {
    this.darken(VX, VY, VW, VH, 0.35);
    const bx = 34, by = 14, bw = VW - 68, bh = VH - 34, pw = (bw - 16) >> 1;
    // tapas de cuero
    this.rect(bx - 4, by - 4, bw + 8, bh + 8, rgb(48, 22, 12));
    this.rect(bx - 2, by - 2, bw + 4, bh + 4, rgb(86, 40, 20));
    if (!this.parch || this.parch.w !== bw) this.parch = buildParchment(bw, bh);
    const P = this.parch.px;
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) this.buf[(by + y) * SW + bx + x] = P[y * bw + x];
    // líneas de texto de todas las entradas
    const ink = rgb(58, 34, 18), faded = rgb(120, 92, 62), red = rgb(130, 34, 22);
    const cols = Math.floor((pw - 20) / 6), lines = [];
    for (const e of G.journal) {
      wrapText(e.text.toUpperCase(), cols).forEach((t, i) => lines.push({ t, done: e.done, first: i === 0 }));
      lines.push({ gap: true });
    }
    const perPage = Math.floor((bh - 40) / 9) - 1, pages = [];
    let cur = [];
    for (const l of lines) { if (cur.length >= perPage) { pages.push(cur); cur = []; } if (!(l.gap && !cur.length)) cur.push(l); }
    if (cur.length) pages.push(cur);
    const spreads = Math.max(1, Math.ceil((pages.length + 1) / 2)); // la primera página lleva el título
    if (G.jpage < 0 || G.jpage >= spreads) G.jpage = spreads - 1;
    G.jspreads = spreads;
    const drawPage = (pi, x0) => {
      const pg = pages[pi]; if (!pg) return;
      let y = by + (pi === -1 ? 0 : 14);
      for (const l of pg) {
        if (l.gap) { y += 4; continue; }
        const x = x0 + 10;
        if (l.first) this.text(x - 7, y, '*', l.done ? faded : red, { shadow: false });
        this.text(x, y, l.t, l.done ? faded : ink, { shadow: false });
        if (l.done) { const w = textWidth(l.t); for (let k = 0; k < w; k++) this.px(x + k, y + 3 + (((k + y) >> 3) & 1), red); }
        y += 9;
      }
    };
    const s0 = G.jpage;
    // página izquierda: en el primer pliego, el título; después, páginas de entradas
    const lx = bx, rx = bx + pw + 16;
    if (s0 === 0) {
      this.text(lx + pw / 2, by + 14, 'DIARIO', red, { align: 'center', scale: 2, shadow: false });
      wrapText(G.dg.name.toUpperCase(), cols).forEach((t, i) => this.text(lx + pw / 2, by + 38 + i * 9, t, ink, { align: 'center', shadow: false }));
      this.text(lx + pw / 2, by + 62, '* * *', faded, { align: 'center', shadow: false });
      this.text(lx + pw / 2, by + bh - 40, `BOTÍN: ${G.loot} ORO`, ink, { align: 'center', shadow: false });
      this.text(lx + pw / 2, by + bh - 30, `LLAVES: ${G.keys.map(k => KEYS[k].name.split(' ').pop()).join(', ') || 'NINGUNA'}`.toUpperCase(), ink, { align: 'center', shadow: false });
      drawPage(0, rx);
    } else { drawPage(s0 * 2 - 1, lx); drawPage(s0 * 2, rx); }
    // pie: paginación
    if (s0 > 0) this.text(bx + 8, by + bh - 12, '< A', faded, { shadow: false });
    if (s0 < spreads - 1) this.text(bx + bw - 8, by + bh - 12, 'D >', faded, { align: 'right', shadow: false });
    this.text(VX + VW / 2, VY + VH - 10, G.touchMode ? 'TOCA EL CENTRO PARA CERRAR · LOS LADOS PASAN PÁGINA' : 'J PARA CERRAR', C.goldL, { align: 'center', shadow: 'outline' });
  }
  flashTint(x, y, w, h) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
      const o = j * SW + i, c = this.buf[o];
      this.buf[o] = rgb(Math.min(255, (c & 255) * 1.4 + 10), ((c >> 8) & 255) * 0.6, ((c >> 16) & 255) * 0.6);
    }
  }

}

function lerpCol(a, b, t) {
  return rgb(lerp(a & 255, b & 255, t), lerp((a >> 8) & 255, (b >> 8) & 255, t), lerp((a >> 16) & 255, (b >> 16) & 255, t));
}

// Pergamino para el diario: dos páginas con manchas, bordes oscurecidos y sombra del lomo
function buildParchment(w, h) {
  const px = new Uint32Array(w * h), pw = (w - 16) >> 1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const inGutter = x >= pw && x < pw + 16;
    const lx = x < pw ? x : x - pw - 16, local = inGutter ? 0 : lx;
    let k = 0.9 + (vnoise(x / 9, y / 9, 71, 64) - 0.5) * 0.18 + (hash2(x, y, 72) - 0.5) * 0.06;
    const edge = Math.min(local, (inGutter ? 0 : pw - 1 - local), y, h - 1 - y);
    if (edge < 6) k *= 0.78 + edge * 0.035;
    if (inGutter) k = 0.45 + Math.abs(x - pw - 7.5) * 0.03;
    else { const dl = x < pw ? pw - x : x - pw - 16; if (dl < 14) k *= 0.72 + dl * 0.02; } // sombra del lomo
    if (vnoise(x / 23, y / 23, 73, 64) > 0.78) k *= 0.9; // manchas
    px[y * w + x] = rgb(222 * k, 196 * k, 150 * k);
  }
  return { w, h, px };
}
