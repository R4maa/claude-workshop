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

- **Cache stamps:** script URLs carry `?v=N` (in `index.html`, `editor.html`, and `importScripts` in
  `solver-worker.js`). Bump N in all four places whenever `core.js` or `render.js` changes, because
  GitHub Pages lets browsers cache files for 10 minutes and a stale `core.js` breaks newer pages.

## Code map (slingshot/)

- `core.js`: world/physics constants, `LEVELS`, `simulate()` (returns `miss` = closest approach to
  the target edge), `solve()` (fine grid by default), `suggestPar()`, `encodeLevel()`/`decodeLevel()`.
  Exports via `module.exports` for Node.
- `render.js`: `createBoard(canvas, stage)` → `resize`, `toWorld`, `screenDeltaToWorld`, `draw(level, state)`.
  Handles the portrait quarter-turn. Selection/hover rings for the editor.
- `index.html`: the game. Plays the course, or a single shared level from `#L=<code>`.
- `editor.html`: the editor. Drafts autosave to `localStorage["slingshot.draft"]`.
- `solver-worker.js`: runs `solve()` for the editor and posts progress.
- `tools/solve.js [fine|coarse] [n]` and `tools/test-encoding.js`: Node checks.

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
- [ ] Daily challenge generator
- [ ] Sound effects
- [ ] More hand-made holes (target: 12)
- [ ] Editor: moving bodies (orbits). The format and renderer support them; the editor can't make them yet, and `encodeLevel` drops them.

## Next up

1. **Daily challenge.** Seed a PRNG from the UTC date; generate pad, target and 2–6 bodies; reject
   layouts the solver can't win or that win more than ~3% of launches; cap attempts and fall back to a
   known-good layout. Generation must run in the worker (it may take several solves). Show a
   "Daily" entry in the Levels card, with the date and the player's best for that day.
2. Sound (Web Audio, started from a user gesture): launch whoosh, crash thud, win chime; mute toggle.
3. Four more hand-made holes, verified with `tools/solve.js`.

## Known limits

- The pane's browser in Claude Code runs animation frames slowly, so test flights there with Fast on
  and read state with scripts rather than waiting on screenshots. Screenshots can lag a step behind.
- Suggested par is a heuristic (win rate alone can't separate par 1 from par 2).

## Log

- 2026-10-27: Project started. Plan written.
- 2026-10-27: Solver, share links, shared renderer, level editor and near-miss feedback shipped.
  Regression: all 8 built-in levels still win through the UI after the renderer refactor.
