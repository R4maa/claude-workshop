# Claude's Workshop

Small browser toys about gravity, circles and music, built by Claude (Opus 5.5) in Claude Code sessions.

**Play them:** https://r4maa.github.io/claude-workshop/

| | |
|---|---|
| [**Slingshot**](https://r4maa.github.io/claude-workshop/slingshot/) | Golf with gravity. Pull back and launch a probe around planets, a black hole and a white hole to reach the target in as few shots as you can. Twelve holes with par scores, aim shown as numbers with an "Adjust last shot" panel for fine corrections, a [**daily challenge**](https://r4maa.github.io/claude-workshop/slingshot/#daily) that is the same for everyone and harder later in the week, and a [**level editor**](https://r4maa.github.io/claude-workshop/slingshot/editor.html) whose share links only unlock once a built-in solver has found a winning shot. |
| [**Murmur**](https://r4maa.github.io/claude-workshop/murmur/) | A flock of starlings at dusk over five power lines. Each wire span is tuned to a note, and every bird that crosses one plucks it, so the flock plays its own music. Birds land and rest on the wires; touching the sky sends a hawk through them. A limiter caps the flock at about eight notes a second so a crossing shimmers rather than roars. |
| [**Pocket Orrery**](https://r4maa.github.io/claude-workshop/orrery/) | A gravity sandbox. Tap for a circular orbit or throw a planet and see its path as you aim. Shows the orbit's semi-major axis, eccentricity and period, so Kepler's third law appears in the numbers. Includes a binary star and the three-body figure-8 orbit. |
| [**Epicycles**](https://r4maa.github.io/claude-workshop/epicycles/) | Draw any closed shape; a discrete Fourier transform turns it into a chain of spinning circles that redraws it. Slide from 1 circle to 255 and watch the error fall. |
| [**Life Sequencer**](https://r4maa.github.io/claude-workshop/life-sequencer/) | A step sequencer whose score is a Game of Life board. Every bar or few bars, the automaton rewrites the melody. Five rule sets, four scales, three synth voices. |

Everything is plain HTML, CSS and JavaScript with no dependencies beyond Google Fonts. Each page works on phones.

## How they were checked

- **Slingshot music:** each hole seeds a Game of Life grid from where its bodies sit; `tools/music.js` plays every hole's song on a fake audio clock to check none falls silent.
- **Slingshot:** every level was brute-forced in Node with 11,160 launches (every whole degree, speeds 1.5 to 9) to prove it can be won, and the levels are ordered by how many of those launches succeed, with an easy hole introducing each new kind of body before the harder ones use it. The game loads the same `core.js` the solver used. One early level turned out to be impossible and was redesigned.
- **Slingshot daily:** each day's level comes from a generator seeded with the UTC date, keeping the first layout whose win rate fits that weekday's difficulty band. The solver and simulation use only arithmetic that IEEE 754 defines exactly (no `Math.cos`, `sin` or `hypot`), so every browser builds the same level. Checked over 90 days: about 1–2 s per day, no fallbacks.
- **Pocket Orrery:** the integrator is leapfrog (symplectic). Mercury's simulated period matches Kepler's law, and the figure-8 stays intact for at least 40 laps.
- **Epicycles:** the convergence notes on the page come from measuring the average error for each preset shape.
- **Murmur:** run headless in Node for three simulated minutes at each flock size: no birds lost or NaN, about a fifth of the flock perched on average, and the note limiter holding the rate under eight a second.
- **Life Sequencer:** the sequencer reseeds the board when it dies, freezes or thins out to a lone glider, so it can be left running.

## Repository layout

```
index.html            landing page
slingshot/            index.html (game), editor.html (level editor)
  core.js             physics, levels, solver, share-link encoding (also loads in Node)
  render.js           board drawing shared by the game and the editor
  solver-worker.js    runs the solver and the daily generator off the main thread
  sound.js            synthesized sound effects (Web Audio)
  tools/              Node scripts: solve every level, test share-link round trips, preview dailies
HANDOFF.md            plan and status for the ongoing Slingshot work
murmur/               index.html
orrery/               index.html
epicycles/            index.html
life-sequencer/       index.html
build.js              turns the original artifact sources into these standalone pages
```

The pages were first written as Claude artifacts, which the host wraps in a document skeleton. `build.js` adds that skeleton (doctype, viewport and a small CSS reset) plus a link back to this page. It expects the original sources as sibling folders and is kept here for reference.
