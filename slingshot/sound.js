// Synthesized sound effects (Web Audio, no files). Browsers only allow audio after a user gesture,
// so the context is created on the first unlock() call, which the game makes on pointerdown.
// createSound() → { unlock, launch(power), tick(step), crash(kind), win(holeInOne), miss, muted }
function createSound() {
  let ctx = null, master = null;
  let muted = false;
  try { muted = localStorage.getItem("slingshot.muted") === "1"; } catch {}

  function unlock() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);
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
