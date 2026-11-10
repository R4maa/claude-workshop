// Checks for the river model. node meander/tools/check.js  (all lines should say ok)
const M = require("../meander.js");
const { P, WORLD } = M;
let failed = 0;
const ok = (name, pass, detail) => { console.log(`${pass ? "ok  " : "FAIL"} ${name}${detail ? "  (" + detail + ")" : ""}`); if (!pass) failed++; };

// 1. Curvature of a circle of radius R is 1/R, with the sign of the turning direction.
{
  const R = 60, n = 200, r = { x: [], y: [], n };
  for (let i = 0; i < n; i++) { const a = (i / n) * 3; r.x.push(R * Math.cos(a)); r.y.push(R * Math.sin(a)); }
  const K = M.curvature(r, new Array(n));
  ok("curvature of a circle", Math.abs(K[100] * R - 1) < 0.01, `k·R = ${(K[100] * R).toFixed(4)}`);
}

// 2. A long, even bend moves towards its outside (away from the centre of curvature).
{
  const r = M.create(3), R = 120, cx = 1200, cy = 675 + R;
  r.x = []; r.y = [];
  for (let a = -1.2; a <= 1.2; a += P.ds / R) { r.x.push(cx + R * Math.sin(a)); r.y.push(cy - R * Math.cos(a)); }
  r.n = r.x.length;
  const mid = r.n >> 1, before = Math.hypot(r.x[mid] - cx, r.y[mid] - cy);
  const rate = M.rates(r)[mid];
  const tx = r.x[mid + 1] - r.x[mid - 1], ty = r.y[mid + 1] - r.y[mid - 1], tl = Math.hypot(tx, ty);
  const nx = r.x[mid] + (ty / tl) * rate, ny = r.y[mid] - (tx / tl) * rate;
  ok("bends grow outwards", Math.hypot(nx - cx, ny - cy) > before, `apex moves ${(Math.hypot(nx - cx, ny - cy) - before).toFixed(3)} per year`);
}

// 3. Two reaches pressed together are cut, the loop becomes a lake, and nothing is lost.
{
  const r = M.create(5);
  r.x = []; r.y = [];
  const put = (x, y) => { r.x.push(x); r.y.push(y); };
  for (let x = 0; x <= 1000; x += P.ds) put(x, 600);                       // out
  for (let a = 0; a <= Math.PI; a += P.ds / 100) put(1000 + 100 * Math.sin(a), 700 - 100 * Math.cos(a)); // round a hairpin
  for (let x = 1000; x >= 990; x -= P.ds) put(x, 800);
  for (let a = 0; a <= Math.PI; a += P.ds / 96) put(990 - 96 * Math.sin(a), 704 + 96 * Math.cos(a));      // and back to within 8 units of the start line
  for (let x = 990; x <= 2000; x += P.ds) put(x, 608 + (x - 990) * 0.2);
  r.n = r.x.length;
  const before = r.n, made = M.cutoffs(r);
  const lakeN = r.lakes.reduce((s, l) => s + l.x.length, 0);
  ok("a touching loop is cut off", made >= 1 && r.n < before - 80, `${before} points -> ${r.n}, ${made} cut`);
  ok("the loop is kept as a lake", r.lakes.length === 1 && lakeN > 60, `${lakeN} lake points`);
}

// 4. Re-spacing keeps the ends and gives even spacing.
{
  const r = M.create(9);
  for (let k = 0; k < 300; k++) M.step(r, 1);
  let lo = 1e9, hi = 0;
  for (let i = 1; i < r.n; i++) { const d = Math.hypot(r.x[i] - r.x[i - 1], r.y[i] - r.y[i - 1]); lo = Math.min(lo, d); hi = Math.max(hi, d); }
  ok("points stay evenly spaced", lo > 0.8 * P.ds && hi < 1.2 * P.ds, `${lo.toFixed(2)} to ${hi.toFixed(2)}, target ${P.ds}`);
  ok("the ends stay put", r.x[0] === WORLD.x0 && r.x[r.n - 1] === WORLD.x1);
}

// 5. Long runs from several seeds: finite, inside the valley, still meandering and still cutting at the end.
{
  const years = 12000, seeds = [1, 7, 42, 2026, 99991];
  let worst = "", allOk = true, sinSum = 0, sinN = 0, t0 = Date.now(), steps = 0;
  for (const seed of seeds) {
    const r = M.create(seed);
    let bad = 0, outside = 0, lateCuts = 0, minSin = 9, maxSin = 0, maxN = 0;
    for (let k = 1; k <= years; k++) {
      const made = M.step(r, 1); steps++;
      if (k > years - 2000) lateCuts += made;
      if (k % 100 === 0) {
        for (let i = 0; i < r.n; i++) {
          if (!isFinite(r.x[i] + r.y[i])) bad++;
          else if (r.y[i] < r.walls.top(r.x[i]) || r.y[i] > r.walls.bot(r.x[i])) outside++;
        }
        const s = M.sinuosity(r); maxN = Math.max(maxN, r.n);
        if (k > 2000) { minSin = Math.min(minSin, s); maxSin = Math.max(maxSin, s); sinSum += s; sinN++; }
      }
    }
    const pass = !bad && !outside && minSin > 1.6 && maxSin < 6 && lateCuts >= 5;
    if (!pass) allOk = false;
    worst += `\n       seed ${seed}: sinuosity ${minSin.toFixed(2)}-${maxSin.toFixed(2)}, ${r.cutoffs} cutoffs (${lateCuts} in the last 2000 years), up to ${maxN} points${bad ? ", NaN!" : ""}${outside ? `, ${outside} points outside the valley` : ""}`;
  }
  ok(`${seeds.length} rivers over ${years} years stay healthy`, allOk, `mean sinuosity after year 2000: ${(sinSum / sinN).toFixed(2)}; ${((Date.now() - t0) / steps).toFixed(2)} ms a step${worst}`);
}

// 6. Dragging cannot push the river through a wall.
{
  const r = M.create(11);
  for (let k = 0; k < 50; k++) M.pull(r, r.n >> 1, 0, -200, 16);
  let outside = 0;
  for (let i = 0; i < r.n; i++) if (r.y[i] < r.walls.top(r.x[i]) || r.y[i] > r.walls.bot(r.x[i])) outside++;
  ok("a drag stops at the valley wall", outside === 0);
}

console.log(failed ? `\n${failed} check(s) failed` : "\nall checks passed");
process.exit(failed ? 1 : 0);
