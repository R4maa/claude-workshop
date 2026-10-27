# Handoff: Slingshot 2.0

This file carries the Slingshot 2.0 project between Claude sessions. Read it first, then update the
**Status** and **Next up** sections before you stop.

## The goal

Grow Slingshot (gravity golf) from 8 fixed holes into a game people come back to:

1. **Level editor with shareable links.** Place bodies, test-play, and share a URL. Sharing is only
   allowed after an in-browser solver finds a winning launch, so every shared level is beatable.
   The solver's success rate suggests the par.
2. **Daily challenge.** A level generated from the date (same for everyone), kept only if the
   solver can win it and it isn't trivially easy.
3. **Polish.** Sound effects, more hand-made holes, near-miss feedback ("missed by 12 km").

## Ground rules (decided)

- **Source of truth is this repo now** (`claude-workshop/slingshot/`). The old artifact copy in
  `Claude Projects/slingshot/` and `build.js` are from the first version; do not rebuild Slingshot
  from them, or it will overwrite the new work. The other three pages may still be built that way.
- **No build step, no dependencies.** Plain HTML/CSS/JS served by GitHub Pages. Shared logic lives
  in `slingshot/core.js` (loaded by the page, the editor, the Web Worker and Node tests).
- **Physics is fixed and deterministic.** World 1000 × 625, `PHYS` constants in `core.js`. Changing
  `PHYS` or `simulate()` changes every level; re-run the solver over all levels after any change.
- **Solvable means:** at least one launch in the solver's grid (every 1°, speeds 1.5–9 in 0.25
  steps = 11,160 launches) reaches the target.
- **Par heuristic (from the 8 hand-made levels):** win rate ≥ 1.4% → par 1–2, 0.8–1.4% → 2–3,
  0.25–0.8% → 3, below 0.25% → 4.
- Commits end with the `Co-Authored-By: Claude …` trailer. Push to `main`; Pages deploys from `main` root.

- **Bit-identical physics:** `simulate()`, `solve()` and the daily generator use only `+ − × ÷`,
  `Math.sqrt`, `Math.floor` and `%` (IEEE 754 makes these exact in every engine). Use the `dist()` and
  `dir()` helpers in `core.js`; never add `Math.cos`, `Math.sin`, `Math.hypot`, `Math.pow` etc. to
  that path, or two browsers can build different daily levels. (Exceptions that don't affect dailies:
  `bodyPos` orbits, used only by Moonrise, and `launchVel`'s speed cap in the UI.)
- **The daily depends on the code.** Changing `PHYS`, `simulate`, `solve`, `dailyCandidate`, the bands
  or the word lists changes every future (and today's) daily. When you make such a change, bump
  `DAILY_VERSION` in `core.js`: cached dailies from another version are rebuilt, so everyone converges
  on the new level. Check `node slingshot/tools/daily.js` before and after. (Version 2 came with the
  "touching the target wins" fix, which turned 2026-10-27's daily from Bright Orbit into Hidden Lane.)
- **Cache stamps:** script URLs carry `?v=N` (in `index.html`, `editor.html`, and `importScripts` in
  `solver-worker.js`). Bump N in all four places whenever `core.js` or `render.js` changes, because
  GitHub Pages lets browsers cache files for 10 minutes and a stale `core.js` breaks newer pages.

## Code map (slingshot/)

- `core.js`: world/physics constants, `LEVELS`, `simulate()` (returns `miss` = closest approach to
  the target edge), `solve()` (fine grid by default), `suggestPar()`, `encodeLevel()`/`decodeLevel()`.
  Exports via `module.exports` for Node.
- `render.js`: `createBoard(canvas, stage)` → `resize`, `toWorld`, `screenDeltaToWorld`, `draw(level, state)`.
  Handles the portrait quarter-turn. Selection/hover rings for the editor.
- `core.js` daily section: `generateDaily(date)` seeds `mulberry32(hashString(date#attempt))`, builds a
  `dailyCandidate`, solves it on the coarse grid and keeps the first with ≥5 wins and a rate inside
  `DAILY_BANDS[weekday]` (Mon gentle … Sun hard); after 60 tries it falls back to a built-in hole.
- `index.html`: the game. Plays the course, a shared level from `#L=<code>`, or today's level from
  `#daily` (built in the worker, cached in `localStorage["slingshot.daily"]`, best stored as
  `best["daily:YYYY-MM-DD"]`, "Copy result" on the win card).
- `editor.html`: the editor. Drafts autosave to `localStorage["slingshot.draft"]`.
- `solver-worker.js`: runs `solve()` for the editor and `generateDaily()` for the game, posting progress.
- `sound.js`: `createSound()`; the game calls `unlock()` on pointerdown (browsers require a gesture).
- `tools/solve.js [fine|coarse] [n]`, `tools/test-encoding.js`, and `tools/daily.js [startDate] [days]`
  (prints each day's level, attempts, win rate and build time): Node checks.

## Useful commands

- Local server: `python -m http.server 8765 --directory claude-workshop` (from `Claude Projects`).
- Solve all levels: `node slingshot/tools/solve.js fine` (about 40 s; prints win rate and suggested par).
- Share-link round trip: `node slingshot/tools/test-encoding.js`.
- Browser regression: play each built-in level with its known winning launch through the real drag
  controls (angles/speeds are printed by `tools/solve.js`); every level should end in "Hole in one".

## Status

- [x] v1 shipped: 8 levels, all verified solvable
- [x] Solver moved into `core.js` + Web Worker + Node tool (fine grid: 2–9 s per level in Node, about 1.5 s in a browser worker for a simple level)
- [x] Level encoding (`#L=` share links, 116–375 characters, validated on decode)
- [x] Level editor: add/move/resize/delete, pad and target movable, test play, drafts, phones
- [x] Share gated on a solver win; par suggested; "Show a winning shot"; edits after a check withdraw the link
- [x] Near-miss feedback in the game ("missed the target by 12,000 km"; 1 world unit = 1,000 km)
- [x] Daily challenge: seeded from the UTC date, weekday difficulty bands, built in the worker, cached
      per day, best per day, copyable result. 90-day check: 1.8 s average build in Node, worst ~10 s
      before the exact-maths change (about half that after), no fallbacks.
- [x] Sound effects: `sound.js`, synthesized (launch twang scaled by power, aiming ticks per fifth of
      power, thud / black-hole fall / white-hole hiss, win arpeggio with an extra note for a hole in
      one, miss blip); Sound toggle stored in `localStorage["slingshot.muted"]`. Verified by counting
      audio nodes per event; nobody has listened to it yet.
- [ ] More hand-made holes (target: 12)
- [ ] Editor: moving bodies (orbits). The format and renderer support them; the editor can't make them yet, and `encodeLevel` drops them.

## Next up

1. Listen to the sounds on a real device and tune levels/timbres (they were written blind).
2. Four more hand-made holes, verified with `tools/solve.js`.
3. Daily ideas: a streak counter; a "yesterday's daily" link (generate with yesterday's date).
4. Not yet verified: the daily on Safari and Firefox. The maths is exact by construction, but nobody
   has compared a level code from those browsers with `tools/daily.js` output yet.

## Playtest notes (2026-10-27, played by eye with only the in-game preview)

Results: First Light 2 shots, Around the Bend 3, daily "Bright Orbit" 2 (par).
- Works: the ghost of each miss makes the next correction obvious; bracketing high/low/middle feels like
  golf; a black-hole whip into the target is the best moment in the game.
- Fixed after the playtest: (1) a probe visibly touching the target didn't count, because the win test
  used the probe's centre and the pulsing ring was drawn up to 6% too big; (2) First Light par 1 → 2;
  (3) Around the Bend's tip named the wrong planet; (4) the tip covered the board's bottom-left corner;
  (5) the 100 ms per-frame cap made flights crawl on slow devices.
- Open: the preview shows only the first ~third of a flight, so first shots are guesses. That seems
  right for a golf game, but watch for players finding it unfair.

## Known limits

- The pane's browser in Claude Code runs animation frames slowly, so test flights there with Fast on
  and read state with scripts rather than waiting on screenshots. Screenshots can lag a step behind.
- Suggested par is a heuristic (win rate alone can't separate par 1 from par 2).

## Log

- 2026-10-27: Project started. Plan written.
- 2026-10-27: Solver, share links, shared renderer, level editor and near-miss feedback shipped.
  Regression: all 8 built-in levels still win through the UI after the renderer refactor.
- 2026-10-27: Playtested by eye (see Playtest notes) and fixed the five findings. Touching the target
  now wins (win radius = target + probe); all 8 levels re-verified (win rates up 8–21%, same order) and
  replayed through the UI; `DAILY_VERSION` 2 added so stale cached dailies rebuild.
- 2026-10-27: Daily challenge shipped. Replaced cos/sin/hypot in the physics path with exact maths;
  all 8 levels kept identical win counts and the dailies came out identical (and ~45% faster).
