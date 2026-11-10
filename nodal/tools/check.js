// node nodal/tools/check.js — checks the plate model and that sand really finds the nodal lines.
const P = require("../plate.js");
const G1 = P.G + 1;
let fails = 0;
const ok = (name, cond, detail) => { console.log((cond ? "ok   " : "FAIL ") + name + (detail ? "  " + detail : "")); if (!cond) fails++; };

// Small seeded generator so runs repeat.
let seed = 12345;
const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

// 1. The analytic rms (from orthogonality) matches the rms measured on the grid.
{
  const amp = new Float32Array(G1 * G1);
  let worst = 0;
  for (const [f, x0, y0] of [[600, 0.5, 0.5], [437, 0.31, 0.77], [2210, 0.1, 0.5], [95, 0.9, 0.2]]) {
    P.field(f, x0, y0, amp);
    // trapezoid weights: edges count half
    let s = 0, w = 0;
    for (let j = 0; j < G1; j++) for (let i = 0; i < G1; i++) {
      const wt = (i === 0 || i === P.G ? 0.5 : 1) * (j === 0 || j === P.G ? 0.5 : 1);
      s += wt * amp[j * G1 + i] ** 2; w += wt;
    }
    worst = Math.max(worst, Math.abs(Math.sqrt(s / w) - 1));
  }
  ok("analytic rms matches grid rms", worst < 0.01, "worst error " + worst.toFixed(5));
}

// 2. Centre drive at 120 Hz excites (2,0)+(0,2): nodal set is cos(2πx) + cos(2πy) = 0.
{
  const amp = new Float32Array(G1 * G1);
  P.field(120, 0.5, 0.5, amp);
  let onLine = 0, n = 0, offLine = 0, m = 0;
  for (let j = 0; j < G1; j++) for (let i = 0; i < G1; i++) {
    const t = Math.cos(2 * Math.PI * i / P.G) + Math.cos(2 * Math.PI * j / P.G);
    if (Math.abs(t) < 0.03) { onLine += amp[j * G1 + i]; n++; }
    if (Math.abs(t) > 1.2) { offLine += amp[j * G1 + i]; m++; }
  }
  ok("120 Hz centre drive gives the (2,0)+(0,2) figure", onLine / n < 0.08 && offLine / m > 1,
    "mean |u| on line " + (onLine / n).toFixed(3) + ", away " + (offLine / m).toFixed(3));
}

// 3. Sand settles: the shaking under an average grain falls a long way. Off-centre drivers mix
// neighbouring modes that are out of step with each other, so their lines are blurrier (as on a real plate).
for (const [f, x0, y0] of [[600, 0.5, 0.5], [1200, 0.5, 0.5], [390, 0.2, 0.35], [2600, 0.5, 0.5]]) {
  const amp = new Float32Array(G1 * G1);
  P.field(f, x0, y0, amp);
  const N = 8000, px = new Float32Array(N), py = new Float32Array(N);
  for (let k = 0; k < N; k++) { px[k] = rand(); py[k] = rand(); }
  const mean = () => { let s = 0; for (let k = 0; k < N; k++) s += P.sample(amp, px[k], py[k]); return s / N; };
  const before = mean();
  let lost = 0;
  for (let t = 0; t < 600; t++) P.stepSand(px, py, N, amp, 0.012, rand);
  for (let k = 0; k < N; k++) if (!(px[k] >= 0 && px[k] <= 1 && py[k] >= 0 && py[k] <= 1)) lost++;
  const after = mean();
  ok("sand settles at " + f + " Hz, driver " + x0 + "," + y0, after < (x0 === 0.5 ? 0.3 : 0.5) * before && lost === 0,
    "mean shake " + before.toFixed(2) + " → " + after.toFixed(2) + " after 600 steps, lost " + lost);
}

// 4. Resonances: sensible counts, and the level really peaks at them.
{
  const centre = P.resonances(0.5, 0.5), off = P.resonances(0.23, 0.37);
  let peaked = 0;
  for (const r of centre) if (P.level(r.f, 0.5, 0.5) > 3 * P.level(r.f * 1.06, 0.5, 0.5) || r.f > 1500) peaked++;
  ok("centre driver resonances", centre.length >= 10 && centre.length <= 40 && peaked === centre.length,
    centre.length + " (all even modes: " + centre.every((r) => r.modes.every(([m, n]) => m % 2 === 0 && n % 2 === 0)) + "), off-centre " + off.length);
  const lv = centre.map((r) => P.level(r.f, 0.5, 0.5));
  console.log("     level at centre resonances: min " + Math.min(...lv).toFixed(2) + " max " + Math.max(...lv).toFixed(2));
  let lo = Infinity; for (let f = P.FMIN; f < P.FMAX; f *= 1.01) lo = Math.min(lo, P.level(f, 0.5, 0.5));
  console.log("     quietest level in the sweep: " + lo.toFixed(3));
}

// 5. Speed of one field build.
{
  const amp = new Float32Array(G1 * G1), t0 = Date.now();
  for (let k = 0; k < 50; k++) P.field(500 + k, 0.4, 0.6, amp);
  console.log("     field build: " + ((Date.now() - t0) / 50).toFixed(2) + " ms");
}

console.log(fails ? fails + " check(s) failed" : "all checks passed");
process.exit(fails ? 1 : 0);
