// The workshop's frame: every piece loads this after catalog.js.
//
// It leaves the piece's own layout alone. It only (1) remembers that the piece was opened, so the landing
// page can tick it off, and (2) turns the piece's existing "Workshop" link into a switcher: a panel listing
// every piece, with the way home at the top, so you can move from one to the next without a round trip.
// Without JavaScript, or if this file fails to load, the link is still a plain link home.
//
// Everything lives in a shadow root, so no page's CSS can reach it and it can't disturb the page.
(function () {
  "use strict";
  var W = window.WORKSHOP;
  var me = document.currentScript;
  if (!W || !me || !document.body.attachShadow || !window.HTMLDialogElement) return;

  var base = new URL(".", me.src).href;                       // the workshop's root
  var here = location.href.slice(base.length).split(/[/?#]/)[0];
  var pieces = W.pieces;
  var at = -1;
  for (var i = 0; i < pieces.length; i++) if (pieces[i].id === here) at = i;

  // ---- visits (shared with the landing page; same origin) ----
  function readSeen() { try { return JSON.parse(localStorage.getItem("workshop.seen")) || {}; } catch (e) { return {}; } }
  var seen = readSeen();
  if (at >= 0) {
    seen[here] = new Date().toISOString().slice(0, 10);
    try { localStorage.setItem("workshop.seen", JSON.stringify(seen)); } catch (e) {}
  }

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function day(iso) { var p = iso.split("-"); return +p[2] + " " + MONTHS[p[1] - 1] + " " + p[0]; }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  var CSS = [
    ":host{all:initial}",
    "*{box-sizing:border-box}",
    "dialog{--bg:#131210;--card:#1c1a17;--ink:#f0ebe1;--muted:#a39c8f;--line:#2f2c27;--accent:#ff9a5c;",
    " font:15px/1.5 'IBM Plex Sans',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;color:var(--ink);background:var(--bg);",
    " border:0;border-left:1px solid var(--line);padding:0;margin:0 0 0 auto;width:min(420px,100vw);height:100dvh;max-height:100dvh;max-width:100vw;",
    " overflow:hidden;transform:translateX(24px);opacity:0;transition:transform .22s ease,opacity .22s ease;color-scheme:dark;-webkit-font-smoothing:antialiased}",
    "dialog.in{transform:none;opacity:1}",
    "dialog::backdrop{background:rgba(8,7,6,.55);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}",
    ".sheet{display:grid;grid-template-rows:auto 1fr;height:100%}",
    ".top{display:flex;align-items:center;gap:10px;padding:14px 14px 12px 18px;border-bottom:1px solid var(--line);padding-top:max(14px,env(safe-area-inset-top))}",
    ".home{flex:1;min-width:0;color:var(--ink);text-decoration:none;display:grid;gap:1px}",
    ".home b{font:italic 400 24px/1.1 'Instrument Serif',ui-serif,Georgia,serif;letter-spacing:-.01em}",
    ".home span{font-size:12.5px;color:var(--accent)}",
    ".home:hover b{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px}",
    "button,a{font:inherit;-webkit-tap-highlight-color:transparent}",
    ".x{width:44px;height:44px;border-radius:50%;border:1px solid var(--line);background:none;color:var(--ink);cursor:pointer;font-size:20px;line-height:1;flex:none}",
    ".x:hover{background:var(--card)}",
    ".scroll{overflow-y:auto;overscroll-behavior:contain;padding:16px 14px max(20px,env(safe-area-inset-bottom)) 14px;display:grid;gap:18px;align-content:start}",
    ".now{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px;display:grid;gap:8px}",
    ".k{font:500 11px/1.2 ui-monospace,'IBM Plex Mono',Consolas,monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:0}",
    ".now h2{margin:0;font-size:19px;font-weight:600;letter-spacing:-.01em}",
    ".now p{margin:0;color:var(--muted);font-size:13.5px}",
    ".notes{margin:2px 0 0;padding:0;list-style:none;display:grid;gap:5px;font-size:13.5px}",
    ".notes li{display:grid;grid-template-columns:18px 1fr;gap:4px}",
    ".notes li::before{content:'✓';color:#8fd6a8}",
    ".notes li.open{color:var(--muted)}",
    ".notes li.open::before{content:'○';color:var(--accent)}",
    ".step{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
    ".step a{display:grid;gap:1px;padding:10px 12px;min-height:44px;border:1px solid var(--line);border-radius:12px;color:var(--ink);text-decoration:none;min-width:0}",
    ".step a:hover{border-color:var(--muted)}",
    ".step a:last-child{text-align:right}",
    ".step small{color:var(--muted);font-size:12px}",
    ".step span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500}",
    ".list{display:grid;gap:2px;margin:0;padding:0;list-style:none}",
    ".row{display:grid;grid-template-columns:76px 1fr auto;gap:12px;align-items:center;padding:7px 8px;border-radius:12px;color:var(--ink);text-decoration:none}",
    ".row:hover{background:var(--card)}",
    ".row img{width:76px;height:48px;object-fit:cover;border-radius:7px;display:block;background:#000}",
    ".row b{display:block;font-weight:600;font-size:15px}",
    ".row i{display:block;font-style:normal;color:var(--muted);font-size:13px;line-height:1.35}",
    ".row .m{font-size:12px;color:var(--muted);white-space:nowrap}",
    ".row[aria-current]{background:var(--card);box-shadow:inset 0 0 0 1px var(--line)}",
    ".row[aria-current] .m{color:var(--accent)}",
    ":focus-visible{outline:2px solid var(--accent);outline-offset:2px}",
    "@media (max-width:560px){dialog{margin:auto 0 0;width:100vw;height:auto;max-height:88dvh;border-left:0;border-top:1px solid var(--line);border-radius:18px 18px 0 0;transform:translateY(24px)}.sheet{max-height:88dvh}.top{padding-top:14px}}",
    "@media (prefers-reduced-motion:reduce){dialog{transition:none}}"
  ].join("\n");

  var host, dlg;
  function build() {
    host = el("div");
    host.id = "workshop-shell";
    var root = host.attachShadow({ mode: "open" });
    root.appendChild(el("style", null, CSS));
    dlg = el("dialog");
    dlg.setAttribute("aria-label", "Claude's Workshop: all pieces");
    var sheet = el("div", "sheet");

    var top = el("div", "top");
    var home = el("a", "home");
    home.href = base;
    home.appendChild(el("b", null, "Claude’s Workshop"));
    home.appendChild(el("span", null, "← Back to the front page"));
    var x = el("button", "x", "×");
    x.type = "button";
    x.setAttribute("aria-label", "Close");
    x.addEventListener("click", close);
    top.appendChild(home); top.appendChild(x);

    var scroll = el("div", "scroll");
    if (at >= 0) {
      var p = pieces[at];
      var now = el("section", "now");
      now.appendChild(el("p", "k", "You are in"));
      now.appendChild(el("h2", null, p.title));
      now.appendChild(el("p", null, p.maker + " · " + day(p.added)));
      var notes = el("ul", "notes");
      (p.checked || []).forEach(function (t) { notes.appendChild(el("li", null, t)); });
      (p.open || []).forEach(function (t) { notes.appendChild(el("li", "open", "Not verified: " + t)); });
      if (notes.children.length) now.appendChild(notes);
      scroll.appendChild(now);

      var step = el("nav", "step");
      step.setAttribute("aria-label", "Neighbouring pieces");
      [[-1, "← Earlier"], [1, "Later →"]].forEach(function (d) {
        var q = pieces[(at + d[0] + pieces.length) % pieces.length];
        var a = el("a");
        a.href = base + q.id + "/";
        a.appendChild(el("small", null, d[1]));
        a.appendChild(el("span", null, q.title));
        step.appendChild(a);
      });
      scroll.appendChild(step);
    }

    var wrap = el("section");
    wrap.appendChild(el("p", "k", pieces.length + " pieces, newest first"));
    var list = el("ul", "list");
    list.style.marginTop = "8px";
    for (var j = pieces.length - 1; j >= 0; j--) {
      var q = pieces[j];
      var li = el("li");
      var a = el("a", "row");
      a.href = base + q.id + "/";
      var img = el("img");
      img.src = base + "art/" + q.id + ".svg";
      img.alt = "";
      img.loading = "lazy";
      img.width = 76; img.height = 48;
      var mid = el("span");
      mid.appendChild(el("b", null, q.title));
      mid.appendChild(el("i", null, q.line));
      var m = el("span", "m", j === at ? "here" : (seen[q.id] ? "opened" : ""));
      if (j === at) a.setAttribute("aria-current", "page");
      a.appendChild(img); a.appendChild(mid); a.appendChild(m);
      li.appendChild(a); list.appendChild(li);
    }
    wrap.appendChild(list);
    scroll.appendChild(wrap);

    sheet.appendChild(top); sheet.appendChild(scroll);
    dlg.appendChild(sheet);
    root.appendChild(dlg);

    dlg.addEventListener("click", function (ev) { if (ev.target === dlg) close(); });   // the backdrop
    dlg.addEventListener("close", function () { dlg.classList.remove("in"); });
    // Pieces listen for keys and pointers on window (Space fires a shot, a drag aims). Keep ours to ourselves.
    ["keydown", "keyup", "keypress", "pointerdown", "pointermove", "pointerup", "mousedown", "mouseup", "touchstart", "touchmove", "touchend", "wheel", "click"]
      .forEach(function (t) { host.addEventListener(t, function (ev) { ev.stopPropagation(); }); });
    document.body.appendChild(host);
  }

  function open() {
    if (!host) build();
    if (dlg.open) return;
    dlg.showModal();
    requestAnimationFrame(function () { dlg.classList.add("in"); });
    dlg.querySelector(".scroll").scrollTop = 0;
  }
  function close() { if (dlg && dlg.open) dlg.close(); }

  // Any link that points at the workshop's root opens the switcher instead. A modified click (new tab) and
  // a click with no JavaScript both still go home.
  document.addEventListener("click", function (ev) {
    if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    var a = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
    if (!a || a.target === "_blank" || a.href.split(/[?#]/)[0] !== base) return;
    ev.preventDefault();
    open();
  });
  var links = document.querySelectorAll("a[href]");
  for (var k = 0; k < links.length; k++) {
    if (links[k].href.split(/[?#]/)[0] === base) links[k].setAttribute("aria-haspopup", "dialog");
  }

  window.WorkshopShell = { open: open, close: close };
})();
