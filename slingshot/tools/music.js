// Runs sound.js against a fake Web Audio context that logs every oscillator start.
// node tools/music.js: plays every hole's song for two minutes on a fake audio clock and prints notes per bar.
const fs = require("fs"), vm = require("vm"), path = require("path"), dir = path.join(__dirname, "..");
const notes = [];
const node = () => new Proxy({}, { get(t, k) {
  if (k === "connect") return (x) => x;
  if (k in t) return t[k];
  if (["gain", "frequency", "delayTime", "Q", "pan", "threshold", "ratio"].includes(k)) return t[k] = { value: 0, setValueAtTime(){}, exponentialRampToValueAtTime(){}, setTargetAtTime(){}, cancelScheduledValues(){} };
  return () => {};
}, set(t, k, v) { t[k] = v; return true; } });
class Ctx { constructor(){ Ctx.last = this; this.currentTime = 0; this.sampleRate = 8000; this.state = "running"; this.destination = node(); }
  createGain(){return node();} createDynamicsCompressor(){return node();} createDelay(){return node();} createBiquadFilter(){return node();}
  createConvolver(){return node();} createStereoPanner(){return node();} createBuffer(){return { getChannelData: () => new Float32Array(10) };}
  createBufferSource(){return node();}
  createOscillator(){ const o = node(); const self = this; o.start = (t) => notes.push({ t, f: o.frequency.value }); return o; } }
let intervals = [];
const sb = { window: { AudioContext: Ctx }, document: { hidden: false, addEventListener(){} }, localStorage: { getItem: () => null, setItem(){} },
  setInterval: (f) => (intervals.push(f), intervals.length), clearInterval(){}, Math, console };
vm.createContext(sb);
const core = fs.readFileSync(dir + "/core.js", "utf8").replace(/^const (\w+)/gm, "var $1").replace(/^function /gm, "function ");
vm.runInContext(core + "\n" + fs.readFileSync(dir + "/sound.js", "utf8") + "\nthis.LEVELS=LEVELS;this.createSound=createSound;", sb);
for (const lv of sb.LEVELS) {
  notes.length = 0; intervals = [];
  const s = sb.createSound(); s.unlock(); s.music = true; s.setLevel(lv);
  // advance 120 s of audio time in 50 ms ticks
  for (let t = 0; t < 120; t += 0.05) { Ctx.last.currentTime = t; intervals.forEach((f) => f()); }
  const fund = notes.filter((_, i) => i % 3 === 0), bar = 16 * 60 / 76 / 2, bars = [];
  for (const n of fund) { const b = Math.floor(n.t / bar); bars[b] = (bars[b] || 0) + 1; }
  const midis = [...new Set(fund.map((n) => Math.round(69 + 12 * Math.log2(n.f / 440))))].sort((a, b) => a - b);
  console.log(lv.name.padEnd(14), "notes/bar:", Array.from(bars, (x) => x || 0).join(" "), "| midi", midis[0] + "-" + midis[midis.length - 1]);
}
