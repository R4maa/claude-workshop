// Nodal: a driven square plate with sand on it. Loads in the browser (window.Plate) and in Node.
//
// Model. The plate's modes are taken as cos(m·pi·x)·cos(n·pi·y) on the unit square, with
// frequencies F0·(m² + n²). That is the classic approximation for a plate with free edges (the true
// free-plate modes have no closed form). A point driver at (x0, y0) vibrating at frequency f excites
// every mode by how much that mode moves at the driver, divided by a damped resonance denominator:
//
//   u(x, y) = sum over m,n of  e_m·e_n · mode(x0, y0) · mode(x, y) / (f_mn² − f² + i·f_mn·f / Q)
//
// (e_0 = 1, otherwise 2: the usual normalisation of cosine modes.) The sum is complex because damped
// modes lag the driver; sand collects where |u| is small.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Plate = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const M = 13;        // modes 0..M in each direction
  const F0 = 30;       // Hz; mode (m, n) rings at F0·(m² + n²)
  const Q = 90;        // quality factor: a resonance at f is about f / Q wide
  const G = 160;       // the field is sampled on (G+1) × (G+1) points
  const FMIN = 60, FMAX = 3200;
  const N1 = M + 1, G1 = G + 1;

  const COS = new Float32Array(N1 * G1); // COS[m·G1 + i] = cos(m·pi·i/G)
  for (let m = 0; m < N1; m++) for (let i = 0; i < G1; i++) COS[m * G1 + i] = Math.cos(m * Math.PI * i / G);

  const eps = (m) => (m === 0 ? 1 : 2);
  const re = new Float64Array(N1 * N1), im = new Float64Array(N1 * N1);
  const tr = new Float64Array(N1), ti = new Float64Array(N1);

  // Complex amplitude of every mode, scaled by f²/Q so one fully driven mode has size e_m·e_n.
  // Returns the plate-wide rms of |u| (exact, because the modes are orthogonal).
  function coeffs(f, x0, y0) {
    let sum = 0;
    const scale = f * f / Q;
    for (let m = 0; m < N1; m++) {
      const cm = Math.cos(m * Math.PI * x0);
      for (let n = 0; n < N1; n++) {
        const k = m * N1 + n;
        if (m + n === 0) { re[k] = im[k] = 0; continue; } // (0,0) is the whole plate moving: no pattern
        const fmn = F0 * (m * m + n * n);
        const e = eps(m) * eps(n);
        const w = e * cm * Math.cos(n * Math.PI * y0) * scale;
        const dr = fmn * fmn - f * f, di = fmn * f / Q, den = dr * dr + di * di;
        re[k] = w * dr / den; im[k] = -w * di / den;
        sum += (re[k] * re[k] + im[k] * im[k]) / e;
      }
    }
    return Math.sqrt(sum);
  }

  // How hard the plate rings at f, without building the field.
  function level(f, x0, y0) { return coeffs(f, x0, y0); }

  // Fill amp ((G+1)² floats, row = y) with |u| / rms, so 1 is a typical amount of shaking.
  function field(f, x0, y0, amp) {
    const rms = coeffs(f, x0, y0), inv = rms > 0 ? 1 / rms : 0;
    for (let j = 0; j < G1; j++) {
      for (let m = 0; m < N1; m++) {
        let a = 0, b = 0;
        for (let n = 0; n < N1; n++) { const c = COS[n * G1 + j]; a += re[m * N1 + n] * c; b += im[m * N1 + n] * c; }
        tr[m] = a; ti[m] = b;
      }
      const row = j * G1;
      for (let i = 0; i < G1; i++) {
        let a = 0, b = 0;
        for (let m = 0; m < N1; m++) { const c = COS[m * G1 + i]; a += tr[m] * c; b += ti[m] * c; }
        amp[row + i] = Math.sqrt(a * a + b * b) * inv;
      }
    }
    return rms;
  }

  // Resonances this driver position can excite between FMIN and FMAX, lowest first.
  // strength is the rms the plate would reach there from those modes alone (0..~2.8).
  function resonances(x0, y0, minStrength) {
    const byK = new Map();
    for (let m = 0; m < N1; m++) for (let n = 0; n < N1; n++) {
      const k = m * m + n * n, f = F0 * k;
      if (k === 0 || f < FMIN || f > FMAX) continue;
      const e = eps(m) * eps(n), p = Math.cos(m * Math.PI * x0) * Math.cos(n * Math.PI * y0);
      let r = byK.get(k);
      if (!r) byK.set(k, r = { f, s2: 0, modes: [] });
      r.s2 += e * p * p;
      if (Math.abs(p) > 0.2) r.modes.push([m, n]);
    }
    const out = [];
    for (const r of byK.values()) {
      const strength = Math.sqrt(r.s2);
      if (strength >= (minStrength || 0.6)) out.push({ f: r.f, strength, modes: r.modes });
    }
    return out.sort((a, b) => a.f - b.f);
  }

  function sample(amp, x, y) {
    const gx = x * G, gy = y * G;
    let i = gx | 0, j = gy | 0;
    if (i >= G) i = G - 1; if (j >= G) j = G - 1;
    const u = gx - i, v = gy - j, k = j * G1 + i;
    return (amp[k] * (1 - u) + amp[k + 1] * u) * (1 - v) + (amp[k + G1] * (1 - u) + amp[k + G1 + 1] * u) * v;
  }

  // One bounce for every grain: a random hop whose size follows how hard the plate shakes there.
  // Grains that would leave bounce back off the edge.
  function stepSand(px, py, count, amp, stepMax, rand) {
    for (let k = 0; k < count; k++) {
      let x = px[k], y = py[k];
      let s = sample(amp, x, y) * 0.8; if (s > 1) s = 1;
      s *= stepMax;
      x += (rand() * 2 - 1) * s; y += (rand() * 2 - 1) * s;
      if (x < 0) x = -x; else if (x > 1) x = 2 - x;
      if (y < 0) y = -y; else if (y > 1) y = 2 - y;
      px[k] = x; py[k] = y;
    }
  }

  return { M, F0, Q, G, FMIN, FMAX, field, level, resonances, sample, stepSand };
});
