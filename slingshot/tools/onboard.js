// How many of each level's fine-grid wins stay on screen the whole way ("seen": never more than
// ONBOARD_MARGIN past the board's edge). A level whose wins mostly loop off the board can't be seen or
// planned, so it's unfair even though the solver can win it.
// Usage: node tools/onboard.js [levels|daily] [startDate] [days]
const { LEVELS, solve, generateDaily, utcDate, WEEKDAYS, weekdayOf } = require("../core.js");
const fmt = (name, { wins, seen }) =>
  `${name.padEnd(28)} wins ${String(wins).padStart(4)}  seen ${String(seen).padStart(4)}  (${wins ? Math.round((100 * seen) / wins) : 0}%)`;
if (process.argv[2] === "daily") {
  const start = process.argv[3] || utcDate(), days = +(process.argv[4] || 14);
  for (let i = 0; i < days; i++) {
    const date = new Date(Date.parse(start + "T00:00:00Z") + i * 86400000).toISOString().slice(0, 10);
    const d = generateDaily(date);
    console.log(fmt(`${date} ${WEEKDAYS[weekdayOf(date)].slice(0, 3)} try ${d.attempt} par ${d.level.par}`, solve(d.level, { grid: "fine" })));
  }
} else LEVELS.forEach((lv, i) => console.log(fmt(`${i + 1}. ${lv.name}`, solve(lv, { grid: "fine" }))));
