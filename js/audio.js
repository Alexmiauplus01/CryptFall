// Sonido sintetizado con WebAudio (sin archivos externos), con sabor a 16 bits: todo pasa por un filtro
// y un eco con realimentación como el de la SNES. Incluye música generada por código para cada tema.
const Sfx = (() => {
  let ac = null, master = null, noiseBuf = null, muted = false, vol = 0.8, musicBus = null, musicOn = true;
  const last = {};

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ac.createGain(); master.gain.value = 0.45 * vol;
    // cadena 16 bits: paso bajo suave + eco filtrado con realimentación
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9000;
    master.connect(lp); lp.connect(ac.destination);
    const echo = ac.createDelay(1); echo.delayTime.value = 0.27;
    const fb = ac.createGain(); fb.gain.value = 0.32;
    const ef = ac.createBiquadFilter(); ef.type = 'lowpass'; ef.frequency.value = 2600;
    const send = ac.createGain(); send.gain.value = 0.28;
    master.connect(send); send.connect(echo); echo.connect(ef); ef.connect(fb); fb.connect(echo); ef.connect(lp);
    musicBus = ac.createGain(); musicBus.gain.value = musicOn ? 0.55 : 0; musicBus.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    ambient();
  }

  function ambient() {
    const g = ac.createGain(); g.gain.value = 0.05; g.connect(master);
    [55, 82.4, 110.3].forEach((f, i) => {
      const o = ac.createOscillator(); o.type = i === 2 ? 'triangle' : 'sine'; o.frequency.value = f;
      const lfo = ac.createOscillator(); lfo.frequency.value = 0.05 + i * 0.03;
      const lg = ac.createGain(); lg.gain.value = f * 0.01;
      lfo.connect(lg).connect(o.frequency);
      const og = ac.createGain(); og.gain.value = i === 2 ? 0.25 : 1;
      o.connect(og).connect(g); o.start(); lfo.start();
    });
  }

  // nota para la música: forma de onda, frecuencia, inicio, duración, volumen, ataque/caída
  function note(type, f, t, dur, v, o = {}) {
    const osc = ac.createOscillator(), g = ac.createGain();
    if (type === 'pulse') { // onda de pulso estrecha (25%) como los canales de las consolas
      const real = new Float32Array(16), imag = new Float32Array(16);
      for (let n = 1; n < 16; n++) imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * 0.25);
      osc.setPeriodicWave(ac.createPeriodicWave(real, imag));
    } else osc.type = type;
    osc.frequency.setValueAtTime(f, t);
    if (o.vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 5.5; lg.gain.value = f * 0.012; l.connect(lg).connect(osc.frequency); l.start(t + 0.12); l.stop(t + dur + 0.1); }
    const a = o.a || 0.01, r = o.r || 0.08;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a);
    g.gain.setValueAtTime(v, Math.max(t + a, t + dur - r)); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    let out = g;
    if (o.lp) { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; g.connect(fl); out = fl; }
    osc.connect(g); out.connect(musicBus); osc.start(t); osc.stop(t + dur + 0.05);
  }
  function drum(t, kind, v) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = kind === 'hat' ? 'highpass' : 'lowpass'; f.frequency.value = kind === 'hat' ? 6000 : 180;
    const g = ac.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'hat' ? 0.05 : 0.25));
    s.connect(f).connect(g).connect(musicBus); s.start(t); s.stop(t + 0.3);
    if (kind !== 'hat') { const o = ac.createOscillator(), og = ac.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.2); og.gain.setValueAtTime(v * 1.2, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); o.connect(og).connect(musicBus); o.start(t); o.stop(t + 0.25); }
  }

  function tone(type, f0, f1, dur, vol, delay = 0) {
    const t = ac.currentTime + delay;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, lp, delay = 0) {
    const t = ac.currentTime + delay;
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + dur + 0.05);
  }

  const S = {
    shoot: () => { tone('triangle', 780, 220, 0.16, 0.22); noise(0.07, 0.1, 3500); },
    hit: () => tone('square', 240, 90, 0.07, 0.12),
    kill: () => { tone('sawtooth', 170, 40, 0.18, 0.16); noise(0.14, 0.16, 1400); },
    hurt: () => { tone('sawtooth', 130, 45, 0.3, 0.35); noise(0.2, 0.3, 700); },
    gem: () => tone('sine', 900 + Math.random() * 300, 1500, 0.07, 0.1),
    potion: () => { tone('sine', 420, 880, 0.22, 0.25); tone('sine', 630, 1320, 0.22, 0.12, 0.05); },
    level: () => [392, 494, 587, 784].forEach((f, i) => tone('square', f, f, 0.16, 0.13, i * 0.09)),
    nova: () => { tone('sine', 900, 90, 0.6, 0.3); noise(0.5, 0.25, 2800); },
    bolt: () => { noise(0.3, 0.4, 5500); tone('sawtooth', 95, 40, 0.3, 0.2); },
    dash: () => noise(0.18, 0.2, 2000),
    enemyShoot: () => tone('sine', 320, 140, 0.2, 0.12),
    swing: () => { noise(0.22, 0.22, 3000); tone('triangle', 500, 120, 0.2, 0.12); },
    roar: () => { tone('sawtooth', 150, 55, 0.5, 0.35); noise(0.4, 0.25, 900); },
    summon: () => { tone('sine', 220, 660, 0.4, 0.2); tone('triangle', 330, 110, 0.4, 0.15, 0.05); },
    trap: () => { tone('square', 300, 150, 0.1, 0.15); noise(0.1, 0.15, 2500); },
    blade: () => tone('triangle', 1200, 800, 0.05, 0.05),
    boss: () => { tone('sawtooth', 72, 34, 1.4, 0.4); tone('square', 66, 30, 1.4, 0.25); },
    portal: () => [330, 440, 554, 660, 880].forEach((f, i) => tone('sine', f, f, 0.35, 0.12, i * 0.1)),
    die: () => { tone('sawtooth', 200, 30, 1.2, 0.4); noise(0.8, 0.3, 900); },
    door: () => { tone('sawtooth', 90, 140, 0.35, 0.12); noise(0.3, 0.12, 600); },
    locked: () => { tone('square', 180, 160, 0.06, 0.12); tone('square', 150, 140, 0.06, 0.1, 0.08); },
    unlock: () => { tone('square', 1200, 900, 0.05, 0.1); tone('triangle', 600, 800, 0.2, 0.15, 0.06); noise(0.25, 0.1, 800, 0.1); },
    chest: () => { tone('sawtooth', 120, 200, 0.25, 0.12); [660, 880, 1100].forEach((f, i) => tone('sine', f, f, 0.12, 0.08, 0.15 + i * 0.06)); },
    coin: () => tone('square', 1300 + Math.random() * 300, 1800, 0.05, 0.06),
    stairs: () => [0, 1, 2, 3].forEach(i => noise(0.08, 0.18, 900, i * 0.13)),
    secret: () => { tone('sawtooth', 60, 40, 1.0, 0.3); noise(1.0, 0.25, 500); },
    bars: () => { tone('square', 140, 70, 0.4, 0.2); noise(0.35, 0.2, 1800); },
    step: () => { noise(0.06, 0.07, 500); tone('sine', 90, 60, 0.07, 0.05); },
    crackle: () => noise(0.03, 0.04 + Math.random() * 0.04, 3000 + Math.random() * 3000),
    torchOut: () => { noise(0.5, 0.15, 1200); tone('sine', 300, 90, 0.4, 0.06); },
    torch: () => { noise(0.35, 0.18, 2200); tone('sine', 180, 320, 0.25, 0.05); },
    shrine: () => [523, 659, 784, 1046].forEach((f, i) => tone('sine', f, f, 0.5, 0.1, i * 0.12)),
  };

  // ---------------------------------------------------------------- música
  // Cada pieza: tónica (MIDI), escala menor o frígia, tempo y progresión de acordes (grados de la escala).
  const SONGS = {
    title: { root: 45, mode: [0, 2, 3, 5, 7, 8, 10], bpm: 76, prog: [0, 5, 3, 4], lead: true, drums: false },
    0: { root: 50, mode: [0, 2, 3, 5, 7, 8, 10], bpm: 72, prog: [0, 0, 5, 4], lead: true, drums: false },   // Cripta: re menor
    1: { root: 45, mode: [0, 1, 3, 5, 7, 8, 10], bpm: 84, prog: [0, 1, 0, 6], lead: false, drums: true },   // Catacumbas: la frigio
    2: { root: 40, mode: [0, 1, 4, 5, 7, 8, 10], bpm: 96, prog: [0, 1, 0, 5], lead: true, drums: true },    // Foso: mi frigio dominante
    3: { root: 47, mode: [0, 2, 3, 6, 7, 8, 11], bpm: 66, prog: [0, 3, 5, 0], lead: true, drums: false },   // Vacío: si menor húngara
  };
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  let song = null, songKey = null, nextT = 0, step = 0, timer = null, melo = 0;
  function deg(sg, d, oct = 0) { const m = sg.mode, n = ((d % 7) + 7) % 7; return sg.root + m[n] + 12 * (Math.floor(d / 7) + oct); }
  function schedule() {
    if (!ac || !song) return;
    const spb = 60 / song.bpm / 2; // corcheas
    while (nextT < ac.currentTime + 0.3) {
      const bar = Math.floor(step / 8) % song.prog.length, beat = step % 8, ch = song.prog[bar];
      const t = nextT;
      if (beat === 0) { // acorde de fondo (sierra filtrada) y bajo
        for (const d of [ch, ch + 2, ch + 4]) note('sawtooth', hz(deg(song, d, 0)), t, spb * 8, 0.035, { a: 0.35, r: 0.5, lp: 900 });
        note('triangle', hz(deg(song, ch, -1)), t, spb * 3.8, 0.16, { r: 0.1 });
      }
      if (beat === 4) note('triangle', hz(deg(song, ch + (step & 16 ? 4 : 0), -1)), t, spb * 3.8, 0.13, { r: 0.1 });
      // arpegio de pulso
      if (beat % 2 === 0 || song.bpm < 80) { const ar = [0, 2, 4, 7, 4, 2, 0, 2][beat]; note('pulse', hz(deg(song, ch + ar, 1)), t, spb * 0.9, 0.035, { r: 0.04 }); }
      // melodía ocasional: paseo por la escala
      if (song.lead && beat % 2 === 0 && Math.random() < 0.55) {
        melo = Math.max(-2, Math.min(9, melo + [-2, -1, -1, 1, 1, 2, 0][Math.floor(Math.random() * 7)]));
        note('square', hz(deg(song, ch + melo, 1)), t, spb * (Math.random() < 0.3 ? 4 : 2) * 0.95, 0.045, { a: 0.02, r: 0.12, vib: true, lp: 3000 });
      }
      if (song.drums) { if (beat === 0 || beat === 5) drum(t, 'kick', 0.25); if (beat % 2 === 1) drum(t, 'hat', 0.04); }
      nextT += spb; step++;
    }
  }
  function playMusic(key) {
    if (!ac || songKey === key) return;
    songKey = key; song = SONGS[key] || SONGS[0]; step = 0; melo = 2;
    nextT = ac.currentTime + 0.1;
    if (!timer) timer = setInterval(schedule, 80);
  }
  function stopMusic() { song = null; songKey = null; }
  function setMusic(on) { musicOn = on; if (musicBus) musicBus.gain.value = on ? 0.55 : 0; }

  function play(name) {
    if (!ac || muted || !S[name]) return;
    const now = performance.now();
    if (last[name] && now - last[name] < 45) return;
    last[name] = now;
    S[name]();
  }
  function toggle() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.45 * vol; return muted; }
  function setVolume(v) { vol = v; muted = v <= 0; if (master) master.gain.value = 0.45 * vol; }
  return { init, play, toggle, setVolume, playMusic, stopMusic, setMusic };
})();
