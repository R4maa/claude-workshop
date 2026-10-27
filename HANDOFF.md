# Handoff: Slingshot 2.0

Carries the Slingshot work between Claude sessions. **Read this first, then update Status, Next up and
Log before you stop.** The user gives Claude free rein here; they like honest reports of what was and
wasn't verified, and they playtest on a real phone when asked.

## Start here

- Live: https://r4maa.github.io/claude-workshop/slingshot/ (daily: `#daily`, editor: `editor.html`)
- Repo: `R4maa/claude-workshop`, local `Claude Projects/claude-workshop`. Push to `main`; Pages deploys.
- **Top task:** aim repeat and fine adjustment (see Next up 1). It comes from the user's playtest.

## What exists

8 hand-made holes with par; a daily challenge (same level for everyone, harder through the week); a
level editor whose share links unlock only after a solver finds a winning launch; near-miss feedback;
synthesized sound with a toggle. Works on phones (the board turns portrait).

User playtest on a real phone (2026-10-27): **sounds work, plays well.** Problem: it's hard to repeat a
previous shot and adjust it slightly, so correcting needs a lot of guess-and-check.

## Rules (decided)

- **No build step, no dependencies.** Plain HTML/CSS/JS. Shared logic in `slingshot/core.js`, which also
  loads in Node (`module.exports`) and in the worker.
- **Source of truth is the repo.** `Claude Projects/slingshot/` and `build.js` are the old first version;
  never rebuild Slingshot from them.
- **Bit-identical physics.** `simulate()`, `solve()` and the daily generator may use only `+ − × ÷`,
  `Math.sqrt`, `Math.floor` and `%`. Use `dist()` and `dir()` from `core.js`; never add `Math.cos`,
  `sin`, `hypot`, `pow` to that path, or browsers can build different dailies. (Allowed exceptions:
  `bodyPos` orbits, used only by Moonrise, and `launchVel` in the UI.)
- **Physics changes ripple.** Changing `PHYS`, `simulate`, `solve`, the generator, bands or word lists
  changes every level's win rate and every daily. Afterwards: run `tools/solve.js fine` (all 8 must stay
  solvable), run `tools/daily.js`, and bump `DAILY_VERSION` in `core.js` so cached dailies rebuild.
- **Cache stamps.** Script URLs carry `?v=N` (now 5) in `index.html` (core, render, sound),
  `editor.html` (core, render, worker) and `solver-worker.js` (`importScripts`). Bump them all when any
  script changes. The HTML page itself can be cached for up to 10 minutes by Pages; that's expected.
- **Solvable** = at least one launch in the fine grid (every 1°, speeds 1.5–9 step 0.25 = 11,160)
  wins. A win is the probe *touching* the target (radius = target r + probe r).
- **Par** from fine-grid win rate (`suggestPar`): ≥1% → 2, 0.2–1% → 3, below → 4. A starting point only.
- Commits end with `Co-Authored-By: Claude …`.

## Code map (slingshot/)

- `core.js`: `WORLD`, `PHYS`, `LEVELS`, `simulate()` (returns result, path, `miss`), `solve()`,
  `suggestPar()`, `encodeLevel()`/`decodeLevel()` (`#L=` links), daily generator
  (`generateDaily(date)`, `DAILY_BANDS`, `DAILY_VERSION`), `dist()`/`dir()` exact maths.
- `render.js`: `createBoard(canvas, stage, {tipRoom, bottomRoom})` → `resize`, `toWorld`,
  `screenDeltaToWorld`, `draw(level, state)`. Portrait quarter-turn, editor selection rings.
- `index.html`: the game (course, shared `#L=` level, `#daily`). Aiming: pointerdown anywhere, drag
  back, preview of the first 70 time units, release fires. Ghost paths of earlier shots stay drawn.
- `editor.html`: the editor; `solver-worker.js`: solve and daily jobs; `sound.js`: `createSound()`.
- `tools/solve.js [fine|coarse] [n]`, `tools/test-encoding.js`, `tools/daily.js [start] [days]`.

## Testing

- Local server: recreate `Claude Projects/.claude/launch.json` with
  `python -m http.server 8765 --directory claude-workshop`, then preview `/slingshot/`. Delete it after.
- The Claude Code browser pane runs frames slowly (often 1–3 fps) and screenshots can lag one step.
  Read state with scripts; use Fast; a flight can take 10–30 s there.
- Regression: fire each level's known winning launch (from `tools/solve.js`) through the real pointer
  events; all 8 should give "Hole in one". Drag → launch: `v = -drag × 0.06 / max(scale, 0.7)`.
- Play by eye at least once after gameplay changes (hold a drag with scripted pointer events, look at
  the preview, adjust, release). That's how the "touching doesn't count" bug was found.

## Next up

1. **Aim repeat and fine adjustment** (user feedback). Ideas, in the order I'd try them:
   - While aiming, show the angle and power as numbers (e.g. "34° · 62%"), and draw the *previous*
     shot's aim (a faint arrow from the pad plus its numbers) so you can return to it.
   - After a miss, offer "Adjust last shot": pre-arm the previous aim with big ± buttons for angle
     (0.5° steps) and power (1% steps) and a Launch button. That suits phones best.
   - Desktop: arrow keys nudge the armed aim, Space fires.
   - Keep the drag as it is for fresh shots. Test on a phone-sized viewport; buttons ≥ 40 px.
2. Four more hand-made holes plus a finale: an easy hole that introduces the white hole and one that
   introduces moving moons before the harder levels use them; a hole built around a black-hole whip
   (the best moment in playtests); a last hole combining everything, with a course-total card.
   Verify each with `tools/solve.js fine`, order by win rate, then play each by eye.
3. Unverified: the daily on Safari and Firefox (exact by construction; nobody has compared a level code).
4. Ideas: daily streak counter; "yesterday's daily"; orbits in the editor (`encodeLevel` drops them).

## Log

- 2026-10-27: Project started. Solver in `core.js` + worker + Node tools; share links; shared renderer;
  level editor; near-miss feedback.
- 2026-10-27: Daily challenge. Physics moved to exact maths (identical results, ~45% faster).
- 2026-10-27: First by-eye playtest; fixed: touching the target now wins, First Light par 2, wrong
  planet name in a tip, tip overlapping the board, slow-motion flights on slow devices. `DAILY_VERSION` 2.
- 2026-10-27: Sound effects. User confirmed on a real phone that sound works and it plays well, and
  reported that repeating and adjusting a shot is hard (Next up 1).
