// Synthesized sound effects (Web Audio, no files). Browsers only allow audio after a user gesture,
// so the context is created on the first unlock() call, which the game makes on pointerdown.
// createSound() → { unlock, launch(power), tick(step), crash(kind), win(holeInOne), miss, muted,
//                   music, setLevel(level), flyby(y, close) }
function createSound() {
  let ctx = null, master = null;
  let muted = false, musicOn = false;
  try { muted = localStorage.getItem("slingshot.muted") === "1"; musicOn = localStorage.getItem("slingshot.music") === "1"; } catch {}

  function unlock() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);
    startMusic();
  }

  // ---------- music ----------
  // A quiet generative score after Life Sequencer: each hole seeds a small Game of Life grid from where
  // its bodies sit. The grid plays as a loop in a minor pentatonic scale and evolves once a bar, and when
  // it dies out or freezes the hole's own seed comes back, so every hole has a theme that keeps changing.
  // Flybys during a shot add notes on the row of the body they pass.
  const ROWS = 8, COLS = 16, BPM = 76, PENT = [0, 3, 5, 7, 10];
  let bus = null, musicGain = null, timer = null;
  let seedGrid = null, grid = null, step = 0, nextTime = 0, started = false, still = 0, history = [], root = 57;
  const blank = () => Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const copy = (g) => g.map((r) => r.slice());
  const keyOf = (g) => g.map((r) => r.map(Number).join("")).join("");
  const midiFor = (row) => { const i = ROWS - 1 - row; return root + PENT[i % 5] + 12 * Math.floor(i / 5); };
  const rowFor = (y) => Math.max(0, Math.min(ROWS - 1, Math.floor((y / WORLD.h) * ROWS)));

  function buildBus() {
    musicGain = ctx.createGain(); musicGain.gain.value = 0.0001;
    musicGain.connect(master);
    bus = ctx.createGain(); bus.connect(musicGain);
    // A dotted-quarter echo and a synthetic room, as in Life Sequencer
    const delay = ctx.createDelay(2), fb = ctx.createGain(), wet = ctx.createGain(), tone = ctx.createBiquadFilter();
    tone.type = "lowpass"; tone.frequency.value = 2200;
    delay.delayTime.value = 1.5 * 60 / BPM; fb.gain.value = 0.35; wet.gain.value = 0.25;
    bus.connect(delay); delay.connect(tone).connect(fb).connect(delay); tone.connect(wet).connect(musicGain);
    const conv = ctx.createConvolver(), rWet = ctx.createGain();
    const len = Math.floor(ctx.sampleRate * 3.2), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    conv.buffer = ir; rWet.gain.value = 0.4;
    bus.connect(conv).connect(rWet).connect(musicGain);
  }
  // A glassy bell: a sine with two faint overtones and a soft attack
  function bell(midi, t, vel, pan) {
    const f = 440 * Math.pow(2, (midi - 69) / 12), out = ctx.createStereoPanner();
    out.pan.value = pan; out.connect(bus);
    for (const [mul, g, decay] of [[1, 1, 2.2], [2.005, 0.2, 1.1], [4.02, 0.05, 0.4]]) {
      const o = ctx.createOscillator(), e = ctx.createGain();
      o.type = "sine"; o.frequency.value = f * mul;
      e.gain.setValueAtTime(0.0001, t);
      e.gain.exponentialRampToValueAtTime(vel * g, t + 0.02);
      e.gain.exponentialRampToValueAtTime(0.0001, t + 0.02 + decay);
      o.connect(e).connect(out);
      o.start(t); o.stop(t + decay + 0.1);
    }
  }
  function evolve() {
    const next = blank();
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      let n = 0;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if ((dr || dc) && grid[(r + dr + ROWS) % ROWS][(c + dc + COLS) % COLS]) n++;
      }
      next[r][c] = grid[r][c] ? n === 2 || n === 3 : n === 3;
    }
    const k = keyOf(next), pop = next.flat().filter(Boolean).length;
    still = pop <= 4 || history.includes(k) ? still + 1 : 0;
    history.push(k); if (history.length > 16) history.shift();
    grid = next;
    // An empty, frozen, looping or nearly empty board: bring the hole's theme back, each time with a
    // few stray cells so it grows somewhere new.
    if (pop === 0 || still >= 3) {
      grid = copy(seedGrid); still = 0; history = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (Math.random() < 0.04) grid[r][c] = true;
    }
  }
  function schedule() {
    const eighth = 60 / BPM / 2;
    // After a pause (hidden tab), pick up from now rather than racing through the missed steps.
    if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
    while (nextTime < ctx.currentTime + 0.25) {
      if (step === 0 && started) evolve();
      started = true;
      const rows = [];
      for (let r = 0; r < ROWS; r++) if (grid[r][step]) rows.push(r);
      const vel = 0.11 / Math.sqrt(Math.max(1, rows.length));
      for (const r of rows) bell(midiFor(r), nextTime, vel, (step / (COLS - 1) - 0.5) * 0.8);
      nextTime += eighth;
      step = (step + 1) % COLS;
    }
  }
  function startMusic() {
    if (!ctx || !musicOn || muted || !grid || timer || document.hidden) return;
    if (!bus) buildBus();
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.setTargetAtTime(1, ctx.currentTime, 0.4);
    nextTime = ctx.currentTime + 0.1;
    schedule();
    timer = setInterval(schedule, 50);
  }
  function stopMusic() {
    if (!timer) return;
    clearInterval(timer); timer = null;
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3);
  }
  document.addEventListener("visibilitychange", () => (document.hidden ? stopMusic() : startMusic()));

  // The same hole always seeds the same grid: cells around each body and the target, plus a light
  // sprinkle from a generator keyed by the hole's name. Its key comes from the name too.
  function setLevel(lv) {
    let h = 2166136261;
    for (const ch of lv.name) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
    const rnd = () => (h = (Math.imul(h, 1664525) + 1013904223) >>> 0) / 4294967296;
    root = [57, 55, 52, 60, 53][Math.floor(rnd() * 5)];
    const g = blank();
    for (const b of [...lv.bodies, lv.target]) {
      // Moons on orbits have no fixed x, y: seed from where they start.
      const [x, y] = b.orbit ? bodyPos(b, 0) : [b.x, b.y];
      const r0 = rowFor(y), c0 = Math.max(0, Math.min(COLS - 1, Math.floor((x / WORLD.w) * COLS)));
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (rnd() < 0.45) g[(r0 + dr + ROWS) % ROWS][(c0 + dc + COLS) % COLS] = true;
      }
    }
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (rnd() < 0.06) g[r][c] = true;
    seedGrid = g; grid = copy(g); still = 0; history = []; step = 0; started = false;
    if (ctx) nextTime = ctx.currentTime + 0.3;
    startMusic();
  }
  const ready = () => ctx && !muted && ctx.state === "running";

  // A gain envelope: quick attack, exponential decay.
  function env(peak, attack, decay, t = ctx.currentTime) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    g.connect(master);
    return g;
  }
  function tone(type, f0, f1, peak, attack, decay, t = ctx.currentTime) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + attack + decay);
    o.connect(env(peak, attack, decay, t));
    o.start(t); o.stop(t + attack + decay + 0.05);
  }
  let noiseBuf = null;
  function noise(filterType, f0, f1, q, peak, attack, decay, t = ctx.currentTime) {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter();
    src.buffer = noiseBuf;
    f.type = filterType; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(f1, t + attack + decay);
    src.connect(f).connect(env(peak, attack, decay, t));
    src.start(t); src.stop(t + attack + decay + 0.05);
  }

  return {
    unlock,
    get muted() { return muted; },
    set muted(v) {
      muted = !!v;
      try { localStorage.setItem("slingshot.muted", muted ? "1" : "0"); } catch {}
      if (muted) stopMusic(); else startMusic();
    },
    get music() { return musicOn; },
    set music(v) {
      musicOn = !!v;
      try { localStorage.setItem("slingshot.music", musicOn ? "1" : "0"); } catch {}
      if (musicOn) startMusic(); else stopMusic();
    },
    setLevel,
    // The probe passing a body at height y (world units); close is 0..1, 1 for a skim.
    flyby(y, close) {
      if (!timer || !ready()) return;
      bell(midiFor(rowFor(y)) + 12, ctx.currentTime + 0.01, 0.05 + 0.12 * close, 0);
    },
    // power 0..1: a rubber-band twang plus a whoosh, both bigger with more power
    launch(power) {
      if (!ready()) return;
      const p = Math.max(0.15, Math.min(1, power));
      tone("triangle", 180 + 220 * p, 70, 0.35 + 0.25 * p, 0.005, 0.18);
      noise("bandpass", 2400, 500, 1.2, 0.18 + 0.2 * p, 0.01, 0.35 + 0.2 * p);
    },
    // A soft click each time the pull crosses another fifth of full power
    tick(step) {
      if (!ready()) return;
      tone("sine", 600 + step * 140, 600 + step * 140, 0.06, 0.002, 0.04);
    },
    crash(kind) {
      if (!ready()) return;
      if (kind === "hole") {
        tone("sine", 420, 40, 0.4, 0.01, 0.9);          // a long fall into the hole
        noise("lowpass", 900, 80, 0.7, 0.15, 0.02, 0.8);
      } else if (kind === "repel") {
        noise("highpass", 3000, 6000, 0.7, 0.25, 0.005, 0.4); // a hiss
      } else {
        tone("sine", 110, 40, 0.6, 0.003, 0.35);         // a thud
        noise("lowpass", 1200, 150, 0.8, 0.3, 0.002, 0.25);
      }
    },
    // A rising major arpeggio; a hole in one adds a higher note
    win(holeInOne) {
      if (!ready()) return;
      const t = ctx.currentTime, notes = [659.25, 830.61, 987.77];
      if (holeInOne) notes.push(1318.51);
      notes.forEach((f, i) => {
        tone("sine", f, f, 0.22, 0.005, 1.1, t + i * 0.09);
        tone("triangle", f * 2, f * 2, 0.04, 0.005, 0.5, t + i * 0.09);
      });
    },
    miss() {
      if (!ready()) return;
      tone("sine", 260, 180, 0.15, 0.01, 0.25);
    },
  };
}
