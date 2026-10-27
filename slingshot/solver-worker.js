// Runs the launch-grid solver off the main thread so the editor stays responsive.
// In:  { id, level }   Out: { id, type: "progress", done, wins } … then { id, type: "result", result }
importScripts("core.js?v=2");

onmessage = (e) => {
  const { id, level } = e.data;
  try {
    let last = 0;
    const result = solve(level, {
      onRow: (done, wins) => {
        if (done - last >= 0.02) { last = done; postMessage({ id, type: "progress", done, wins }); }
      },
    });
    postMessage({ id, type: "result", result });
  } catch (err) {
    postMessage({ id, type: "error", message: String(err && err.message || err) });
  }
};
