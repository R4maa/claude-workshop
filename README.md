# Claude's Workshop

Small browser toys about gravity, circles, vibration, rivers and music, built by Claude in Claude Code sessions. The workshop is handed from one Claude model to the next: Opus 5.5 made the first five, Fable 5.2 added Nodal, Lens and Meander, and Haiku 5.5 added Ripple Tank.

**Play them:** https://r4maa.github.io/claude-workshop/

| | |
|---|---|
| [**Meander**](https://r4maa.github.io/claude-workshop/meander/) | A river wandering across its valley. Each point of the bank moves at a rate set by the channel's curvature a little way upstream (Howard and Knutson's 1984 rule), which is enough for bends to grow, lean downstream, curl into loops and cut themselves off as oxbow lakes. The Survey view colours the ground by when the river last crossed it, in the manner of Harold Fisk's 1944 Mississippi maps; the Satellite view shows the same record as fresh sand greening over. You can drag the river. |
| [**Lens**](https://r4maa.github.io/claude-workshop/lens/) | A black hole you can fly around, drawn in a WebGL fragment shader. Each pixel traces a light ray backwards through Schwarzschild spacetime until it falls in, crosses the gas disc or escapes to the stars, so you see the disc's far side lifted over the shadow, its underside below, the photon ring, and Doppler brightening on the approaching side. A Gravity switch shows the same scene with straight light. |
| [**Nodal**](https://r4maa.github.io/claude-workshop/nodal/) | Sand on a vibrating square plate (Chladni figures). A point driver shakes the plate at one pitch; the sand hops away from wherever the plate moves and gathers on the nodal lines. Slide the pitch through the resonances, or drag the driver to excite different modes, and hear the plate hum louder as each figure snaps in. |
| [**Slingshot**](https://r4maa.github.io/claude-workshop/slingshot/) | Golf with gravity. Pull back and launch a probe around planets, a black hole and a white hole to reach the target in as few shots as you can. Twelve holes with par scores, aim shown as numbers with an "Adjust last shot" panel for fine corrections, a [**daily challenge**](https://r4maa.github.io/claude-workshop/slingshot/#daily) that is the same for everyone and harder later in the week, and a [**level editor**](https://r4maa.github.io/claude-workshop/slingshot/editor.html) whose share links only unlock once a built-in solver has found a winning shot. |
| [**Murmur**](https://r4maa.github.io/claude-workshop/murmur/) | A flock of starlings at dusk over five power lines. Each wire span is tuned to a note, and every bird that crosses one plucks it, so the flock plays its own music. Birds land and rest on the wires; touching the sky sends a hawk through them. A limiter caps the flock at about eight notes a second so a crossing shimmers rather than roars. |
| [**Ripple Tank**](https://r4maa.github.io/claude-workshop/ripple-tank/) | A ripple tank on a 200 × 200 grid of the 2-D wave equation, stepped explicitly in plain JavaScript. Drop stones, place two or more oscillating sources and watch the interference fringes form, or paint walls and see waves reflect, bend round an edge and cast a shadow. A frequency slider changes every source at once, and a sponge at the edge stops waves bouncing back. Added 10 Nov 2026 by Claude Haiku 5.5. |
| [**Harmonograph**](https://r4maa.github.io/claude-workshop/harmonograph/) | Four damped pendulums swing a pen over paper: two steer it sideways, two up and down, and the figure they draw is an interval (a fifth is 3:2). A second pendulum on each axis is tuned a few cents off its partner, so the pair beat and the figure turns inside out as it fades. The same four ratios play as sine tones, sideways pair left and up-and-down pair right, so the beating you see is the beating you hear. Save the result as a PNG. |
| [**Pocket Orrery**](https://r4maa.github.io/claude-workshop/orrery/) | A gravity sandbox. Tap for a circular orbit or throw a planet and see its path as you aim. Shows the orbit's semi-major axis, eccentricity and period, so Kepler's third law appears in the numbers. Includes a binary star and the three-body figure-8 orbit. |
| [**Epicycles**](https://r4maa.github.io/claude-workshop/epicycles/) | Draw any closed shape; a discrete Fourier transform turns it into a chain of spinning circles that redraws it. Slide from 1 circle to 255 and watch the error fall. |
| [**Life Sequencer**](https://r4maa.github.io/claude-workshop/life-sequencer/) | A step sequencer whose score is a Game of Life board. Every bar or few bars, the automaton rewrites the melody. Five rule sets, four scales, three synth voices. |

So far everything is plain HTML, CSS and JavaScript with no dependencies beyond Google Fonts. That was a choice, not a rule: later pieces may use libraries. Each page works on phones.

## How they were checked

- **Meander:** `meander/meander.js` is the model and `meander/tools/check.js` tests it: the curvature of a circle comes out as 1/R, a bend's apex moves outwards, a loop pressed against itself is cut and kept as a lake, and five rivers run for 12,000 years each stay finite, inside the valley walls and still cutting off loops at the end (average sinuosity about 3.1). The first run of that last check failed: the river was slipping under the wavy valley walls, which is now prevented. The years are nominal, and floods, chute cutoffs and uneven banks are left out.
- **Lens:** `lens/geodesic.js` is a JavaScript copy of the shader's integrator, and `lens/tools/check.js` tests it: light bending matches the second-order formula to 0.3% for distant passes, the capture threshold is within 0.1% of 3√3/2 radii, and the shadow's apparent size matches the exact formula to 0.1% from 6 to 60 radii away. In the browser, the shader's own shadow was measured from the pixels: 86.5 px against an exact 86.9. The disc's texture is decoration and the hole does not spin.
- **Nodal:** the plate's response is a damped sum over 195 cosine modes (the textbook approximation for a free square plate; real plates draw rounder figures). `nodal/tools/check.js` confirms that the loudness shortcut matches the computed field, that a centre driver at 120 Hz gives the expected (2,0)+(0,2) figure, and that the average shaking under a grain falls to about a quarter once the sand has settled.
- **Slingshot music:** each hole seeds a Game of Life grid from where its bodies sit; `tools/music.js` plays every hole's song on a fake audio clock to check none falls silent.
- **Slingshot:** every level was brute-forced in Node with 11,160 launches (every whole degree, speeds 1.5 to 9) to prove it can be won, and the levels are ordered by how many of those launches succeed, with an easy hole introducing each new kind of body before the harder ones use it. The game loads the same `core.js` the solver used. One early level turned out to be impossible and was redesigned.
- **Slingshot daily:** each day's level comes from a generator seeded with the UTC date, keeping the first layout whose win rate fits that weekday's difficulty band. The solver and simulation use only arithmetic that IEEE 754 defines exactly (no `Math.cos`, `sin` or `hypot`), so every browser builds the same level. Checked over 90 days: about 1–2 s per day, no fallbacks.
- **Harmonograph:** `harmonograph/tools/check.js` tests the model: every interval closes after one base period with no drift or damping, the swing is exactly 1% at the ring time and never grows, the pen stays inside the unit square, a drifted pair's measured swing matches the beat-envelope formula (within 3% of full scale at 50 cents; tighter at small drift), the two partners are detuned by the stated cents in opposite directions, and the interval ratios give the textbook just values (fifth 701.955 cents). In the browser: a full 60 s figure drew without errors and the page has no horizontal scroll at 375 px. The sound runs without errors but **nobody has listened to it**.
- **Pocket Orrery:** the integrator is leapfrog (symplectic). Mercury's simulated period matches Kepler's law, and the figure-8 stays intact for at least 40 laps.
- **Epicycles:** the convergence notes on the page come from measuring the average error for each preset shape.
- **Murmur:** run headless in Node for three simulated minutes at each flock size: no birds lost or NaN, about a fifth of the flock perched on average, and the note limiter holding the rate under eight a second.
- **Life Sequencer:** the sequencer reseeds the board when it dies, freezes or thins out to a lone glider, so it can be left running.

## Repository layout

```
index.html            landing page, drawn from catalog.js
catalog.js            the list of pieces: maker, date, description, what was checked and what wasn't
shell.js              loaded by every piece: its Workshop link opens a switcher to all the others
art/                  one card image per piece
tools/check-catalog.js  checks that the catalogue, the art and the pages agree
slingshot/            index.html (game), editor.html (level editor)
  core.js             physics, levels, solver, share-link encoding (also loads in Node)
  render.js           board drawing shared by the game and the editor
  solver-worker.js    runs the solver and the daily generator off the main thread
  sound.js            synthesized sound effects (Web Audio)
  tools/              Node scripts: solve every level, test share-link round trips, preview dailies
HANDOFF.md            plan and status for the ongoing Slingshot work, and notes between models
lens/                 index.html (shader and controls), geodesic.js (testable copy of the integrator), tools/check.js
meander/              index.html (map and controls), meander.js (the river model, also loads in Node), tools/check.js
nodal/                index.html, plate.js (the plate model, also loads in Node), tools/check.js
ripple-tank/          index.html (page), tank.js (the wave solver, also loads in Node)
murmur/               index.html
harmonograph/        index.html, harmonograph.js (the pendulum model, also loads in Node), tools/check.js
orrery/               index.html
epicycles/            index.html
life-sequencer/       index.html
build.js              turns the original artifact sources into these standalone pages
```

The pages were first written as Claude artifacts, which the host wraps in a document skeleton. `build.js` adds that skeleton (doctype, viewport and a small CSS reset) plus a link back to this page. It expects the original sources as sibling folders and is kept here for reference.
