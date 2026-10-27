# Claude's Workshop

Four small browser toys about gravity, circles and music, built by Claude (Opus 5.5) in a single Claude Code session.

**Play them:** https://r4maa.github.io/claude-workshop/

| | |
|---|---|
| [**Slingshot**](https://r4maa.github.io/claude-workshop/slingshot/) | Golf with gravity. Pull back and launch a probe around planets, a black hole and a white hole to reach the target in as few shots as you can. Eight holes with par scores, plus a [**level editor**](https://r4maa.github.io/claude-workshop/slingshot/editor.html) whose share links only unlock once a built-in solver has found a winning shot. |
| [**Pocket Orrery**](https://r4maa.github.io/claude-workshop/orrery/) | A gravity sandbox. Tap for a circular orbit or throw a planet and see its path as you aim. Shows the orbit's semi-major axis, eccentricity and period, so Kepler's third law appears in the numbers. Includes a binary star and the three-body figure-8 orbit. |
| [**Epicycles**](https://r4maa.github.io/claude-workshop/epicycles/) | Draw any closed shape; a discrete Fourier transform turns it into a chain of spinning circles that redraws it. Slide from 1 circle to 255 and watch the error fall. |
| [**Life Sequencer**](https://r4maa.github.io/claude-workshop/life-sequencer/) | A step sequencer whose score is a Game of Life board. Every bar or few bars, the automaton rewrites the melody. Five rule sets, four scales, three synth voices. |

Everything is plain HTML, CSS and JavaScript with no dependencies beyond Google Fonts. Each page works on phones.

## How they were checked

- **Slingshot:** every level was brute-forced in Node with 11,160 launches (every whole degree, speeds 1.5 to 9) to prove it can be won, and the levels are ordered by how many of those launches succeed. The game loads the same `core.js` the solver used. One early level turned out to be impossible and was redesigned.
- **Pocket Orrery:** the integrator is leapfrog (symplectic). Mercury's simulated period matches Kepler's law, and the figure-8 stays intact for at least 40 laps.
- **Epicycles:** the convergence notes on the page come from measuring the average error for each preset shape.
- **Life Sequencer:** the sequencer reseeds the board when it dies, freezes or thins out to a lone glider, so it can be left running.

## Repository layout

```
index.html            landing page
slingshot/            index.html (game), editor.html (level editor)
  core.js             physics, levels, solver, share-link encoding (also loads in Node)
  render.js           board drawing shared by the game and the editor
  solver-worker.js    runs the solver off the main thread for the editor
  tools/              Node scripts: solve every level, test share-link round trips
HANDOFF.md            plan and status for the ongoing Slingshot work
orrery/               index.html
epicycles/            index.html
life-sequencer/       index.html
build.js              turns the original artifact sources into these standalone pages
```

The pages were first written as Claude artifacts, which the host wraps in a document skeleton. `build.js` adds that skeleton (doctype, viewport and a small CSS reset) plus a link back to this page. It expects the original sources as sibling folders and is kept here for reference.
