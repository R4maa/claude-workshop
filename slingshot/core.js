/*CORE-START*/
// World is 1000 × 625 units, y down. One time unit is one frame at normal speed (1/60 s).
const WORLD = { w: 1000, h: 625 };
const PHYS = { G: 1, EPS2: 100, DT: 0.25, MAX_T: 900, MAX_SPEED: 9, PROBE_R: 4, MARGIN: 260 };

const LEVELS = [
  {
    name: "First Light", par: 2,
    tip: "Drag back from anywhere and let go. Gravity bends every shot, so you rarely aim straight at the target.",
    pad: [120, 312], target: { x: 880, y: 312, r: 34 },
    bodies: [{ kind: "planet", name: "Tethys", x: 500, y: 430, r: 40, m: 1800 }],
  },
  {
    name: "Around the Bend", par: 2,
    tip: "Vesta Major is in the way. Curve around it instead of through it.",
    pad: [120, 500], target: { x: 880, y: 140, r: 26 },
    bodies: [{ kind: "planet", name: "Vesta Major", x: 500, y: 320, r: 70, m: 2600 }],
  },
  {
    name: "Twins", par: 2,
    tip: "The gap between Castor and Pollux is the only clear road.",
    pad: [100, 312], target: { x: 900, y: 500, r: 24 },
    bodies: [
      { kind: "planet", name: "Castor", x: 480, y: 195, r: 55, m: 2200 },
      { kind: "planet", name: "Pollux", x: 480, y: 430, r: 55, m: 2200 },
      { kind: "rock", name: "a boulder", x: 760, y: 330, r: 34, m: 0 },
    ],
  },
  {
    name: "Little Moon", par: 2,
    tip: "Moons move. Deimos circles Phobos, and every shot starts its clock again, so the same aim always meets the moon in the same place.",
    pad: [120, 470], target: { x: 880, y: 170, r: 32 },
    bodies: [
      { kind: "planet", name: "Phobos", x: 500, y: 320, r: 42, m: 1600 },
      { kind: "planet", name: "Deimos", r: 14, m: 200, orbit: { cx: 500, cy: 320, R: 120, w: 0.01, ph: 0.6 } },
    ],
  },
  {
    name: "Moonrise", par: 2,
    tip: "Little Io circles Callisto. Every shot starts the clock again, so its timing is always the same.",
    pad: [100, 500], target: { x: 900, y: 140, r: 26 },
    bodies: [
      { kind: "planet", name: "Callisto", x: 500, y: 320, r: 45, m: 2400 },
      { kind: "planet", name: "Io", r: 16, m: 300, orbit: { cx: 500, cy: 320, R: 135, w: 0.012, ph: 2.4 } },
    ],
  },
  {
    name: "Soft Push", par: 2,
    tip: "Blue bodies push instead of pull. A straight shot gets pressed down and misses, so aim a little high.",
    pad: [120, 380], target: { x: 840, y: 430, r: 36 },
    bodies: [{ kind: "repel", name: "the white hole", x: 410, y: 210, r: 14, m: -1000 }],
  },
  {
    name: "Asteroid Gate", par: 3,
    tip: "Thread the gate near the top, then let Pallas pull you down.",
    pad: [100, 312], target: { x: 900, y: 330, r: 26 },
    bodies: [
      ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({ kind: "rock", name: "the gate", x: 500, y: 215 + i * 50, r: 24, m: 0 })),
      { kind: "rock", name: "the gate", x: 500, y: 40, r: 24, m: 0 },
      { kind: "planet", name: "Pallas", x: 730, y: 470, r: 60, m: 3000 },
    ],
  },
  {
    name: "Whiplash", par: 2,
    tip: "The wall hides the target. Launch gently, fall toward the black hole and let it swing you all the way round.",
    pad: [140, 150], target: { x: 200, y: 500, r: 24 },
    bodies: [
      { kind: "hole", name: "the black hole", x: 720, y: 330, r: 12, m: 7000 },
      ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ kind: "rock", name: "the wall", x: 30 + i * 60, y: 320 + (i % 2) * 12, r: 26, m: 0 })),
    ],
  },
  {
    name: "Slingshot", par: 3,
    tip: "The belt blocks the short way. Swing around Hyperion and come back.",
    pad: [150, 520], target: { x: 170, y: 120, r: 26 },
    bodies: [
      ...[50, 110, 170, 230, 290, 350, 410].map((x, i) => ({ kind: "rock", name: "the belt", x, y: 320 + (i % 2) * 14, r: 26, m: 0 })),
      { kind: "planet", name: "Hyperion", x: 720, y: 320, r: 50, m: 2600 },
    ],
  },
  {
    name: "White Hole", par: 3,
    tip: "Blue bodies push instead of pull. Bank off the white hole like a cushion shot in pool.",
    pad: [150, 520], target: { x: 170, y: 120, r: 26 },
    bodies: [
      ...[50, 110, 170, 230, 290, 350].map((x, i) => ({ kind: "rock", name: "the ridge", x, y: 310 + (i % 2) * 12, r: 26, m: 0 })),
      { kind: "repel", name: "the white hole", x: 780, y: 320, r: 14, m: -2500 },
    ],
  },
  {
    name: "Event Horizon", par: 4,
    tip: "The rocks shield the target from below and the left. Whip around the black hole.",
    pad: [100, 560], target: { x: 860, y: 110, r: 24 },
    bodies: [
      { kind: "hole", name: "the black hole", x: 600, y: 330, r: 12, m: 7000 },
      ...[[790, 70], [790, 125], [800, 180], [840, 205], [895, 210], [950, 205]].map(([x, y]) => ({ kind: "rock", name: "the shield", x, y, r: 22, m: 0 })),
    ],
  },
  {
    name: "Grand Tour", par: 4,
    tip: "Everything at once. Lob it high over Oberon so it just skims over the reef into the ring. A steeper lob needs much less power. Or skim the black hole and come in up the right side.",
    pad: [100, 560], target: { x: 900, y: 90, r: 30 },
    bodies: [
      { kind: "planet", name: "Oberon", x: 374, y: 336, r: 46, m: 1740 },
      { kind: "planet", name: "Puck", r: 13, m: 200, orbit: { cx: 374, cy: 336, R: 115, w: 0.014, ph: 0.28 } },
      { kind: "hole", name: "the black hole", x: 726, y: 507, r: 12, m: 6693 },
      { kind: "repel", name: "the white hole", x: 975, y: 240, r: 14, m: -926 },
      ...[[770, 95], [790, 150], [830, 190], [880, 205], [935, 200]].map(([x, y]) => ({ kind: "rock", name: "the reef", x, y, r: 22, m: 0 })),
    ],
  },
];

// Bit-identical maths. IEEE 754 makes + − × ÷ and sqrt exactly rounded in every browser, but not cos,
// sin or hypot, which vary in the last bit between engines. Gravity slingshots are chaotic enough to
// grow one bit into a different outcome, and the daily challenge must come out the same for everyone,
// so the solver and the simulation use only the exact operations.
const dist = (dx, dy) => Math.sqrt(dx * dx + dy * dy);
// [cos, sin] of an angle in degrees, from a Taylor series on the first octant.
function dir(deg) {
  let d = deg % 360;
  if (d < 0) d += 360;
  const q = Math.floor(d / 90);
  let r = d - 90 * q;
  const swap = r > 45;
  if (swap) r = 90 - r;
  const x = r * (Math.PI / 180), x2 = x * x;
  let s = x, c = 1, ts = x, tc = 1;
  for (let n = 1; n <= 9; n++) {
    ts *= -x2 / ((2 * n) * (2 * n + 1)); s += ts;
    tc *= -x2 / ((2 * n - 1) * (2 * n)); c += tc;
  }
  if (swap) [c, s] = [s, c];
  return q === 0 ? [c, s] : q === 1 ? [-s, c] : q === 2 ? [-c, -s] : [s, -c];
}

function bodyPos(b, t) {
  if (!b.orbit) return [b.x, b.y];
  const o = b.orbit;
  return [o.cx + o.R * Math.cos(o.w * t + o.ph), o.cy + o.R * Math.sin(o.w * t + o.ph)];
}

function launchVel(pullX, pullY) {
  // Pull-back slingshot: the probe flies opposite to the drag.
  let vx = -pullX * 0.06, vy = -pullY * 0.06;
  const s = Math.hypot(vx, vy);
  if (s > PHYS.MAX_SPEED) { vx *= PHYS.MAX_SPEED / s; vy *= PHYS.MAX_SPEED / s; }
  return [vx, vy];
}

// Integrate one shot. Returns the outcome and (optionally) a sampled path.
function simulate(level, vx, vy, opts = {}) {
  const { maxT = PHYS.MAX_T, every = 2 } = opts;
  const { G, EPS2, DT, PROBE_R, MARGIN } = PHYS;
  let x = level.pad[0], y = level.pad[1], t = 0, k = 0;
  const path = opts.path ? [[x, y]] : null;
  const accel = (px, py, tt) => {
    let ax = 0, ay = 0;
    for (const b of level.bodies) {
      if (!b.m) continue;
      const [bx, by] = bodyPos(b, tt);
      const dx = bx - px, dy = by - py, d2 = dx * dx + dy * dy + EPS2, f = (G * b.m) / (d2 * Math.sqrt(d2));
      ax += dx * f; ay += dy * f;
    }
    return [ax, ay];
  };
  let [ax, ay] = accel(x, y, 0);
  const tg = level.target;
  // A shot wins as soon as the probe touches the target, the same rule as touching a planet.
  // `miss` is the closest gap between probe and target, for near-miss feedback. `out` is how far the
  // probe got past the board's edge (0 if it never left), so the solver can tell visible wins apart.
  const reach = tg.r + PROBE_R;
  let miss = Infinity, out = 0;
  while (t < maxT) {
    vx += ax * DT / 2; vy += ay * DT / 2;
    x += vx * DT; y += vy * DT; t += DT;
    [ax, ay] = accel(x, y, t);
    vx += ax * DT / 2; vy += ay * DT / 2;
    if (path && ++k % every === 0) path.push([x, y]);
    if (-x > out) out = -x; if (-y > out) out = -y; if (x - WORLD.w > out) out = x - WORLD.w; if (y - WORLD.h > out) out = y - WORLD.h;
    const dt = dist(x - tg.x, y - tg.y);
    if (dt < reach) { if (path) path.push([x, y]); return { result: "win", t, path, miss: 0, out }; }
    if (dt - reach < miss) miss = dt - reach;
    for (const b of level.bodies) {
      const [bx, by] = bodyPos(b, t);
      if (dist(x - bx, y - by) < b.r + PROBE_R) { if (path) path.push([x, y]); return { result: "crash", hit: b.name, kind: b.kind, t, path, miss, out }; }
    }
    if (x < -MARGIN || y < -MARGIN || x > WORLD.w + MARGIN || y > WORLD.h + MARGIN) return { result: "lost", t, path, miss, out };
  }
  return { result: "timeout", t, path, miss, out };
}

// ---------- solver ----------
// A win counts as "seen" if it never strays more than this far past the board's edge: further out,
// a phone screen can't show it, so a player can't see or plan it (found in blind playtests).
const ONBOARD_MARGIN = 20;
// Sweep a grid of launches (angle in degrees, speed in units per frame) and count the winners.
// The fine grid (1°, 0.25) is what the hand-made levels were verified with; the editor uses a coarser one.
const GRIDS = {
  fine: { angleStep: 1, speedStep: 0.25 },
  coarse: { angleStep: 2, speedStep: 0.5 },
};
function solve(level, opts = {}) {
  const { angleStep, speedStep } = GRIDS[opts.grid || "fine"];
  const onRow = opts.onRow || null;
  const wins = [];
  let total = 0, seen = 0;
  for (let a = 0; a < 360; a += angleStep) {
    const [ca, sa] = dir(a);
    for (let s = 1.5; s <= PHYS.MAX_SPEED + 1e-9; s += speedStep) {
      total++;
      const r = simulate(level, s * ca, s * sa);
      if (r.result === "win") { wins.push({ angle: a, speed: s }); if (r.out <= ONBOARD_MARGIN) seen++; }
    }
    if (onRow) onRow(a / 360, wins.length);
  }
  return { total, wins: wins.length, seen, rate: wins.length / total, sample: wins.length ? wins[Math.floor(wins.length / 2)] : null };
}

// A starting par from the solver's fine-grid win rate, calibrated on the first eight hand-made holes
// (their rates run from 1.47% to 0.12%). It lands within one stroke of every hand-set par;
// a level's author can always override it.
function suggestPar(rate) {
  if (rate >= 0.01) return 2;
  if (rate >= 0.002) return 3;
  return 4;
}

// ---------- daily challenge ----------
// Every player builds the same level from the UTC date: a seeded generator proposes layouts in a fixed
// order and the first one whose coarse-grid win rate falls in that weekday's band is the day's level.
// Requiring several winning launches keeps the choice clear of borderline shots, so tiny floating-point
// differences between browsers can't make two players accept different layouts.
function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// Coarse-grid win-rate band per weekday (index 0 is Sunday). Monday is gentle, Sunday is hard.
const DAILY_BANDS = [[0.0017, 0.006], [0.02, 0.06], [0.012, 0.03], [0.008, 0.02], [0.006, 0.015], [0.004, 0.01], [0.003, 0.008]];
const DAILY_MOOD = ["the hardest of the week", "a gentle start to the week", "an easy one", "middling", "a bit tricky", "tricky", "hard"];
const DAILY_MIN_WINS = 5, DAILY_MAX_TRIES = 60;
// From this date on, a daily must also have DAILY_MIN_WINS seen wins, at least half of all its wins.
// Earlier dates (already built and cached by players) come out exactly as before, so DAILY_VERSION
// stays put: no one's cached daily changes under them.
const DAILY_ONBOARD_FROM = "2026-10-30";
// Bump whenever a change alters which level a date produces (physics, solver, generator, bands, word
// lists). Browsers throw away a cached daily built under another version, so nobody keeps a stale one.
const DAILY_VERSION = 4;
const PLANET_NAMES = ["Arden", "Brisa", "Corvus", "Delphi", "Eos", "Fenna", "Galen", "Hesper", "Ione", "Juno", "Kestrel", "Lyra", "Mira", "Nadir", "Orla", "Pyxis", "Quill", "Rook", "Selene", "Talos", "Umbra", "Vela", "Wren", "Xanthe", "Yara", "Zephyr"];
const NAME_A = ["Quiet", "Crooked", "Silver", "Long", "Narrow", "Hidden", "Bright", "Lonely", "Twin", "Broken", "Sleeping", "Distant", "Folded", "Restless"];
const NAME_B = ["Reach", "Passage", "Orbit", "Gate", "Run", "Drift", "Lane", "Harbor", "Crossing", "Spiral", "Approach", "Gap", "Current", "Corridor"];

const utcDate = (d = new Date()) => d.toISOString().slice(0, 10);
const weekdayOf = (date) => new Date(date + "T00:00:00Z").getUTCDay();

// One candidate layout from a random source. Laid out left to right, then possibly mirrored.
function dailyCandidate(rnd) {
  const between = (lo, hi) => lo + rnd() * (hi - lo);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const pad = [between(80, 160), between(100, 525)];
  const target = { x: between(780, 920), y: between(90, 535), r: Math.round(between(22, 30)) };
  const bodies = [];
  const free = (x, y, r, gap = 20) =>
    dist(x - pad[0], y - pad[1]) > r + 80 && dist(x - target.x, y - target.y) > r + target.r + 40 &&
    bodies.every((b) => dist(x - b.x, y - b.y) > r + b.r + gap);
  const names = PLANET_NAMES.slice();
  const count = 2 + Math.floor(rnd() * 4);
  let holes = 0, repels = 0;
  for (let n = 0; n < count; n++) {
    const roll = rnd();
    for (let tries = 0; tries < 30; tries++) {
      const x = between(260, 760), y = between(60, 565);
      if (roll < 0.2) {
        // A belt of rocks along a short line
        const k = 3 + Math.floor(rnd() * 4), [ca, sa] = dir(rnd() * 180), step = 48;
        const belt = [];
        for (let j = 0; j < k; j++) belt.push({ x: x + ca * step * (j - (k - 1) / 2), y: y + sa * step * (j - (k - 1) / 2) });
        if (belt.every((p) => p.x > 20 && p.y > 20 && p.x < WORLD.w - 20 && p.y < WORLD.h - 20 && free(p.x, p.y, 22, 6))) {
          belt.forEach((p) => bodies.push({ kind: "rock", name: "the belt", x: p.x, y: p.y, r: 22, m: 0 }));
          break;
        }
      } else if (roll < 0.32 && !holes) {
        if (free(x, y, 12, 60)) { bodies.push({ kind: "hole", name: "the black hole", x, y, r: 12, m: Math.round(between(5000, 8000)) }); holes++; break; }
      } else if (roll < 0.44 && !repels) {
        if (free(x, y, 14, 60)) { bodies.push({ kind: "repel", name: "the white hole", x, y, r: 14, m: -Math.round(between(800, 2500)) }); repels++; break; }
      } else {
        const r = Math.round(between(25, 65));
        if (free(x, y, r)) {
          const name = names.splice(Math.floor(rnd() * names.length), 1)[0];
          bodies.push({ kind: "planet", name, x, y, r, m: Math.round(between(1200, 3200)) });
          break;
        }
      }
    }
  }
  // Mirror for variety, so the pad isn't always on the left.
  const flipX = rnd() < 0.5, flipY = rnd() < 0.5;
  const fx = (x) => Math.round(flipX ? WORLD.w - x : x), fy = (y) => Math.round(flipY ? WORLD.h - y : y);
  return {
    name: `${pick(NAME_A)} ${pick(NAME_B)}`,
    pad: [fx(pad[0]), fy(pad[1])],
    target: { x: fx(target.x), y: fy(target.y), r: target.r },
    bodies: bodies.map((b) => ({ ...b, x: fx(b.x), y: fy(b.y) })),
  };
}

// The level for a UTC date (YYYY-MM-DD). onTry(n) reports progress; it may take a few seconds.
function generateDaily(date, opts = {}) {
  const day = weekdayOf(date), [lo, hi] = DAILY_BANDS[day];
  for (let attempt = 0; attempt < DAILY_MAX_TRIES; attempt++) {
    if (opts.onTry) opts.onTry(attempt);
    const lv = dailyCandidate(mulberry32(hashString(`${date}#${attempt}`)));
    const r = solve(lv, { grid: "coarse" });
    const fair = date < DAILY_ONBOARD_FROM || (r.seen >= DAILY_MIN_WINS && 2 * r.seen >= r.wins);
    if (r.wins >= DAILY_MIN_WINS && r.rate >= lo && r.rate <= hi && fair) {
      return {
        date, version: DAILY_VERSION, attempt, rate: r.rate, wins: r.wins,
        level: { ...lv, par: suggestPar(r.rate), tip: `A new course every day, the same for everyone. It's ${WEEKDAYS[day]}, so expect ${DAILY_MOOD[day]}.` },
      };
    }
  }
  // Nothing fit the band: fall back to a built-in hole so there is always a daily.
  const lv = LEVELS[hashString(date) % LEVELS.length];
  return { date, version: DAILY_VERSION, attempt: -1, rate: null, wins: null, level: { ...lv, tip: `Today's course is a classic: ${lv.name}.` } };
}

// ---------- share links ----------
// A level packs into a short base64url string: kinds are one letter, numbers are rounded integers.
const KIND_CODE = { planet: "p", rock: "r", hole: "h", repel: "w" };
const CODE_KIND = { p: "planet", r: "rock", h: "hole", w: "repel" };
const DEFAULT_NAMES = { planet: "the planet", rock: "a rock", hole: "the black hole", repel: "the white hole" };

function encodeLevel(level) {
  const data = {
    v: 1,
    n: level.name || "",
    q: level.par || 0,
    p: level.pad.map(Math.round),
    t: [level.target.x, level.target.y, level.target.r].map(Math.round),
    b: level.bodies.filter((b) => !b.orbit).map((b) => [KIND_CODE[b.kind], Math.round(b.x), Math.round(b.y), Math.round(b.r), Math.round(b.m)]),
  };
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let bin = "";
  for (const x of bytes) bin += String.fromCharCode(x);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Returns a level, or throws an Error with a message fit to show a player.
function decodeLevel(code) {
  let data;
  try {
    const bin = atob(code.replace(/-/g, "+").replace(/_/g, "/"));
    data = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
  } catch {
    throw new Error("This level link is damaged. Ask for the link again, or copy it in full.");
  }
  const num = (x, lo, hi) => typeof x === "number" && isFinite(x) && x >= lo && x <= hi;
  const okPoint = (p) => Array.isArray(p) && num(p[0], -50, WORLD.w + 50) && num(p[1], -50, WORLD.h + 50);
  if (data.v !== 1 || !okPoint(data.p) || !okPoint(data.t) || !num(data.t[2], 8, 80) || !Array.isArray(data.b) || data.b.length > 40) {
    throw new Error("This level link is from a newer or different version of Slingshot.");
  }
  const bodies = data.b.map((e) => {
    const kind = CODE_KIND[e[0]];
    if (!kind || !okPoint([e[1], e[2]]) || !num(e[3], 4, 120) || !num(e[4], -6000, 12000)) throw new Error("This level link contains a body Slingshot doesn't recognise.");
    return { kind, name: DEFAULT_NAMES[kind], x: e[1], y: e[2], r: e[3], m: kind === "rock" ? 0 : e[4] };
  });
  return {
    name: String(data.n || "Shared level").slice(0, 40),
    par: num(data.q, 1, 9) ? Math.round(data.q) : 3,
    tip: "A level someone built and shared. It has been checked: at least one launch wins.",
    pad: data.p, target: { x: data.t[0], y: data.t[1], r: data.t[2] }, bodies,
  };
}
/*CORE-END*/

if (typeof module !== "undefined") module.exports = { WORLD, PHYS, LEVELS, ONBOARD_MARGIN, bodyPos, launchVel, simulate, solve, suggestPar, encodeLevel, decodeLevel, GRIDS, generateDaily, utcDate, weekdayOf, WEEKDAYS };
