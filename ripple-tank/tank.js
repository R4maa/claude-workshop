// Ripple Tank: the 2-D wave equation on a square grid, solved with an explicit
// finite-difference scheme. Loads in the browser (global RippleTank) and in Node (module.exports).
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RippleTank = api;
})(typeof self !== 'undefined' ? self : this, function () {
  // (c·dt/dx)². The explicit scheme is stable for values up to 0.5 in 2-D.
  const C2 = 0.35;
  // Gentle loss everywhere, and a sponge that soaks up waves near the edge so they don't bounce back.
  const DAMP = 0.9993;
  const EDGE = 14;

  function Tank(N) {
    this.N = N;
    this.u = new Float32Array(N * N);   // now
    this.p = new Float32Array(N * N);   // one step ago
    this.n = new Float32Array(N * N);   // scratch for the next step; its border stays 0
    this.wall = new Uint8Array(N * N);
    this.sponge = new Float32Array(N * N);
    this.sources = [];                  // {x, y} point sources that oscillate while the tank runs
    this.freq = 0.09;                   // cycles per step
    this.amp = 0.6;
    this.t = 0;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const d = Math.min(x, y, N - 1 - x, N - 1 - y);
        this.sponge[y * N + x] = d < EDGE ? 0.95 + 0.05 * (d / EDGE) : 1;
      }
    }
  }

  Tank.prototype.step = function () {
    const N = this.N, u = this.u, p = this.p, n = this.n, w = this.wall, sp = this.sponge;
    for (let y = 1; y < N - 1; y++) {
      for (let x = 1; x < N - 1; x++) {
        const i = y * N + x;
        if (w[i]) { n[i] = 0; continue; }
        const lap = u[i - 1] + u[i + 1] + u[i - N] + u[i + N] - 4 * u[i];
        n[i] = (2 * u[i] - p[i] + C2 * lap) * DAMP * sp[i];
      }
    }
    const s = Math.sin(2 * Math.PI * this.freq * this.t) * this.amp;
    for (let k = 0; k < this.sources.length; k++) {
      const src = this.sources[k];
      n[src.y * N + src.x] += s;
    }
    this.p = u;
    this.u = n;
    this.n = p;
    this.t++;
  };

  // A smooth bump of water, three cells across.
  Tank.prototype.drop = function (x, y, a) {
    const N = this.N;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cx = x + dx, cy = y + dy;
        if (cx < 1 || cy < 1 || cx >= N - 1 || cy >= N - 1) continue;
        const i = cy * N + cx;
        if (this.wall[i]) continue;
        const f = (dx === 0 && dy === 0) ? 1 : 0.5;
        this.u[i] += a * f;
      }
    }
  };

  Tank.prototype.paintWall = function (x, y, r, on) {
    const N = this.N;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        const cx = x + dx, cy = y + dy;
        if (cx < 1 || cy < 1 || cx >= N - 1 || cy >= N - 1) continue;
        const i = cy * N + cx;
        this.wall[i] = on ? 1 : 0;
        if (on) { this.u[i] = 0; this.p[i] = 0; }
      }
    }
  };

  // Returns the index of a source within `reach` cells of (x, y), or -1.
  Tank.prototype.sourceAt = function (x, y, reach) {
    for (let k = 0; k < this.sources.length; k++) {
      const s = this.sources[k];
      if (Math.abs(s.x - x) <= reach && Math.abs(s.y - y) <= reach) return k;
    }
    return -1;
  };

  Tank.prototype.addSource = function (x, y) {
    if (this.wall[y * this.N + x]) this.paintWall(x, y, 0, false);
    this.sources.push({ x: x, y: y });
  };

  Tank.prototype.clearWater = function () {
    this.u.fill(0); this.p.fill(0); this.n.fill(0);
    this.t = 0;
  };

  Tank.prototype.clearAll = function () {
    this.clearWater();
    this.wall.fill(0);
    this.sources = [];
  };

  return { Tank: Tank, C2: C2 };
});
