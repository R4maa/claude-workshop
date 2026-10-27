// Turns the artifact-style page sources (no <html>/<head>/<body>) into standalone pages for GitHub Pages.
// Usage: node build.js <sources-dir>   (expects pocket-orrery/, life-sequencer/, epicycles/, slingshot/ inside it)
const fs = require("fs"), path = require("path");
const src = process.argv[2];
const PAGES = { "pocket-orrery": "orrery", "life-sequencer": "life-sequencer", epicycles: "epicycles", slingshot: "slingshot" };

// The small reset the artifact host normally adds around each page.
const RESET =
  ":root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}" +
  "body{margin:0;font:14px system-ui,-apple-system,'Segoe UI',sans-serif}img{max-width:100%}[hidden]{display:none!important}";

// A way home, placed in each page's own header and styled to match it: [text to find, replacement, extra CSS].
const LINK = `<a class="home" href="../">&larr; Claude&rsquo;s Workshop</a>`;
const HOME = {
  orrery: [
    `<div class="brand">`, `<div class="brand">${LINK}`,
    ".home{pointer-events:auto;justify-self:start;color:var(--muted);font-size:11px;text-decoration:none;letter-spacing:.04em}.home:hover{color:var(--fg)}",
  ],
  "life-sequencer": [
    `<header>`, `<header>${LINK}`,
    ".home{justify-self:start;color:var(--muted);font-size:13px;text-decoration:none}.home:hover{color:var(--fg)}",
  ],
  epicycles: [
    `<header>`, `<header>${LINK}`,
    ".home{justify-self:start;color:var(--muted);font-size:13px;text-decoration:none}.home:hover{color:var(--ink)}",
  ],
  slingshot: [
    `<div class="btns">`, `<div class="btns"><a class="btn home" href="../">Workshop</a>`,
    "a.btn{text-decoration:none;display:inline-block}",
  ],
};

for (const [dir, slug] of Object.entries(PAGES)) {
  const html = fs.readFileSync(path.join(src, dir, "index.html"), "utf8").replace(/<meta name="claude:viewport-fit-sides"[^>]*>\n?/, "");
  // Everything up to the end of the first <style> block belongs in <head>; the rest is body content.
  const cut = html.indexOf("</style>") + "</style>".length;
  const [find, repl, css] = HOME[slug];
  if (!html.slice(cut).includes(find)) throw new Error(`No place for the home link in ${slug}`);
  const head = html.slice(0, cut).replace("</style>", `${css}\n</style>`);
  const body = html.slice(cut).replace(find, repl);
  const out = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>${RESET}</style>
${head}
</head>
<body>${body}
</body>
</html>
`;
  fs.mkdirSync(slug, { recursive: true });
  fs.writeFileSync(path.join(slug, "index.html"), out);
  for (const extra of fs.readdirSync(path.join(src, dir)).filter((f) => f.endsWith(".js"))) {
    fs.copyFileSync(path.join(src, dir, extra), path.join(slug, extra));
  }
  console.log("built", slug);
}
