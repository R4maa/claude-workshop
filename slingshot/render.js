// Board renderer shared by the game, the editor and the daily challenge.
// createBoard(canvas, stage, { tipRoom }) → { resize, toWorld, screenDeltaToWorld, scale, draw }
// draw(level, state) where state may carry: t, now, ghosts, aim, flight, won, burst, selected, hover.
function createBoard(canvas, stage, opts = {}) {
  const ctx = canvas.getContext("2d");
  const css = getComputedStyle(document.documentElement);
  const C = Object.fromEntries(["path", "target", "hazard", "repel", "grid"].map((k) => [k, css.getPropertyValue("--" + k).trim()]));
  // Space kept clear under the board for the level tip: more when the board is turned (portrait).
  const tipRoom = opts.tipRoom ?? 64, bottomRoom = opts.bottomRoom ?? 44;
  let W = 0, H = 0, DPR = 1, S = 1, OX = 0, OY = 0, ROT = false;

  function resize() {
    const r = stage.getBoundingClientRect();
    W = r.width; H = r.height; DPR = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    const pad = 16;
    // On portrait screens the board is turned a quarter turn so it can be drawn larger:
    // the pad sits at the top and the course runs down the screen. Physics never changes.
    ROT = H > W * 1.1;
    if (ROT) {
      S = Math.min((W - pad * 2) / WORLD.h, (H - pad * 2 - tipRoom) / WORLD.w);
      OX = (W - WORLD.h * S) / 2; OY = pad;
    } else {
      S = Math.min((W - pad * 2) / WORLD.w, (H - pad * 2 - bottomRoom) / WORLD.h);
      OX = (W - WORLD.w * S) / 2; OY = pad + Math.max(0, (H - pad * 2 - bottomRoom - WORLD.h * S) / 2);
    }
  }
  // world → screen: landscape is a plain scale; portrait maps world x to screen down and world y to screen left.
  function worldTransform() {
    if (ROT) ctx.setTransform(0, DPR * S, -DPR * S, 0, DPR * (OX + WORLD.h * S), DPR * OY);
    else ctx.setTransform(DPR * S, 0, 0, DPR * S, DPR * OX, DPR * OY);
  }
  // A point in the stage's own coordinates (CSS pixels from its top-left), as world coordinates
  function toWorld(sx, sy) {
    return ROT ? [(sy - OY) / S, WORLD.h - (sx - OX) / S] : [(sx - OX) / S, (sy - OY) / S];
  }
  // A drag measured on screen, turned into world units
  const screenDeltaToWorld = (dx, dy) => (ROT ? [dy, -dx] : [dx, dy]);
  // Draw text upright whichever way the board is turned
  function label(text, x, y) {
    ctx.save();
    ctx.translate(x, y);
    if (ROT) ctx.rotate(-Math.PI / 2);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
  function polyline(p) {
    if (!p || p.length < 2) return;
    ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
    ctx.stroke();
  }

  // Irregular rock outlines, fixed per rock object so they keep their shape while being dragged
  const rocks = new WeakMap();
  function rockShape(b) {
    if (!rocks.has(b)) {
      let seed = (b.x * 73 + b.y * 151 + 17) | 0;
      const rnd = () => ((seed = (seed * 16807 + 11) % 2147483647) / 2147483647);
      const pts = [];
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, rr = 0.82 + rnd() * 0.3; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
      rocks.set(b, pts);
    }
    return rocks.get(b);
  }

  function drawBody(b, bx, by, px, now) {
    if (b.kind === "planet") {
      const reach = Math.sqrt(Math.max(0, b.m)) * 3.2;
      for (let k = 1; k <= 3; k++) {
        ctx.strokeStyle = `rgba(130,170,210,${0.1 - k * 0.025})`; ctx.lineWidth = px;
        ctx.beginPath(); ctx.arc(bx, by, b.r + (reach * k) / 3, 0, Math.PI * 2); ctx.stroke();
      }
      const g = ctx.createRadialGradient(bx - b.r * 0.35, by - b.r * 0.35, b.r * 0.1, bx, by, b.r);
      g.addColorStop(0, "#5f7d99"); g.addColorStop(1, "#22364b");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, b.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(180,210,240,0.35)"; ctx.lineWidth = 1.2 * px; ctx.stroke();
      if (b.r >= 40 && b.name && !b.name.startsWith("the planet")) {
        ctx.fillStyle = "rgba(230,238,247,0.5)"; ctx.font = `500 ${11 * px}px "Chakra Petch", sans-serif`;
        ctx.textAlign = "center";
        // "Below the planet" on screen is +y in landscape and +x when the board is turned.
        if (ROT) label(b.name.toUpperCase(), bx + b.r + 16 * px, by);
        else label(b.name.toUpperCase(), bx, by + b.r + 16 * px);
      }
    } else if (b.kind === "rock") {
      const pts = rockShape(b);
      ctx.fillStyle = "#2b2f38"; ctx.strokeStyle = "rgba(200,190,180,0.35)"; ctx.lineWidth = px;
      ctx.beginPath(); pts.forEach(([x, y], j) => (j ? ctx.lineTo(bx + x * b.r, by + y * b.r) : ctx.moveTo(bx + x * b.r, by + y * b.r))); ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else if (b.kind === "hole") {
      const pulse = 1 + Math.sin(now / 300) * 0.04;
      const g = ctx.createRadialGradient(bx, by, b.r, bx, by, b.r * 5 * pulse);
      g.addColorStop(0, "rgba(255,150,60,0.55)"); g.addColorStop(0.35, "rgba(255,110,60,0.15)"); g.addColorStop(1, "rgba(255,90,60,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, b.r * 5 * pulse, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(bx, by, b.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,190,120,0.9)"; ctx.lineWidth = 1.5 * px; ctx.stroke();
    } else if (b.kind === "repel") {
      for (let k = 0; k < 3; k++) {
        const ph = ((now / 1400 + k / 3) % 1);
        ctx.strokeStyle = `rgba(124,196,255,${0.5 * (1 - ph)})`; ctx.lineWidth = 1.2 * px;
        ctx.beginPath(); ctx.arc(bx, by, b.r + ph * 70, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = C.repel; ctx.beginPath(); ctx.arc(bx, by, b.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#e9f5ff"; ctx.beginPath(); ctx.arc(bx, by, b.r * 0.45, 0, Math.PI * 2); ctx.fill();
    }
  }

  // A dashed selection ring around something on the board
  function ring(x, y, r, px, strong) {
    ctx.strokeStyle = strong ? "rgba(255,181,71,0.95)" : "rgba(230,238,247,0.4)";
    ctx.lineWidth = (strong ? 2 : 1.2) * px; ctx.setLineDash([5 * px, 4 * px]);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }

  function draw(lv, state = {}) {
    const { t = 0, now = 0, ghosts = [], aim = null, flight = null, won = false, burst = null, selected = null, hover = null } = state;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = "#0a1420"; ctx.fillRect(0, 0, W, H);
    worldTransform();
    const px = 1 / S;

    // board
    ctx.fillStyle = "#0d1a29"; ctx.fillRect(0, 0, WORLD.w, WORLD.h);
    ctx.strokeStyle = C.grid; ctx.lineWidth = px;
    ctx.beginPath();
    for (let x = 50; x < WORLD.w; x += 50) { ctx.moveTo(x, 0); ctx.lineTo(x, WORLD.h); }
    for (let y = 50; y < WORLD.h; y += 50) { ctx.moveTo(0, y); ctx.lineTo(WORLD.w, y); }
    ctx.stroke();
    ctx.strokeStyle = "rgba(130,170,210,0.22)"; ctx.setLineDash([6 * px, 6 * px]);
    ctx.strokeRect(0, 0, WORLD.w, WORLD.h); ctx.setLineDash([]);

    // ghosts of earlier shots
    ctx.lineWidth = 1.2 * px; ctx.strokeStyle = "rgba(255,181,71,0.18)";
    for (const g of ghosts) polyline(g);

    // bodies
    for (const b of lv.bodies) {
      const [bx, by] = bodyPos(b, t);
      if (b.orbit) {
        ctx.strokeStyle = "rgba(130,170,210,0.12)"; ctx.lineWidth = px; ctx.setLineDash([3 * px, 5 * px]);
        ctx.beginPath(); ctx.arc(b.orbit.cx, b.orbit.cy, b.orbit.R, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      }
      drawBody(b, bx, by, px, now);
      if (b === hover && b !== selected) ring(bx, by, b.r + 7 * px, px, false);
      if (b === selected) ring(bx, by, b.r + 7 * px, px, true);
    }

    // target
    // The ring breathes inward only, so it never looks bigger than the target really is.
    const tg = lv.target, pulse = 0.97 + Math.sin(now / 420) * 0.03;
    ctx.strokeStyle = C.target; ctx.lineWidth = 2 * px;
    ctx.beginPath(); ctx.arc(tg.x, tg.y, tg.r * pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(tg.x, tg.y, tg.r * 0.55, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.12; ctx.fillStyle = C.target; ctx.beginPath(); ctx.arc(tg.x, tg.y, tg.r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    if (selected === "target") ring(tg.x, tg.y, tg.r + 7 * px, px, true);
    else if (hover === "target") ring(tg.x, tg.y, tg.r + 7 * px, px, false);

    // pad
    const [padX, padY] = lv.pad;
    ctx.strokeStyle = "rgba(230,238,247,0.5)"; ctx.lineWidth = 1.2 * px;
    ctx.beginPath(); ctx.arc(padX, padY, 12, 0, Math.PI * 2); ctx.stroke();
    if (selected === "pad") ring(padX, padY, 19, px, true);
    else if (hover === "pad") ring(padX, padY, 19, px, false);

    // aim
    if (aim && aim.v) {
      const pts = aim.preview, n = pts.length;
      ctx.strokeStyle = C.path; ctx.lineWidth = 2 * px; ctx.setLineDash([4 * px, 6 * px]);
      for (let i = 1; i < n; i += 6) {
        ctx.globalAlpha = 0.95 * (1 - i / n);
        ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1]);
        for (let j = i; j < Math.min(i + 6, n); j++) ctx.lineTo(pts[j][0], pts[j][1]);
        ctx.stroke();
      }
      ctx.setLineDash([]); ctx.globalAlpha = 1;
      // power arc around the pad
      const p = Math.hypot(aim.v[0], aim.v[1]) / PHYS.MAX_SPEED;
      ctx.strokeStyle = p >= 0.999 ? C.hazard : C.path; ctx.lineWidth = 3 * px;
      ctx.beginPath(); ctx.arc(padX, padY, 18, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.stroke();
      // pull band from probe back toward the finger
      ctx.strokeStyle = "rgba(230,238,247,0.35)"; ctx.lineWidth = 1.2 * px;
      ctx.beginPath(); ctx.moveTo(padX, padY); ctx.lineTo(padX - aim.v[0] * 9, padY - aim.v[1] * 9); ctx.stroke();
    }

    // flight
    if (flight) {
      const path = flight.res.path, k = Math.min(Math.floor(flight.i), path.length - 1);
      ctx.strokeStyle = C.path; ctx.lineWidth = 2 * px; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(path[0][0], path[0][1]);
      for (let j = 1; j <= k; j++) ctx.lineTo(path[j][0], path[j][1]);
      ctx.stroke();
      const [x, y] = path[k];
      ctx.fillStyle = "#fff6e6"; ctx.beginPath(); ctx.arc(x, y, PHYS.PROBE_R + 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,181,71,0.25)"; ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill();
    } else if (!won) {
      ctx.fillStyle = "#fff6e6"; ctx.beginPath(); ctx.arc(padX, padY, PHYS.PROBE_R + 0.5, 0, Math.PI * 2); ctx.fill();
    }

    if (burst) {
      const k = (now - burst.at) / 600;
      if (k < 1) {
        ctx.strokeStyle = burst.color; ctx.globalAlpha = 1 - k; ctx.lineWidth = 2 * px;
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2, r1 = 6 + k * 24, r2 = 10 + k * 40;
          ctx.beginPath(); ctx.moveTo(burst.x + Math.cos(a) * r1, burst.y + Math.sin(a) * r1); ctx.lineTo(burst.x + Math.cos(a) * r2, burst.y + Math.sin(a) * r2); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    }
  }

  return { resize, toWorld, screenDeltaToWorld, draw, get scale() { return S; }, get rotated() { return ROT; }, colors: C };
}
