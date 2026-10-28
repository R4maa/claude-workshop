# Handoff: Slingshot 2.0

Carries the Slingshot work between Claude sessions. **Read this first, then update Status, Next up and
Log before you stop.** The user gives Claude free rein here; they like honest reports of what was and
wasn't verified, and they playtest on a real phone when asked.

## Start here

- Live: https://r4maa.github.io/claude-workshop/slingshot/ (daily: `#daily`, editor: `editor.html`)
- **Working mode (2026-10-28):** the user asked Claude to act as if they aren't involved: choose the
  work, write its own prompts, use subagents (e.g. blind playtesters) as it sees fit.
- **Blind playtests:** a general-purpose subagent told never to read the source or game internals,
  playing through screenshots and pointer events at 1100×700. The brief is in the 2026-10-28 log entry's
  spirit: shot log, tip verdict, fairness, UX, three suggestions. It finds what Claude can't, because
  Claude has seen the solver.
- Repo: `R4maa/claude-workshop`, local `Claude Projects/claude-workshop`. Push to `main`; Pages deploys.
- **Live check 2026-10-28:** stamps v=11, daily v4.
- **Top task:** none waiting on the user. Next up 2 is Claude's own list. Music confirmed by the user on their phone:
  "it sounds great" (2026-10-28). The user confirmed the bigger portrait board
  "looks good" on their phone (2026-10-28; they use large text).

## What exists

12 hand-made holes with par and a course scorecard after the finale; aim numbers, the last aim drawn
on the board and an "Adjust last shot" panel (± angle/power, Launch; arrow keys and Space); a daily challenge (same level for everyone, harder through the week); a
level editor whose share links unlock only after a solver finds a winning launch; near-miss feedback;
synthesized sound with a toggle. Works on phones (the board turns portrait).

User playtests on a real phone (Samsung S23 Ultra, Google app, portrait): 2026-10-27 **sounds work,
plays well**, but repeating and adjusting a shot was hard (answered by the aim panel). 2026-10-28: **liked
the tweak panel, portrait "really cool"**, but the current aim was hard to tell from the ghosts of
earlier shots (both were amber). Fixed the same day: ghosts are grey, the aim has a dark halo and
flowing dashes. User confirmed the same day: **"aim line looks great"**, but the board is a little small
(large text in their browser: four header rows, 200×317 px board) and Grand Tour was hard after only a few
tries.

## Rules (decided)

- **No build step, no dependencies.** Plain HTML/CSS/JS. Shared logic in `slingshot/core.js`, which also
  loads in Node (`module.exports`) and in the worker.
- **Source of truth is the repo.** `Claude Projects/slingshot/` and `build.js` are the old first version;
  never rebuild Slingshot from them.
- **Dailies from 2026-10-30 on** must have ≥5 seen wins and at least half their wins seen
  (`DAILY_ONBOARD_FROM`). Earlier dates build exactly as before (checked 20 Sep–29 Oct), so
  `DAILY_VERSION` stayed 4. Any future generator change needs the same care or a version bump.
- **Bit-identical physics.** `simulate()`, `solve()` and the daily generator may use only `+ − × ÷`,
  `Math.sqrt`, `Math.floor` and `%`. Use `dist()` and `dir()` from `core.js`; never add `Math.cos`,
  `sin`, `hypot`, `pow` to that path, or browsers can build different dailies. (Allowed exceptions:
  `bodyPos` orbits, used only by built-in holes with moons (Little Moon, Moonrise, Grand Tour) and never
  by the daily, plus `launchVel`/`atan2` in the UI. Aims from the adjust panel go through `dir()`.)
- **Physics changes ripple.** Changing `PHYS`, `simulate`, `solve`, the generator, bands or word lists
  changes every level's win rate and every daily. Afterwards: run `tools/solve.js fine` (all 8 must stay
  solvable), run `tools/daily.js`, and bump `DAILY_VERSION` in `core.js` so cached dailies rebuild.
- **Cache stamps.** Script URLs carry `?v=N` (now 11) in `index.html` (core, render, sound),
  `editor.html` (core, render, worker) and `solver-worker.js` (`importScripts`). Bump them all when any
  script changes. The HTML page itself can be cached for up to 10 minutes by Pages; that's expected.
- **Solvable** = at least one launch in the fine grid (every 1°, speeds 1.5–9 step 0.25 = 11,160)
  wins. A win is the probe *touching* the target (radius = target r + probe r).
- **Par** from fine-grid win rate (`suggestPar`): ≥1% → 2, 0.2–1% → 3, below → 4. A starting point only.
- **Hole order:** roughly by win rate, but each new kind of body gets an easy intro hole before harder
  holes use it. Best scores are keyed by level *name*, so renaming a hole loses players' bests.
- Commits end with `Co-Authored-By: Claude …`.

## Code map (slingshot/)

- `core.js`: `WORLD`, `PHYS`, `LEVELS`, `simulate()` (returns result, path, `miss`), `solve()`,
  `suggestPar()`, `encodeLevel()`/`decodeLevel()` (`#L=` links), daily generator
  (`generateDaily(date)`, `DAILY_BANDS`, `DAILY_VERSION`), `dist()`/`dir()` exact maths.
- `render.js`: `createBoard(canvas, stage, {tipRoom, bottomRoom})` → `resize`, `setRoom`, `toWorld`,
  `screenDeltaToWorld`, `draw(level, state)`. Portrait quarter-turn, editor selection rings, `lastAim`
  arrow with its numbers.
- `index.html`: the game (course, shared `#L=` level, `#daily`). Aiming: pointerdown anywhere, drag
  back, preview of the first 70 time units, release fires. Ghost paths of earlier shots stay drawn.
  Aim state: `aim` ({ v, a, p, armed }) and `lastAim` ({ key, a, p, v }, per level via `bestKey()`).
  `a` = degrees anticlockwise in world coordinates as seen in landscape (`dir(-a)`), `p` = % of
  `MAX_SPEED`. `arm()` / `nudge()` / `fire()` drive the panel; `syncAim()` updates the readout, dock
  and panel. The `#dock` under the board (tip + Adjust button + panel) is measured by `layoutDock()`,
  which calls `board.setRoom()` so the board never sits under it. Panel shots re-arm after a miss.
- `editor.html`: the editor; `solver-worker.js`: solve and daily jobs; `sound.js`: `createSound()`, also
  the music: `setLevel(lv)` seeds an 8×16 Life grid from the hole's bodies (deterministic per name),
  played in minor pentatonic at 76 bpm, evolving each bar; the theme returns (plus 4% stray cells) when
  the grid empties, freezes or loops. `flyby(y, close)` rings a note as the probe passes a body
  (`flybysOf()` in index.html). Music is off by default (`slingshot.music`), stops when the tab hides.
- `tools/music.js`: plays every hole's song on a fake audio clock and prints notes per bar.
- `tools/solve.js [fine|coarse] [n]`, `tools/test-encoding.js`, `tools/daily.js [start] [days]`, `tools/music.js`,
  `tools/onboard.js [levels|daily] [start] [days]` (wins vs "seen" wins that stay within ONBOARD_MARGIN).
- `simulate()` returns `out` (furthest distance past the board edge); `solve()` returns `seen`.

## Testing

- Local server: recreate `Claude Projects/.claude/launch.json` with
  `python -m http.server 8765 --directory claude-workshop`, then preview `/slingshot/`. Delete it after.
- The Claude Code browser pane runs frames slowly (often 1–3 fps) and screenshots can lag one step.
  Read state with scripts; use Fast; a flight can take 10–30 s there.
- Regression: fire each level's winning launch through the real pointer events; all 12 should give
  "Hole in one". Drag → launch: `v = -drag × 0.06 / max(scale, 0.7)`. Use launches with winning
  neighbours (±0.3°, ±0.06 speed), since a drag is rounded to pixels. These worked on 2026-10-27
  (world angle ° @ speed): 28@6.75, 0@5.75, 3@2.25, 4@5.5, 0@6.25, 0@7.25, 77@1.5, 165@2.5, 17@1.5,
  330@2.5, 223@3.25, 280@4.95 (Grand Tour since 2026-10-28: readout 80.0° · 55.0%; the band
  at 80° is 54.4–55.5%, so use the Adjust panel's exact numbers rather than a pixel drag). The readout shows an aim as `(360 − angle)° · speed/9 %`, so a script
  can check the drag before releasing.
- The pane only animates while it is visible: if a flight never lands, show the preview pane.
- Test with **old saved state** too, not only a clean browser: a daily best whose cached daily was
  thrown away by a `DAILY_VERSION` bump crashed the Levels card (found by the user on their phone).
- Python on Windows writes CRLF in text mode; the repo is LF. Use `newline=''` or strip `\r` after.
- Play by eye at least once after gameplay changes (hold a drag with scripted pointer events, look at
  the preview, adjust, release). That's how the "touching doesn't count" bug was found.

## Next up

1. Grand Tour was rebuilt and blind-tested 2026-10-28 (see Log); ask the user only if they mention it.
   The step sizes (0.5°, 1%) felt fine to all three blind testers. Board size on their phone:
   confirmed good 2026-10-28.
2. Known rough edges, in the order I'd fix them:
   - From blind playtests: the preview never reaches the decisive part of long holes; trails can't be
     told apart after 10+ shots (newest is now brighter; maybe label trail ends).
   - Seen-win share by hole (fine grid): Event Horizon 5 of 17, Asteroid Gate 50 of 127, Grand Tour 35
     of 79; all others above half. Event Horizon is the next candidate for a blind playtest.
   - (Superseded 2026-10-28, see Log.) Grand Tour is hard by eye: its main route (skim under the black hole, get flung up the right side)
     needed a 0.2% fine step to land. I widened the target (r 26 → 30, 0.21%) and the tip now names the
     route; it took me 9 shots with a peek at the solver. If the user finds it unfair, widen the gap at
     the reef's right end or lower par expectations in the tip.
   - Drag aims carry hidden decimals (shown to 0.1), so "347.0°" may be 347.03. Harmless, but a player
     copying numbers from the solver won't hit exactly. **Done 2026-10-28:** drags snap to 0.1° / 0.1% and fly
  through `velOf()`/`dir()`, so the shown numbers are the shot.
3. Unverified: the daily on Safari and Firefox (exact by construction; nobody has compared a level code).
4. Ideas: daily streak counter; "yesterday's daily"; orbits in the editor (`encodeLevel` drops them);
   share a shot as numbers ("Twins: 34.5° · 62.0%"). Ghost paths that leave the board are drawn over
   the dock area (unclipped); harmless, maybe clip to the board.

## Log

- 2026-10-27: Project started. Solver in `core.js` + worker + Node tools; share links; shared renderer;
  level editor; near-miss feedback.
- 2026-10-27: Daily challenge. Physics moved to exact maths (identical results, ~45% faster).
- 2026-10-27: First by-eye playtest; fixed: touching the target now wins, First Light par 2, wrong
  planet name in a tip, tip overlapping the board, slow-motion flights on slow devices. `DAILY_VERSION` 2.
- 2026-10-27: Sound effects. User confirmed on a real phone that sound works and it plays well, and
  reported that repeating and adjusting a shot is hard (Next up 1).
- 2026-10-27: Aim numbers, last-aim arrow, "Adjust last shot" panel, arrow keys + Space. Four new holes
  (Little Moon, Soft Push, Whiplash, Grand Tour finale with scorecard); 12 holes, all solvable (fine
  rates 1.69%–0.15%). Whiplash tip rewritten after playing by eye: every win is a gentle launch (≤33%
  power), and "fly out to the black hole" made me shoot too hard. `DAILY_VERSION` 3, stamps v=6.
- 2026-10-27: User reported Levels not opening on their phone: today's daily best + a cached daily
  discarded by the `DAILY_VERSION` bump → null `d.level` crash. Fixed; overlays now scroll from the top
  and the levels card fits a phone. Longer aim preview for slow shots, a direction arrow in the readout
  (explains portrait angles), board no longer resizes when the panel opens. Played Grand Tour by eye
  (hard; widened target, retipped). `DAILY_VERSION` 4, stamps v=7; all 12 regression shots exact.
- 2026-10-27: Header stays one row on landscape phones (smaller text and buttons; logo hidden under
  760 px wide; long level names get an ellipsis). Board at 844×390 went from 300 to 348 px tall.
  Checked at 844×390 and 667×375 with the longest names; CSS only, no stamps needed.
- 2026-10-28: User playtest (S23 Ultra): aim hard to see over ghosts. Ghosts now grey (newest brighter,
  all dimmer while aiming); aim preview thicker with a dark halo and dashes flowing out of the pad.
  Drag aims snap to 0.1° / 0.1%. Stamps v=8. Checked at 384×824: aim stands out; First Light drag
  332.0° · 75.0% still a hole in one. The user also said Life Sequencer's music was beautiful and moving.
- 2026-10-28: Bigger board on upright phones. The header drops the logo and the Workshop/Build links
  (now on the Levels card) and keeps one row of buttons; Adjust sits beside the tip; the open panel is
  a two-row grid; in portrait the aim numbers take the dock's place during a drag and hide while the
  panel is open. Board at 300×490 (large-text stand-in): 94×151 → 169×270 px; at 384×640: 258×413 →
  266×425. Landscape and desktop unchanged. HTML only, no stamp bump.
- 2026-10-28: Music, because the user loved Life Sequencer's: each hole plays its own evolving Game of
  Life song, and flybys ring notes. Music button (off by default; turning it on unmutes Sound). Checked:
  every hole's song keeps 2–46 notes a bar with no silent bars over two minutes (tools/music.js); notes
  schedule in the browser with no errors; header fits at 300 px portrait and 667×375 landscape (the
  level name ellipsizes there). **Not heard by anyone yet**: the pane can't play audio to me. Stamps v=9.
- 2026-10-28: Blind playtest 1 (subagent, no source access): Grand Tour not holed in 20 shots, best miss
  41,000 km. Fine scan: only 23 of 11,160 launches won and only 1 had a winning neighbour; the tipped
  route's power window was ~0.3%. Moving the white hole from (722,194) to (975,240) opens a gentle route
  round Oberon and over the reef (readout ~28.5°, power 31–41%); fine rate 0.21% → 0.48% (suggests
  par 3; par left at 4 pending playtest 2). Tip rewritten to name both routes. Also from the playtest:
  older ghost trails fade with age and the newest is brighter; near-miss toasts say which side
  (screen terms, works rotated); toasts wrap on narrow screens. Stamps v=10.
- 2026-10-28: Murmur (new toy, `murmur/`): starlings over power lines; crossings pluck wire spans.
  Checked headless for 3 simulated minutes per flock size and by eye.
- 2026-10-28: Grand Tour, continued. Blind playtest 2 (white hole moved, new tip): not holed in 20; the
  wide route the move opened leaves the top of the board by up to 87 units, so it can't be seen or
  planned. Scored eight layouts on wins that stay on the board; removing the top reef rock (760,40)
  gave a continuous steep-lob family (readout ~55–126°, steeper = less power; every half degree from 70°
  to 90° has a 1–1.6% band). Fine rate 0.71% (suggests 3). Blind playtest 3: **holed in 6**, misses
  narrowing sensibly; it judged par 4 right for a finale, so par stays 4. Tip now: lob high over Oberon
  to skim over the reef. Lesson: check that solver wins stay on screen, not only that they exist.
- 2026-10-28: Applied the Grand Tour lesson to the daily: `simulate` now reports how far a flight strays
  off the board, and dailies from 30 Oct must be winnable on screen. Before, 6 Nov had 1 seen win of 52
  and 1 Nov 10 of 58; now 73/142 and 42/42. 60 days: no fallbacks, avg 1.4 s. Crash and lost messages
  now give the closest pass and side when within 150,000 km. Stamps v=11. Checked in the browser:
  near-miss text, today's daily builds, no console errors.
