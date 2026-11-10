// Lens: light paths around a non-spinning (Schwarzschild) black hole. Loads in the browser and in Node.
//
// Lengths are in Schwarzschild radii (r_s = 1, so the hole's mass is M = 1/2 with G = c = 1).
// A light ray's path obeys, exactly,
//
//     d²x/ds² = −(3/2) · h² · x / r⁵        with h = |x × dx/ds| constant along the ray
//
// (this is the Binet equation u'' + u = (3/2)·u² for u = 1/r, written as a force law). The fragment
// shader in index.html integrates the same equation with the same step rule; this file is the copy that
// tools/check.js can test against known results. Keep the two in step.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Geodesic = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const MAX_STEPS = 300;
  const B_CRIT = 1.5 * Math.sqrt(3); // critical impact parameter: closer rays fall in
  let STEP_FAR = 0.1;
  const mix = (a, b, t) => a + (b - a) * t;
  const smoothstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // Small steps near the hole, long ones far away.
  const stepSize = (r) => r * mix(0.045, STEP_FAR, smoothstep(2.5, 18, r));

  // Trace a ray from p (array of 3) along unit direction v. Returns where it ended up.
  // opts: grav (1, or 0 for flat space), far (stop distance), maxSteps, onStep(p, pn).
  function trace(p0, v0, opts) {
    opts = opts || {};
    const grav = opts.grav === undefined ? 1 : opts.grav;
    const far = opts.far || Math.max(60, 2 * Math.hypot(p0[0], p0[1], p0[2]));
    const maxSteps = opts.maxSteps || MAX_STEPS;
    let px = p0[0], py = p0[1], pz = p0[2], vx = v0[0], vy = v0[1], vz = v0[2];
    const hx = py * vz - pz * vy, hy = pz * vx - px * vz, hz = px * vy - py * vx;
    const k = -1.5 * grav * (hx * hx + hy * hy + hz * hz);
    let r2 = px * px + py * py + pz * pz, r = Math.sqrt(r2), minR = r;
    let f = k / (r2 * r2 * r), ax = f * px, ay = f * py, az = f * pz;
    let steps = 0, captured = false, escaped = false;
    for (; steps < maxSteps; steps++) {
      if (r < 1) { captured = true; break; }
      if (r > far && px * vx + py * vy + pz * vz > 0) { escaped = true; break; }
      const dt = stepSize(r), hdt = 0.5 * dt;
      vx += ax * hdt; vy += ay * hdt; vz += az * hdt;
      const nx = px + vx * dt, ny = py + vy * dt, nz = pz + vz * dt;
      if (opts.onStep) opts.onStep([px, py, pz], [nx, ny, nz]);
      px = nx; py = ny; pz = nz;
      r2 = px * px + py * py + pz * pz; r = Math.sqrt(r2); if (r < minR) minR = r;
      f = k / (r2 * r2 * r); ax = f * px; ay = f * py; az = f * pz;
      vx += ax * hdt; vy += ay * hdt; vz += az * hdt;
    }
    const vl = Math.hypot(vx, vy, vz);
    return { captured, escaped, steps, minR, pos: [px, py, pz], dir: [vx / vl, vy / vl, vz / vl] };
  }

  // A camera hovering at p sees a ray arrive from local direction v (unit). Space is stretched along the
  // radial direction there, so the direction in the coordinates the tracer uses has its radial part
  // shrunk by sqrt(1 − 1/r). Returns the unit coordinate direction.
  function localToCoord(p, v) {
    const r = Math.hypot(p[0], p[1], p[2]), e = [p[0] / r, p[1] / r, p[2] / r];
    const vr = v[0] * e[0] + v[1] * e[1] + v[2] * e[2], s = (Math.sqrt(1 - 1 / r) - 1) * vr;
    const o = [v[0] + s * e[0], v[1] + s * e[1], v[2] + s * e[2]], l = Math.hypot(o[0], o[1], o[2]);
    return [o[0] / l, o[1] / l, o[2] / l];
  }

  // Angular radius of the hole's shadow for a static observer at distance d (exact).
  const shadowAngle = (d) => Math.asin(Math.min(1, (B_CRIT / d) * Math.sqrt(1 - 1 / d)));

  return { MAX_STEPS, B_CRIT, stepSize, trace, localToCoord, shadowAngle, _setStepFar: (x) => { STEP_FAR = x; } };
});
