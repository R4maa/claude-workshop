// The workshop's catalogue: one entry per piece, oldest first.
//
// This file is the single source for the landing page (index.html) and for the switcher that every piece
// opens from its "Workshop" link (shell.js). To add a piece: append an entry here, put its 16:9 card art in
// art/<id>.svg, and add the two script tags to its page (see HANDOFF.md, "The frame"). Nothing else needs
// editing. Run `node tools/check-catalog.js` afterwards.
//
// Fields
//   id       folder name, also the art file name
//   title    as shown on the piece's own page
//   maker    the model that made it
//   added    ISO date
//   line     one short line for the switcher (under ~60 characters)
//   blurb    the paragraph on the landing page
//   tags     small labels on the card
//   themes   any of: gravity, waves, music, nature, maths (the landing page's filters)
//   sound    true if the piece makes sound
//   font     CSS for the title on the landing page: the piece's own typeface (load it in index.html)
//   alt      describes the card art
//   checked  what was tested, in plain words
//   open     what nobody has verified yet (be honest; an empty list is a claim)
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.WORKSHOP = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var themes = [
    { id: "gravity", label: "Gravity" },
    { id: "waves", label: "Waves" },
    { id: "music", label: "Music" },
    { id: "nature", label: "Nature" },
    { id: "maths", label: "Maths" }
  ];
  var pieces = [
    {
      id: "slingshot", title: "Slingshot", maker: "Claude Opus 5.5", added: "2026-10-27",
      line: "Golf with gravity: twelve holes, a daily, an editor",
      blurb: "Golf with gravity. Pull back, let go, and bend your probe around planets, black holes and a white hole to reach the target in as few shots as you can. Twelve holes, a daily course that is the same for everyone, and a level editor that won't share your level until a solver finds a way to win it.",
      tags: ["game", "daily challenge", "level editor"], themes: ["gravity"], sound: true,
      font: "700 1em 'Chakra Petch', sans-serif; text-transform: uppercase; letter-spacing: 0.03em",
      alt: "A dotted probe path curving around a planet into a target ring",
      checked: ["Every hole brute-forced with 11,160 launches to prove it can be won", "Three blind playtests by an agent that never saw the source", "Played on a real phone by the workshop's owner, sound and music included"],
      open: ["The daily level has not been compared on Safari or Firefox"]
    },
    {
      id: "orrery", title: "Pocket Orrery", maker: "Claude Opus 5.5", added: "2026-10-27",
      line: "A gravity sandbox that reports real orbits",
      blurb: "A gravity sandbox. Tap for a circular orbit or throw a planet and watch its path predicted as you aim. It reports real orbital elements, so Kepler's third law shows up in the numbers. Includes a binary star and the three-body figure-8.",
      tags: ["sandbox", "n-body", "Kepler"], themes: ["gravity"], sound: false,
      font: "700 1em 'Bricolage Grotesque', sans-serif; letter-spacing: -0.02em",
      alt: "A glowing star with planets on elliptical orbits",
      checked: ["Mercury's simulated period matches Kepler's third law", "The figure-8 orbit stays intact for at least 40 laps"],
      open: []
    },
    {
      id: "epicycles", title: "Epicycles", maker: "Claude Opus 5.5", added: "2026-10-27",
      line: "Draw a shape; spinning circles redraw it",
      blurb: "Draw any shape and a Fourier transform turns it into spinning circles that redraw it. Slide from one circle to 255 and watch the error fall, fastest for smooth curves and slowest for sharp corners. Ptolemy would recognise the idea.",
      tags: ["Fourier", "draw your own"], themes: ["maths"], sound: false,
      font: "800 1em 'Syne', sans-serif; letter-spacing: -0.02em",
      alt: "A chain of circles tracing a heart shape",
      checked: ["The convergence notes on the page come from measured error for each preset shape"],
      open: []
    },
    {
      id: "life-sequencer", title: "Life Sequencer", maker: "Claude Opus 5.5", added: "2026-10-27",
      line: "A step sequencer scored by the Game of Life",
      blurb: "A step sequencer whose score is a Game of Life board. Paint notes, press play, and every bar Conway's rules rewrite the melody. Gliders turn into crawling arpeggios. Five rule sets, four scales, three synth voices.",
      tags: ["sequencer", "cellular automata", "Web Audio"], themes: ["music", "maths"], sound: true,
      font: "800 0.78em 'Martian Mono', monospace; letter-spacing: -0.05em",
      alt: "A grid of note cells containing two gliders, with a highlighted playhead column",
      checked: ["Reseeds itself when the board dies, freezes or thins to one glider, so it can be left running", "Heard by the workshop's owner, who called it beautiful"],
      open: []
    },
    {
      id: "murmur", title: "Murmur", maker: "Claude Opus 5.5", added: "2026-10-28",
      line: "Starlings at dusk play the power lines",
      blurb: "Starlings at dusk over the power lines. Every bird that crosses a wire plucks it, so the flock writes its own music, and some land to rest in rows. Touch the sky to be the hawk and send them all up at once. The sky slowly turns to night and back.",
      tags: ["flocking", "generative"], themes: ["music", "nature"], sound: true,
      font: "italic 600 1.1em 'Fraunces', Georgia, serif",
      alt: "Birds flying over power lines against a dusk sky, a few perched on the wires",
      checked: ["Run headless for three simulated minutes at each flock size: no bird lost, notes held under eight a second"],
      open: []
    },
    {
      id: "nodal", title: "Nodal", maker: "Claude Fable 5.2", added: "2026-11-10",
      line: "Sand figures on a humming metal plate",
      blurb: "Sand on a humming metal plate. It jumps away from wherever the plate shakes and settles along the lines that stay still, drawing a new figure at every resonance. Slide the pitch, or drag the spot where the plate is shaken, and watch it redraw.",
      tags: ["Chladni figures", "resonance"], themes: ["waves"], sound: true,
      font: "400 1.1em 'Young Serif', Georgia, serif",
      alt: "Sand on a dark square plate, gathered into a diamond, a ring and four corner arcs",
      checked: ["The 120 Hz centre figure is the one theory predicts", "Settled sand sits where the plate shakes about a quarter as hard"],
      open: ["Nobody has heard its sound", "Not tried on a real phone"]
    },
    {
      id: "lens", title: "Lens", maker: "Claude Fable 5.2", added: "2026-11-10",
      line: "Fly around a black hole, ray-traced live",
      blurb: "Fly around a black hole. Every pixel follows a ray of light through curved space, so the far side of the disc arches over the shadow, its underside loops beneath, and the stars smear into rings as you move. Switch gravity off to see how plain it would look if light went straight.",
      tags: ["general relativity", "WebGL"], themes: ["gravity"], sound: false,
      font: "400 1.15em 'Italiana', Georgia, serif; letter-spacing: 0.14em; text-transform: uppercase",
      alt: "A black hole: a dark circle with a glowing disc that arches over its top and loops beneath it",
      checked: ["Light bending and the capture threshold match the formulas to a fraction of a percent", "The shadow measured from the pixels: 86.5 px against an exact 86.9"],
      open: ["Speed on a real phone", "Safari and Firefox"]
    },
    {
      id: "ripple-tank", title: "Ripple Tank", maker: "Claude Haiku 5.5", added: "2026-11-10",
      line: "Drop stones, set sources, paint walls",
      blurb: "A ripple tank with the real wave equation underneath. Drop stones, set two sources against each other and watch the fringes form, or paint walls and see the waves reflect, bend around an edge and cast a shadow.",
      tags: ["wave equation", "interference"], themes: ["waves"], sound: false,
      font: "600 0.86em 'Unbounded', sans-serif; letter-spacing: -0.02em",
      alt: "Concentric ripples spreading from two points on a dark blue pool, overlapping into a fringe pattern",
      checked: ["Stays stable over 3,000 steps with two sources running", "A wall with a gap casts a measurable shadow"],
      open: ["Speed on a real phone", "Safari and Firefox"]
    },
    {
      id: "meander", title: "Meander", maker: "Claude Fable 5.2", added: "2026-11-10",
      line: "A river that draws its own map",
      blurb: "A river that draws its own map. Its bends grow, lean downstream and curl until the river breaks through the neck and leaves an oxbow lake behind. Every 60 years the ground it has left gets a new colour, so the valley fills with the record of every course it has held. Drag the river to bend it yourself.",
      tags: ["rivers", "simulation", "generative map"], themes: ["nature"], sound: false,
      font: "italic 400 1.2em 'IM Fell English', Georgia, serif",
      alt: "An old-fashioned survey map: a pale river looping across a valley, with bands of pastel colour marking where it used to run",
      checked: ["Five rivers run for 12,000 years each without tangling or stalling", "Dragging tested with scripted touches: the river follows to within 3 units"],
      open: ["Smoothness on a real phone", "Safari and Firefox"]
    },
    {
      id: "harmonograph", title: "Harmonograph", maker: "Claude Sonnet 5.5", added: "2026-11-10",
      line: "Four pendulums draw a musical interval",
      blurb: "Four pendulums swing a pen over paper, each slowly losing height, and the figure they draw is the interval you pick: a fifth is three swings sideways for every two up and down. Detune the pairs a little and the picture turns inside out as it fades. The same four ratios play as a chord, so you hear the beating you see.",
      tags: ["Lissajous figures", "pendulums"], themes: ["waves", "music"], sound: true,
      font: "italic 600 1.2em 'Cormorant Garamond', Georgia, serif",
      alt: "A looping ink figure drawn by pendulums, amber at the outside and fading to teal toward the centre",
      checked: ["Every interval closes after one base period", "The beating matches its formula within 3%"],
      open: ["Nobody has listened to its sound", "Not tried on a real phone"]
    }
  ];
  return { themes: themes, pieces: pieces };
});
