// Meander: the river model, with no DOM. Loads in the browser (window.Meander) and in Node.
//
// The river is a centreline of evenly spaced points. Each step:
//   1. curvature at every point;
//   2. a migration rate from the Howard & Knutson (1984) rule: the bank erodes at a rate set mostly by the
//      curvature a little way UPSTREAM (an exponentially fading memory), minus a share of the local curvature.
//      That lag is what makes bends grow, lean downstream and curl into loops;
//   3. every point moves sideways (to the outside of the bend) by that rate;
//   4. where two parts of the channel touch, the loop between them is cut off and left behind as an oxbow lake;
//   5. the line is re-spaced.
// Lengths are in world units (the channel is P.W wide). A step is one nominal "year".
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Meander = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const WORLD = { w: 2400, h: 1350, x0: -700, x1: 3100 }; // the map shows 0..w; the river runs x0..x1
  const P = {
    W: 14,          // channel width
    ds: 5,          // point spacing
    kl: 2.6,        // erodibility: world units per year at curvature 1/W
    omega: -1,      // weight of local curvature
    gamma: 2.5,     // weight of the upstream memory
    decay: 2.6,     // memory length, in channel widths
    cut: 1.0,       // centrelines closer than this many widths are a neck cutoff
    gap: 6,         // ...if they are at least this many widths apart along the channel
    wobble: 0.05,   // sideways drift of the inflow, widths per year (keeps new bends coming)
    taper: 45,      // how far from a valley wall the bank starts to resist
    maxMove: 1.6,   // cap on one step's sideways move (keeps a tangle from exploding)
    lakeMin: 12,    // loops with fewer points than this leave no lake
  };

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Valley walls: two wavy lines the river cannot cross. Returned as y for a given x.
  function makeWalls(rand) {
    const mk = () => ({ a: 405 + 60 * rand(), f1: 0.0016 + 0.0014 * rand(), p1: 6.283 * rand(), f2: 0.0041 + 0.003 * rand(), p2: 6.283 * rand() });
    const top = mk(), bot = mk(), mid = WORLD.h / 2;
    const half = (w, x) => w.a + 70 * Math.sin(x * w.f1 + w.p1) + 32 * Math.sin(x * w.f2 + w.p2);
    return { top: (x) => mid - half(top, x), bot: (x) => mid + half(bot, x) };
  }

  function create(seed) {
    seed = (seed >>> 0) || 1;
    const rand = mulberry32(seed);
    const walls = makeWalls(rand);
    const n = Math.round((WORLD.x1 - WORLD.x0) / P.ds) + 1, x = new Array(n), y = new Array(n);
    const mid = WORLD.h / 2, waves = [];
    for (let k = 0; k < 6; k++) waves.push({ a: 1.5 + 3 * rand(), f: 0.006 + 0.03 * rand(), p: 6.283 * rand() });
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), env = Math.min(1, u * 12, (1 - u) * 12);
      let off = (rand() - 0.5) * 0.8;
      x[i] = WORLD.x0 + u * (WORLD.x1 - WORLD.x0);
      for (const w of waves) off += w.a * Math.sin(x[i] * w.f + w.p);
      y[i] = mid + off * env;
    }
    return { seed, rand, walls, x, y, n, t: 0, lakes: [], cutoffs: 0, drift: 0, lastCut: null };
  }

  const length = (r) => { let L = 0; for (let i = 1; i < r.n; i++) L += Math.hypot(r.x[i] - r.x[i - 1], r.y[i] - r.y[i - 1]); return L; };
  const sinuosity = (r) => length(r) / Math.hypot(r.x[r.n - 1] - r.x[0], r.y[r.n - 1] - r.y[0]);

  // Signed curvature (positive = turning left when y is up, i.e. anticlockwise in maths axes), lightly smoothed.
  function curvature(r, out) {
    const { x, y, n } = r;
    out[0] = out[n - 1] = 0;
    for (let i = 1; i < n - 1; i++) {
      const dx = (x[i + 1] - x[i - 1]) / 2, dy = (y[i + 1] - y[i - 1]) / 2;
      const ddx = x[i + 1] - 2 * x[i] + x[i - 1], ddy = y[i + 1] - 2 * y[i] + y[i - 1];
      const d2 = dx * dx + dy * dy;
      out[i] = d2 > 1e-12 ? (dx * ddy - dy * ddx) / (d2 * Math.sqrt(d2)) : 0;
    }
    for (let pass = 0; pass < 2; pass++) {
      let prev = out[0];
      for (let i = 1; i < n - 1; i++) { const cur = out[i]; out[i] = 0.25 * prev + 0.5 * cur + 0.25 * out[i + 1]; prev = cur; }
    }
    return out;
  }

  // Migration rate in world units per year, positive to the right of the flow direction.
  let bufK = [], bufR = [], kern = null, kernFor = "";
  function rates(r) {
    const n = r.n;
    if (bufK.length < n) { bufK = new Array(n + 512); bufR = new Array(n + 512); }
    const K = curvature(r, bufK), R = bufR;
    const key = P.decay + "/" + P.ds + "/" + P.W;
    if (kernFor !== key) {
      const m = Math.ceil((6 * P.decay * P.W) / P.ds);
      kern = new Float64Array(m);
      for (let k = 0; k < m; k++) kern[k] = Math.exp((-k * P.ds) / (P.decay * P.W));
      kernFor = key;
    }
    const m = kern.length, scale = P.kl * P.W * Math.pow(sinuosity(r), -2 / 3);
    for (let i = 0; i < n; i++) {
      let acc = 0, norm = 0;
      const lim = i < m ? i + 1 : m;
      for (let k = 0; k < lim; k++) { acc += K[i - k] * kern[k]; norm += kern[k]; }
      R[i] = scale * (P.omega * K[i] + (P.gamma * acc) / norm);
    }
    return R;
  }

  function move(r, dt) {
    const { x, y, n, walls } = r, R = rates(r), pin = 14;
    const nx = new Array(n), ny = new Array(n);
    nx[0] = x[0]; ny[0] = y[0]; nx[n - 1] = x[n - 1]; ny[n - 1] = y[n - 1];
    for (let i = 1; i < n - 1; i++) {
      const tx = x[i + 1] - x[i - 1], ty = y[i + 1] - y[i - 1], tl = Math.hypot(tx, ty) || 1;
      let d = R[i] * dt * Math.min(1, i / pin, (n - 1 - i) / pin);
      if (d > P.maxMove) d = P.maxMove; else if (d < -P.maxMove) d = -P.maxMove;
      let mx = (ty / tl) * d, my = (-tx / tl) * d;
      const top = walls.top(x[i]) + P.W, bot = walls.bot(x[i]) - P.W;
      if (my < 0) my *= Math.max(0, Math.min(1, (y[i] - top) / P.taper));
      else my *= Math.max(0, Math.min(1, (bot - y[i]) / P.taper));
      nx[i] = x[i] + mx; ny[i] = y[i] + my;
    }
    // The inflow wanders a little (a slow random walk pulled back to zero), so the upstream reach never goes quiet.
    r.drift += (-r.drift * 0.02 + (r.rand() - 0.5) * 0.5) * dt;
    const amp = r.drift * P.wobble * P.W * dt;
    for (let i = pin; i < pin + 60 && i < n - 1; i++) { const u = (i - pin) / 60; ny[i] += amp * Math.sin(Math.PI * u) ** 2; }
    r.x = nx; r.y = ny;
  }

  // Neck cutoffs. Returns how many were made.
  function cutoffs(r) {
    const cell = P.cut * P.W, cut2 = cell * cell, gapN = Math.ceil((P.gap * P.W) / P.ds);
    let made = 0;
    for (let round = 0; round < 6; round++) {
      const { x, y, n } = r, grid = new Map();
      let hitI = -1, hitJ = -1;
      for (let i = 0; i < n && hitI < 0; i++) {
        const cx = Math.floor(x[i] / cell), cy = Math.floor(y[i] / cell);
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
          const list = grid.get((cx + a) * 100003 + (cy + b));
          if (!list) continue;
          for (const j of list) {
            if (i - j < gapN) continue;
            const dx = x[i] - x[j], dy = y[i] - y[j];
            if (dx * dx + dy * dy < cut2 && (hitJ < 0 || j < hitJ)) { hitI = i; hitJ = j; }
          }
        }
        const key = cx * 100003 + cy, list = grid.get(key);
        if (list) list.push(i); else grid.set(key, [i]);
      }
      if (hitI < 0) break;
      const loopX = x.slice(hitJ + 1, hitI), loopY = y.slice(hitJ + 1, hitI);
      x.splice(hitJ + 1, hitI - hitJ - 1); y.splice(hitJ + 1, hitI - hitJ - 1);
      r.n = x.length; made++; r.cutoffs++;
      r.lastCut = { t: r.t, x: x[hitJ], y: y[hitJ] };
      // Both mouths of the abandoned loop silt up first, so the lake starts a little short of the new channel.
      const plug = Math.ceil((1.6 * P.W) / P.ds);
      if (loopX.length - 2 * plug >= P.lakeMin) {
        r.lakes.push({ x: loopX.slice(plug, -plug), y: loopY.slice(plug, -plug), born: r.t });
        if (r.lakes.length > 90) r.lakes.shift();
      }
    }
    return made;
  }

  // Re-space the points evenly along a Catmull-Rom curve through the old ones.
  function resample(r) {
    const { x, y, n } = r, s = new Array(n);
    s[0] = 0;
    for (let i = 1; i < n; i++) s[i] = s[i - 1] + Math.hypot(x[i] - x[i - 1], y[i] - y[i - 1]);
    const L = s[n - 1], m = Math.max(8, Math.round(L / P.ds) + 1), ox = new Array(m), oy = new Array(m);
    let j = 0;
    for (let k = 0; k < m; k++) {
      const at = (k / (m - 1)) * L;
      while (j < n - 2 && s[j + 1] < at) j++;
      const seg = s[j + 1] - s[j], u = seg > 1e-9 ? (at - s[j]) / seg : 0;
      const a = j > 0 ? j - 1 : j, d = j + 2 < n ? j + 2 : n - 1, u2 = u * u, u3 = u2 * u;
      const w0 = -0.5 * u3 + u2 - 0.5 * u, w1 = 1.5 * u3 - 2.5 * u2 + 1, w2 = -1.5 * u3 + 2 * u2 + 0.5 * u, w3 = 0.5 * u3 - 0.5 * u2;
      ox[k] = w0 * x[a] + w1 * x[j] + w2 * x[j + 1] + w3 * x[d];
      oy[k] = w0 * y[a] + w1 * y[j] + w2 * y[j + 1] + w3 * y[d];
    }
    ox[0] = x[0]; oy[0] = y[0]; ox[m - 1] = x[n - 1]; oy[m - 1] = y[n - 1];
    r.x = ox; r.y = oy; r.n = m;
  }

  // The walls are wavy, so a point that slides along the valley can end up under one. Keep the channel's
  // bank (half a width from the centreline) inside.
  function confine(r) {
    const { x, y, n, walls } = r, half = P.W / 2;
    for (let i = 1; i < n - 1; i++) {
      const top = walls.top(x[i]) + half, bot = walls.bot(x[i]) - half;
      if (y[i] < top) y[i] = top; else if (y[i] > bot) y[i] = bot;
    }
  }

  function step(r, dt) {
    dt = dt || 1;
    move(r, dt);
    const made = cutoffs(r);
    resample(r);
    confine(r);
    r.t += dt;
    return made;
  }

  // Index of the point nearest to (wx, wy), and its distance.
  function nearest(r, wx, wy) {
    let best = -1, bd = Infinity;
    for (let i = 0; i < r.n; i++) { const dx = r.x[i] - wx, dy = r.y[i] - wy, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = i; } }
    return { i: best, d: Math.sqrt(bd) };
  }
  // Drag the channel: move point i by (dx, dy) and its neighbours by a bell-shaped share. Walls and ends hold.
  function pull(r, i, dx, dy, sigma) {
    sigma = sigma || 16;
    const lo = Math.max(1, Math.floor(i - 3 * sigma)), hi = Math.min(r.n - 2, Math.ceil(i + 3 * sigma));
    for (let k = lo; k <= hi; k++) {
      const u = (k - i) / sigma, w = Math.exp(-0.5 * u * u) * Math.min(1, k / 14, (r.n - 1 - k) / 14);
      r.x[k] += dx * w;
      const top = r.walls.top(r.x[k]) + P.W, bot = r.walls.bot(r.x[k]) - P.W;
      r.y[k] = Math.max(top, Math.min(bot, r.y[k] + dy * w));
    }
  }

  return { WORLD, P, create, step, sinuosity, length, curvature, rates, cutoffs, resample, confine, nearest, pull, mulberry32 };
});
