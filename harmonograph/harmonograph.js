/* Harmonograph model: four damped pendulums, two steering the pen left-right, two up-down.
   Also loads in Node (module.exports) so tools/check.js can test it.

   x(t) = e^(-d t) · ( a0·sin(w0·t + φ0) + a1·sin(w1·t + φ1) ) / (a0 + a1)
   y(t) = e^(-d t) · ( a2·sin(w2·t + φ2) + a3·sin(w3·t + φ3) ) / (a2 + a3)

   An interval p:q sets the carriers: x swings at p, y at q (times a base angular speed).
   Each axis has a second pendulum tuned a little off its partner ("drift", in cents). The two
   beat against each other, so the figure slowly turns inside out instead of just shrinking:
   that beating is also what you hear when the same four ratios drive the sound. */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2;

  // Just intervals p:q (p swings x, q swings y).
  const INTERVALS = [
    { id: 'unison', name: 'Unison', p: 1, q: 1 },
    { id: 'octave', name: 'Octave', p: 2, q: 1 },
    { id: 'fifth', name: 'Fifth', p: 3, q: 2 },
    { id: 'fourth', name: 'Fourth', p: 4, q: 3 },
    { id: 'third', name: 'Major third', p: 5, q: 4 },
    { id: 'sixth', name: 'Major sixth', p: 5, q: 3 },
    { id: 'tritone', name: 'Tritone', p: 7, q: 5 },
  ];

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const cents = (p, q) => 1200 * Math.log2(p / q);

  // o: { p, q, drift (cents), ring (seconds until the swing is 1% of its start), seed, w0 (rad/s) }
  function makeFigure(o) {
    const rnd = mulberry32(o.seed >>> 0);
    const w0 = o.w0 || TAU * 1.5;
    const k = Math.pow(2, (o.drift || 0) / 1200);          // frequency ratio of the detuned partner
    const rel = [o.p, o.p * k, o.q, o.q / k];              // relative frequencies, one per pendulum
    const amp = [1, 0.7 + 0.3 * rnd(), 1, 0.7 + 0.3 * rnd()];
    const phase = [0, 1, 2, 3].map(() => rnd() * TAU);
    return {
      p: o.p, q: o.q, drift: o.drift || 0, ring: o.ring,
      rel, w: rel.map(r => r * w0), amp, phase,
      d: Math.log(100) / o.ring,
      norm: [amp[0] + amp[1], amp[2] + amp[3]],
    };
  }

  const envelope = (f, t) => Math.exp(-f.d * t);

  function pos(f, t, out) {
    const e = Math.exp(-f.d * t);
    const x = e * (f.amp[0] * Math.sin(f.w[0] * t + f.phase[0]) + f.amp[1] * Math.sin(f.w[1] * t + f.phase[1])) / f.norm[0];
    const y = e * (f.amp[2] * Math.sin(f.w[2] * t + f.phase[2]) + f.amp[3] * Math.sin(f.w[3] * t + f.phase[3])) / f.norm[1];
    if (out) { out.x = x; out.y = y; return out; }
    return { x, y };
  }

  // Strength of each pendulum at time t, 0..1 of the loudest possible (for the sound).
  function strengths(f, t) {
    const e = Math.exp(-f.d * t);
    return [f.amp[0] / f.norm[0] * e, f.amp[1] / f.norm[0] * e, f.amp[2] / f.norm[1] * e, f.amp[3] / f.norm[1] * e];
  }

  // Slow beat envelope of one axis (0 = x, 1 = y), without the decay: the size of that axis's swing
  // after averaging over the fast carrier.
  function beatEnvelope(f, axis, t) {
    const i = axis * 2;
    const a = f.amp[i], b = f.amp[i + 1];
    const c = Math.cos((f.w[i + 1] - f.w[i]) * t + f.phase[i + 1] - f.phase[i]);
    return Math.sqrt(a * a + b * b + 2 * a * b * c) / f.norm[axis];
  }

  const api = { INTERVALS, makeFigure, pos, envelope, strengths, beatEnvelope, mulberry32, cents, TAU };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Harmonograph = api;
})(typeof self !== 'undefined' ? self : this);
