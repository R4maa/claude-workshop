// node lens/tools/check.js — tests the light-path integrator against results known from general relativity.
const Gd = require("../geodesic.js");
let fails = 0;
const ok = (name, cond, detail) => { console.log((cond ? "ok   " : "FAIL ") + name + (detail ? "  " + detail : "")); if (!cond) fails++; };
const pct = (a, b) => (100 * (a - b) / b).toFixed(2) + "%";

// 1. Bending of a passing ray. To second order: angle = 2/b + (15·pi/16)/b² (b in Schwarzschild radii).
for (const b of [200, 50, 20, 8]) {
  const t = Gd.trace([-6000, b, 0], [1, 0, 0], { far: 12000, maxSteps: 4000 });
  const got = Math.atan2(-t.dir[1], t.dir[0]);
  const want = 2 / b + (15 * Math.PI / 16) / (b * b);
  // The series itself is only good to about (1/b)³ relative size, so allow more for close passes.
  const tol = b >= 50 ? 0.005 : b >= 20 ? 0.02 : 0.08;
  ok("deflection at b = " + b, t.escaped && Math.abs(got - want) / want < tol,
    (got * 180 / Math.PI).toFixed(4) + "° vs series " + (want * 180 / Math.PI).toFixed(4) + "° (" + pct(got, want) + ")");
}

// 2. The critical impact parameter: rays aimed closer than 3·sqrt(3)/2 = 2.598 fall in.
{
  let lo = 2, hi = 3.2;
  for (let i = 0; i < 40; i++) {
    const b = (lo + hi) / 2;
    const t = Gd.trace([-400, b, 0], [1, 0, 0], { far: 800, maxSteps: 6000 });
    if (t.captured) lo = b; else hi = b;
  }
  ok("critical impact parameter", Math.abs(lo - Gd.B_CRIT) / Gd.B_CRIT < 0.005, lo.toFixed(4) + " vs " + Gd.B_CRIT.toFixed(4) + " (" + pct(lo, Gd.B_CRIT) + ")");
}

// 3. The shadow as the page draws it (300 steps, the page's own far limit), from several distances.
//    Rays that run out of steps are drawn black, so they count as shadow here too.
for (const d of [6, 12, 22, 40, 60]) {
  let lo = 0, hi = 1.2;
  for (let i = 0; i < 40; i++) {
    const a = (lo + hi) / 2;
    const t = Gd.trace([d, 0, 0], Gd.localToCoord([d, 0, 0], [-Math.cos(a), Math.sin(a), 0]));
    if (!t.escaped) lo = a; else hi = a;
  }
  const want = Gd.shadowAngle(d);
  ok("shadow radius seen from " + d, Math.abs(lo - want) / want < 0.01,
    (lo * 180 / Math.PI).toFixed(3) + "° vs exact " + (want * 180 / Math.PI).toFixed(3) + "° (" + pct(lo, want) + ")");
}

// 4. Step budget: how many steps ordinary rays need, and how many run out.
{
  let worst = 0, ranOut = 0, n = 0;
  for (const d of [6, 22, 60]) for (let a = 0.001; a < 1.2; a += 0.0007) {
    const t = Gd.trace([d, 0, 0], Gd.localToCoord([d, 0, 0], [-Math.cos(a), Math.sin(a), 0])); n++;
    if (!t.escaped && !t.captured) ranOut++; else worst = Math.max(worst, t.steps);
  }
  ok("step budget", ranOut / n < 0.002, "most steps used by a finished ray: " + worst + " of " + Gd.MAX_STEPS + "; rays that ran out: " + ranOut + " of " + n);
}

// 5. Light can circle at r = 1.5 (the photon sphere). The orbit is unstable, so only ask for half a lap.
{
  let maxDev = 0, angle = 0, prev = null;
  Gd.trace([1.5, 0, 0], [0, 1, 0], {
    far: 1e9, maxSteps: 4000,
    onStep: (p, pn) => {
      if (angle >= Math.PI) return;
      const a = Math.atan2(pn[1], pn[0]), b = Math.atan2(p[1], p[0]);
      let da = a - b; if (da < -Math.PI) da += 2 * Math.PI;
      angle += da; maxDev = Math.max(maxDev, Math.abs(Math.hypot(pn[0], pn[1]) - 1.5));
    },
  });
  ok("photon sphere at r = 1.5", angle >= Math.PI && maxDev < 0.02, "largest drift over half a lap: " + maxDev.toFixed(4));
}

console.log(fails ? fails + " check(s) failed" : "all checks passed");
process.exit(fails ? 1 : 0);
