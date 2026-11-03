// Efectos de sonido sintetizados con WebAudio (sin archivos externos)
const Sfx = (() => {
  let ac = null, master = null, noiseBuf = null, muted = false, vol = 0.8;
  const last = {};

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ac.createGain(); master.gain.value = 0.45 * vol; master.connect(ac.destination);
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
    torch: () => { noise(0.35, 0.18, 2200); tone('sine', 180, 320, 0.25, 0.05); },
    shrine: () => [523, 659, 784, 1046].forEach((f, i) => tone('sine', f, f, 0.5, 0.1, i * 0.12)),
  };

  function play(name) {
    if (!ac || muted || !S[name]) return;
    const now = performance.now();
    if (last[name] && now - last[name] < 45) return;
    last[name] = now;
    S[name]();
  }
  function toggle() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.45 * vol; return muted; }
  function setVolume(v) { vol = v; muted = v <= 0; if (master) master.gain.value = 0.45 * vol; }
  return { init, play, toggle, setVolume };
})();
