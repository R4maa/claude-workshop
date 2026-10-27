// Generate the daily level for a run of dates and report how hard each was to find.
// Usage: node tools/daily.js [startDate YYYY-MM-DD] [days]
const { generateDaily, solve, WEEKDAYS, weekdayOf, utcDate } = require("../core.js");
const start = process.argv[2] || utcDate(), days = +(process.argv[3] || 14);
let slow = 0, fallback = 0, totalMs = 0;
for (let i = 0; i < days; i++) {
  const date = new Date(Date.parse(start + "T00:00:00Z") + i * 86400000).toISOString().slice(0, 10);
  const t0 = Date.now(), d = generateDaily(date), ms = Date.now() - t0;
  totalMs += ms;
  if (ms > 8000) slow++;
  if (d.attempt < 0) fallback++;
  const fine = opts().fine ? solve(d.level, { grid: "fine" }) : null;
  console.log(
    `${date} ${WEEKDAYS[weekdayOf(date)].slice(0, 3)}  try ${String(d.attempt).padStart(2)}  ` +
    `${d.rate === null ? "fallback" : (100 * d.rate).toFixed(2) + "%"}  par ${d.level.par}  ` +
    `${d.level.bodies.length} bodies  ${(ms / 1000).toFixed(1)}s  ${d.level.name}` + (fine ? `  fine ${(100 * fine.rate).toFixed(2)}%` : "")
  );
}
console.log(`\naverage ${(totalMs / days / 1000).toFixed(1)}s, over 8s: ${slow}, fallbacks: ${fallback}`);
function opts() { return { fine: process.argv.includes("--fine") }; }
