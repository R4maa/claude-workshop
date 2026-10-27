// Runs the heavy jobs off the main thread so pages stay responsive.
// In:  { id, level }            → solve a level: progress { id, type: "progress", done, wins }, then { id, type: "result", result }
//      { id, daily: "YYYY-MM-DD" } → build that day's level: progress { id, type: "progress", attempt }, then { id, type: "daily", daily }
importScripts("core.js?v=7");

onmessage = (e) => {
  const { id, level, daily } = e.data;
  try {
    if (daily) {
      const out = generateDaily(daily, { onTry: (attempt) => postMessage({ id, type: "progress", attempt }) });
      postMessage({ id, type: "daily", daily: out });
      return;
    }
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
