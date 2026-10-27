// Round-trips every built-in level (without orbiting bodies, which the editor can't make) through a share link.
const { LEVELS, encodeLevel, decodeLevel, simulate } = require("../core.js");
let fail = 0;
for (const lv of LEVELS) {
  const flat = { ...lv, bodies: lv.bodies.filter((b) => !b.orbit) };
  const code = encodeLevel(flat), back = decodeLevel(code);
  // Same physics: a handful of launches must give identical outcomes.
  const same = [[5, 1], [3, -2], [-1, 6], [7, 0.5]].every(([vx, vy]) => {
    const a = simulate(flat, vx, vy), b = simulate(back, vx, vy);
    return a.result === b.result && Math.abs(a.t - b.t) < 1e-9;
  });
  if (!same) fail++;
  console.log(`${same ? "ok  " : "FAIL"} ${lv.name.padEnd(16)} ${code.length} chars`);
}
for (const bad of ["", "abc", "!!!", encodeLevel({ ...LEVELS[0], pad: [99999, 0] })]) {
  try { decodeLevel(bad); console.log("FAIL accepted bad link:", bad.slice(0, 20)); fail++; }
  catch (e) { console.log("ok   rejects bad link →", e.message); }
}
process.exit(fail ? 1 : 0);
