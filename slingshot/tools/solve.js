// Solve every built-in level in Node and print its win rate.
// Usage: node tools/solve.js [fine|coarse] [levelNumber]
const { LEVELS, solve, suggestPar } = require("../core.js");
const grid = process.argv[2] || "coarse", only = process.argv[3] ? +process.argv[3] - 1 : null;
LEVELS.forEach((lv, i) => {
  if (only !== null && i !== only) return;
  const t0 = Date.now(), r = solve(lv, { grid });
  const ex = r.sample ? `${r.sample.angle}° @ ${r.sample.speed}` : "none";
  console.log(`${String(i + 1).padStart(2)}. ${lv.name.padEnd(16)} ${(100 * r.rate).toFixed(2).padStart(5)}%  wins ${String(r.wins).padStart(4)}/${r.total}  par ${lv.par} (suggest ${suggestPar(r.rate)})  e.g. ${ex}  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
});
