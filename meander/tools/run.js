// Tuning aid: run a river and print how it develops. node meander/tools/run.js [seed] [years]
const M = require("../meander.js");
const seed = +process.argv[2] || 7, years = +process.argv[3] || 8000;
const r = M.create(seed);
const t0 = Date.now();
let lastCuts = 0;
for (let k = 1; k <= years; k++) {
  M.step(r, 1);
  if (k % 500 === 0) {
    const K = M.curvature(r, new Array(r.n));
    let kmax = 0, ymin = 1e9, ymax = -1e9, bad = 0;
    for (let i = 0; i < r.n; i++) { kmax = Math.max(kmax, Math.abs(K[i]) * M.P.W); ymin = Math.min(ymin, r.y[i]); ymax = Math.max(ymax, r.y[i]); if (!isFinite(r.x[i] + r.y[i])) bad++; }
    console.log(`t=${k} n=${r.n} sin=${M.sinuosity(r).toFixed(2)} cuts=${r.cutoffs} (+${r.cutoffs - lastCuts}) lakes=${r.lakes.length} maxKW=${kmax.toFixed(2)} y=[${ymin.toFixed(0)},${ymax.toFixed(0)}] bad=${bad}`);
    lastCuts = r.cutoffs;
  }
}
console.log(`${((Date.now() - t0) / years).toFixed(3)} ms per step`);
