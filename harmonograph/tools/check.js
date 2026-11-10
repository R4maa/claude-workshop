// node harmonograph/tools/check.js : tests for the harmonograph model. Exits 1 if anything fails.
const H = require('../harmonograph.js');
let fails = 0;
const ok = (name, cond, detail) => { console.log((cond ? 'ok   ' : 'FAIL ') + name + (detail ? '  ' + detail : '')); if (!cond) fails++; };

// 1. With no drift and no damping, p:q closes after one base period (carriers p and q are integers).
for (const iv of H.INTERVALS) {
  const f = H.makeFigure({ p: iv.p, q: iv.q, drift: 0, ring: 1e9, seed: 7 });
  const T = H.TAU / (1.5 * H.TAU); // base angular speed w0 = 1.5 turns/s -> period 1/1.5 s
  let worst = 0;
  for (let i = 0; i < 50; i++) {
    const t = i * 0.173;
    const a = H.pos(f, t), b = H.pos(f, t + T);
    worst = Math.max(worst, Math.abs(a.x - b.x), Math.abs(a.y - b.y));
  }
  ok(`${iv.p}:${iv.q} closes after one base period`, worst < 1e-6, `worst gap ${worst.toExponential(1)}`);
}

// 2. Ring time: swing is 1% of its start after exactly `ring` seconds, and never grows.
{
  const f = H.makeFigure({ p: 3, q: 2, drift: 10, ring: 60, seed: 3 });
  ok('envelope is 1% at the ring time', Math.abs(H.envelope(f, 60) - 0.01) < 1e-12);
  let maxR = 0, grew = false, prev = 1;
  for (let t = 0; t < 90; t += 0.01) { const e = H.envelope(f, t); if (e > prev) grew = true; prev = e; const p = H.pos(f, t); maxR = Math.max(maxR, Math.abs(p.x), Math.abs(p.y)); }
  ok('envelope never grows', !grew);
  ok('pen never leaves the unit square', maxR <= 1 + 1e-12, `max ${maxR.toFixed(4)}`);
}

// 3. Beating: the slow envelope formula matches the measured swing of one axis over a carrier cycle.
for (const drift of [8, 25, 50]) {
  const f = H.makeFigure({ p: 3, q: 2, drift, ring: 1e9, seed: 11 });
  let worst = 0;
  for (const t0 of [0, 4.1, 9.7, 20, 33.3, 61]) {
    // largest |x| over one carrier cycle vs the largest beat envelope in that same cycle
    const win = 1 / (f.rel[0] * 1.5);
    let m = 0, predicted = 0;
    for (let t = t0; t < t0 + win; t += win / 4000) {
      m = Math.max(m, Math.abs(H.pos(f, t).x));
      predicted = Math.max(predicted, H.beatEnvelope(f, 0, t));
    }
    worst = Math.max(worst, Math.abs(m - predicted));
  }
  ok(`x swing matches the beat envelope (drift ${drift} cents)`, worst < 0.03, `worst gap ${worst.toFixed(4)} of full scale`);
}

// 4. The partner is detuned by the stated number of cents, in opposite directions on the two axes.
{
  const f = H.makeFigure({ p: 5, q: 3, drift: 20, ring: 60, seed: 1 });
  const cx = 1200 * Math.log2(f.rel[1] / f.rel[0]);
  const cy = 1200 * Math.log2(f.rel[3] / f.rel[2]);
  ok('x partner is +drift cents', Math.abs(cx - 20) < 1e-9, cx.toFixed(6));
  ok('y partner is -drift cents', Math.abs(cy + 20) < 1e-9, cy.toFixed(6));
}

// 5. Intervals are the ones named: cents of p:q match the textbook just values.
{
  const want = { fifth: 701.955, fourth: 498.045, third: 386.314, sixth: 884.359, octave: 1200 };
  for (const iv of H.INTERVALS) if (want[iv.id]) {
    const c = H.cents(iv.p, iv.q);
    ok(`${iv.name} is ${want[iv.id]} cents`, Math.abs(c - want[iv.id]) < 0.001, c.toFixed(3));
  }
}

// 6. Same seed, same figure; different seed, different figure.
{
  const a = H.makeFigure({ p: 3, q: 2, drift: 12, ring: 60, seed: 5 });
  const b = H.makeFigure({ p: 3, q: 2, drift: 12, ring: 60, seed: 5 });
  const c = H.makeFigure({ p: 3, q: 2, drift: 12, ring: 60, seed: 6 });
  ok('deterministic per seed', JSON.stringify(a) === JSON.stringify(b));
  ok('different seeds differ', JSON.stringify(a.phase) !== JSON.stringify(c.phase));
}

// 7. Sound strengths sum to at most 2 (one per axis) and follow the envelope.
{
  const f = H.makeFigure({ p: 4, q: 3, drift: 12, ring: 60, seed: 9 });
  const s0 = H.strengths(f, 0), s30 = H.strengths(f, 30);
  const sum = a => a.reduce((x, y) => x + y, 0);
  ok('strengths at t=0 sum to 2', Math.abs(sum(s0) - 2) < 1e-12);
  ok('strengths decay with the envelope', Math.abs(sum(s30) / sum(s0) - H.envelope(f, 30)) < 1e-12);
}

console.log(fails ? `\n${fails} FAILED` : '\nall passed');
process.exit(fails ? 1 : 0);
