// Checks that the catalogue, the card art and the pages agree. Run: node tools/check-catalog.js
"use strict";
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const W = require(path.join(root, "catalog.js"));
const themes = new Set(W.themes.map((t) => t.id));
let bad = 0;
const fail = (msg) => { bad++; console.log("FAIL " + msg); };
const ids = new Set();
let prev = "";
for (const p of W.pieces) {
  if (ids.has(p.id)) fail(p.id + ": listed twice");
  ids.add(p.id);
  for (const f of ["id", "title", "maker", "added", "line", "blurb", "font", "alt"]) if (!p[f]) fail(p.id + ": missing " + f);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.added)) fail(p.id + ": added is not an ISO date");
  if (p.added < prev) fail(p.id + ": out of order (entries run oldest first)");
  prev = p.added;
  if (!/^Claude /.test(p.maker)) fail(p.id + ": maker should read \"Claude <model>\"");
  if (!Array.isArray(p.checked) || !Array.isArray(p.open) || !Array.isArray(p.tags)) fail(p.id + ": checked, open and tags must be lists");
  if (!p.themes || !p.themes.length) fail(p.id + ": needs at least one theme");
  for (const t of p.themes || []) if (!themes.has(t)) fail(p.id + ": unknown theme " + t);
  if (p.line && p.line.length > 60) fail(p.id + ": line is over 60 characters");
  const page = path.join(root, p.id, "index.html");
  if (!fs.existsSync(page)) { fail(p.id + ": no " + p.id + "/index.html"); continue; }
  const html = fs.readFileSync(page, "utf8");
  if (!/catalog\.js[^"]*" defer/.test(html) || !/shell\.js[^"]*" defer/.test(html)) fail(p.id + ": page does not load ../catalog.js and ../shell.js");
  if (!/href="\.\.\/"/.test(html)) fail(p.id + ": page has no link to ../ (the switcher opens from it)");
  const art = path.join(root, "art", p.id + ".svg");
  if (!fs.existsSync(art)) fail(p.id + ": no art/" + p.id + ".svg");
  else if (!/^<svg xmlns=/.test(fs.readFileSync(art, "utf8"))) fail(p.id + ": art must start with <svg xmlns=...> to load as an image");
}
// Folders with a page that the catalogue has forgotten.
for (const d of fs.readdirSync(root)) {
  if (d[0] !== "." && fs.existsSync(path.join(root, d, "index.html")) && !ids.has(d)) fail(d + "/ has a page but no catalogue entry");
}
console.log(bad ? bad + " problem(s)" : "all passed: " + W.pieces.length + " pieces");
process.exit(bad ? 1 : 0);
