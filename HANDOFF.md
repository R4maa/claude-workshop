# Handoff: Claude's Workshop (Slingshot 2.0 and the rest)

**For whichever model picks this up:** the workshop is passed from one Claude model to the next as they
improve (the user's plan, 2026-11-10). Opus 5.5 built everything up to Murmur; Fable 5.2 added Nodal.
You are invited to add your own piece or improve any of them. Test what you claim and say what you didn't verify. Sign your additions: each landing-page card carries
an "Added <date> · <model>" line, and the README and Log record it too.

**No restrictions on tools (user, 2026-11-10):** the user wants Claude to have no restrictions here.
Libraries, frameworks, build steps and anything else are allowed for new work if you want them. The
"no build step, no dependencies" rule below was Opus 5.5's own choice for Slingshot, not the user's; it
still describes how the existing pages are built (and why they deploy from `main` as plain files), but it
does not bind new pieces. If you add a build step, make sure GitHub Pages still gets built output. The Slingshot notes below are still the bulk of this file.

**Several sessions may be working here at once.** On 2026-11-10 Haiku 5.5, Sonnet 5.5 and Fable 5.2 sessions
overlapped in this one checkout. Read `index.html`, `README.md` and this file again right before you edit
them, change them with small replacements rather than rewriting them, and commit only your own files and
hunks (untracked folders that aren't yours belong to someone else). The git index is shared too: commit
eb6bd2b is titled Meander but also carries Harmonograph's files, because the Sonnet session staged them
between this session's `git add` and `git commit`. Stage and commit in a single command, and read
`git show --stat HEAD` afterwards.

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

- **No build step, no dependencies** (Slingshot's own convention, see the note at the top; not a limit on
  new work). Plain HTML/CSS/JS. Shared logic in `slingshot/core.js`, which also
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

## Lens (lens/, added 2026-11-10 by Fable 5.2)

- A Schwarzschild black hole ray-traced in one WebGL1 fragment shader (inline in `index.html`). No library:
  a full-screen shader didn't need one. Units: r_s = 1. Light paths use x'' = −1.5·h²·x/r⁵ (exact).
- **The integrator exists twice:** GLSL in `index.html` and JS in `geodesic.js` (step rule
  `r·mix(0.045, 0.1, smoothstep(2.5, 18, r))`, 300 steps, far = max(60, 2·distance)). Change both together,
  then run `node lens/tools/check.js` and, in the browser console, `__lens.shadow()` (measured vs exact
  shadow radius in pixels; they agreed to half a pixel at 729 px and 338 px wide).
- Found by the tests: the camera's ray directions are local, so their radial part must be scaled by
  sqrt(1 − 1/r) before tracing; without it the shadow was 8% too big from 6 radii.
- The frame loop trades resolution for speed (scale 0.3–1, starts 0.6). **Not verified:** speed on a real
  phone, and nothing has been checked on Safari or Firefox.
- Disc: ISCO at 3 to 14 radii, temperature r^(-3/4) profile, shift g = sqrt(1 − 1.5/r)/(1 − Ω·l_z) (exact
  for a far viewer; the camera's own gravitational blueshift is ignored), brightness g⁴T⁴ then tone-mapped.
- Ideas: a spinning (Kerr) hole; star brightening from lensing magnification; a real star catalogue;
  bloom; a free-fall camera that crosses the horizon.

## Nodal (nodal/, added 2026-11-10 by Fable 5.2)

- Chladni figures: `plate.js` is the model (loads in Node too), `index.html` the page, `tools/check.js`
  the checks (`node nodal/tools/check.js`, all should pass). Script stamp `plate.js?v=1`; bump on change.
- Model: 195 cosine modes, f = 30·(m²+n²) Hz, Q = 90, point driver. `level()` is exact via orthogonality,
  so the pitch strip costs almost nothing. Sand = random hops sized by local |u|.
- Not verified: **nobody has heard it** (a sine at the driving pitch plus a quiet octave; loudness follows
  the plate's response) and it has not been tried on a real phone. Ask the user if they offer.
- Ideas: true free-plate modes (Ritz method) so figures are rounder like real ones; a circular plate
  (Bessel modes); letting grains fall off the edge; a bow instead of a steady driver.

## Ripple Tank (ripple-tank/, added 2026-11-10 by Haiku 5.5)

- Wave equation on a 200×200 grid: `u'' = c²∇²u`, explicit leapfrog, c² = 0.35 (stable up to 0.5). Two buffers
  plus scratch; `tank.js` is the solver (loads in Node too). Walls are cells held at zero. The edge is a
  14-cell sponge (damping rising to the edge) so waves don't bounce back.
- Sources add `amp·sin(2πft)` per step at a cell; `freq` is cycles per step, slider 0.03–0.2.
- Checked in Node (`tank.js` loaded directly): two sources stay finite (max |u| 0.87 over 3000 steps), a drop
  reaches 30 cells in 42 steps, and a wall with a gap casts a shadow (behind the wall ~0.002 mean |u|, beside
  the gap ~0.009). In the browser at 375 px: no horizontal scroll, drop and two-source fringes render, no
  console errors checked. **Not verified:** the landing card in the pane, phone speed, Safari/Firefox, and
  how the wall/erase tools feel by hand.
- Ideas: a sound from the sources; a shallow-water depth change (slower waves over a shoal); a laser-style
  single slit tool; a periodic wave-maker that pushes waves along the bottom edge.

## Harmonograph (harmonograph/, added 2026-11-10 by Sonnet 5.5)

- Four damped pendulums: x = (a0 sin(w0 t) + a1 sin(w1 t)) e^(-d t), same for y. Interval p:q sets the carriers
  (x swings at p, y at q); the second pendulum on each axis is detuned by `drift` cents (opposite signs), so
  each pair beats and the figure precesses. `harmonograph.js` is the model (loads in Node), `index.html` the page;
  `node harmonograph/tools/check.js` should print "all passed". Script stamp `harmonograph.js?v=1`; bump on change.
- Sound uses the same four ratios (BASE_HZ 98 × ratio), sines panned left (x pair) / right (y pair), gains follow
  the decay. The pen runs at ~1.5 Hz and the tones at ~100-500 Hz, so the two only agree in ratio, not speed.
- Drawing: additive blending on a 1200×1200 canvas, segments stroked in chunks of 12 per path. Stroking every
  tiny segment separately gave a visible dot at each joint, so keep the chunking if you touch it.
- Pane gotcha: the Browser pane only runs animation while its tab is fronted *and* a tool call is in flight; a
  `setTimeout` promise inside one javascript_tool call saw the clock stand still. Use `wait` calls, then read state.
- Not verified: **nobody has heard it**, nothing on a real phone, nothing on Safari/Firefox. The beating test
  allows 3% of full scale because the slow envelope changes during the single carrier cycle it is measured over.
- Ideas: drag on the paper to set amplitude/phase; a rotary (third-axis) pendulum; export SVG instead of PNG;
  let the user draw the damping curve; a slow "sub-audio" mode where each swing is audible.

## Meander (meander/, added 2026-11-10 by Fable 5.2)

- A meandering river that maps its own history. `meander.js` is the model (loads in Node), `index.html` the
  page, `tools/check.js` the checks (`node meander/tools/check.js`, about 90 s, all should say ok),
  `tools/run.js [seed] [years]` prints a river's progress for tuning. Script stamp `meander.js?v=1`.
- Model: a centreline of points 5 units apart, channel 14 wide. Migration is Howard & Knutson's rule
  (local curvature × −1 plus 2.5 × an exponentially fading upstream average, memory 2.6 widths), scaled by
  sinuosity^(−2/3). Neck cutoff when centrelines come within one width. Ends pinned off-screen
  (x −700 and 3100; the map shows 0–2400). The inflow wobbles slowly so new bends keep arriving.
  Changing any number in `P` changes how rivers look: rerun the checks and look at it.
- The map is a grid (1280×720, or 800×450 on small screens) holding the year the river last covered each
  cell. Survey = that year in 60-year bands, with an ink line where bands meet; Satellite = age as sand to
  forest. Lakes are drawn from the cut loops and vanish where the river has since crossed them.
- Measured in the pane (desktop size): a model step 1.3 ms, Survey recolour 10–13 ms (so it runs every
  other frame), Satellite recolour 3.5 ms, the vector drawing 2–4 ms.
- **Not verified:** smoothness on a real phone (the pane runs too slowly to judge frame rate, so only the
  costs above were measured); Safari and Firefox; touch dragging on a real screen (tested with scripted
  pointer events: the river followed to within 3 units, also while paused).
- Ideas: chute cutoffs and floods; banks of different hardness (a clay plug where an old lake filled in
  slows the river, as on the real Mississippi); a share link for a seed; a "survey sheet" export as PNG;
  sound of water that follows the nearest bend.

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
- 2026-11-10: First session by Fable 5.2. Added Nodal (`nodal/`): sand on a driven square plate. Checked
  in Node (analytic loudness matches the grid, 120 Hz centre figure correct, sand settles to ~25% of its
  starting shake) and by eye in the pane at desktop and 375×812: figures form, Figure ◀▶ jumps between
  resonances, dragging the driver changes the spectrum, Sweep glides; no console errors. Sound unheard.
  Landing page: Nodal is the wide card on top, Life Sequencer wide at the bottom so six cards fit.
- 2026-11-10: The user lifted all restrictions (libraries, build steps allowed) and asked for date + model
  on every landing-page card; done. Then added Lens (`lens/`): a black hole you can orbit. Node checks pass
  (bending, capture threshold, shadow size, step budget, photon sphere); in the pane: default, high and
  close views, Gravity off, About card, 375×812, shadow measured from pixels, no console errors. Lens is
  now the wide card; the other six sit in two columns.
- 2026-11-10: Ripple Tank (`ripple-tank/`), by Haiku 5.5. A wave-equation pool: drop stones, place sources
  that interfere, paint walls that reflect and shadow. Checked in Node (stability, propagation, shadow) and in
  the pane at 375 px (no horizontal scroll, sources interfere). Landing card and README entry added. Not
  verified: the landing card in the pane, phone speed, other browsers. Note: `meander/` and `today/` were
  untracked in this folder when Ripple Tank was made; they belong to another session and were not touched.
- 2026-11-10: First session by Sonnet 5.5, invited by the user to add anything. Added Harmonograph (`harmonograph/`): pendulum model with Node checks (all pass), page with seven just intervals, drift and ring-time sliders, three speeds, looping, PNG save, sound. Checked in the pane: a full figure at ×16 with no console errors, sound toggles without errors, 375 px width has no horizontal scroll, landing card renders beside Ripple Tank. Found while working: other sessions (Haiku 5.5: Ripple Tank; others: Meander, Today) were editing the landing page and this repo at the same time, so I used anchored inserts and did not touch their folders.
- 2026-11-10: Meander (`meander/`), by Fable 5.2: a river that wanders, cuts off oxbow lakes and colours a
  map of where it has been. Node checks pass (six, including five rivers over 12,000 years); the long-run
  check first failed because the river slid under the wavy valley walls, fixed with a clamp after each
  step. In the pane: both styles, drag (playing and paused), New river, About, 375×812 upright, no console
  errors. Landing page: Meander is the wide card on top and Life Sequencer is wide again so the columns
  stay even. Other sessions were committing here at the same time (Ripple Tank, Harmonograph); the
  untracked `today/` and `harmonograph/` folders are not mine and were left alone.
