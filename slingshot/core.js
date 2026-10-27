/*CORE-START*/
// World is 1000 × 625 units, y down. One time unit is one frame at normal speed (1/60 s).
const WORLD = { w: 1000, h: 625 };
const PHYS = { G: 1, EPS2: 100, DT: 0.25, MAX_T: 900, MAX_SPEED: 9, PROBE_R: 4, MARGIN: 260 };

const LEVELS = [
  {
    name: "First Light", par: 1,
    tip: "Drag back from anywhere and let go. Gravity bends every shot, so you rarely aim straight at the target.",
    pad: [120, 312], target: { x: 880, y: 312, r: 34 },
    bodies: [{ kind: "planet", name: "Tethys", x: 500, y: 430, r: 40, m: 1800 }],
  },
  {
    name: "Around the Bend", par: 2,
    tip: "Tethys is in the way. Curve around it instead of through it.",
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
    name: "Moonrise", par: 2,
    tip: "Little Io circles Callisto. Every shot starts the clock again, so its timing is always the same.",
    pad: [100, 500], target: { x: 900, y: 140, r: 26 },
    bodies: [
      { kind: "planet", name: "Callisto", x: 500, y: 320, r: 45, m: 2400 },
      { kind: "planet", name: "Io", r: 16, m: 300, orbit: { cx: 500, cy: 320, R: 135, w: 0.012, ph: 2.4 } },
    ],
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
];

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
  while (t < maxT) {
    vx += ax * DT / 2; vy += ay * DT / 2;
    x += vx * DT; y += vy * DT; t += DT;
    [ax, ay] = accel(x, y, t);
    vx += ax * DT / 2; vy += ay * DT / 2;
    if (path && ++k % every === 0) path.push([x, y]);
    const tg = level.target;
    if (Math.hypot(x - tg.x, y - tg.y) < tg.r) { if (path) path.push([x, y]); return { result: "win", t, path }; }
    for (const b of level.bodies) {
      const [bx, by] = bodyPos(b, t);
      if (Math.hypot(x - bx, y - by) < b.r + PROBE_R) { if (path) path.push([x, y]); return { result: "crash", hit: b.name, kind: b.kind, t, path }; }
    }
    if (x < -MARGIN || y < -MARGIN || x > WORLD.w + MARGIN || y > WORLD.h + MARGIN) return { result: "lost", t, path };
  }
  return { result: "timeout", t, path };
}
/*CORE-END*/
